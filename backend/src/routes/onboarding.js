import express from 'express';
import { protect } from '../middleware/auth.js';
import User from '../models/User.js';
import OnboardingEvent from '../models/OnboardingEvent.js';

const router = express.Router();

// ══════════════════════════════════════════════════
// GET /api/onboarding/status — Get own onboarding status
// ══════════════════════════════════════════════════
router.get('/status', protect, async (req, res) => {
    try {
        const user = await User.findById(req.user._id).select(
            'onboardingStatus verifiedIdentity nameMismatchFlag duplicateIdentityFlag ' +
            'reviewFlags payoutEligible operationallyActive onboardingRejectionReason ' +
            'onboardingReviewNotes onboardingApprovedAt role businessName contactPerson'
        );

        if (!user) return res.status(404).json({ error: 'User not found' });

        // Determine what's blocked for this user
        const blockedActions = [];
        const status = user.onboardingStatus || 'draft';

        if (user.role === 'shipment_partner') {
            if (!['approved'].includes(status)) {
                blockedActions.push('withdraw_funds', 'accept_orders');
            }
            if (!user.payoutEligible) {
                blockedActions.push('payout');
            }
        }

        if (status === 'suspended') {
            blockedActions.push('all_operations');
        }

        // Determine next steps for the user
        let nextStep = null;
        switch (status) {
            case 'draft':
                nextStep = { action: 'complete_profile', message: 'Complete your profile and verify with DigiLocker to get started.' };
                break;
            case 'submitted':
                nextStep = { action: 'wait', message: 'Your profile is under review. We\'ll notify you once approved.' };
                break;
            case 'digilocker_initiated':
                nextStep = { action: 'complete_digilocker', message: 'Complete your DigiLocker verification to proceed.' };
                break;
            case 'digilocker_verified':
                nextStep = user.role === 'shipment_partner'
                    ? { action: 'wait', message: 'Identity verified! Waiting for admin approval.' }
                    : { action: 'none', message: 'You\'re all set!' };
                break;
            case 'pending_review':
                nextStep = { action: 'wait', message: 'Your account is under review. This usually takes 1-2 business days.' };
                break;
            case 'approved':
                nextStep = { action: 'none', message: 'Your account is fully approved.' };
                break;
            case 'rejected':
                nextStep = { action: 'resubmit', message: `Your application was not approved. ${user.onboardingRejectionReason || 'Please update and resubmit.'}` };
                break;
            case 'needs_more_info':
                nextStep = { action: 'update_profile', message: `Additional information needed. ${user.onboardingReviewNotes || 'Please update your profile.'}` };
                break;
            case 'suspended':
                nextStep = { action: 'contact_support', message: 'Your account has been suspended. Contact support@fastfare.in for assistance.' };
                break;
            case 'reverification_required':
                nextStep = { action: 'reverify_digilocker', message: 'Please re-verify your identity through DigiLocker.' };
                break;
        }

        res.json({
            success: true,
            onboarding: {
                status,
                verifiedIdentity: {
                    source: user.verifiedIdentity?.source || 'none',
                    status: user.verifiedIdentity?.status || 'not_started',
                    fullName: user.verifiedIdentity?.fullName || null,
                    verifiedAt: user.verifiedIdentity?.verifiedAt || null,
                },
                flags: {
                    nameMismatch: user.nameMismatchFlag || false,
                    duplicateIdentity: user.duplicateIdentityFlag || false,
                    reviewFlags: user.reviewFlags || [],
                },
                payoutEligible: user.payoutEligible || false,
                operationallyActive: user.operationallyActive || false,
                approvedAt: user.onboardingApprovedAt || null,
                blockedActions,
                nextStep,
            }
        });
    } catch (error) {
        console.error('[Onboarding] Status fetch error:', error);
        res.status(500).json({ error: 'Failed to fetch onboarding status' });
    }
});

