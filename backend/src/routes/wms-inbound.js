import express from 'express';
import InboundShipment from '../models/InboundShipment.js';

const router = express.Router();

// GET /api/wms/inbound
router.get('/', async (req, res) => {
    try {
        const shipments = await InboundShipment.find()
            .populate('vehicleId', 'numberPlate')
            .sort({ expectedArrival: 1 });
        res.json(shipments);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// POST /api/wms/inbound
router.post('/', async (req, res) => {
    const { provider, expectedArrival, vehicleId, items, notes } = req.body;
    try {
        const newShipment = new InboundShipment({
            shipmentId: `ASN-${Date.now()}`,
            provider, expectedArrival, vehicleId, items, notes
        });
        const savedShipment = await newShipment.save();
        res.status(201).json(savedShipment);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// PUT /api/wms/inbound/:id/status
router.put('/:id/status', async (req, res) => {
    const { status } = req.body;
    try {
        const shipment = await InboundShipment.findById(req.params.id);
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
