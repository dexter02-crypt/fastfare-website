import express from 'express';

const router = express.Router();

// In-memory store for active tracking sessions
const activeTracking = new Map();

let io = null;
export const setWmsTrackingIo = (socketIo) => {
    io = socketIo;
};

// POST /api/wms/tracking/live-update
router.post('/live-update', (req, res) => {
    const { trackingId, lat, lng, driverId, speed, heading, timestamp } = req.body;

    if (!trackingId || lat === undefined || lng === undefined) {
        return res.status(400).json({ success: false, message: 'trackingId, lat, and lng are required' });
    }

    const locationData = {
        trackingId, lat, lng,
        driverId: driverId || 'unknown',
        speed: speed || 0,
        heading: heading || 0,
        timestamp: timestamp || new Date().toISOString()
    };

    activeTracking.set(trackingId, locationData);

    if (io) {
        io.to(trackingId).emit('driver_location_update', locationData);
        io.emit('locationUpdate', locationData);
    }

    res.json({ success: true, received: locationData });
});

// GET /api/wms/tracking/:trackingId
router.get('/:trackingId', (req, res) => {
    const { trackingId } = req.params;
    const location = activeTracking.get(trackingId);
    if (!location) {
        return res.status(404).json({ success: false, message: 'No active tracking found for this ID' });
    }
    res.json({ success: true, location });
});

// GET /api/wms/tracking
router.get('/', (req, res) => {
    const sessions = Array.from(activeTracking.entries()).map(([id, data]) => ({ trackingId: id, ...data }));
    res.json({ success: true, count: sessions.length, sessions });
});

export default router;
