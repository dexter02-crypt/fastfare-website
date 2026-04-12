import express from 'express';
import { z } from 'zod';
import Order from '../models/Order.js';
import Shipment from '../models/Shipment.js';
import User from '../models/User.js';
import Settlement from '../models/Settlement.js';
import { protect } from '../middleware/auth.js';
import logger from '../utils/logger.js';
import { sendOrderAssignmentToPartner, sendOrderConfirmationToUser, sendOrderAcceptedToUser, sendOrderDeclinedToUser, notifyUserStatusUpdate } from '../services/emailService/index.js';
import { emitOrderAssignment, emitOrderAccepted, emitOrderDeclined, emitInTransit } from '../services/socket.js';

const router = express.Router();

// Generate a random Order ID (e.g. ORD-FF-8A91B)
const generateOrderId = () => `ORD-FF-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;

// Zod validation schema for order creation (minimum order value validation)
const createOrderSchema = z.object({
    orderValue: z.number().min(150, "Order value must be at least ₹150")
});

// @route   GET /api/orders/stats/dashboard
// @desc    Aggregated stats for the Dashboard page (orders + shipments + wallet)
// @access  Private
router.get('/stats/dashboard', protect, async (req, res) => {
    try {
        const userId = req.user._id;

        // Run all queries in parallel for speed
        const [
            totalOrders,
            deliveredOrders,
            newOrders,
            processingOrders,
            cancelledOrders,
            inTransitShipments,
            rtoShipments,
            deliveredShipments,
            codAgg,
            revenueAgg,
            recentOrders,
            user
        ] = await Promise.all([
            Order.countDocuments({ userId }),
            Order.countDocuments({ userId, orderStatus: 'Delivered' }),
            Order.countDocuments({ userId, orderStatus: 'New' }),
            Order.countDocuments({ userId, orderStatus: { $in: ['Processing', 'Confirmed'] } }),
            Order.countDocuments({ userId, orderStatus: 'Cancelled' }),
            Shipment.countDocuments({ user: userId, status: { $in: ['in_transit', 'partner_assigned', 'picked_up'] } }),
            Shipment.countDocuments({ user: userId, status: 'returned' }),
            Shipment.countDocuments({ user: userId, status: 'delivered' }),
            // COD pending aggregation
            Shipment.aggregate([
                { $match: { user: userId, paymentMode: 'COD', codStatus: { $ne: 'remitted' } } },
                { $group: { _id: null, total: { $sum: '$codAmount' } } }
            ]),
            // Total order revenue
            Order.aggregate([
                { $match: { userId } },
                { $group: { _id: null, total: { $sum: '$orderValue' } } }
            ]),
            // Recent 5 orders
            Order.find({ userId }).sort({ createdAt: -1 }).limit(5).lean(),
            // Wallet balance
            User.findById(userId).select('walletBalance businessName').lean()
        ]);

        res.json({
            success: true,
            stats: {
                totalOrders,
                deliveredOrders,
                newOrders,
                processingOrders,
                cancelledOrders,
                inTransitShipments,
                rtoShipments,
                deliveredShipments,
                codPendingAmount: codAgg[0]?.total || 0,
                totalRevenue: revenueAgg[0]?.total || 0,
                walletBalance: user?.walletBalance || 0,
                businessName: user?.businessName || 'User',
                recentOrders
            }
        });
    } catch (error) {
        console.error('Dashboard stats error:', error);
        res.status(500).json({ success: false, message: 'Failed to load dashboard stats' });
    }
});

// @route   GET /api/orders/my-orders
// @desc    Get all orders for the logged-in user
// @access  Private
router.get('/my-orders', protect, async (req, res) => {
    try {
        const { stage, orderStage } = req.query;
        const query = { userId: req.user.id };
        
        // Filter by stage if provided
        if (stage || orderStage) {
            query.orderStage = stage || orderStage;
        }
        
        const orders = await Order.find(query).sort({ createdAt: -1 });
        res.json({ success: true, count: orders.length, orders });
    } catch (error) {
        console.error('Error fetching orders:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// @route   GET /api/orders/summary
// @desc    Get order summary counts for authenticated user
// @access  Private
router.get('/summary', protect, async (req, res) => {
    try {
        const userId = req.user._id;
        
        const [total, active, delivered, pending] = await Promise.all([
            Order.countDocuments({ userId }),
            Order.countDocuments({ userId, orderStatus: { $in: ['New', 'Pending', 'Confirmed', 'Processing'] } }),
            Order.countDocuments({ userId, orderStatus: 'Delivered' }),
            Order.countDocuments({ userId, orderStatus: { $in: ['New', 'Pending'] } })
        ]);

        res.json({ success: true, summary: { total, active, delivered, pending } });
    } catch (error) {
        console.error('Error fetching order summary:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// @route   GET /api/orders/recent
// @desc    Get recent orders for authenticated user
// @access  Private
router.get('/recent', protect, async (req, res) => {
    try {
        const userId = req.user._id;
        const limit = parseInt(req.query.limit) || 5;
        
        const orders = await Order.find({ userId })
            .sort({ createdAt: -1 })
            .limit(limit)
            .select('orderId orderStatus orderStage orderValue address customer createdAt')
            .lean();

        const ordersWithPartner = await Promise.all(orders.map(async (order) => {
            const partner = order.partnerId ? await User.findById(order.partnerId).select('businessName contactPerson').lean() : null;
            return {
                ...order,
                partnerName: partner?.businessName || partner?.contactPartne || null,
                orderHistory: order.orderHistory || []
            };
        }));

        res.json({ success: true, orders: ordersWithPartner });
    } catch (error) {
        console.error('Error fetching recent orders:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// @route   POST /api/orders
// @desc    Create a new order (used for Manual Create & Duplication)
// @access  Private
router.post('/', protect, async (req, res) => {
    try {
        // Validate minimum order value
        const orderValue = req.body.orderValue;
        const validation = createOrderSchema.safeParse({ orderValue });
        
        if (!validation.success) {
            const errorMessage = validation.error.errors[0]?.message || "Order value must be at least ₹150";
            logger.warn(`Order value validation failed for user ${req.user.id}: ${errorMessage}`);
            return res.status(422).json({ success: false, error: "Order value must be at least ₹150" });
        }

        const count = await Order.countDocuments({ userId: req.user.id });
        const orderId = `ORD-FF-${String(10001 + count).padStart(5, '0')}`;

        const newOrder = new Order({
            ...req.body,
            orderId,
            userId: req.user.id
        });

        await newOrder.save();

        // Send email notifications (fire-and-forget)
        const user = await User.findById(req.user._id).select('email contactPerson businessName').lean();
        if (user?.email) {
            sendOrderConfirmationToUser({
                orderId: newOrder.orderId,
                userEmail: user.email,
                userName: user.contactPerson || user.businessName || 'Customer',
                pickup: newOrder.address?.line1,
                delivery: newOrder.address?.city,
                orderValue: newOrder.orderValue,
                partnerBusinessName: 'Assigned Partner'
            });
        }

        // If partner assigned, notify them
        if (req.body.partnerId) {
            const partner = await User.findById(req.body.partnerId).select('email businessName contactPerson').lean();
            if (partner?.email) {
                sendOrderAssignmentToPartner({
                    orderId: newOrder.orderId,
                    partnerEmail: partner.email,
                    partnerName: partner.businessName || partner.contactPerson || 'Partner',
                    pickupAddress: newOrder.address?.line1,
                    pickupCity: newOrder.address?.city,
                    deliveryAddress: newOrder.address?.line2,
                    deliveryCity: newOrder.address?.city,
                    orderValue: newOrder.orderValue,
                    orderType: newOrder.orderType || 'prepaid',
                    customerName: newOrder.customer?.name?.split(' ')[0],
                    packageWeight: req.body.weight || 1
                });

                // Emit socket event to partner (fire-and-forget)
                const io = req.app.get('io');
                if (io && partner?._id) {
                    emitOrderAssignment(io, {
                        _id: newOrder._id,
                        orderId: newOrder.orderId,
                        pickup: newOrder.pickup || newOrder.address?.line1,
                        delivery: newOrder.address,
                        weight: req.body.weight || 1,
                        orderValue: newOrder.orderValue,
                        orderType: newOrder.orderType || 'prepaid',
                        customer: newOrder.customer
                    }, partner._id.toString());
                }
            }
        }

        res.status(201).json({ success: true, order: newOrder });
    } catch (error) {
        console.error('Error creating order:', error);
        res.status(500).json({ success: false, message: error.message || 'Server error while creating order.' });
    }
});

// @route   PUT /api/orders/:id
// @desc    Update/Edit an order fully
// @access  Private
router.put('/:id', protect, async (req, res) => {
    try {
        let order = await Order.findById(req.params.id);

        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }

        // Ensure user owns the order or is admin
        if (order.userId.toString() !== req.user.id && req.user.role !== 'admin') {
            return res.status(401).json({ success: false, message: 'Not authorized' });
        }

        // Apply edits (excluding protected fields)
        const allowedUpdates = ['customer', 'address', 'items', 'orderValue', 'paymentStatus', 'channel', 'notes'];

        allowedUpdates.forEach(field => {
            if (req.body[field] !== undefined) {
                order[field] = req.body[field];
            }
        });

        // Recalculate array sub-totals if items changed
        if (req.body.items) {
            order.items.forEach(item => {
                item.total = item.qty * item.unitPrice;
            });
        }

        await order.save();

        res.json({ success: true, order });
    } catch (error) {
        console.error('Error updating order:', error);
        res.status(500).json({ success: false, message: 'Server error upgrading order.' });
    }
});

// @route   PATCH /api/orders/:id/status
// @desc    Quickly update just the order status
// @access  Private
router.patch('/:id/status', protect, async (req, res) => {
    try {
        const { status } = req.body;

        if (!status) {
            return res.status(400).json({ success: false, message: 'Status is required' });
        }

        let order = await Order.findById(req.params.id);

        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }

        if (order.userId.toString() !== req.user.id && req.user.role !== 'admin') {
            return res.status(401).json({ success: false, message: 'Not authorized' });
        }

        order.orderStatus = status;

        // If converted to shipment, optionally link here (body can include linkedAwb)
        if (req.body.linkedAwb) order.linkedAwb = req.body.linkedAwb;

        await order.save();

        // Send status update email to user (fire-and-forget)
        const user = await User.findById(order.userId).select('email contactPerson').lean();
        if (user?.email) {
            notifyUserStatusUpdate({
                orderId: order.orderId,
                userEmail: user.email,
                userName: user.contactPerson || 'Customer',
                status: status,
                deliveryCity: order.address?.city,
                estimatedDelivery: req.body.estimatedDelivery,
                failureReason: req.body.failureReason,
                orderHistory: order.orderHistory || []
            });
        }

        // Emit socket event for status update (fire-and-forget)
        const io = req.app.get('io');
        if (io) {
            io.to(`user:${order.userId}`).emit('order:status_updated', {
                orderId: order._id,
                newStatus: status,
                partnerName: req.user.businessName || req.user.contactPerson || 'Partner',
                timestamp: new Date()
            });
            if (order.partnerId) {
                io.to(`partner:${order.partnerId}`).emit('order:status_updated', {
                    orderId: order._id,
                    newStatus: status,
                    partnerName: req.user.businessName,
                    timestamp: new Date()
                });
            }
        }

        res.json({ success: true, order });
    } catch (error) {
        console.error('Error updating order status:', error);
        res.status(500).json({ success: false, message: 'Server error updating status.' });
    }
});

// @route   PATCH /api/orders/:id/accept
// @desc    Accept order assignment
// @access  Private (Partner)
router.patch('/:id/accept', protect, async (req, res) => {
    try {
        const order = await Order.findById(req.params.id);
        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }

        order.orderStatus = 'Accepted';
        await order.save();

        // Emit accepted event to user
        const io = req.app.get('io');
        if (io) {
            emitOrderAccepted(io, order._id.toString(), order.userId.toString());
            io.to(`user:${order.userId}`).emit('order:accepted', {
                orderId: order.orderId,
                partnerName: req.user.businessName || req.user.contactPerson || 'Partner',
                timestamp: new Date()
            });
        }

        res.json({ success: true, order });
    } catch (error) {
        console.error('Error accepting order:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// @route   PATCH /api/orders/:id/decline
// @desc    Decline order assignment
// @access  Private (Partner)
router.patch('/:id/decline', protect, async (req, res) => {
    try {
        const order = await Order.findById(req.params.id);
        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }

        order.orderStatus = 'Declined';
        await order.save();

        // Emit declined event to user
        const io = req.app.get('io');
        if (io) {
            emitOrderDeclined(io, order._id.toString(), order.userId.toString());
            io.to(`user:${order.userId}`).emit('order:declined', {
                orderId: order.orderId,
                isAutoDeclined: false,
                timestamp: new Date()
            });
        }

        res.json({ success: true, order });
    } catch (error) {
        console.error('Error declining order:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// @route   PATCH /api/orders/:id/intransit
// @desc    Mark order as in transit
// @access  Private (Partner)
router.patch('/:id/intransit', protect, async (req, res) => {
    try {
        const order = await Order.findById(req.params.id);
        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }

        order.orderStatus = 'In Transit';
        order.orderStage = 'in_transit';
        await order.save();

        // Emit in_transit event to user
        const io = req.app.get('io');
        if (io) {
            emitInTransit(io, order, order.userId.toString());
        }

        res.json({ success: true, order });
    } catch (error) {
        console.error('Error marking in transit:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// @route   DELETE /api/orders/:id
// @desc    Cancel/Delete an order (We use status updates, but included for completeness)
// @access  Private
router.delete('/:id', protect, async (req, res) => {
    try {
        const order = await Order.findById(req.params.id);

        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }

        if (order.userId.toString() !== req.user.id && req.user.role !== 'admin') {
            return res.status(401).json({ success: false, message: 'Not authorized' });
        }

        await order.deleteOne();

        res.json({ success: true, message: 'Order removed' });
    } catch (error) {
        console.error('Error deleting order:', error);
        res.status(500).json({ success: false, message: 'Server error.' });
    }
});

// @route   PATCH /api/orders/:id/stage
// @desc    Update order stage (Admin: any direction, Partner: forward only)
// @access  Private
router.patch('/:id/stage', protect, async (req, res) => {
    try {
        const { stage, note } = req.body;
        const validStages = ['direct_shipment', 'warehouse_scans', 'in_transit', 'out_for_delivery', 'delivered', 'failed_delivery', 'returned', 'cancelled'];
        
        if (!stage || !validStages.includes(stage)) {
            return res.status(400).json({ success: false, error: 'Invalid stage value' });
        }

        const order = await Order.findById(req.params.id);
        if (!order) {
            return res.status(404).json({ success: false, error: 'Order not found' });
        }

        // Check authorization
        const isAdmin = req.user.role === 'admin';
        const isPartner = req.user.role === 'shipment_partner';
        
        // Partner can only move forward (direct_shipment -> warehouse_scans)
        if (isPartner && !isAdmin) {
            const currentIndex = validStages.indexOf(order.orderStage);
            const newIndex = validStages.indexOf(stage);
            
            if (newIndex > currentIndex + 1) {
                return res.status(403).json({ success: false, error: 'Partners can only move orders forward to warehouse_scans stage' });
            }
            if (newIndex < currentIndex) {
                return res.status(403).json({ success: false, error: 'Partners cannot move orders backward. Contact admin for assistance.' });
            }
        }

        const previousStage = order.orderStage;
        order.orderStage = stage;
        
        // Add to history
        order.orderHistory.push({
            stage: stage,
            changedBy: req.user._id,
            timestamp: new Date(),
            note: note || null
        });

        await order.save();

        // Auto-create settlement when order is delivered
        if (stage === 'delivered' && order.partnerId) {
            const existingSettlement = await Settlement.findOne({ orderId: order._id });
            if (!existingSettlement) {
                const platformFeePercent = parseFloat(process.env.PLATFORM_FEE_PERCENT) || 5;
                const platformFee = (order.orderValue * platformFeePercent) / 100;
                const netAmount = order.orderValue - platformFee;

                await Settlement.create({
                    orderId: order._id,
                    partnerId: order.partnerId,
                    orderValue: order.orderValue,
                    platformFee,
                    netAmount,
                    settlementStatus: 'pending',
                    orderType: order.orderType || 'prepaid'
                });
            }
        }

        // Emit socket event
        const io = req.app.get('io');
        if (io) {
            io.to(`user:${order.userId}`).emit('order:stage_updated', { orderId: order._id, stage, previousStage });
            if (order.partnerId) {
                io.to(`partner:${order.partnerId}`).emit('order:stage_updated', { orderId: order._id, stage, previousStage });
            }
        }

        res.json({ success: true, order, previousStage, currentStage: stage });
    } catch (error) {
        console.error('Error updating order stage:', error);
        res.status(500).json({ success: false, error: 'Server error updating stage' });
    }
});

// @route   GET /api/orders/summary
// @desc    Get order summary counts for user dashboard
// @access  Private
router.get('/summary', protect, async (req, res) => {
    try {
        const userId = req.user._id;
        
        const [total, active, delivered, pending] = await Promise.all([
            Order.countDocuments({ userId }),
            Order.countDocuments({ userId, orderStatus: { $in: ['New', 'Pending', 'Confirmed', 'Processing', 'Shipped'] } }),
            Order.countDocuments({ userId, orderStatus: 'Delivered' }),
            Order.countDocuments({ userId, orderStatus: { $in: ['New', 'Pending'] } })
        ]);

        res.json({ success: true, summary: { total, active, delivered, pending } });
    } catch (error) {
        console.error('Error fetching order summary:', error);
        res.status(500).json({ success: false, error: 'Server error' });
    }
});

// @route   GET /api/orders/recent
// @desc    Get recent orders
// @access  Private
router.get('/recent', protect, async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 5;
        const orders = await Order.find({ userId: req.user._id })
            .sort({ createdAt: -1 })
            .limit(limit)
            .populate('partnerId', 'businessName name')
            .lean();

        const formattedOrders = orders.map(o => ({
            _id: o._id,
            orderId: o.orderId,
            destination: o.address?.city,
            status: o.orderStatus,
            orderStage: o.orderStage,
            partnerName: o.partnerId?.businessName || o.partnerId?.name || null,
            createdAt: o.createdAt
        }));

        res.json({ success: true, orders: formattedOrders });
    } catch (error) {
        console.error('Error fetching recent orders:', error);
        res.status(500).json({ success: false, error: 'Server error' });
    }
});

// @route   PATCH /api/orders/:id/stage
// @desc    Update order stage
// @access  Private
router.patch('/:id/stage', protect, async (req, res) => {
    try {
        const { stage, note } = req.body;
        const order = await Order.findById(req.params.id);

        if (!order) {
            return res.status(404).json({ success: false, error: 'Order not found' });
        }

        const userRole = req.user.role;
        const currentStage = order.orderStage || 'direct_shipment';

        // Stage order mapping
        const stageOrder = [
            'direct_shipment',
            'warehouse_scans',
            'in_transit',
            'out_for_delivery',
            'delivered',
            'failed_delivery',
            'returned',
            'cancelled'
        ];

        const currentIndex = stageOrder.indexOf(currentStage);
        const newIndex = stageOrder.indexOf(stage);

        // Partner can only move forward (direct_shipment -> warehouse_scans)
        if (userRole === 'shipment_partner') {
            if (newIndex <= currentIndex) {
                logger.warn(`Partner ${req.user.id} attempted backward stage move on order ${order.orderId}`);
                return res.status(403).json({ success: false, error: 'Partners can only move orders forward' });
            }
            if (newIndex > currentIndex + 1) {
                logger.warn(`Partner ${req.user.id} attempted invalid stage jump on order ${order.orderId}`);
                return res.status(403).json({ success: false, error: 'Invalid stage transition' });
            }
        }

        // Update order stage
        order.orderStage = stage;

        // Add to order history
        order.orderHistory.push({
            stage,
            changedBy: req.user._id,
            timestamp: new Date(),
            note: note || null
        });

        await order.save();

        // Auto-create settlement on delivery
        if (stage === 'delivered' && order.partnerId) {
            const existingSettlement = await Settlement.findOne({ orderId: order._id });
            if (!existingSettlement) {
                const platformFeePercent = parseFloat(process.env.PLATFORM_FEE_PERCENT) || 5;
                const platformFee = (order.orderValue * platformFeePercent) / 100;
                const netAmount = order.orderValue - platformFee;

                await Settlement.create({
                    orderId: order._id,
                    partnerId: order.partnerId,
                    orderValue: order.orderValue,
                    platformFee,
                    netAmount,
                    orderType: order.orderType || 'prepaid'
                });

                logger.info(`Settlement created for order ${order.orderId}: ₹${netAmount} to partner ${order.partnerId}`);
            }
        }

        // Emit socket event
        const io = req.app.get('io');
        if (io) {
            io.to(`user:${order.userId}`).emit('order:stage_updated', {
                orderId: order._id,
                orderStage: stage,
                timestamp: new Date()
            });
            if (order.partnerId) {
                io.to(`partner:${order.partnerId}`).emit('order:stage_updated', {
                    orderId: order._id,
                    orderStage: stage,
                    timestamp: new Date()
                });
            }
        }

        logger.info(`Order stage updated: ${order.orderId} -> ${stage} by ${req.user.id}`);

        res.json({ success: true, order });
    } catch (error) {
        console.error('Error updating order stage:', error);
        res.status(500).json({ success: false, error: 'Server error' });
    }
});

export default router;
