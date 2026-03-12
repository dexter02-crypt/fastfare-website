/**
 * Socket.io handler for real-time location tracking
 * Includes in-memory store for latest driver positions
 */

// In-memory store: driverId → { lat, lng, driverId, driverName, timestamp, socketId }
const driverPositions = new Map();

// In-memory store for fleet tracking - MODULE LEVEL
const activeDrivers = new Map();
const driverShipmentMap = new Map();

export const getDriverPositions = () => {
    return Array.from(driverPositions.values());
};

export const getActiveDrivers = () => {
    return Array.from(activeDrivers.values());
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

        socket.on('join:fleet-room', () => {
            socket.join('fleet-room');
            console.log(`[Socket] Socket ${socket.id} joined fleet-room`);

            // Immediately send current driver list to the newly joined client
            socket.emit('fleet:drivers-update', {
                drivers: Array.from(activeDrivers.values()),
                total: activeDrivers.size,
                active: Array.from(activeDrivers.values()).filter(d => d.status === 'active').length,
                idle: Array.from(activeDrivers.values()).filter(d => d.status === 'idle').length,
            });
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

        socket.on('get:driver-location', ({ driverId }) => {
            const driver = activeDrivers.get(driverId);
            if (driver) {
                socket.emit('driver:current-location', driver);
            }
        });

        socket.on('join:shipment-room', ({ shipmentId }) => {
            socket.join(`shipment-${shipmentId}`);
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

        // ── DRIVER GOES ONLINE (called by Driver App when On Duty toggled) ──
        socket.on('driver:online', (data) => {
            console.log('[Socket] Driver online:', data.driverId);
            socket.join('fleet-room');
            socket.join(`driver-${data.driverId}`);

            activeDrivers.set(data.driverId, {
                driverId: data.driverId,
                driverName: data.driverName,
                vehicleNumber: data.vehicleNumber || '',
                lat: data.lat || 28.4595,
                lng: data.lng || 77.0266,
                speed: 0,
                status: 'active',
                socketId: socket.id,
                lastSeen: Date.now(),
            });

            console.log('[Socket] Active drivers now:', activeDrivers.size);

            // Broadcast updated driver list to ALL fleet-room subscribers
            io.to('fleet-room').emit('fleet:drivers-update', {
                drivers: Array.from(activeDrivers.values()),
                total: activeDrivers.size,
                active: Array.from(activeDrivers.values()).filter(d => d.status === 'active').length,
                idle: Array.from(activeDrivers.values()).filter(d => d.status === 'idle').length,
            });

            // Keep legacy update
            updateDriverPosition({
                driverId: data.driverId,
                driverName: data.driverName || data.driverId,
                lat: data.lat || 28.4595,
                lng: data.lng || 77.0266,
                online: true,
                timestamp: data.timestamp || Date.now(),
                socketId: socket.id
            });
        });

        // ── DRIVER LOCATION UPDATE (called every 10 seconds while On Duty) ──
        socket.on('driver:location-update', (data) => {
            console.log('[Socket] Location update from:', data.driverId, data.lat, data.lng);

            if (activeDrivers.has(data.driverId)) {
                const driver = activeDrivers.get(data.driverId);
                driver.lat = data.lat;
                driver.lng = data.lng;
                driver.speed = data.speed || 0;
                driver.lastSeen = Date.now();
                driver.status = 'active';
                activeDrivers.set(data.driverId, driver);
            } else {
                // Driver sent location but wasn't in map — re-add them
                socket.emit('driver:request-online'); // ask driver to re-emit driver:online
            }

            // Broadcast individual location to fleet-room (for real-time marker movement)
            io.to('fleet-room').emit('driver:location', {
                driverId: data.driverId,
                driverName: data.driverName,
                lat: data.lat,
                lng: data.lng,
                speed: data.speed || 0,
                timestamp: data.timestamp,
            });

            // Also broadcast to the specific shipment room if driver is on a trip
            const assignedShipmentId = driverShipmentMap.get(data.driverId);
            if (assignedShipmentId) {
                io.to(`shipment-${assignedShipmentId}`).emit('driver:location', {
                    driverId: data.driverId,
                    lat: data.lat,
                    lng: data.lng,
                    speed: data.speed || 0,
                    timestamp: data.timestamp,
                });
            }

            // Keep legacy broadcast mapping
            updateDriverPosition({
                driverId: data.driverId,
                driverName: data.driverName || data.driverId,
                lat: data.lat,
                lng: data.lng,
                online: true,
                timestamp: data.timestamp || Date.now(),
                socketId: socket.id
            });
            io.to('dashboard').emit('locationUpdate', data);
            io.emit('driver_location_broadcast', {
                driver_id: data.driverId,
                lat: data.lat,
                lng: data.lng,
                timestamp: data.timestamp
            });
        });

        // ── DRIVER GOES OFFLINE ──
        socket.on('driver:offline', (data) => {
            console.log('[Socket] Driver offline:', data.driverId);
            activeDrivers.delete(data.driverId);
            socket.leave('fleet-room');
            io.to('fleet-room').emit('fleet:drivers-update', {
                drivers: Array.from(activeDrivers.values()),
                total: activeDrivers.size,
                active: Array.from(activeDrivers.values()).filter(d => d.status === 'active').length,
                idle: 0,
            });

            // Legacy cleanup
            const dId = data.driverId;
            if (dId) {
                driverPositions.delete(dId);
                io.to('dashboard').emit('driver_went_offline', { driver_id: dId });
            }
        });

        // ── AUTO CLEANUP ON DISCONNECT ──
        socket.on('disconnect', (reason) => {
            console.log('[Socket] Disconnected:', socket.id, reason);
            for (const [driverId, driver] of activeDrivers.entries()) {
                if (driver.socketId === socket.id) {
                    activeDrivers.delete(driverId);
                    io.to('fleet-room').emit('fleet:drivers-update', {
                        drivers: Array.from(activeDrivers.values()),
                        total: activeDrivers.size,
                        active: Array.from(activeDrivers.values()).filter(d => d.status === 'active').length,
                        idle: 0,
                    });
                    console.log('[Socket] Auto-removed driver on disconnect:', driverId);
                    break;
                }
            }

            // Legacy disconnect
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
