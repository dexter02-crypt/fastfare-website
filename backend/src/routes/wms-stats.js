import express from 'express';
import Vehicle from '../models/Vehicle.js';
import WmsDriver from '../models/WmsDriver.js';
import Inventory from '../models/Inventory.js';
import RTD from '../models/RTD.js';
import Trip from '../models/Trip.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// GET /api/wms/stats — user-scoped
router.get('/', protect, async (req, res) => {
    try {
        const ownerFilter = req.user.role === 'admin' ? {} : { owner: req.user._id };
        const driverFilter = req.user.role === 'admin' ? {} : { createdBy: req.user._id };

        const [totalVehicles, activeVehicles, totalDrivers, lowStockItems, pendingRTD, activeTrips] = await Promise.all([
            Vehicle.countDocuments(ownerFilter),
            Vehicle.countDocuments({ ...ownerFilter, status: 'active' }),
            WmsDriver.countDocuments(driverFilter),
            Inventory.countDocuments({ ...ownerFilter, "stock.available": { $lt: 10 } }),
            RTD.countDocuments({ ...ownerFilter, status: 'reported' }),
            Trip.countDocuments({ ...ownerFilter, status: { $in: ['scheduled', 'in_transit'] } })
        ]);

        res.json({
            fleet: {
                total: totalVehicles,
                active: activeVehicles,
                utilization: totalVehicles > 0 ? Math.round((activeVehicles / totalVehicles) * 100) : 0
            },
            inventory: { lowStock: lowStockItems },
            operations: { pendingReturns: pendingRTD, activeTrips: activeTrips }
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

export default router;
