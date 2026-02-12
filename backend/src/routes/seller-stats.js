import express from 'express';
import { protect } from '../middleware/auth.js';
import Shipment from '../models/Shipment.js';
import SellerStats from '../models/SellerStats.js';
import User from '../models/User.js';

const router = express.Router();

// ══════════════════════════════════════════════════
// GET /api/seller/dashboard
// Full dashboard stats for the logged-in seller
// ══════════════════════════════════════════════════
router.get('/dashboard', protect, async (req, res) => {
    try {
        const sellerId = req.user._id;

        // Get or create stats
        let stats = await SellerStats.findOne({ sellerId });

        // If no stats doc exists, build it from scratch
        if (!stats) {
            const [total, delivered, rto, cancelled, inTransit, pending] = await Promise.all([
                Shipment.countDocuments({ user: sellerId }),
                Shipment.countDocuments({ user: sellerId, status: 'delivered' }),
                Shipment.countDocuments({ user: sellerId, status: 'returned' }),
                Shipment.countDocuments({ user: sellerId, status: 'cancelled' }),
                Shipment.countDocuments({ user: sellerId, status: 'in_transit' }),
                Shipment.countDocuments({ user: sellerId, status: 'pending' })
            ]);

            // Calculate financials from shipments
            const financials = await Shipment.aggregate([
                { $match: { user: sellerId } },
                {
                    $group: {
                        _id: null,
                        grossRevenue: { $sum: '$totalValue' },
                        totalShippingCost: { $sum: '$shippingCost' },
                        totalPlatformFees: { $sum: '$platformFee' },
                        totalSettled: {
                            $sum: {
                                $cond: [{ $eq: ['$settlementStatus', 'settled'] }, '$sellerEarning', 0]
                            }
                        },
                        pendingSettlement: {
                            $sum: {
                                $cond: [{ $eq: ['$settlementStatus', 'scheduled'] }, '$sellerEarning', 0]
                            }
                        }
                    }
                }
            ]);

            const fin = financials[0] || {};

            stats = await SellerStats.create({
                sellerId,
                totalOrders: total,
                deliveredOrders: delivered,
                rtoOrders: rto,
                cancelledOrders: cancelled,
                inTransitOrders: inTransit,
                pendingOrders: pending,
                grossRevenue: fin.grossRevenue || 0,
                totalShippingCost: fin.totalShippingCost || 0,
                totalPlatformFees: fin.totalPlatformFees || 0,
                totalSettled: fin.totalSettled || 0,
                pendingSettlement: fin.pendingSettlement || 0,
                currentTier: req.user.tier || 'bronze',
                rtoPercent: total > 0 ? Math.round((rto / total) * 10000) / 100 : 0,
                deliverySuccessRate: total > 0 ? Math.round((delivered / total) * 10000) / 100 : 0,
                lastUpdated: new Date()
            });
        }

        // Get tier upgrade thresholds
        const tierInfo = {
            current: req.user.tier || 'bronze',
            settlementDays: { bronze: 7, silver: 5, gold: 3 }[req.user.tier || 'bronze'],
            upgradeProgress: getUpgradeProgress(stats.monthlyOrders, req.user.tier || 'bronze')
        };

        res.json({
            success: true,
            dashboard: {
                overview: {
                    totalOrders: stats.totalOrders,
                    deliveredOrders: stats.deliveredOrders,
                    rtoOrders: stats.rtoOrders,
                    cancelledOrders: stats.cancelledOrders,
                    inTransitOrders: stats.inTransitOrders,
                    pendingOrders: stats.pendingOrders
                },
                financials: {
                    grossRevenue: stats.grossRevenue,
                    totalShippingCost: stats.totalShippingCost,
                    totalPlatformFees: stats.totalPlatformFees,
                    totalSettled: stats.totalSettled,
                    pendingSettlement: stats.pendingSettlement,
                    availableForWithdrawal: stats.availableForWithdrawal,
                    totalCodCollected: stats.totalCodCollected
                },
                performance: {
                    rtoPercent: stats.rtoPercent,
                    deliverySuccessRate: stats.deliverySuccessRate,
                    averageDeliveryDays: stats.averageDeliveryDays
                },
                tier: tierInfo,
                nextSettlementDate: stats.nextSettlementDate,
                lastUpdated: stats.lastUpdated
            }
        });
    } catch (error) {
        console.error('Seller dashboard error:', error);
        res.status(500).json({ error: error.message });
    }
});

// ══════════════════════════════════════════════════
// GET /api/seller/performance
// Performance metrics for tier evaluation preview
// ══════════════════════════════════════════════════
router.get('/performance', protect, async (req, res) => {
    try {
        const sellerId = req.user._id;
        const currentTier = req.user.tier || 'bronze';

        // Monthly stats
        const monthStart = new Date();
        monthStart.setDate(1);
        monthStart.setHours(0, 0, 0, 0);

        const [monthlyOrders, monthlyDelivered, monthlyRto] = await Promise.all([
            Shipment.countDocuments({ user: sellerId, createdAt: { $gte: monthStart } }),
            Shipment.countDocuments({ user: sellerId, status: 'delivered', createdAt: { $gte: monthStart } }),
            Shipment.countDocuments({ user: sellerId, status: 'returned', createdAt: { $gte: monthStart } })
        ]);

        const monthlyRtoPercent = monthlyOrders > 0 ? Math.round((monthlyRto / monthlyOrders) * 10000) / 100 : 0;
        const upgradeProgress = getUpgradeProgress(monthlyOrders, currentTier);

        res.json({
            success: true,
            performance: {
                currentTier,
                monthlyOrders,
                monthlyDelivered,
                monthlyRto,
                monthlyRtoPercent,
                upgradeProgress,
                thresholds: {
                    silver: { required: 300, label: 'Silver Tier' },
                    gold: { required: 800, label: 'Gold Tier' }
                }
            }
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ── Helper: compute tier upgrade progress ──
function getUpgradeProgress(monthlyOrders, currentTier) {
    if (currentTier === 'gold') {
        return { nextTier: null, ordersNeeded: 0, progress: 100, message: 'Maximum tier achieved' };
    }
    if (currentTier === 'silver') {
        const needed = 800;
        return {
            nextTier: 'gold',
            ordersNeeded: Math.max(0, needed - monthlyOrders),
            progress: Math.min(100, Math.round((monthlyOrders / needed) * 100)),
            message: monthlyOrders >= needed ? 'Eligible for Gold upgrade' : `${Math.max(0, needed - monthlyOrders)} more orders needed for Gold`
        };
    }
    // bronze
    const needed = 300;
    return {
        nextTier: 'silver',
        ordersNeeded: Math.max(0, needed - monthlyOrders),
        progress: Math.min(100, Math.round((monthlyOrders / needed) * 100)),
        message: monthlyOrders >= needed ? 'Eligible for Silver upgrade' : `${Math.max(0, needed - monthlyOrders)} more orders needed for Silver`
    };
}

export default router;
