import express from 'express';
import { protect, admin } from '../middleware/auth.js';
import PartnerLedger from '../models/PartnerLedger.js';
import WithdrawalRequest from '../models/WithdrawalRequest.js';
import Shipment from '../models/Shipment.js';

const router = express.Router();

// ══════════════════════════════════════════════════
// GET /api/partner/ledger
// Partner's financial ledger with pagination
// ══════════════════════════════════════════════════
router.get('/ledger', protect, async (req, res) => {
    try {
        if (req.user.role !== 'shipment_partner' && req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Partner access only' });
        }

        const { page = 1, limit = 50, type } = req.query;
        const skip = (parseInt(page) - 1) * parseInt(limit);
        const partnerId = req.user.role === 'admin' && req.query.partnerId
            ? req.query.partnerId
            : req.user._id;

        const query = { partnerId };
        if (type) query.type = type;

        const [entries, total] = await Promise.all([
            PartnerLedger.find(query)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(parseInt(limit)),
            PartnerLedger.countDocuments(query)
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
// GET /api/partner/payouts
// Payout history for partner
// ══════════════════════════════════════════════════
router.get('/payouts', protect, async (req, res) => {
    try {
        if (req.user.role !== 'shipment_partner' && req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Partner access only' });
        }

        const partnerId = req.user.role === 'admin' && req.query.partnerId
            ? req.query.partnerId
            : req.user._id;

        const payouts = await PartnerLedger.find({
            partnerId,
            type: 'payout'
        }).sort({ createdAt: -1 });

        const totalPaidOut = payouts.reduce((sum, p) => sum + p.amount, 0);

        res.json({
            success: true,
            payouts,
            totalPaidOut
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ══════════════════════════════════════════════════
// GET /api/partner/earnings
// Earnings summary for partner
// ══════════════════════════════════════════════════
router.get('/earnings', protect, async (req, res) => {
    try {
        if (req.user.role !== 'shipment_partner' && req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Partner access only' });
        }

        const partnerId = req.user.role === 'admin' && req.query.partnerId
            ? req.query.partnerId
            : req.user._id;

        const summary = await PartnerLedger.aggregate([
            { $match: { partnerId: partnerId } },
            {
                $group: {
                    _id: '$type',
                    total: { $sum: '$amount' },
                    count: { $sum: 1 }
                }
            }
        ]);

        // Calculate current balance
        const lastEntry = await PartnerLedger.findOne({ partnerId }).sort({ createdAt: -1 });
        const currentBalance = lastEntry ? lastEntry.balanceAfter : 0;

        // This month's earnings
        const monthStart = new Date();
        monthStart.setDate(1);
        monthStart.setHours(0, 0, 0, 0);

        const monthlyEarnings = await PartnerLedger.aggregate([
            {
                $match: {
                    partnerId: partnerId,
                    type: 'earning',
                    createdAt: { $gte: monthStart }
                }
            },
            {
                $group: {
                    _id: null,
                    total: { $sum: '$amount' },
                    trips: { $sum: 1 },
                    totalDistance: { $sum: '$distance' }
                }
            }
        ]);

        const monthly = monthlyEarnings[0] || { total: 0, trips: 0, totalDistance: 0 };

        // Deliveries today
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);

        const todayEarnings = await PartnerLedger.aggregate([
            {
                $match: {
                    partnerId: partnerId,
                    type: 'earning',
                    createdAt: { $gte: todayStart }
                }
            },
            {
                $group: {
                    _id: null,
                    total: { $sum: '$amount' },
                    trips: { $sum: 1 }
                }
            }
        ]);

        const today = todayEarnings[0] || { total: 0, trips: 0 };

        res.json({
            success: true,
            earnings: {
                currentBalance,
                summary: summary.reduce((acc, s) => {
                    acc[s._id] = { total: s.total, count: s.count };
                    return acc;
                }, {}),
                monthly: {
                    earnings: monthly.total,
                    trips: monthly.trips,
                    totalDistance: monthly.totalDistance
                },
                today: {
                    earnings: today.total,
                    trips: today.trips
                }
            }
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ══════════════════════════════════════════════════
// POST /api/partner/record-earning
// Record partner earning for a delivery (called on delivery completion)
// ══════════════════════════════════════════════════
router.post('/record-earning', protect, async (req, res) => {
    try {
        const { orderId, partnerId, distance, partnerRate, slabAdd = 0 } = req.body;

        const shipment = await Shipment.findById(orderId);
        if (!shipment) return res.status(404).json({ error: 'Order not found' });

        // PartnerPayout = (Distance × PartnerRate) + SlabAdd
        const earning = Math.round(((distance * partnerRate) + slabAdd) * 100) / 100;

        // Get current balance
        const lastEntry = await PartnerLedger.findOne({ partnerId }).sort({ createdAt: -1 });
        const balanceBefore = lastEntry ? lastEntry.balanceAfter : 0;

        const entry = await PartnerLedger.create({
            partnerId,
            orderId,
            type: 'earning',
            amount: earning,
            description: `Delivery earning for ${shipment.awb} — ${distance}km × ₹${partnerRate}/km + ₹${slabAdd} slab`,
            distance,
            partnerRate,
            slabAdd,
            balanceBefore,
            balanceAfter: balanceBefore + earning
        });

        res.json({
            success: true,
            earning: {
                id: entry._id,
                amount: earning,
                distance,
                formula: `(${distance} × ₹${partnerRate}) + ₹${slabAdd} = ₹${earning}`,
                currentBalance: entry.balanceAfter
            }
        });
    } catch (error) {
        console.error('Partner earning record error:', error);
        res.status(500).json({ error: error.message });
    }
});

// ══════════════════════════════════════════════════════════════
//  WITHDRAWAL SYSTEM
//  Partner requests → Admin reviews → Payout processed
// ══════════════════════════════════════════════════════════════

// POST /api/partner/withdraw — Partner requests a withdrawal
router.post('/withdraw', protect, async (req, res) => {
    try {
        if (req.user.role !== 'shipment_partner') {
            return res.status(403).json({ error: 'Partner access only' });
        }

        const { amount, bankDetails } = req.body;

        if (!amount || amount <= 0) {
            return res.status(400).json({ error: 'Invalid withdrawal amount' });
        }

        // Get current balance
        const lastEntry = await PartnerLedger.findOne({ partnerId: req.user._id }).sort({ createdAt: -1 });
        const currentBalance = lastEntry ? lastEntry.balanceAfter : 0;

        if (amount > currentBalance) {
            return res.status(400).json({
                error: 'Insufficient balance',
                currentBalance,
                requested: amount
            });
        }

        // Check for pending withdrawal
        const pendingRequest = await WithdrawalRequest.findOne({
            partnerId: req.user._id,
            status: { $in: ['pending', 'processing'] }
        });

        if (pendingRequest) {
            return res.status(400).json({
                error: 'You already have a pending withdrawal request',
                pendingAmount: pendingRequest.amount,
                requestId: pendingRequest._id
            });
        }

        const withdrawal = await WithdrawalRequest.create({
            partnerId: req.user._id,
            amount,
            bankDetails: bankDetails || {},
            balanceAtRequest: currentBalance,
            status: 'pending'
        });

        res.status(201).json({
            success: true,
            message: 'Withdrawal request submitted. Awaiting admin approval.',
            withdrawal: {
                id: withdrawal._id,
                amount: withdrawal.amount,
                status: withdrawal.status,
                balanceAtRequest: currentBalance,
                createdAt: withdrawal.createdAt
            }
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// GET /api/partner/withdrawals — Partner views their withdrawal history
router.get('/withdrawals', protect, async (req, res) => {
    try {
        if (req.user.role !== 'shipment_partner' && req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Partner access only' });
        }

        const partnerId = req.user.role === 'admin' && req.query.partnerId
            ? req.query.partnerId
            : req.user._id;

        const withdrawals = await WithdrawalRequest.find({ partnerId })
            .populate('reviewedBy', 'businessName email')
            .sort({ createdAt: -1 });

        res.json({ success: true, withdrawals });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ─── ADMIN ENDPOINTS ───

// GET /api/partner/admin/withdrawals — Admin views all withdrawal requests
router.get('/admin/withdrawals', protect, admin, async (req, res) => {
    try {
        const { status, page = 1, limit = 20 } = req.query;
        const skip = (parseInt(page) - 1) * parseInt(limit);

        const query = {};
        if (status) query.status = status;

        const [requests, total] = await Promise.all([
            WithdrawalRequest.find(query)
                .populate('partnerId', 'businessName email phone tier')
                .populate('reviewedBy', 'businessName email')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(parseInt(limit)),
            WithdrawalRequest.countDocuments(query)
        ]);

        // Summary counts
        const [pending, approved, rejected] = await Promise.all([
            WithdrawalRequest.countDocuments({ status: 'pending' }),
            WithdrawalRequest.countDocuments({ status: { $in: ['approved', 'completed'] } }),
            WithdrawalRequest.countDocuments({ status: 'rejected' })
        ]);

        res.json({
            success: true,
            requests,
            summary: { pending, approved, rejected },
            pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / parseInt(limit)) }
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// PUT /api/partner/admin/withdrawals/:id/approve — Admin approves a withdrawal
router.put('/admin/withdrawals/:id/approve', protect, admin, async (req, res) => {
    try {
        const { transactionRef, adminNote } = req.body;

        const withdrawal = await WithdrawalRequest.findById(req.params.id);
        if (!withdrawal) return res.status(404).json({ error: 'Withdrawal request not found' });
        if (withdrawal.status !== 'pending') return res.status(400).json({ error: `Cannot approve — current status is "${withdrawal.status}"` });

        // Get partner's current balance
        const lastEntry = await PartnerLedger.findOne({ partnerId: withdrawal.partnerId }).sort({ createdAt: -1 });
        const currentBalance = lastEntry ? lastEntry.balanceAfter : 0;

        if (withdrawal.amount > currentBalance) {
            return res.status(400).json({
                error: 'Partner has insufficient balance for this withdrawal',
                currentBalance,
                requested: withdrawal.amount
            });
        }

        // Create payout ledger entry (deducts from balance)
        await PartnerLedger.create({
            partnerId: withdrawal.partnerId,
            type: 'payout',
            amount: withdrawal.amount,
            description: `Withdrawal payout — Request #${withdrawal._id}${transactionRef ? ` (Ref: ${transactionRef})` : ''}`,
            balanceBefore: currentBalance,
            balanceAfter: currentBalance - withdrawal.amount
        });

        // Update withdrawal request
        withdrawal.status = 'completed';
        withdrawal.reviewedBy = req.user._id;
        withdrawal.reviewedAt = new Date();
        withdrawal.adminNote = adminNote || '';
        withdrawal.transactionRef = transactionRef || '';
        withdrawal.paidAt = new Date();
        withdrawal.balanceAfterPayout = currentBalance - withdrawal.amount;
        await withdrawal.save();

        res.json({
            success: true,
            message: `Withdrawal of ₹${withdrawal.amount} approved and processed`,
            withdrawal
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// PUT /api/partner/admin/withdrawals/:id/reject — Admin rejects a withdrawal
router.put('/admin/withdrawals/:id/reject', protect, admin, async (req, res) => {
    try {
        const { rejectionReason } = req.body;

        const withdrawal = await WithdrawalRequest.findById(req.params.id);
        if (!withdrawal) return res.status(404).json({ error: 'Withdrawal request not found' });
        if (withdrawal.status !== 'pending') return res.status(400).json({ error: `Cannot reject — current status is "${withdrawal.status}"` });

        withdrawal.status = 'rejected';
        withdrawal.reviewedBy = req.user._id;
        withdrawal.reviewedAt = new Date();
        withdrawal.rejectionReason = rejectionReason || 'No reason provided';
        await withdrawal.save();

        res.json({
            success: true,
            message: 'Withdrawal request rejected',
            withdrawal
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

export default router;
