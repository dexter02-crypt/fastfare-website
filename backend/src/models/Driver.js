import mongoose from 'mongoose';

const driverSchema = new mongoose.Schema({
    fullName: {
        type: String,
        required: [true, 'Full name is required'],
        trim: true
    },
    mobile: {
        type: String,
        required: [true, 'Mobile number is required'],
        validate: {
            validator: function(v) {
                return /^[6-9]\d{9}$/.test(v);
            },
            message: 'Mobile must be a valid 10-digit Indian number'
        }
    },
    dlNo: {
        type: String,
        required: [true, 'DL number is required'],
        uppercase: true,
        trim: true
    },
    aadhaar: {
        type: String,
        required: [true, 'Aadhaar number is required'],
        validate: {
            validator: function(v) {
                return /^\d{12}$/.test(v);
            },
            message: 'Aadhaar must be exactly 12 digits'
        }
    },
    photo: {
        type: String, // File path
        default: null
    },
    status: {
        type: String,
        enum: ['active', 'inactive'],
        default: 'active' // Auto-approved
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Index for faster queries
driverSchema.index({ createdBy: 1 });
driverSchema.index({ mobile: 1 });

export default mongoose.model('Driver', driverSchema);
