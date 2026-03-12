import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import WmsDriver from '../models/WmsDriver.js';
import Shipment from '../models/Shipment.js';

const router = express.Router();

// ─── POST /api/driver/login ───
router.post('/login', async (req, res) => {
    try {
        const { driver_id, password } = req.body;

        if (!driver_id || !password) {
            return res.status(400).json({ success: false, message: 'Driver ID and password are required' });
        }

        const driver = await WmsDriver.findOne({ driverId: driver_id });
        if (!driver) {
            return res.status(401).json({ success: false, message: 'Invalid Driver ID or password' });
        }

        const isMatch = await bcrypt.compare(password, driver.password);
        if (!isMatch) {
            return res.status(401).json({ success: false, message: 'Invalid Driver ID or password' });
        }

        if (driver.status !== 'active' && driver.status !== 'on_trip') {
            return res.status(403).json({ success: false, message: 'Driver account is inactive' });
        }

        const token = jwt.sign(
            { id: driver._id, driverId: driver.driverId, role: 'driver' },
            process.env.JWT_SECRET || 'fallback_secret',
            { expiresIn: '30d' }
        );

        res.json({
            success: true,
            token,
            driver_id: driver.driverId,
            driver_name: driver.name,
            phone: driver.phone,
            partner_id: driver.createdBy // Assuming createdBy is the partner
        });
    } catch (error) {
        console.error('Driver login error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// Middleware to protect driver routes
const protectDriver = async (req, res, next) => {
    try {
        let token;
        if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
            token = req.headers.authorization.split(' ')[1];
        }

        if (!token) {
            return res.status(401).json({ success: false, message: 'Not authorized, no token' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');
        req.driver = await WmsDriver.findById(decoded.id).select('-password');

        if (!req.driver) {
            return res.status(401).json({ success: false, message: 'Not authorized, driver not found' });
        }
        next();
    } catch (error) {
        res.status(401).json({ success: false, message: 'Not authorized, token failed' });
    }
};

// ─── GET /api/driver/shipments ───
router.get('/shipments', protectDriver, async (req, res) => {
    try {
        // Use driver ID from the JWT token (req.driver.driverId)
        // Also support ?driver_id query param for backward compatibility
        const driverId = req.driver.driverId;

        const shipments = await Shipment.find({
            assigned_driver_id: driverId,
            status: { $ne: 'delivered' }
        }).sort({ createdAt: -1 });

        res.json({ success: true, shipments });
    } catch (error) {
        console.error('Fetch driver shipments error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// ─── GET /api/driver/shipments/scan/:awbNumber ─── (BUG 7)
// Called when driver scans a QR code with format FF-AWB-{awbNumber}
router.get('/shipments/scan/:awbNumber', protectDriver, async (req, res) => {
    try {
        const { awbNumber } = req.params;
        const driverId = req.driver.driverId;

        // Find the shipment by AWB
        const shipment = await Shipment.findOne({ awb: awbNumber });

        if (!shipment) {
            return res.status(404).json({ success: false, message: `No shipment found with AWB: ${awbNumber}` });
        }

        // If not assigned, auto-assign to this driver  
        if (!shipment.assigned_driver_id) {
            shipment.assigned_driver_id = driverId;
            shipment.assigned_driver_name = req.driver.name;
            shipment.assigned_driver_phone = req.driver.phone;
            shipment.assignedDriverId = driverId;
            shipment.assignedDriverName = req.driver.name;
            shipment.assignedDriver = req.driver._id;
            shipment.driver_assigned_at = new Date();
            await shipment.save();
        }

        res.json({ success: true, shipment });
    } catch (error) {
        console.error('Driver scan error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// ─── POST /api/driver/shipments/:id/pickup ─── (Fix 10)
router.post('/shipments/:id/pickup', protectDriver, async (req, res) => {
    try {
        const shipment = await Shipment.findById(req.params.id);
        if (!shipment) return res.status(404).json({ success: false, message: 'Shipment not found' });

        shipment.status = 'picked_up';
        shipment.scan_pickup = {
            driver_id: req.driver._id,
            driver_name: req.driver.name,
            driver_phone: req.driver.phone,
            scanned_at: new Date(),
            location_lat: req.body.lat || null,
            location_lng: req.body.lng || null,
        };
        shipment.trackingHistory.push({
            status: 'picked_up',
            location: req.body.city || shipment.pickup?.city || 'Pickup Point',
            description: `Picked up by ${req.driver.name}`,
            timestamp: new Date()
        });
        await shipment.save();

        res.json({ success: true, message: 'Shipment picked up', shipment });
    } catch (error) {
        console.error('Pickup error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// ─── POST /api/driver/shipments/:id/delivered ─── (Fix 10)
router.post('/shipments/:id/delivered', protectDriver, async (req, res) => {
    try {
        const shipment = await Shipment.findById(req.params.id);
        if (!shipment) return res.status(404).json({ success: false, message: 'Shipment not found' });

        shipment.status = 'delivered';
        shipment.actualDelivery = new Date();
        shipment.trackingHistory.push({
            status: 'delivered',
            location: req.body.city || shipment.delivery?.city || 'Delivery Point',
            description: `Delivered by ${req.driver.name}`,
            timestamp: new Date()
        });
        await shipment.save();

        res.json({ success: true, message: 'Shipment delivered', shipment });
    } catch (error) {
        console.error('Delivered error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// ─── PATCH /api/driver/status ───
router.patch('/status', protectDriver, async (req, res) => {
    try {
        const { driver_id, is_online, current_location_lat, current_location_lng } = req.body;

        if (!driver_id) {
            return res.status(400).json({ success: false, message: 'driver_id is required' });
        }

        if (req.driver.driverId !== driver_id) {
            return res.status(403).json({ success: false, message: 'Access denied' });
        }

        const updateData = {};
        if (is_online !== undefined) updateData.is_online = is_online;
        if (current_location_lat !== undefined) updateData.current_location_lat = current_location_lat;
        if (current_location_lng !== undefined) updateData.current_location_lng = current_location_lng;
        if (current_location_lat !== undefined || current_location_lng !== undefined || is_online !== undefined) {
            updateData.location_updated_at = new Date();
        }

        const updatedDriver = await WmsDriver.findOneAndUpdate(
            { driverId: driver_id },
            { $set: updateData },
            { new: true }
        );

        if (!updatedDriver) {
            return res.status(404).json({ success: false, message: 'Driver not found' });
        }

        // If location was updated, also update all active shipments assigned to this driver
        if (current_location_lat !== undefined && current_location_lng !== undefined) {
            await Shipment.updateMany(
                { assigned_driver_id: driver_id, status: { $ne: 'delivered' } },
                {
                    $set: {
                        driver_location_lat: current_location_lat,
                        driver_location_lng: current_location_lng,
                        driver_location_updated_at: new Date()
                    }
                }
            );
        }

        res.json({ success: true, driver: updatedDriver });
    } catch (error) {
        console.error('Update driver status error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

export default router;
