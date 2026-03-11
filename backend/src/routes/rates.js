import express from 'express';
import PartnerPricing from '../models/PartnerPricing.js';
import User from '../models/User.js';

const router = express.Router();

// ─── Helper: check if a PIN code is within a range ───────────────────────────
const isPinInRange = (pin, ranges) => {
    if (!ranges || ranges.length === 0) return false;
    const pinNum = parseInt(pin, 10);
    return ranges.some(r => {
        const from = parseInt(r.from, 10);
        const to = parseInt(r.to, 10);
        return pinNum >= from && pinNum <= to;
    });
};

// ─── Helper: check if a partner's coverage includes a PIN ────────────────────
const coverageMatchesPin = (coverage, pin, state, city) => {
    if (!coverage) return false;

    // "All India" wildcard
    if (coverage.states && coverage.states.includes('All India')) return true;

    // State match
    if (state && coverage.states && coverage.states.some(s => s.toLowerCase() === state.toLowerCase())) return true;

    // City match
    if (city && coverage.cities && coverage.cities.some(c => c.toLowerCase() === city.toLowerCase())) return true;

    // PIN range match
    if (pin && isPinInRange(pin, coverage.pinRanges)) return true;

    return false;
};

// ─── Basic PIN → State/City lookup ───────────────────────────────────────────
// Covers major zones by first 2 digits
const getPinInfo = (pin) => {
    if (!pin || pin.length < 2) return { state: 'India', city: '' };
    const prefix = pin.substring(0, 2);
    const zoneMap = {
        '11': { state: 'Delhi', city: 'Delhi' },
        '12': { state: 'Haryana', city: 'Faridabad' },
        '13': { state: 'Haryana', city: 'Ambala' },
        '14': { state: 'Punjab', city: 'Patiala' },
        '15': { state: 'Punjab', city: 'Amritsar' },
        '16': { state: 'Punjab', city: 'Chandigarh' },
        '17': { state: 'Himachal Pradesh', city: 'Shimla' },
        '18': { state: 'Jammu & Kashmir', city: 'Jammu' },
        '19': { state: 'Jammu & Kashmir', city: 'Srinagar' },
        '20': { state: 'Uttar Pradesh', city: 'Agra' },
        '21': { state: 'Uttar Pradesh', city: 'Aligarh' },
        '22': { state: 'Uttar Pradesh', city: 'Kanpur' },
        '23': { state: 'Uttar Pradesh', city: 'Allahabad' },
        '24': { state: 'Uttar Pradesh', city: 'Bareilly' },
        '25': { state: 'Uttar Pradesh', city: 'Meerut' },
        '26': { state: 'Uttarakhand', city: 'Dehradun' },
        '27': { state: 'Uttar Pradesh', city: 'Varanasi' },
        '28': { state: 'Uttar Pradesh', city: 'Lucknow' },
        '30': { state: 'Rajasthan', city: 'Jaipur' },
        '31': { state: 'Rajasthan', city: 'Jodhpur' },
        '32': { state: 'Rajasthan', city: 'Bikaner' },
        '33': { state: 'Rajasthan', city: 'Ajmer' },
        '34': { state: 'Rajasthan', city: 'Alwar' },
        '36': { state: 'Gujarat', city: 'Ahmedabad' },
        '37': { state: 'Gujarat', city: 'Surat' },
        '38': { state: 'Gujarat', city: 'Vadodara' },
        '39': { state: 'Gujarat', city: 'Rajkot' },
        '40': { state: 'Maharashtra', city: 'Mumbai' },
        '41': { state: 'Maharashtra', city: 'Thane' },
        '42': { state: 'Maharashtra', city: 'Nashik' },
        '43': { state: 'Maharashtra', city: 'Aurangabad' },
        '44': { state: 'Maharashtra', city: 'Nagpur' },
        '45': { state: 'Madhya Pradesh', city: 'Bhopal' },
        '46': { state: 'Madhya Pradesh', city: 'Indore' },
        '47': { state: 'Madhya Pradesh', city: 'Gwalior' },
        '48': { state: 'Madhya Pradesh', city: 'Jabalpur' },
        '49': { state: 'Chhattisgarh', city: 'Raipur' },
        '50': { state: 'Telangana', city: 'Hyderabad' },
        '51': { state: 'Andhra Pradesh', city: 'Vijayawada' },
        '52': { state: 'Andhra Pradesh', city: 'Visakhapatnam' },
        '56': { state: 'Karnataka', city: 'Bengaluru' },
        '57': { state: 'Karnataka', city: 'Mysuru' },
        '58': { state: 'Kerala', city: 'Kozhikode' },
        '59': { state: 'Karnataka', city: 'Hubli' },
        '60': { state: 'Tamil Nadu', city: 'Chennai' },
        '61': { state: 'Tamil Nadu', city: 'Coimbatore' },
        '62': { state: 'Tamil Nadu', city: 'Madurai' },
        '63': { state: 'Tamil Nadu', city: 'Trichy' },
        '64': { state: 'Tamil Nadu', city: 'Salem' },
        '67': { state: 'Kerala', city: 'Thiruvananthapuram' },
        '68': { state: 'Kerala', city: 'Kochi' },
        '69': { state: 'Kerala', city: 'Thrissur' },
        '70': { state: 'West Bengal', city: 'Kolkata' },
        '71': { state: 'West Bengal', city: 'Howrah' },
        '72': { state: 'West Bengal', city: 'Asansol' },
        '73': { state: 'West Bengal', city: 'Siliguri' },
        '74': { state: 'West Bengal', city: 'Durgapur' },
        '75': { state: 'Odisha', city: 'Bhubaneswar' },
        '76': { state: 'Odisha', city: 'Cuttack' },
        '78': { state: 'Assam', city: 'Guwahati' },
        '80': { state: 'Bihar', city: 'Patna' },
        '81': { state: 'Bihar', city: 'Gaya' },
        '82': { state: 'Jharkhand', city: 'Ranchi' },
        '83': { state: 'Jharkhand', city: 'Jamshedpur' },
        '85': { state: 'Jharkhand', city: 'Dhanbad' },
        '90': { state: 'Army Post Office', city: 'APS' },
    };
    return zoneMap[prefix] || { state: 'India', city: '' };
};

