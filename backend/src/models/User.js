import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
    businessName: {
        type: String,
        required: true,
        trim: true
    },
    gstin: {
        type: String,
        required: true,
        unique: true,
        uppercase: true
    },
    businessType: {
        type: String,
        enum: ['manufacturer', 'distributor', 'retailer', 'ecommerce', 'logistics'],
        required: true
    },
    contactPerson: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true
    },
    phone: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    isVerified: {
        type: Boolean,
        default: false
    },
    role: {
        type: String,
        enum: ['user', 'shipment_partner', 'admin'],
        default: 'user'
    },
    savedAddresses: [{
        name: String,
        phone: String,
        email: String,
        address: String,
        pincode: String,
        city: String,
        state: String,
        landmark: String,
        addressType: {
            type: String,
            enum: ['home', 'office', 'warehouse'],
            default: 'office'
        }
    }],
    walletBalance: {
        type: Number,
        default: 0,
        min: 0
    },
    kyc: {
        status: {
            type: String,
            enum: ['pending', 'in_progress', 'verified', 'rejected'],
            default: 'pending'
        },
        sessionId: String,
        sessionUrl: String,
        verifiedAt: Date,
        gstVerified: { type: Boolean, default: false },
        aadhaarVerified: { type: Boolean, default: false },
        phoneVerified: { type: Boolean, default: false },
        verificationData: {
            type: Object,
            default: {}
        }
    },
    tier: {
        type: String,
        enum: ['bronze', 'silver', 'gold'],
        default: 'bronze'
    },
    tierUpdatedAt: {
        type: Date,
        default: Date.now
    },
    platformFeePercent: {
        type: Number,
        default: 5,
        min: 0,
        max: 100
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Hash password before saving
userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) return next();
    this.password = await bcrypt.hash(this.password, 12);
    next();
});

// Compare password method
userSchema.methods.comparePassword = async function (candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};

export default mongoose.model('User', userSchema);
