import express from 'express';
import Trip from '../models/Trip.js';
import Vehicle from '../models/Vehicle.js';
import WmsDriver from '../models/WmsDriver.js';

const router = express.Router();

// GET /api/wms/trips
router.get('/', async (req, res) => {
    const { status } = req.query;
    const filter = status ? { status } : {};
    try {
        const trips = await Trip.find(filter)
            .populate('vehicleId', 'numberPlate type')
            .populate('driverId', 'name phone')
            .sort({ createdAt: -1 });
        res.json(trips);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// POST /api/wms/trips
router.post('/', async (req, res) => {
    const { vehicleId, driverId, origin, destination, estimatedDistance } = req.body;
    try {
        const activeTrip = await Trip.findOne({
            $or: [{ vehicleId }, { driverId }],
            status: { $in: ['scheduled', 'loading', 'in_transit'] }
        });

        if (activeTrip) {
            return res.status(400).json({ message: 'Vehicle or Driver is already assigned to an active trip.' });
        }

        const newTrip = new Trip({
            tripId: `TRP-${Date.now()}`,
            vehicleId, driverId,
            route: { origin, destination, estimatedDistance },
            status: 'scheduled',
            startTime: new Date()
        });

        const savedTrip = await newTrip.save();

        await Vehicle.findByIdAndUpdate(vehicleId, { status: 'active' });
        await WmsDriver.findByIdAndUpdate(driverId, { status: 'on_trip', currentVehicleId: vehicleId });

        res.status(201).json(savedTrip);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// PUT /api/wms/trips/:id/status
router.put('/:id/status', async (req, res) => {
    const { status, location } = req.body;
    try {
        const trip = await Trip.findById(req.params.id);
        if (!trip) return res.status(404).json({ message: 'Trip not found' });

        trip.status = status;
        if (status === 'completed') {
            trip.endTime = new Date();
            await Vehicle.findByIdAndUpdate(trip.vehicleId, { status: 'active' });
            await WmsDriver.findByIdAndUpdate(trip.driverId, { status: 'active', currentVehicleId: null });
        }

        if (location) {
            trip.logs.push({ status, location, note: `Status updated to ${status}` });
        }

        await trip.save();
        res.json(trip);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

export default router;
