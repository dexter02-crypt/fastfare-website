import mongoose from 'mongoose';

const withdrawalRequestSchema = new mongoose.Schema({
    partnerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    amount: { type: Number, required: true, min: 1 },
    status: {
        type: String,
        enum: ['pending', 'approved', 'rejected', 'processing', 'completed'],
        default: 'pending'
    },
    bankDetails: {
        accountName: { type: String },
        accountNumber: { type: String },
        ifsc: { type: String },
        bankName: { type: String },
        upiId: { type: String }
    },
    // Admin fields
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    reviewedAt: { type: Date },
    adminNote: { type: String },
    rejectionReason: { type: String },
    // Transaction reference after payout
    transactionRef: { type: String },
    paidAt: { type: Date },
    // Partner balance snapshot
    balanceAtRequest: { type: Number, default: 0 },
    balanceAfterPayout: { type: Number, default: 0 }
}, { timestamps: true });

withdrawalRequestSchema.index({ partnerId: 1, status: 1 });
withdrawalRequestSchema.index({ status: 1, createdAt: -1 });

export default mongoose.model('WithdrawalRequest', withdrawalRequestSchema);
