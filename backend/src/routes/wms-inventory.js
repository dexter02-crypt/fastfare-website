import express from 'express';
import Inventory from '../models/Inventory.js';

const router = express.Router();

// GET /api/wms/inventory
router.get('/', async (req, res) => {
    try {
        const items = await Inventory.find().sort({ name: 1 });
        res.json(items);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// POST /api/wms/inventory
router.post('/', async (req, res) => {
    const { sku, name, category, price, stock, location } = req.body;
    try {
        const newItem = new Inventory({
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

// PUT /api/wms/inventory/:id
router.put('/:id', async (req, res) => {
    try {
        const updatedItem = await Inventory.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.json(updatedItem);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

export default router;
