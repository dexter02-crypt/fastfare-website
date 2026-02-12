import express from 'express';
import { protect, admin } from '../middleware/auth.js';
import Shipment from '../models/Shipment.js';
import User from '../models/User.js';
import SellerLedger from '../models/SellerLedger.js';
import SellerStats from '../models/SellerStats.js';
import SettlementSchedule from '../models/SettlementSchedule.js';
import OrderStatusHistory from '../models/OrderStatusHistory.js';

const router = express.Router();

// ── Tier-based settlement days ──
const TIER_SETTLEMENT_DAYS = { bronze: 7, silver: 5, gold: 3 };

// ── Helper: compute settlement date from delivery date + tier ──
function computeSettlementDate(deliveryDate, tier) {
    const days = TIER_SETTLEMENT_DAYS[tier] || 7;
    const date = new Date(deliveryDate);
    date.setDate(date.getDate() + days);
    // Skip weekends (move to next Monday)
    while (date.getDay() === 0 || date.getDay() === 6) {
        date.setDate(date.getDate() + 1);
    }
    return date;
}

// ── Helper: get or create SellerStats doc ──
async function getOrCreateStats(sellerId) {
    let stats = await SellerStats.findOne({ sellerId });
    if (!stats) {
        const seller = await User.findById(sellerId);
        stats = await SellerStats.create({
            sellerId,
            currentTier: seller?.tier || 'bronze'
        });
    }
    return stats;
}

// ══════════════════════════════════════════════════
// POST /api/settlement/trigger
// Called when an order is marked as Delivered (RTD)
// Creates settlement schedule entry and ledger record
// ══════════════════════════════════════════════════
router.post('/trigger', protect, async (req, res) => {
    try {
        const { orderId } = req.body;

        const shipment = await Shipment.findById(orderId);
        if (!shipment) return res.status(404).json({ error: 'Order not found' });
        if (shipment.status !== 'delivered') {
            return res.status(400).json({ error: 'Settlement can only be triggered for delivered orders' });
        }
        if (shipment.settlementStatus !== 'not_applicable' && shipment.settlementStatus !== 'pending') {
            return res.status(400).json({ error: `Settlement already ${shipment.settlementStatus}` });
        }

        const seller = await User.findById(shipment.user);
        if (!seller) return res.status(404).json({ error: 'Seller not found' });

        // ── Compute financials ──
        const platformFeePercent = seller.platformFeePercent || 5;
        const orderValue = shipment.totalValue || 0;
        const shippingCost = shipment.shippingCost || 0;
        const platformFee = Math.round((orderValue * platformFeePercent / 100) * 100) / 100;
        const sellerEarning = Math.max(0, orderValue - shippingCost - platformFee);

        // ── Compute settlement date ──
        const deliveryDate = shipment.actualDelivery || new Date();
        const settlementDate = computeSettlementDate(deliveryDate, seller.tier);

        // ── Update shipment ──
        shipment.platformFee = platformFee;
        shipment.sellerEarning = sellerEarning;
        shipment.settlementStatus = 'scheduled';
        shipment.settlementDate = settlementDate;
        await shipment.save();

        // ── Get seller stats for balance tracking ──
        const stats = await getOrCreateStats(seller._id);

        // ── Create ledger entry (earning → pending) ──
        await SellerLedger.create({
            sellerId: seller._id,
            orderId: shipment._id,
            type: 'earning',
            amount: sellerEarning,
            description: `Earning for order ${shipment.awb} — ₹${orderValue} - ₹${shippingCost} shipping - ₹${platformFee} platform fee`,
            pendingBefore: stats.pendingSettlement,
            pendingAfter: stats.pendingSettlement + sellerEarning,
            availableBefore: stats.availableForWithdrawal,
            availableAfter: stats.availableForWithdrawal,
            metadata: { awb: shipment.awb, tier: seller.tier, orderValue, shippingCost, platformFee, platformFeePercent }
        });

        // ── Find or create settlement schedule batch for this date ──
        let schedule = await SettlementSchedule.findOne({
            sellerId: seller._id,
            settlementDate,
            status: 'scheduled'
        });

        if (schedule) {
            schedule.orderIds.push(shipment._id);
            schedule.totalAmount += sellerEarning;
            await schedule.save();
        } else {
            schedule = await SettlementSchedule.create({
                sellerId: seller._id,
                tier: seller.tier,
                orderIds: [shipment._id],
                totalAmount: sellerEarning,
                settlementDate
            });
        }

        // ── Update stats ──
        stats.deliveredOrders += 1;
        stats.grossRevenue += orderValue;
        stats.totalShippingCost += shippingCost;
        stats.totalPlatformFees += platformFee;
        stats.pendingSettlement += sellerEarning;
        stats.monthlyDelivered += 1;
        stats.nextSettlementDate = settlementDate;
        stats.rtoPercent = stats.totalOrders > 0
            ? Math.round((stats.rtoOrders / stats.totalOrders) * 10000) / 100
            : 0;
        stats.deliverySuccessRate = stats.totalOrders > 0
            ? Math.round((stats.deliveredOrders / stats.totalOrders) * 10000) / 100
            : 0;
        stats.lastUpdated = new Date();
        await stats.save();

        res.json({
            success: true,
            settlement: {
                orderId: shipment._id,
                awb: shipment.awb,
                sellerEarning,
                platformFee,
                shippingCost,
                tier: seller.tier,
                settlementDate,
                batchId: schedule._id
            }
        });
    } catch (error) {
        console.error('Settlement trigger error:', error);
        res.status(500).json({ error: error.message });
    }
});

