import express from 'express';
import WeightAnomaly from '../models/WeightAnomaly.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// GET /api/weight-disputes
router.get('/', protect, async (req, res) => {
    try {
        const _user = req.user._id;

        // Auto-expiry logic on fetch
        const now = new Date();
        await WeightAnomaly.updateMany({
            user_id: _user,
            status: 'Open',
            dispute_deadline: { $lt: now }
        }, {
            $set: { status: 'Confirmed Anomaly' }
        });

        const anomalies = await WeightAnomaly.find({ user_id: _user })
            .populate('shipment_id', 'awb createdAt delivery.name delivery.city paymentMode shippingCost serviceType')
            .sort({ created_at: -1 }).lean();

        // Calculate stats
        let openCount = 0;
        let resolvedCount = 0;
        let confirmedCount = 0;
        let totalRefunded = 0;
        let totalExtraCharged = 0;

        let nearestExpiry = null;

        anomalies.forEach(a => {
            if (a.status === 'Open') {
                openCount++;
                if (!nearestExpiry || new Date(a.dispute_deadline) < new Date(nearestExpiry)) {
                    nearestExpiry = a.dispute_deadline;
                }
            } else if (a.status === 'Resolved — Refunded') {
                resolvedCount++;
                totalRefunded += (a.refund_amount || a.extra_billed || 0);
            } else if (a.status === 'Confirmed Anomaly') {
                confirmedCount++;
                totalExtraCharged += (a.extra_billed || 0);
            }
        });

        res.json({
            success: true,
            stats: {
                openCount,
                resolvedCount,
                confirmedCount,
                totalRefunded,
                totalExtraCharged,
                nearestExpiry
            },
            anomalies
        });
    } catch (error) {
        console.error('Fetch weight disputes error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// POST /api/weight-disputes/:id/dispute
router.post('/:id/dispute', protect, async (req, res) => {
    try {
        const { dispute_reason } = req.body;

        if (!dispute_reason || dispute_reason.length < 20) {
            return res.status(400).json({ success: false, error: 'Dispute reason must be at least 20 characters' });
        }

        const anomaly = await WeightAnomaly.findOne({
            _id: req.params.id,
            user_id: req.user._id,
            status: 'Open'
        });

        if (!anomaly) {
            return res.status(404).json({ success: false, error: 'Anomaly not found or not in Open state' });
        }

        // Check deadline
        if (new Date() > new Date(anomaly.dispute_deadline)) {
            anomaly.status = 'Confirmed Anomaly';
            await anomaly.save();
            return res.status(400).json({ success: false, error: 'Dispute window expired' });
        }

        anomaly.status = 'Disputed';
        anomaly.dispute_reason = dispute_reason;
        anomaly.disputed_at = new Date();
        await anomaly.save();

        res.json({ success: true, message: 'Dispute raised successfully', anomaly });
    } catch (error) {
        console.error('Raise dispute error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

export default router;
