import mongoose from 'mongoose';

const settlementScheduleSchema = new mongoose.Schema({
    sellerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    tier: {
        type: String,
        enum: ['bronze', 'silver', 'gold'],
        required: true
    },
    orderIds: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Shipment'
    }],
    totalAmount: {
        type: Number,
        required: true,
        min: 0
    },
    settlementDate: {
        type: Date,
        required: true,
        index: true
    },
    status: {
        type: String,
        enum: ['scheduled', 'processing', 'completed', 'failed', 'held'],
        default: 'scheduled'
    },
    processedAt: Date,
    payoutReference: String,
    payoutMethod: {
        type: String,
        enum: ['bank_transfer', 'upi', 'wallet'],
        default: 'bank_transfer'
    },
    failureReason: String,
    holdReason: String,
    releasedAt: Date
}, {
    timestamps: true
});

settlementScheduleSchema.index({ status: 1, settlementDate: 1 });
settlementScheduleSchema.index({ sellerId: 1, status: 1 });

export default mongoose.model('SettlementSchedule', settlementScheduleSchema);
