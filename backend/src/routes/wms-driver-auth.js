import express from 'express';
import WmsDriver from '../models/WmsDriver.js';
import Trip from '../models/Trip.js';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

const router = express.Router();

const generateToken = (id) => {
    return jwt.sign({ id, role: 'driver' }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

// Auth middleware for drivers
const authDriver = (req, res, next) => {
    const auth = req.headers.authorization;
    if (!auth || !auth.startsWith('Bearer')) {
        return res.status(401).json({ success: false, message: 'No token' });
    }
    try {
        const decoded = jwt.verify(auth.split(' ')[1], process.env.JWT_SECRET);
        req.driverId = decoded.id;
        next();
    } catch (e) {
        res.status(401).json({ success: false, message: 'Invalid token' });
    }
};

// POST /api/wms/driver-auth/login  AND  /api/driver-auth/login
router.post('/login', async (req, res) => {
    const { email, driverId, password } = req.body;
    // Accept login via email OR driverId field
    const loginId = email || driverId;
    try {
        const driver = await WmsDriver.findOne({
            $or: [{ email: loginId }, { driverId: loginId }]
        });

        if (driver && (await bcrypt.compare(password, driver.password))) {
            res.json({
                success: true,
                _id: driver.id,
                name: driver.name,
                email: driver.email,
                token: generateToken(driver.id),
                driver: {
                    _id: driver.id,
                    driverId: driver.driverId,
                    name: driver.name,
                    phone: driver.phone,
                    status: driver.status,
                    currentTrip: null
                }
            });
        } else {
            res.status(401).json({ success: false, message: 'Invalid credentials' });
        }
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// GET /api/wms/driver-auth/me  AND  /api/driver-auth/me
router.get('/me', authDriver, async (req, res) => {
    try {
        const driver = await WmsDriver.findById(req.driverId).select('-password');
        if (!driver) {
            return res.status(404).json({ success: false, message: 'Driver not found' });
        }

        const activeTrip = await Trip.findOne({
            driverId: driver._id,
            status: { $in: ['scheduled', 'in_transit'] }
        }).populate('vehicleId');

        res.json({
            success: true,
            driver: {
                _id: driver._id,
                driverId: driver.driverId,
                name: driver.name,
                phone: driver.phone,
                status: driver.status,
                currentTrip: activeTrip ? activeTrip._id : null
            },
            activeTrip
        });
    } catch (error) {
        res.status(401).json({ success: false, message: 'Not authorized' });
    }
});

// PUT /api/driver-auth/location — Update driver's GPS location
router.put('/location', authDriver, async (req, res) => {
    try {
        const { lat, lng, latitude, longitude } = req.body;
        const finalLat = lat || latitude;
        const finalLng = lng || longitude;

        if (finalLat === undefined || finalLng === undefined) {
            return res.status(400).json({ success: false, message: 'lat and lng are required' });
        }

        await WmsDriver.findByIdAndUpdate(req.driverId, {
            lastLocation: {
                lat: finalLat,
                lng: finalLng,
                updatedAt: new Date()
            }
        });

        res.json({ success: true, message: 'Location updated' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

export default router;

