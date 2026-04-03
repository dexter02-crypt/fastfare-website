import express from 'express';
import { protect, admin, requireApproved, requirePayoutEligible } from '../middleware/auth.js';
import PartnerLedger from '../models/PartnerLedger.js';
import WithdrawalRequest from '../models/WithdrawalRequest.js';
import Shipment from '../models/Shipment.js';

const router = express.Router();

// ══════════════════════════════════════════════════
// GET /api/partner/wallet-summary
// Complete financial overview for the partner dashboard
// Enforces 2-day withdrawal hold on earnings
// ══════════════════════════════════════════════════
router.get('/wallet-summary', protect, async (req, res) => {
    try {
        if (req.user.role !== 'shipment_partner' && req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Partner access only' });
        }

        const partnerId = req.user._id;
        const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);

        // Get current total balance from the most recent ledger entry
        const lastEntry = await PartnerLedger.findOne({ partnerId }).sort({ createdAt: -1 });
        const totalBalance = lastEntry ? lastEntry.balanceAfter : 0;

        // Calculate withdrawable balance: only earnings older than 2 days
        // Sum of all credits older than 2 days minus all debits
        const [totalCreditsOlderThan2Days] = await PartnerLedger.aggregate([
            {
                $match: {
                    partnerId: partnerId,
                    type: { $in: ['earning', 'bonus', 'cod_collection'] },
                    createdAt: { $lte: twoDaysAgo }
                }
            },
            { $group: { _id: null, total: { $sum: '$amount' } } }
        ]);

        const [totalDebits] = await PartnerLedger.aggregate([
            {
                $match: {
                    partnerId: partnerId,
                    type: { $in: ['payout', 'deduction', 'penalty', 'cod_remittance'] }
                }
            },
            { $group: { _id: null, total: { $sum: '$amount' } } }
        ]);

        const maturedCredits = totalCreditsOlderThan2Days?.total || 0;
        const totalDebitsAmount = totalDebits?.total || 0;
        const withdrawableBalance = Math.max(0, maturedCredits - totalDebitsAmount);

        // Pending withdrawal amount
        const pendingWithdrawal = await WithdrawalRequest.findOne({
            partnerId,
            status: { $in: ['pending', 'approved', 'processing'] }
        });
        const pendingWithdrawalAmount = pendingWithdrawal?.amount || 0;

        // Totals
        const [earningsTotals] = await PartnerLedger.aggregate([
            { $match: { partnerId, type: 'earning' } },
            { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } }
        ]);

        const [payoutTotals] = await PartnerLedger.aggregate([
            { $match: { partnerId, type: 'payout' } },
            { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } }
        ]);

        // Recent transactions (last 10)
        const recentTransactions = await PartnerLedger.find({ partnerId })
            .sort({ createdAt: -1 })
            .limit(10)
            .populate('orderId', 'awb carrier delivery.city');

        res.json({
            success: true,
            wallet: {
                totalBalance,
                withdrawableBalance,
                heldBalance: totalBalance - withdrawableBalance,
                pendingWithdrawalAmount,
                availableForWithdrawal: Math.max(0, withdrawableBalance - pendingWithdrawalAmount),
                totalEarned: earningsTotals?.total || 0,
                totalOrders: earningsTotals?.count || 0,
                totalWithdrawn: payoutTotals?.total || 0,
                totalWithdrawals: payoutTotals?.count || 0,
                holdPeriodDays: 2
            },
            recentTransactions
        });
    } catch (error) {
        console.error('Partner wallet-summary error:', error);
        res.status(500).json({ error: error.message });
    }
});

