import mongoose from 'mongoose';

const truckSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Truck name is required'],
        trim: true
    },
    chassisNo: {
        type: String,
        required: [true, 'Chassis number is required'],
        unique: true,
        uppercase: true,
        trim: true
    },
    rcNo: {
        type: String,
        required: [true, 'RC number is required'],
        uppercase: true,
        trim: true
    },
    dlNo: {
        type: String,
        required: [true, 'DL number is required'],
        uppercase: true,
        trim: true
    },
    // New metadata fields
    vehicleType: {
        type: String,
        enum: ['mini_truck', 'pickup', 'light_truck', 'medium_truck', 'heavy_truck', 'trailer', 'container'],
        default: 'light_truck'
    },
    capacity: {
        type: String,
        trim: true // e.g., "1 Ton", "5 Ton", "10 Ton"
    },
    manufacturer: {
        type: String,
        trim: true // e.g., "Tata", "Mahindra", "Ashok Leyland"
    },
    model: {
        type: String,
        trim: true // e.g., "407", "Bolero Pickup"
    },
    year: {
        type: Number,
        min: 1990,
        max: new Date().getFullYear() + 1
    },
    color: {
        type: String,
        trim: true
    },
    insuranceNo: {
        type: String,
        uppercase: true,
        trim: true
    },
    insuranceExpiry: {
        type: Date
    },
    permitNo: {
        type: String,
        uppercase: true,
        trim: true
    },
    permitExpiry: {
        type: Date
    },
    fitnessExpiry: {
        type: Date
    },
    // End new metadata fields
    photos: [{
        type: String // File paths
    }],
    status: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        default: 'pending'
    },
    rejectionReason: {
        type: String,
        default: null
    },
    approvedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },
    approvedAt: {
        type: Date,
        default: null
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Update timestamp on save
truckSchema.pre('save', function (next) {
    this.updatedAt = new Date();
    next();
});

// Index for faster queries
truckSchema.index({ status: 1 });
truckSchema.index({ createdBy: 1 });


export default mongoose.model('Truck', truckSchema);
