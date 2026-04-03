import express from 'express';
import mongoose from 'mongoose';
import { protect, admin } from '../middleware/auth.js';
import User from '../models/User.js';
import Shipment from '../models/Shipment.js';
import Notification from '../models/Notification.js';
import Organization from '../models/Organization.js';
import PartnerTeam from '../models/PartnerTeam.js';
import AccountDeletionLog from '../models/AccountDeletionLog.js';
import WalletRechargeOrder from '../models/WalletRechargeOrder.js';
import KycAttempt from '../models/KycAttempt.js';
import PaymentWebhookLog from '../models/PaymentWebhookLog.js';
import Transaction from '../models/Transaction.js';
import { Resend } from 'resend';



const router = express.Router();
const resend = new Resend(process.env.RESEND_API_KEY);
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'FastFare <support@fastfare.in>';

/**
 * @route   GET /api/admin/stats
 * @desc    Get dashboard statistics including DigiLocker verified users count
 * @access  Admin only
 */
router.get('/stats', protect, admin, async (req, res) => {
    try {
        const totalOrgs = await Organization.countDocuments();
        const activeUsersCount = await User.countDocuments();
        const activeCarriers = await User.countDocuments({ role: 'shipment_partner' });
        const shipmentsToday = await Shipment.countDocuments({
            createdAt: { $gte: new Date(new Date().setHours(0,0,0,0)) }
        });
        const digilockerVerifiedCount = await User.countDocuments({
            'kyc.digilocker.status': 'verified'
        });

        res.json({
            organizations: totalOrgs,
            activeUsers: activeUsersCount,
            shipmentsToday: shipmentsToday,
            activeCarriers: activeCarriers,
            digilockerVerified: digilockerVerifiedCount
        });
    } catch (error) {
        console.error('Admin Stats Fetch error:', error);
        res.status(500).json({ message: 'Server Error' });
    }
});

/**
 * @route   GET /api/admin/users
 * @desc    Get all users and their wallet balances
 * @access  Admin only
 */
router.get('/users', protect, admin, async (req, res) => {
    try {
        const users = await User.find({}).select('-password').sort('-createdAt');
        res.json(users);
    } catch (error) {
        console.error('Admin Fetch Users error:', error);
        res.status(500).json({ message: 'Server Error' });
    }
});

/**
 * @route   GET /api/admin/users/:id/kyc-attempts
 * @desc    Get complete DigiLocker/KYC verification attempt history for a user
 * @access  Admin only
 */
router.get('/users/:id/kyc-attempts', protect, admin, async (req, res) => {
    try {
        const attempts = await KycAttempt.find({ user_id: req.params.id })
            .sort({ started_at: -1 });

        res.json({ success: true, count: attempts.length, attempts });
    } catch (error) {
        console.error(`Admin Fetch KYC Attempts error for User ${req.params.id}:`, error);
        res.status(500).json({ success: false, message: 'Server Error fetching KYC attempts' });
    }
});

