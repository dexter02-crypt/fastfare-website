import express from 'express';
import Truck from '../models/Truck.js';
import Driver from '../models/Driver.js';
import { protect, admin } from '../middleware/auth.js';

const router = express.Router();

// Helper to get date range filter
const getDateFilter = (range) => {
    const now = new Date();
    let startDate;

    switch (range) {
        case 'today':
            startDate = new Date(now.setHours(0, 0, 0, 0));
            break;
        case '7days':
            startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            break;
        case '30days':
            startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            break;
        case '90days':
            startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
            break;
        default:
            return {}; // All time
    }

    return { createdAt: { $gte: startDate } };
};

import Shipment from '../models/Shipment.js';

// GET /api/reports/analytics/dashboard - Get data for Analytics Dashboard
router.get('/analytics/dashboard', protect, async (req, res) => {
    try {
        const { dateRange } = req.query;
        let startDate = new Date();
        if (dateRange === '7d') startDate.setDate(startDate.getDate() - 7);
        else if (dateRange === '30d') startDate.setDate(startDate.getDate() - 30);
        else if (dateRange === '90d') startDate.setDate(startDate.getDate() - 90);
        else if (dateRange === '1y') startDate.setFullYear(startDate.getFullYear() - 1);
        else startDate.setDate(startDate.getDate() - 7); // Default 7d

        const userFilter = req.user.role === 'admin' ? {} : { user: req.user._id };
        const query = { ...userFilter, createdAt: { $gte: startDate } };

        const shipments = await Shipment.find(query).lean();

        // 1. Stats
        const totalShipments = shipments.length;
        const delivered = shipments.filter(s => s.status === 'delivered').length;
        const inTransit = shipments.filter(s => ['in_transit', 'out_for_delivery', 'picked_up'].includes(s.status)).length;
        const rto = shipments.filter(s => s.status === 'returned').length;
        const rtoRate = totalShipments > 0 ? ((rto / totalShipments) * 100).toFixed(1) : parseFloat("0").toFixed(1);

        const stats = [
            { label: "Total Shipments", value: totalShipments.toString(), change: "+5%", trend: "up" },
            { label: "Delivered", value: delivered.toString(), change: "+2%", trend: "up" },
            { label: "In Transit", value: inTransit.toString(), change: "-1%", trend: "down" },
            { label: "RTO Rate", value: `${rtoRate}%`, change: "-0.5%", trend: "down" }
        ];

        // 2. Status Data for Pie Chart
        const statusCounts = { delivered, inTransit: inTransit, pending: totalShipments - delivered - inTransit - rto, rto };
        const statusData = [
            { name: "Delivered", value: statusCounts.delivered > 0 ? Math.round((statusCounts.delivered / totalShipments) * 100) : 0, color: "#10b981" },
            { name: "In Transit", value: statusCounts.inTransit > 0 ? Math.round((statusCounts.inTransit / totalShipments) * 100) : 0, color: "#f59e0b" },
            { name: "Pending", value: statusCounts.pending > 0 ? Math.round((statusCounts.pending / totalShipments) * 100) : 0, color: "#3b82f6" },
            { name: "Returned/RTO", value: statusCounts.rto > 0 ? Math.round((statusCounts.rto / totalShipments) * 100) : 0, color: "#ef4444" }
        ].filter(s => s.value > 0);

        // 3. Volume Data for Bar Chart (by day)
        const volumeMap = {};
        for (let i = 0; i < 7; i++) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            volumeMap[d.toLocaleDateString('en-US', { weekday: 'short' })] = 0;
        }
        shipments.forEach(s => {
            const day = new Date(s.createdAt).toLocaleDateString('en-US', { weekday: 'short' });
            if (volumeMap[day] !== undefined) volumeMap[day]++;
        });
        const volumeData = Object.keys(volumeMap).reverse().map(key => ({ name: key, shipments: volumeMap[key] }));

        // 4. Geo Data & Top Cities
        const cityMap = {};
        const cityRevMap = {};
        shipments.forEach(s => {
            const city = s.delivery?.city || 'Unknown';
            cityMap[city] = (cityMap[city] || 0) + 1;
            cityRevMap[city] = (cityRevMap[city] || 0) + (s.shippingCost || 0);
        });
        const topCityEntries = Object.entries(cityMap).sort((a, b) => b[1] - a[1]).slice(0, 5);
        const geoData = topCityEntries.map(([city, count]) => ({ name: city, value: count }));
        const topCities = topCityEntries.map(([city, count]) => ({
            city,
            shipments: count,
            revenue: `₹${cityRevMap[city] || 0}`
        }));

        // 5. Trend Data (by month)
        const trendMap = {};
        shipments.forEach(s => {
            const m = new Date(s.createdAt).toLocaleDateString('en-US', { month: 'short' });
            if (!trendMap[m]) trendMap[m] = { revenue: 0, shipments: 0 };
            trendMap[m].shipments++;
            trendMap[m].revenue += (s.shippingCost || 0);
        });
        const trendData = Object.keys(trendMap).map(m => ({ month: m, revenue: trendMap[m].revenue, shipments: trendMap[m].shipments }));

        // 6. Carrier Data
        const carrierData = [{ name: 'FastFare Delivery', volume: totalShipments, onTime: 95 }];
        const carrierPerformance = [{ name: 'FastFare Delivery', deliveries: delivered, onTime: 95, rating: 4.8 }];

        res.json({
            success: true,
            data: { stats, volumeData, statusData, carrierData, geoData, trendData, carrierPerformance, topCities }
        });
    } catch (error) {
        console.error('Analytics dashboard error:', error);
        res.status(500).json({ error: error.message });
    }
});

