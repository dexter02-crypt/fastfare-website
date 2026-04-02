import mongoose from 'mongoose';

const kycAttemptSchema = new mongoose.Schema({
    attempt_id: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: false, // Could be unauthenticated before registration completes
        index: true
    },
    pending_reg_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'PendingRegistration',
        required: false
    },
    verification_source: {
        type: String,
        enum: ['DigiLocker', 'Manual', 'Aadhaar_OTP', 'Other'],
        default: 'DigiLocker'
    },
    started_at: {
        type: Date,
        default: Date.now
    },
    callback_received_at: Date,
    state_validated_at: Date,
    token_exchange_status: {
        type: String,
        enum: ['pending', 'success', 'failed'],
        default: 'pending'
    },
    digilocker_fetch_status: {
        type: String,
        enum: ['pending', 'success', 'failed'],
        default: 'pending'
    },
    persistence_status: {
        type: String,
        enum: ['pending', 'success', 'failed'],
        default: 'pending'
    },
    final_status: {
        type: String,
        enum: ['initiated', 'processing', 'success', 'failed', 'abandoned'],
        default: 'initiated'
    },
    internal_error_reason: String,
    digilocker_reference_id: String
}, {
    timestamps: true
});

export default mongoose.model('KycAttempt', kycAttemptSchema);
