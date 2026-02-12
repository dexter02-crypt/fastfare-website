import express from 'express';
import RTD from '../models/RTD.js';
import Shipment from '../models/Shipment.js';
import { protect, admin } from '../middleware/auth.js';

const router = express.Router();

// GET /api/wms/rtd — list all RTD reports
router.get('/', protect, async (req, res) => {
    try {
        const reports = await RTD.find()
            .populate('tripId', 'tripNumber status')
            .populate('driverId', 'name phone')
            .populate('vehicleId', 'numberPlate')
            .sort({ createdAt: -1 });
        res.json(reports);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// POST /api/wms/rtd — create a new RTD report
router.post('/', protect, async (req, res) => {
    try {
        const { shipmentId, tripId, driverId, vehicleId, reasonCode, description, proof } = req.body;

        if (!shipmentId || !reasonCode) {
            return res.status(400).json({ message: 'shipmentId and reasonCode are required' });
        }

        // Generate RTD ID
        const count = await RTD.countDocuments();
        const rtdId = `RTD-${Date.now()}-${(count + 1).toString().padStart(4, '0')}`;

        const rtd = new RTD({
            rtdId,
            shipmentId,
            tripId: tripId || null,
            driverId: driverId || null,
            vehicleId: vehicleId || null,
            reasonCode,
            description: description || '',
            proof: proof || {},
            status: 'reported'
        });

        const savedRTD = await rtd.save();

        // Update shipment status to returned if it exists
        if (shipmentId) {
            await Shipment.findOneAndUpdate(
                { awb: shipmentId },
                { status: 'returned' }
            ).catch(() => {
                // Shipment might not exist by AWB, try by ID
                return Shipment.findByIdAndUpdate(shipmentId, { status: 'returned' }).catch(() => { });
            });
        }

        res.status(201).json(savedRTD);
    } catch (err) {
        if (err.code === 11000) {
            return res.status(400).json({ message: 'Duplicate RTD entry' });
        }
        res.status(500).json({ message: err.message });
    }
});

// GET /api/wms/rtd/:id — get single RTD report
router.get('/:id', protect, async (req, res) => {
    try {
        const rtd = await RTD.findById(req.params.id)
            .populate('tripId', 'tripNumber status')
            .populate('driverId', 'name phone')
            .populate('vehicleId', 'numberPlate')
            .populate('resolution.resolvedBy', 'businessName email');

        if (!rtd) return res.status(404).json({ message: 'RTD report not found' });
        res.json(rtd);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// PUT /api/wms/rtd/:id/resolve — resolve an RTD report
router.put('/:id/resolve', protect, async (req, res) => {
    try {
        const { action } = req.body;

        if (!action) {
            return res.status(400).json({ message: 'Resolution action is required' });
        }

        const rtd = await RTD.findById(req.params.id);
        if (!rtd) return res.status(404).json({ message: 'RTD report not found' });

        // Map action to status
        const statusMap = {
            'restock': 'restocked',
            'reschedule': 'rescheduled',
            'discard': 'discarded',
            'received': 'received_at_depot',
            'analyze': 'analyzed'
        };

        rtd.status = statusMap[action] || 'analyzed';
        rtd.resolution = {
            action,
            resolvedBy: req.user._id,
            resolvedAt: new Date()
        };

        await rtd.save();
        res.json(rtd);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// PUT /api/wms/rtd/:id/status — update RTD status
router.put('/:id/status', protect, async (req, res) => {
    try {
        const { status } = req.body;
        const rtd = await RTD.findById(req.params.id);
        if (!rtd) return res.status(404).json({ message: 'RTD report not found' });

        rtd.status = status;
        await rtd.save();
        res.json(rtd);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

export default router;
