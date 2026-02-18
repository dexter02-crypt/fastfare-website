import express from 'express';
import jwt from 'jsonwebtoken';
import Parcel from '../models/Parcel.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// Auth middleware for drivers (uses JWT directly, not the protect middleware)
const authDriver = (req, res, next) => {
    const auth = req.headers.authorization;
    if (!auth || !auth.startsWith('Bearer')) {
        return res.status(401).json({ success: false, message: 'No token' });
    }
    try {
        const decoded = jwt.verify(auth.split(' ')[1], process.env.JWT_SECRET);
        req.driverId = decoded.id;
        next();
    } catch (e) {
        res.status(401).json({ success: false, message: 'Invalid token' });
    }
};

// ─── GET /api/parcels/user/my-parcels ─── Get parcels linked to current user (by phone match)
router.get('/user/my-parcels', protect, async (req, res) => {
    try {
        const userPhone = req.user.phone;
        const userId = req.user._id;

        // Find parcels where user is either the sender/receiver (by phone) or scanned by them
        const filter = userPhone
            ? {
                $or: [
                    { 'receiver.phone': userPhone },
                    { 'sender.phone': userPhone },
                    { 'scannedBy.partnerId': userId }
                ]
            }
            : { 'scannedBy.partnerId': userId };

        const parcels = await Parcel.find(filter)
            .sort({ createdAt: -1 })
            .limit(50)
            .lean();

        res.json({ success: true, parcels, total: parcels.length });
    } catch (error) {
        console.error('Fetch user parcels error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// ─── POST /api/parcels/scan ─── Mobile app scans a parcel barcode
router.post('/scan', protect, async (req, res) => {
    try {
        const { barcode, packageName, packageDescription, contentType, weight, quantity, sender, receiver } = req.body;

        if (!barcode) {
            return res.status(400).json({ success: false, message: 'Barcode is required' });
        }

        // Check if already scanned
        const existing = await Parcel.findOne({ barcode });
        if (existing) {
            return res.status(409).json({
                success: false,
                message: 'Parcel already scanned',
                parcel: existing
            });
        }

        const parcel = await Parcel.create({
            barcode,
            packageName: packageName || `PKG-${barcode.slice(-6)}`,
            packageDescription,
            contentType,
            weight,
            quantity: quantity || 1,
            sender,
            receiver,
            status: 'scanned',
            scannedBy: {
                partnerId: req.user._id,
                name: req.user.contactPerson || req.user.businessName
            },
            scannedAt: new Date()
        });

        res.status(201).json({
            success: true,
            message: 'Parcel scanned successfully',
            parcel
        });
    } catch (error) {
        console.error('Scan error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// ─── GET /api/parcels/partner/my-scans ─── Get parcels scanned by current partner + their scan partners
router.get('/partner/my-scans', protect, async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 100;
        const status = req.query.status;

        // Collect all IDs: the partner's own ID + all their scan partners' IDs
        const partnerIds = [req.user._id];

        // If this is a shipment_partner, also include their scan partners' scans
        if (req.user.role === 'shipment_partner') {
            const ScanPartner = (await import('../models/ScanPartner.js')).default;
            const scanPartners = await ScanPartner.find({ createdBy: req.user._id }).select('_id');
            partnerIds.push(...scanPartners.map(sp => sp._id));
        }

        const filter = { 'scannedBy.partnerId': { $in: partnerIds } };
        if (status) filter.status = status;

        const parcels = await Parcel.find(filter)
            .sort({ scannedAt: -1 })
            .limit(limit)
            .lean();

        res.json({
            success: true,
            parcels,
            total: parcels.length
        });
    } catch (error) {
        console.error('Fetch scans error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// ─── GET /api/parcels/track/:awb ─── Track a parcel by AWB (public)
router.get('/track/:awb', async (req, res) => {
    try {
        const parcel = await Parcel.findOne({ awb: req.params.awb }).lean();

        if (!parcel) {
            return res.status(404).json({ success: false, message: 'Parcel not found' });
        }

        res.json({ success: true, parcel });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// ─── GET /api/parcels/driver/my-parcels ─── Get parcels assigned to current driver
router.get('/driver/my-parcels', authDriver, async (req, res) => {
    try {
        const parcels = await Parcel.find({
            assignedDriver: req.driverId,
            status: { $nin: ['delivered', 'returned'] }
        })
            .sort({ createdAt: -1 })
            .lean();

        res.json({ success: true, parcels });
    } catch (error) {
        console.error('Driver parcels error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// ─── PUT /api/parcels/:id/deliver ─── Driver marks parcel as delivered
router.put('/:id/deliver', authDriver, async (req, res) => {
    try {
        const parcel = await Parcel.findById(req.params.id);
        if (!parcel) {
            return res.status(404).json({ success: false, message: 'Parcel not found' });
        }

        if (parcel.assignedDriver?.toString() !== req.driverId) {
            return res.status(403).json({ success: false, message: 'Not assigned to you' });
        }

        const { deliveredTo, relationToReceiver, notes, photoProof } = req.body;

        parcel.status = 'delivered';
        parcel.deliveredAt = new Date();
        parcel.deliveredTo = deliveredTo || 'Receiver';
        parcel.deliveryNotes = notes || '';
        parcel.photoProof = photoProof || '';

        await parcel.save();

        res.json({
            success: true,
            message: 'Parcel delivered successfully',
            parcel: {
                parcelId: parcel._id,
                barcode: parcel.barcode,
                packageName: parcel.packageName,
                status: parcel.status,
                receiver: parcel.receiver
            }
        });
    } catch (error) {
        console.error('Deliver parcel error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// ─── PUT /api/parcels/:id/assign-driver ─── Auto-assign available driver
router.put('/:id/assign-driver', protect, async (req, res) => {
    try {
        const parcel = await Parcel.findById(req.params.id);
        if (!parcel) {
            return res.status(404).json({ success: false, message: 'Parcel not found' });
        }

        if (parcel.assignedDriver) {
            return res.status(400).json({ success: false, message: 'Driver already assigned' });
        }

        // Try to find an available WMS driver
        let WmsDriver;
        try {
            WmsDriver = (await import('../models/WmsDriver.js')).default;
        } catch (e) {
            // WmsDriver model may not exist
        }

        let driverName = 'Pending Assignment';
        if (WmsDriver) {
            const driver = await WmsDriver.findOne({ status: 'available' });
            if (driver) {
                parcel.assignedDriver = driver._id;
                driver.status = 'on_trip';
                await driver.save();
                driverName = driver.name;
            }
        }

        parcel.status = 'dispatched';
        await parcel.save();

        res.json({
            success: true,
            message: `Driver assigned: ${driverName}`,
            parcel
        });
    } catch (error) {
        console.error('Assign driver error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// ─── PUT /api/parcels/:id/status ─── Update parcel status
router.put('/:id/status', protect, async (req, res) => {
    try {
        const { status, deliveredTo, deliveryNotes, photoProof } = req.body;

        const parcel = await Parcel.findById(req.params.id);
        if (!parcel) {
            return res.status(404).json({ success: false, message: 'Parcel not found' });
        }

        parcel.status = status;
        if (status === 'delivered') {
            parcel.deliveredAt = new Date();
            parcel.deliveredTo = deliveredTo;
            parcel.deliveryNotes = deliveryNotes;
            parcel.photoProof = photoProof;
        }
        await parcel.save();

        res.json({ success: true, message: 'Status updated', parcel });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// ─── GET /api/parcels ─── List all parcels (admin)
router.get('/', protect, async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 50;
        const parcels = await Parcel.find()
            .sort({ createdAt: -1 })
            .limit(limit)
            .lean();

        res.json({ success: true, parcels, total: parcels.length });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

export default router;
