import express from 'express';
import crypto from 'crypto';
import User from '../models/User.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// Create a verification session with Didit (Hosted Flow for Aadhaar)
router.post('/create-session', protect, async (req, res) => {
    try {
        const userId = req.user._id;
        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Check if already verified
        if (user.kyc?.status === 'verified') {
            return res.status(400).json({
                error: 'KYC already verified',
                kyc: user.kyc
            });
        }

        console.log('[Didit] Creating session for user:', userId);

        // Create session with Didit API
        const diditResponse = await fetch(`${process.env.DIDIT_API_URL}/session/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': process.env.DIDIT_API_KEY
            },
            body: JSON.stringify({
                // Ensure this workflow_id in .env is correct for Aadhaar verification
                workflow_id: process.env.DIDIT_WORKFLOW_ID,
                vendor_data: userId.toString(),
                callback: `${process.env.BACKEND_URL || 'http://localhost:3000'}/api/kyc/webhook`
            })
        });

        const sessionData = await diditResponse.json();

        if (!diditResponse.ok) {
            console.error('Didit Create Session Error:', sessionData);
            throw new Error(sessionData.message || sessionData.detail || 'Failed to create verification session');
        }

        // Update user with session info
        user.kyc = {
            ...user.kyc,
            status: 'in_progress',
            sessionId: sessionData.session_id,
            sessionUrl: sessionData.url
        };
        await user.save();

        res.json({
            success: true,
            sessionId: sessionData.session_id,
            verificationUrl: sessionData.url,
            message: 'Verification session created'
        });
    } catch (error) {
        console.error('Create session error:', error);
        res.status(500).json({ error: error.message || 'Failed to create verification session' });
    }
});

// Get KYC status
router.get('/status', protect, async (req, res) => {
    try {
        const userId = req.user._id;
        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json({
            success: true,
            kyc: {
                status: user.kyc?.status || 'pending',
                gstVerified: user.kyc?.gstVerified || false,
                aadhaarVerified: user.kyc?.aadhaarVerified || false,
                phoneVerified: user.kyc?.phoneVerified || false,
                verifiedAt: user.kyc?.verifiedAt,
                sessionUrl: user.kyc?.sessionUrl
            }
        });
    } catch (error) {
        console.error('Get status error:', error);
        res.status(500).json({ error: 'Failed to get KYC status' });
    }
});

// Webhook to receive Didit verification callbacks
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
    try {
        // Verify webhook signature
        const signature = req.headers['x-signature'];
        const webhookSecret = process.env.DIDIT_WEBHOOK_SECRET;

        if (signature && webhookSecret) {
            const hmac = crypto.createHmac('sha256', webhookSecret);
            const expectedSignature = hmac.update(req.body).digest('hex');

            if (signature !== expectedSignature) {
                console.error('Invalid webhook signature');
                return res.status(401).json({ error: 'Invalid signature' });
            }
        }

        // Parse the body if it's a buffer
        const payload = typeof req.body === 'string' ? JSON.parse(req.body) :
            Buffer.isBuffer(req.body) ? JSON.parse(req.body.toString()) : req.body;

        console.log('Didit webhook received:', payload);

        const { session_id, status, vendor_data } = payload;

        if (!vendor_data) {
            console.error('No vendor_data in webhook payload');
            return res.status(400).json({ error: 'Missing vendor_data' });
        }

        // Find user by vendor_data (which is userId)
        const user = await User.findById(vendor_data);

        if (!user) {
            console.error('User not found for vendor_data:', vendor_data);
            return res.status(404).json({ error: 'User not found' });
        }

        // Map Didit status to our status
        let kycStatus = 'pending';
        if (status === 'Approved') {
            kycStatus = 'verified';
        } else if (status === 'Declined' || status === 'Abandoned') {
            kycStatus = 'rejected';
        } else if (status === 'In Progress' || status === 'Pending Review') {
            kycStatus = 'in_progress';
        }

        // Update user KYC status
        user.kyc = {
            ...user.kyc,
            status: kycStatus,
            sessionId: session_id,
            verifiedAt: kycStatus === 'verified' ? new Date() : user.kyc?.verifiedAt,
            // If the workflow approves, it means Aadhaar is verified (depending on workflow config)
            aadhaarVerified: kycStatus === 'verified' ? true : user.kyc?.aadhaarVerified,
            verificationData: payload
        };
        await user.save();

        console.log(`KYC status updated for user ${vendor_data}: ${kycStatus}`);

        res.json({ success: true, message: 'Webhook processed' });
    } catch (error) {
        console.error('Webhook error:', error);
        res.status(500).json({ error: 'Failed to process webhook' });
    }
});

// Manually update KYC status (for testing/admin purposes)
router.post('/update-status', protect, async (req, res) => {
    try {
        const userId = req.user._id;
        const { status, gstVerified, aadhaarVerified, phoneVerified } = req.body;

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        user.kyc = {
            ...user.kyc,
            status: status || user.kyc?.status,
            gstVerified: gstVerified !== undefined ? gstVerified : user.kyc?.gstVerified,
            aadhaarVerified: aadhaarVerified !== undefined ? aadhaarVerified : user.kyc?.aadhaarVerified,
            phoneVerified: phoneVerified !== undefined ? phoneVerified : user.kyc?.phoneVerified,
            verifiedAt: status === 'verified' ? new Date() : user.kyc?.verifiedAt
        };
        await user.save();

        res.json({
            success: true,
            kyc: user.kyc
        });
    } catch (error) {
        console.error('Update status error:', error);
        res.status(500).json({ error: 'Failed to update status' });
    }
});

export default router;
