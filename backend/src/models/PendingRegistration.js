import mongoose from 'mongoose';

const pendingRegistrationSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        lowercase: true,
        trim: true
    },
    businessName: { type: String, required: true },
    businessType: { type: String, required: true },
    contactPerson: { type: String, required: true },
    phone: { type: String, required: true },
    gstin: { type: String },
    
    // DigiLocker Status fields
    status: {
        type: String,
        enum: ['pending_digilocker', 'digilocker_verified'],
        default: 'pending_digilocker'
    },
    digilocker_verified: { type: Boolean, default: false },
    digilocker_verified_at: { type: Date },
    digilocker_id: { type: String },
    kyc_name: { type: String },
    kyc_dob: { type: String },
    kyc_gender: { type: String },

    createdAt: {
        type: Date,
        default: Date.now,
        expires: 1800 // 30 minutes
    }
});

export const PendingRegistration = mongoose.model('PendingRegistration', pendingRegistrationSchema);
