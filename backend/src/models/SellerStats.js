import mongoose from 'mongoose';

const sellerStatsSchema = new mongoose.Schema({
    sellerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true,
        index: true
    },
    totalOrders: { type: Number, default: 0 },
    deliveredOrders: { type: Number, default: 0 },
    rtoOrders: { type: Number, default: 0 },
    cancelledOrders: { type: Number, default: 0 },
    inTransitOrders: { type: Number, default: 0 },
    pendingOrders: { type: Number, default: 0 },
    // Financial totals
    grossRevenue: { type: Number, default: 0 },
    totalShippingCost: { type: Number, default: 0 },
    totalPlatformFees: { type: Number, default: 0 },
    totalRtoCharges: { type: Number, default: 0 },
    // Settlement buckets
    totalSettled: { type: Number, default: 0 },
    pendingSettlement: { type: Number, default: 0 },
    availableForWithdrawal: { type: Number, default: 0 },
    // COD specific
    totalCodCollected: { type: Number, default: 0 },
    pendingCodRemittance: { type: Number, default: 0 },
    // Tier info
    currentTier: {
        type: String,
        enum: ['bronze', 'silver', 'gold'],
        default: 'bronze'
    },
    nextSettlementDate: Date,
    // Performance metrics
    rtoPercent: { type: Number, default: 0 },
    deliverySuccessRate: { type: Number, default: 0 },
    averageDeliveryDays: { type: Number, default: 0 },
    // Monthly rolling metrics (for tier evaluation)
    monthlyOrders: { type: Number, default: 0 },
    monthlyDelivered: { type: Number, default: 0 },
    monthlyRto: { type: Number, default: 0 },
    monthlyResetDate: { type: Date, default: Date.now },
    lastUpdated: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

export default mongoose.model('SellerStats', sellerStatsSchema);
