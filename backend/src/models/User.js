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
        required: false,
        unique: true,
        sparse: true,
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
        label: String,
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
            enum: ['home', 'office', 'warehouse', 'other'],
            default: 'office'
        }
    }],
    partnerDetails: {
        zone: String,
        address: String,
        city: String,
        state: String,
        aadhaar: String,
        fleetDetails: {
            totalVehicles: { type: Number, default: 0 },
            vehicleTypes: [{ type: String, enum: ['bike', 'auto', 'mini_truck', 'truck', 'large_truck', 'tempo'] }]
        },
        serviceZones: [{
            state: String,
            pincodes: [String]
        }],
        supportedTypes: [{
            type: String,
            enum: ['standard', 'express', 'overnight', 'economy', 'fragile']
        }],
        baseFare: { type: Number, default: 99 },
        perKgRate: { type: Number, default: 10 },
        rating: { type: Number, default: 4.0, min: 0, max: 5 },
        eta: { type: String, default: '3-5 days' },
        features: [String],
        webhookUrl: { type: String, default: '' },
        callbackUrl: { type: String, default: '' },
        apiKey: { type: String, default: '' },
        status: {
            type: String,
            enum: ['pending_approval', 'approved', 'rejected', 'suspended'],
            default: 'pending_approval'
        },
        rejectionReason: String,
        approvedAt: Date,
        approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
    },
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
    resetPasswordToken: String,
    resetPasswordExpires: Date,
    emailVerificationCode: String,
    emailVerificationExpires: Date,
    emailVerified: { type: Boolean, default: false },
    notificationPreferences: {
        emailShipmentUpdates: { type: Boolean, default: true },
        emailBilling: { type: Boolean, default: true },
        emailMarketing: { type: Boolean, default: false },
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
