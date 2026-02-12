import express from 'express';
import jwt from 'jsonwebtoken';
import Trip from '../models/Trip.js';
import Vehicle from '../models/Vehicle.js';
import WmsDriver from '../models/WmsDriver.js';
import Parcel from '../models/Parcel.js';

const router = express.Router();

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

// GET /api/trips/driver/current — Get driver's active trip
router.get('/driver/current', authDriver, async (req, res) => {
    try {
        const trip = await Trip.findOne({
            driverId: req.driverId,
            status: { $in: ['scheduled', 'loading', 'in_transit'] }
        })
            .populate('vehicleId', 'numberPlate type')
            .lean();

        if (!trip) {
            return res.json({ success: true, trip: null, message: 'No active trip' });
        }

        // Get parcels assigned to this driver
        const parcels = await Parcel.find({
            assignedDriver: req.driverId,
            status: { $nin: ['delivered', 'returned'] }
        }).lean();

        const delivered = await Parcel.countDocuments({
            assignedDriver: req.driverId,
            tripId: trip._id,
            status: 'delivered'
        });

        const failed = await Parcel.countDocuments({
            assignedDriver: req.driverId,
            tripId: trip._id,
            status: 'failed'
        });

        res.json({
            success: true,
            trip: {
                _id: trip._id,
                tripId: trip.tripId,
                status: trip.status,
                startLocation: trip.route?.origin || '',
                route: trip.route?.destination || '',
                parcels: parcels.map(p => ({
                    parcelId: p.parcelId,
                    barcode: p.barcode,
                    packageName: p.packageName,
                    status: p.status,
                    receiver: p.receiver || {}
                })),
                stats: {
                    total: parcels.length + delivered + failed,
                    delivered,
                    failed
                }
            }
        });
    } catch (err) {
        console.error('Current trip error:', err);
        res.status(500).json({ success: false, message: err.message });
    }
});

// PUT /api/trips/:id/start — Start a trip
router.put('/:id/start', authDriver, async (req, res) => {
    try {
        const trip = await Trip.findById(req.params.id);
        if (!trip) return res.status(404).json({ success: false, message: 'Trip not found' });
        if (trip.driverId.toString() !== req.driverId) {
            return res.status(403).json({ success: false, message: 'Not your trip' });
        }

        trip.status = 'in_transit';
        trip.startTime = new Date();
        trip.logs.push({ status: 'in_transit', note: 'Trip started by driver' });
        await trip.save();

        await WmsDriver.findByIdAndUpdate(req.driverId, { status: 'on_trip' });

        res.json({
            success: true,
            trip: {
                _id: trip._id,
                tripId: trip.tripId,
                status: trip.status
            },
            message: 'Trip started'
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// PUT /api/trips/:id/complete — Complete a trip
router.put('/:id/complete', authDriver, async (req, res) => {
    try {
        const trip = await Trip.findById(req.params.id);
        if (!trip) return res.status(404).json({ success: false, message: 'Trip not found' });
        if (trip.driverId.toString() !== req.driverId) {
            return res.status(403).json({ success: false, message: 'Not your trip' });
        }

        trip.status = 'completed';
        trip.endTime = new Date();
        trip.logs.push({ status: 'completed', note: 'Trip completed by driver' });
        await trip.save();

        await Vehicle.findByIdAndUpdate(trip.vehicleId, { status: 'active' });
        await WmsDriver.findByIdAndUpdate(req.driverId, { status: 'active', currentVehicleId: null });

        res.json({
            success: true,
            trip: {
                _id: trip._id,
                tripId: trip.tripId,
                status: trip.status
            },
            message: 'Trip completed'
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

export default router;
