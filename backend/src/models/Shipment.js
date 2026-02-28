import mongoose from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

const packageSchema = new mongoose.Schema({
    name: String,
    quantity: { type: Number, default: 1 },
    weight: { type: Number, required: true },
    length: Number,
    width: Number,
    height: Number,
    value: { type: Number, default: 0 }
});

const addressSchema = new mongoose.Schema({
    name: { type: String, required: true },
    phone: { type: String, required: true },
    email: String,
    address: { type: String, required: true },
    pincode: { type: String, required: true },
    city: String,
    state: String,
    landmark: String,
    addressType: {
        type: String,
        enum: ['home', 'office', 'warehouse'],
        default: 'office'
    }
});

const shipmentSchema = new mongoose.Schema({
    awb: {
        type: String,
        unique: true,
        default: () => `FF${Date.now().toString(36).toUpperCase()}${uuidv4().slice(0, 4).toUpperCase()}`
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    pickup: addressSchema,
    delivery: addressSchema,
    packages: [packageSchema],
    contentType: {
        type: String,
        enum: ['documents', 'electronics', 'clothing', 'fragile', 'food', 'medicine', 'other'],
        required: true
    },
    description: String,
    paymentMode: {
        type: String,
        enum: ['prepaid', 'cod', 'razorpay', 'wallet'],
        default: 'prepaid'
    },
    codAmount: { type: Number, default: 0 },
    serviceType: {
        type: String,
        enum: ['standard', 'express', 'overnight', 'economy'],
        default: 'standard'
    },
    carrier: String,
    carrierId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },
    insurance: { type: Boolean, default: false },
    fragileHandling: { type: Boolean, default: false },
    signatureRequired: { type: Boolean, default: false },
    scheduledPickup: { type: Boolean, default: false },
    pickupDate: Date,
    pickupSlot: String,
    assignedDriver: { type: String, default: null },   // Driver ID from mobile app
    assignedDriverName: { type: String, default: null },
    assignedVehicle: { type: String, default: null },
    status: {
        type: String,
        enum: ['pending', 'pending_acceptance', 'accepted', 'rejected_by_carrier', 'pickup_scheduled', 'picked_up', 'in_transit', 'out_for_delivery', 'delivered', 'cancelled', 'returned'],
        default: 'pending'
    },
    trackingHistory: [{
        status: String,
        location: String,
        description: String,
        timestamp: { type: Date, default: Date.now }
    }],
    estimatedDelivery: Date,
    actualDelivery: Date,
    totalWeight: Number,
    totalValue: Number,
    shippingCost: Number,
    platformFee: { type: Number, default: 0 },
    grossTotal: { type: Number, default: 0 },
    promoDiscount: { type: Number, default: 0 },
    finalPayable: { type: Number, default: 0 },
    promoType: { type: String, enum: ['AUTO_APPLIED', 'NONE', null], default: null },
    sellerEarning: { type: Number, default: 0 },
    settlementStatus: {
        type: String,
        enum: ['not_applicable', 'pending', 'scheduled', 'settled', 'held', 'cancelled'],
        default: 'not_applicable'
    },
    settlementDate: Date,
    rtoCharges: { type: Number, default: 0 },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Calculate totals before saving
shipmentSchema.pre('save', function (next) {
    if (this.packages && this.packages.length > 0) {
        this.totalWeight = this.packages.reduce((sum, pkg) => sum + (pkg.weight * pkg.quantity), 0);
        this.totalValue = this.packages.reduce((sum, pkg) => sum + (pkg.value * pkg.quantity), 0);
    }
    this.updatedAt = Date.now();
    next();
});

export default mongoose.model('Shipment', shipmentSchema);
