import express from 'express';
import { protect } from '../middleware/auth.js';
import WmsDriver from '../models/WmsDriver.js';
import Parcel from '../models/Parcel.js';

const router = express.Router();

// ─── GET /api/partner/fleet-view/summary ───
// Returns active drivers, active parcels, unassigned parcels, and a list of online drivers
router.get('/summary', protect, async (req, res) => {
    try {
        const partnerId = req.query.partner_id || req.user._id;

        // Query active drivers for this partner
        const drivers = await WmsDriver.find({
            createdBy: partnerId,
            status: { $in: ['active', 'on_trip'] } // Assuming active means they could be online
        }).lean();

        const onlineDrivers = drivers.filter(d => d.is_online);

        // Initialize data structures
        const fleetResponse = [];
        let totalAssignedParcels = 0;

        for (const d of drivers) {
            // Get parcels assigned to this driver
            const driverParcels = await Parcel.find({
                assigned_driver_id: d.driverId,
                status: { $in: ['dispatched', 'in_transit', 'out_for_delivery'] }
            }).lean();

            totalAssignedParcels += driverParcels.length;

            fleetResponse.push({
                driverId: d.driverId,
                driverName: d.name,
                lat: d.current_location_lat || 20.5937,
                lng: d.current_location_lng || 78.9629,
                online: d.is_online || false,
                timestamp: new Date(d.location_updated_at).getTime() || Date.now(),
                parcels: driverParcels.map(p => ({
                    parcelId: p._id.toString(),
                    barcode: p.barcode,
                    awb: p.awb,
                    packageName: p.package_name || "Unknown Package",
                    status: p.status,
                    receiver: { name: p.receiver_name, city: p.delivery_address?.city }
                }))
            });
        }

        // Get unassigned parcels
        const unassignedParcelsRaw = await Parcel.find({
            'scannedBy.partnerId': partnerId,
            status: { $in: ['scanned', 'in_warehouse'] },
            assigned_driver_id: { $eq: null }
        }).lean();

        const unassignedParcels = unassignedParcelsRaw.map(p => ({
            parcelId: p._id.toString(),
            barcode: p.barcode,
            awb: p.awb,
            packageName: p.package_name || "Unknown Package",
            status: p.status,
            receiver: { name: p.receiver_name, city: p.delivery_address?.city }
        }));

        res.json({
            success: true,
            totalDrivers: drivers.length,
            totalParcels: totalAssignedParcels,
            unassignedParcels: unassignedParcels,
            fleet: fleetResponse
        });
    } catch (error) {
        console.error('Fleet view summary error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

export default router;
