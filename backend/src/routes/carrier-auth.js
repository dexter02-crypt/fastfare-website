import express from 'express';
import jwt from 'jsonwebtoken';
import Carrier from '../models/Carrier.js';

const router = express.Router();

const generateToken = (id) => {
    return jwt.sign({ id, role: 'carrier' }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

// ─── POST /api/carrier-auth/register ───
router.post('/register', async (req, res) => {
    try {
        const {
            businessName, contactPerson, email, phone, password,
            gstin, panNumber, fleetDetails, serviceZones,
            supportedTypes, baseFare, perKgRate, webhookUrl, features
        } = req.body;

        if (!businessName || !contactPerson || !email || !phone || !password) {
            return res.status(400).json({ success: false, message: 'Business name, contact person, email, phone, and password are required' });
        }

        // Check duplicates
        const existing = await Carrier.findOne({ $or: [{ email }, { phone }] });
        if (existing) {
            const msg = existing.email === email ? 'Email already registered' : 'Phone already registered';
            return res.status(400).json({ success: false, message: msg });
        }

        const carrier = await Carrier.create({
            businessName,
            contactPerson,
            email,
            phone,
            password,
            gstin: gstin || undefined,
            panNumber: panNumber || undefined,
            fleetDetails: fleetDetails || { totalVehicles: 0, vehicleTypes: [] },
            serviceZones: serviceZones || [],
            supportedTypes: supportedTypes || ['standard'],
            baseFare: baseFare || 99,
            perKgRate: perKgRate || 10,
            webhookUrl: webhookUrl || '',
            features: features || [],
            status: 'pending_approval'
        });

        res.status(201).json({
            success: true,
            message: 'Registration submitted! Your application will be reviewed by our team. You will be notified once approved.',
            carrier: {
                id: carrier._id,
                businessName: carrier.businessName,
                status: carrier.status
            }
        });
    } catch (error) {
        console.error('Carrier register error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// ─── POST /api/carrier-auth/login ───
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ success: false, message: 'Email and password are required' });
        }

        const carrier = await Carrier.findOne({
            $or: [{ email }, { phone: email }]
        });

        if (!carrier) {
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }

        if (carrier.status !== 'approved') {
            const msgs = {
                pending_approval: 'Your account is pending admin approval.',
                rejected: 'Your registration was rejected. Please contact support.',
                suspended: 'Your account has been suspended. Please contact support.'
            };
            return res.status(403).json({ success: false, message: msgs[carrier.status] || 'Account not active' });
        }

        const isMatch = await carrier.comparePassword(password);
        if (!isMatch) {
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }

        const token = generateToken(carrier._id);

        res.json({
            success: true,
            token,
            carrier: {
                id: carrier._id,
                businessName: carrier.businessName,
                contactPerson: carrier.contactPerson,
                email: carrier.email,
                phone: carrier.phone,
                rating: carrier.rating,
                status: carrier.status
            }
        });
    } catch (error) {
        console.error('Carrier login error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// ─── GET /api/carrier-auth/me ───
router.get('/me', async (req, res) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ success: false, message: 'Not authorized' });
        }

        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        if (decoded.role !== 'carrier') {
            return res.status(403).json({ success: false, message: 'Not a carrier account' });
        }

        const carrier = await Carrier.findById(decoded.id).select('-password');
        if (!carrier) {
            return res.status(404).json({ success: false, message: 'Carrier not found' });
        }

        res.json({ success: true, carrier });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

export default router;