// ══════════════════════════════════════════════════
// GET /api/partner/ledger
// Partner's financial ledger with pagination
// ══════════════════════════════════════════════════
router.get('/ledger', protect, async (req, res) => {
    try {
        if (req.user.role !== 'shipment_partner' && req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Partner access only' });
        }

        const { page = 1, limit = 50, type } = req.query;
        const skip = (parseInt(page) - 1) * parseInt(limit);
        const partnerId = req.user.role === 'admin' && req.query.partnerId
            ? req.query.partnerId
            : req.user._id;

        const query = { partnerId };
        if (type) query.type = type;

        const [entries, total] = await Promise.all([
            PartnerLedger.find(query)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(parseInt(limit)),
            PartnerLedger.countDocuments(query)
        ]);

        res.json({
            success: true,
            ledger: entries,
            pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / parseInt(limit)) }
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ══════════════════════════════════════════════════
// GET /api/partner/payouts
// Payout history for partner
// ══════════════════════════════════════════════════
router.get('/payouts', protect, async (req, res) => {
    try {
        if (req.user.role !== 'shipment_partner' && req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Partner access only' });
        }

        const partnerId = req.user.role === 'admin' && req.query.partnerId
            ? req.query.partnerId
            : req.user._id;

        const payouts = await PartnerLedger.find({
            partnerId,
            type: 'payout'
        }).sort({ createdAt: -1 });

        const totalPaidOut = payouts.reduce((sum, p) => sum + p.amount, 0);

        res.json({
            success: true,
            payouts,
            totalPaidOut
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ══════════════════════════════════════════════════
// GET /api/partner/earnings
// Earnings summary for partner
// ══════════════════════════════════════════════════
router.get('/earnings', protect, async (req, res) => {
    try {
        if (req.user.role !== 'shipment_partner' && req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Partner access only' });
        }

        const partnerId = req.user.role === 'admin' && req.query.partnerId
            ? req.query.partnerId
            : req.user._id;

        const summary = await PartnerLedger.aggregate([
            { $match: { partnerId: partnerId } },
            {
                $group: {
                    _id: '$type',
                    total: { $sum: '$amount' },
                    count: { $sum: 1 }
                }
            }
        ]);

        // Calculate current balance
        const lastEntry = await PartnerLedger.findOne({ partnerId }).sort({ createdAt: -1 });
        const currentBalance = lastEntry ? lastEntry.balanceAfter : 0;

        // This month's earnings
        const monthStart = new Date();
        monthStart.setDate(1);
        monthStart.setHours(0, 0, 0, 0);

        const monthlyEarnings = await PartnerLedger.aggregate([
            {
                $match: {
                    partnerId: partnerId,
                    type: 'earning',
                    createdAt: { $gte: monthStart }
                }
            },
            {
                $group: {
                    _id: null,
                    total: { $sum: '$amount' },
                    trips: { $sum: 1 },
                    totalDistance: { $sum: '$distance' }
                }
            }
        ]);

        const monthly = monthlyEarnings[0] || { total: 0, trips: 0, totalDistance: 0 };

        // Deliveries today
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);

        const todayEarnings = await PartnerLedger.aggregate([
            {
                $match: {
                    partnerId: partnerId,
                    type: 'earning',
                    createdAt: { $gte: todayStart }
                }
            },
            {
                $group: {
                    _id: null,
                    total: { $sum: '$amount' },
                    trips: { $sum: 1 }
                }
            }
        ]);

        const today = todayEarnings[0] || { total: 0, trips: 0 };

        res.json({
            success: true,
            earnings: {
                currentBalance,
                summary: summary.reduce((acc, s) => {
                    acc[s._id] = { total: s.total, count: s.count };
                    return acc;
                }, {}),
                monthly: {
                    earnings: monthly.total,
                    trips: monthly.trips,
                    totalDistance: monthly.totalDistance
                },
                today: {
                    earnings: today.total,
                    trips: today.trips
                }
            }
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ══════════════════════════════════════════════════
// POST /api/partner/record-earning
// Record partner earning for a delivery (called on delivery completion)
// ══════════════════════════════════════════════════
router.post('/record-earning', protect, async (req, res) => {
    try {
        const { orderId, partnerId, distance, partnerRate, slabAdd = 0 } = req.body;

        const shipment = await Shipment.findById(orderId);
        if (!shipment) return res.status(404).json({ error: 'Order not found' });

        // Unified payout: Base Earning + GST @18%
        const baseEarning = Math.round(((distance * partnerRate) + slabAdd) * 100) / 100;
        const partnerGst = Math.round(baseEarning * 0.18 * 100) / 100;
        const totalPayout = Math.round((baseEarning + partnerGst) * 100) / 100;

        // Get current balance
        const lastEntry = await PartnerLedger.findOne({ partnerId }).sort({ createdAt: -1 });
        const balanceBefore = lastEntry ? lastEntry.balanceAfter : 0;

        const entry = await PartnerLedger.create({
            partnerId,
            orderId,
            type: 'earning',
            amount: totalPayout,
            description: `Delivery earning for ${shipment.awb} — Base ₹${baseEarning} + GST ₹${partnerGst} = ₹${totalPayout}`,
            distance,
            partnerRate,
            slabAdd,
            balanceBefore,
            balanceAfter: balanceBefore + totalPayout
        });

        res.json({
            success: true,
            earning: {
                id: entry._id,
                baseEarning,
                partnerGst,
                totalPayout,
                distance,
                formula: `(${distance} × ₹${partnerRate}) + ₹${slabAdd} = ₹${baseEarning} base + ₹${partnerGst} GST = ₹${totalPayout}`,
                currentBalance: entry.balanceAfter
            }
        });
    } catch (error) {
        console.error('Partner earning record error:', error);
        res.status(500).json({ error: error.message });
    }
});

// ══════════════════════════════════════════════════════════════
//  BANK DETAILS & BENEFICIARIES
// ══════════════════════════════════════════════════════════════
router.get('/bank-details', protect, async (req, res) => {
    try {
        const { default: User } = await import('../models/User.js');
        const user = await User.findById(req.user._id).select('bankDetails payoutEligible');
        if (!user) return res.status(404).json({ error: 'User not found' });
        
        res.json({ success: true, bankDetails: user.bankDetails || null, payoutEligible: user.payoutEligible });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.post('/bank-details', protect, async (req, res) => {
    try {
        const { accountName, accountNumber, ifsc, bankName } = req.body;
        
        // Basic Validations
        if (!accountName || !accountNumber || !ifsc) {
            return res.status(400).json({ error: 'Account Name, Number, and IFSC are required.' });
        }

        const { default: User } = await import('../models/User.js');
        const user = await User.findById(req.user._id);

        if (user.bankDetails?.isVerified && user.bankDetails?.beneficiaryId) {
            return res.status(400).json({ error: 'Bank details already verified and linked. Please contact support to change.' });
        }

        // Create Cashfree Beneficiary Identifier (Unique to our DB)
        const beneficiaryId = `FF_BENE_${user._id.toString()}`;

        // In a real Cashfree Payout integration, you'd call
        // POST /payout/v1/addBeneficiary right here and wait for SUCCESS.
        // Assuming success/Mock for now:
        const isBeneficiaryAddedInGateway = true; // Replace with CF API Call

        if (!isBeneficiaryAddedInGateway) {
            return res.status(500).json({ error: 'Failed to register bank with Payout Gateway. Try again later.' });
        }

        user.bankDetails = {
            accountName,
            accountNumber,
            ifsc: ifsc.toUpperCase(),
            bankName: bankName || 'Unknown Bank',
            beneficiaryId,
            isVerified: true,  // Automatically set true upon successful gateway addition
            addedAt: new Date()
        };

        // If they were previously blocked from payout because of lacking a bank, they might now be eligible.
        // The admin typically controls payoutEligible, but we can set a flag.
        await user.save();

        res.json({
            success: true,
            message: 'Bank details securely saved and linked.',
            bankDetails: user.bankDetails
        });

    } catch (error) {
        console.error('Bank Details Error:', error);
        res.status(500).json({ error: 'Failed to process bank details.' });
    }
});

// ══════════════════════════════════════════════════════════════
//  WITHDRAWAL SYSTEM
//  Partner requests → Admin reviews → Payout processed
// ══════════════════════════════════════════════════════════════

// POST /api/partner/withdraw — Partner requests a withdrawal
router.post('/withdraw', protect, requireApproved, requirePayoutEligible, async (req, res) => {
    try {
        if (req.user.role !== 'shipment_partner') {
            return res.status(403).json({ error: 'Partner access only' });
        }

        const { amount } = req.body;

        if (!amount || amount <= 0) {
            return res.status(400).json({ error: 'Invalid withdrawal amount' });
        }

        const { default: User } = await import('../models/User.js');
        const user = await User.findById(req.user._id).select('bankDetails pending_review payoutEligible');

        if (!user.bankDetails || !user.bankDetails.isVerified || !user.bankDetails.beneficiaryId) {
            return res.status(400).json({ error: 'Bank details missing or unverified. Please link your bank first.' });
        }

        // Calculate withdrawable balance (2-day hold enforcement)
        const partnerId = req.user._id;
        const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);

        const lastEntry = await PartnerLedger.findOne({ partnerId }).sort({ createdAt: -1 });
        const currentBalance = lastEntry ? lastEntry.balanceAfter : 0;

        // Only earnings older than 2 days are withdrawable
        const [maturedCreditsResult] = await PartnerLedger.aggregate([
            {
                $match: {
                    partnerId: partnerId,
                    type: { $in: ['earning', 'bonus', 'cod_collection'] },
                    createdAt: { $lte: twoDaysAgo }
                }
            },
            { $group: { _id: null, total: { $sum: '$amount' } } }
        ]);

        const [totalDebitsResult] = await PartnerLedger.aggregate([
            {
                $match: {
                    partnerId: partnerId,
                    type: { $in: ['payout', 'deduction', 'penalty', 'cod_remittance'] }
                }
            },
            { $group: { _id: null, total: { $sum: '$amount' } } }
        ]);

        const withdrawableBalance = Math.max(0, (maturedCreditsResult?.total || 0) - (totalDebitsResult?.total || 0));

        if (amount > withdrawableBalance) {
            return res.status(400).json({
                error: 'Amount exceeds withdrawable balance. Earnings need a 2-day hold period before withdrawal.',
                currentBalance,
                withdrawableBalance,
                requested: amount
            });
        }

        // Check for pending withdrawal
        const pendingRequest = await WithdrawalRequest.findOne({
            partnerId: req.user._id,
            status: { $in: ['pending', 'processing'] }
        });

        if (pendingRequest) {
            return res.status(400).json({
                error: 'You already have a pending withdrawal request',
                pendingAmount: pendingRequest.amount,
                requestId: pendingRequest._id
            });
        }

        // Save bank snapshot so if they change it later, request still goes to right place
        const requestBankSnapshot = {
            accountName: user.bankDetails.accountName,
            accountNumber: user.bankDetails.accountNumber,
            ifsc: user.bankDetails.ifsc,
            beneficiaryId: user.bankDetails.beneficiaryId
        };

        const withdrawal = await WithdrawalRequest.create({
            partnerId: req.user._id,
            amount,
            bankDetails: requestBankSnapshot,
            balanceAtRequest: currentBalance,
            status: 'pending'
        });

        res.status(201).json({
            success: true,
            message: 'Withdrawal request submitted. Awaiting admin approval.',
            withdrawal: {
                id: withdrawal._id,
                amount: withdrawal.amount,
                status: withdrawal.status,
                balanceAtRequest: currentBalance,
                createdAt: withdrawal.createdAt
            }
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// GET /api/partner/withdrawals — Partner views their withdrawal history
router.get('/withdrawals', protect, async (req, res) => {
    try {
        if (req.user.role !== 'shipment_partner' && req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Partner access only' });
        }

        const partnerId = req.user.role === 'admin' && req.query.partnerId
            ? req.query.partnerId
            : req.user._id;

        const withdrawals = await WithdrawalRequest.find({ partnerId })
            .populate('reviewedBy', 'businessName email')
            .sort({ createdAt: -1 });

        res.json({ success: true, withdrawals });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ─── ADMIN ENDPOINTS ───

// GET /api/partner/admin/withdrawals — Admin views all withdrawal requests
router.get('/admin/withdrawals', protect, admin, async (req, res) => {
    try {
        const { status, page = 1, limit = 20 } = req.query;
        const skip = (parseInt(page) - 1) * parseInt(limit);

        const query = {};
        if (status) query.status = status;

        const [requests, total] = await Promise.all([
            WithdrawalRequest.find(query)
                .populate('partnerId', 'businessName email phone tier')
                .populate('reviewedBy', 'businessName email')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(parseInt(limit)),
            WithdrawalRequest.countDocuments(query)
        ]);

        // Summary counts
        const [pending, approved, rejected] = await Promise.all([
            WithdrawalRequest.countDocuments({ status: 'pending' }),
            WithdrawalRequest.countDocuments({ status: { $in: ['approved', 'completed'] } }),
            WithdrawalRequest.countDocuments({ status: 'rejected' })
        ]);

        res.json({
            success: true,
            requests,
            summary: { pending, approved, rejected },
            pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / parseInt(limit)) }
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// PUT /api/partner/admin/withdrawals/:id/approve — Admin approves a withdrawal
router.put('/admin/withdrawals/:id/approve', protect, admin, async (req, res) => {
    try {
        const { adminNote } = req.body;

        const withdrawal = await WithdrawalRequest.findById(req.params.id);
        if (!withdrawal) return res.status(404).json({ error: 'Withdrawal request not found' });
        if (withdrawal.status !== 'pending') return res.status(400).json({ error: `Cannot approve — current status is "${withdrawal.status}"` });

        // Get partner's current balance
        const lastEntry = await PartnerLedger.findOne({ partnerId: withdrawal.partnerId }).sort({ createdAt: -1 });
        const currentBalance = lastEntry ? lastEntry.balanceAfter : 0;

        if (withdrawal.amount > currentBalance) {
            return res.status(400).json({
                error: 'Partner has insufficient balance for this withdrawal',
                currentBalance,
                requested: withdrawal.amount
            });
        }

        const beneficiaryId = withdrawal.bankDetails?.beneficiaryId;
        if (!beneficiaryId) {
             return res.status(400).json({ error: 'Cannot process payout: Beneficiary ID is missing in the request.' });
        }

        // Create payout reference id
        const transferId = `FF_PAYOUT_${withdrawal._id}`;

        // External Gateway Request (Cashfree Payout) Goes Here
        // const payoutRes = await fetch('https://payout-api.cashfree.com/payout/v1/requestTransfer', { ... });
        
        // Simulating the Payout Request API success for now since we lack keys:
        const payoutResponseSuccess = true; 

        if (!payoutResponseSuccess) {
            // If Cashfree fundamentally rejects it via HTTP 400 immediately
            return res.status(500).json({ error: 'Payout Gateway rejected the transfer request.' });
        }

        // 1. Create payout ledger entry ONLY once the money is "in transit" (processing) or "completed"
        // It's safer to deduct mathematically while it's processing so they can't withdraw again.
        await PartnerLedger.create({
            partnerId: withdrawal.partnerId,
            type: 'payout',
            amount: withdrawal.amount,
            description: `Withdrawal payout initiated — Payout Reference: ${transferId}`,
            balanceBefore: currentBalance,
            balanceAfter: currentBalance - withdrawal.amount,
            payoutReference: transferId
        });

        // 2. Update withdrawal request to Processing (Waiting for Webhook callback from Cashfree)
        withdrawal.status = 'processing';
        withdrawal.reviewedBy = req.user._id;
        withdrawal.reviewedAt = new Date();
        withdrawal.adminNote = adminNote || '';
        withdrawal.transactionRef = transferId;
        await withdrawal.save();

        res.json({
            success: true,
            message: `Withdrawal of ₹${withdrawal.amount} sent to Payout Gateway. Status is Processing.`,
            withdrawal
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// PUT /api/partner/admin/withdrawals/:id/reject — Admin rejects a withdrawal
router.put('/admin/withdrawals/:id/reject', protect, admin, async (req, res) => {
    try {
        const { rejectionReason } = req.body;

        const withdrawal = await WithdrawalRequest.findById(req.params.id);
        if (!withdrawal) return res.status(404).json({ error: 'Withdrawal request not found' });
        if (withdrawal.status !== 'pending') return res.status(400).json({ error: `Cannot reject — current status is "${withdrawal.status}"` });

        withdrawal.status = 'rejected';
        withdrawal.reviewedBy = req.user._id;
        withdrawal.reviewedAt = new Date();
        withdrawal.rejectionReason = rejectionReason || 'No reason provided';
        await withdrawal.save();

        res.json({
            success: true,
            message: 'Withdrawal request rejected',
            withdrawal
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ══════════════════════════════════════════════════
// POST /api/partner/shipments/:id/assign-driver
// Link Driver to Shipment
// ══════════════════════════════════════════════════
router.post('/shipments/:id/assign-driver', protect, async (req, res) => {
    try {
        if (req.user.role !== 'shipment_partner' && req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Partner access only' });
        }

        const { driverId } = req.body;

        // Find driver
        const { default: WmsDriver } = await import('../models/WmsDriver.js');
        const driver = await WmsDriver.findOne({ _id: driverId });

        if (!driver) {
            return res.status(404).json({ error: 'Driver not found' });
        }

        const shipment = await Shipment.findOne({
            _id: req.params.id,
            carrierId: req.user._id // Ensure partner owns this shipment
        });

        if (!shipment) return res.status(404).json({ error: 'Shipment not found or unauthorized' });

        // Update shipment
        shipment.assignedPartner = req.user._id;
        shipment.assignedDriver = driver._id;
        shipment.assignedDriverId = driver.driverId;
        shipment.assignedDriverName = driver.name;
        shipment.assignedVehicle = driver.vehicleNumber || 'N/A';
        shipment.assigned_driver_id = driver.driverId;
        shipment.assigned_driver_name = driver.name;
        shipment.assigned_driver_phone = driver.phone;
        shipment.driver_assigned_at = new Date();
        shipment.status = 'driver_assigned';

        shipment.trackingHistory.push({
            status: 'driver_assigned',
            location: shipment.pickup?.city || 'Partner Facility',
            description: `Driver ${driver.name} assigned for pickup`,
            timestamp: new Date()
        });

        await shipment.save();

        res.json({
            success: true,
            message: 'Driver assigned successfully',
            shipment
        });
    } catch (error) {
        console.error('Assign driver error:', error);
        res.status(500).json({ error: error.message });
    }
});

// ══════════════════════════════════════════════════════════════
// POST /api/partner/payouts/webhook
// Cashfree Payout Webhook Receiver (Phase 11: Verification)
// ══════════════════════════════════════════════════════════════
router.post('/payouts/webhook', async (req, res) => {
    try {
        // Secure it with Cashfree Payout Webhook Verification here using `x-webhook-signature`
        const payload = req.body;
        const eventType = payload.event;
        const transferId = payload.data?.transferId;

        if (!transferId) return res.status(200).send('OK');

        const withdrawal = await WithdrawalRequest.findOne({ transactionRef: transferId });
        if (!withdrawal || withdrawal.status !== 'processing') {
            return res.status(200).send('OK');
        }

        if (eventType === 'TRANSFER_SUCCESS') {
            const currentBalance = await PartnerLedger.findOne({ partnerId: withdrawal.partnerId }).sort({ createdAt: -1 });

            withdrawal.status = 'completed';
            withdrawal.paidAt = new Date();
            withdrawal.balanceAfterPayout = currentBalance ? currentBalance.balanceAfter : 0;
            await withdrawal.save();
        } 
        else if (eventType === 'TRANSFER_FAILED' || eventType === 'TRANSFER_REVERSED') {
            // Restore funds to ledger
            const currentBalance = await PartnerLedger.findOne({ partnerId: withdrawal.partnerId }).sort({ createdAt: -1 });
            const before = currentBalance ? currentBalance.balanceAfter : 0;

            await PartnerLedger.create({
                partnerId: withdrawal.partnerId,
                type: 'bonus', // or 'payout_failure_reversal' if added to enum
                amount: withdrawal.amount,
                description: `Payout Failed/Reversed. Funds returned to balance. Ref: ${transferId}`,
                balanceBefore: before,
                balanceAfter: before + withdrawal.amount
            });

            withdrawal.status = 'failed';
            withdrawal.adminNote = (withdrawal.adminNote || '') + ` | Payout failed: ${payload.data?.reason || 'Unknown error'}`;
            await withdrawal.save();
        }

        res.status(200).send('OK');
    } catch (error) {
        console.error('Payout Webhook Error:', error);
        res.status(500).send('Internal Error');
    }
});

export default router;
