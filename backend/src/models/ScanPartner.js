import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const scanPartnerSchema = new mongoose.Schema({
    scanPartnerId: {
        type: String,
        unique: true,
        required: true
    },
    name: {
        type: String,
        required: true,
        trim: true
    },
    phone: {
        type: String,
        trim: true
    },
    password: {
        type: String,
        required: true
    },
    visiblePassword: { type: String }, // Stored for partner convenience
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    status: {
        type: String,
        enum: ['active', 'inactive'],
        default: 'active'
    }
}, { timestamps: true });

// Hash password before save
scanPartnerSchema.pre('save', async function (next) {
    if (!this.isModified('password')) return next();
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
});

// Compare password method
scanPartnerSchema.methods.comparePassword = async function (candidatePassword) {
    return bcrypt.compare(candidatePassword, this.password);
};

// Indexes
scanPartnerSchema.index({ createdBy: 1 });
scanPartnerSchema.index({ scanPartnerId: 1 });

const ScanPartner = mongoose.models.ScanPartner || mongoose.model('ScanPartner', scanPartnerSchema);
export default ScanPartner;
