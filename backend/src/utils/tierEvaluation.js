import User from '../models/User.js';
import Shipment from '../models/Shipment.js';
import TierEvaluationLog from '../models/TierEvaluationLog.js';
import SellerStats from '../models/SellerStats.js';

// ══════════════════════════════════════════════════
// Monthly Tier Evaluation Job
// Runs every 30 days — evaluates all sellers for tier upgrades/downgrades
// ══════════════════════════════════════════════════

let isEvaluating = false;

async function evaluateAllTiers() {
    if (isEvaluating) {
        console.log('🏆 [Tier Evaluation] Already running, skipping...');
        return { evaluated: 0, changed: 0, skipped: true };
    }

    isEvaluating = true;
    console.log('🏆 [Tier Evaluation] Starting monthly tier evaluation...');

    try {
        const monthStart = new Date();
        monthStart.setDate(monthStart.getDate() - 30);
        const monthEnd = new Date();

        const sellers = await User.find({ role: 'user' }).select('_id tier businessName');

        if (sellers.length === 0) {
            console.log('🏆 [Tier Evaluation] No sellers to evaluate.');
            isEvaluating = false;
            return { evaluated: 0, changed: 0 };
        }

        console.log(`🏆 [Tier Evaluation] Evaluating ${sellers.length} sellers...`);
        let changed = 0;

        for (const seller of sellers) {
            try {
                const [monthlyOrders, deliveredOrders, rtoOrders, cancelledOrders] = await Promise.all([
                    Shipment.countDocuments({ user: seller._id, createdAt: { $gte: monthStart } }),
                    Shipment.countDocuments({ user: seller._id, status: 'delivered', createdAt: { $gte: monthStart } }),
                    Shipment.countDocuments({ user: seller._id, status: 'returned', createdAt: { $gte: monthStart } }),
                    Shipment.countDocuments({ user: seller._id, status: 'cancelled', createdAt: { $gte: monthStart } })
                ]);

                const rtoPercent = monthlyOrders > 0
                    ? Math.round((rtoOrders / monthlyOrders) * 10000) / 100
                    : 0;

                const previousTier = seller.tier || 'bronze';
                let newTier = previousTier;
                let reason = 'No change — current thresholds maintained';

                // Upgrade logic
                if (monthlyOrders > 800 && rtoPercent <= 15) {
                    newTier = 'gold';
                    if (newTier !== previousTier) {
                        reason = `Auto-upgrade to Gold: ${monthlyOrders} monthly orders (>800), ${rtoPercent}% RTO (<=15%)`;
                    }
                } else if (monthlyOrders > 300 && rtoPercent <= 15) {
                    if (previousTier === 'bronze') {
                        newTier = 'silver';
                        reason = `Auto-upgrade to Silver: ${monthlyOrders} monthly orders (>300), ${rtoPercent}% RTO (<=15%)`;
                    }
                }

                // Downgrade logic
                if (previousTier === 'gold' && (monthlyOrders < 500 || rtoPercent > 15)) {
                    newTier = 'silver';
                    reason = `Auto-downgrade from Gold: ${monthlyOrders} orders ${monthlyOrders < 500 ? '(<500)' : ''} or ${rtoPercent}% RTO ${rtoPercent > 15 ? '(>15%)' : ''}`;
                } else if (previousTier === 'silver' && (monthlyOrders < 150 || rtoPercent > 20)) {
                    newTier = 'bronze';
                    reason = `Auto-downgrade from Silver: ${monthlyOrders} orders ${monthlyOrders < 150 ? '(<150)' : ''} or ${rtoPercent}% RTO ${rtoPercent > 20 ? '(>20%)' : ''}`;
                }

                // Log evaluation
                await TierEvaluationLog.create({
                    sellerId: seller._id,
                    evaluationDate: new Date(),
                    evaluationPeriod: { start: monthStart, end: monthEnd },
                    previousTier,
                    newTier,
                    monthlyOrders,
                    deliveredOrders,
                    rtoOrders,
                    rtoPercent,
                    cancelledOrders,
                    reason,
                    autoUpgrade: true
                });

                // Apply tier change
                if (newTier !== previousTier) {
                    await User.findByIdAndUpdate(seller._id, {
                        tier: newTier,
                        tierUpdatedAt: new Date()
                    });
                    await SellerStats.findOneAndUpdate(
                        { sellerId: seller._id },
                        { currentTier: newTier },
                        { upsert: true }
                    );
                    changed++;
                    console.log(`  🔄 ${seller.businessName}: ${previousTier} → ${newTier}`);
                }

                // Update monthly counters in stats
                await SellerStats.findOneAndUpdate(
                    { sellerId: seller._id },
                    {
                        monthlyOrders,
                        monthlyDelivered: deliveredOrders,
                        monthlyRto: rtoOrders,
                        monthlyResetDate: new Date(),
                        rtoPercent,
                        lastUpdated: new Date()
                    },
                    { upsert: true }
                );

            } catch (sellerError) {
                console.error(`  ❌ Error evaluating seller ${seller._id}:`, sellerError.message);
            }
        }

        console.log(`🏆 [Tier Evaluation] Complete: ${changed}/${sellers.length} sellers changed tiers`);
        isEvaluating = false;
        return { evaluated: sellers.length, changed };
    } catch (error) {
        console.error('🏆 [Tier Evaluation] Fatal error:', error);
        isEvaluating = false;
        return { evaluated: 0, changed: 0, error: error.message };
    }
}

// Run every 30 days (2592000000ms) — no startup execution
export function startTierEvaluationCron() {
    console.log('🏆 Tier evaluation cron registered — runs every 30 days');
    setInterval(() => evaluateAllTiers(), 30 * 24 * 60 * 60 * 1000);
}

export { evaluateAllTiers };
