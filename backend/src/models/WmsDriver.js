import mongoose from 'mongoose';

const wmsDriverSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    driverId: {
        type: String,
        unique: true,
        sparse: true
    },
    name: { type: String, required: true },
    phone: { type: String, required: true },
    emergencyPhone: { type: String },
    email: { type: String, unique: true },
    password: { type: String, required: true },
    visiblePassword: { type: String }, // Stored for partner convenience (less secure)
    avatar: { type: String },

    license: {
        number: { type: String, required: true, unique: true },
        type: { type: String },
        expiry: { type: Date, required: true },
        documentUrl: { type: String }
    },

    identity: {
        aadhaar: { type: String },
        pan: { type: String },
        bloodGroup: { type: String }
    },

    verificationStatus: {
        type: String,
        enum: ['pending', 'verified', 'banned'],
        default: 'pending'
    },

    status: {
        type: String,
        enum: ['active', 'on_leave', 'terminated', 'on_trip'],
        default: 'active'
    },

    currentVehicleId: { type: mongoose.Schema.Types.ObjectId, ref: 'Vehicle' },

    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    is_online: { type: Boolean, default: false },
    current_location_lat: { type: Number, default: null },
    current_location_lng: { type: Number, default: null },
    location_updated_at: { type: Date, default: null },
    active_shipment_count: { type: Number, default: 0 }

}, { timestamps: true });

// Use the same collection name 'drivers' as the PC software
const WmsDriver = mongoose.models.WmsDriver || mongoose.model('WmsDriver', wmsDriverSchema, 'wmsdrivers');
export default WmsDriver;
