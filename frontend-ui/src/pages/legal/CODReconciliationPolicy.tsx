import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const CODReconciliationPolicy = () => {
    return (
        <div className="min-h-screen bg-background">
            <Header />
            <main className="container py-12">
                <Card className="max-w-4xl mx-auto">
                    <CardHeader>
                        <CardTitle className="text-3xl font-bold text-center">COD Reconciliation & Refund Policy</CardTitle>
                        <p className="text-center text-muted-foreground mt-2">Effective Date: February 12, 2026</p>
                        <p className="text-center text-sm text-muted-foreground">Applicable to: All Sellers using Cash on Delivery on the FastFare Platform</p>
                    </CardHeader>
                    <CardContent className="prose dark:prose-invert max-w-none space-y-6">
                        <section>
                            <h3 className="text-xl font-semibold">1. Overview</h3>
                            <p>
                                This COD Reconciliation & Refund Policy governs the collection, reconciliation, and settlement of Cash on Delivery (COD) payments processed through the FastFare logistics aggregation platform. COD orders involve the delivery partner collecting the order value from the consignee at the time of delivery and remitting it to FastFare for reconciliation and settlement to the seller.
                            </p>
                        </section>

                        <section>
                            <h3 className="text-xl font-semibold">2. COD Flow Architecture</h3>
                            <p>The complete COD flow follows this lifecycle:</p>
                            <ol className="list-decimal pl-6 mt-2 space-y-2">
                                <li><strong>Order Creation:</strong> Seller creates a shipment with payment mode set to COD, declaring the COD amount to be collected from the consignee.</li>
                                <li><strong>Partner Assignment:</strong> A delivery partner is assigned to the order.</li>
                                <li><strong>Pickup & Transit:</strong> Partner picks up the parcel and it moves through transit.</li>
                                <li><strong>Delivery & Collection:</strong> Upon delivery (RTD confirmation), the partner collects the declared COD amount from the consignee.</li>
                                <li><strong>COD Remittance:</strong> The delivery partner remits collected COD to FastFare within the partner's remittance cycle.</li>
                                <li><strong>Reconciliation:</strong> FastFare reconciles the collected amount against the declared COD value.</li>
                                <li><strong>Settlement to Seller:</strong> After successful reconciliation and completion of the tier-based settlement cycle, the seller's earnings are released.</li>
                            </ol>
                        </section>

                        <section>
                            <h3 className="text-xl font-semibold">3. COD Settlement Computation</h3>
                            <p>For COD orders, the seller settlement amount is calculated as:</p>
                            <div className="bg-muted p-4 rounded-lg mt-2 font-mono text-sm">
                                SettlementAmount = TotalCODCollected − ShippingCharges − PlatformFee − CODHandlingFee
                            </div>
                            <p className="mt-2">Where:</p>
                            <ul className="list-disc pl-6 mt-2 space-y-1">
                                <li><strong>TotalCODCollected:</strong> The actual amount collected from the consignee by the delivery partner.</li>
                                <li><strong>ShippingCharges:</strong> Applicable shipping cost for the order based on weight, dimensions, and route.</li>
                                <li><strong>PlatformFee:</strong> FastFare's per-order service charge.</li>
                                <li><strong>CODHandlingFee:</strong> An additional fee for processing COD collection and reconciliation (percentage-based or flat rate as per the current fee schedule).</li>
                            </ul>
                        </section>

                        <section>
                            <h3 className="text-xl font-semibold">4. COD vs. Prepaid Deduction Logic</h3>
                            <div className="overflow-x-auto mt-2">
                                <table className="w-full border-collapse border border-border">
                                    <thead>
                                        <tr className="bg-muted">
                                            <th className="border border-border px-4 py-2 text-left">Parameter</th>
                                            <th className="border border-border px-4 py-2 text-center">COD Orders</th>
                                            <th className="border border-border px-4 py-2 text-center">Prepaid Orders</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr>
                                            <td className="border border-border px-4 py-2">Shipping Deduction</td>
                                            <td className="border border-border px-4 py-2 text-center">Deducted from COD collection at settlement</td>
                                            <td className="border border-border px-4 py-2 text-center">Deducted upfront from wallet at label creation</td>
                                        </tr>
                                        <tr>
                                            <td className="border border-border px-4 py-2">Platform Fee</td>
                                            <td className="border border-border px-4 py-2 text-center">Deducted at settlement</td>
                                            <td className="border border-border px-4 py-2 text-center">Deducted at settlement</td>
                                        </tr>
                                        <tr>
                                            <td className="border border-border px-4 py-2">COD Handling Fee</td>
                                            <td className="border border-border px-4 py-2 text-center">Applicable</td>
                                            <td className="border border-border px-4 py-2 text-center">Not applicable</td>
                                        </tr>
                                        <tr>
                                            <td className="border border-border px-4 py-2">Settlement Source</td>
                                            <td className="border border-border px-4 py-2 text-center">COD collected from consignee</td>
                                            <td className="border border-border px-4 py-2 text-center">Seller's existing revenue/order value</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </section>

                        <section>
                            <h3 className="text-xl font-semibold">5. Reconciliation Process</h3>
                            <p>FastFare performs COD reconciliation through the following process:</p>
                            <ul className="list-disc pl-6 mt-2 space-y-2">
                                <li><strong>Daily COD Collection Report:</strong> Delivery partners are required to report all COD collections daily. FastFare generates automated reconciliation reports matching collected amounts against declared COD values.</li>
                                <li><strong>Discrepancy Detection:</strong> If the collected amount differs from the declared amount, the order is flagged for manual review.
                                    <ul className="list-disc pl-6 mt-1 space-y-1">
                                        <li>Short collection: If the partner collects less than declared, the difference is either recovered from the partner or flagged to the seller for resolution.</li>
                                        <li>Over collection: If the partner collects more than declared, the excess is held pending investigation.</li>
                                    </ul>
                                </li>
                                <li><strong>Partner Remittance Window:</strong> Partners must remit all COD collections within their designated remittance cycle (typically 24–48 hours from delivery). Delayed remittance is tracked and may impact partner performance ratings.</li>
                                <li><strong>Reconciliation Completion:</strong> Once COD is received and reconciled, the settlement amount enters the seller's pending settlement pipeline.</li>
                            </ul>
                        </section>

                        <section>
                            <h3 className="text-xl font-semibold">6. COD Collection Records</h3>
                            <p>The CODCollections table maintains a record for every COD order, including:</p>
                            <ul className="list-disc pl-6 mt-2 space-y-1">
                                <li>Order ID and AWB number.</li>
                                <li>Declared COD amount.</li>
                                <li>Actual collected amount.</li>
                                <li>Collection date and time.</li>
                                <li>Partner ID who collected.</li>
                                <li>Remittance status (pending, remitted, reconciled).</li>
                                <li>Discrepancy flag and resolution status.</li>
                            </ul>
                        </section>

                        <section>
                            <h3 className="text-xl font-semibold">7. COD Limits</h3>
                            <p>FastFare may impose COD limits based on seller tier and account history:</p>
                            <ul className="list-disc pl-6 mt-2 space-y-1">
                                <li><strong>Bronze:</strong> Maximum COD value per order: ₹25,000. Daily COD cap: ₹2,00,000.</li>
                                <li><strong>Silver:</strong> Maximum COD value per order: ₹50,000. Daily COD cap: ₹5,00,000.</li>
                                <li><strong>Gold:</strong> Maximum COD value per order: ₹1,00,000. Daily COD cap: ₹15,00,000.</li>
                            </ul>
                            <p>COD limits may be adjusted based on seller performance, account history, and risk assessment. Custom limits may be set for enterprise accounts.</p>
                        </section>

                        <section>
                            <h3 className="text-xl font-semibold">8. COD Refunds</h3>
                            <p>Refunds for COD orders follow these rules:</p>
                            <ul className="list-disc pl-6 mt-2 space-y-1">
                                <li>If a COD order is successfully delivered but later returned (post-delivery return), the COD amount already in the settlement pipeline is reversed from the seller's ledger.</li>
                                <li>Refunds to consignees for COD orders are the responsibility of the seller. FastFare does not process direct refunds to consignees.</li>
                                <li>If COD was collected but the order is subsequently marked as RTO (before the consignee accepted), the collected amount is returned to the consignee through the delivery partner, and no settlement is processed.</li>
                            </ul>
                        </section>

                        <section>
                            <h3 className="text-xl font-semibold">9. Fraud Prevention in COD</h3>
                            <p>FastFare actively monitors for COD-related fraud, including:</p>
                            <ul className="list-disc pl-6 mt-2 space-y-1">
                                <li>Artificially inflated COD values for money laundering or financial manipulation.</li>
                                <li>Fake deliveries marked as delivered to trigger COD settlement.</li>
                                <li>Collusion between sellers and partners to falsify delivery and collection.</li>
                                <li>Repetitive high-value COD orders from the same consignee with high RTO rates.</li>
                            </ul>
                            <p>Detected fraud will result in immediate settlement hold, account investigation, and potential termination and legal action as per the Anti-Fraud & Compliance Policy.</p>
                        </section>

                        <section>
                            <h3 className="text-xl font-semibold">10. Discrepancy Resolution</h3>
                            <p>Sellers can report COD discrepancies through the Support Center. Resolution timelines:</p>
                            <ul className="list-disc pl-6 mt-2 space-y-1">
                                <li><strong>Acknowledgement:</strong> Within 24 hours of reporting.</li>
                                <li><strong>Investigation:</strong> Completed within 5–7 business days.</li>
                                <li><strong>Resolution:</strong> Corrective credits or debits applied within 3 business days of investigation completion.</li>
                            </ul>
                        </section>

                        <section>
                            <h3 className="text-xl font-semibold">11. Contact</h3>
                            <p>For COD reconciliation queries, contact:</p>
                            <address className="mt-2 not-italic">
                                <strong>Finance & Reconciliation Team</strong><br />
                                FastFare Logistics Pvt. Ltd.<br />
                                Email: cod@fastfare.in<br />
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

export default CODReconciliationPolicy;
