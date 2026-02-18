import express from 'express';
import { protect } from '../middleware/auth.js';
import Shipment from '../models/Shipment.js';
import User from '../models/User.js';

const router = express.Router();

// GET /api/alerts — Generate real-time alerts for the authenticated user
router.get('/', protect, async (req, res) => {
    try {
        const user = await User.findById(req.user._id).select(
            'gstin kyc isVerified walletBalance businessName'
        );

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        const alerts = [];

        // ——— 1. KYC / GSTIN Incomplete ———
        if (!user.gstin || user.kyc?.status !== 'verified') {
            const missing = [];
            if (!user.gstin) missing.push('GSTIN');
            if (user.kyc?.status !== 'verified') missing.push('KYC');

            alerts.push({
                id: 'kyc_incomplete',
                type: 'critical',
                title: 'Complete KYC Verification',
                description: `Your ${missing.join(' and ')} verification is pending. Complete it to unlock all features.`,
                action: { label: 'Complete KYC', href: '/settings/kyc' },
                icon: 'shield'
            });
        }

        // ——— 2. Email Not Verified ———
        if (!user.isVerified) {
            alerts.push({
                id: 'email_unverified',
                type: 'warning',
                title: 'Verify Your Email',
                description: 'Your email is not verified. Verify it to receive shipment updates and invoices.',
                action: { label: 'Verify Email', href: '/verify-email' },
                icon: 'mail'
            });
        }

        // ——— 3. Low Wallet Balance ———
        if (user.walletBalance < 100) {
            alerts.push({
                id: 'low_wallet',
                type: user.walletBalance === 0 ? 'critical' : 'warning',
                title: 'Low Wallet Balance',
                description: `Your wallet balance is ₹${user.walletBalance.toLocaleString('en-IN')}. Recharge to continue shipping.`,
                action: { label: 'Recharge Now', href: '/billing/recharge' },
                icon: 'wallet'
            });
        }

        // ——— 4. Shipment-based alerts (batch query) ———
        const now = new Date();

        const [delayedCount, pendingCount, returnedCount, totalShipments] = await Promise.all([
            // Delayed: estimatedDelivery has passed but status is still active
            Shipment.countDocuments({
                user: req.user._id,
                status: { $in: ['in_transit', 'out_for_delivery'] },
                estimatedDelivery: { $lt: now }
            }),
            // Pending pickups
            Shipment.countDocuments({
                user: req.user._id,
                status: { $in: ['pending', 'pickup_scheduled'] }
            }),
            // Returned shipments (need attention)
            Shipment.countDocuments({
                user: req.user._id,
                status: 'returned'
            }),
            // Total shipments ever
            Shipment.countDocuments({ user: req.user._id })
        ]);

        if (delayedCount > 0) {
            alerts.push({
                id: 'shipments_delayed',
                type: 'warning',
                title: `${delayedCount} shipment${delayedCount > 1 ? 's' : ''} delayed`,
                description: 'These shipments have passed their estimated delivery date.',
                action: { label: 'View Shipments', href: '/shipments' },
                icon: 'clock'
            });
        }

        if (pendingCount > 0) {
            alerts.push({
                id: 'pending_pickups',
                type: 'info',
                title: `${pendingCount} pending pickup${pendingCount > 1 ? 's' : ''}`,
                description: 'Shipments awaiting pickup by the courier.',
                action: { label: 'View Pending', href: '/shipments' },
                icon: 'package'
            });
        }

        if (returnedCount > 0) {
            alerts.push({
                id: 'returned_shipments',
                type: 'warning',
                title: `${returnedCount} returned shipment${returnedCount > 1 ? 's' : ''}`,
                description: 'These shipments were returned and need your attention.',
                action: { label: 'View Returns', href: '/returns' },
                icon: 'undo'
            });
        }

        // ——— 5. New user — no shipments yet ———
        if (totalShipments === 0) {
            alerts.push({
                id: 'no_shipments',
                type: 'info',
                title: 'Create Your First Shipment',
                description: 'You haven\'t created any shipments yet. Get started now!',
                action: { label: 'New Shipment', href: '/shipment/new' },
                icon: 'plus'
            });
        }

        // Sort: critical first, then warning, then info
        const severityOrder = { critical: 0, warning: 1, info: 2 };
        alerts.sort((a, b) => severityOrder[a.type] - severityOrder[b.type]);

        res.json({
            success: true,
            alerts,
            count: alerts.length
        });

    } catch (error) {
        console.error('Alerts error:', error);
        res.status(500).json({ error: error.message });
    }
});

export default router;
