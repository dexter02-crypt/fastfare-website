import mongoose from 'mongoose';

const tierEvaluationLogSchema = new mongoose.Schema({
    sellerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    evaluationDate: {
        type: Date,
        required: true
    },
    evaluationPeriod: {
        start: Date,
        end: Date
    },
    previousTier: {
        type: String,
        enum: ['bronze', 'silver', 'gold'],
        required: true
    },
    newTier: {
        type: String,
        enum: ['bronze', 'silver', 'gold'],
        required: true
    },
    // Metrics used for evaluation
    monthlyOrders: { type: Number, default: 0 },
    deliveredOrders: { type: Number, default: 0 },
    rtoOrders: { type: Number, default: 0 },
    rtoPercent: { type: Number, default: 0 },
    cancelledOrders: { type: Number, default: 0 },
    reason: {
        type: String,
        required: true
    },
    autoUpgrade: {
        type: Boolean,
        default: true
    },
    // If manual, who triggered it
    triggeredBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
}, {
    timestamps: true
});

tierEvaluationLogSchema.index({ sellerId: 1, evaluationDate: -1 });

export default mongoose.model('TierEvaluationLog', tierEvaluationLogSchema);
