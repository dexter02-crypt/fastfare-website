import mongoose from 'mongoose';

const rtdSchema = new mongoose.Schema({
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    rtdId: { type: String, required: true, unique: true },
    shipmentId: { type: String, required: true },

    tripId: { type: mongoose.Schema.Types.ObjectId, ref: 'Trip' },
    driverId: { type: mongoose.Schema.Types.ObjectId, ref: 'WmsDriver' },
    vehicleId: { type: mongoose.Schema.Types.ObjectId, ref: 'Vehicle' },

    reasonCode: {
        type: String,
        enum: [
            'CUSTOMER_NA',
            'ADDRESS_ISSUE',
            'REFUSED',
            'FAILED_ATTEMPTS',
            'DAMAGED',
            'REGULATORY',
            'RESCHEDULED',
            'UNSERVICEABLE',
            'OTHER'
        ],
        required: true
    },

    description: { type: String },

    proof: {
        images: [{ type: String }],
        signature: { type: String }
    },

    status: {
        type: String,
        enum: ['reported', 'received_at_depot', 'analyzed', 'restocked', 'rescheduled', 'discarded'],
        default: 'reported'
    },

    resolution: {
        action: { type: String },
        resolvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        resolvedAt: { type: Date }
    }

}, { timestamps: true });

const RTD = mongoose.models.RTD || mongoose.model('RTD', rtdSchema);
export default RTD;
