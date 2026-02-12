import express from 'express';
import Vehicle from '../models/Vehicle.js';

const router = express.Router();

// GET /api/wms/vehicles
router.get('/', async (req, res) => {
    try {
        const vehicles = await Vehicle.find().sort({ createdAt: -1 });
        res.json(vehicles);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// POST /api/wms/vehicles
router.post('/', async (req, res) => {
    const { numberPlate, chassisNumber, type, capacity, insuranceExpiry, fitnessExpiry } = req.body;
    try {
        const newVehicle = new Vehicle({
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

// PUT /api/wms/vehicles/:id
router.put('/:id', async (req, res) => {
    try {
        const { numberPlate, chassisNumber, type, capacity, insuranceExpiry, fitnessExpiry, status } = req.body;
        const updateData = {
            numberPlate, chassisNumber, type, status,
            'capacity.weight': capacity,
            'documents.insurance.expiry': insuranceExpiry,
            'documents.fitness.expiry': fitnessExpiry
        };
        const updatedVehicle = await Vehicle.findByIdAndUpdate(req.params.id, { $set: updateData }, { new: true });
        res.json(updatedVehicle);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// DELETE /api/wms/vehicles/:id
router.delete('/:id', async (req, res) => {
    try {
        const vehicle = await Vehicle.findById(req.params.id);
        if (!vehicle) return res.status(404).json({ message: 'Vehicle not found' });
        await vehicle.deleteOne();
        res.json({ message: 'Vehicle removed' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

export default router;
