/**
 * Live tracking routes - REST API fallback for location updates
 * Mobile apps can POST location here if socket connection fails
 */
const express = require('express');
const router = express.Router();

// Store for active tracking sessions (in-memory for now)
const activeTracking = new Map();

// Get io instance (will be set from index.js)
let io = null;
const setIo = (socketIo) => {
    io = socketIo;
};

// @route   POST /api/tracking/live-update
// @desc    Receive live location update from driver (HTTP fallback)
router.post('/live-update', (req, res) => {
    const { trackingId, lat, lng, driverId, speed, heading, timestamp } = req.body;

    if (!trackingId || lat === undefined || lng === undefined) {
        return res.status(400).json({
            success: false,
            message: 'trackingId, lat, and lng are required'
        });
    }

    const locationData = {
        trackingId,
        lat,
        lng,
        driverId: driverId || 'unknown',
        speed: speed || 0,
        heading: heading || 0,
        timestamp: timestamp || new Date().toISOString()
    };

    // Store latest location
    activeTracking.set(trackingId, locationData);

    // Broadcast via Socket.io if available
    if (io) {
        io.to(trackingId).emit('driver_location_update', locationData);
        io.emit('locationUpdate', locationData);
    }

    console.log(`Location update received: ${trackingId} -> ${lat}, ${lng}`);

    res.json({ success: true, received: locationData });
});

// @route   GET /api/tracking/:trackingId
// @desc    Get last known location for a tracking ID
router.get('/:trackingId', (req, res) => {
    const { trackingId } = req.params;
    const location = activeTracking.get(trackingId);

    if (!location) {
        return res.status(404).json({
            success: false,
            message: 'No active tracking found for this ID'
        });
    }

    res.json({ success: true, location });
});

// @route   GET /api/tracking
// @desc    Get all active tracking sessions
router.get('/', (req, res) => {
    const sessions = Array.from(activeTracking.entries()).map(([id, data]) => ({
        trackingId: id,
        ...data
    }));

    res.json({ success: true, count: sessions.length, sessions });
});

module.exports = { router, setIo };
