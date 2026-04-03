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

// Middleware: requireApproved — blocks unapproved partners from operational endpoints
// NOTE: Wallet recharges are NOT gated — users can add funds without approval
export const requireApproved = (req, res, next) => {
    // Admins are always approved
    if (req.user.role === 'admin') return next();

    const blockedStatuses = ['suspended', 'rejected', 'draft', 'submitted', 'needs_more_info', 'reverification_required'];
    const status = req.user.onboardingStatus;

    // If no onboarding status set (legacy accounts), allow through
    if (!status || status === 'approved') return next();

    // For partners: block if not approved
    if (req.user.role === 'shipment_partner' && blockedStatuses.includes(status)) {
        return res.status(403).json({
            error: 'Your account is not yet approved for this action. Please complete onboarding and wait for approval.',
            onboardingStatus: status,
            code: 'ONBOARDING_NOT_APPROVED'
        });
    }

    // For regular users: only block if suspended
    if (status === 'suspended') {
        return res.status(403).json({
            error: 'Your account has been suspended. Please contact support.',
            onboardingStatus: status,
            code: 'ACCOUNT_SUSPENDED'
        });
    }

    next();
};

// Middleware: requirePayoutEligible — specifically for withdrawal/payout actions
export const requirePayoutEligible = (req, res, next) => {
    if (req.user.role === 'admin') return next();

    if (!req.user.payoutEligible) {
        return res.status(403).json({
            error: 'Payouts are not yet enabled for your account. Complete verification and get admin approval first.',
            code: 'PAYOUT_NOT_ELIGIBLE',
            onboardingStatus: req.user.onboardingStatus || 'unknown'
        });
    }
    next();
};
