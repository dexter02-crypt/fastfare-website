import express from 'express';
import Vehicle from '../models/Vehicle.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// GET /api/wms/vehicles — user-scoped
router.get('/', protect, async (req, res) => {
    try {
        const query = req.user.role === 'admin' ? {} : { owner: req.user._id };
        const vehicles = await Vehicle.find(query).sort({ createdAt: -1 });
        res.json(vehicles);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// POST /api/wms/vehicles — set owner
router.post('/', protect, async (req, res) => {
    const { numberPlate, chassisNumber, type, capacity, insuranceExpiry, fitnessExpiry } = req.body;
    try {
        const newVehicle = new Vehicle({
            owner: req.user._id,
            numberPlate,
            chassisNumber,
            type,
            capacity: { weight: capacity },
            documents: {
                insurance: { expiry: insuranceExpiry },
                fitness: { expiry: fitnessExpiry }
            }
        });
        const savedVehicle = await newVehicle.save();
        res.status(201).json(savedVehicle);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// PUT /api/wms/vehicles/:id — owner-scoped
router.put('/:id', protect, async (req, res) => {
    try {
        const { numberPlate, chassisNumber, type, capacity, insuranceExpiry, fitnessExpiry, status } = req.body;
        const query = req.user.role === 'admin' ? { _id: req.params.id } : { _id: req.params.id, owner: req.user._id };
        const updateData = {
            numberPlate, chassisNumber, type, status,
            'capacity.weight': capacity,
            'documents.insurance.expiry': insuranceExpiry,
            'documents.fitness.expiry': fitnessExpiry
        };
        const updatedVehicle = await Vehicle.findOneAndUpdate(query, { $set: updateData }, { new: true });
        if (!updatedVehicle) return res.status(404).json({ message: 'Vehicle not found' });
        res.json(updatedVehicle);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// DELETE /api/wms/vehicles/:id — owner-scoped
router.delete('/:id', protect, async (req, res) => {
    try {
        const query = req.user.role === 'admin' ? { _id: req.params.id } : { _id: req.params.id, owner: req.user._id };
        const vehicle = await Vehicle.findOne(query);
        if (!vehicle) return res.status(404).json({ message: 'Vehicle not found' });
        await vehicle.deleteOne();
        res.json({ message: 'Vehicle removed' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

export default router;
