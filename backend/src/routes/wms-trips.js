import express from 'express';
import Trip from '../models/Trip.js';
import Vehicle from '../models/Vehicle.js';
import WmsDriver from '../models/WmsDriver.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// GET /api/wms/trips — user-scoped
router.get('/', protect, async (req, res) => {
    const { status } = req.query;
    const query = req.user.role === 'admin' ? {} : { owner: req.user._id };
    if (status) query.status = status;
    try {
        const trips = await Trip.find(query)
            .populate('vehicleId', 'numberPlate type')
            .populate('driverId', 'name phone')
            .sort({ createdAt: -1 });
        res.json(trips);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// POST /api/wms/trips — set owner
router.post('/', protect, async (req, res) => {
    const { vehicleId, driverId, origin, destination, estimatedDistance } = req.body;
    try {
        const ownerQuery = req.user.role === 'admin' ? {} : { owner: req.user._id };
        const activeTrip = await Trip.findOne({
            ...ownerQuery,
            $or: [{ vehicleId }, { driverId }],
            status: { $in: ['scheduled', 'loading', 'in_transit'] }
        });

        if (activeTrip) {
            return res.status(400).json({ message: 'Vehicle or Driver is already assigned to an active trip.' });
        }

        const newTrip = new Trip({
            owner: req.user._id,
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

// PUT /api/wms/trips/:id/status — owner-scoped
router.put('/:id/status', protect, async (req, res) => {
    const { status, location } = req.body;
    try {
        const query = req.user.role === 'admin' ? { _id: req.params.id } : { _id: req.params.id, owner: req.user._id };
        const trip = await Trip.findOne(query);
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
