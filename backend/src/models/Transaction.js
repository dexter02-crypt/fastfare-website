import mongoose from 'mongoose';

const transactionSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    type: {
        type: String,
        enum: [
            'recharge',           // Wallet top-up via Cashfree
            'shipment_charge',    // Debit for shipment payment
            'refund',             // Refund credit
            'adjustment',         // Manual admin adjustment
            'withdrawal'          // Partner withdrawal
        ],
        required: true
    },
    amount: {
        type: Number,
        required: true
    },
    // Gateway references (supports both legacy Razorpay and active Cashfree)
    razorpayOrderId: { type: String },
    razorpayPaymentId: { type: String },
    razorpaySignature: { type: String },
    cashfreeOrderId: { type: String },
    gatewayPaymentId: { type: String },
    // Shipment reference for traceability
    shipmentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Shipment'
    },
    status: {
        type: String,
        enum: ['pending', 'completed', 'failed', 'reversed'],
        default: 'pending'
    },
    description: {
        type: String
    },
    // Balance snapshot for audit trail
    balanceBefore: {
        type: Number
    },
    balanceAfter: {
        type: Number
    },
    // Idempotency key to prevent duplicate processing
    idempotencyKey: {
        type: String,
        unique: true,
        sparse: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

transactionSchema.index({ userId: 1, createdAt: -1 });
transactionSchema.index({ shipmentId: 1 });

export default mongoose.model('Transaction', transactionSchema);
