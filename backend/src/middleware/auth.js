import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import ScanPartner from '../models/ScanPartner.js';

export const protect = async (req, res, next) => {
    try {
        let token;

        if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
            token = req.headers.authorization.split(' ')[1];
        }

        if (!token) {
            return res.status(401).json({ error: 'Not authorized, no token' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Handle scan partner tokens
        if (decoded.role === 'scan_partner') {
            const partner = await ScanPartner.findById(decoded.id).select('-password');
            if (!partner) {
                return res.status(401).json({ error: 'Scan partner not found' });
            }
            // Map scan partner fields to req.user for compatibility
            req.user = {
                _id: partner._id,
                name: partner.name,
                phone: partner.phone,
                role: 'scan_partner',
                businessName: partner.name
            };
            return next();
        }

        // Default: look up regular user
        req.user = await User.findById(decoded.id).select('-password');

        if (!req.user) {
            return res.status(401).json({ error: 'User not found' });
        }

        next();
    } catch (error) {
        res.status(401).json({ error: 'Not authorized, token failed' });
    }
};

export const admin = (req, res, next) => {
    if (req.user && req.user.role === 'admin') {
        next();
    } else {
        res.status(403).json({ error: 'Not authorized as admin' });
    }
};
