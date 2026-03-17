import mongoose from 'mongoose';

const weightAnomalySchema = new mongoose.Schema({
    shipment_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Shipment',
        required: true
    },
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    declared_weight: { type: Number, required: true },
    scanned_weight: { type: Number, required: true },
    volumetric_weight: { type: Number, required: true },
    chargeable_weight: { type: Number, required: true },
    original_charge: { type: Number, required: true },
    revised_charge: { type: Number, required: true },
    extra_billed: { type: Number, required: true },
    dispute_deadline: { type: Date, required: true },
    status: {
        type: String,
        enum: ['Open', 'Disputed', 'Resolved — Refunded', 'Confirmed Anomaly'],
        default: 'Open'
    },
    dispute_reason: { type: String, default: null },
    disputed_at: { type: Date, default: null },
    resolved_at: { type: Date, default: null },
    refund_amount: { type: Number, default: 0 },
    created_at: {
        type: Date,
        default: Date.now
    }
});

export default mongoose.model('WeightAnomaly', weightAnomalySchema);
