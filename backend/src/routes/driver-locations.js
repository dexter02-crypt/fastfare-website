import express from 'express';
import { getDriverPositions, updateDriverPosition } from '../socket/location.socket.js';

const router = express.Router();

// GET /api/driver-locations — returns all live driver positions
router.get('/', (req, res) => {
    const positions = getDriverPositions();
    res.json({
        success: true,
        count: positions.length,
        drivers: positions
    });
});

// POST /api/driver-locations/live-update — HTTP fallback for driver location updates
router.post('/live-update', (req, res) => {
    const { driverId, driverName, lat, lng, timestamp } = req.body;

    if (!driverId || lat === undefined || lng === undefined) {
        return res.status(400).json({
            success: false,
            error: 'driverId, lat, and lng are required'
        });
    }

    // Store the position in the in-memory store
    updateDriverPosition({
        driverId,
        driverName: driverName || driverId,
        lat,
        lng,
        timestamp: timestamp || Date.now()
    });

    // Broadcast via Socket.io to all dashboard listeners
    const io = req.app.get('io');
    if (io) {
        const locationData = {
            driverId,
            driverName: driverName || driverId,
            lat,
            lng,
            timestamp: timestamp || Date.now()
        };
        io.to('dashboard').emit('locationUpdate', locationData);
        io.emit('locationUpdate', locationData);
    }

    res.json({ success: true, message: 'Location updated' });
});

export default router;
