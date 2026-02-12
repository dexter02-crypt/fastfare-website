import express from 'express';
import Vehicle from '../models/Vehicle.js';
import WmsDriver from '../models/WmsDriver.js';
import Inventory from '../models/Inventory.js';
import RTD from '../models/RTD.js';
import Trip from '../models/Trip.js';

const router = express.Router();

// GET /api/wms/stats
router.get('/', async (req, res) => {
    try {
        const [totalVehicles, activeVehicles, totalDrivers, lowStockItems, pendingRTD, activeTrips] = await Promise.all([
            Vehicle.countDocuments(),
            Vehicle.countDocuments({ status: 'active' }),
            WmsDriver.countDocuments(),
            Inventory.countDocuments({ "stock.available": { $lt: 10 } }),
            RTD.countDocuments({ status: 'reported' }),
            Trip.countDocuments({ status: { $in: ['scheduled', 'in_transit'] } })
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
