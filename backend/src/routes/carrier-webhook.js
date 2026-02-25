import express from 'express';
import crypto from 'crypto';
import Shipment from '../models/Shipment.js';
import Carrier from '../models/Carrier.js';

const router = express.Router();

/**
 * POST /api/carrier-webhook/status
 * Receives status updates FROM a carrier's system (e.g. Balaji pushes "picked_up").
 * Authenticated via X-Carrier-ApiKey header.
 * Idempotent: rejects backward status transitions.
 */
router.post('/status', async (req, res) => {
    try {
        const apiKey = req.headers['x-carrier-apikey'];
        if (!apiKey) {
            return res.status(401).json({ success: false, message: 'Missing X-Carrier-ApiKey header' });
        }

        const carrier = await Carrier.findOne({ apiKey, status: 'approved', isActive: true });
        if (!carrier) {
            return res.status(403).json({ success: false, message: 'Invalid API key or carrier not active' });
        }

        const { shipmentId, awb, status, location, description } = req.body;

        if (!status) {
            return res.status(400).json({ success: false, message: 'status is required' });
        }

        // Find shipment by ID or AWB
        let shipment;
        if (shipmentId) {
            shipment = await Shipment.findOne({ _id: shipmentId, carrierId: carrier._id });
        } else if (awb) {
            shipment = await Shipment.findOne({ awb, carrierId: carrier._id });
        }

        if (!shipment) {
            return res.status(404).json({ success: false, message: 'Shipment not found for this carrier' });
        }

        // Status progression order (prevent backward transitions)
        const statusOrder = [
            'pending', 'pending_acceptance', 'accepted', 'pickup_scheduled',
            'picked_up', 'in_transit', 'out_for_delivery', 'delivered'
        ];
        const currentIdx = statusOrder.indexOf(shipment.status);
        const newIdx = statusOrder.indexOf(status);

        if (newIdx <= currentIdx && status !== 'cancelled') {
            return res.status(400).json({
                success: false,
                message: `Cannot transition from '${shipment.status}' to '${status}'`
            });
        }

        shipment.status = status;
        shipment.trackingHistory.push({
            status,
            location: location || '',
            description: description || `Status updated by carrier: ${carrier.businessName}`,
            timestamp: new Date()
        });

        if (status === 'delivered') {
            shipment.actualDelivery = new Date();
        }

        await shipment.save();

        // Broadcast via Socket.IO if available
        const io = req.app.get('io');
        if (io) {
            io.to(`carrier_${carrier._id}`).emit('shipment_status_updated', {
                shipmentId: shipment._id,
                awb: shipment.awb,
                status,
                timestamp: new Date()
            });
            // Also notify the user tracking room
            io.emit('shipment_update', {
                shipmentId: shipment._id,
                awb: shipment.awb,
                status,
                timestamp: new Date()
            });
        }

        res.json({
            success: true,
            message: `Shipment ${shipment.awb} updated to '${status}'`,
            shipment: {
                id: shipment._id,
                awb: shipment.awb,
                status: shipment.status
            }
        });
    } catch (error) {
        console.error('Carrier webhook status error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

export default router;
