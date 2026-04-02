import express from 'express';
import crypto from 'crypto';
import mongoose from 'mongoose';
import rateLimit from 'express-rate-limit';
import { protect, admin } from '../middleware/auth.js';
import User from '../models/User.js';
import WalletRechargeOrder from '../models/WalletRechargeOrder.js';
import Transaction from '../models/Transaction.js';
import PaymentWebhookLog from '../models/PaymentWebhookLog.js';

const router = express.Router();

const getCashfreeBaseUrl = () => {
    return process.env.CASHFREE_ENV === 'production' 
        ? 'https://api.cashfree.com/pg' 
        : 'https://sandbox.cashfree.com/pg';
};

// Global rate limiter: 100 requests per minute
const globalRechargeLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 100,
    message: { message: 'Too many recharge attempts globally. Please try again later.' }
});

// User-specific rate limiter: 5 requests per minute
const userRechargeLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 5,
    keyGenerator: (req) => req.user._id.toString(),
    message: { message: 'Too many recharge attempts. Please wait a moment before trying again.' }
});

router.post('/recharge/initiate', protect, globalRechargeLimiter, userRechargeLimiter, async (req, res) => {
    try {
        if (!process.env.CASHFREE_APP_ID || !process.env.CASHFREE_SECRET_KEY) {
            console.error('CASHFREE_APP_ID or CASHFREE_SECRET_KEY is not configured');
            return res.status(500).json({ message: 'Payment gateway is not configured. Please contact support.' });
        }

        const { amount } = req.body;
        const value = parseFloat(amount);

        if (isNaN(value) || value < 500 || value > 100000) {
            return res.status(400).json({ message: 'Minimum recharge amount is ₹500.' });
        }

        const user = await User.findById(req.user._id);
        if (!user) return res.status(404).json({ message: 'User not found' });

        const timestamp = Math.floor(Date.now() / 1000);
        const random6 = crypto.randomBytes(3).toString('hex').toUpperCase();
        const order_id = `FF-RCHG-${timestamp}-${random6}`.substring(0, 50); // Ensure max 50 chars
        
        // Base domain fallback for local webhook/redirect URLs
        const domain = req.headers.host || 'fastfare.in';

        const requestBody = {
             order_id: order_id,
             order_amount: value,
             order_currency: "INR",
             customer_details: {
               customer_id: user._id.toString(),
               customer_name: user.name || user.businessName || 'FastFare User',
               customer_email: user.email || 'guest@fastfare.in',
               customer_phone: user.phone || '9999999999'
             },
             order_meta: {
               return_url: `https://${domain}/billing/recharge/status?order_id=${order_id}`,
               notify_url: `https://${domain}/api/wallet/recharge/webhook`
             },
             order_note: "FastFare Wallet Recharge"
        };
        
        // Ensure valid phone for cashfree (Must be 10 digits exactly, otherwise placeholder)
        const pPhone = requestBody.customer_details.customer_phone.replace(/[^0-9]/g, '');
        if (pPhone.length !== 10) {
            requestBody.customer_details.customer_phone = '9999999999';
        } else {
            requestBody.customer_details.customer_phone = pPhone;
        }

        console.log(`[Wallet] Initiating Cashfree order ${order_id} for User ${user._id} — Amount: ₹${value}`);

        const cashfreeResponse = await fetch(`${getCashfreeBaseUrl()}/orders`, {
            method: 'POST',
            headers: {
                'x-api-version': '2023-08-01',
                'x-client-id': process.env.CASHFREE_APP_ID,
                'x-client-secret': process.env.CASHFREE_SECRET_KEY,
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify(requestBody)
        });

        const cashfreeData = await cashfreeResponse.json();
        console.log('[Wallet] Cashfree Initiate Raw Response:', JSON.stringify(cashfreeData, null, 2));

        if (!cashfreeResponse.ok) {
            console.error('[Wallet] Cashfree Initiate Error:', cashfreeData);
            return res.status(500).json({ message: 'Payment initiation failed. Please try again.', details: cashfreeData.message });
        }
        
        if (!cashfreeData || !cashfreeData.payment_session_id) {
            console.error('[Wallet] Error: Cashfree did not return a valid payment session ID.', cashfreeData);
            return res.status(500).json({ message: 'Cashfree did not return a valid payment session ID. Check server logs.' });
        }

        // Save order to DB
        const rechargeOrder = new WalletRechargeOrder({
            order_id,
            cashfree_order_id: cashfreeData.cf_order_id,
            cashfree_payment_session_id: cashfreeData.payment_session_id,
            user_id: user._id,
            amount: value,
            currency: 'INR',
            status: 'initiated',
            wallet_credited: false,
            ip_address: req.ip || req.connection.remoteAddress
        });

        await rechargeOrder.save();

        res.json({
            payment_session_id: cashfreeData.payment_session_id,
            order_id: order_id,
            amount: value,
            cashfree_env: process.env.CASHFREE_ENV === 'production' ? 'production' : 'sandbox'
        });

    } catch (error) {
        console.error('[Wallet] Initiate Recharge Exception:', error);
        res.status(500).json({ message: 'Server error during payment initiation.' });
    }
});

// ==========================================
// WEBHOOK (Notification via Cashfree Server)
// ==========================================

const webhookLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 200,
    message: 'Too many webhook attempts from this IP'
});

