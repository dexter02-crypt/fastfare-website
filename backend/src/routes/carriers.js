import express from 'express';
import User from '../models/User.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// ─── GET /api/carriers/active ─── Public: list approved partners for the dropdown
router.get('/active', async (req, res) => {
    try {
        const partners = await User.find({
            role: 'shipment_partner',
            'partnerDetails.status': 'approved'
        }).select('businessName contactPerson partnerDetails').lean();

        // Load accurate pricing from PartnerPricing schema
        const PartnerPricing = (await import('../models/PartnerPricing.js')).default;
        const pricings = await PartnerPricing.find({ partnerId: { $in: partners.map(p => p._id) } }).lean();

        // Map format
        let carriers = partners.map(p => {
            const pricing = pricings.find(pr => pr.partnerId.toString() === p._id.toString());
            const standardService = pricing?.services?.find(s => s.type === 'standard' || s.active) || {};

            return {
                _id: p._id,
                businessName: pricing?.companyName || p.businessName,
                contactPerson: p.contactPerson,
                rating: p.partnerDetails?.rating,
                baseFare: standardService?.basePrice || 99,
                perKgRate: standardService?.perKgRate || 10,
                eta: standardService?.estimatedDays || p.partnerDetails?.eta || '3-5 days',
                features: standardService?.codAvailable ? ['COD Available'] : [],
                supportedTypes: p.partnerDetails?.supportedTypes || ['standard'],
                serviceZones: p.partnerDetails?.serviceZones
            };
        });

        res.json({ success: true, carriers });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// ─── GET /api/carriers/check-serviceability ─── Filter by pickup/delivery pincode
router.get('/check-serviceability', async (req, res) => {
    try {
        const { pickup, delivery, serviceType } = req.query;

        let query = {
            role: 'shipment_partner',
            'partnerDetails.status': 'approved'
        };

        if (serviceType) {
            query['partnerDetails.supportedTypes'] = serviceType;
        }

        let partners = await User.find(query).select('businessName contactPerson partnerDetails').lean();
        
        // Load accurate pricing from PartnerPricing schema
        const PartnerPricing = (await import('../models/PartnerPricing.js')).default;
        const pricings = await PartnerPricing.find({ partnerId: { $in: partners.map(p => p._id) } }).lean();

        // Map format
        let carriers = partners.map(p => {
            const pricing = pricings.find(pr => pr.partnerId.toString() === p._id.toString());
            const standardService = pricing?.services?.find(s => s.type === 'standard' || s.active) || {};
            
            return {
                _id: p._id,
                businessName: pricing?.companyName || p.businessName,
                contactPerson: p.contactPerson,
                rating: p.partnerDetails?.rating,
                baseFare: standardService?.basePrice || 99,
                perKgRate: standardService?.perKgRate || 10,
                eta: standardService?.estimatedDays || p.partnerDetails?.eta || '3-5 days',
                features: standardService?.codAvailable ? ['COD Available'] : [],
                supportedTypes: p.partnerDetails?.supportedTypes || ['standard'],
                serviceZones: p.partnerDetails?.serviceZones
            };
        });

        // Filter by serviceability (pincode match)
        if (pickup || delivery) {
            carriers = carriers.filter(carrier => {
                const pricing = pricings.find(pr => pr.partnerId.toString() === carrier._id.toString());
                const pinRanges = pricing?.coverage?.pinRanges || [];
                const states = pricing?.coverage?.states || [];
                
                // If it claims "All India", we can permit it.
                if (states.includes('All India')) return true;

                // Otherwise fallback to pincode ranges checking
                if (pinRanges.length > 0) {
                     return pinRanges.some((range) => {
                         const start = parseInt(range.from);
                         const end = parseInt(range.to);
                         const pickupNum = pickup ? parseInt(pickup) : null;
                         const deliveryNum = delivery ? parseInt(delivery) : null;

                         return (!pickup || (pickupNum >= start && pickupNum <= end)) &&
                                (!delivery || (deliveryNum >= start && deliveryNum <= end));
                     });
                }
                
                // Fallback to legacy
                if (!carrier.serviceZones || carrier.serviceZones.length === 0) return true; // no zones = serves all
                return carrier.serviceZones.some((zone) => {
                    if (!zone.pincodes || zone.pincodes.length === 0) return true;
                    return zone.pincodes.some((pin) => {
                        if (pin.includes('-')) {
                            const [start, end] = pin.split('-').map(Number);
                            const pickupNum = parseInt(pickup);
                            const deliveryNum = parseInt(delivery);
                            return (!pickup || (pickupNum >= start && pickupNum <= end)) &&
                                (!delivery || (deliveryNum >= start && deliveryNum <= end));
                        }
                        return pin === pickup || pin === delivery;
                    });
                });
            });
        }

        res.json({ success: true, carriers });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// ─── GET /api/carriers/ ─── Admin: list all carriers (now shipment_partners)
router.get('/', protect, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ success: false, message: 'Admin access required' });
        }

        const { status } = req.query;
        let query = { role: 'shipment_partner' };
        if (status) {
            query['partnerDetails.status'] = status;
        }

        let partners = await User.find(query)
            .select('-password -__v')
            .sort({ createdAt: -1 })
            .lean();

        // Map format for admin frontend
        let carriers = partners.map(p => ({
            _id: p._id,
            businessName: p.businessName,
            contactPerson: p.contactPerson,
            email: p.email,
            phone: p.phone,
            gstin: p.gstin,
            status: p.partnerDetails?.status || 'pending_approval',
            fleetDetails: p.partnerDetails?.fleetDetails || { totalVehicles: 0, vehicleTypes: [] },
            serviceZones: p.partnerDetails?.serviceZones || [],
            baseFare: p.partnerDetails?.baseFare,
            createdAt: p.createdAt
        }));

        res.json({ success: true, carriers });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// ─── PUT /api/carriers/:id/approve ─── Admin: approve carrier
router.put('/:id/approve', protect, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ success: false, message: 'Admin access required' });
        }

        const partner = await User.findOne({ _id: req.params.id, role: 'shipment_partner' });
        if (!partner) {
            return res.status(404).json({ success: false, message: 'Partner not found' });
        }

        if (!partner.partnerDetails) partner.partnerDetails = {};
        partner.partnerDetails.status = 'approved';
        partner.partnerDetails.approvedAt = new Date();
        partner.partnerDetails.approvedBy = req.user._id;
        partner.partnerDetails.rejectionReason = undefined;
        await partner.save();

        res.json({
            success: true,
            message: `${partner.businessName} has been approved`,
            carrier: { id: partner._id, businessName: partner.businessName, status: 'approved' }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// ─── PUT /api/carriers/:id/reject ─── Admin: reject carrier
router.put('/:id/reject', protect, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ success: false, message: 'Admin access required' });
        }

        const partner = await User.findOne({ _id: req.params.id, role: 'shipment_partner' });
        if (!partner) {
            return res.status(404).json({ success: false, message: 'Partner not found' });
        }

        if (!partner.partnerDetails) partner.partnerDetails = {};
        partner.partnerDetails.status = 'rejected';
        partner.partnerDetails.rejectionReason = req.body.reason || 'Application did not meet requirements';
        await partner.save();

        res.json({
            success: true,
            message: `${partner.businessName} has been rejected`,
            carrier: { id: partner._id, businessName: partner.businessName, status: 'rejected' }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// ─── PUT /api/carriers/:id/suspend ─── Admin: suspend carrier
router.put('/:id/suspend', protect, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ success: false, message: 'Admin access required' });
        }

        const partner = await User.findOne({ _id: req.params.id, role: 'shipment_partner' });
        if (!partner) {
            return res.status(404).json({ success: false, message: 'Partner not found' });
        }

        if (!partner.partnerDetails) partner.partnerDetails = {};
        partner.partnerDetails.status = 'suspended';
        await partner.save();

        res.json({
            success: true,
            message: `${partner.businessName} has been suspended`
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

export default router;
