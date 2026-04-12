import express from 'express';
import { z } from 'zod';
import Order from '../models/Order.js';
import Shipment from '../models/Shipment.js';
import User from '../models/User.js';
import Settlement from '../models/Settlement.js';
import { protect } from '../middleware/auth.js';
import logger from '../utils/logger.js';
import { sendOrderAssignmentToPartner, sendOrderConfirmationToUser, sendOrderAcceptedToUser, sendOrderDeclinedToUser, notifyUserStatusUpdate } from '../services/emailService/index.js';
import { emitOrderAssignment, emitOrderAccepted, emitOrderDeclined, emitInTransit, getIO } from '../services/socket.js';

const router = express.Router();
const autoDeclineTimers = new Map();

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

        // BACKEND FIX 1 — ORDER CREATION NOTIFICATIONS
        Promise.resolve().then(async () => {
            try {
                let partner = null;
                if (req.body.partnerId) {
                    partner = await User.findById(req.body.partnerId).select('firstName lastName email phone businessName').lean();
                }
                const customer = await User.findById(req.user._id).select('firstName email contactPerson name').lean();
                
                if (partner?.email) {
                    sendOrderAssignmentToPartner({
                        partnerEmail: partner.email,
                        partnerFirstName: partner.firstName || partner.businessName || 'Partner',
                        orderId: newOrder._id.toString(),
                        orderNumber: newOrder.orderId,
                        customerFirstName: customer?.firstName || customer?.name?.split(' ')[0] || 'Customer',
                        pickupAddress: newOrder.address?.line1,
                        deliveryAddress: newOrder.address?.city,
                        packageWeight: req.body.weight || 1,
                        orderValue: newOrder.orderValue,
                        orderType: newOrder.orderType || 'prepaid',
                        reviewLink: process.env.BASE_URL + '/partner/orders'
                    }).catch(console.error);
                }

                if (customer?.email) {
                    sendOrderConfirmationToUser({
                        userEmail: customer.email,
                        userFirstName: customer.firstName || customer?.name?.split(' ')[0] || 'Customer',
                        orderId: newOrder._id.toString(),
                        orderNumber: newOrder.orderId,
                        partnerName: partner ? `${partner.firstName || ''} ${partner.lastName || ''}`.trim() : 'Assigned Partner',
                        pickupAddress: newOrder.address?.line1,
                        deliveryAddress: newOrder.address?.city,
                        orderValue: newOrder.orderValue,
                        trackingLink: process.env.BASE_URL + '/shipments'
                    }).catch(console.error);
                }

                if (partner) {
                    const io = req.app.get('io') || getIO();
                    if (io) {
                        io.to('partner:' + partner._id.toString()).emit('order:new_assignment', {
                            orderId: newOrder._id,
                            orderNumber: newOrder.orderId,
                            pickupAddress: newOrder.address?.line1,
                            deliveryAddress: newOrder.address?.city,
                            packageWeight: req.body.weight || 1,
                            orderValue: newOrder.orderValue,
                            orderType: newOrder.orderType || 'prepaid',
                            customerFirstName: customer?.firstName || customer?.name?.split(' ')[0] || 'Customer',
                            createdAt: newOrder.createdAt
                        });
                    }

                    const _oid = newOrder._id.toString();
                    const _uid = newOrder.userId.toString();
                    
                    const _t = setTimeout(async () => {
                        try {
                            const _o = await Order.findById(_oid);
                            if (_o && _o.orderStatus === 'New') {
                                _o.orderStatus = 'Cancelled';
                                await _o.save();
                                const _io = req.app.get('io') || getIO();
                                if (_io) {
                                    _io.to('user:' + _uid).emit('order:auto_declined', {
                                        orderId: _oid,
                                        message: 'Partner did not respond in time'
                                    });
                                }
                                sendOrderDeclinedToUser({
                                    orderId: _oid,
                                    userEmail: customer?.email,
                                    userFirstName: customer?.firstName,
                                    isAutoDeclined: true
                                }).catch(console.error);
                            }
                        } catch (e) {
                            console.error('AutoDecline:', e);
                        } finally {
                            autoDeclineTimers.delete(_oid);
                        }
                    }, 300000);
                    autoDeclineTimers.set(_oid, _t);
                }
            } catch (err) {
                console.error('Error in post-order creation notifications:', err);
            }
        });

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
// @desc    Update order status
// @access  Private
router.patch('/:id/status', protect, async (req, res) => {
    try {
        const { status, note } = req.body;
        
        const validStatuses = ['confirmed', 'in_transit', 'shipped', 'out_for_delivery', 'delivered', 'failed_delivery', 'returned'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ success: false, message: 'Invalid status value' });
        }

        const order = await Order.findById(req.params.id);
        if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

        if (req.user.role === 'shipment_partner' && order.partnerId?.toString() !== req.user._id.toString()) {
            return res.status(403).json({ success: false, message: 'Not assigned to this order' });
        }

        const statusMapList = {
            'confirmed': 'Confirmed',
            'in_transit': 'Shipped', // Map 'in_transit' to slightly valid backend enum
            'shipped': 'Shipped',
            'out_for_delivery': 'Shipped',
            'delivered': 'Delivered',
            'failed_delivery': 'Pending',
            'returned': 'Cancelled'
        };
        order.orderStatus = statusMapList[status] || order.orderStatus;

        if (order.orderStage) {
            const stageMapping = {
                'confirmed': 'direct_shipment',
                'in_transit': 'in_transit',
                'shipped': 'in_transit',
                'out_for_delivery': 'in_transit',
                'delivered': 'delivered',
                'failed_delivery': 'direct_shipment',
                'returned': 'direct_shipment'
            };
            order.orderStage = stageMapping[status] || order.orderStage;
        }

        if (order.orderHistory) {
            order.orderHistory.push({
                stage: status,
                changedBy: req.user._id,
                timestamp: new Date(),
                note: note || ''
            });
        }

        if (status === 'delivered') {
            const existingSettlement = await Settlement.findOne({ orderId: order._id });
            if (!existingSettlement) {
                const feePercent = parseFloat(process.env.PLATFORM_FEE_PERCENT) || 5;
                const value = order.orderValue || 0;
                const pFee = (value * feePercent) / 100;
                const net = value - pFee;
                
                Settlement.create({
                    orderId: order._id,
                    partnerId: req.user._id,
                    orderValue: value,
                    platformFee: pFee,
                    netAmount: net,
                    settlementStatus: 'pending',
                    orderType: order.orderType || 'prepaid'
                }).catch(console.error);
            }
        }

        await order.save();

        const labelMap = {
            'confirmed': 'Order Confirmed',
            'in_transit': 'In Transit',
            'shipped': 'Shipped',
            'out_for_delivery': 'Out for Delivery',
            'delivered': 'Delivered',
            'failed_delivery': 'Delivery Failed',
            'returned': 'Returned'
        };
        const statusLabel = labelMap[status];
        const partnerName = `${req.user.firstName || req.user.businessName || ''} ${req.user.lastName || ''}`.trim();

        Promise.resolve().then(async () => {
            const customer = await User.findById(order.userId).select('email firstName name').lean();
            if (!customer) return;

            const io = req.app.get('io') || getIO();
            if (io) {
                io.to('user:' + customer._id.toString()).emit('order:status_updated', {
                    orderId: order._id,
                    newStatus: status,
                    newStatusLabel: statusLabel,
                    partnerName,
                    timestamp: new Date()
                });
                io.to('partner:' + req.user._id.toString()).emit('order:status_confirmed', {
                    orderId: order._id,
                    status: status
                });
            }

            const ccEmail = status === 'delivered' ? req.user.email : undefined;

            notifyUserStatusUpdate({
                userEmail: customer.email,
                userFirstName: customer.firstName || customer.name,
                orderId: order._id.toString(),
                status: status,
                statusLabel,
                partnerName,
                orderValue: order.orderValue,
                deliveryAddress: order.address?.city,
                trackingLink: process.env.BASE_URL + '/shipments',
                ccEmail
            }).catch(console.error);

            const emailMod = await import('../services/emailService/index.js');
            if (emailMod.sendStatusConfirmationToPartner) {
                emailMod.sendStatusConfirmationToPartner({
                    partnerEmail: req.user.email,
                    partnerFirstName: req.user.firstName || req.user.businessName,
                    orderId: order._id.toString(),
                    status: status,
                    statusLabel,
                    customerFirstName: customer.firstName || customer.name,
                    timestamp: new Date()
                }).catch(console.error);
            }
        });

        res.status(200).json({ success: true, order });
    } catch (error) {
        console.error('Error updating order status:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// @route   PATCH /api/orders/:id/accept
// @desc    Accept order assignment
// @access  Private (Partner)
router.patch('/:id/accept', protect, async (req, res) => {
    try {
        if (req.user.role !== 'shipment_partner') {
            return res.status(403).json({ success: false, message: 'Only partners can accept orders' });
        }

        const order = await Order.findById(req.params.id);
        if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

        if (order.partnerId?.toString() !== req.user._id.toString()) {
            return res.status(403).json({ success: false, message: 'Not assigned to this order' });
        }

        if (order.orderStatus !== 'New') {
            return res.status(400).json({ success: false, message: 'Order is not in assignable state' });
        }

        order.orderStatus = 'Confirmed';
        
        if (order.orderHistory) {
            order.orderHistory.push({
                stage: 'confirmed',
                changedBy: req.user._id,
                timestamp: new Date(),
                note: 'Partner accepted order'
            });
        }
        
        await order.save();

        if (autoDeclineTimers.has(req.params.id)) {
            clearTimeout(autoDeclineTimers.get(req.params.id));
            autoDeclineTimers.delete(req.params.id);
        }

        Promise.resolve().then(async () => {
            const customer = await User.findById(order.userId).select('email firstName name').lean();
            if (customer) {
                const partnerName = `${req.user.firstName || req.user.businessName || ''} ${req.user.lastName || ''}`.trim();
                const io = req.app.get('io') || getIO();
                if (io) {
                    io.to('user:' + customer._id.toString()).emit('order:accepted', {
                        orderId: order._id,
                        partnerName: partnerName,
                        timestamp: new Date()
                    });
                }
                
                sendOrderAcceptedToUser({
                    userEmail: customer.email,
                    userFirstName: customer.firstName || customer.name || 'Customer',
                    orderId: order._id.toString(),
                    partnerName: partnerName,
                    pickupAddress: order.address?.line1,
                    deliveryAddress: order.address?.city,
                    trackingLink: process.env.BASE_URL + '/shipments'
                }).catch(console.error);
            }
        });

        res.status(200).json({ success: true, order });
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
        if (req.user.role !== 'shipment_partner') {
            return res.status(403).json({ success: false, message: 'Only partners can decline orders' });
        }

        const order = await Order.findById(req.params.id);
        if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

        if (order.partnerId?.toString() !== req.user._id.toString()) {
            return res.status(403).json({ success: false, message: 'Not assigned to this order' });
        }

        order.orderStatus = 'Cancelled';
        
        if (order.orderHistory) {
            order.orderHistory.push({
                stage: 'cancelled',
                changedBy: req.user._id,
                timestamp: new Date(),
                note: 'Partner declined order'
            });
        }
        
        await order.save();

        if (autoDeclineTimers.has(req.params.id)) {
            clearTimeout(autoDeclineTimers.get(req.params.id));
            autoDeclineTimers.delete(req.params.id);
        }

        Promise.resolve().then(async () => {
            const customer = await User.findById(order.userId).select('email firstName name').lean();
            if (customer) {
                const io = req.app.get('io') || getIO();
                if (io) {
                    io.to('user:' + customer._id.toString()).emit('order:declined', {
                        orderId: order._id,
                        isAutoDeclined: false,
                        timestamp: new Date()
                    });
                }
                
                sendOrderDeclinedToUser({
                    userEmail: customer.email,
                    userFirstName: customer.firstName || customer.name || 'Customer',
                    orderId: order._id.toString(),
                    isAutoDeclined: false
                }).catch(console.error);
            }
        });

        res.status(200).json({ success: true });
    } catch (error) {
        console.error('Error declining order:', error);
        res.status(500).json({ success: false, message: 'Server error' });
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

export default router;