router.post('/recharge/webhook', webhookLimiter, async (req, res) => {
    const webhookLog = new PaymentWebhookLog({
        event_type: 'payment_webhook',
        raw_headers: {
            signature: req.headers['x-webhook-signature'] ? '[PRESENT]' : '[MISSING]',
            timestamp: req.headers['x-webhook-timestamp']
        },
        raw_payload: req.body,
        source_ip: req.ip
    });

    try {
        const signature = req.headers['x-webhook-signature'];
        const timestamp = req.headers['x-webhook-timestamp'];

        if (!signature || !timestamp) {
            console.warn('[Wallet] CF Webhook missing signature/timestamp from IP:', req.ip);
            return res.status(400).send('Missing signature headers');
        }

        // Replay attack prevention: reject if older than 5 minutes (300 seconds)
        const currentTimestamp = Math.floor(Date.now() / 1000);
        if (currentTimestamp - parseInt(timestamp, 10) > 300) {
            console.warn('[Wallet] CF Webhook timestamp expired:', timestamp);
            return res.status(400).send('Timestamp expired');
        }

        // Verify Signature
        const rawBody = req.rawBody || JSON.stringify(req.body); // Use populated rawBody from server.js
        const signaturePayload = `${timestamp}${rawBody}`;
        const computedSignature = crypto
            .createHmac('sha256', process.env.CASHFREE_SECRET_KEY)
            .update(signaturePayload)
            .digest('base64');

        if (computedSignature !== signature) {
            console.warn('[Wallet] CF Webhook Invalid Signature from IP:', req.ip);
            webhookLog.signature_valid = false;
            webhookLog.processing_status = 'failed';
            webhookLog.error_reason = 'invalid_signature';
            webhookLog.processed_at = new Date();
            await webhookLog.save().catch(e => console.error('[WebhookLog] Save error:', e));
            return res.status(400).send('Invalid signature');
        }

        webhookLog.signature_valid = true;

        // Payload is genuine. Parse Data.
        const payload = req.body;
        const cfOrder = payload.data?.order;
        const cfPayment = payload.data?.payment;

        if (!cfOrder || !cfPayment) {
            return res.status(200).send('OK'); // Always 200 to CF, even if payload is irrelevant
        }

        const internalOrderId = cfOrder.order_id;
        const orderStatus = cfOrder.order_status;
        const paymentStatus = cfPayment.payment_status;
        const paymentAmount = cfPayment.payment_amount;
        const paymentMethodObj = cfPayment.payment_method;
        
        let paymentMethodStr = 'Unknown';
        if (paymentMethodObj) {
            paymentMethodStr = Object.keys(paymentMethodObj)[0] || 'Unknown';
        }

        // Find Recharge Order
        const rechargeOrder = await WalletRechargeOrder.findOne({ order_id: internalOrderId });
        if (!rechargeOrder) {
            console.error(`[Wallet] CF Webhook order_id not found in DB: ${internalOrderId}`);
            return res.status(200).send('OK');
        }

        if (paymentStatus === 'SUCCESS' && orderStatus === 'PAID') {
            // Idempotency: skip if already credited
            if (rechargeOrder.wallet_credited) {
                console.log(`[Wallet Webhook | WARNING] Duplicate success webhook for already credited order: ${internalOrderId}`);
                return res.status(200).send('OK'); 
            }

            // Amount verification to combat tampering
            if (paymentAmount !== rechargeOrder.amount) {
                console.error(`[Wallet | CRITICAL] Amount mismatch for ${internalOrderId}. Expected ${rechargeOrder.amount}, Got ${paymentAmount}`);
                rechargeOrder.status = 'amount_mismatch';
                rechargeOrder.updated_at = new Date();
                await rechargeOrder.save();
                return res.status(200).send('OK');
            }

            // Perform Atomic Wallet Credit
            const session = await mongoose.startSession();
            session.startTransaction();
            try {
                // Re-fetch using session to lock it (optimistic)
                const lockedOrder = await WalletRechargeOrder.findOne({ _id: rechargeOrder._id, wallet_credited: false }).session(session);
                if (!lockedOrder) {
                    await session.abortTransaction();
                    session.endSession();
                    return res.status(200).send('OK'); // Another process handled it
                }

                const user = await User.findById(rechargeOrder.user_id).session(session);
                const balanceBefore = user.walletBalance || 0;
                const balanceAfter = balanceBefore + rechargeOrder.amount;

                // 1. Update User Balance
                user.walletBalance = balanceAfter;
                await user.save({ session });

                // 2. Insert Ledger Record
                await Transaction.create([{
                    userId: user._id,
                    type: 'recharge',
                    amount: rechargeOrder.amount,
                    status: 'completed',
                    balanceBefore,
                    balanceAfter,
                    description: `Wallet Recharge via ${paymentMethodStr.toUpperCase()} (Order: ${internalOrderId})`
                }], { session });

                // 3. Mark Order as Credited successfully
                lockedOrder.status = 'paid';
                lockedOrder.wallet_credited = true;
                lockedOrder.wallet_credited_at = new Date();
                lockedOrder.cashfree_payment_id = cfPayment.cf_payment_id;
                lockedOrder.payment_method = paymentMethodStr;
                lockedOrder.updated_at = new Date();
                await lockedOrder.save({ session });

                await session.commitTransaction();
                session.endSession();

                console.log(`[Wallet] Successfully credited ₹${rechargeOrder.amount} for Order ${internalOrderId} via Webhook.`);

            } catch (err) {
                await session.abortTransaction();
                session.endSession();
                console.error('[Wallet] Webhook Transaction Error:', err);
            }
        
        } else if (['FAILED', 'CANCELLED', 'USER_DROPPED'].includes(paymentStatus)) {
            rechargeOrder.status = paymentStatus === 'FAILED' ? 'failed' : 'cancelled';
            rechargeOrder.failure_reason = cfPayment.payment_message || paymentStatus;
            rechargeOrder.updated_at = new Date();
            await rechargeOrder.save();
            console.log(`[Wallet] Order ${internalOrderId} updated to ${rechargeOrder.status}`);

        } else if (paymentStatus === 'PENDING') {
            rechargeOrder.status = 'pending';
            rechargeOrder.updated_at = new Date();
            await rechargeOrder.save();
        }

        // Log the webhook processing result
        webhookLog.order_id = internalOrderId;
        webhookLog.cf_payment_id = cfPayment.cf_payment_id;
        webhookLog.payment_status = paymentStatus;
        webhookLog.order_status = orderStatus;
        webhookLog.amount = paymentAmount;
        webhookLog.processing_status = 'processed';
        webhookLog.processed_at = new Date();
        await webhookLog.save().catch(e => console.error('[WebhookLog] Save error:', e));

        res.status(200).send('OK'); // Always return 200

    } catch (error) {
        console.error('[Wallet] Webhook Crash:', error);
        webhookLog.processing_status = 'failed';
        webhookLog.error_reason = error.message;
        webhookLog.processed_at = new Date();
        await webhookLog.save().catch(e => console.error('[WebhookLog] Save error:', e));
        res.status(200).send('OK'); // Do not let CF retry indefinitely
    }
});

