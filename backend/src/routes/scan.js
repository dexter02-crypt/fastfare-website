import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import QRCode from 'qrcode';
import Shipment from '../models/Shipment.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// ─── POST /api/scan/generate-qr/:shipmentId ─── (Protected)
// Called by frontend before printing label. Generates qr_token idempotently.
router.post('/generate-qr/:shipmentId', protect, async (req, res) => {
    try {
        const shipment = await Shipment.findById(req.params.shipmentId);
        if (!shipment) {
            return res.status(404).json({ error: 'Shipment not found' });
        }

        // Idempotent — only generate if not already set
        if (!shipment.qr_token) {
            shipment.qr_token = uuidv4();
            await shipment.save();
        }

        const baseURL = process.env.FRONTEND_URL || 'https://fastfare.in';
        const pickupUrl = `${baseURL}/pickup/${shipment.qr_token}`;

        // Generate QR code as data URL for embedding in label
        const qrDataURL = await QRCode.toDataURL(
            pickupUrl,
            { width: 120, margin: 1 }
        );

        res.json({
            success: true,
            qr_token: shipment.qr_token,
            pickup_url: pickupUrl,
            qrDataURL
        });
    } catch (error) {
        console.error('Generate QR error:', error);
        res.status(500).json({ error: error.message });
    }
});


// ─── GET /api/scan/:qr_token ─── (Public — NO auth)
// Called when partner opens the pickup page after scanning QR
router.get('/:qr_token', async (req, res) => {
    try {
        const shipment = await Shipment.findOne({ qr_token: req.params.qr_token });

        if (!shipment) {
            return res.status(404).json({ error: 'Invalid or expired label' });
        }

        // Already scanned?
        if (shipment.scan_pickup && shipment.scan_pickup.scanned_at) {
            return res.status(409).json({
                error: 'Already picked up',
                scanned_at: shipment.scan_pickup.scanned_at,
                driver_name: shipment.scan_pickup.driver_name
            });
        }

        // Build response
        const packages = (shipment.packages || []).map(pkg => ({
            name: pkg.name || 'Package',
            qty: pkg.quantity || 1,
            weight_kg: pkg.weight || 0,
            dims: `${pkg.length || 0}x${pkg.width || 0}x${pkg.height || 0}cm`
        }));

        const pickupAddr = shipment.pickup || {};
        const deliveryAddr = shipment.delivery || {};

        res.json({
            shipment_id: shipment._id,
            awb: shipment.awb,
            status: shipment.status,
            pickup: {
                contact_name: pickupAddr.name || '',
                address: `${pickupAddr.address || ''}, ${pickupAddr.city || ''}, ${pickupAddr.state || ''} - ${pickupAddr.pincode || ''}`,
                phone: pickupAddr.phone || ''
            },
            delivery: {
                contact_name: deliveryAddr.name || '',
                address: `${deliveryAddr.address || ''}, ${deliveryAddr.city || ''}, ${deliveryAddr.state || ''} - ${deliveryAddr.pincode || ''}`,
                phone: deliveryAddr.phone || ''
            },
            packages,
            total_weight_kg: shipment.totalWeight || 0,
            content_type: shipment.contentType || '',
            payment_mode: (shipment.paymentMode || 'prepaid').toUpperCase(),
            shipping_cost: shipment.shippingCost || 0,
            carrier: shipment.carrier || 'FastFare',
            service: shipment.serviceType || 'standard',
            expected_delivery: shipment.estimatedDelivery
                ? new Date(shipment.estimatedDelivery).toLocaleDateString('en-IN')
                : 'N/A'
        });
    } catch (error) {
        console.error('Scan lookup error:', error);
        res.status(500).json({ error: error.message });
    }
});


// ─── POST /api/scan/:qr_token/confirm-pickup ─── (Protected — Partner only)
router.post('/:qr_token/confirm-pickup', protect, async (req, res) => {
    try {
        // Must be a shipment_partner
        if (req.user.role !== 'shipment_partner' && req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Only delivery partners can confirm pickup' });
        }

        const shipment = await Shipment.findOne({ qr_token: req.params.qr_token });

        if (!shipment) {
            return res.status(404).json({ error: 'Invalid or expired label' });
        }

        // Already confirmed?
        if (shipment.scan_pickup && shipment.scan_pickup.scanned_at) {
            return res.status(409).json({
                error: 'Already confirmed by another driver',
                scanned_at: shipment.scan_pickup.scanned_at,
                driver_name: shipment.scan_pickup.driver_name
            });
        }

        const { location_lat, location_lng } = req.body;
        const partnerName = req.user.contactPerson || req.user.businessName || req.user.name || 'Partner';
        const partnerPhone = req.user.phone || '';

        // Update scan_pickup
        shipment.scan_pickup = {
            driver_id: req.user._id,
            driver_name: partnerName,
            driver_phone: partnerPhone,
            scanned_at: new Date(),
            location_lat: location_lat || null,
            location_lng: location_lng || null
        };

        // Advance status to in_transit
        shipment.status = 'in_transit';

        // Build location string
        let locationStr = '';
        if (location_lat && location_lng) {
            locationStr = `${location_lat.toFixed(4)}, ${location_lng.toFixed(4)}`;
        }

        // Push tracking event
        shipment.trackingHistory.push({
            status: 'picked_up_by_driver',
            location: locationStr || shipment.pickup?.city || '',
            description: `Package scanned and picked up by ${partnerName}`,
            timestamp: new Date()
        });

        await shipment.save();

        // Build delivery address for Google Maps link
        const del = shipment.delivery || {};
        const deliveryAddress = `${del.address || ''}, ${del.city || ''}, ${del.state || ''} - ${del.pincode || ''}`.trim();
        const googleMapsUrl = `https://maps.google.com/?q=${encodeURIComponent(deliveryAddress)}`;

        // Broadcast via Socket.IO if available
        const io = req.app.get('io');
        if (io) {
            io.emit('shipment_update', {
                shipmentId: shipment._id,
                awb: shipment.awb,
                status: 'in_transit',
                timestamp: new Date()
            });
        }

        res.json({
            success: true,
            message: 'Pickup confirmed',
            awb: shipment.awb,
            delivery_address: deliveryAddress,
            google_maps_url: googleMapsUrl
        });
    } catch (error) {
        console.error('Confirm pickup error:', error);
        res.status(500).json({ error: error.message });
    }
});

export default router;
