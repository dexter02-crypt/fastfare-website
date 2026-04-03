import express from 'express';
import { protect, admin } from '../middleware/auth.js';
import User from '../models/User.js';
import AdminOverride from '../models/AdminOverride.js';
import SellerStats from '../models/SellerStats.js';
import SellerLedger from '../models/SellerLedger.js';
import SettlementSchedule from '../models/SettlementSchedule.js';
import TierEvaluationLog from '../models/TierEvaluationLog.js';
import PartnerLedger from '../models/PartnerLedger.js';
import WithdrawalRequest from '../models/WithdrawalRequest.js';
import OnboardingEvent from '../models/OnboardingEvent.js';
import { 
    sendOnboardingApprovedEmail, 
    sendOnboardingRejectedEmail, 
    sendOnboardingNeedsMoreInfoEmail,
    sendOnboardingSuspendedEmail,
    sendReverificationRequiredEmail
} from '../utils/emailSender.js';

const router = express.Router();

// ══════════════════════════════════════════════════
// GET /api/admin/partners
// List all shipment partners with balance info
// ══════════════════════════════════════════════════
router.get('/partners', protect, admin, async (req, res) => {
    try {
        const { page = 1, limit = 20, search, tier } = req.query;
        const skip = (parseInt(page) - 1) * parseInt(limit);

        const query = { role: 'shipment_partner' };
        if (tier) query.tier = tier;
        if (search) {
            query.$or = [
                { businessName: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } },
                { phone: { $regex: search, $options: 'i' } }
            ];
        }

        const [partners, total] = await Promise.all([
            User.find(query)
                .select('businessName email phone tier tierUpdatedAt platformFeePercent createdAt isActive')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(parseInt(limit)),
            User.countDocuments(query)
        ]);

        // Enrich with balance data
        const enriched = await Promise.all(partners.map(async (p) => {
            const lastLedger = await PartnerLedger.findOne({ partnerId: p._id }).sort({ createdAt: -1 });
            const pendingWithdrawal = await WithdrawalRequest.findOne({ partnerId: p._id, status: 'pending' });
            const totalEarnings = await PartnerLedger.aggregate([
                { $match: { partnerId: p._id, type: 'earning' } },
                { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } }
            ]);
            const totalPayouts = await PartnerLedger.aggregate([
                { $match: { partnerId: p._id, type: 'payout' } },
                { $group: { _id: null, total: { $sum: '$amount' } } }
            ]);

            return {
                ...p.toObject(),
                balance: lastLedger ? lastLedger.balanceAfter : 0,
                totalEarnings: totalEarnings[0]?.total || 0,
                totalTrips: totalEarnings[0]?.count || 0,
                totalPayouts: totalPayouts[0]?.total || 0,
                pendingWithdrawal: pendingWithdrawal ? { id: pendingWithdrawal._id, amount: pendingWithdrawal.amount } : null
            };
        }));

        // Summary counts
        const [totalPartners, bronzeCount, silverCount, goldCount, pendingWithdrawals] = await Promise.all([
            User.countDocuments({ role: 'shipment_partner' }),
            User.countDocuments({ role: 'shipment_partner', tier: 'bronze' }),
            User.countDocuments({ role: 'shipment_partner', tier: 'silver' }),
            User.countDocuments({ role: 'shipment_partner', tier: 'gold' }),
            WithdrawalRequest.countDocuments({ status: 'pending' })
        ]);

        res.json({
            success: true,
            partners: enriched,
            summary: { total: totalPartners, bronze: bronzeCount, silver: silverCount, gold: goldCount, pendingWithdrawals },
            pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / parseInt(limit)) }
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ══════════════════════════════════════════════════
// GET /api/admin/partners/:id
// Get single partner detail with financial breakdown
// ══════════════════════════════════════════════════
router.get('/partners/:id', protect, admin, async (req, res) => {
    try {
        const partner = await User.findById(req.params.id).select('-password');
        if (!partner || partner.role !== 'shipment_partner') {
            return res.status(404).json({ error: 'Partner not found' });
        }

        const [ledger, withdrawals, lastEntry] = await Promise.all([
            PartnerLedger.find({ partnerId: partner._id }).sort({ createdAt: -1 }).limit(20),
            WithdrawalRequest.find({ partnerId: partner._id }).sort({ createdAt: -1 }),
            PartnerLedger.findOne({ partnerId: partner._id }).sort({ createdAt: -1 })
        ]);

        res.json({
            success: true,
            partner: {
                ...partner.toObject(),
                balance: lastEntry ? lastEntry.balanceAfter : 0,
                ledger,
                withdrawals
            }
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ══════════════════════════════════════════════════
// PUT /api/admin/partners/:id/status
// Hold, restrict, or reactivate a partner/user account
// ══════════════════════════════════════════════════
router.put('/partners/:id/status', protect, admin, async (req, res) => {
    try {
        const { status, reason } = req.body;
        if (!['active', 'held', 'restricted'].includes(status)) {
            return res.status(400).json({ error: 'Invalid status. Use active, held, or restricted' });
        }
        if (!reason) return res.status(400).json({ error: 'Reason is required' });

        const account = await User.findById(req.params.id);
        if (!account) return res.status(404).json({ error: 'Account not found' });

        const previousStatus = account.accountStatus || 'active';

        account.accountStatus = status;
        account.isActive = status === 'active';
        account.statusReason = reason;
        account.statusUpdatedAt = new Date();
        account.statusUpdatedBy = req.user._id;
        await account.save();

        await AdminOverride.create({
            adminId: req.user._id,
            targetType: account.role === 'shipment_partner' ? 'partner' : 'user',
            targetId: account._id,
            action: `account_${status}`,
            previousValue: { status: previousStatus },
            newValue: { status },
            reason
        });

        res.json({
            success: true,
            message: `Account ${status === 'active' ? 'reactivated' : status} successfully`,
            account: {
                _id: account._id,
                businessName: account.businessName,
                email: account.email,
                accountStatus: account.accountStatus,
                isActive: account.isActive
            }
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ══════════════════════════════════════════════════
// DELETE /api/admin/partners/:id
// Permanently remove a partner or user account
// ══════════════════════════════════════════════════
router.delete('/partners/:id', protect, admin, async (req, res) => {
    try {
        const { reason } = req.body;
        if (!reason) return res.status(400).json({ error: 'Reason is required for account deletion' });

        const account = await User.findById(req.params.id);
        if (!account) return res.status(404).json({ error: 'Account not found' });
        if (account.role === 'admin') return res.status(403).json({ error: 'Cannot delete admin accounts' });

        // Log before deletion
        await AdminOverride.create({
            adminId: req.user._id,
            targetType: account.role === 'shipment_partner' ? 'partner' : 'user',
            targetId: account._id,
            action: 'account_deleted',
            previousValue: { email: account.email, businessName: account.businessName, role: account.role },
            newValue: null,
            reason
        });

        await User.findByIdAndDelete(req.params.id);

        res.json({
            success: true,
            message: `Account ${account.businessName || account.email} has been permanently deleted`
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ══════════════════════════════════════════════════
// POST /api/admin/override/tier
// Manual tier override for a seller
// ══════════════════════════════════════════════════
router.post('/override/tier', protect, admin, async (req, res) => {
    try {
        const { sellerId, newTier, reason } = req.body;

        if (!['bronze', 'silver', 'gold'].includes(newTier)) {
            return res.status(400).json({ error: 'Invalid tier value' });
        }
        if (!reason) return res.status(400).json({ error: 'Reason is required' });

        const seller = await User.findById(sellerId);
        if (!seller) return res.status(404).json({ error: 'Seller not found' });

        const previousTier = seller.tier;

        // Update seller
        seller.tier = newTier;
        seller.tierUpdatedAt = new Date();
        await seller.save();

        // Update stats
        await SellerStats.findOneAndUpdate(
            { sellerId },
            { currentTier: newTier },
            { upsert: true }
        );

        // Log override
        const override = await AdminOverride.create({
            adminId: req.user._id,
            targetType: 'seller',
            targetId: sellerId,
            action: 'tier_override',
            previousValue: previousTier,
            newValue: newTier,
            reason
        });

        // Log tier evaluation
        await TierEvaluationLog.create({
            sellerId,
            evaluationDate: new Date(),
            previousTier,
            newTier,
            reason: `Admin override: ${reason}`,
            autoUpgrade: false,
            triggeredBy: req.user._id
        });

        res.json({
            success: true,
            override: {
                id: override._id,
                previousTier,
                newTier,
                reason
            }
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ══════════════════════════════════════════════════
// POST /api/admin/override/settlement
// Adjust a settlement amount or status
// ══════════════════════════════════════════════════
router.post('/override/settlement', protect, admin, async (req, res) => {
    try {
        const { settlementId, action, amount, reason } = req.body;
        if (!reason) return res.status(400).json({ error: 'Reason is required' });

        const schedule = await SettlementSchedule.findById(settlementId);
        if (!schedule) return res.status(404).json({ error: 'Settlement not found' });

        const previousValue = { status: schedule.status, amount: schedule.totalAmount };

        if (action === 'hold') {
            schedule.status = 'held';
            schedule.holdReason = reason;
        } else if (action === 'release') {
            schedule.status = 'scheduled';
            schedule.holdReason = null;
            schedule.releasedAt = new Date();
        } else if (action === 'adjust' && amount !== undefined) {
            schedule.totalAmount = amount;
        } else {
            return res.status(400).json({ error: 'Invalid action. Use hold, release, or adjust' });
        }

        await schedule.save();

        await AdminOverride.create({
            adminId: req.user._id,
            targetType: 'settlement',
            targetId: settlementId,
            action: 'settlement_adjust',
            previousValue,
            newValue: { status: schedule.status, amount: schedule.totalAmount },
            reason
        });

        res.json({ success: true, settlement: schedule });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ══════════════════════════════════════════════════
// POST /api/admin/override/payout-hold
// Hold or release partner payout
// ══════════════════════════════════════════════════
router.post('/override/payout-hold', protect, admin, async (req, res) => {
    try {
        const { partnerId, action, reason } = req.body;
        if (!reason) return res.status(400).json({ error: 'Reason is required' });

        const partner = await User.findById(partnerId);
        if (!partner) return res.status(404).json({ error: 'Partner not found' });

        const overrideAction = action === 'hold' ? 'payout_hold' : 'payout_release';

        await AdminOverride.create({
            adminId: req.user._id,
            targetType: 'partner',
            targetId: partnerId,
            action: overrideAction,
            previousValue: null,
            newValue: { action },
            reason
        });

        res.json({
            success: true,
            message: `Partner payout ${action === 'hold' ? 'held' : 'released'} successfully`,
            partnerId,
            action: overrideAction
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ══════════════════════════════════════════════════
// POST /api/admin/override/ledger-correction
// Add a manual ledger correction entry
// ══════════════════════════════════════════════════
router.post('/override/ledger-correction', protect, admin, async (req, res) => {
    try {
        const { sellerId, amount, description, reason } = req.body;
        if (!reason || !description) {
            return res.status(400).json({ error: 'Reason and description are required' });
        }

        const stats = await SellerStats.findOne({ sellerId });
        const pendingBefore = stats ? stats.pendingSettlement : 0;
        const availableBefore = stats ? stats.availableForWithdrawal : 0;

        // Positive amount = credit, negative = debit
        const entry = await SellerLedger.create({
            sellerId,
            type: amount >= 0 ? 'refund' : 'deduction',
            amount: Math.abs(amount),
            description: `[Admin Correction] ${description}`,
            pendingBefore,
            pendingAfter: pendingBefore,
            availableBefore,
            availableAfter: availableBefore + amount
        });

        // Update stats
        if (stats) {
            stats.availableForWithdrawal += amount;
            stats.lastUpdated = new Date();
            await stats.save();
        }

        await AdminOverride.create({
            adminId: req.user._id,
            targetType: 'seller',
            targetId: sellerId,
            action: 'ledger_correction',
            previousValue: { available: availableBefore },
            newValue: { available: availableBefore + amount },
            reason
        });

        res.json({ success: true, entry });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ══════════════════════════════════════════════════
// GET /api/admin/overrides
// Override audit log with pagination
// ══════════════════════════════════════════════════
router.get('/overrides', protect, admin, async (req, res) => {
    try {
        const { page = 1, limit = 50, targetType, action } = req.query;
        const skip = (parseInt(page) - 1) * parseInt(limit);

        const query = {};
        if (targetType) query.targetType = targetType;
        if (action) query.action = action;

        const [overrides, total] = await Promise.all([
            AdminOverride.find(query)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(parseInt(limit))
                .populate('adminId', 'businessName email'),
            AdminOverride.countDocuments(query)
        ]);

        res.json({
            success: true,
            overrides,
            pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / parseInt(limit)) }
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ══════════════════════════════════════════════════
// GET /api/admin/onboarding/queue
// Get paginated queue of pending onboarding requests
// ══════════════════════════════════════════════════
router.get('/onboarding/queue', protect, admin, async (req, res) => {
    try {
        const { page = 1, limit = 20, status, role, hasFlags } = req.query;
        const skip = (parseInt(page) - 1) * parseInt(limit);

        const query = {
            onboardingStatus: { $in: ['submitted', 'pending_review', 'needs_more_info', 'reverification_required'] },
            role: { $in: ['user', 'shipment_partner'] } 
        };

        if (status) query.onboardingStatus = status;
        if (role) query.role = role;
        if (hasFlags === 'true') {
            query.$or = [
                { nameMismatchFlag: true },
                { duplicateIdentityFlag: true },
                { 'reviewFlags.0': { $exists: true } }
            ];
        }

        const [users, total] = await Promise.all([
            User.find(query)
                .select('businessName contactPerson email role onboardingStatus verifiedIdentity nameMismatchFlag duplicateIdentityFlag reviewFlags onboardingSubmittedAt createdAt')
                .sort({ onboardingSubmittedAt: 1, createdAt: 1 })
                .skip(skip)
                .limit(parseInt(limit)),
            User.countDocuments(query)
        ]);

        res.json({
            success: true,
            queue: users,
            pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / parseInt(limit)) }
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ══════════════════════════════════════════════════
// GET /api/admin/onboarding/:id
// Get full onboarding details for a user
// ══════════════════════════════════════════════════
router.get('/onboarding/:id', protect, admin, async (req, res) => {
    try {
        const user = await User.findById(req.params.id).select('-password');
        if (!user) return res.status(404).json({ error: 'User not found' });

        const events = await OnboardingEvent.find({ targetUserId: user._id })
            .sort({ createdAt: -1 })
            .populate('actorId', 'businessName email');

        res.json({
            success: true,
            user,
            events
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Helper for logging onboarding events from admin
const logAdminOnboardingEvent = async (adminId, userId, userRole, actionType, prevStatus, newStatus, reason, notes) => {
    await OnboardingEvent.create({
        targetUserId: userId,
        targetRole: userRole,
        eventType: actionType,
        actorId: adminId,
        actorRole: 'admin',
        previousStatus: prevStatus,
        newStatus: newStatus,
        reason,
        note: notes
    });
};

// ══════════════════════════════════════════════════
// POST /api/admin/onboarding/:id/approve
// Approve a user/partner
// ══════════════════════════════════════════════════
router.post('/onboarding/:id/approve', protect, admin, async (req, res) => {
    try {
        const { notes } = req.body;
        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ error: 'User not found' });

        const previousStatus = user.onboardingStatus;
        if (previousStatus === 'approved') return res.status(400).json({ error: 'Account is already approved' });

        user.onboardingStatus = 'approved';
        user.onboardingApprovedAt = new Date();
        user.onboardingApprovedBy = req.user._id;
        user.payoutEligible = true;
        user.operationallyActive = true;
        
        await user.save();

        await logAdminOnboardingEvent(req.user._id, user._id, user.role, 'admin_approved', previousStatus, 'approved', 'Admin reviewed and approved account', notes);
        
        // Send email
        await sendOnboardingApprovedEmail(user.email, user.contactPerson || user.businessName, user.role);

        res.json({ success: true, message: 'Account approved successfully', onboardingStatus: 'approved' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ══════════════════════════════════════════════════
// POST /api/admin/onboarding/:id/reject
// Reject a user/partner
// ══════════════════════════════════════════════════
router.post('/onboarding/:id/reject', protect, admin, async (req, res) => {
    try {
        const { reason, notes } = req.body;
        if (!reason) return res.status(400).json({ error: 'Reason is required for rejection' });

        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ error: 'User not found' });

        const previousStatus = user.onboardingStatus;
        
        user.onboardingStatus = 'rejected';
        user.onboardingRejectedAt = new Date();
        user.onboardingRejectionReason = reason;
        user.onboardingReviewNotes = notes || '';
        
        await user.save();

        await logAdminOnboardingEvent(req.user._id, user._id, user.role, 'admin_rejected', previousStatus, 'rejected', reason, notes);
        
        // Send email
        await sendOnboardingRejectedEmail(user.email, user.contactPerson || user.businessName, reason, user.role);

        res.json({ success: true, message: 'Account rejected', onboardingStatus: 'rejected' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ══════════════════════════════════════════════════
// POST /api/admin/onboarding/:id/needs-more-info
// Request more info from user/partner
// ══════════════════════════════════════════════════
router.post('/onboarding/:id/needs-more-info', protect, admin, async (req, res) => {
    try {
        const { notes } = req.body;
        if (!notes) return res.status(400).json({ error: 'Notes describing what info is needed are required' });

        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ error: 'User not found' });

        const previousStatus = user.onboardingStatus;
        
        user.onboardingStatus = 'needs_more_info';
        user.onboardingReviewNotes = notes;
        
        await user.save();

        await logAdminOnboardingEvent(req.user._id, user._id, user.role, 'needs_more_info', previousStatus, 'needs_more_info', 'Requested additional information', notes);
        
        // Send email
        await sendOnboardingNeedsMoreInfoEmail(user.email, user.contactPerson || user.businessName, notes);

        res.json({ success: true, message: 'Requested more info', onboardingStatus: 'needs_more_info' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ══════════════════════════════════════════════════
// POST /api/admin/onboarding/:id/suspend
// Suspend an account
// ══════════════════════════════════════════════════
router.post('/onboarding/:id/suspend', protect, admin, async (req, res) => {
    try {
        const { reason, notes } = req.body;
        if (!reason) return res.status(400).json({ error: 'Reason required for suspension' });

        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ error: 'User not found' });

        const previousStatus = user.onboardingStatus;
        
        user.onboardingStatus = 'suspended';
        user.statusReason = reason;
        
        await user.save();

        await logAdminOnboardingEvent(req.user._id, user._id, user.role, 'suspended', previousStatus, 'suspended', reason, notes);
        
        // Send email
        await sendOnboardingSuspendedEmail(user.email, user.contactPerson || user.businessName, reason);

        res.json({ success: true, message: 'Account suspended', onboardingStatus: 'suspended' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ══════════════════════════════════════════════════
// POST /api/admin/onboarding/:id/request-reverification
// Force user to redo DigiLocker verification
// ══════════════════════════════════════════════════
router.post('/onboarding/:id/request-reverification', protect, admin, async (req, res) => {
    try {
        const { reason, notes } = req.body;
        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ error: 'User not found' });

        const previousStatus = user.onboardingStatus;
        
        user.onboardingStatus = 'reverification_required';
        user.verifiedIdentity.status = 'failed';
        user.verifiedIdentity.failureReason = reason || 'Admin requested reverification';
        
        await user.save();

        await logAdminOnboardingEvent(req.user._id, user._id, user.role, 'reverification_requested', previousStatus, 'reverification_required', reason || 'Admin requested reverification', notes);
        
        // Send email
        await sendReverificationRequiredEmail(user.email, user.contactPerson || user.businessName);

        res.json({ success: true, message: 'Requested reverification', onboardingStatus: 'reverification_required' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

export default router;
