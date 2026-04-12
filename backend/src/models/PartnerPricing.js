import mongoose from 'mongoose';

const serviceSchema = new mongoose.Schema({
    name: { type: String, required: true },
    type: { type: String, enum: ['standard', 'express', 'same_day'], default: 'standard' },
    basePrice: { type: Number, required: true, default: 80 },
    perKgRate: { type: Number, required: true, default: 20 },
    minWeight: { type: Number, default: 0.5 },
    maxWeight: { type: Number, default: 50 },
    estimatedDays: { type: String, default: '3-5 days' },
    codAvailable: { type: Boolean, default: true },
    codCharge: { type: Number, default: 30 },
    active: { type: Boolean, default: true },
}, { _id: true });

const pinRangeSchema = new mongoose.Schema({
    from: String,
    to: String,
}, { _id: false });

const coverageSchema = new mongoose.Schema({
    states: { type: [String], default: [] },
    cities: { type: [String], default: [] },
    pinRanges: { type: [pinRangeSchema], default: [] },
}, { _id: false });

const partnerPricingSchema = new mongoose.Schema({
    partnerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    companyName: { type: String },
    services: { type: [serviceSchema], default: [] },
    coverage: { type: coverageSchema, default: () => ({ states: ['All India'], cities: [], pinRanges: [] }) },
}, {
    timestamps: true,
});

// Index for fast lookups
partnerPricingSchema.index({ 'coverage.states': 1 });

const PartnerPricing = mongoose.model('PartnerPricing', partnerPricingSchema);
export default PartnerPricing;
