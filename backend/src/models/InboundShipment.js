import mongoose from 'mongoose';

const inboundShipmentSchema = new mongoose.Schema({
    shipmentId: { type: String, required: true, unique: true },
    provider: { type: String },
    expectedArrival: { type: Date },
    actualArrival: { type: Date },
    vehicleId: { type: mongoose.Schema.Types.ObjectId, ref: 'Vehicle' },
    items: [{
        name: String,
        quantity: Number,
        sku: String
    }],
    notes: { type: String },
    status: {
        type: String,
        enum: ['scheduled', 'in_transit', 'arrived', 'unloading', 'completed', 'cancelled'],
        default: 'scheduled'
    }
}, { timestamps: true });

export default mongoose.model('InboundShipment', inboundShipmentSchema);
