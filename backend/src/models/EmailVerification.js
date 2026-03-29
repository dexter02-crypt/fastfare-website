import mongoose from "mongoose";

const emailVerificationSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        trim: true,
        lowercase: true,
    },
    otpHash: {
        type: String,
        required: true,
    },
    purpose: {
        type: String,
        required: true,
        default: "registration",
    },
    expiresAt: {
        type: Date,
        required: true,
        expires: 0 // TTL index to automatically delete expired documents
    },
    used: {
        type: Boolean,
        default: false
    },
    attempts: {
        type: Number,
        default: 0
    }
}, { timestamps: true });

export const EmailVerification = mongoose.model('EmailVerification', emailVerificationSchema);
