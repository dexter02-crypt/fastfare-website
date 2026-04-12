import jwt from 'jsonwebtoken';
import User from '../models/User.js';

const autoDeclineTimers = new Map();
let ioInstance;

// Initialize socket handlers
export const initSocket = (io) => {
    ioInstance = io;
    // Non-blocking authentication middleware — attaches user if token present
    io.use(async (socket, next) => {
        try {
            const token = socket.handshake.auth?.token;
            if (token) {
                const decoded = jwt.verify(token, process.env.JWT_SECRET);
                const user = await User.findById(decoded.id).select('-password');
                if (user) {
                    socket.user = user;
                }
            }
        } catch (error) {
            // Token invalid/expired — continue without user (don't block)
            console.log('Socket auth skip:', error.message);
        }
        next();
    });

    io.on('connection', (socket) => {
        const user = socket.user;
        if (!user) return; // Not an authenticated web-app connection — skip room joining

        const userId = user._id.toString();
        const role = user.role;

        // Join role-based room
        if (role === 'admin') {
            socket.join(`admin:${userId}`);
        } else if (role === 'shipment_partner') {
            socket.join(`partner:${userId}`);
        } else {
            socket.join(`user:${userId}`);
        }

        console.log(`Socket connected: ${user.email} (${role})`);

        // Handle explicit room join from frontend
        socket.on('join', (room) => {
            socket.join(room);
        });

        // Handle disconnect
        socket.on('disconnect', () => {
            console.log(`Socket disconnected: ${user.email}`);
        });
    });
};

export const getIO = () => ioInstance;

// Emit new order assignment to partner
export const emitOrderAssignment = (io, order, partnerId) => {
    const payload = {
        orderId: order._id,
        orderId: order.orderId,
        pickup: order.pickup,
        delivery: order.address,
        weight: order.weight,
        orderValue: order.orderValue,
        orderType: order.orderType,
        customerFirstName: order.customer?.name?.split(' ')[0]
    };

    io.to(`partner:${partnerId}`).emit('order:new_assignment', payload);

    // Start auto-decline timer (5 minutes)
    const timer = setTimeout(async () => {
        const Order = (await import('../models/Order.js')).default;
        const updatedOrder = await Order.findById(order._id);
        
        if (updatedOrder && updatedOrder.orderStatus === 'New') {
            updatedOrder.orderStatus = 'Declined';
            await updatedOrder.save();

            io.to(`user:${order.userId}`).emit('order:auto_declined', { 
                orderId: order._id, 
                orderNumber: order.orderId 
            });
        }
        
        autoDeclineTimers.delete(order._id.toString());
    }, 300000); // 5 minutes

    autoDeclineTimers.set(order._id.toString(), timer);
};

// Accept order
export const emitOrderAccepted = async (io, orderId, userId) => {
    const timer = autoDeclineTimers.get(orderId);
    if (timer) {
        clearTimeout(timer);
        autoDeclineTimers.delete(orderId);
    }

    io.to(`user:${userId}`).emit('order:accepted', { orderId });
};

// Decline order
export const emitOrderDeclined = async (io, orderId, userId) => {
    const timer = autoDeclineTimers.get(orderId);
    if (timer) {
        clearTimeout(timer);
        autoDeclineTimers.delete(orderId);
    }

    io.to(`user:${userId}`).emit('order:declined', { orderId });
};

// Emit in-transit status to user
export const emitInTransit = (io, order, userId) => {
    io.to(`user:${userId}`).emit('order:in_transit', { 
        orderId: order._id, 
        orderNumber: order.orderId,
        timestamp: new Date() 
    });
};

export default { initSocket, getIO, emitOrderAssignment, emitOrderAccepted, emitOrderDeclined, emitInTransit };