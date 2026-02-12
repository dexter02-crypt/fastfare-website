import mongoose from 'mongoose';

const orderStatusHistorySchema = new mongoose.Schema({
    orderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Shipment',
        required: true,
        index: true
    },
    previousStatus: {
        type: String,
        required: true
    },
    newStatus: {
        type: String,
        required: true
    },
    changedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    changedByRole: {
        type: String,
        enum: ['system', 'admin', 'seller', 'partner'],
        default: 'system'
    },
    source: {
        type: String,
        enum: ['system', 'admin_panel', 'partner_panel', 'seller_dashboard', 'api', 'cron'],
        default: 'system'
    },
    metadata: {
        type: Object,
        default: {}
    }
}, {
    timestamps: true
});

orderStatusHistorySchema.index({ orderId: 1, createdAt: 1 });

export default mongoose.model('OrderStatusHistory', orderStatusHistorySchema);