// ══════════════════════════════════════════════════
// POST /api/onboarding/submit — Submit profile for review
// ══════════════════════════════════════════════════
router.post('/submit', protect, async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        if (!user) return res.status(404).json({ error: 'User not found' });

        const allowedStatuses = ['draft', 'rejected', 'needs_more_info', 'reverification_required'];
        if (!allowedStatuses.includes(user.onboardingStatus || 'draft')) {
            return res.status(400).json({ error: `Cannot submit from current status: ${user.onboardingStatus}` });
        }

        // Validate completeness
        const missing = [];
        if (!user.businessName) missing.push('Business Name');
        if (!user.email) missing.push('Email');
        if (!user.phone) missing.push('Phone');
        if (!user.businessType) missing.push('Business Type');
        if (!user.contactPerson) missing.push('Contact Person');

        if (user.role === 'shipment_partner') {
            if (!user.partnerDetails?.zone && !user.partnerDetails?.city) missing.push('Service Zone/City');
        }

        if (missing.length > 0) {
            return res.status(400).json({
                error: 'Profile incomplete. Please fill in all required fields.',
                missingFields: missing
            });
        }

        const previousStatus = user.onboardingStatus || 'draft';
        const isResubmit = ['rejected', 'needs_more_info'].includes(previousStatus);

        // If DigiLocker verified + user role (not partner) + no flags → auto-approve
        const canAutoApprove = (
            user.verifiedIdentity?.status === 'verified' &&
            user.role === 'user' &&
            !user.nameMismatchFlag &&
            !user.duplicateIdentityFlag &&
            (user.verifiedIdentity?.attemptCount || 0) <= 3
        );

        if (canAutoApprove) {
            user.onboardingStatus = 'approved';
            user.onboardingApprovedAt = new Date();
            user.payoutEligible = true;
            user.operationallyActive = true;

            await OnboardingEvent.create({
                targetUserId: user._id,
                targetRole: user.role,
                eventType: 'auto_approved',
                actorRole: 'system',
                previousStatus,
                newStatus: 'approved',
                reason: 'Auto-approved: DigiLocker verified, no flags, user role',
            });
        } else {
            user.onboardingStatus = 'pending_review';
            user.onboardingSubmittedAt = new Date();
            user.onboardingRejectionReason = undefined;

            await OnboardingEvent.create({
                targetUserId: user._id,
                targetRole: user.role,
                eventType: isResubmit ? 'profile_resubmitted' : 'profile_submitted',
                actorId: user._id,
                actorRole: user.role === 'shipment_partner' ? 'partner' : 'user',
                previousStatus,
                newStatus: 'pending_review',
                reason: isResubmit ? 'Profile resubmitted after corrections' : 'Initial profile submission',
            });
        }

        await user.save();

        res.json({
            success: true,
            onboardingStatus: user.onboardingStatus,
            message: canAutoApprove
                ? 'Your account has been automatically approved!'
                : 'Profile submitted for review. You\'ll be notified once approved.'
        });
    } catch (error) {
        console.error('[Onboarding] Submit error:', error);
        res.status(500).json({ error: 'Failed to submit profile' });
    }
});

// ══════════════════════════════════════════════════
// POST /api/onboarding/resubmit — Resubmit after rejection/needs-more-info
// ══════════════════════════════════════════════════
router.post('/resubmit', protect, async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        if (!user) return res.status(404).json({ error: 'User not found' });

        const allowedStatuses = ['rejected', 'needs_more_info'];
        if (!allowedStatuses.includes(user.onboardingStatus)) {
            return res.status(400).json({ error: `Cannot resubmit from current status: ${user.onboardingStatus}` });
        }

        const previousStatus = user.onboardingStatus;
        user.onboardingStatus = 'pending_review';
        user.onboardingSubmittedAt = new Date();
        user.onboardingRejectionReason = undefined;
        user.onboardingReviewNotes = undefined;

        await user.save();

        await OnboardingEvent.create({
            targetUserId: user._id,
            targetRole: user.role,
            eventType: 'profile_resubmitted',
            actorId: user._id,
            actorRole: user.role === 'shipment_partner' ? 'partner' : 'user',
            previousStatus,
            newStatus: 'pending_review',
            reason: 'Resubmitted after corrections',
        });

        res.json({
            success: true,
            onboardingStatus: user.onboardingStatus,
            message: 'Profile resubmitted for review.'
        });
    } catch (error) {
        console.error('[Onboarding] Resubmit error:', error);
        res.status(500).json({ error: 'Failed to resubmit profile' });
    }
});

export default router;