// Helper to send deletion email
const sendAdminDeletionEmail = async (email, name) => {
    try {
        await resend.emails.send({
            from: FROM_EMAIL,
            to: email,
            subject: 'Your FastFare account has been removed',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                    <h2 style="color: #EF4444;">Account Removed</h2>
                    <p>Hi ${name || 'there'},</p>
                    <p>Your FastFare account has been removed by the platform administrator.</p>
                    <p>If you believe this is a mistake, please contact support@fastfare.in.</p>
                    <p>If you wish to rejoin, you may create a new account at <a href="https://fastfare.in">fastfare.in</a> using this email.</p>
                </div>
            `
        });
    } catch (err) {
        console.error('[FastFare Admin] Failed to send deletion email:', err);
    }
};

/**
 * @route   DELETE /api/admin/delete-account
 * @desc    Admin delete a user/partner account
 * @access  Admin only
 */
router.delete('/delete-account', protect, admin, async (req, res) => {
    const { userId, accountType } = req.body;
    
    if (!userId) {
        return res.status(400).json({ success: false, message: 'User ID is required' });
    }

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        // Fetch target user's details
        const targetUser = await User.findById(userId).session(session);
        if (!targetUser) {
            await session.abortTransaction();
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        const email = targetUser.email;
        const name = targetUser.name || targetUser.businessName || '';

        // Cascade deletions
        // 1. Shipments
        await Shipment.deleteMany({ createdBy: userId }).session(session);
        
        // 2. Billing/Invoices

        // 3. API Keys
        
        // 4. Notifications
        await Notification.deleteMany({ recipient: userId }).session(session);
        
        // 5. Partner Associations
        await PartnerTeam.deleteMany({ userId }).session(session);
        await PartnerTeam.deleteMany({ partnerId: userId }).session(session);

        // 6. Organization record
        await Organization.deleteMany({ ownerId: userId }).session(session);

        // 7. Delete target user record
        await User.findByIdAndDelete(userId).session(session);

        // 8. Log deletion
        await AccountDeletionLog.create([{
            deleted_user_email: email,
            deleted_by: req.user.id || 'admin',
            account_type: accountType || 'user'
        }], { session });

        await session.commitTransaction();
        session.endSession();

        // Send notification email
        await sendAdminDeletionEmail(email, name);

        res.json({ success: true, message: 'Account deleted successfully' });
    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        console.error('Admin account deletion error:', error);
        res.status(500).json({ success: false, message: 'Failed to delete account. Try again.' });
    }
});


/**
 * @route   POST /api/admin/users/:id/wallet
 * @desc    Admin adjust user wallet balance
 * @access  Admin only
 */
router.post('/users/:id/wallet', protect, admin, async (req, res) => {
    const userId = req.params.id;
    const { amount, action, reason } = req.body;
    
    if (!amount || !action || !reason) {
        return res.status(400).json({ success: false, message: 'Amount, action (credit/debit), and reason are required' });
    }

    const value = parseFloat(amount);
    if (isNaN(value) || value <= 0) {
        return res.status(400).json({ success: false, message: 'Invalid amount' });
    }

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const user = await User.findById(userId).session(session);
        if (!user) {
            await session.abortTransaction();
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        const balanceBefore = user.walletBalance || 0;
        let balanceAfter = balanceBefore;

        if (action === 'credit') {
            balanceAfter += value;
        } else if (action === 'debit') {
            if (balanceBefore < value) {
                await session.abortTransaction();
                return res.status(400).json({ success: false, message: 'Insufficient wallet balance for debit' });
            }
            balanceAfter -= value;
        } else {
            await session.abortTransaction();
            return res.status(400).json({ success: false, message: 'Invalid action' });
        }

        // Update user
        user.walletBalance = balanceAfter;
        await user.save({ session });

        // Create ledger entry
        const transaction = await Transaction.create([{
            userId: user._id,
            type: action === 'credit' ? 'recharge' : 'debit', // or create new enum 'admin_adjustment' if schema allows
            amount: action === 'credit' ? value : -value,
            status: 'completed',
            balanceBefore,
            balanceAfter,
            description: `Admin Adjustment: ${reason}`
        }], { session });

        await session.commitTransaction();
        session.endSession();

        res.json({ success: true, message: 'Wallet balance updated successfully', walletBalance: balanceAfter });
    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        console.error('Admin wallet adjustment error:', error);
        res.status(500).json({ success: false, message: 'Failed to adjust wallet balance' });
    }
});

/**
 * @route   GET /api/admin/recharges
 * @desc    Get all wallet recharge orders
 * @access  Admin only
 */
router.get('/recharges', protect, admin, async (req, res) => {
    try {
        const recharges = await WalletRechargeOrder.find({})
            .populate('user_id', 'name businessName email phone')
            .sort('-created_at');
        res.json(recharges);
    } catch (error) {
        console.error('Admin Fetch Recharges error:', error);
        res.status(500).json({ message: 'Server Error' });
    }
});

/**
 * @route   POST /api/admin/recharges/:id/credit
 * @desc    Manually credit a recharge order (Override)
 * @access  Admin only
 */
router.post('/recharges/:id/credit', protect, admin, async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const orderId = req.params.id;
        const lockedOrder = await WalletRechargeOrder.findOne({ _id: orderId, wallet_credited: false }).session(session);
        if (!lockedOrder) {
            await session.abortTransaction();
            session.endSession();
            return res.status(400).json({ success: false, message: 'Order already credited or not found' });
        }

        const user = await User.findById(lockedOrder.user_id).session(session);
        if(!user) {
            await session.abortTransaction();
            session.endSession();
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        const balanceBefore = user.walletBalance || 0;
        const balanceAfter = balanceBefore + lockedOrder.amount;

        user.walletBalance = balanceAfter;
        await user.save({ session });

        await Transaction.create([{
            userId: user._id,
            type: 'recharge',
            amount: lockedOrder.amount,
            status: 'completed',
            balanceBefore,
            balanceAfter,
            description: `Admin Manual Credit Override for Order ${lockedOrder.order_id}`
        }], { session });

        lockedOrder.status = 'paid';
        lockedOrder.wallet_credited = true;
        lockedOrder.wallet_credited_at = new Date();
        lockedOrder.updated_at = new Date();
        await lockedOrder.save({ session });

        await session.commitTransaction();
        session.endSession();

        console.log(`[Admin] Manually credited ₹${lockedOrder.amount} for Order ${lockedOrder.order_id}`);
        res.json({ success: true, message: 'Wallet credited successfully via manual override' });

    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        console.error('Admin Manual Credit Override error:', error);
        res.status(500).json({ success: false, message: 'Failed to manual credit wallet' });
    }
});

/**
 * @route   GET /api/admin/payment-gateway-config
 * @desc    Get non-sensitive PG config for admin
 * @access  Admin only
 */
router.get('/payment-gateway-config', protect, admin, async (req, res) => {
    try {
        const appId = process.env.CASHFREE_APP_ID || '';
        const maskedAppId = appId.length > 4 
            ? '- '.repeat(12) + appId.slice(-4) 
            : 'Not Configured';
            
        res.json({
            appId: maskedAppId,
            environment: process.env.CASHFREE_ENV || 'sandbox',
            apiVersion: '2023-08-01'
        });
    } catch(err) {
        res.status(500).json({message: 'Server Error'});
    }
});

// ══════════════════════════════════════════════════
// GET /api/admin/webhook-logs
// Financial webhook audit trail
// ══════════════════════════════════════════════════
router.get('/webhook-logs', protect, admin, async (req, res) => {
    try {
        const { page = 1, limit = 30, status, order_id } = req.query;
        const skip = (parseInt(page) - 1) * parseInt(limit);

        const query = {};
        if (status) query.processing_status = status;
        if (order_id) query.order_id = { $regex: order_id, $options: 'i' };

        const [logs, total] = await Promise.all([
            PaymentWebhookLog.find(query)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(parseInt(limit))
                .select('-raw_payload -raw_headers'),
            PaymentWebhookLog.countDocuments(query)
        ]);

        const statusCounts = await PaymentWebhookLog.aggregate([
            { $group: { _id: '$processing_status', count: { $sum: 1 } } }
        ]);

        res.json({
            success: true,
            logs,
            summary: Object.fromEntries(statusCounts.map(s => [s._id, s.count])),
            pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / parseInt(limit)) }
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ══════════════════════════════════════════════════
// GET /api/admin/webhook-logs/:id
// Full webhook log detail (with raw payload)
// ══════════════════════════════════════════════════
router.get('/webhook-logs/:id', protect, admin, async (req, res) => {
    try {
        const log = await PaymentWebhookLog.findById(req.params.id);
        if (!log) return res.status(404).json({ error: 'Log not found' });
        res.json({ success: true, log });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ══════════════════════════════════════════════════
// GET /api/admin/financial-summary
// Platform-wide financial overview
// ══════════════════════════════════════════════════
router.get('/financial-summary', protect, admin, async (req, res) => {
    try {
        const [totalRecharges, totalShipmentCharges, totalRefunds, totalUsers, totalPartners] = await Promise.all([
            Transaction.aggregate([
                { $match: { type: 'recharge', status: 'completed' } },
                { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } }
            ]),
            Transaction.aggregate([
                { $match: { type: 'shipment_charge', status: 'completed' } },
                { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } }
            ]),
            Transaction.aggregate([
                { $match: { type: 'refund', status: 'completed' } },
                { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } }
            ]),
            User.countDocuments({ role: 'user' }),
            User.countDocuments({ role: 'shipment_partner' })
        ]);

        res.json({
            success: true,
            financials: {
                totalRechargeAmount: totalRecharges[0]?.total || 0,
                totalRechargeCount: totalRecharges[0]?.count || 0,
                totalShipmentChargeAmount: totalShipmentCharges[0]?.total || 0,
                totalShipmentChargeCount: totalShipmentCharges[0]?.count || 0,
                totalRefundAmount: totalRefunds[0]?.total || 0,
                totalRefundCount: totalRefunds[0]?.count || 0,
                totalUsers,
                totalPartners
            }
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

export default router;
