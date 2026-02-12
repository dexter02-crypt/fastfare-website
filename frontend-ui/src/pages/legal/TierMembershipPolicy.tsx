import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const TierMembershipPolicy = () => {
    return (
        <div className="min-h-screen bg-background">
            <Header />
            <main className="container py-12">
                <Card className="max-w-4xl mx-auto">
                    <CardHeader>
                        <CardTitle className="text-3xl font-bold text-center">Tier Membership Policy</CardTitle>
                        <p className="text-center text-muted-foreground mt-2">Effective Date: February 12, 2026</p>
                        <p className="text-center text-sm text-muted-foreground">Bronze · Silver · Gold — Seller Membership Tiers</p>
                    </CardHeader>
                    <CardContent className="prose dark:prose-invert max-w-none space-y-6">
                        <section>
                            <h3 className="text-xl font-semibold">1. Overview</h3>
                            <p>
                                FastFare operates a structured, performance-based tier membership system consisting of three levels: <strong>Bronze</strong>, <strong>Silver</strong>, and <strong>Gold</strong>. Each tier is differentiated by settlement cycle speed, service priority, operational benefits, and analytics access. This policy governs tier assignment, upgrade criteria, downgrade rules, and the benefits associated with each membership level.
                            </p>
                            <p>
                                All Sellers receive a standardized professional dashboard interface regardless of their tier. Tier-based feature enhancements are layered on top of the standard dashboard and do not restrict access to core functionality. There is no concept of "basic dashboard access"—every seller gets the full professional dashboard experience.
                            </p>
                        </section>

                        <section>
                            <h3 className="text-xl font-semibold">2. Tier Definitions</h3>
                            <div className="overflow-x-auto">
                                <table className="w-full border-collapse border border-border mt-4">
                                    <thead>
                                        <tr className="bg-muted">
                                            <th className="border border-border px-4 py-2 text-left">Feature</th>
                                            <th className="border border-border px-4 py-2 text-center">🥉 Bronze</th>
                                            <th className="border border-border px-4 py-2 text-center">🥈 Silver</th>
                                            <th className="border border-border px-4 py-2 text-center">🥇 Gold</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr>
                                            <td className="border border-border px-4 py-2 font-medium">Settlement Cycle</td>
                                            <td className="border border-border px-4 py-2 text-center">7 days after delivery</td>
                                            <td className="border border-border px-4 py-2 text-center">5 days after delivery</td>
                                            <td className="border border-border px-4 py-2 text-center">3 days after delivery</td>
                                        </tr>
                                        <tr>
                                            <td className="border border-border px-4 py-2 font-medium">Monthly Order Threshold</td>
                                            <td className="border border-border px-4 py-2 text-center">Default (0–300)</td>
                                            <td className="border border-border px-4 py-2 text-center">&gt; 300 orders</td>
                                            <td className="border border-border px-4 py-2 text-center">&gt; 800 orders</td>
                                        </tr>
                                        <tr>
                                            <td className="border border-border px-4 py-2 font-medium">Service Priority</td>
                                            <td className="border border-border px-4 py-2 text-center">Standard</td>
                                            <td className="border border-border px-4 py-2 text-center">Priority</td>
                                            <td className="border border-border px-4 py-2 text-center">Premium Priority</td>
                                        </tr>
                                        <tr>
                                            <td className="border border-border px-4 py-2 font-medium">Pickup Priority</td>
                                            <td className="border border-border px-4 py-2 text-center">Standard queue</td>
                                            <td className="border border-border px-4 py-2 text-center">Priority pickup slots</td>
                                            <td className="border border-border px-4 py-2 text-center">Dedicated pickup windows</td>
                                        </tr>
                                        <tr>
                                            <td className="border border-border px-4 py-2 font-medium">Support Response</td>
                                            <td className="border border-border px-4 py-2 text-center">24-hour response</td>
                                            <td className="border border-border px-4 py-2 text-center">12-hour response</td>
                                            <td className="border border-border px-4 py-2 text-center">4-hour response + dedicated manager</td>
                                        </tr>
                                        <tr>
                                            <td className="border border-border px-4 py-2 font-medium">Analytics</td>
                                            <td className="border border-border px-4 py-2 text-center">Standard metrics</td>
                                            <td className="border border-border px-4 py-2 text-center">Enhanced analytics + trends</td>
                                            <td className="border border-border px-4 py-2 text-center">Deep analytics + forecasting</td>
                                        </tr>
                                        <tr>
                                            <td className="border border-border px-4 py-2 font-medium">Dashboard</td>
                                            <td className="border border-border px-4 py-2 text-center">Full professional dashboard</td>
                                            <td className="border border-border px-4 py-2 text-center">Full + enhanced insights</td>
                                            <td className="border border-border px-4 py-2 text-center">Full + deep insights + AI reports</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </section>

                        <section>
                            <h3 className="text-xl font-semibold">3. Settlement Cycle Computation</h3>
                            <p>
                                Settlement timing is computed programmatically using the formula:
                            </p>
                            <div className="bg-muted p-4 rounded-lg mt-2 font-mono text-sm">
                                SettlementDate = DeliveryDate + TierSettlementDays
                            </div>
                            <p className="mt-2">Where TierSettlementDays is:</p>
                            <ul className="list-disc pl-6 mt-2 space-y-1">
                                <li><strong>Bronze:</strong> 7 calendar days</li>
                                <li><strong>Silver:</strong> 5 calendar days</li>
                                <li><strong>Gold:</strong> 3 calendar days</li>
                            </ul>
                            <p className="mt-2">
                                <strong>Example:</strong> If an order is delivered on March 1st:
                            </p>
                            <ul className="list-disc pl-6 mt-2 space-y-1">
                                <li>Bronze seller settlement releases on March 8th.</li>
                                <li>Silver seller settlement releases on March 6th.</li>
                                <li>Gold seller settlement releases on March 4th.</li>
                            </ul>
                            <p className="mt-2">
                                Settlement is triggered <strong>only</strong> after the order status is confirmed as Delivered (RTD). Settlement timers never start at pickup stage. Weekends and public holidays may shift the payout processing date to the next business day, but the settlement eligibility date is calculated in calendar days.
                            </p>
                        </section>

                        <section>
                            <h3 className="text-xl font-semibold">4. Automatic Tier Upgrades</h3>
                            <p>
                                Tier upgrades are evaluated automatically through a scheduled monthly evaluation job that runs on the 1st of every month. The evaluation considers the seller's performance during the preceding calendar month.
                            </p>

                            <h4 className="text-lg font-medium mt-4">4.1 Upgrade Criteria</h4>
                            <ul className="list-disc pl-6 mt-2 space-y-2">
                                <li>
                                    <strong>Bronze → Silver:</strong>
                                    <ul className="list-disc pl-6 mt-1 space-y-1">
                                        <li>Monthly delivered orders &gt; 300.</li>
                                        <li>RTO percentage &lt; 15%.</li>
                                        <li>Account in good standing (no active warnings, suspensions, or disputes).</li>
                                    </ul>
                                </li>
                                <li>
                                    <strong>Silver → Gold:</strong>
                                    <ul className="list-disc pl-6 mt-1 space-y-1">
                                        <li>Monthly delivered orders &gt; 800.</li>
                                        <li>RTO percentage &lt; 10%.</li>
                                        <li>Account in good standing for at least 3 consecutive months.</li>
                                        <li>No pending disputes or compliance issues.</li>
                                    </ul>
                                </li>
                            </ul>

                            <h4 className="text-lg font-medium mt-4">4.2 Upgrade Process</h4>
                            <ul className="list-disc pl-6 mt-2 space-y-1">
                                <li>Tier upgrades take effect on the 1st of the month following the evaluation.</li>
                                <li>Sellers are notified via email and dashboard notification of their tier change.</li>
                                <li>Settlement cycles for new orders immediately reflect the upgraded tier.</li>
                                <li>Orders already in the settlement pipeline retain their original tier cycle.</li>
                            </ul>
                        </section>

                        <section>
                            <h3 className="text-xl font-semibold">5. Tier Downgrades</h3>
                            <p>
                                Tier downgrades may be applied if a seller's performance drops below minimum requirements:
                            </p>
                            <ul className="list-disc pl-6 mt-2 space-y-2">
                                <li>
                                    <strong>Gold → Silver:</strong>
                                    <ul className="list-disc pl-6 mt-1 space-y-1">
                                        <li>Monthly delivered orders drop below 500 for 2 consecutive months.</li>
                                        <li>RTO percentage exceeds 12% for 2 consecutive months.</li>
                                    </ul>
                                </li>
                                <li>
                                    <strong>Silver → Bronze:</strong>
                                    <ul className="list-disc pl-6 mt-1 space-y-1">
                                        <li>Monthly delivered orders drop below 150 for 2 consecutive months.</li>
                                        <li>RTO percentage exceeds 20% for 2 consecutive months.</li>
                                    </ul>
                                </li>
                                <li>
                                    <strong>Immediate Downgrade:</strong> FastFare may immediately downgrade a seller's tier (bypassing the 2-month evaluation) in cases of:
                                    <ul className="list-disc pl-6 mt-1 space-y-1">
                                        <li>Confirmed fraudulent activity.</li>
                                        <li>Violation of Acceptable Use Policy.</li>
                                        <li>Repeated compliance failures.</li>
                                    </ul>
                                </li>
                            </ul>
                        </section>

                        <section>
                            <h3 className="text-xl font-semibold">6. Dashboard Features by Tier</h3>
                            <p>
                                Every seller receives a standardized professional dashboard with the following core features:
                            </p>
                            <ul className="list-disc pl-6 mt-2 space-y-1">
                                <li>Total Orders (monthly and custom date range).</li>
                                <li>Delivered Orders count and percentage.</li>
                                <li>RTO percentage and trend.</li>
                                <li>Gross Revenue with breakdown.</li>
                                <li>Total Shipping Cost.</li>
                                <li>Total Platform Fees charged.</li>
                                <li>Total Settled Amount.</li>
                                <li>Pending Settlement Amount.</li>
                                <li>Next Settlement Date.</li>
                                <li>Current Tier Level display.</li>
                                <li>Performance indicators showing progress toward next tier.</li>
                            </ul>

                            <h4 className="text-lg font-medium mt-4">Enhanced Features (Silver and Above)</h4>
                            <ul className="list-disc pl-6 mt-2 space-y-1">
                                <li>Trend analysis with graphical representations over 3, 6, and 12-month periods.</li>
                                <li>Zone-level delivery performance breakdown.</li>
                                <li>Carrier performance comparison analytics.</li>
                                <li>Operational efficiency scoring.</li>
                            </ul>

                            <h4 className="text-lg font-medium mt-4">Premium Features (Gold Only)</h4>
                            <ul className="list-disc pl-6 mt-2 space-y-1">
                                <li>AI-powered demand forecasting and shipping volume predictions.</li>
                                <li>Custom report generation and scheduled report delivery.</li>
                                <li>Settlement forecasting with projected cash flow analysis.</li>
                                <li>Priority API rate limits for high-volume integrations.</li>
                                <li>Beta access to new Platform features.</li>
                            </ul>
                        </section>

                        <section>
                            <h3 className="text-xl font-semibold">7. Tier Evaluation Logging</h3>
                            <p>
                                All tier evaluations, upgrades, and downgrades are logged in the TierEvaluationLogs table for full audit compliance. Each log entry records:
                            </p>
                            <ul className="list-disc pl-6 mt-2 space-y-1">
                                <li>Seller ID and business name.</li>
                                <li>Previous tier and new tier.</li>
                                <li>Evaluation date and effective date.</li>
                                <li>Performance metrics at the time of evaluation (order count, RTO %, revenue).</li>
                                <li>Trigger type: automatic evaluation, admin override, or compliance action.</li>
                                <li>Reason/justification for the tier change.</li>
                            </ul>
                        </section>

                        <section>
                            <h3 className="text-xl font-semibold">8. Administrative Override</h3>
                            <p>
                                FastFare administrators retain the ability to manually override a seller's tier level in exceptional circumstances. Admin overrides are used for:
                            </p>
                            <ul className="list-disc pl-6 mt-2 space-y-1">
                                <li>Strategic partnerships or enterprise agreements with negotiated tier placement.</li>
                                <li>Corrective actions for system errors in tier evaluation.</li>
                                <li>Temporary tier freeze during dispute investigation.</li>
                                <li>Promotional tier upgrades for pilot programs or campaigns.</li>
                            </ul>
                            <p>All admin overrides are logged and require justification recorded in the system.</p>
                        </section>

                        <section>
                            <h3 className="text-xl font-semibold">9. Tier Subscription Monetization (Future)</h3>
                            <p>
                                FastFare may introduce optional paid tier subscriptions that allow sellers to access higher-tier benefits independently of performance thresholds. If introduced:
                            </p>
                            <ul className="list-disc pl-6 mt-2 space-y-1">
                                <li>Subscription pricing will be published separately and agreed upon before activation.</li>
                                <li>Paid tier access does not exempt sellers from compliance, AUP, or performance monitoring requirements.</li>
                                <li>Subscription-based tier access may be revoked for policy violations regardless of payment status.</li>
                            </ul>
                        </section>

                        <section>
                            <h3 className="text-xl font-semibold">10. Contact</h3>
                            <p>For questions about tier membership, contact:</p>
                            <address className="mt-2 not-italic">
                                <strong>Seller Success Team</strong><br />
                                FastFare Logistics Pvt. Ltd.<br />
                                Email: sellers@fastfare.in<br />
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

export default TierMembershipPolicy;
