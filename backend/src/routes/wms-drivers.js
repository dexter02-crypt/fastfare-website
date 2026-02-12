import express from 'express';
import WmsDriver from '../models/WmsDriver.js';
import bcrypt from 'bcryptjs';
import { generateDriverId } from '../utils/idGenerator.js';

const router = express.Router();

// GET /api/wms/drivers
router.get('/', async (req, res) => {
    try {
        const drivers = await WmsDriver.find().sort({ createdAt: -1 });
        res.json(drivers);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// POST /api/wms/drivers
router.post('/', async (req, res) => {
    const { name, phone, email, password, licenseNumber, licenseExpiry, aadhaar, address } = req.body;
    try {
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password || 'driver123', salt);
        const driverId = await generateDriverId('TRUCK');

        const newDriver = new WmsDriver({
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

// PUT /api/wms/drivers/:id
router.put('/:id', async (req, res) => {
    try {
        const { name, phone, email, licenseNumber, licenseExpiry, aadhaar, address, status } = req.body;
        const updateData = {
            name, phone, email, status,
            'license.number': licenseNumber,
            'license.expiry': licenseExpiry,
            'identity.aadhaar': aadhaar,
            'address.full': address
        };
        const updatedDriver = await WmsDriver.findByIdAndUpdate(req.params.id, { $set: updateData }, { new: true });
        res.json(updatedDriver);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// DELETE /api/wms/drivers/:id
router.delete('/:id', async (req, res) => {
    try {
        await WmsDriver.findByIdAndDelete(req.params.id);
        res.json({ message: 'Driver deleted' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

export default router;
