import mongoose from 'mongoose';

const webhookLogSchema = new mongoose.Schema({
    carrierId: { type: mongoose.Schema.Types.ObjectId, ref: 'Carrier', required: true },
    shipmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Shipment' },
    event: { type: String, required: true },    // e.g. 'shipment.assigned', 'shipment.cancelled'
    webhookUrl: String,
    payload: Object,
    response: {
        status: Number,
        body: String
    },
    deliveryStatus: {
        type: String,
        enum: ['pending', 'success', 'failed'],
        default: 'pending'
    },
    attempts: { type: Number, default: 0 },
    maxAttempts: { type: Number, default: 3 },
    nextRetryAt: Date,
    lastAttemptAt: Date,
    completedAt: Date,
    error: String,
    createdAt: { type: Date, default: Date.now }
});

webhookLogSchema.index({ carrierId: 1, createdAt: -1 });
webhookLogSchema.index({ deliveryStatus: 1, nextRetryAt: 1 });

export default mongoose.model('WebhookLog', webhookLogSchema);
