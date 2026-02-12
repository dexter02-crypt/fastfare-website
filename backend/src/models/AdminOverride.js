import mongoose from 'mongoose';

const adminOverrideSchema = new mongoose.Schema({
    adminId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    targetType: {
        type: String,
        enum: ['seller', 'partner', 'order', 'settlement'],
        required: true
    },
    targetId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true
    },
    action: {
        type: String,
        enum: ['tier_override', 'settlement_adjust', 'payout_hold', 'payout_release', 'ledger_correction', 'account_suspend', 'account_activate'],
        required: true
    },
    previousValue: {
        type: mongoose.Schema.Types.Mixed
    },
    newValue: {
        type: mongoose.Schema.Types.Mixed
    },
    reason: {
        type: String,
        required: true
    },
    metadata: {
        type: Object,
        default: {}
    }
}, {
    timestamps: true
});

adminOverrideSchema.index({ adminId: 1, createdAt: -1 });
adminOverrideSchema.index({ targetType: 1, targetId: 1 });

export default mongoose.model('AdminOverride', adminOverrideSchema);
