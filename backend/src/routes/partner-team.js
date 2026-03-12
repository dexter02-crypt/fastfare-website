import express from 'express';
import bcrypt from 'bcryptjs';
import WmsDriver from '../models/WmsDriver.js';
import ScanPartner from '../models/ScanPartner.js';
import Sequence from '../models/Sequence.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// ─── Middleware: ensure user is a partner or admin ───
const partnerOnly = (req, res, next) => {
    if (req.user.role !== 'shipment_partner' && req.user.role !== 'admin') {
        return res.status(403).json({ success: false, message: 'Access denied. Partners only.' });
    }
    next();
};

// ─── Helper: generate next sequential ID ───
const getNextId = async (prefix) => {
    const seqName = `${prefix.toLowerCase()}_id`;
    const seq = await Sequence.findByIdAndUpdate(
        seqName,
        { $inc: { seq: 1 } },
        { upsert: true, new: true }
    );
    return `${prefix}-${String(seq.seq).padStart(4, '0')}`;
};

// ─── Helper: generate random password ───
const generatePassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
    let password = '';
    for (let i = 0; i < 8; i++) {
        password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
};


// ══════════════════════════════════════════════
//  DRIVERS (DRV-XXXX)
// ══════════════════════════════════════════════

// GET /api/partner-team/drivers — list partner's drivers
router.get('/drivers', protect, partnerOnly, async (req, res) => {
    try {
        const query = req.user.role === 'admin' ? {} : { createdBy: req.user._id };
        const driversList = await WmsDriver.find(query)
            .select('-password')
            .sort({ createdAt: -1 })
            .lean();

        // Merge with live socket status
        const { getActiveDrivers } = await import('../socket/location.socket.js');
        const activeDrivers = getActiveDrivers();

        const drivers = driversList.map(driver => {
            const liveInfo = activeDrivers.find(ad => ad.driverId === driver.driverId);
            return {
                ...driver,
                socketStatus: liveInfo ? liveInfo.status : 'offline',
                lastSeen: liveInfo ? liveInfo.lastSeen : null,
                lat: liveInfo ? liveInfo.lat : null,
                lng: liveInfo ? liveInfo.lng : null
            };
        });

        res.json({ success: true, drivers });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// POST /api/partner-team/drivers — create driver with auto-generated ID + password
router.post('/drivers', protect, partnerOnly, async (req, res) => {
    try {
        const { name, phone, licenseNumber, licenseExpiry } = req.body;

        if (!name || !phone) {
            return res.status(400).json({ success: false, message: 'Name and phone are required' });
        }

        // Generate unique ID and password
        const driverId = await getNextId('DRV');
        const plainPassword = generatePassword();
        const hashedPassword = await bcrypt.hash(plainPassword, 10);

        const driver = await WmsDriver.create({
            driverId,
            name,
            phone,
            email: `${driverId.toLowerCase()}@driver.fastfare.com`,
            password: hashedPassword,
            license: {
                number: licenseNumber || 'PENDING',
                type: 'commercial',
                expiry: licenseExpiry || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
            },
            status: 'active',
            verificationStatus: 'verified',
            status: 'active',
            verificationStatus: 'verified',
            createdBy: req.user._id,
            visiblePassword: plainPassword // Store for convenience
        });

        // Return plain password ONCE (not stored in plain text)
        res.status(201).json({
            success: true,
            message: 'Driver created successfully',
            driver: {
                _id: driver._id,
                driverId: driver.driverId,
                name: driver.name,
                phone: driver.phone,
                status: driver.status
            },
            credentials: {
                id: driverId,
                password: plainPassword
            }
        });
    } catch (error) {
        console.error('Create driver error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// DELETE /api/partner-team/drivers/:id — deactivate driver
router.delete('/drivers/:id', protect, partnerOnly, async (req, res) => {
    try {
        const query = { _id: req.params.id };
        if (req.user.role !== 'admin') {
            query.createdBy = req.user._id;
        }

        const driver = await WmsDriver.findOne(query);
        if (!driver) {
            return res.status(404).json({ success: false, message: 'Driver not found' });
        }

        driver.status = 'terminated';
        await driver.save();

        res.json({ success: true, message: 'Driver deactivated' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// PUT /api/partner-team/drivers/:id/reactivate — reactivate driver
router.put('/drivers/:id/reactivate', protect, partnerOnly, async (req, res) => {
    try {
        const query = { _id: req.params.id };
        if (req.user.role !== 'admin') {
            query.createdBy = req.user._id;
        }

        const driver = await WmsDriver.findOne(query);
        if (!driver) {
            return res.status(404).json({ success: false, message: 'Driver not found' });
        }

        driver.status = 'active';
        await driver.save();

        res.json({ success: true, message: 'Driver reactivated' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// PUT /api/partner-team/drivers/:id/reset-password — generate new password
router.put('/drivers/:id/reset-password', protect, partnerOnly, async (req, res) => {
    try {
        const query = { _id: req.params.id };
        if (req.user.role !== 'admin') {
            query.createdBy = req.user._id;
        }

        const driver = await WmsDriver.findOne(query);
        if (!driver) {
            return res.status(404).json({ success: false, message: 'Driver not found' });
        }

        const plainPassword = generatePassword();
        driver.password = await bcrypt.hash(plainPassword, 10);
        driver.visiblePassword = plainPassword; // Update visible password
        await driver.save();

        res.json({
            success: true,
            message: 'Password reset successfully',
            credentials: {
                id: driver.driverId,
                password: plainPassword
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});


// ══════════════════════════════════════════════
//  SCAN PARTNERS (SCN-XXXX)
// ══════════════════════════════════════════════

// GET /api/partner-team/scan-partners — list partner's scan partners
router.get('/scan-partners', protect, partnerOnly, async (req, res) => {
    try {
        const query = req.user.role === 'admin' ? {} : { createdBy: req.user._id };
        const scanPartners = await ScanPartner.find(query)
            .select('-password')
            .sort({ createdAt: -1 });

        res.json({ success: true, scanPartners });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// POST /api/partner-team/scan-partners — create scan partner with auto-generated ID + password
router.post('/scan-partners', protect, partnerOnly, async (req, res) => {
    try {
        const { name, phone } = req.body;

        if (!name) {
            return res.status(400).json({ success: false, message: 'Name is required' });
        }

        // Generate unique ID and password
        const scanPartnerId = await getNextId('SCN');
        const plainPassword = generatePassword();

        // Password will be hashed by the pre-save hook in the model
        const scanPartner = await ScanPartner.create({
            scanPartnerId,
            name,
            phone: phone || '',
            password: plainPassword,
            createdBy: req.user._id,
            status: 'active',
            visiblePassword: plainPassword // Store for convenience
        });

        // Return plain password ONCE (not stored in plain text)
        res.status(201).json({
            success: true,
            message: 'Scan partner created successfully',
            scanPartner: {
                _id: scanPartner._id,
                scanPartnerId: scanPartner.scanPartnerId,
                name: scanPartner.name,
                phone: scanPartner.phone,
                status: scanPartner.status
            },
            credentials: {
                id: scanPartnerId,
                password: plainPassword
            }
        });
    } catch (error) {
        console.error('Create scan partner error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// DELETE /api/partner-team/scan-partners/:id — deactivate scan partner
router.delete('/scan-partners/:id', protect, partnerOnly, async (req, res) => {
    try {
        const query = { _id: req.params.id };
        if (req.user.role !== 'admin') {
            query.createdBy = req.user._id;
        }

        const scanPartner = await ScanPartner.findOne(query);
        if (!scanPartner) {
            return res.status(404).json({ success: false, message: 'Scan partner not found' });
        }

        scanPartner.status = 'inactive';
        await scanPartner.save();

        res.json({ success: true, message: 'Scan partner deactivated' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// PUT /api/partner-team/scan-partners/:id/reactivate — reactivate scan partner
router.put('/scan-partners/:id/reactivate', protect, partnerOnly, async (req, res) => {
    try {
        const query = { _id: req.params.id };
        if (req.user.role !== 'admin') {
            query.createdBy = req.user._id;
        }

        const scanPartner = await ScanPartner.findOne(query);
        if (!scanPartner) {
            return res.status(404).json({ success: false, message: 'Scan partner not found' });
        }

        scanPartner.status = 'active';
        await scanPartner.save();

        res.json({ success: true, message: 'Scan partner reactivated' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// PUT /api/partner-team/scan-partners/:id/reset-password — generate new password
router.put('/scan-partners/:id/reset-password', protect, partnerOnly, async (req, res) => {
    try {
        const query = { _id: req.params.id };
        if (req.user.role !== 'admin') {
            query.createdBy = req.user._id;
        }

        const scanPartner = await ScanPartner.findOne(query);
        if (!scanPartner) {
            return res.status(404).json({ success: false, message: 'Scan partner not found' });
        }

        const plainPassword = generatePassword();
        scanPartner.password = plainPassword; // Will be hashed by pre-save hook
        scanPartner.visiblePassword = plainPassword; // Update visible password
        await scanPartner.save();

        res.json({
            success: true,
            message: 'Password reset successfully',
            credentials: {
                id: scanPartner.scanPartnerId,
                password: plainPassword
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});


// GET /api/partner-team/drivers/:id/credentials — view login credentials
router.get('/drivers/:id/credentials', protect, partnerOnly, async (req, res) => {
    try {
        const query = { _id: req.params.id };
        if (req.user.role !== 'admin') {
            query.createdBy = req.user._id;
        }

        const driver = await WmsDriver.findOne(query);
        if (!driver) {
            return res.status(404).json({ success: false, message: 'Driver not found' });
        }

        res.json({
            success: true,
            credentials: {
                id: driver.driverId,
                password: driver.visiblePassword || 'Not available (please reset password)'
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// GET /api/partner-team/scan-partners/:id/credentials — view login credentials
router.get('/scan-partners/:id/credentials', protect, partnerOnly, async (req, res) => {
    try {
        const query = { _id: req.params.id };
        if (req.user.role !== 'admin') {
            query.createdBy = req.user._id;
        }

        const scanPartner = await ScanPartner.findOne(query);
        if (!scanPartner) {
            return res.status(404).json({ success: false, message: 'Scan partner not found' });
        }

        res.json({
            success: true,
            credentials: {
                id: scanPartner.scanPartnerId,
                password: scanPartner.visiblePassword || 'Not available (please reset password)'
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// ══════════════════════════════════════════════

router.get('/stats', protect, partnerOnly, async (req, res) => {
    try {
        const query = req.user.role === 'admin' ? {} : { createdBy: req.user._id };

        const [drivers, scanPartners] = await Promise.all([
            WmsDriver.find(query).select('status'),
            ScanPartner.find(query).select('status')
        ]);

        res.json({
            success: true,
            stats: {
                totalDrivers: drivers.length,
                activeDrivers: drivers.filter(d => d.status === 'active').length,
                totalScanPartners: scanPartners.length,
                activeScanPartners: scanPartners.filter(s => s.status === 'active').length
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});


export default router;
