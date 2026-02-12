/**
 * Socket.io handler for real-time location tracking
 * Enables driver apps to send live location and dashboards to receive updates
 */

const locationSocket = (io) => {
    io.on('connection', (socket) => {
        console.log('Client connected:', socket.id);

        // Join a tracking room by trip/tracking ID
        socket.on('join_tracking', (trackingId) => {
            socket.join(trackingId);
            console.log(`Socket ${socket.id} joined tracking room: ${trackingId}`);
        });

        // Receive location update from driver
        socket.on('update_location', (data) => {
            console.log(`Location update from ${socket.id}:`, data);

            // Broadcast to specific tracking room
            if (data.trackingId) {
                io.to(data.trackingId).emit('driver_location_update', data);
            }

            // Also broadcast to all connected dashboards
            io.emit('locationUpdate', data);
        });

        // Driver goes online/offline
        socket.on('driver_status', (data) => {
            console.log(`Driver status update:`, data);
            io.emit('driver_status_update', data);
        });

        socket.on('disconnect', () => {
            console.log('Client disconnected:', socket.id);
        });
    });
};

module.exports = { locationSocket };
