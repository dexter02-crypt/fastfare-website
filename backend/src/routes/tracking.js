import express from 'express';
import Shipment from '../models/Shipment.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// Public tracking by AWB
router.get('/:awb', async (req, res) => {
    try {
        const shipment = await Shipment.findOne({ awb: req.params.awb.toUpperCase() })
            .select('awb status pickup delivery estimatedDelivery actualDelivery trackingHistory createdAt serviceType carrier');

        if (!shipment) {
            return res.status(404).json({ success: false, error: 'Shipment not found' });
        }

        res.json({
            success: true,
            tracking: {
                awb: shipment.awb,
                status: shipment.status,
                origin: shipment.pickup?.city || 'Origin',
                destination: shipment.delivery?.city || 'Destination',
                recipientName: shipment.delivery?.name,
                senderName: shipment.pickup?.name,
                pickup: {
                    name: shipment.pickup?.name,
                    phone: shipment.pickup?.phone,
                    address: shipment.pickup?.address,
                    city: shipment.pickup?.city,
                    state: shipment.pickup?.state,
                    pincode: shipment.pickup?.pincode,
                },
                delivery: {
                    name: shipment.delivery?.name,
                    phone: shipment.delivery?.phone,
                    address: shipment.delivery?.address,
                    city: shipment.delivery?.city,
                    state: shipment.delivery?.state,
                    pincode: shipment.delivery?.pincode,
                },
                estimatedDelivery: shipment.estimatedDelivery,
                actualDelivery: shipment.actualDelivery,
                serviceType: shipment.serviceType,
                carrier: shipment.carrier || 'FastFare',
                createdAt: shipment.createdAt,
                history: (shipment.trackingHistory || []).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Update tracking (internal/admin use)
router.post('/:awb/update', protect, async (req, res) => {
    try {
        const { status, location, description } = req.body;

        const shipment = await Shipment.findOne({ awb: req.params.awb.toUpperCase() });

        if (!shipment) {
            return res.status(404).json({ error: 'Shipment not found' });
        }

        shipment.status = status;
        shipment.trackingHistory.push({
            status,
            location,
            description,
            timestamp: new Date()
        });

        if (status === 'delivered') {
            shipment.actualDelivery = new Date();
        }

        await shipment.save();

        res.json({ success: true, message: 'Tracking updated' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get proof of delivery
router.get('/:awb/pod', async (req, res) => {
    try {
        const shipment = await Shipment.findOne({
            awb: req.params.awb.toUpperCase(),
            status: 'delivered'
        }).select('awb delivery actualDelivery trackingHistory');

        if (!shipment) {
            return res.status(404).json({ error: 'Delivery not found or not yet delivered' });
        }

        const deliveryEvent = shipment.trackingHistory.find(h => h.status === 'delivered');

        res.json({
            success: true,
            pod: {
                awb: shipment.awb,
                deliveredTo: shipment.delivery?.name,
                deliveredAt: shipment.actualDelivery,
                address: `${shipment.delivery?.address}, ${shipment.delivery?.city}, ${shipment.delivery?.state} - ${shipment.delivery?.pincode}`,
                description: deliveryEvent?.description || 'Delivered successfully'
            }
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

export default router;
