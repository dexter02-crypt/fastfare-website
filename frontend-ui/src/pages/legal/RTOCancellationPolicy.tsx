import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const RTOCancellationPolicy = () => {
    return (
        <div className="min-h-screen bg-background">
            <Header />
            <main className="container py-12">
                <Card className="max-w-4xl mx-auto">
                    <CardHeader>
                        <CardTitle className="text-3xl font-bold text-center">RTO & Cancellation Policy</CardTitle>
                        <p className="text-center text-muted-foreground mt-2">Effective Date: February 12, 2026</p>
                        <p className="text-center text-sm text-muted-foreground">Applicable to: All Sellers on the FastFare Platform</p>
                    </CardHeader>
                    <CardContent className="prose dark:prose-invert max-w-none space-y-6">
                        <section>
                            <h3 className="text-xl font-semibold">1. Overview</h3>
                            <p>This policy governs Return to Origin (RTO) procedures, reverse logistics charges, order cancellation rules, and the impact of RTOs on seller tier evaluation within the FastFare B2B logistics platform. RTO orders do <strong>not</strong> enter the settlement payout queue.</p>
                        </section>

                        <section>
                            <h3 className="text-xl font-semibold">2. What is RTO (Return to Origin)?</h3>
                            <p>An order is marked as RTO when delivery to the consignee cannot be completed and the parcel is returned to the seller's origin address. RTO may be triggered by:</p>
                            <ul className="list-disc pl-6 mt-2 space-y-1">
                                <li>Consignee unavailable after maximum delivery attempts (3 attempts).</li>
                                <li>Consignee refuses to accept the parcel.</li>
                                <li>Incorrect or incomplete delivery address.</li>
                                <li>Consignee requests cancellation at doorstep.</li>
                                <li>COD amount disputed by consignee at delivery.</li>
                                <li>Parcel unclaimed at delivery hub beyond holding period (typically 5 days).</li>
                                <li>Restricted area or access denied at delivery location.</li>
                            </ul>
                        </section>

                        <section>
                            <h3 className="text-xl font-semibold">3. RTO Process Flow</h3>
                            <ol className="list-decimal pl-6 mt-2 space-y-1">
                                <li>Delivery attempts exhausted or consignee refuses delivery.</li>
                                <li>Delivery partner updates order status to "RTO Initiated."</li>
                                <li>Seller is notified via dashboard and email.</li>
                                <li>Parcel enters reverse logistics for return to seller's origin address.</li>
                                <li>Upon receipt by seller, status updates to "RTO Delivered."</li>
                                <li>Applicable RTO charges are deducted from seller's ledger.</li>
                            </ol>
                        </section>

                        <section>
                            <h3 className="text-xl font-semibold">4. RTO Charges</h3>
                            <p>When an order results in RTO, the following charges apply and are configurable by FastFare:</p>
                            <ul className="list-disc pl-6 mt-2 space-y-1">
                                <li><strong>Forward Shipping Charges:</strong> The original shipping cost for the forward journey (pickup to delivery attempt) is non-refundable.</li>
                                <li><strong>Reverse Shipping Charges:</strong> Additional charges for the return journey (delivery hub/location back to seller's origin). Typically calculated at the same rate as forward shipping or a discounted reverse rate.</li>
                                <li><strong>Platform Fee:</strong> A reduced platform fee may apply for RTO orders (configurable, typically 50% of the standard platform fee).</li>
                                <li><strong>COD Handling Fee:</strong> If the order was COD and collection was attempted, a partial COD handling fee may apply.</li>
                            </ul>
                            <p>Total RTO deduction from seller ledger:</p>
                            <div className="bg-muted p-4 rounded-lg mt-2 font-mono text-sm">
                                RTOCost = ForwardShipping + ReverseShipping + ReducedPlatformFee
                            </div>
                        </section>

                        <section>
                            <h3 className="text-xl font-semibold">5. Settlement Impact of RTO</h3>
                            <ul className="list-disc pl-6 mt-2 space-y-1">
                                <li>RTO orders do <strong>not</strong> enter the settlement payout queue.</li>
                                <li>No seller earnings are generated for RTO orders.</li>
                                <li>RTO charges are deducted from the seller's wallet balance or adjusted against pending settlements.</li>
                                <li>If the wallet balance is insufficient, the deduction is carried forward to the next settlement cycle.</li>
                                <li>For COD orders marked as RTO before collection, no COD reconciliation occurs.</li>
                            </ul>
                        </section>

                        <section>
                            <h3 className="text-xl font-semibold">6. Impact on Tier Evaluation</h3>
                            <p>RTO rates significantly impact tier evaluation:</p>
                            <ul className="list-disc pl-6 mt-2 space-y-1">
                                <li>RTO percentage is calculated as: <code>RTO% = (RTO Orders / Total Orders) × 100</code>.</li>
                                <li><strong>Upgrade blocked:</strong> RTO% &gt; 15% blocks Bronze → Silver upgrade.</li>
                                <li><strong>Upgrade blocked:</strong> RTO% &gt; 10% blocks Silver → Gold upgrade.</li>
                                <li><strong>Downgrade trigger:</strong> RTO% &gt; 20% for 2 consecutive months triggers Silver → Bronze downgrade.</li>
                                <li><strong>Downgrade trigger:</strong> RTO% &gt; 12% for 2 consecutive months triggers Gold → Silver downgrade.</li>
                                <li>Sellers with consistently high RTO rates may receive compliance warnings and coaching recommendations.</li>
                            </ul>
                        </section>

                        <section>
                            <h3 className="text-xl font-semibold">7. Reducing RTO Rates</h3>
                            <p>FastFare recommends the following to reduce RTO rates:</p>
                            <ul className="list-disc pl-6 mt-2 space-y-1">
                                <li>Verify consignee contact information and address before shipping.</li>
                                <li>Send order confirmation and tracking details to consignees proactively.</li>
                                <li>Offer prepaid payment options to reduce COD-related RTOs.</li>
                                <li>Use address verification tools available on the dashboard.</li>
                                <li>Respond promptly to delivery partner queries about addresses.</li>
                            </ul>
                        </section>

                        <section>
                            <h3 className="text-xl font-semibold">8. Order Cancellation Policy</h3>
                            <h4 className="text-lg font-medium mt-4">8.1 Seller-Initiated Cancellation</h4>
                            <ul className="list-disc pl-6 mt-2 space-y-1">
                                <li><strong>Before Assignment:</strong> Free cancellation. No charges apply.</li>
                                <li><strong>After Assignment, Before Pickup:</strong> Nominal cancellation fee of ₹25 or as per current schedule.</li>
                                <li><strong>After Pickup:</strong> Cannot be cancelled. Must go through RTO process with applicable charges.</li>
                            </ul>

                            <h4 className="text-lg font-medium mt-4">8.2 System-Initiated Cancellation</h4>
                            <ul className="list-disc pl-6 mt-2 space-y-1">
                                <li>Orders may be auto-cancelled if pickup is not completed within 48 hours of scheduled pickup time.</li>
                                <li>Orders with invalid addresses detected during validation may be cancelled.</li>
                                <li>Orders flagged for prohibited items may be cancelled by the system.</li>
                            </ul>

                            <h4 className="text-lg font-medium mt-4">8.3 Cancellation Refunds</h4>
                            <ul className="list-disc pl-6 mt-2 space-y-1">
                                <li>For prepaid orders, shipping charges deducted at label creation are refunded to seller's wallet (minus cancellation fee if applicable).</li>
                                <li>Refunds are processed within 2–3 business days.</li>
                                <li>Cancelled orders do not affect tier evaluation metrics.</li>
                            </ul>
                        </section>

                        <section>
                            <h3 className="text-xl font-semibold">9. RTO Dispute Resolution</h3>
                            <p>Sellers may dispute RTO classification if they believe an order was incorrectly marked as RTO:</p>
                            <ul className="list-disc pl-6 mt-2 space-y-1">
                                <li>Disputes must be raised within 7 days of RTO status update.</li>
                                <li>Evidence required: consignee communication confirming willingness to accept delivery, correct address proof.</li>
                                <li>Investigation completed within 5 business days.</li>
                                <li>If dispute is upheld, RTO charges are reversed and re-delivery may be attempted.</li>
                            </ul>
                        </section>

                        <section>
                            <h3 className="text-xl font-semibold">10. Contact</h3>
                            <address className="mt-2 not-italic">
                                <strong>Operations & Returns Team</strong><br />
                                FastFare Logistics Pvt. Ltd.<br />
                                Email: returns@fastfare.in<br />
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

export default RTOCancellationPolicy;
