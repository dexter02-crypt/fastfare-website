import express from 'express';
import crypto from 'crypto';
import User from '../models/User.js';
import Organization from '../models/Organization.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// GET /api/settings/organization — fetch org details for logged-in user
router.get('/organization', protect, async (req, res) => {
    try {
        let org = await Organization.findOne({ ownerId: req.user._id });
        if (!org) {
            // Return empty object if no org exists yet
            return res.json({ name: '', gstin: '', pan: '', phone: '', address: '', city: '', state: '', stateCode: '', pinCode: '' });
        }
        res.json(org);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// PUT /api/settings/organization — create or update org details
router.put('/organization', protect, async (req, res) => {
    try {
        const { name, gstin, pan, phone, address, city, state, stateCode, pinCode } = req.body;
        let org = await Organization.findOne({ ownerId: req.user._id });
        if (org) {
            org.name = name || org.name;
            org.gstin = gstin !== undefined ? gstin : org.gstin;
            org.pan = pan !== undefined ? pan : org.pan;
            org.phone = phone !== undefined ? phone : org.phone;
            org.address = address !== undefined ? address : org.address;
            org.city = city !== undefined ? city : org.city;
            org.state = state !== undefined ? state : org.state;
            org.stateCode = stateCode !== undefined ? stateCode : org.stateCode;
            org.pinCode = pinCode !== undefined ? pinCode : org.pinCode;
            await org.save();
        } else {
            org = await Organization.create({
                ownerId: req.user._id,
                name: name || '',
                gstin, pan, phone, address, city, state, stateCode, pinCode,
            });
        }
        res.json({ success: true, organization: org });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// GET /api/settings/api-keys — Bug 29
router.get('/api-keys', protect, async (req, res) => {
    try {
        const user = await User.findById(req.user._id).select('apiKeys');

        if (!user.apiKeys || !user.apiKeys.production) {
            const productionKey = 'ff_live_' + crypto.randomBytes(24).toString('hex');
            const testKey = 'ff_test_' + crypto.randomBytes(24).toString('hex');
            await User.findByIdAndUpdate(req.user._id, {
                'apiKeys.production': productionKey,
                'apiKeys.test': testKey
            });
            return res.json({
                production: productionKey,
                test: testKey
            });
        }

        res.json({
            production: user.apiKeys.production,
            test: user.apiKeys.test
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// POST /api/settings/api-keys/regenerate — Bug 29
router.post('/api-keys/regenerate', protect, async (req, res) => {
    try {
        const { keyType } = req.body;
        const prefix = keyType === 'production' ? 'ff_live_' : 'ff_test_';
        const newKey = prefix + crypto.randomBytes(24).toString('hex');
        const field = keyType === 'production'
            ? 'apiKeys.production'
            : 'apiKeys.test';
        await User.findByIdAndUpdate(req.user._id, { [field]: newKey });
        res.json({ key: newKey });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

export default router;