// ══════════════════════════════════════════════════
// GET /api/settlement/schedule
// Upcoming settlement schedule for the logged-in seller
// ══════════════════════════════════════════════════
router.get('/schedule', protect, async (req, res) => {
    try {
        const schedules = await SettlementSchedule.find({
            sellerId: req.user._id,
            status: { $in: ['scheduled', 'processing'] }
        })
            .sort({ settlementDate: 1 })
            .populate('orderIds', 'awb totalValue status');

        res.json({ success: true, schedules });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ══════════════════════════════════════════════════
// GET /api/settlement/history
// Past settlement records with pagination
// ══════════════════════════════════════════════════
router.get('/history', protect, async (req, res) => {
    try {
        const { page = 1, limit = 20 } = req.query;
        const skip = (parseInt(page) - 1) * parseInt(limit);

        const [settlements, total] = await Promise.all([
            SettlementSchedule.find({
                sellerId: req.user._id,
                status: { $in: ['completed', 'failed'] }
            })
                .sort({ processedAt: -1 })
                .skip(skip)
                .limit(parseInt(limit)),
            SettlementSchedule.countDocuments({
                sellerId: req.user._id,
                status: { $in: ['completed', 'failed'] }
            })
        ]);

        res.json({
            success: true,
            settlements,
            pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / parseInt(limit)) }
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ══════════════════════════════════════════════════
// GET /api/settlement/ledger
// Full financial ledger for seller with pagination
// ══════════════════════════════════════════════════
router.get('/ledger', protect, async (req, res) => {
    try {
        const { page = 1, limit = 50, type } = req.query;
        const skip = (parseInt(page) - 1) * parseInt(limit);

        const query = { sellerId: req.user._id };
        if (type) query.type = type;

        const [entries, total] = await Promise.all([
            SellerLedger.find(query)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(parseInt(limit)),
            SellerLedger.countDocuments(query)
        ]);

        res.json({
            success: true,
            ledger: entries,
            pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / parseInt(limit)) }
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ══════════════════════════════════════════════════
// POST /api/settlement/process
// Admin or cron: process all due settlements
// ══════════════════════════════════════════════════
router.post('/process', protect, admin, async (req, res) => {
    try {
        const now = new Date();
        const dueSchedules = await SettlementSchedule.find({
            status: 'scheduled',
            settlementDate: { $lte: now }
        });

        const results = [];

        for (const schedule of dueSchedules) {
            schedule.status = 'processing';
            await schedule.save();

            try {
                const stats = await getOrCreateStats(schedule.sellerId);

                // Move pending → available
                await SellerLedger.create({
                    sellerId: schedule.sellerId,
                    type: 'settlement',
                    amount: schedule.totalAmount,
                    description: `Settlement batch ${schedule._id} — ${schedule.orderIds.length} orders (${schedule.tier} tier)`,
                    settlementId: schedule._id,
                    pendingBefore: stats.pendingSettlement,
                    pendingAfter: Math.max(0, stats.pendingSettlement - schedule.totalAmount),
                    availableBefore: stats.availableForWithdrawal,
                    availableAfter: stats.availableForWithdrawal + schedule.totalAmount
                });

                // Update stats
                stats.pendingSettlement = Math.max(0, stats.pendingSettlement - schedule.totalAmount);
                stats.availableForWithdrawal += schedule.totalAmount;
                stats.totalSettled += schedule.totalAmount;
                stats.lastUpdated = new Date();
                await stats.save();

                // Mark orders as settled
                await Shipment.updateMany(
                    { _id: { $in: schedule.orderIds } },
                    { $set: { settlementStatus: 'settled' } }
                );

                schedule.status = 'completed';
                schedule.processedAt = new Date();
                await schedule.save();

                results.push({ batchId: schedule._id, status: 'completed', amount: schedule.totalAmount, orders: schedule.orderIds.length });
            } catch (batchError) {
                schedule.status = 'failed';
                schedule.failureReason = batchError.message;
                await schedule.save();
                results.push({ batchId: schedule._id, status: 'failed', error: batchError.message });
            }
        }

        res.json({
            success: true,
            processed: results.length,
            results
        });
    } catch (error) {
        console.error('Settlement process error:', error);
        res.status(500).json({ error: error.message });
    }
});

export default router;
