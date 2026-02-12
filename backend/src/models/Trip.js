import mongoose from 'mongoose';

const tripSchema = new mongoose.Schema({
    tripId: { type: String, required: true, unique: true },

    vehicleId: { type: mongoose.Schema.Types.ObjectId, ref: 'Vehicle', required: true },
    driverId: { type: mongoose.Schema.Types.ObjectId, ref: 'WmsDriver', required: true },

    route: {
        origin: { type: String, required: true },
        destination: { type: String, required: true },
        stops: [{ type: String }],
        estimatedDistance: { type: Number },
        estimatedTime: { type: Number }
    },

    manifest: {
        shipmentIds: [{ type: String }],
        totalWeight: { type: Number }
    },

    status: {
        type: String,
        enum: ['scheduled', 'loading', 'in_transit', 'unloading', 'completed', 'cancelled', 'rtd'],
        default: 'scheduled'
    },

    startTime: { type: Date },
    endTime: { type: Date },

    logs: [{
        status: String,
        timestamp: { type: Date, default: Date.now },
        location: { lat: Number, lng: Number },
        note: String
    }]

}, { timestamps: true });

const Trip = mongoose.models.Trip || mongoose.model('Trip', tripSchema);
export default Trip;
