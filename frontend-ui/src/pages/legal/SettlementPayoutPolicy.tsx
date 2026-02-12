import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const SettlementPayoutPolicy = () => {
    return (
        <div className="min-h-screen bg-background">
            <Header />
            <main className="container py-12">
                <Card className="max-w-4xl mx-auto">
                    <CardHeader>
                        <CardTitle className="text-3xl font-bold text-center">Settlement & Payout Policy</CardTitle>
                        <p className="text-center text-muted-foreground mt-2">Effective Date: February 12, 2026</p>
                        <p className="text-center text-sm text-muted-foreground">Applicable to: All Sellers on the FastFare Platform</p>
                    </CardHeader>
                    <CardContent className="prose dark:prose-invert max-w-none space-y-6">
                        <section>
                            <h3 className="text-xl font-semibold">1. Overview</h3>
                            <p>
                                This Settlement & Payout Policy governs the financial settlement framework for all Sellers on the FastFare B2B logistics aggregation platform. FastFare operates a tier-based settlement system where funds are released to sellers based on their membership tier (Bronze, Silver, or Gold) after successful delivery confirmation. This policy ensures predictable payouts, transparent reconciliation, and auditable financial records.
                            </p>
                        </section>

                        <section>
                            <h3 className="text-xl font-semibold">2. Settlement Trigger Conditions</h3>
                            <p>Settlement is <strong>strictly triggered only</strong> when the following conditions are met:</p>
                            <ul className="list-disc pl-6 mt-2 space-y-1">
                                <li>The order status is updated to <strong>Delivered (RTD – Return to Destination)</strong>, confirming successful delivery to the consignee.</li>
                                <li>Proof of Delivery (POD) is recorded in the system (digital signature, OTP confirmation, or photo proof).</li>
                                <li>The order is not flagged for dispute, fraud, or investigation.</li>
                            </ul>
                            <p>
                                Settlement is <strong>never triggered</strong> at pickup stage, during transit, or for orders in pending/processing states. Only delivery-confirmed orders enter the settlement pipeline.
                            </p>
                        </section>

                        <section>
                            <h3 className="text-xl font-semibold">3. Settlement Cycle by Tier</h3>
                            <p>
                                The settlement date is computed programmatically using:
                            </p>
                            <div className="bg-muted p-4 rounded-lg mt-2 font-mono text-sm">
                                SettlementDate = DeliveryDate + TierSettlementDays
                            </div>
                            <div className="overflow-x-auto mt-4">
                                <table className="w-full border-collapse border border-border">
                                    <thead>
                                        <tr className="bg-muted">
                                            <th className="border border-border px-4 py-2 text-left">Tier</th>
                                            <th className="border border-border px-4 py-2 text-center">Settlement Days</th>
                                            <th className="border border-border px-4 py-2 text-center">Example (Delivered: March 1)</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr>
                                            <td className="border border-border px-4 py-2">Bronze</td>
                                            <td className="border border-border px-4 py-2 text-center">7 days</td>
                                            <td className="border border-border px-4 py-2 text-center">March 8</td>
                                        </tr>
                                        <tr>
                                            <td className="border border-border px-4 py-2">Silver</td>
                                            <td className="border border-border px-4 py-2 text-center">5 days</td>
                                            <td className="border border-border px-4 py-2 text-center">March 6</td>
                                        </tr>
                                        <tr>
                                            <td className="border border-border px-4 py-2">Gold</td>
                                            <td className="border border-border px-4 py-2 text-center">3 days</td>
                                            <td className="border border-border px-4 py-2 text-center">March 4</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </section>

                        <section>
                            <h3 className="text-xl font-semibold">4. Settlement Computation</h3>
                            <p>Seller earnings for each order are calculated as:</p>
                            <div className="bg-muted p-4 rounded-lg mt-2 font-mono text-sm">
                                SellerEarning = OrderValue − ShippingCharges − PlatformFee
                            </div>
                            <p className="mt-2">Where:</p>
                            <ul className="list-disc pl-6 mt-2 space-y-1">
                                <li><strong>OrderValue:</strong> The total value of the order as declared by the seller (for prepaid orders) or collected from the consignee (for COD orders).</li>
                                <li><strong>ShippingCharges:</strong> The carrier-specific shipping cost based on weight, dimensions, and origin-destination pair.</li>
                                <li><strong>PlatformFee:</strong> FastFare's per-order service fee as per the current fee schedule.</li>
                            </ul>
                            <p className="mt-2">
                                Additional deductions may apply for COD handling fees, insurance charges, or weight discrepancy adjustments.
                            </p>
                        </section>

                        <section>
                            <h3 className="text-xl font-semibold">5. Financial Ledger Architecture</h3>
                            <p>
                                FastFare maintains two distinct financial buckets per seller:
                            </p>
                            <ul className="list-disc pl-6 mt-2 space-y-2">
                                <li>
                                    <strong>Held/Pending Settlement:</strong> Funds from delivered orders that are within the tier-based settlement cycle. These funds are visible on the dashboard but not available for withdrawal.
                                </li>
                                <li>
                                    <strong>Available for Withdrawal:</strong> Funds that have completed the settlement cycle and are eligible for withdrawal to the seller's linked bank account.
                                </li>
                            </ul>
                            <p>
                                Funds move from "Pending" to "Available" automatically when the settlement timer completes. All transitions are recorded in an <strong>immutable settlement ledger table</strong> for full audit compliance.
                            </p>
                        </section>

                        <section>
                            <h3 className="text-xl font-semibold">6. Backend Ledger Tracking</h3>
                            <p>The seller ledger tracks the following metrics in real-time:</p>
                            <ul className="list-disc pl-6 mt-2 space-y-1">
                                <li>Total Orders (all time and custom period).</li>
                                <li>Delivered Orders count.</li>
                                <li>RTO Orders count and percentage.</li>
                                <li>Cancelled Orders count.</li>
                                <li>Pending Settlement Amount.</li>
                                <li>Settled Amount (lifetime and period-specific).</li>
                                <li>Next Settlement Date.</li>
                                <li>Current Tier Level.</li>
                                <li>Settlement History with order-level detail.</li>
                            </ul>
                        </section>

                        <section>
                            <h3 className="text-xl font-semibold">7. Payout Processing</h3>
                            <p>
                                Settlements that move to "Available for Withdrawal" are processed through the following workflow:
                            </p>
                            <ul className="list-disc pl-6 mt-2 space-y-1">
                                <li><strong>Automatic Payout:</strong> Sellers can enable automatic payout, where available funds are transferred to the linked bank account on a configurable schedule (daily, weekly, or on settlement date).</li>
                                <li><strong>Manual Withdrawal:</strong> Sellers can initiate manual withdrawals from the dashboard. Minimum withdrawal amount: ₹100.</li>
                                <li><strong>Processing Time:</strong> Bank transfers are typically processed within 1–2 business days after payout initiation.</li>
                                <li><strong>Payout Methods:</strong> NEFT, RTGS, IMPS, or UPI transfers to the verified bank account.</li>
                            </ul>
                        </section>

                        <section>
                            <h3 className="text-xl font-semibold">8. Payout Batching and Holiday Handling</h3>
                            <p>
                                FastFare may batch multiple settlement releases into a single payout for operational efficiency. Batching rules:
                            </p>
                            <ul className="list-disc pl-6 mt-2 space-y-1">
                                <li>Settlements maturing on the same day are consolidated into a single payout.</li>
                                <li>If a settlement date falls on a bank holiday or weekend, the payout will be processed on the next business day.</li>
                                <li>The settlement eligibility date remains the computed date; only the bank transfer may be delayed.</li>
                                <li>Public holiday schedules follow the Reserve Bank of India (RBI) declared holiday list.</li>
                            </ul>
                        </section>

                        <section>
                            <h3 className="text-xl font-semibold">9. Settlement Holds and Adjustments</h3>
                            <p>FastFare may place holds on pending or available settlements under the following circumstances:</p>
                            <ul className="list-disc pl-6 mt-2 space-y-1">
                                <li><strong>Fraud Investigation:</strong> When fraudulent activity is suspected or reported.</li>
                                <li><strong>Dispute Resolution:</strong> During active disputes between seller and buyer/consignee.</li>
                                <li><strong>Weight Discrepancy:</strong> When shipping charge adjustments are pending due to weight audit results.</li>
                                <li><strong>KYC Non-Compliance:</strong> If KYC documents expire or re-verification is required.</li>
                                <li><strong>Legal/Regulatory:</strong> Court orders, government directives, or regulatory holds.</li>
                                <li><strong>Account Termination:</strong> Upon account termination, settlements are held for 90 days to account for chargebacks and claims.</li>
                            </ul>
                            <p>Settlement adjustments (additions or deductions) by admin are recorded with full audit trails, including justification and authorizing admin ID.</p>
                        </section>

                        <section>
                            <h3 className="text-xl font-semibold">10. Prepaid Order Settlements</h3>
                            <p>For prepaid orders (where the buyer has paid in advance):</p>
                            <ul className="list-disc pl-6 mt-2 space-y-1">
                                <li>Shipping charges may be deducted upfront at label creation from the seller's wallet balance.</li>
                                <li>Upon successful delivery, the remaining order value (net of platform fee) enters the settlement pipeline.</li>
                                <li>If the order results in RTO, forward and reverse shipping charges are deducted as per the RTO & Cancellation Policy.</li>
                            </ul>
                        </section>

                        <section>
                            <h3 className="text-xl font-semibold">11. Settlement Disputes</h3>
                            <p>Sellers may raise settlement disputes through the Support Center within the dashboard. Dispute categories include:</p>
                            <ul className="list-disc pl-6 mt-2 space-y-1">
                                <li>Incorrect settlement calculation.</li>
                                <li>Missing orders from settlement batch.</li>
                                <li>Unauthorized deductions.</li>
                                <li>Payout not received after processing.</li>
                                <li>Discrepancy between dashboard balance and bank credit.</li>
                            </ul>
                            <p>
                                Disputes must be raised within 30 days of the settlement date. FastFare will investigate and respond within 7 business days. If the dispute is resolved in the seller's favor, corrective credits will be applied to the next settlement cycle.
                            </p>
                        </section>

                        <section>
                            <h3 className="text-xl font-semibold">12. Immutable Ledger and Audit Compliance</h3>
                            <p>
                                All settlement transactions are recorded in an append-only, immutable ledger table. No settlement record can be deleted or modified after creation. Corrections are made through adjustment entries with full audit trails. This ledger is available for regulatory audits, tax compliance, and legal proceedings.
                            </p>
                        </section>

                        <section>
                            <h3 className="text-xl font-semibold">13. Contact</h3>
                            <p>For settlement-related queries, contact:</p>
                            <address className="mt-2 not-italic">
                                <strong>Finance & Settlements Team</strong><br />
                                FastFare Logistics Pvt. Ltd.<br />
                                Email: settlements@fastfare.in<br />
                                Phone: +91-XXXX-XXXXXX
                            </address>
                        </section>
                    </CardContent>
                </Card>
            </main>
            <Footer />
        </div>
    );
};

export default SettlementPayoutPolicy;
