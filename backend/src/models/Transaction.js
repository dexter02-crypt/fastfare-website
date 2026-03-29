import mongoose from 'mongoose';

const transactionSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    type: {
        type: String,
        enum: ['recharge', 'shipment_charge', 'refund'],
        required: true
    },
    amount: {
        type: Number,
        required: true
    },
    razorpayOrderId: {
        type: String
    },
    razorpayPaymentId: {
        type: String
    },
    razorpaySignature: {
        type: String
    },
    status: {
        type: String,
        enum: ['pending', 'completed', 'failed'],
        default: 'pending'
    },
    description: {
        type: String
    },
    balanceBefore: {
        type: Number
    },
    balanceAfter: {
        type: Number
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

export default mongoose.model('Transaction', transactionSchema);
