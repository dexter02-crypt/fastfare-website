import express from 'express';
import Shipment from '../models/Shipment.js';
import { protect } from '../middleware/auth.js';
import { fireWebhook } from '../services/webhookService.js';
import jwt from 'jsonwebtoken';

const router = express.Router();

// Calculate shipping cost
const calculateShippingCost = (shipment) => {
    const baseRate = 50;
    const weightRate = 20; // per kg
    const expressMultiplier = shipment.serviceType === 'express' ? 1.5 :
        shipment.serviceType === 'overnight' ? 2 : 1;

    const weight = shipment.packages?.reduce((sum, pkg) => sum + (pkg.weight * pkg.quantity), 0) || 0.5;
    const insuranceCost = shipment.insurance ? 50 : 0;
    const fragileCost = shipment.fragileHandling ? 30 : 0;

    return Math.round((baseRate + (weight * weightRate)) * expressMultiplier + insuranceCost + fragileCost);
};

// Create shipment (POST /api/shipments/)
router.post('/', protect, async (req, res) => {
    try {
        const { pickup, delivery, packages, contentType, description, paymentMode, codAmount,
            serviceType, carrier, carrierId, insurance, fragileHandling, signatureRequired,
            scheduledPickup, pickupDate, pickupSlot } = req.body;

        const shipmentData = {
            user: req.user._id,
            pickup,
            delivery,
            packages,
            contentType,
            description,
            paymentMode,
            codAmount: paymentMode === 'cod' ? codAmount : 0,
            serviceType,
            carrier,
            carrierId: carrierId || null,
            insurance,
            fragileHandling,
            signatureRequired,
            scheduledPickup,
            pickupDate,
            pickupSlot,
            status: carrierId ? 'pending_acceptance' : 'pending',
            trackingHistory: [{
                status: carrierId ? 'pending_acceptance' : 'pending',
                location: pickup.city || 'Origin',
                description: carrierId ? 'Shipment assigned to carrier — awaiting acceptance' : 'Shipment created'
            }]
        };

        const shipment = await Shipment.create(shipmentData);
        shipment.shippingCost = calculateShippingCost(shipment);

        // Auto promo discount engine: D = T − 500, F = 500
        const baseFare = shipment.shippingCost;
        const pFee = Math.round(baseFare * 0.20 * 100) / 100;
        const comm = Math.round(baseFare * 0.16 * 100) / 100;
        const fixedFee = 120;
        const gross = Math.round((baseFare + pFee + comm + fixedFee) * 100) / 100;
        shipment.platformFee = pFee;
        shipment.grossTotal = gross;
        if (gross > 500) {
            shipment.promoDiscount = Math.round((gross - 500) * 100) / 100;
            shipment.finalPayable = 500;
            shipment.promoType = 'AUTO_APPLIED';
        } else {
            shipment.promoDiscount = 0;
            shipment.finalPayable = gross;
            shipment.promoType = 'NONE';
        }

        const days = serviceType === 'overnight' ? 1 : serviceType === 'express' ? 3 : 7;
        shipment.estimatedDelivery = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
        await shipment.save();

        // Fire webhook to carrier if assigned
        if (carrierId) {
            fireWebhook(carrierId, 'shipment.assigned', shipment).catch(err => {
                console.error('Webhook fire error:', err);
            });

            // Real-time Socket.IO push to carrier dashboard
            const io = req.app.get('io');
            if (io) {
                io.to(`carrier_${carrierId}`).emit('new_shipment', {
                    shipmentId: shipment._id,
                    awb: shipment.awb,
                    pickup: shipment.pickup,
                    delivery: shipment.delivery,
                    serviceType: shipment.serviceType,
                    shippingCost: shipment.shippingCost,
                    createdAt: shipment.createdAt
                });
            }
        }

        res.status(201).json({
            success: true,
            shipment
        });
    } catch (error) {
        console.error('Create shipment error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Also accept POST /api/shipments/create (alias for frontend compatibility)
router.post('/create', protect, async (req, res) => {
    try {
        const { pickup, delivery, packages, contentType, description, paymentMode, codAmount,
            serviceType, carrier, carrierId, insurance, fragileHandling, signatureRequired,
            scheduledPickup, pickupDate, pickupSlot } = req.body;

        const shipmentData = {
            user: req.user._id,
            pickup,
            delivery,
            packages,
            contentType,
            description,
            paymentMode,
            codAmount: paymentMode === 'cod' ? codAmount : 0,
            serviceType,
            carrier,
            carrierId: carrierId || null,
            insurance,
            fragileHandling,
            signatureRequired,
            scheduledPickup,
            pickupDate,
            pickupSlot,
            status: carrierId ? 'pending_acceptance' : 'pending',
            trackingHistory: [{
                status: carrierId ? 'pending_acceptance' : 'pending',
                location: pickup.city || 'Origin',
                description: carrierId ? 'Shipment assigned to carrier — awaiting acceptance' : 'Shipment created'
            }]
        };

        const shipment = await Shipment.create(shipmentData);
        shipment.shippingCost = calculateShippingCost(shipment);

        const days = serviceType === 'overnight' ? 1 : serviceType === 'express' ? 3 : 7;
        shipment.estimatedDelivery = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
        await shipment.save();

        if (carrierId) {
            fireWebhook(carrierId, 'shipment.assigned', shipment).catch(err => {
                console.error('Webhook fire error:', err);
            });

            // Real-time Socket.IO push to carrier dashboard
            const io = req.app.get('io');
            if (io) {
                io.to(`carrier_${carrierId}`).emit('new_shipment', {
                    shipmentId: shipment._id,
                    awb: shipment.awb,
                    pickup: shipment.pickup,
                    delivery: shipment.delivery,
                    serviceType: shipment.serviceType,
                    shippingCost: shipment.shippingCost,
                    createdAt: shipment.createdAt
                });
            }
        }

        res.status(201).json({
            success: true,
            shipment
        });
    } catch (error) {
        console.error('Create shipment error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Get all shipments for user
router.get('/', protect, async (req, res) => {
    try {
        const { status, page = 1, limit = 10, search } = req.query;

        const query = { user: req.user._id };
        if (status && status !== 'all') {
            query.status = status;
        }
        if (search) {
            query.$or = [
                { awb: { $regex: search, $options: 'i' } },
                { 'delivery.name': { $regex: search, $options: 'i' } },
                { 'delivery.city': { $regex: search, $options: 'i' } }
            ];
        }

        const shipments = await Shipment.find(query)
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(parseInt(limit));

        const total = await Shipment.countDocuments(query);

        res.json({
            success: true,
            shipments,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ─── NAMED ROUTES MUST come BEFORE /:id to avoid being caught by the wildcard ───

// Get dashboard stats
router.get('/stats/dashboard', protect, async (req, res) => {
    try {
        const userId = req.user._id;

        const [total, pending, inTransit, delivered] = await Promise.all([
            Shipment.countDocuments({ user: userId }),
            Shipment.countDocuments({ user: userId, status: { $in: ['pending', 'pickup_scheduled'] } }),
            Shipment.countDocuments({ user: userId, status: { $in: ['picked_up', 'in_transit', 'out_for_delivery'] } }),
            Shipment.countDocuments({ user: userId, status: 'delivered' })
        ]);

        const recentShipments = await Shipment.find({ user: userId })
            .sort({ createdAt: -1 })
            .limit(5)
            .select('awb status delivery.name delivery.city createdAt estimatedDelivery');

        res.json({
            success: true,
            stats: {
                total,
                pending,
                inTransit,
                delivered
            },
            recentShipments
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get user's orders with driver info and live positions
router.get('/my-orders', protect, async (req, res) => {
    try {
        const { status, search } = req.query;
        const query = { user: req.user._id };

        if (status && status !== 'all') {
            query.status = status;
        }
        if (search) {
            query.$or = [
                { awb: { $regex: search, $options: 'i' } },
                { 'delivery.name': { $regex: search, $options: 'i' } },
                { 'delivery.city': { $regex: search, $options: 'i' } }
            ];
        }

        const shipments = await Shipment.find(query)
            .sort({ createdAt: -1 })
            .lean();

        // Get live driver positions
        const { getDriverPositions } = await import('../socket/location.socket.js');
        const positions = getDriverPositions();

        // Enrich each shipment with live driver location
        const enriched = shipments.map(s => {
            let driverLocation = null;
            if (s.assignedDriver) {
                const pos = positions.find(p => p.driverId === s.assignedDriver);
                if (pos) {
                    driverLocation = {
                        lat: pos.lat,
                        lng: pos.lng,
                        driverName: pos.driverName || s.assignedDriverName || s.assignedDriver,
                        online: pos.online !== false,
                        timestamp: pos.timestamp
                    };
                }
            }
            return {
                id: s._id,
                awb: s.awb,
                status: s.status,
                pickup: s.pickup,
                delivery: s.delivery,
                packages: s.packages,
                contentType: s.contentType,
                serviceType: s.serviceType,
                paymentMode: s.paymentMode,
                codAmount: s.codAmount,
                totalWeight: s.totalWeight,
                shippingCost: s.shippingCost,
                estimatedDelivery: s.estimatedDelivery,
                actualDelivery: s.actualDelivery,
                trackingHistory: s.trackingHistory,
                assignedDriver: s.assignedDriver,
                assignedDriverName: s.assignedDriverName,
                assignedVehicle: s.assignedVehicle,
                driverLocation,
                createdAt: s.createdAt
            };
        });

        res.json({ success: true, orders: enriched });
    } catch (error) {
        console.error('My orders error:', error);
        res.status(500).json({ error: error.message });
    }
});

// ─── PARAMETERIZED ROUTES (/:id) come LAST ───

// Get single shipment
router.get('/:id', protect, async (req, res) => {
    try {
        const shipment = await Shipment.findOne({
            _id: req.params.id,
            user: req.user._id
        });

        if (!shipment) {
            return res.status(404).json({ error: 'Shipment not found' });
        }

        res.json({ success: true, shipment });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Update shipment
router.put('/:id', protect, async (req, res) => {
    try {
        const shipment = await Shipment.findOne({
            _id: req.params.id,
            user: req.user._id
        });

        if (!shipment) {
            return res.status(404).json({ error: 'Shipment not found' });
        }

        // Only allow updates if not yet picked up
        if (!['pending', 'pickup_scheduled'].includes(shipment.status)) {
            return res.status(400).json({ error: 'Cannot update shipment after pickup' });
        }

        const updates = req.body;
        Object.keys(updates).forEach(key => {
            if (key !== '_id' && key !== 'user' && key !== 'awb') {
                shipment[key] = updates[key];
            }
        });

        await shipment.save();
        res.json({ success: true, shipment });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Cancel shipment
router.post('/:id/cancel', protect, async (req, res) => {
    try {
        const shipment = await Shipment.findOne({
            _id: req.params.id,
            user: req.user._id
        });

        if (!shipment) {
            return res.status(404).json({ error: 'Shipment not found' });
        }

        if (!['pending', 'pending_acceptance', 'pickup_scheduled'].includes(shipment.status)) {
            return res.status(400).json({ error: 'Cannot cancel shipment after pickup' });
        }

        shipment.status = 'cancelled';
        shipment.trackingHistory.push({
            status: 'cancelled',
            description: 'Shipment cancelled by user'
        });

        await shipment.save();
        res.json({ success: true, message: 'Shipment cancelled' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ══════════════════════════════════════════════════════════════
// CARRIER-SIDE ENDPOINTS (Now Shipment Partner Incoming Orders)
// ══════════════════════════════════════════════════════════════

// Middleware: ensure user is a shipment partner
const requirePartner = (req, res, next) => {
    if (req.user && (req.user.role === 'shipment_partner' || req.user.role === 'admin')) {
        next();
    } else {
        res.status(403).json({ success: false, message: 'Partner access required' });
    }
};

// GET /api/shipments/carrier/incoming — list pending shipments for carrier
router.get('/carrier/incoming', protect, requirePartner, async (req, res) => {
    try {
        const { status } = req.query;
        const query = { carrierId: req.user._id };

        if (status) {
            // Support comma-separated statuses: ?status=accepted,pickup_scheduled,picked_up
            const statuses = status.split(',').map(s => s.trim()).filter(Boolean);
            query.status = statuses.length > 1 ? { $in: statuses } : statuses[0];
        } else {
            query.status = { $in: ['pending_acceptance', 'accepted', 'pickup_scheduled', 'picked_up', 'in_transit', 'out_for_delivery'] };
        }

        const shipments = await Shipment.find(query)
            .sort({ createdAt: -1 })
            .lean();

        res.json({ success: true, shipments });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// GET /api/shipments/carrier/stats — carrier dashboard stats
router.get('/carrier/stats', protect, requirePartner, async (req, res) => {
    try {
        const cid = req.user._id;
        const [pending, accepted, inTransit, delivered, total] = await Promise.all([
            Shipment.countDocuments({ carrierId: cid, status: 'pending_acceptance' }),
            Shipment.countDocuments({ carrierId: cid, status: { $in: ['accepted', 'pickup_scheduled', 'picked_up'] } }),
            Shipment.countDocuments({ carrierId: cid, status: { $in: ['in_transit', 'out_for_delivery'] } }),
            Shipment.countDocuments({ carrierId: cid, status: 'delivered' }),
            Shipment.countDocuments({ carrierId: cid })
        ]);

        res.json({
            success: true,
            stats: { pending, accepted, inTransit, delivered, total }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// PUT /api/shipments/carrier/:id/accept — carrier accepts shipment
router.put('/carrier/:id/accept', protect, requirePartner, async (req, res) => {
    try {
        const shipment = await Shipment.findOne({
            _id: req.params.id,
            carrierId: req.user._id,
            status: 'pending_acceptance'
        });

        if (!shipment) {
            return res.status(404).json({ success: false, message: 'Shipment not found or already processed' });
        }

        shipment.status = 'accepted';
        shipment.trackingHistory.push({
            status: 'accepted',
            description: 'Carrier accepted the shipment'
        });
        await shipment.save();

        res.json({ success: true, message: 'Shipment accepted', shipment });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// PUT /api/shipments/carrier/:id/reject — carrier rejects shipment
router.put('/carrier/:id/reject', protect, requirePartner, async (req, res) => {
    try {
        const shipment = await Shipment.findOne({
            _id: req.params.id,
            carrierId: req.user._id,
            status: 'pending_acceptance'
        });

        if (!shipment) {
            return res.status(404).json({ success: false, message: 'Shipment not found or already processed' });
        }

        shipment.status = 'rejected_by_carrier';
        shipment.trackingHistory.push({
            status: 'rejected_by_carrier',
            description: `Carrier rejected: ${req.body.reason || 'No reason provided'}`
        });
        await shipment.save();

        res.json({ success: true, message: 'Shipment rejected', shipment });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// PUT /api/shipments/carrier/:id/update-status — carrier updates shipment status through lifecycle
router.put('/carrier/:id/update-status', protect, requirePartner, async (req, res) => {
    try {
        const { status, location, description } = req.body;

        if (!status) {
            return res.status(400).json({ success: false, message: 'status field is required' });
        }

        const allowedStatuses = ['pickup_scheduled', 'picked_up', 'in_transit', 'out_for_delivery', 'delivered'];
        if (!allowedStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                message: `Invalid status. Allowed: ${allowedStatuses.join(', ')}`
            });
        }

        const shipment = await Shipment.findOne({
            _id: req.params.id,
            carrierId: req.user._id
        });

        if (!shipment) {
            return res.status(404).json({ success: false, message: 'Shipment not found' });
        }

        // Prevent backward transitions
        const statusOrder = [
            'pending', 'pending_acceptance', 'accepted', 'pickup_scheduled',
            'picked_up', 'in_transit', 'out_for_delivery', 'delivered'
        ];
        const currentIdx = statusOrder.indexOf(shipment.status);
        const newIdx = statusOrder.indexOf(status);

        if (newIdx <= currentIdx) {
            return res.status(400).json({
                success: false,
                message: `Cannot transition from '${shipment.status}' to '${status}'`
            });
        }

        shipment.status = status;

        // Store scheduling details when pickup is scheduled
        if (status === 'pickup_scheduled') {
            const { pickupDate, pickupSlot, vehicleType, driverName, driverPhone, instructions } = req.body;
            if (pickupDate) shipment.pickupDate = new Date(pickupDate);
            if (pickupSlot) shipment.pickupSlot = pickupSlot;
            if (vehicleType) shipment.assignedVehicle = vehicleType;
            if (driverName) shipment.assignedDriverName = driverName;
            if (driverPhone) shipment.assignedDriver = driverPhone;
            shipment.scheduledPickup = true;
        }

        const schedulingInfo = status === 'pickup_scheduled' && req.body.pickupDate
            ? ` — ${new Date(req.body.pickupDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} ${req.body.pickupSlot || ''}`
            : '';

        shipment.trackingHistory.push({
            status,
            location: location || '',
            description: description || `Status updated to ${status}${schedulingInfo}`,
            timestamp: new Date()
        });

        if (status === 'delivered') {
            shipment.actualDelivery = new Date();
        }

        await shipment.save();

        // Broadcast via Socket.IO
        const io = req.app.get('io');
        if (io) {
            io.to(`partner_${req.user._id}`).emit('shipment_status_updated', {
                shipmentId: shipment._id,
                awb: shipment.awb,
                status,
                timestamp: new Date()
            });
            io.emit('shipment_update', {
                shipmentId: shipment._id,
                awb: shipment.awb,
                status,
                timestamp: new Date()
            });
        }

        // Fire webhook for status change
        fireWebhook(req.user._id, `shipment.${status}`, shipment).catch(err => {
            console.error('Status webhook error:', err);
        });

        res.json({ success: true, message: `Shipment updated to '${status}'`, shipment });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

export default router;