// ==========================================
// STATUS VERIFICATION (User facing polling)
// ==========================================

const statusLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 20, 
    keyGenerator: (req) => req.user._id.toString(),
    message: { message: 'Too many status check requests' }
});

router.get('/recharge/status', protect, statusLimiter, async (req, res) => {
    try {
        const { order_id } = req.query;
        if (!order_id) return res.status(400).json({ message: 'Order ID is required' });

        const rechargeOrder = await WalletRechargeOrder.findOne({ order_id });
        if (!rechargeOrder) return res.status(404).json({ message: 'Order not found' });

        if (rechargeOrder.user_id.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Access denied' });
        }

        const user = await User.findById(req.user._id);

        // Call Cashfree API directly
        const cfRes = await fetch(`${getCashfreeBaseUrl()}/orders/${order_id}`, {
            method: 'GET',
            headers: {
                'x-api-version': '2023-08-01',
                'x-client-id': process.env.CASHFREE_APP_ID,
                'x-client-secret': process.env.CASHFREE_SECRET_KEY
            }
        });

        if (!cfRes.ok) {
            console.error('[Wallet] Cashfree Status Check Error:', await cfRes.text());
            return res.status(500).json({ status: 'network_error', message: 'Unable to verify payment externally' });
        }

        const cfDetails = await cfRes.json();
        const cfStatus = cfDetails.order_status;

        if (cfStatus === 'PAID') {
            // Already credited by Webhook
            if (rechargeOrder.wallet_credited) {
                return res.json({
                    status: 'paid',
                    wallet_credited: true,
                    amount: rechargeOrder.amount,
                    new_balance: user.walletBalance
                });
            }

            // Fallback: Credit here since Webhook was slow
            const session = await mongoose.startSession();
            session.startTransaction();
            try {
                const lockedOrder = await WalletRechargeOrder.findOne({ _id: rechargeOrder._id, wallet_credited: false }).session(session);
                if (lockedOrder) {
                    const balanceBefore = user.walletBalance || 0;
                    const balanceAfter = balanceBefore + rechargeOrder.amount;

                    user.walletBalance = balanceAfter;
                    await user.save({ session });

                    await Transaction.create([{
                        userId: user._id,
                        type: 'recharge',
                        amount: rechargeOrder.amount,
                        status: 'completed',
                        balanceBefore,
                        balanceAfter,
                        description: `Wallet Recharge via Fallback Verify (Order: ${order_id})`
                    }], { session });

                    lockedOrder.status = 'paid';
                    lockedOrder.wallet_credited = true;
                    lockedOrder.wallet_credited_at = new Date();
                    lockedOrder.updated_at = new Date();
                    await lockedOrder.save({ session });

                    await session.commitTransaction();
                    console.log(`[Wallet] Successfully credited ₹${rechargeOrder.amount} for Order ${order_id} via Fallback API Poll.`);
                } else {
                    await session.abortTransaction();
                }
                session.endSession();

                // Refetch updated user balance
                const updatedUser = await User.findById(req.user._id);
                return res.json({
                    status: 'paid',
                    wallet_credited: true,
                    amount: rechargeOrder.amount,
                    new_balance: updatedUser.walletBalance
                });

            } catch (err) {
                await session.abortTransaction();
                session.endSession();
                throw err;
            }

        } else if (cfStatus === 'ACTIVE') {
            return res.json({ status: 'pending' });
        } else {
            // EXPIRED or anything else
            if (rechargeOrder.status !== 'failed') {
                rechargeOrder.status = 'failed';
                rechargeOrder.failure_reason = 'Payment order expired or failed';
                await rechargeOrder.save();
            }
            return res.json({ status: 'failed', reason: 'expired' });
        }

    } catch (error) {
        console.error('[Wallet] Status Verify Exception:', error);
        res.status(500).json({ status: 'network_error', message: 'Server error during status check' });
    }
});

