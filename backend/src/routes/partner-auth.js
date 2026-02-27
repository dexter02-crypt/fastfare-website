import express from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Parcel from '../models/Parcel.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

// Helper: format user as partner response
const formatPartner = async (user) => {
    const totalScans = await Parcel.countDocuments({ 'scannedBy.partnerId': user._id });
    return {
        id: user._id,
        partnerId: `PTR-${user._id.toString().slice(-6).toUpperCase()}`,
        name: user.contactPerson || user.businessName,
        phone: user.phone,
        status: 'active',
        totalScans
    };
};

// ─── POST /api/partner-auth/login ───
router.post('/login', async (req, res) => {
    try {
        const { phone, password } = req.body;

        if (!phone || !password) {
            return res.status(400).json({ success: false, message: 'Phone and password are required' });
        }

        // Find partner by phone or email
        const user = await User.findOne({
            $or: [{ phone }, { email: phone }],
            role: 'shipment_partner'
        });

        if (!user) {
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }

        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }

        const token = generateToken(user._id);
        const partner = await formatPartner(user);

        res.json({ success: true, token, partner });
    } catch (error) {
        console.error('Partner login error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// ─── POST /api/partner-auth/register ───
router.post('/register', async (req, res) => {
    try {
        const {
            name, phone, email, password, businessName,
            zone, address, city, state, aadhaar,
            gstin, panNumber, fleetDetails, serviceZones,
            supportedTypes, baseFare, perKgRate, webhookUrl, features
        } = req.body;

        if (!phone || !password || !name) {
            return res.status(400).json({ success: false, message: 'Name, phone, and password are required' });
        }

        // Check if phone or email already exists
        const existing = await User.findOne({
            $or: [{ phone }, ...(email ? [{ email }] : [])]
        });

        if (existing) {
            const msg = existing.phone === phone ? 'Phone number already registered' : 'Email already registered';
            return res.status(400).json({ success: false, message: msg });
        }

        const user = await User.create({
            contactPerson: name,
            businessName: businessName || `${name}'s Business`,
            phone,
            email: email || `${phone}@partner.fastfare.com`,
            password,
            role: 'shipment_partner',
            gstin: gstin || `PARTNER${phone.slice(-10)}`,
            businessType: 'logistics',
            isVerified: true,
            partnerDetails: {
                zone, address, city, state, aadhaar,
                fleetDetails: fleetDetails || { totalVehicles: 0, vehicleTypes: [] },
                serviceZones: serviceZones || [],
                supportedTypes: supportedTypes || ['standard'],
                baseFare: baseFare || 99,
                perKgRate: perKgRate || 10,
                webhookUrl: webhookUrl || '',
                features: features || [],
                status: 'pending_approval'
            }
        });

        const token = generateToken(user._id);
        const partner = await formatPartner(user);

        res.status(201).json({ success: true, token, partner, message: 'Registration successful' });
    } catch (error) {
        console.error('Partner register error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// ─── GET /api/partner-auth/me ───
router.get('/me', protect, async (req, res) => {
    try {
        const user = req.user;

        if (user.role !== 'shipment_partner' && user.role !== 'admin') {
            return res.status(403).json({ success: false, message: 'Not a partner account' });
        }

        const partner = await formatPartner(user);
        res.json({ success: true, partner });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

export default router;
