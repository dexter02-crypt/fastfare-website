import Carrier from '../models/Carrier.js';
import WebhookLog from '../models/WebhookLog.js';

/**
 * Fire a webhook to a carrier's registered endpoint.
 * Retries up to 3 times with exponential backoff.
 */
export async function fireWebhook(carrierId, event, payload) {
    const carrier = await Carrier.findById(carrierId);
    if (!carrier || !carrier.webhookUrl) {
        console.log(`[Webhook] No webhook URL for carrier ${carrierId}, skipping`);
        return null;
    }

    const log = await WebhookLog.create({
        carrierId,
        shipmentId: payload.shipmentId || payload._id,
        event,
        webhookUrl: carrier.webhookUrl,
        payload,
        deliveryStatus: 'pending',
        attempts: 0,
        maxAttempts: 3
    });

    return attemptWebhook(log);
}

/**
 * Attempt to deliver a webhook, with retry logic
 */
async function attemptWebhook(log) {
    const backoffMs = [1000, 4000, 16000]; // exponential backoff

    for (let attempt = 0; attempt < log.maxAttempts; attempt++) {
        log.attempts = attempt + 1;
        log.lastAttemptAt = new Date();

        try {
            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), 10000); // 10s timeout

            const response = await fetch(log.webhookUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-FastFare-Event': log.event,
                    'X-FastFare-Delivery': log._id.toString()
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
