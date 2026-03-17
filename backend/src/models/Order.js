import mongoose from 'mongoose';

const orderSchema = new mongoose.Schema({
    orderId: { type: String, required: true, unique: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    customer: {
        name: { type: String, required: true },
        phone: { type: String, required: true },
        email: { type: String }
    },
    address: {
        line1: { type: String, required: true },
        line2: { type: String },
        city: { type: String, required: true },
        state: { type: String, required: true },
        pincode: { type: String, required: true }
    },
    items: [{
        name: String, qty: Number, unitPrice: Number, total: Number
    }],
    orderValue: { type: Number, required: true },
    paymentStatus: { type: String, enum: ['Paid', 'Unpaid', 'COD Pending', 'Refunded'], default: 'Unpaid' },
    orderStatus: { type: String, enum: ['New', 'Pending', 'Confirmed', 'Processing', 'Shipped', 'Delivered', 'Cancelled'], default: 'New' },
    channel: { type: String, enum: ['Manual', 'Shopify', 'WooCommerce', 'Custom', 'API', 'Marketplace'], default: 'Manual' },
    notes: { type: String },
    linkedAwb: { type: String, default: null }
}, { timestamps: true });

export default mongoose.model('Order', orderSchema);
