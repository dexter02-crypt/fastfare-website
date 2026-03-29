import mongoose from 'mongoose';

const organizationSchema = new mongoose.Schema({
    ownerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    name: { type: String, required: true },
    gstin: { type: String },
    pan: { type: String },
    phone: { type: String },
    address: { type: String },
    city: { type: String },
    state: { type: String },
    stateCode: { type: String },
    pinCode: { type: String }
}, { timestamps: true });

const Organization = mongoose.model('Organization', organizationSchema);

export default Organization;
