import SettlementSchedule from '../models/SettlementSchedule.js';
import SellerLedger from '../models/SellerLedger.js';
import SellerStats from '../models/SellerStats.js';
import Shipment from '../models/Shipment.js';

// ══════════════════════════════════════════════════
// Daily Settlement Processing Cron
// Runs every 24 hours — processes all due settlements
// ══════════════════════════════════════════════════

let isProcessing = false;

async function processSettlements() {
    if (isProcessing) {
        console.log('⏰ [Settlement Cron] Already processing, skipping...');
        return { processed: 0, skipped: true };
    }

    isProcessing = true;
    console.log('⏰ [Settlement Cron] Starting daily settlement processing...');

    try {
        const now = new Date();
        const dueSchedules = await SettlementSchedule.find({
            status: 'scheduled',
            settlementDate: { $lte: now }
        });

        if (dueSchedules.length === 0) {
            console.log('⏰ [Settlement Cron] No due settlements found.');
            isProcessing = false;
            return { processed: 0, results: [] };
        }

        console.log(`⏰ [Settlement Cron] Found ${dueSchedules.length} due settlement batches.`);
        const results = [];

        for (const schedule of dueSchedules) {
            schedule.status = 'processing';
            await schedule.save();

            try {
                let stats = await SellerStats.findOne({ sellerId: schedule.sellerId });
                if (!stats) {
                    stats = await SellerStats.create({
                        sellerId: schedule.sellerId,
                        currentTier: schedule.tier
                    });
                }

                // Create settlement ledger entry (pending → available)
                await SellerLedger.create({
                    sellerId: schedule.sellerId,
                    type: 'settlement',
                    amount: schedule.totalAmount,
                    description: `Auto-settlement: ${schedule.orderIds.length} orders (${schedule.tier} tier) — Batch ${schedule._id}`,
                    settlementId: schedule._id,
                    pendingBefore: stats.pendingSettlement,
                    pendingAfter: Math.max(0, stats.pendingSettlement - schedule.totalAmount),
                    availableBefore: stats.availableForWithdrawal,
                    availableAfter: stats.availableForWithdrawal + schedule.totalAmount
                });

                // Update seller stats
                stats.pendingSettlement = Math.max(0, stats.pendingSettlement - schedule.totalAmount);
                stats.availableForWithdrawal += schedule.totalAmount;
                stats.totalSettled += schedule.totalAmount;
                stats.lastUpdated = new Date();
                await stats.save();

                // Mark all orders in batch as settled
                await Shipment.updateMany(
                    { _id: { $in: schedule.orderIds } },
                    { $set: { settlementStatus: 'settled' } }
                );

                schedule.status = 'completed';
                schedule.processedAt = new Date();
                await schedule.save();

                console.log(`  ✅ Batch ${schedule._id}: ₹${schedule.totalAmount} settled for seller ${schedule.sellerId}`);
                results.push({ batchId: schedule._id, status: 'completed', amount: schedule.totalAmount });
            } catch (batchError) {
                console.error(`  ❌ Batch ${schedule._id} failed:`, batchError.message);
                schedule.status = 'failed';
                schedule.failureReason = batchError.message;
                await schedule.save();
                results.push({ batchId: schedule._id, status: 'failed', error: batchError.message });
            }
        }

        console.log(`⏰ [Settlement Cron] Completed: ${results.filter(r => r.status === 'completed').length}/${results.length} batches`);
        isProcessing = false;
        return { processed: results.length, results };
    } catch (error) {
        console.error('⏰ [Settlement Cron] Fatal error:', error);
        isProcessing = false;
        return { processed: 0, error: error.message };
    }
}

// Run every 24 hours (86400000ms) — no startup execution
export function startSettlementCron() {
    console.log('📅 Settlement cron registered — runs every 24 hours');
    setInterval(() => processSettlements(), 24 * 60 * 60 * 1000);
}

export { processSettlements };
