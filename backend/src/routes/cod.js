import express from 'express';
import { protect, admin } from '../middleware/auth.js';
import CODCollection from '../models/CODCollection.js';
import Shipment from '../models/Shipment.js';
import SellerStats from '../models/SellerStats.js';

const router = express.Router();

// ══════════════════════════════════════════════════
// POST /api/cod/record
// Record COD collection by delivery partner
// ══════════════════════════════════════════════════
router.post('/record', protect, async (req, res) => {
    try {
        const { orderId, collectedAmount, partnerId } = req.body;

        const shipment = await Shipment.findById(orderId);
        if (!shipment) return res.status(404).json({ error: 'Order not found' });
        if (shipment.paymentMode !== 'cod') {
            return res.status(400).json({ error: 'Order is not COD' });
        }

        // Check if already recorded
        const existing = await CODCollection.findOne({ orderId });
        if (existing) return res.status(400).json({ error: 'COD already recorded for this order' });

        const platformFee = shipment.platformFee || 0;
        const shippingCharge = shipment.shippingCost || 0;
        const codHandlingFee = Math.round(collectedAmount * 0.02 * 100) / 100; // 2% COD handling
        const netSettlement = collectedAmount - shippingCharge - platformFee - codHandlingFee;

        const codRecord = await CODCollection.create({
            orderId,
            sellerId: shipment.user,
            partnerId: partnerId || null,
            codAmount: shipment.codAmount || collectedAmount,
            collectedAmount,
            shippingCharge,
            platformFee,
            codHandlingFee,
            netSettlement: Math.max(0, netSettlement),
            remittanceStatus: 'collected',
            collectedAt: new Date()
        });

        // Update SellerStats
        await SellerStats.findOneAndUpdate(
            { sellerId: shipment.user },
            {
                $inc: {
                    totalCodCollected: collectedAmount,
                    pendingCodRemittance: collectedAmount
                },
                lastUpdated: new Date()
            },
            { upsert: true }
        );

        res.json({
            success: true,
            cod: {
                id: codRecord._id,
                codAmount: codRecord.codAmount,
                collectedAmount,
                shippingCharge,
                platformFee,
                codHandlingFee,
                netSettlement: codRecord.netSettlement,
                status: codRecord.remittanceStatus
            }
        });
    } catch (error) {
        console.error('COD record error:', error);
        res.status(500).json({ error: error.message });
    }
});

// ══════════════════════════════════════════════════
// GET /api/cod/reconciliation
// COD reconciliation report for seller
// ══════════════════════════════════════════════════
router.get('/reconciliation', protect, async (req, res) => {
    try {
        const { page = 1, limit = 20, status } = req.query;
        const skip = (parseInt(page) - 1) * parseInt(limit);

        const query = { sellerId: req.user._id };
        if (status) query.remittanceStatus = status;

        const [records, total, summary] = await Promise.all([
            CODCollection.find(query)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(parseInt(limit))
                .populate('orderId', 'awb status'),
            CODCollection.countDocuments(query),
            CODCollection.aggregate([
                { $match: { sellerId: req.user._id } },
                {
                    $group: {
                        _id: '$remittanceStatus',
                        count: { $sum: 1 },
                        totalAmount: { $sum: '$collectedAmount' },
                        netAmount: { $sum: '$netSettlement' }
                    }
                }
            ])
        ]);

        res.json({
            success: true,
            records,
            summary: summary.reduce((acc, s) => {
                acc[s._id] = { count: s.count, totalAmount: s.totalAmount, netAmount: s.netAmount };
                return acc;
            }, {}),
            pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / parseInt(limit)) }
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ══════════════════════════════════════════════════
// GET /api/cod/pending
// Pending COD remittances for admin view
// ══════════════════════════════════════════════════
router.get('/pending', protect, admin, async (req, res) => {
    try {
        const pending = await CODCollection.aggregate([
            { $match: { remittanceStatus: { $in: ['collected', 'pending'] } } },
            {
                $group: {
                    _id: '$sellerId',
                    totalPending: { $sum: '$collectedAmount' },
                    netPending: { $sum: '$netSettlement' },
                    count: { $sum: 1 }
                }
            },
            {
                $lookup: {
                    from: 'users',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'seller'
                }
            },
            { $unwind: '$seller' },
            {
                $project: {
                    sellerId: '$_id',
                    businessName: '$seller.businessName',
                    totalPending: 1,
                    netPending: 1,
                    count: 1
                }
            }
        ]);

        res.json({ success: true, pending });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

export default router;
