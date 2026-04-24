import express from 'express';

const router = express.Router();

// Verify GSTIN format and return business data
// In production, integrate with GST Network / API Setu for real verification
router.post('/verify', async (req, res) => {
    try {
        const { gstin } = req.body;

        if (!gstin || typeof gstin !== 'string') {
            return res.status(400).json({
                success: false,
                valid: false,
                error: 'GSTIN is required'
            });
        }

        // Basic GSTIN validation format: 22AAAAA0000A1Z5
        const gstinRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;

        if (!gstinRegex.test(gstin)) {
            return res.status(400).json({
                success: false,
                valid: false,
                error: 'Invalid GSTIN format. Expected format: 22AAAAA0000A1Z5'
            });
        }

        // Extract state code from GSTIN (first 2 digits)
        const stateCodeMap = {
            '01': 'Jammu & Kashmir', '02': 'Himachal Pradesh', '03': 'Punjab',
            '04': 'Chandigarh', '05': 'Uttarakhand', '06': 'Haryana',
            '07': 'Delhi', '08': 'Rajasthan', '09': 'Uttar Pradesh',
            '10': 'Bihar', '11': 'Sikkim', '12': 'Arunachal Pradesh',
            '13': 'Nagaland', '14': 'Manipur', '15': 'Mizoram',
            '16': 'Tripura', '17': 'Meghalaya', '18': 'Assam',
            '19': 'West Bengal', '20': 'Jharkhand', '21': 'Odisha',
            '22': 'Chhattisgarh', '23': 'Madhya Pradesh', '24': 'Gujarat',
            '25': 'Daman & Diu', '26': 'Dadra & Nagar Haveli', '27': 'Maharashtra',
            '29': 'Karnataka', '30': 'Goa', '32': 'Kerala',
            '33': 'Tamil Nadu', '34': 'Puducherry', '35': 'Andaman & Nicobar',
            '36': 'Telangana', '37': 'Andhra Pradesh',
        };

        const stateCode = gstin.substring(0, 2);
        const stateName = stateCodeMap[stateCode] || `State Code ${stateCode}`;

        // Extract PAN from GSTIN (characters 3-12)
        const pan = gstin.substring(2, 12);

        // In production, this would call the actual GST Network API
        // For now, return format-validated data with state mapping
        const businessData = {
            legalName: `Business (${pan})`,
            businessName: `Trade Name (${pan})`,
            registrationType: 'Regular',
            status: 'Active',
            registrationDate: '—',
            stateCode: `${stateCode} — ${stateName}`,
            address: {
                state: stateName,
                pincode: ''
            }
        };

        res.json({
            success: true,
            valid: true,
            data: businessData
        });
    } catch (error) {
        console.error('GSTIN verify error:', error);
        res.status(500).json({
            success: false,
            valid: false,
            error: error.message
        });
    }
});

export default router;
