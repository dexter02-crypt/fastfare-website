import express from 'express';
import Carrier from '../models/Carrier.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// ─── GET /api/carriers/active ─── Public: list approved carriers for the dropdown
router.get('/active', async (req, res) => {
    try {
        const carriers = await Carrier.find({ status: 'approved', isActive: true })
            .select('businessName contactPerson rating baseFare perKgRate eta features supportedTypes serviceZones')
            .sort({ rating: -1 })
            .lean();

        res.json({ success: true, carriers });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// ─── GET /api/carriers/check-serviceability ─── Filter by pickup/delivery pincode
router.get('/check-serviceability', async (req, res) => {
    try {
        const { pickup, delivery, serviceType } = req.query;

        let query = { status: 'approved', isActive: true };
        if (serviceType) {
            query.supportedTypes = serviceType;
        }

        let carriers = await Carrier.find(query)
            .select('businessName contactPerson rating baseFare perKgRate eta features supportedTypes serviceZones')
            .sort({ rating: -1 })
            .lean();

        // Filter by serviceability (pincode match)
        if (pickup || delivery) {
            carriers = carriers.filter(carrier => {
                if (!carrier.serviceZones || carrier.serviceZones.length === 0) return true; // no zones = serves all
                return carrier.serviceZones.some(zone => {
                    if (!zone.pincodes || zone.pincodes.length === 0) return true;
                    return zone.pincodes.some(pin => {
                        if (pin.includes('-')) {
                            const [start, end] = pin.split('-').map(Number);
                            const pickupNum = parseInt(pickup);
                            const deliveryNum = parseInt(delivery);
                            return (!pickup || (pickupNum >= start && pickupNum <= end)) &&
                                (!delivery || (deliveryNum >= start && deliveryNum <= end));
                        }
                        return pin === pickup || pin === delivery;
                    });
                });
            });
        }

        res.json({ success: true, carriers });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// ─── GET /api/carriers/ ─── Admin: list all carriers
router.get('/', protect, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ success: false, message: 'Admin access required' });
        }

        const { status } = req.query;
        const query = status ? { status } : {};

        const carriers = await Carrier.find(query)
            .select('-password')
            .sort({ createdAt: -1 })
            .lean();

        res.json({ success: true, carriers });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// ─── PUT /api/carriers/:id/approve ─── Admin: approve carrier
router.put('/:id/approve', protect, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ success: false, message: 'Admin access required' });
        }

        const carrier = await Carrier.findById(req.params.id);
        if (!carrier) {
            return res.status(404).json({ success: false, message: 'Carrier not found' });
        }

        carrier.status = 'approved';
        carrier.isActive = true;
        carrier.approvedAt = new Date();
        carrier.approvedBy = req.user._id;
        carrier.rejectionReason = undefined;
        await carrier.save();

        res.json({
            success: true,
            message: `${carrier.businessName} has been approved`,
            carrier: { id: carrier._id, businessName: carrier.businessName, status: carrier.status }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// ─── PUT /api/carriers/:id/reject ─── Admin: reject carrier
router.put('/:id/reject', protect, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ success: false, message: 'Admin access required' });
        }

        const carrier = await Carrier.findById(req.params.id);
        if (!carrier) {
            return res.status(404).json({ success: false, message: 'Carrier not found' });
        }

        carrier.status = 'rejected';
        carrier.rejectionReason = req.body.reason || 'Application did not meet requirements';
        await carrier.save();

        res.json({
            success: true,
            message: `${carrier.businessName} has been rejected`,
            carrier: { id: carrier._id, businessName: carrier.businessName, status: carrier.status }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// ─── PUT /api/carriers/:id/suspend ─── Admin: suspend carrier
router.put('/:id/suspend', protect, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ success: false, message: 'Admin access required' });
        }

        const carrier = await Carrier.findById(req.params.id);
        if (!carrier) {
            return res.status(404).json({ success: false, message: 'Carrier not found' });
        }

        carrier.status = 'suspended';
        carrier.isActive = false;
        await carrier.save();

        res.json({
            success: true,
            message: `${carrier.businessName} has been suspended`
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

export default router;