// ─── GET /api/rates/calculate ─────────────────────────────────────────────────
// PUBLIC endpoint (no auth needed)
router.get('/calculate', async (req, res) => {
    try {
        const { pickupPin, deliveryPin, weight, length, width, height, paymentMode = 'prepaid' } = req.query;

        // Validation
        if (!pickupPin || pickupPin.length !== 6) {
            return res.status(400).json({ error: 'Invalid pickup PIN code (must be 6 digits)' });
        }
        if (!deliveryPin || deliveryPin.length !== 6) {
            return res.status(400).json({ error: 'Invalid delivery PIN code (must be 6 digits)' });
        }
        const weightNum = parseFloat(weight);
        if (!weight || isNaN(weightNum) || weightNum <= 0) {
            return res.status(400).json({ error: 'Weight must be a positive number' });
        }

        // Determine volumetric weight if dimensions provided
        let volWeight = 0;
        if (length && width && height) {
            volWeight = (parseFloat(length) * parseFloat(width) * parseFloat(height)) / 5000;
        }

        // Get state/city info for both PINs
        const pickupInfo = getPinInfo(pickupPin);
        const deliveryInfo = getPinInfo(deliveryPin);

        // Fetch all partner pricing records that have active services
        const allPricing = await PartnerPricing.find({
            'services.active': true,
        }).lean();

        // Filter: only partners covering BOTH pickup AND delivery
        const matchedPricings = allPricing.filter(p => {
            const coversBoth =
                coverageMatchesPin(p.coverage, pickupPin, pickupInfo.state, pickupInfo.city) &&
                coverageMatchesPin(p.coverage, deliveryPin, deliveryInfo.state, deliveryInfo.city);
            return coversBoth;
        });

        // Fetch partner details (company names, ratings)
        const partnerIds = matchedPricings.map(p => p.partnerId);
        const partners = await User.find({ _id: { $in: partnerIds } }).lean();
        const partnerMap = {};
        partners.forEach(p => { partnerMap[p._id.toString()] = p; });

        // Calculate rates for each partner
        const results = matchedPricings.map(pricing => {
            const partner = partnerMap[pricing.partnerId.toString()];
            if (!partner) return null;

            const activeServices = (pricing.services || []).filter(s => s.active);

            const computedServices = activeServices.map(service => {
                // Skip if weight exceeds service max
                const effectiveWeight = Math.max(weightNum, volWeight || 0, service.minWeight || 0.5);
                if (effectiveWeight > (service.maxWeight || 50)) return null;

                let price = service.basePrice + (effectiveWeight * service.perKgRate);

                // Add COD charge if applicable
                if (paymentMode === 'cod') {
                    if (!service.codAvailable) return null; // Skip this service for COD if not supported
                    price += (service.codCharge || 0);
                }

                const features = [];
                if (service.codAvailable) features.push('COD Available');
                if (service.type === 'express' || service.type === 'same_day') features.push('Fast Delivery');

                return {
                    serviceId: service._id,
                    type: service.type,
                    name: service.name,
                    price: Math.round(price),
                    estimatedDays: service.estimatedDays,
                    codAvailable: service.codAvailable,
                    features,
                };
            }).filter(Boolean);

            if (computedServices.length === 0) return null;

            // Compute cheapest standard price for sorting
            const standardService = computedServices.find(s => s.type === 'standard');
            const cheapestPrice = standardService?.price || computedServices[0]?.price || 9999;

            return {
                partnerId: partner._id,
                companyName: pricing.companyName || partner.businessName || partner.contactPerson || 'Partner',
                rating: partner.rating || null,
                totalRatings: partner.totalRatings || 0,
                services: computedServices,
                _sortPrice: cheapestPrice,
            };
        }).filter(Boolean);

        // Sort cheapest standard first
        results.sort((a, b) => a._sortPrice - b._sortPrice);

        // Remove internal sort field
        const finalResults = results.map(({ _sortPrice, ...rest }) => rest);

        // Mark the cheapest as "best rate"
        if (finalResults.length > 0) {
            finalResults[0].bestRate = true;
        }

        res.json(finalResults);
    } catch (error) {
        console.error('Rate calculate error:', error);
        res.status(500).json({ error: error.message });
    }
});

export default router;
