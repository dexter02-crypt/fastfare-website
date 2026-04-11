import mongoose from 'mongoose';

const settlementSchema = new mongoose.Schema({
    orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true },
    partnerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    orderValue: { type: Number, required: true },
    platformFee: { type: Number, required: true },
    netAmount: { type: Number, required: true },
    settlementStatus: { 
        type: String, 
        enum: ['pending', 'processing', 'paid'], 
        default: 'pending' 
    },
    payoutDate: { type: Date, default: null },
    orderType: { type: String, enum: ['prepaid', 'cod'], default: 'prepaid' }
}, { timestamps: true });

settlementSchema.index({ partnerId: 1, createdAt: -1 });
settlementSchema.index({ settlementStatus: 1 });

export default mongoose.model('Settlement', settlementSchema);