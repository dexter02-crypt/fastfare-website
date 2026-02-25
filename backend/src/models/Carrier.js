import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const carrierSchema = new mongoose.Schema({
    businessName: { type: String, required: true, trim: true },
    contactPerson: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    phone: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    gstin: { type: String, uppercase: true, sparse: true },
    panNumber: { type: String, uppercase: true },

    fleetDetails: {
        totalVehicles: { type: Number, default: 0 },
        vehicleTypes: [{ type: String, enum: ['bike', 'auto', 'mini_truck', 'truck', 'large_truck', 'tempo'] }]
    },

    serviceZones: [{
        state: String,
        pincodes: [String]          // specific pincodes or ranges like "110001-110099"
    }],

    supportedTypes: [{
        type: String,
        enum: ['standard', 'express', 'overnight', 'economy', 'fragile']
    }],

    baseFare: { type: Number, default: 99 },
    perKgRate: { type: Number, default: 10 },
    rating: { type: Number, default: 4.0, min: 0, max: 5 },
    eta: { type: String, default: '3-5 days' },
    features: [String],             // e.g. ["Real-time tracking", "COD available"]

    webhookUrl: { type: String, default: '' },
    callbackUrl: { type: String, default: '' },  // URL for carrier to push status updates back
    apiKey: { type: String, default: '' },         // API key for authenticating inbound carrier webhooks
    isActive: { type: Boolean, default: false },   // soft-toggle; set true on approval

    status: {
        type: String,
        enum: ['pending_approval', 'approved', 'rejected', 'suspended'],
        default: 'pending_approval'
    },
    rejectionReason: String,
    approvedAt: Date,
    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },

    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

// Hash password
carrierSchema.pre('save', async function (next) {
    if (!this.isModified('password')) return next();
    this.password = await bcrypt.hash(this.password, 12);
    this.updatedAt = Date.now();
    next();
});

carrierSchema.methods.comparePassword = async function (candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};

export default mongoose.model('Carrier', carrierSchema);
