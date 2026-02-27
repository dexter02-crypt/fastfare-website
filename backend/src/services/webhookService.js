import User from '../models/User.js';
import WebhookLog from '../models/WebhookLog.js';
import crypto from 'crypto';

/**
 * Build a structured, comprehensive shipment payload
 * containing all data a carrier partner needs.
 */
function buildShipmentPayload(shipment, partnerDetails) {
    const s = typeof shipment.toObject === 'function' ? shipment.toObject() : shipment;

    return {
        // 1. Shipment metadata
        shipmentId: s._id,
        awb: s.awb,
        orderNumber: s.awb,
        createdAt: s.createdAt,
        currentStatus: s.status,

        // 2. Sender / pickup details
        sender: {
            name: s.pickup?.name,
            phone: s.pickup?.phone,
            email: s.pickup?.email || '',
            address: s.pickup?.address,
            city: s.pickup?.city || '',
            state: s.pickup?.state || '',
            pincode: s.pickup?.pincode,
            landmark: s.pickup?.landmark || '',
            addressType: s.pickup?.addressType || 'office'
        },

        // 3. Receiver / delivery details
        receiver: {
            name: s.delivery?.name,
            phone: s.delivery?.phone,
            email: s.delivery?.email || '',
            address: s.delivery?.address,
            city: s.delivery?.city || '',
            state: s.delivery?.state || '',
            pincode: s.delivery?.pincode,
            landmark: s.delivery?.landmark || '',
            addressType: s.delivery?.addressType || 'office'
        },

        // 4. Package details
        packages: (s.packages || []).map(pkg => ({
            name: pkg.name || '',
            quantity: pkg.quantity || 1,
            weight: pkg.weight,
            length: pkg.length || 0,
            width: pkg.width || 0,
            height: pkg.height || 0,
            declaredValue: pkg.value || 0
        })),
        contentType: s.contentType,
        description: s.description || '',
        totalWeight: s.totalWeight || 0,
        totalValue: s.totalValue || 0,
        specialHandling: {
            fragile: s.fragileHandling || false,
            insurance: s.insurance || false,
            signatureRequired: s.signatureRequired || false
        },

        // 5. Pricing and payment
        pricing: {
            shippingCost: s.shippingCost || 0,
            codAmount: s.codAmount || 0,
            paymentMode: s.paymentMode || 'prepaid',
            platformFee: s.platformFee || 0
        },

        // 6. Service and routing
        service: {
            serviceType: s.serviceType || 'standard',
            estimatedDelivery: s.estimatedDelivery,
            scheduledPickup: s.scheduledPickup || false,
            pickupDate: s.pickupDate || null,
            pickupSlot: s.pickupSlot || ''
        },

        // 7. Tracking hooks
        tracking: {
            fastfareShipmentId: s._id,
            awb: s.awb,
            callbackUrl: partnerDetails?.callbackUrl || '',
            trackingHistory: s.trackingHistory || []
        }
    };
}

/**
 * Generate HMAC-SHA256 signature for payload verification.
 */
function generateSignature(payload, secret) {
    if (!secret) return '';
    return crypto.createHmac('sha256', secret)
        .update(JSON.stringify(payload))
        .digest('hex');
}

/**
 * Fire a webhook to a carrier's registered endpoint.
 * Retries up to 3 times with exponential backoff.
 */
export async function fireWebhook(carrierId, event, shipment) {
    const partner = await User.findById(carrierId);
    if (!partner || !partner.partnerDetails?.webhookUrl) {
        console.log(`[Webhook] No webhook URL for partner ${carrierId}, skipping`);
        return null;
    }

    // Build the enriched payload
    const payload = buildShipmentPayload(shipment, partner.partnerDetails);

    const log = await WebhookLog.create({
        carrierId,
        shipmentId: payload.shipmentId || shipment._id,
        event,
        webhookUrl: partner.partnerDetails.webhookUrl,
        payload,
        deliveryStatus: 'pending',
        attempts: 0,
        maxAttempts: 3
    });

    return attemptWebhook(log, partner.partnerDetails.apiKey);
}

/**
 * Attempt to deliver a webhook, with retry logic
 */
async function attemptWebhook(log, apiKey) {
    const backoffMs = [1000, 4000, 16000]; // exponential backoff

    for (let attempt = 0; attempt < log.maxAttempts; attempt++) {
        log.attempts = attempt + 1;
        log.lastAttemptAt = new Date();

        try {
            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), 10000); // 10s timeout

            const signature = generateSignature(log.payload, apiKey);

            const response = await fetch(log.webhookUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-FastFare-Event': log.event,
                    'X-FastFare-Delivery': log._id.toString(),
                    'X-FastFare-Signature': signature || ''
                },
                body: JSON.stringify(log.payload),
                signal: controller.signal
            });

            clearTimeout(timeout);

            const bodyText = await response.text().catch(() => '');

            log.response = {
                status: response.status,
                body: bodyText.slice(0, 500)
            };

            if (response.ok) {
                log.deliveryStatus = 'success';
                log.completedAt = new Date();
                await log.save();
                console.log(`[Webhook] ✓ ${log.event} delivered to carrier ${log.carrierId} (attempt ${attempt + 1})`);
                return log;
            }

            log.error = `HTTP ${response.status}: ${bodyText.slice(0, 200)}`;
        } catch (err) {
            log.error = err.message || 'Network error';
        }

        console.log(`[Webhook] ✗ ${log.event} attempt ${attempt + 1}/${log.maxAttempts} for carrier ${log.carrierId}: ${log.error}`);

        // Wait before retrying (except on last attempt)
        if (attempt < log.maxAttempts - 1) {
            await new Promise(resolve => setTimeout(resolve, backoffMs[attempt]));
        }
    }

    // All attempts failed
    log.deliveryStatus = 'failed';
    await log.save();
    console.error(`[Webhook] ✗✗ ${log.event} FAILED after ${log.maxAttempts} attempts for carrier ${log.carrierId}`);
    return log;
}

