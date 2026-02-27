import express from 'express';
import Inventory from '../models/Inventory.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// GET /api/wms/inventory — user-scoped
router.get('/', protect, async (req, res) => {
    try {
        const query = req.user.role === 'admin' ? {} : { owner: req.user._id };
        const items = await Inventory.find(query).sort({ name: 1 });
        res.json(items);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// POST /api/wms/inventory — set owner
router.post('/', protect, async (req, res) => {
    const { sku, name, category, price, stock, location } = req.body;
    try {
        const newItem = new Inventory({
            owner: req.user._id,
            sku, name, category, price,
            stock: { total: stock, available: stock },
            location: { zone: location?.zone || 'Receiving', rack: location?.rack, bin: location?.bin }
        });
        const savedItem = await newItem.save();
        res.status(201).json(savedItem);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// PUT /api/wms/inventory/:id — owner-scoped
router.put('/:id', protect, async (req, res) => {
    try {
        const query = req.user.role === 'admin' ? { _id: req.params.id } : { _id: req.params.id, owner: req.user._id };
        const updatedItem = await Inventory.findOneAndUpdate(query, req.body, { new: true });
        if (!updatedItem) return res.status(404).json({ message: 'Item not found' });
        res.json(updatedItem);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

export default router;
