import mongoose from 'mongoose';

const paymentWebhookLogSchema = new mongoose.Schema({
    // Cashfree order reference
    order_id: {
        type: String,
        index: true
    },
    cf_payment_id: {
        type: String
    },
    // Event metadata
    event_type: {
        type: String,
        required: true
    },
    payment_status: {
        type: String
    },
    order_status: {
        type: String
    },
    amount: {
        type: Number
    },
    // Signature verification
    signature_valid: {
        type: Boolean,
        default: false
    },
    // Processing outcome
    processing_status: {
        type: String,
        enum: ['received', 'processed', 'skipped', 'failed', 'duplicate'],
        default: 'received'
    },
    processing_result: {
        type: String
    },
    error_reason: {
        type: String
    },
    // Raw data for debugging
    raw_headers: {
        type: Object
    },
    raw_payload: {
        type: Object
    },
    // Source metadata
    source_ip: {
        type: String
    },
    processed_at: {
        type: Date
    }
}, {
    timestamps: true
});

paymentWebhookLogSchema.index({ createdAt: -1 });
paymentWebhookLogSchema.index({ processing_status: 1 });
paymentWebhookLogSchema.index({ order_id: 1, processing_status: 1 });

export default mongoose.model('PaymentWebhookLog', paymentWebhookLogSchema);