// ==========================================
// WALLET BALANCE & TRANSACTION HISTORY
// ==========================================

router.get('/balance', protect, async (req, res) => {
    try {
        const user = await User.findById(req.user._id).select('walletBalance');
        res.json({ success: true, balance: user?.walletBalance || 0 });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch balance' });
    }
});

router.get('/transactions', protect, async (req, res) => {
    try {
        const { page = 1, limit = 30, type } = req.query;
        const skip = (parseInt(page) - 1) * parseInt(limit);

        const query = { userId: req.user._id };
        if (type) query.type = type;

        const [transactions, total] = await Promise.all([
            Transaction.find(query)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(parseInt(limit))
                .populate('shipmentId', 'awb carrier'),
            Transaction.countDocuments(query)
        ]);

        res.json({
            success: true,
            transactions,
            pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / parseInt(limit)) }
        });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch transactions' });
    }
});

// ==========================================
// ADMIN RECONCILIATION
// ==========================================

router.post('/recharge/reconcile', protect, admin, async (req, res) => {
    try {
        const fifteenMinAgo = new Date(Date.now() - 15 * 60 * 1000);

        // Find stale orders
        const staleOrders = await WalletRechargeOrder.find({
            status: { $in: ['initiated', 'pending'] },
            created_at: { $lte: fifteenMinAgo },
            wallet_credited: false
        }).limit(50);

        const results = [];

        for (const order of staleOrders) {
            try {
                const cfRes = await fetch(`${getCashfreeBaseUrl()}/orders/${order.order_id}`, {
                    method: 'GET',
                    headers: {
                        'x-api-version': '2023-08-01',
                        'x-client-id': process.env.CASHFREE_APP_ID,
                        'x-client-secret': process.env.CASHFREE_SECRET_KEY
                    }
                });

                if (!cfRes.ok) {
                    results.push({ order_id: order.order_id, action: 'skip', reason: 'gateway_error' });
                    continue;
                }

                const cfDetails = await cfRes.json();
                const cfStatus = cfDetails.order_status;

                if (cfStatus === 'PAID' && !order.wallet_credited) {
                    // Auto-credit
                    const session = await mongoose.startSession();
                    session.startTransaction();
                    try {
                        const lockedOrder = await WalletRechargeOrder.findOne({
                            _id: order._id, wallet_credited: false
                        }).session(session);

                        if (lockedOrder) {
                            const user = await User.findById(order.user_id).session(session);
                            const balanceBefore = user.walletBalance || 0;
                            const balanceAfter = balanceBefore + order.amount;

                            user.walletBalance = balanceAfter;
                            await user.save({ session });

                            await Transaction.create([{
                                userId: user._id,
                                type: 'recharge',
                                amount: order.amount,
                                status: 'completed',
                                balanceBefore,
                                balanceAfter,
                                cashfreeOrderId: order.order_id,
                                description: `Wallet Recharge via Reconciliation (Order: ${order.order_id})`
                            }], { session });

                            lockedOrder.status = 'paid';
                            lockedOrder.wallet_credited = true;
                            lockedOrder.wallet_credited_at = new Date();
                            await lockedOrder.save({ session });

                            await session.commitTransaction();
                            results.push({ order_id: order.order_id, action: 'credited', amount: order.amount });
                        } else {
                            await session.abortTransaction();
                            results.push({ order_id: order.order_id, action: 'skip', reason: 'already_processed' });
                        }
                        session.endSession();
                    } catch (txErr) {
                        await session.abortTransaction();
                        session.endSession();
                        results.push({ order_id: order.order_id, action: 'error', reason: txErr.message });
                    }
                } else if (['EXPIRED', 'TERMINATED'].includes(cfStatus)) {
                    order.status = 'failed';
                    order.failure_reason = `Reconciled as ${cfStatus}`;
                    await order.save();
                    results.push({ order_id: order.order_id, action: 'failed', reason: cfStatus });
                } else {
                    results.push({ order_id: order.order_id, action: 'skip', reason: `status_is_${cfStatus}` });
                }
            } catch (innerErr) {
                results.push({ order_id: order.order_id, action: 'error', reason: innerErr.message });
            }
        }

        res.json({ success: true, reconciled: results.length, results });
    } catch (error) {
        console.error('[Wallet] Reconcile Error:', error);
        res.status(500).json({ error: 'Reconciliation failed' });
    }
});

export default router;
