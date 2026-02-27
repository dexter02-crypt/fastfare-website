import express from 'express';
import InboundShipment from '../models/InboundShipment.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// GET /api/wms/inbound — user-scoped
router.get('/', protect, async (req, res) => {
    try {
        const query = req.user.role === 'admin' ? {} : { owner: req.user._id };
        const shipments = await InboundShipment.find(query)
            .populate('vehicleId', 'numberPlate')
            .sort({ expectedArrival: 1 });
        res.json(shipments);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// POST /api/wms/inbound — set owner
router.post('/', protect, async (req, res) => {
    const { provider, expectedArrival, vehicleId, items, notes } = req.body;
    try {
        const newShipment = new InboundShipment({
            owner: req.user._id,
            shipmentId: `ASN-${Date.now()}`,
            provider, expectedArrival, vehicleId, items, notes
        });
        const savedShipment = await newShipment.save();
        res.status(201).json(savedShipment);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// PUT /api/wms/inbound/:id/status — owner-scoped
router.put('/:id/status', protect, async (req, res) => {
    const { status } = req.body;
    try {
        const query = req.user.role === 'admin' ? { _id: req.params.id } : { _id: req.params.id, owner: req.user._id };
        const shipment = await InboundShipment.findOne(query);
        if (!shipment) return res.status(404).json({ message: 'Shipment not found' });
        shipment.status = status;
        if (status === 'arrived') shipment.actualArrival = new Date();
        await shipment.save();
        res.json(shipment);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

export default router;
