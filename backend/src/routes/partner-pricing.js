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
        }

        res.json({ success: true, pricing });
    } catch (error) {
        console.error('Get partner pricing error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// ─── POST /api/partner/pricing ────────────────────────────────────────────────
// Save/update partner pricing config (upsert)
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
                            type: 'express',
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
