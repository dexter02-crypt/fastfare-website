import express from 'express';
import { protect } from '../middleware/auth.js';
import PartnerPricing from '../models/PartnerPricing.js';
import User from '../models/User.js';

const router = express.Router();

// ─── Middleware: ensure user is a shipment_partner or admin ───────────────────
const partnerProtect = (req, res, next) => {
    if (!req.user) return res.status(401).json({ success: false, message: 'Not authenticated' });
    if (req.user.role !== 'shipment_partner' && req.user.role !== 'admin') {
        return res.status(403).json({ success: false, message: 'Partner access required' });
    }
    next();
};

// ─── GET /api/partner/pricing ─────────────────────────────────────────────────
// Returns current partner's pricing config (creates default if none exists)
router.get('/', protect, partnerProtect, async (req, res) => {
    try {
        const partnerId = req.user._id;
        let pricing = await PartnerPricing.findOne({ partnerId }).lean();

        if (!pricing) {
            // Return empty structure so frontend can show a blank form
            pricing = {
                partnerId,
                companyName: req.user.businessName || '',
                services: [],
                coverage: { states: [], cities: [], pinRanges: [] },
            };
        } else {
            // Filter out soft-deleted services for non-admin
            pricing.services = (pricing.services || []).filter(s => !s.deletedAt);
        }

        // Include onboarding status
        const pricingOnboarded = req.user.pricingOnboarded || false;

        res.json({ success: true, pricing, pricingOnboarded });
    } catch (error) {
        console.error('Get partner pricing error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// ─── POST /api/partner/pricing ────────────────────────────────────────────────
// Save/update partner pricing config (upsert) — legacy endpoint kept for compat
router.post('/', protect, partnerProtect, async (req, res) => {
    try {
        const partnerId = req.user._id;
        const { services, coverage, companyName } = req.body;

        const pricing = await PartnerPricing.findOneAndUpdate(
            { partnerId },
            {
                partnerId,
                companyName: companyName || req.user.businessName || '',
                services: services || [],
                coverage: coverage || { states: [], cities: [], pinRanges: [] },
            },
            { upsert: true, new: true, runValidators: true }
        );

        res.json({ success: true, pricing, message: 'Pricing configuration saved successfully' });
    } catch (error) {
        console.error('Save partner pricing error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// ─── POST /api/partner/pricing/services ───────────────────────────────────────
// Create a new service for the authenticated partner
router.post('/services', protect, partnerProtect, async (req, res) => {
    try {
        const partnerId = req.user._id;
        const { name, type, basePrice, perKgRate, minWeight, maxWeight, estimatedDays, codAvailable, codCharge, active } = req.body;

        // Validation
        if (!name || name.trim().length === 0) {
            return res.status(400).json({ success: false, message: 'Service name is required' });
        }
        if (name.length > 60) {
            return res.status(400).json({ success: false, message: 'Service name must be 60 characters or less' });
        }
        if (basePrice == null || basePrice < 0) {
            return res.status(400).json({ success: false, message: 'Base price must be 0 or greater' });
        }
        if (perKgRate == null || perKgRate < 0) {
            return res.status(400).json({ success: false, message: 'Per KG rate must be 0 or greater' });
        }

        let pricing = await PartnerPricing.findOne({ partnerId });
        if (!pricing) {
            pricing = new PartnerPricing({
                partnerId,
                companyName: req.user.businessName || '',
                services: [],
                coverage: { states: [], cities: [], pinRanges: [] },
            });
        }

        const newService = {
            name: name.trim(),
            type: type || 'standard',
            basePrice: parseFloat(basePrice) || 0,
            perKgRate: parseFloat(perKgRate) || 0,
            minWeight: parseFloat(minWeight) || 0.5,
            maxWeight: parseFloat(maxWeight) || 50,
            estimatedDays: estimatedDays || '',
            codAvailable: codAvailable !== false,
            codCharge: codAvailable !== false ? (parseFloat(codCharge) || 0) : null,
            active: active !== false,
        };

        pricing.services.push(newService);
        await pricing.save();

        const addedService = pricing.services[pricing.services.length - 1];
        res.status(201).json({ success: true, service: addedService, message: 'Service created' });
    } catch (error) {
        console.error('Create service error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// ─── PUT /api/partner/pricing/services/:id ────────────────────────────────────
// Update an existing service by subdocument _id
router.put('/services/:id', protect, partnerProtect, async (req, res) => {
    try {
        const partnerId = req.user._id;
        const serviceId = req.params.id;

        const pricing = await PartnerPricing.findOne({ partnerId });
        if (!pricing) {
            return res.status(404).json({ success: false, message: 'Pricing config not found' });
        }

        const service = pricing.services.id(serviceId);
        if (!service) {
            return res.status(404).json({ success: false, message: 'Service not found' });
        }

        // Update only provided fields
        const fields = ['name', 'type', 'basePrice', 'perKgRate', 'minWeight', 'maxWeight', 'estimatedDays', 'codAvailable', 'codCharge', 'active'];
        for (const field of fields) {
            if (req.body[field] !== undefined) {
                service[field] = req.body[field];
            }
        }

        await pricing.save();
        res.json({ success: true, service, message: 'Service updated' });
    } catch (error) {
        console.error('Update service error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// ─── DELETE /api/partner/pricing/services/:id ─────────────────────────────────
// Soft-delete a service (set active = false, add deletedAt timestamp)
router.delete('/services/:id', protect, partnerProtect, async (req, res) => {
    try {
        const partnerId = req.user._id;
        const serviceId = req.params.id;

        const pricing = await PartnerPricing.findOne({ partnerId });
        if (!pricing) {
            return res.status(404).json({ success: false, message: 'Pricing config not found' });
        }

        const service = pricing.services.id(serviceId);
        if (!service) {
            return res.status(404).json({ success: false, message: 'Service not found' });
        }

        service.active = false;
        service.deletedAt = new Date();
        await pricing.save();

        res.json({ success: true, message: 'Service removed' });
    } catch (error) {
        console.error('Delete service error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// ─── PUT /api/partner/pricing/coverage ────────────────────────────────────────
// Upsert coverage for authenticated partner
router.put('/coverage', protect, partnerProtect, async (req, res) => {
    try {
        const partnerId = req.user._id;
        const { serviceable_states, serviceable_cities, pin_code_ranges } = req.body;

        // Validate at least one state
        const states = serviceable_states || [];
        if (states.length === 0) {
            return res.status(400).json({ success: false, message: 'Please select at least one serviceable state' });
        }

        const coverage = {
            states,
            cities: serviceable_cities || [],
            pinRanges: (pin_code_ranges || []).map(r => ({ from: r.from, to: r.to })),
        };

        const pricing = await PartnerPricing.findOneAndUpdate(
            { partnerId },
            { $set: { coverage } },
            { upsert: true, new: true, runValidators: true }
        );

        res.json({ success: true, coverage: pricing.coverage, message: 'Coverage saved successfully' });
    } catch (error) {
        console.error('Update coverage error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// ─── POST /api/partner/pricing/save-all ───────────────────────────────────────
// Bulk save: saves all services + coverage in a single call
router.post('/save-all', protect, partnerProtect, async (req, res) => {
    try {
        const partnerId = req.user._id;
        const { services, coverage } = req.body;

        // Validate services
        if (services && services.length > 0) {
            for (let i = 0; i < services.length; i++) {
                const s = services[i];
                if (!s.name || s.name.trim().length === 0) {
                    return res.status(400).json({ success: false, message: `Service #${i + 1}: Service name is required` });
                }
                if (s.name.length > 60) {
                    return res.status(400).json({ success: false, message: `Service #${i + 1}: Service name must be 60 characters or less` });
                }
                if (s.basePrice == null || parseFloat(s.basePrice) < 0) {
                    return res.status(400).json({ success: false, message: `Service #${i + 1}: Base price must be 0 or greater` });
                }
                if (s.perKgRate == null || parseFloat(s.perKgRate) < 0) {
                    return res.status(400).json({ success: false, message: `Service #${i + 1}: Per KG rate must be 0 or greater` });
                }
                if (s.minWeight == null || parseFloat(s.minWeight) <= 0) {
                    return res.status(400).json({ success: false, message: `Service #${i + 1}: Minimum weight must be greater than 0` });
                }
                if (s.maxWeight == null || parseFloat(s.maxWeight) <= parseFloat(s.minWeight)) {
                    return res.status(400).json({ success: false, message: `Service #${i + 1}: Maximum weight must be greater than minimum weight` });
                }
                if (s.codAvailable && (s.codCharge == null || parseFloat(s.codCharge) < 0)) {
                    return res.status(400).json({ success: false, message: `Service #${i + 1}: COD charge is required when COD is enabled` });
                }
            }
        }

        // Validate coverage
        const coverageStates = coverage?.serviceable_states || coverage?.states || [];
        if (coverageStates.length === 0) {
            return res.status(400).json({ success: false, message: 'Please select at least one serviceable state' });
        }

        // Validate PIN ranges
        const pinRanges = coverage?.pin_code_ranges || coverage?.pinRanges || [];
        for (let i = 0; i < pinRanges.length; i++) {
            const r = pinRanges[i];
            if (r.from && !/^\d{6}$/.test(r.from)) {
                return res.status(400).json({ success: false, message: `PIN range #${i + 1}: 'From' PIN must be exactly 6 digits` });
            }
            if (r.to && !/^\d{6}$/.test(r.to)) {
                return res.status(400).json({ success: false, message: `PIN range #${i + 1}: 'To' PIN must be exactly 6 digits` });
            }
            if (r.from && r.to && parseInt(r.from) > parseInt(r.to)) {
                return res.status(400).json({ success: false, message: `PIN range #${i + 1}: 'To' PIN must be greater than or equal to 'From' PIN` });
            }
        }

        // Prepare service documents
        const cleanServices = (services || []).map(s => ({
            ...(s._id ? { _id: s._id } : {}),
            name: s.name.trim(),
            type: s.type || 'standard',
            basePrice: parseFloat(s.basePrice) || 0,
            perKgRate: parseFloat(s.perKgRate) || 0,
            minWeight: parseFloat(s.minWeight) || 0.5,
            maxWeight: parseFloat(s.maxWeight) || 50,
            estimatedDays: s.estimatedDays || '',
            codAvailable: s.codAvailable !== false,
            codCharge: s.codAvailable !== false ? (parseFloat(s.codCharge) || 0) : null,
            active: s.active !== false,
        }));

        const cleanCoverage = {
            states: coverageStates,
            cities: coverage?.serviceable_cities || coverage?.cities || [],
            pinRanges: pinRanges.map(r => ({ from: r.from, to: r.to })),
        };

        const pricing = await PartnerPricing.findOneAndUpdate(
            { partnerId },
            {
                partnerId,
                companyName: req.user.businessName || '',
                services: cleanServices,
                coverage: cleanCoverage,
            },
            { upsert: true, new: true, runValidators: true }
        );

        res.json({ success: true, pricing, message: 'Pricing & Services saved successfully' });
    } catch (error) {
        console.error('Save-all error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// ─── POST /api/partner/pricing/dismiss-onboarding ─────────────────────────────
// Mark the pricing onboarding banner as dismissed
router.post('/dismiss-onboarding', protect, partnerProtect, async (req, res) => {
    try {
        await User.findByIdAndUpdate(req.user._id, { pricingOnboarded: true });
        res.json({ success: true, message: 'Onboarding banner dismissed' });
    } catch (error) {
        console.error('Dismiss onboarding error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// ─── POST /api/partner/pricing/seed ──────────────────────────────────────────
// Seed default pricing for all approved partners who don't yet have a config
router.post('/seed', protect, async (req, res) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ success: false, message: 'Admin only' });
    }
    try {
        const partners = await User.find({ role: 'shipment_partner' }).lean();
        let seeded = 0;

        for (const partner of partners) {
            const existing = await PartnerPricing.findOne({ partnerId: partner._id });
            if (!existing) {
                await PartnerPricing.create({
                    partnerId: partner._id,
                    companyName: partner.businessName || partner.contactPerson || 'Partner',
                    services: [
                        {
                            name: 'Standard Delivery',
                            type: 'standard',
                            basePrice: 80,
                            perKgRate: 20,
                            minWeight: 0.5,
                            maxWeight: 50,
                            estimatedDays: '3-5 days',
                            codAvailable: true,
                            codCharge: 30,
                            active: true,
                        },
                        {
                            name: 'Express Delivery',
                            type: 'next_day',
                            basePrice: 150,
                            perKgRate: 35,
                            minWeight: 0.5,
                            maxWeight: 30,
                            estimatedDays: '1-2 days',
                            codAvailable: false,
                            codCharge: 0,
                            active: true,
                        },
                    ],
                    coverage: {
                        states: ['All India'],
                        cities: [],
                        pinRanges: [],
                    },
                });
                seeded++;
            }
        }

        res.json({ success: true, message: `Seeded ${seeded} partners`, seeded });
    } catch (error) {
        console.error('Seed error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

export default router;
