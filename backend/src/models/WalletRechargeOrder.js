import mongoose from 'mongoose';

const walletRechargeOrderSchema = new mongoose.Schema({
    order_id: {
        type: String,
        required: true,
        unique: true
    },
    cashfree_order_id: {
        type: String
    },
    cashfree_payment_session_id: {
        type: String
    },
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    amount: {
        type: Number,
        required: true
    },
    currency: {
        type: String,
        default: 'INR'
    },
    status: {
        type: String,
        enum: ['initiated', 'pending', 'paid', 'failed', 'cancelled', 'refunded', 'amount_mismatch'],
        required: true
    },
    payment_method: {
        type: String
    },
    cashfree_payment_id: {
        type: String
    },
    wallet_credited: {
        type: Boolean,
        default: false
    },
    wallet_credited_at: {
        type: Date
    },
    failure_reason: {
        type: String
    },
    ip_address: {
        type: String
    }
}, {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

const WalletRechargeOrder = mongoose.model('WalletRechargeOrder', walletRechargeOrderSchema);

export default WalletRechargeOrder;
