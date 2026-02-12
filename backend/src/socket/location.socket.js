/**
 * Socket.io handler for real-time location tracking
 * Includes in-memory store for latest driver positions
 */

// In-memory store: driverId → { lat, lng, driverId, driverName, timestamp, socketId }
const driverPositions = new Map();

export const getDriverPositions = () => {
    return Array.from(driverPositions.values());
};

export const updateDriverPosition = (data) => {
    driverPositions.set(data.driverId, {
        ...data,
        timestamp: data.timestamp || Date.now()
    });
};

export const locationSocket = (io) => {
    io.on('connection', (socket) => {
        console.log('Client connected:', socket.id);

        // Parse query params for driver identification
        const query = socket.handshake.query || {};
        const clientType = query.type; // 'driver' or 'dashboard'
        const driverId = query.driverId;

        if (clientType === 'driver' && driverId) {
            console.log(`Driver ${driverId} connected via socket ${socket.id}`);
        }

        // Dashboard joins a room to receive all location updates
        socket.on('join_dashboard', () => {
            socket.join('dashboard');
            console.log(`Dashboard client ${socket.id} joined dashboard room`);

            // Send current known positions immediately
            const positions = getDriverPositions();
            socket.emit('all_driver_positions', positions);
        });

        socket.on('join_tracking', (trackingId) => {
            socket.join(trackingId);
            console.log(`Socket ${socket.id} joined tracking room: ${trackingId}`);
        });

        socket.on('join_driver', (data) => {
            if (data && data.driverId) {
                socket.join(`driver_${data.driverId}`);
                console.log(`Driver ${data.driverId} joined personal room`);
            }
        });

        socket.on('update_location', (data) => {
            console.log(`📍 Location update from ${data.driverId || socket.id}:`,
                `lat=${data.lat}, lng=${data.lng}`);

            // Store latest position
            if (data.driverId) {
                updateDriverPosition({
                    driverId: data.driverId,
                    driverName: data.driverName || data.driverId,
                    lat: data.lat,
                    lng: data.lng,
                    timestamp: data.timestamp || Date.now(),
                    socketId: socket.id
                });
            }

            // Broadcast to tracking room
            if (data.trackingId) {
                io.to(data.trackingId).emit('driver_location_update', data);
            }

            // Broadcast to all dashboard clients
            io.to('dashboard').emit('locationUpdate', data);

            // Also broadcast globally for any listener
            io.emit('locationUpdate', data);
        });

        socket.on('driver_status', (data) => {
            console.log(`Driver status update:`, data);
            io.emit('driver_status_update', data);
            io.to('dashboard').emit('driver_status_update', data);
        });

        socket.on('disconnect', () => {
            console.log('Client disconnected:', socket.id);
            // Optionally mark driver as offline
            if (clientType === 'driver' && driverId) {
                const pos = driverPositions.get(driverId);
                if (pos && pos.socketId === socket.id) {
                    pos.online = false;
                    pos.disconnectedAt = Date.now();
                }
            }
        });
    });
};
