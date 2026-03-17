import mongoose from 'mongoose';

const reversePickupSchema = new mongoose.Schema({
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    shipment_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Shipment',
        required: true
    },
    pickup_address: { type: String, required: true },
    contact_name: { type: String, required: true },
    contact_phone: { type: String, required: true },
    package_description: { type: String, default: '' },
    status: {
        type: String,
        enum: ['Requested', 'Assigned', 'Picked Up', 'Delivered Back'],
        default: 'Requested'
    },
    created_at: {
        type: Date,
        default: Date.now
    }
});

export default mongoose.model('ReversePickup', reversePickupSchema);