// GET /api/reports/kpis - Get KPI summary data
router.get('/kpis', protect, async (req, res) => {
    try {
        const { dateRange } = req.query;
        const dateFilter = getDateFilter(dateRange);

        // Role-based query
        const userFilter = req.user.role === 'admin' ? {} : { createdBy: req.user._id };
        const baseQuery = { ...userFilter, ...dateFilter };

        // Truck counts
        const totalTrucks = await Truck.countDocuments(userFilter);
        const activeTrucks = await Truck.countDocuments({ ...userFilter, status: 'approved' });
        const pendingTrucks = await Truck.countDocuments({ ...userFilter, status: 'pending' });
        const rejectedTrucks = await Truck.countDocuments({ ...userFilter, status: 'rejected' });

        // Driver counts
        const totalDrivers = await Driver.countDocuments(userFilter);
        const activeDrivers = await Driver.countDocuments({ ...userFilter, status: 'active' });
        const inactiveDrivers = await Driver.countDocuments({ ...userFilter, status: 'inactive' });

        // Trucks added in period
        const trucksInPeriod = await Truck.countDocuments(baseQuery);
        const driversInPeriod = await Driver.countDocuments(baseQuery);

        res.json({
            kpis: {
                totalTrucks,
                activeTrucks,
                pendingTrucks,
                rejectedTrucks,
                totalDrivers,
                activeDrivers,
                inactiveDrivers,
                trucksInPeriod,
                driversInPeriod
            }
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// GET /api/reports/trucks/analytics - Trucks analytics data
router.get('/trucks/analytics', protect, async (req, res) => {
    try {
        const { dateRange } = req.query;
        const userFilter = req.user.role === 'admin' ? {} : { createdBy: req.user._id };

        // Trucks by status
        const byStatus = await Truck.aggregate([
            { $match: userFilter },
            { $group: { _id: '$status', count: { $sum: 1 } } }
        ]);

        // Trucks over time (last 30 days by default)
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        const overTime = await Truck.aggregate([
            {
                $match: {
                    ...userFilter,
                    createdAt: { $gte: thirtyDaysAgo }
                }
            },
            {
                $group: {
                    _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
                    count: { $sum: 1 }
                }
            },
            { $sort: { _id: 1 } }
        ]);

        res.json({
            byStatus: byStatus.map(s => ({ status: s._id, count: s.count })),
            overTime: overTime.map(d => ({ date: d._id, count: d.count }))
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// GET /api/reports/drivers/analytics - Drivers analytics data
router.get('/drivers/analytics', protect, async (req, res) => {
    try {
        const userFilter = req.user.role === 'admin' ? {} : { createdBy: req.user._id };

        // Drivers by status
        const byStatus = await Driver.aggregate([
            { $match: userFilter },
            { $group: { _id: '$status', count: { $sum: 1 } } }
        ]);

        // Drivers over time (last 30 days)
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        const overTime = await Driver.aggregate([
            {
                $match: {
                    ...userFilter,
                    createdAt: { $gte: thirtyDaysAgo }
                }
            },
            {
                $group: {
                    _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
                    count: { $sum: 1 }
                }
            },
            { $sort: { _id: 1 } }
        ]);

        res.json({
            byStatus: byStatus.map(s => ({ status: s._id, count: s.count })),
            overTime: overTime.map(d => ({ date: d._id, count: d.count }))
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// GET /api/reports/trucks/table - Paginated trucks data for table
router.get('/trucks/table', protect, async (req, res) => {
    try {
        const { page = 1, limit = 10, search, status, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;
        const userFilter = req.user.role === 'admin' ? {} : { createdBy: req.user._id };

        let query = { ...userFilter };

        if (status && status !== 'all') {
            query.status = status;
        }

        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { chassisNo: { $regex: search, $options: 'i' } }
            ];
        }

        const total = await Truck.countDocuments(query);
        const trucks = await Truck.find(query)
            .populate('createdBy', 'businessName email')
            .sort({ [sortBy]: sortOrder === 'desc' ? -1 : 1 })
            .skip((page - 1) * limit)
            .limit(parseInt(limit));

        res.json({
            trucks,
            pagination: {
                total,
                page: parseInt(page),
                limit: parseInt(limit),
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// GET /api/reports/drivers/table - Paginated drivers data for table
router.get('/drivers/table', protect, async (req, res) => {
    try {
        const { page = 1, limit = 10, search, status, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;
        const userFilter = req.user.role === 'admin' ? {} : { createdBy: req.user._id };

        let query = { ...userFilter };

        if (status && status !== 'all') {
            query.status = status;
        }

        if (search) {
            query.$or = [
                { fullName: { $regex: search, $options: 'i' } },
                { mobile: { $regex: search, $options: 'i' } },
                { dlNo: { $regex: search, $options: 'i' } }
            ];
        }

        const total = await Driver.countDocuments(query);
        const drivers = await Driver.find(query)
            .populate('createdBy', 'businessName email')
            .sort({ [sortBy]: sortOrder === 'desc' ? -1 : 1 })
            .skip((page - 1) * limit)
            .limit(parseInt(limit));

        res.json({
            drivers,
            pagination: {
                total,
                page: parseInt(page),
                limit: parseInt(limit),
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// GET /api/reports/trucks/export - Export all trucks data
router.get('/trucks/export', protect, async (req, res) => {
    try {
        const { status } = req.query;
        const userFilter = req.user.role === 'admin' ? {} : { createdBy: req.user._id };

        let query = { ...userFilter };
        if (status && status !== 'all') {
            query.status = status;
        }

        const trucks = await Truck.find(query)
            .populate('createdBy', 'businessName email')
            .sort({ createdAt: -1 });

        // Return data for frontend to process into CSV/Excel
        const exportData = trucks.map(t => ({
            Name: t.name,
            ChassisNo: t.chassisNo,
            RCNo: t.rcNo,
            DLNo: t.dlNo,
            Status: t.status,
            CreatedBy: t.createdBy?.businessName || 'N/A',
            CreatedAt: t.createdAt.toISOString().split('T')[0],
            RejectionReason: t.rejectionReason || ''
        }));

        res.json({ data: exportData });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// GET /api/reports/drivers/export - Export all drivers data
router.get('/drivers/export', protect, async (req, res) => {
    try {
        const { status } = req.query;
        const userFilter = req.user.role === 'admin' ? {} : { createdBy: req.user._id };

        let query = { ...userFilter };
        if (status && status !== 'all') {
            query.status = status;
        }

        const drivers = await Driver.find(query)
            .populate('createdBy', 'businessName email')
            .sort({ createdAt: -1 });

        // Mask Aadhaar for export
        const exportData = drivers.map(d => ({
            FullName: d.fullName,
            Mobile: d.mobile,
            DLNo: d.dlNo,
            Aadhaar: d.aadhaar ? `XXXX-XXXX-${d.aadhaar.slice(-4)}` : 'N/A',
            Status: d.status,
            CreatedBy: d.createdBy?.businessName || 'N/A',
            CreatedAt: d.createdAt.toISOString().split('T')[0]
        }));

        res.json({ data: exportData });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

export default router;
