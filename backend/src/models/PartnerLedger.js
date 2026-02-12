import mongoose from 'mongoose';

const partnerLedgerSchema = new mongoose.Schema({
    partnerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    orderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Shipment'
    },
    type: {
        type: String,
        enum: ['earning', 'deduction', 'payout', 'cod_collection', 'cod_remittance', 'penalty', 'bonus'],
        required: true
    },
    amount: {
        type: Number,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    // Payout computation details
    distance: { type: Number, default: 0 },
    partnerRate: { type: Number, default: 0 },
    slabAdd: { type: Number, default: 0 },
    // Running balance
    balanceBefore: { type: Number, default: 0 },
    balanceAfter: { type: Number, default: 0 },
    // Payout reference
    payoutReference: String,
    payoutMethod: {
        type: String,
        enum: ['bank_transfer', 'upi', 'wallet']
    },
    metadata: {
        type: Object,
        default: {}
    }
}, {
    timestamps: true
});

partnerLedgerSchema.index({ partnerId: 1, createdAt: -1 });
partnerLedgerSchema.index({ partnerId: 1, type: 1 });

export default mongoose.model('PartnerLedger', partnerLedgerSchema);
