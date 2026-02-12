import express from 'express';
import { protect, admin } from '../middleware/auth.js';
import User from '../models/User.js';
import Shipment from '../models/Shipment.js';
import TierEvaluationLog from '../models/TierEvaluationLog.js';
import AdminOverride from '../models/AdminOverride.js';
import SellerStats from '../models/SellerStats.js';

const router = express.Router();

const TIER_CONFIG = {
    bronze: { settlementDays: 7, minOrders: 0, label: 'Bronze' },
    silver: { settlementDays: 5, minOrders: 300, label: 'Silver' },
    gold: { settlementDays: 3, minOrders: 800, label: 'Gold' }
};

// ══════════════════════════════════════════════════
// GET /api/tiers/current
// Current tier info + upgrade progress
// ══════════════════════════════════════════════════
router.get('/current', protect, async (req, res) => {
    try {
        const seller = req.user;
        const tier = seller.tier || 'bronze';
        const config = TIER_CONFIG[tier];

        // Monthly orders count
        const monthStart = new Date();
        monthStart.setDate(1);
        monthStart.setHours(0, 0, 0, 0);

        const monthlyOrders = await Shipment.countDocuments({
            user: seller._id,
            createdAt: { $gte: monthStart }
        });

        const monthlyRto = await Shipment.countDocuments({
            user: seller._id,
            status: 'returned',
            createdAt: { $gte: monthStart }
        });

        const rtoPercent = monthlyOrders > 0 ? Math.round((monthlyRto / monthlyOrders) * 10000) / 100 : 0;

        // Determine next tier
        let nextTier = null;
        let ordersForUpgrade = 0;
        if (tier === 'bronze') {
            nextTier = 'silver';
            ordersForUpgrade = Math.max(0, 300 - monthlyOrders);
        } else if (tier === 'silver') {
            nextTier = 'gold';
            ordersForUpgrade = Math.max(0, 800 - monthlyOrders);
        }

        res.json({
            success: true,
            tier: {
                current: tier,
                label: config.label,
                settlementDays: config.settlementDays,
                tierUpdatedAt: seller.tierUpdatedAt,
                monthlyOrders,
                monthlyRto,
                rtoPercent,
                nextTier,
                ordersForUpgrade,
                benefits: getTierBenefits(tier)
            }
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ══════════════════════════════════════════════════
// POST /api/tiers/evaluate
// Admin: manually run tier evaluation for all sellers
// ══════════════════════════════════════════════════
router.post('/evaluate', protect, admin, async (req, res) => {
    try {
        const { sellerId } = req.body; // Optional: evaluate single seller
        const monthStart = new Date();
        monthStart.setDate(1);
        monthStart.setHours(0, 0, 0, 0);
        const monthEnd = new Date();

        const query = { role: 'user' };
        if (sellerId) query._id = sellerId;

        const sellers = await User.find(query).select('_id tier');
        const results = [];

        for (const seller of sellers) {
            const [monthlyOrders, deliveredOrders, rtoOrders, cancelledOrders] = await Promise.all([
                Shipment.countDocuments({ user: seller._id, createdAt: { $gte: monthStart } }),
                Shipment.countDocuments({ user: seller._id, status: 'delivered', createdAt: { $gte: monthStart } }),
                Shipment.countDocuments({ user: seller._id, status: 'returned', createdAt: { $gte: monthStart } }),
                Shipment.countDocuments({ user: seller._id, status: 'cancelled', createdAt: { $gte: monthStart } })
            ]);

            const rtoPercent = monthlyOrders > 0 ? Math.round((rtoOrders / monthlyOrders) * 10000) / 100 : 0;
            const previousTier = seller.tier || 'bronze';
            let newTier = previousTier;
            let reason = 'No change — thresholds not met';

            // Upgrade logic
            if (monthlyOrders > 800 && rtoPercent <= 15) {
                newTier = 'gold';
                reason = `Upgraded to Gold: ${monthlyOrders} orders (>800) with ${rtoPercent}% RTO (<=15%)`;
            } else if (monthlyOrders > 300 && rtoPercent <= 15) {
                newTier = previousTier === 'gold' ? 'gold' : 'silver';
                if (newTier !== previousTier) {
                    reason = `Upgraded to Silver: ${monthlyOrders} orders (>300) with ${rtoPercent}% RTO (<=15%)`;
                }
            }

            // Downgrade logic (optional)
            if (previousTier === 'gold' && (monthlyOrders < 500 || rtoPercent > 15)) {
                newTier = 'silver';
                reason = `Downgraded from Gold: ${monthlyOrders} orders or ${rtoPercent}% RTO exceeds threshold`;
            } else if (previousTier === 'silver' && (monthlyOrders < 150 || rtoPercent > 20)) {
                newTier = 'bronze';
                reason = `Downgraded from Silver: ${monthlyOrders} orders or ${rtoPercent}% RTO exceeds threshold`;
            }

            // Log evaluation
            await TierEvaluationLog.create({
                sellerId: seller._id,
                evaluationDate: new Date(),
                evaluationPeriod: { start: monthStart, end: monthEnd },
                previousTier,
                newTier,
                monthlyOrders,
                deliveredOrders,
                rtoOrders,
                rtoPercent,
                cancelledOrders,
                reason,
                autoUpgrade: true
            });

            // Update seller tier if changed
            if (newTier !== previousTier) {
                await User.findByIdAndUpdate(seller._id, {
                    tier: newTier,
                    tierUpdatedAt: new Date()
                });

                // Update SellerStats
                await SellerStats.findOneAndUpdate(
                    { sellerId: seller._id },
                    { currentTier: newTier },
                    { upsert: true }
                );
            }

            results.push({
                sellerId: seller._id,
                previousTier,
                newTier,
                changed: newTier !== previousTier,
                monthlyOrders,
                rtoPercent,
                reason
            });
        }

        res.json({
            success: true,
            evaluated: results.length,
            changed: results.filter(r => r.changed).length,
            results
        });
    } catch (error) {
        console.error('Tier evaluation error:', error);
        res.status(500).json({ error: error.message });
    }
});

// ══════════════════════════════════════════════════
// GET /api/tiers/history
// Tier change history for the logged-in seller
// ══════════════════════════════════════════════════
router.get('/history', protect, async (req, res) => {
    try {
        const { page = 1, limit = 20 } = req.query;
        const skip = (parseInt(page) - 1) * parseInt(limit);

        const sellerId = req.user.role === 'admin' && req.query.sellerId
            ? req.query.sellerId
            : req.user._id;

        const [logs, total] = await Promise.all([
            TierEvaluationLog.find({ sellerId })
                .sort({ evaluationDate: -1 })
                .skip(skip)
                .limit(parseInt(limit)),
            TierEvaluationLog.countDocuments({ sellerId })
        ]);

        res.json({
            success: true,
            history: logs,
            pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / parseInt(limit)) }
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ── Helper: tier benefits ──
function getTierBenefits(tier) {
    const benefits = {
        bronze: [
            '7-day settlement cycle',
            'Standard dashboard access',
            'Email support',
            'Basic analytics'
        ],
        silver: [
            '5-day settlement cycle',
            'Priority support',
            'Enhanced analytics & trend reports',
            'Lower COD handling fees',
            'Dedicated account manager'
        ],
        gold: [
            '3-day settlement cycle',
            'Premium priority support',
            'Full analytics suite with forecasting',
            'Lowest COD handling fees',
            'Dedicated account manager',
            'Custom shipping rate negotiation',
            'Early access to new features'
        ]
    };
    return benefits[tier] || benefits.bronze;
}

export default router;
