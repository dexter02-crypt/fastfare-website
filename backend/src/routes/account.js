import express from 'express';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { protect } from '../middleware/auth.js';
import User from '../models/User.js';
import Shipment from '../models/Shipment.js';
import AccountDeletionLog from '../models/AccountDeletionLog.js';
import { AccountDeletionOtp } from '../models/AccountDeletionOtp.js';
import { sendDeleteOtpEmail, sendDeleteConfirmationEmail } from '../lib/emails/accountDeletionEmails.js';

const router = express.Router();

// Mask email visually (e.g. sh***@***.com)
const maskEmail = (email) => {
    if (!email) return '';
    const [name, domain] = email.split('@');
    if (!name || !domain) return email;
    const maskedName = name.length > 2 ? name.substring(0, 2) + '*'.repeat(3) : name + '*'.repeat(3);
    const domainParts = domain.split('.');
    const ext = domainParts.pop();
    return `${maskedName}@***.${ext}`;
};

/**
 * @route   POST /api/account/delete/send-otp
 * @desc    Send 6-digit OTP to user's registered email (or Admin's email if Admin is deleting)
 * @access  Private
 */
router.post('/delete/send-otp', protect, async (req, res) => {
    try {
        const targetUserId = req.body.userId || req.user.id;
        const initiatingUserId = req.user.id;
        
        // Only allow admin to delete others, or self-deletion.
        if (req.user.role !== 'admin' && initiatingUserId !== targetUserId) {
            return res.status(403).json({ success: false, message: 'Forbidden' });
        }

        const targetUser = await User.findById(targetUserId);
        if (!targetUser) {
            return res.status(404).json({ success: false, message: 'Target user not found' });
        }

        // Who gets the OTP? The person initiating the request!
        const initiatingUser = initiatingUserId !== targetUserId ? await User.findById(initiatingUserId) : targetUser;

        // Generate 6 digit OTP securely
        const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
        const otpHash = await bcrypt.hash(otpCode, 10);
        
        // Expire in 10 minutes
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

        await AccountDeletionOtp.create({
            userId: initiatingUser._id,
            targetUserId: targetUser._id,
            otp_hash: otpHash,
            expires_at: expiresAt,
            attempts: 0,
            used: false
        });

        const name = targetUser.name || targetUser.businessName || 'Customer';
        const accountType = targetUser.role === 'shipment_partner' ? 'partner' : 'user';
        
        // Dispatch email to the INITIATOR
        await sendDeleteOtpEmail(initiatingUser.email, name, otpCode, accountType);

        return res.json({ 
            success: true, 
            maskedEmail: maskEmail(initiatingUser.email) 
        });

    } catch (err) {
        console.error('Send OTP Error:', err);
        return res.status(500).json({ success: false, message: 'Failed to send OTP' });
    }
});

/**
 * @route   POST /api/account/delete/verify-otp
 * @desc    Verify the submitted OTP against hashed DB record
 * @access  Private
 */
router.post('/delete/verify-otp', protect, async (req, res) => {
    try {
        const { otp, userId: targetId } = req.body;
        if (!otp) return res.status(400).json({ success: false, message: 'OTP is required' });

        const targetUserId = targetId || req.user.id;
        const initiatingUserId = req.user.id;
        
        if (req.user.role !== 'admin' && initiatingUserId !== targetUserId) {
            return res.status(403).json({ success: false, message: 'Forbidden' });
        }

        // Find the latest valid OTP that isn't expired and hasn't been used.
        // Even if attempts are maxed, we still fetch it to show the error.
        const otpRecord = await AccountDeletionOtp.findOne({ 
            userId: initiatingUserId,
            targetUserId: targetUserId,
            used: false,
            expires_at: { $gt: new Date() }
        }).sort({ createdAt: -1 });

        if (!otpRecord) {
            return res.status(400).json({ success: false, message: 'OTP expired or not found' });
        }

        // Check lock out
        if (otpRecord.attempts >= 3) {
            return res.status(429).json({ success: false, message: 'Too many incorrect attempts. Please wait 5 minutes before requesting a new OTP.' });
        }

        // Increment attempts regardless of success to prevent brute force
        otpRecord.attempts += 1;
        
        const isMatch = await bcrypt.compare(otp.toString(), otpRecord.otp_hash);
        if (!isMatch) {
            await otpRecord.save();
            return res.status(401).json({ success: false, message: 'Invalid OTP' });
        }

        // Mark as verified
        otpRecord.used = true;
        await otpRecord.save();

        return res.json({ success: true, message: 'OTP Verified' });

    } catch (err) {
        console.error('Verify OTP Error:', err);
        return res.status(500).json({ success: false, message: 'Failed to verify OTP' });
    }
});

/**
 * @route   POST /api/account/delete/execute
 * @desc    Execute the permanent DB deletion transaction post verification
 * @access  Private
 */
router.post('/delete/execute', protect, async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    
    try {
        const targetUserId = req.body.userId || req.user.id;
        const initiatingUserId = req.user.id;
        
        if (req.user.role !== 'admin' && initiatingUserId !== targetUserId) {
            await session.abortTransaction();
            return res.status(403).json({ success: false, message: 'Forbidden' });
        }

        // 1. Double-check OTP was actually verified in the last 15 minutes (or used = true recently)
        const recentOtp = await AccountDeletionOtp.findOne({
            userId: initiatingUserId,
            targetUserId: targetUserId,
            used: true
        }).sort({ updatedAt: -1 });

        if (!recentOtp) {
            await session.abortTransaction();
            return res.status(403).json({ success: false, message: 'OTP not verified' });
        }

        // 2. Fetch User
        const user = await User.findById(targetUserId).session(session);
        if (!user) {
            await session.abortTransaction();
            return res.status(404).json({ success: false, message: 'Target user not found' });
        }

        const email = user.email;
        const name = user.name || user.businessName || 'Customer';
        const accountType = user.role === 'shipment_partner' ? 'partner' : 'user';

        // 3. Cascade deletes
        await AccountDeletionOtp.deleteMany({ targetUserId }).session(session);
        
        // Delete shipments created by the user
        await Shipment.deleteMany({ createdBy: targetUserId }).session(session);
        
        // Finally, delete the User document
        await User.findByIdAndDelete(targetUserId).session(session);

        // Insert Audit Log
        await AccountDeletionLog.create([{
            deleted_user_email: email,
            deleted_by: initiatingUserId,
            account_type: accountType
        }], { session });

        await session.commitTransaction();
        session.endSession();

        // Send Final Disconnect Confirmation to TARGET user
        await sendDeleteConfirmationEmail(email, name, accountType, targetUserId);

        return res.json({ success: true, message: 'Account permanently deleted' });
        
    } catch (err) {
        await session.abortTransaction();
        session.endSession();
        console.error('Execute Deletion Error:', err);
        return res.status(500).json({ success: false, message: 'Failed to execute deletion' });
    }
});

export default router;
