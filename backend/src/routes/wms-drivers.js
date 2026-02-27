import express from 'express';
import WmsDriver from '../models/WmsDriver.js';
import bcrypt from 'bcryptjs';
import { generateDriverId } from '../utils/idGenerator.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// GET /api/wms/drivers — user-scoped via createdBy
router.get('/', protect, async (req, res) => {
    try {
        const query = req.user.role === 'admin' ? {} : { createdBy: req.user._id };
        const drivers = await WmsDriver.find(query).sort({ createdAt: -1 });
        res.json(drivers);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// POST /api/wms/drivers — set createdBy
router.post('/', protect, async (req, res) => {
    const { name, phone, email, password, licenseNumber, licenseExpiry, aadhaar, address } = req.body;
    try {
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password || 'driver123', salt);
        const driverId = await generateDriverId('TRUCK');

        const newDriver = new WmsDriver({
            createdBy: req.user._id,
            driverId, name, phone, email,
            password: hashedPassword,
            license: { number: licenseNumber, expiry: licenseExpiry },
            identity: { aadhaar },
            address: { full: address }
        });

        const savedDriver = await newDriver.save();
        res.status(201).json(savedDriver);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// PUT /api/wms/drivers/:id — owner-scoped
router.put('/:id', protect, async (req, res) => {
    try {
        const { name, phone, email, licenseNumber, licenseExpiry, aadhaar, address, status } = req.body;
        const query = req.user.role === 'admin' ? { _id: req.params.id } : { _id: req.params.id, createdBy: req.user._id };
        const updateData = {
            name, phone, email, status,
            'license.number': licenseNumber,
            'license.expiry': licenseExpiry,
            'identity.aadhaar': aadhaar,
            'address.full': address
        };
        const updatedDriver = await WmsDriver.findOneAndUpdate(query, { $set: updateData }, { new: true });
        if (!updatedDriver) return res.status(404).json({ message: 'Driver not found' });
        res.json(updatedDriver);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// DELETE /api/wms/drivers/:id — owner-scoped
router.delete('/:id', protect, async (req, res) => {
    try {
        const query = req.user.role === 'admin' ? { _id: req.params.id } : { _id: req.params.id, createdBy: req.user._id };
        const driver = await WmsDriver.findOne(query);
        if (!driver) return res.status(404).json({ message: 'Driver not found' });
        await driver.deleteOne();
        res.json({ message: 'Driver deleted' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

export default router;
