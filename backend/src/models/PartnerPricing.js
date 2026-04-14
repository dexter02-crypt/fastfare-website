import mongoose from 'mongoose';

const serviceSchema = new mongoose.Schema({
    name: { type: String, required: true, maxlength: 60 },
    type: {
        type: String,
        enum: ['same_day', 'next_day', '2_day_express', 'standard', 'economy', 'hyperlocal'],
        default: 'standard'
    },
    basePrice: { type: Number, required: true, default: 80, min: 0 },
    perKgRate: { type: Number, required: true, default: 20, min: 0 },
    minWeight: { type: Number, default: 0.5, min: 0.01 },
    maxWeight: { type: Number, default: 50 },
    estimatedDays: { type: String, default: '3-5 days' },
    codAvailable: { type: Boolean, default: true },
    codCharge: { type: Number, default: 30, min: 0 },
    active: { type: Boolean, default: true },
    deletedAt: { type: Date, default: null },
}, { _id: true, timestamps: true });

const pinRangeSchema = new mongoose.Schema({
    from: { type: String, match: /^\d{6}$/ },
    to: { type: String, match: /^\d{6}$/ },
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
    coverage: { type: coverageSchema, default: () => ({ states: [], cities: [], pinRanges: [] }) },
}, {
    timestamps: true,
});

// Index for fast lookups
partnerPricingSchema.index({ 'coverage.states': 1 });

const PartnerPricing = mongoose.model('PartnerPricing', partnerPricingSchema);
export default PartnerPricing;
