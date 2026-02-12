import mongoose from 'mongoose';

const codCollectionSchema = new mongoose.Schema({
    orderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Shipment',
        required: true
    },
    sellerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    partnerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    codAmount: {
        type: Number,
        required: true
    },
    collectedAmount: {
        type: Number,
        default: 0
    },
    shippingCharge: {
        type: Number,
        default: 0
    },
    platformFee: {
        type: Number,
        default: 0
    },
    codHandlingFee: {
        type: Number,
        default: 0
    },
    // Net = collectedAmount - shippingCharge - platformFee - codHandlingFee
    netSettlement: {
        type: Number,
        default: 0
    },
    remittanceStatus: {
        type: String,
        enum: ['pending', 'collected', 'remitted', 'reconciled', 'disputed'],
        default: 'pending'
    },
    collectedAt: Date,
    remittedAt: Date,
    reconciledAt: Date,
    discrepancyAmount: { type: Number, default: 0 },
    discrepancyReason: String
}, {
    timestamps: true
});

codCollectionSchema.index({ sellerId: 1, remittanceStatus: 1 });
codCollectionSchema.index({ partnerId: 1, remittanceStatus: 1 });

export default mongoose.model('CODCollection', codCollectionSchema);
