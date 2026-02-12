import mongoose from 'mongoose';

const vehicleSchema = new mongoose.Schema({
    numberPlate: { type: String, required: true, unique: true },
    chassisNumber: { type: String, required: true, unique: true },
    engineNumber: { type: String },
    type: {
        type: String,
        enum: ['truck', 'van', 'bike', 'tempo', 'scooter'],
        required: true
    },
    capacity: {
        weight: { type: Number },
        volume: { type: Number }
    },
    documents: {
        rc: { url: String, expiry: Date },
        insurance: { url: String, expiry: Date },
        puc: { url: String, expiry: Date },
        fitness: { url: String, expiry: Date }
    },
    status: {
        type: String,
        enum: ['active', 'maintenance', 'retired'],
        default: 'active'
    },
    gpsTrackerId: { type: String },
    currentLocation: {
        lat: { type: Number },
        lng: { type: Number },
        lastUpdated: { type: Date }
    }
}, { timestamps: true });

const Vehicle = mongoose.models.Vehicle || mongoose.model('Vehicle', vehicleSchema);
export default Vehicle;
