import express from 'express';
import Shipment from '../models/Shipment.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// GET /api/billing/summary — Bug 26
router.get('/summary', protect, async (req, res) => {
    try {
        const userId = req.user._id;
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

        const thisMonthShipments = await Shipment.find({
            user: userId,
            createdAt: { $gte: startOfMonth }
        });

        const thisMonthSpend = thisMonthShipments.reduce(
            (sum, s) => sum + (s.shippingCost || 0), 0
        );

        // Wallet balance from user record
        const User = (await import('../models/User.js')).default;
        const user = await User.findById(userId).select('walletBalance creditLimit');

        res.json({
            walletBalance: user?.walletBalance || 0,
            thisMonthSpend: parseFloat(thisMonthSpend.toFixed(2)),
            pendingPayments: 0,
            creditLimit: user?.creditLimit ?? null
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// GET /api/billing/invoices — Bug 27
router.get('/invoices', protect, async (req, res) => {
    try {
        const shipments = await Shipment.find({ user: req.user._id })
            .sort({ createdAt: -1 })
            .select('awb shippingCost createdAt status paymentMode carrier');

        const invoices = shipments.map((s) => ({
            _id: s._id,
            invoiceNo: 'FF-INV-' + String(s.createdAt.getTime()).slice(-8),
            awb: s.awb,
            amount: parseFloat(((s.shippingCost || 0) * 1.18).toFixed(2)),
            date: s.createdAt,
            paymentMode: s.paymentMode || 'Prepaid',
            status: s.paymentMode === 'cod' ? 'COD' : 'Paid',
            carrier: s.carrier || 'FastFare'
        }));

        res.json(invoices);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

export default router;
