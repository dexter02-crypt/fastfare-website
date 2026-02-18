import express from 'express';
import jwt from 'jsonwebtoken';
import ScanPartner from '../models/ScanPartner.js';
import Parcel from '../models/Parcel.js';
import Sequence from '../models/Sequence.js';

const router = express.Router();

const generateToken = (id) => {
    return jwt.sign({ id, role: 'scan_partner' }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

// Helper: generate next scan partner ID (SCN-0001, SCN-0002, ...)
const getNextScanPartnerId = async () => {
    const seq = await Sequence.findOneAndUpdate(
        { _id: 'scanPartner' },
        { $inc: { seq: 1 } },
        { upsert: true, new: true }
    );
    return `SCN-${String(seq.seq).padStart(4, '0')}`;
};

// POST /api/scan-partner-auth/register — Self-registration from Partner App
router.post('/register', async (req, res) => {
    try {
        const { name, phone, email, password, businessName, city, state, address, zone, aadhaar } = req.body;

        if (!name || !phone || !password) {
            return res.status(400).json({ success: false, message: 'Name, phone, and password are required' });
        }

        // Check if phone already registered
        const existing = await ScanPartner.findOne({ phone });
        if (existing) {
            return res.status(409).json({ success: false, message: 'Phone number already registered' });
        }

        const scanPartnerId = await getNextScanPartnerId();

        const scanPartner = await ScanPartner.create({
            scanPartnerId,
            name,
            phone,
            password, // Will be hashed by pre-save hook
            visiblePassword: password,
            email: email || undefined,
            businessName: businessName || undefined,
            city: city || undefined,
            state: state || undefined,
            address: address || undefined,
            zone: zone || undefined,
            aadhaar: aadhaar || undefined,
            status: 'active'
        });

        const token = generateToken(scanPartner._id);

        res.status(201).json({
            success: true,
            message: `Registration successful! Your Partner ID is ${scanPartnerId}`,
            token,
            partner: {
                id: scanPartner._id,
                partnerId: scanPartner.scanPartnerId,
                name: scanPartner.name,
                phone: scanPartner.phone,
                status: scanPartner.status,
                totalScans: 0
            }
        });
    } catch (error) {
        console.error('Scan partner register error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// POST /api/scan-partner-auth/login
router.post('/login', async (req, res) => {
    try {
        const { scanPartnerId, password } = req.body;

        if (!scanPartnerId || !password) {
            return res.status(400).json({ success: false, message: 'Scan Partner ID and password are required' });
        }

        const scanPartner = await ScanPartner.findOne({
            scanPartnerId: scanPartnerId.toUpperCase(),
            status: 'active'
        });

        if (!scanPartner) {
            return res.status(401).json({ success: false, message: 'Invalid credentials or account inactive' });
        }

        const isMatch = await scanPartner.comparePassword(password);
        if (!isMatch) {
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }

        const token = generateToken(scanPartner._id);

        // Get total scans
        const totalScans = await Parcel.countDocuments({ 'scannedBy.partnerId': scanPartner._id });

        res.json({
            success: true,
            token,
            partner: {
                id: scanPartner._id,
                partnerId: scanPartner.scanPartnerId,
                name: scanPartner.name,
                phone: scanPartner.phone,
                status: scanPartner.status,
                totalScans
            }
        });
    } catch (error) {
        console.error('Scan partner login error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// GET /api/scan-partner-auth/me
router.get('/me', async (req, res) => {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            const scanPartner = await ScanPartner.findById(decoded.id).select('-password');

            if (!scanPartner) {
                return res.status(404).json({ success: false, message: 'Scan partner not found' });
            }

            const totalScans = await Parcel.countDocuments({ 'scannedBy.partnerId': scanPartner._id });

            res.json({
                success: true,
                partner: {
                    id: scanPartner._id,
                    partnerId: scanPartner.scanPartnerId,
                    name: scanPartner.name,
                    phone: scanPartner.phone,
                    status: scanPartner.status,
                    totalScans
                }
            });
        } catch (error) {
            res.status(401).json({ success: false, message: 'Not authorized' });
        }
    } else {
        res.status(401).json({ success: false, message: 'No token' });
    }
});

export default router;

