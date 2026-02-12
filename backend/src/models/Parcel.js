import mongoose from 'mongoose';

const parcelSchema = new mongoose.Schema({
    parcelId: { type: String, unique: true },
    barcode: { type: String, required: true, index: true },
    orderId: { type: String },
    awb: { type: String },
    packageName: { type: String },
    packageDescription: { type: String },
    contentType: { type: String },
    weight: { type: Number },
    quantity: { type: Number, default: 1 },

    sender: {
        name: String,
        phone: String,
        address: String,
        city: String,
        pincode: String
    },
    receiver: {
        name: String,
        phone: String,
        address: String,
        city: String,
        pincode: String
    },

    status: {
        type: String,
        enum: ['scanned', 'in_warehouse', 'dispatched', 'in_transit', 'out_for_delivery', 'delivered', 'returned', 'failed'],
        default: 'scanned'
    },

    scannedBy: {
        partnerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Partner' },
        name: String
    },

    assignedDriver: { type: mongoose.Schema.Types.ObjectId, ref: 'WmsDriver' },
    tripId: { type: mongoose.Schema.Types.ObjectId, ref: 'Trip' },

    scannedAt: { type: Date, default: Date.now },
    deliveredAt: { type: Date },
    deliveredTo: { type: String },
    deliveryNotes: { type: String },
    photoProof: { type: String }
}, { timestamps: true });

// Auto-generate parcelId
parcelSchema.pre('save', async function (next) {
    if (!this.parcelId) {
        const count = await mongoose.model('Parcel').countDocuments();
        this.parcelId = `PCL-${String(count + 1).padStart(6, '0')}`;
    }
    next();
});

const Parcel = mongoose.models.Parcel || mongoose.model('Parcel', parcelSchema);

export default Parcel;
