import mongoose from 'mongoose';

const onboardingEventSchema = new mongoose.Schema({
    targetUserId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    targetRole: {
        type: String,
        enum: ['user', 'shipment_partner', 'driver', 'admin'],
        required: true
    },
    eventType: {
        type: String,
        enum: [
            'account_created',
            'profile_submitted',
            'profile_resubmitted',
            'digilocker_started',
            'digilocker_verified',
            'digilocker_failed',
            'auto_approved',
            'admin_approved',
            'admin_rejected',
            'needs_review',
            'needs_more_info',
            'reverification_requested',
            'suspended',
            'reactivated',
            'payout_eligibility_changed',
            'operationally_activated',
            'name_mismatch_flagged',
            'duplicate_identity_flagged',
            'review_flag_added',
            'review_flag_cleared'
        ],
        required: true
    },
    actorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    actorRole: {
        type: String,
        enum: ['admin', 'system', 'user', 'partner'],
        default: 'system'
    },
    previousStatus: String,
    newStatus: String,
    reason: String,
    note: String,
    referenceIds: {
        type: Object,
        default: {}
    },
    metadata: {
        type: Object,
        default: {}
    }
}, {
    timestamps: true
});

onboardingEventSchema.index({ targetUserId: 1, createdAt: -1 });
onboardingEventSchema.index({ eventType: 1, createdAt: -1 });
onboardingEventSchema.index({ actorId: 1, createdAt: -1 });

export default mongoose.model('OnboardingEvent', onboardingEventSchema);
