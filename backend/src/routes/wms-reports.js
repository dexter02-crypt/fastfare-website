import express from 'express';
import Vehicle from '../models/Vehicle.js';
import Trip from '../models/Trip.js';
import Inventory from '../models/Inventory.js';
import RTD from '../models/RTD.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// GET /api/wms/reports/summary — user-scoped
router.get('/summary', protect, async (req, res) => {
    try {
        const ownerMatch = req.user.role === 'admin' ? {} : { owner: req.user._id };

        const inventoryStats = await Inventory.aggregate([
            { $match: ownerMatch },
            { $group: { _id: '$category', value: { $sum: { $multiply: ['$price', '$stock.total'] } }, count: { $sum: 1 } } }
        ]);

        const tripStats = await Trip.aggregate([
            { $match: ownerMatch },
            { $group: { _id: '$status', count: { $sum: 1 } } }
        ]);

        const vehicleStats = await Vehicle.aggregate([
            { $match: ownerMatch },
            { $group: { _id: '$type', count: { $sum: 1 } } }
        ]);

        res.json({
            inventoryByCategory: inventoryStats.map(i => ({ name: i._id, value: i.value, count: i.count })),
            tripsByStatus: tripStats.map(t => ({ name: t._id, value: t.count })),
            vehiclesByType: vehicleStats.map(v => ({ name: v._id, value: v.count }))
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

export default router;
