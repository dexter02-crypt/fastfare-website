import express from 'express';
import rateLimit from 'express-rate-limit';
import { protect, admin } from '../middleware/auth.js';
import PromoCode from '../models/PromoCode.js';
import PromoUsage from '../models/PromoUsage.js';
import User from '../models/User.js';

const router = express.Router();

// --- Rate Limiting for Validate Endpoint ---
const validateLimiter = rateLimit({
    windowMs: 60 * 1000, 
    max: 10,
    message: { message: 'Too many promo validation attempts, please try again after a minute' }
});

// ==========================================
// USER ROUTES
// ==========================================

// Validate a Promo Code (User facing)
router.post('/validate', protect, validateLimiter, async (req, res) => {
    try {
        const { promoCode, amount } = req.body;
        
        if (!promoCode || !amount) {
            return res.status(400).json({ message: 'Promo code and total amount are required' });
        }

        const codeStr = promoCode.toUpperCase().trim();
        const promo = await PromoCode.findOne({ code: codeStr });

        if (!promo) {
            return res.status(404).json({ message: 'Invalid promo code' });
        }

        if (!promo.is_active) {
            return res.status(400).json({ message: 'This promo code is no longer active' });
        }

        if (promo.expires_at && new Date() > new Date(promo.expires_at)) {
            return res.status(400).json({ message: 'This promo code has expired' });
        }

        if (promo.max_uses && promo.used_count >= promo.max_uses) {
            return res.status(400).json({ message: 'This promo code has reached its usage limit' });
        }

        if (amount < promo.minimum_order_value) {
            return res.status(400).json({ message: `Minimum order value of ₹${promo.minimum_order_value} required to use this code` });
        }

        // Check if user has exceeded per_user_limit
        const userUsageCount = await PromoUsage.countDocuments({ 
            promo_code: codeStr, 
            user_id: req.user.id 
        });

        if (userUsageCount >= promo.per_user_limit) {
            return res.status(400).json({ message: 'You have already used this promo code' });
        }

        // All checks pass
        res.json({
            message: 'Promo code applied successfully',
            discount_amount: promo.discount_amount,
            promo_code: codeStr
        });

    } catch (error) {
        console.error('Promo validation error:', error);
        res.status(500).json({ message: 'Failed to validate promo code' });
    }
});

// ==========================================
// ADMIN ROUTES
// ==========================================

// Get all Promo Codes
router.get('/admin', protect, admin, async (req, res) => {
    try {
        const promos = await PromoCode.find().sort({ created_at: -1 }).populate('created_by', 'name email');
        res.json(promos);
    } catch (error) {
        console.error('Fetch promos error:', error);
        res.status(500).json({ message: 'Error fetching promo codes' });
    }
});

// Create a new Promo Code
router.post('/admin', protect, admin, async (req, res) => {
    try {
        const { code, discount_amount, is_active, max_uses, per_user_limit, minimum_order_value, expires_at, description } = req.body;
        
        // Validation
        if (!code || !discount_amount) {
            return res.status(400).json({ message: 'Code and discount amount are required' });
        }

        const upperCode = code.toUpperCase().trim();
        const existingCode = await PromoCode.findOne({ code: upperCode });
        
        if (existingCode) {
            return res.status(400).json({ message: 'This promo code already exists' });
        }

        if (discount_amount <= 0) {
            return res.status(400).json({ message: 'Discount amount must be greater than 0' });
        }

        const newPromo = new PromoCode({
            code: upperCode,
            discount_amount,
            is_active: is_active !== undefined ? is_active : true,
            max_uses: max_uses || null,
            per_user_limit: per_user_limit || 1,
            minimum_order_value: minimum_order_value || 0,
            expires_at: expires_at || null,
            description: description || '',
            created_by: req.user.id
        });

        await newPromo.save();
        res.status(201).json(newPromo);

    } catch (error) {
        console.error('Create promo error:', error);
        res.status(500).json({ message: 'Failed to create promo code' });
    }
});

// Update a Promo Code (excluding the code itself)
router.put('/admin/:id', protect, admin, async (req, res) => {
    try {
        const { discount_amount, is_active, max_uses, per_user_limit, minimum_order_value, expires_at, description } = req.body;
        
        // Cannot update the actual string code, only rules
        const promo = await PromoCode.findById(req.params.id);
        if (!promo) return res.status(404).json({ message: 'Promo code not found' });

        if (discount_amount !== undefined) promo.discount_amount = discount_amount;
        if (is_active !== undefined) promo.is_active = is_active;
        if (max_uses !== undefined) promo.max_uses = max_uses || null;
        if (per_user_limit !== undefined) promo.per_user_limit = per_user_limit;
        if (minimum_order_value !== undefined) promo.minimum_order_value = minimum_order_value;
        if (expires_at !== undefined) promo.expires_at = expires_at || null;
        if (description !== undefined) promo.description = description;

        await promo.save();
        res.json(promo);

    } catch (error) {
        console.error('Update promo error:', error);
        res.status(500).json({ message: 'Failed to update promo code' });
    }
});

// Delete Promo Code
router.delete('/admin/:id', protect, admin, async (req, res) => {
    try {
        const promo = await PromoCode.findByIdAndDelete(req.params.id);
        if (!promo) return res.status(404).json({ message: 'Promo code not found' });
        res.json({ message: 'Promo code deleted successfully' });
    } catch (error) {
        console.error('Delete promo error:', error);
        res.status(500).json({ message: 'Failed to delete promo code' });
    }
});

// Get Analytics / Usage Details for a Promo Code
router.get('/admin/:id/analytics', protect, admin, async (req, res) => {
    try {
        const promo = await PromoCode.findById(req.params.id);
        if (!promo) return res.status(404).json({ message: 'Promo code not found' });

        // Retrieve all usages
        const usages = await PromoUsage.find({ promo_code: promo.code })
            .populate('user_id', 'name email')
            .populate('shipment_id', 'awb totalPayable')
            .sort({ used_at: -1 });

        const totalDiscountGiven = usages.reduce((sum, u) => sum + (u.discount_applied || 0), 0);

        res.json({
            promo,
            totalUsages: usages.length,
            totalDiscountGiven,
            usageHistory: usages
        });

    } catch (error) {
        console.error('Promo analytics error:', error);
        res.status(500).json({ message: 'Failed to fetch promo analytics' });
    }
});

export default router;
