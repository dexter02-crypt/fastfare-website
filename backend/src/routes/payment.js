import express from 'express';
import Razorpay from 'razorpay';
import crypto from 'crypto';
import dotenv from 'dotenv';
import User from '../models/User.js';
import Transaction from '../models/Transaction.js';
import { protect } from '../middleware/auth.js';

// Load environment variables
dotenv.config();

const router = express.Router();

// Initialize Razorpay
const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET
});

// Create Razorpay order
router.post('/create-order', protect, async (req, res) => {
    try {
        const { amount } = req.body; // Amount in rupees
        const userId = req.user._id;

        if (!amount || amount < 1) {
            return res.status(400).json({ error: 'Amount must be at least ₹1' });
        }

        const options = {
            amount: Math.round(amount * 100), // Razorpay expects amount in paise
            currency: 'INR',
            receipt: `rcpt_${Date.now()}`, // Max 40 chars
            notes: {
                userId: userId.toString(),
                purpose: 'Wallet Recharge'
            }
        };

        const order = await razorpay.orders.create(options);

        // Create a pending transaction
        const transaction = new Transaction({
            userId: userId,
            type: 'recharge',
            amount: amount,
            razorpayOrderId: order.id,
            status: 'pending',
            description: `Wallet recharge of ₹${amount}`
        });
        await transaction.save();

        res.json({
            orderId: order.id,
            amount: order.amount,
            currency: order.currency,
            keyId: process.env.RAZORPAY_KEY_ID
        });
    } catch (error) {
        console.error('Create order error:', error);
        res.status(500).json({ error: 'Failed to create order' });
    }
});

// Verify payment and update wallet
router.post('/verify', protect, async (req, res) => {
    try {
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
        const userId = req.user._id;

        // Verify signature
        const body = razorpay_order_id + '|' + razorpay_payment_id;
        const expectedSignature = crypto
            .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
            .update(body)
            .digest('hex');

        if (expectedSignature !== razorpay_signature) {
            // Update transaction as failed
            await Transaction.findOneAndUpdate(
                { razorpayOrderId: razorpay_order_id },
                { status: 'failed' }
            );
            return res.status(400).json({ error: 'Invalid payment signature' });
        }

        // Find the transaction and update it
        const transaction = await Transaction.findOneAndUpdate(
            { razorpayOrderId: razorpay_order_id },
            {
                razorpayPaymentId: razorpay_payment_id,
                razorpaySignature: razorpay_signature,
                status: 'completed'
            },
            { new: true }
        );

        if (!transaction) {
            return res.status(404).json({ error: 'Transaction not found' });
        }

        // Update user's wallet balance
        const user = await User.findByIdAndUpdate(
            userId,
            { $inc: { walletBalance: transaction.amount } },
            { new: true }
        );

        res.json({
            success: true,
            message: 'Payment verified successfully',
            newBalance: user.walletBalance,
            transactionId: transaction._id
        });
    } catch (error) {
        console.error('Verify payment error:', error);
        res.status(500).json({ error: 'Failed to verify payment' });
    }
});

// Get wallet balance and transactions
router.get('/wallet', protect, async (req, res) => {
    try {
        const userId = req.user._id;
        const user = await User.findById(userId).select('walletBalance');
        const transactions = await Transaction.find({ userId: userId })
            .sort({ createdAt: -1 })
            .limit(20);

        res.json({
            balance: 500000, // user.walletBalance,
            transactions: transactions.map(t => ({
                id: t._id,
                type: t.type,
                amount: t.amount,
                status: t.status,
                description: t.description,
                createdAt: t.createdAt
            }))
        });
    } catch (error) {
        console.error('Get wallet error:', error);
        res.status(500).json({ error: 'Failed to fetch wallet data' });
    }
});

export default router;
