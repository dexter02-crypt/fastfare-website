import express from 'express';
import WmsDriver from '../models/WmsDriver.js';
import Trip from '../models/Trip.js';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

const router = express.Router();

const generateToken = (id) => {
    return jwt.sign({ id, role: 'driver' }, process.env.JWT_SECRET, { expiresIn: '30d' });
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

// GET /api/wms/driver-auth/me
router.get('/me', async (req, res) => {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            const driver = await WmsDriver.findById(decoded.id);
            if (!driver) return res.status(404).json({ message: 'Driver not found' });

            const activeTrip = await Trip.findOne({ driverId: driver._id, status: { $in: ['scheduled', 'in_transit'] } })
                .populate('vehicleId');

            res.json({ driver, activeTrip });
        } catch (error) {
            res.status(401).json({ message: 'Not authorized' });
        }
    } else {
        res.status(401).json({ message: 'No token' });
    }
});

export default router;
