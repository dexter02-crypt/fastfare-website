import express from 'express';
import Order from '../models/Order.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// Generate a random Order ID (e.g. ORD-FF-8A91B)
const generateOrderId = () => `ORD-FF-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;

// @route   GET /api/orders/my-orders
// @desc    Get all orders for the logged-in user
// @access  Private
router.get('/my-orders', protect, async (req, res) => {
    try {
        const orders = await Order.find({ userId: req.user.id }).sort({ createdAt: -1 });
        res.json({ success: true, count: orders.length, orders });
    } catch (error) {
        console.error('Error fetching orders:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// @route   POST /api/orders
// @desc    Create a new order (used for Manual Create & Duplication)
// @access  Private
router.post('/', protect, async (req, res) => {
    try {
        const count = await Order.countDocuments({ userId: req.user.id });
        const orderId = `ORD-FF-${String(10001 + count).padStart(5, '0')}`;

        const newOrder = new Order({
            ...req.body,
            orderId,
            userId: req.user.id
        });

        await newOrder.save();
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

        res.json({ success: true, order });
    } catch (error) {
        console.error('Error updating order status:', error);
        res.status(500).json({ success: false, message: 'Server error updating status.' });
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

export default router;
