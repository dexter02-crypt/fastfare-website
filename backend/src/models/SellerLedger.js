import mongoose from 'mongoose';

const sellerLedgerSchema = new mongoose.Schema({
    sellerId: {
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
        enum: ['earning', 'deduction', 'settlement', 'refund', 'rto_charge', 'withdrawal', 'cod_collection'],
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
    // Tracks running balance at time of entry
    pendingBefore: { type: Number, default: 0 },
    pendingAfter: { type: Number, default: 0 },
    availableBefore: { type: Number, default: 0 },
    availableAfter: { type: Number, default: 0 },
    // Reference to settlement batch if applicable
    settlementId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'SettlementSchedule'
    },
    metadata: {
        type: Object,
        default: {}
    }
}, {
    timestamps: true
});

// Compound index for efficient seller-based queries
sellerLedgerSchema.index({ sellerId: 1, createdAt: -1 });
sellerLedgerSchema.index({ sellerId: 1, type: 1 });

export default mongoose.model('SellerLedger', sellerLedgerSchema);
