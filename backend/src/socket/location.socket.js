/**
 * Socket.io handler for real-time location tracking
 * Includes in-memory store for latest driver positions
 */

// In-memory store: driverId → { lat, lng, driverId, driverName, timestamp, socketId }
const driverPositions = new Map();

export const getDriverPositions = () => {
    return Array.from(driverPositions.values());
};

/**
 * Notify a carrier's connected dashboard clients via Socket.IO.
 * Call from HTTP routes: const { notifyCarrier } = await import('../socket/location.socket.js');
 */
export const notifyCarrier = (io, carrierId, event, data) => {
    if (io) {
        io.to(`carrier_${carrierId}`).emit(event, data);
    }
};

export const updateDriverPosition = (data) => {
    driverPositions.set(data.driverId, {
        ...data,
        timestamp: data.timestamp || Date.now()
    });
};

export const locationSocket = (io) => {
    io.on('connection', (socket) => {

        // Parse query params for driver identification
        const query = socket.handshake.query || {};
        const clientType = query.type; // 'driver' or 'dashboard'
        const driverId = query.driverId;

        if (clientType === 'driver' && driverId) {
            socket.join(`driver_${driverId}`);
        }

        // Dashboard joins a room to receive all location updates
        socket.on('join_dashboard', () => {
            socket.join('dashboard');

            // Send current known positions immediately
            const positions = getDriverPositions();
            socket.emit('all_driver_positions', positions);
        });

        socket.on('join_tracking', (trackingId) => {
            socket.join(trackingId);
        });

        // Carrier dashboard clients join their carrier room
        socket.on('join_carrier', (data) => {
            if (data && data.carrierId) {
                socket.join(`carrier_${data.carrierId}`);
                console.log(`Carrier ${data.carrierId} joined room via socket ${socket.id}`);
            }
        });

        socket.on('join_driver', (data) => {
            const dId = data.driverId || data.driver_id;
            if (dId) {
                socket.join(`driver_${dId}`);
                socket.join(dId); // Ensure they join their own raw ID room too
            }
        });

        // Join partner room
        socket.on('join_partner', (data) => {
            const pId = data.partnerId || data.partner_id;
            if (pId) {
                socket.join(`partner_${pId}`);
            }
        });

        socket.on('update_location', (data) => {

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
            io.emit('driver_status_update', data);
            io.to('dashboard').emit('driver_status_update', data);
        });

        // Driver explicitly sends location update
        socket.on('driver_location_update', (data) => {
            if (data.driver_id) {
                updateDriverPosition({
                    driverId: data.driver_id,
                    lat: data.lat,
                    lng: data.lng,
                    timestamp: data.timestamp || Date.now(),
                    socketId: socket.id,
                    status: data.status,
                    online: true
                });

                // Broadcast to listeners (Partner/User)
                io.emit('driver_location_broadcast', data);
            }
        });

        // Driver came online explicitly
        socket.on('driver_came_online', (data) => {
            if (data.driver_id) {
                updateDriverPosition({
                    driverId: data.driver_id,
                    online: true,
                    timestamp: Date.now(),
                    socketId: socket.id
                });
                io.emit('driver_came_online', data);
            }
        });

        // Driver explicitly stops tracking
        socket.on('driver_went_offline', (data) => {
            const dId = data.driverId || data.driver_id;
            if (dId) {
                driverPositions.delete(dId);
                io.to('dashboard').emit('driver_went_offline', { driver_id: dId });
                io.to('fleet-room').emit('driver:went-offline', { driverId: dId });
                io.emit('driver_went_offline', { driver_id: dId });
            }
        });

        // Bug 6: fleet-room events emitted by the driver app
        socket.on('driver:go-online', (data) => {
            if (data.driverId) {
                updateDriverPosition({
                    driverId: data.driverId,
                    driverName: data.driverName || data.driverId,
                    lat: data.lat,
                    lng: data.lng,
                    online: true,
                    timestamp: data.timestamp || Date.now(),
                    socketId: socket.id
                });
                // Broadcast to fleet tracking room and dashboard
                io.to('fleet-room').emit('driver:location', {
                    driverId: data.driverId,
                    driverName: data.driverName,
                    lat: data.lat,
                    lng: data.lng,
                    online: true,
                    timestamp: data.timestamp || Date.now()
                });
                io.to('dashboard').emit('locationUpdate', data);
            }
        });

        socket.on('driver:location', (data) => {
            if (data.driverId) {
                updateDriverPosition({
                    driverId: data.driverId,
                    driverName: data.driverName || data.driverId,
                    lat: data.lat,
                    lng: data.lng,
                    online: true,
                    timestamp: data.timestamp || Date.now(),
                    socketId: socket.id
                });
                io.to('fleet-room').emit('driver:location', data);
                io.to('dashboard').emit('locationUpdate', data);
                io.emit('driver_location_broadcast', {
                    driver_id: data.driverId,
                    lat: data.lat,
                    lng: data.lng,
                    timestamp: data.timestamp
                });
            }
        });

        socket.on('driver:went-offline', (data) => {
            const dId = data.driverId || data.driver_id;
            if (dId) {
                driverPositions.delete(dId);
                io.to('fleet-room').emit('driver:went-offline', { driverId: dId });
                io.to('dashboard').emit('driver_went_offline', { driver_id: dId });
            }
        });

        socket.on('disconnect', () => {
            if (clientType === 'driver' && driverId) {
                // Remove after a short grace period (driver may reconnect)
                setTimeout(() => {
                    const pos = driverPositions.get(driverId);
                    // Only remove if this socket was the last one for this driver
                    if (pos && pos.socketId === socket.id) {
                        driverPositions.delete(driverId);
                        io.to('dashboard').emit('driver_went_offline', { driverId });
                        io.emit('driver_went_offline', { driverId });
                    }
                }, 30000); // 30s grace period
            }
        });
    });
};
