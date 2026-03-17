import express from 'express';
import Shipment from '../models/Shipment.js';
import ReversePickup from '../models/ReversePickup.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// GET /api/returns/rto
router.get('/rto', protect, async (req, res) => {
    try {
        const _user = req.user._id;
        const shipments = await Shipment.find({
            user: _user,
            rto_triggered_at: { $ne: null }
        }).sort({ rto_triggered_at: -1 }).lean();

        // Calculate stats
        const totalRTO = shipments.length;
        const rtoChargeBilled = shipments.reduce((sum, s) => sum + (s.rtoCharges || s.rto_charge || 0), 0);
        const codLost = shipments.reduce((sum, s) => sum + (s.paymentMode === 'cod' ? (s.codAmount || 0) : 0), 0);

        const reversePickupsCount = await ReversePickup.countDocuments({ user_id: _user });

        res.json({
            success: true,
            stats: {
                totalRTO,
                rtoChargeBilled,
                codLost,
                reversePickupsCount
            },
            shipments
        });
    } catch (error) {
        console.error('Fetch RTO error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// POST /api/returns/reverse-pickup
router.post('/reverse-pickup', protect, async (req, res) => {
    try {
        const { shipment_id, pickup_address, contact_name, contact_phone, package_description } = req.body;

        if (!shipment_id || !pickup_address || !contact_name || !contact_phone) {
            return res.status(400).json({ success: false, error: 'Missing required fields' });
        }

        const rp = await ReversePickup.create({
            user_id: req.user._id,
            shipment_id,
            pickup_address,
            contact_name,
            contact_phone,
            package_description
        });

        res.json({ success: true, reverse_pickup: rp });
    } catch (error) {
        console.error('Create Reverse Pickup error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

export default router;
