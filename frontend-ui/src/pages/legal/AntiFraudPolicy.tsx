import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const AntiFraudPolicy = () => {
    return (
        <div className="min-h-screen bg-background">
            <Header />
            <main className="container py-12">
                <Card className="max-w-4xl mx-auto">
                    <CardHeader>
                        <CardTitle className="text-3xl font-bold text-center">Anti-Fraud & Compliance Policy</CardTitle>
                        <p className="text-center text-muted-foreground mt-2">Effective Date: February 12, 2026</p>
                        <p className="text-center text-sm text-muted-foreground">Applicable to: All Platform Users — Sellers, Partners, and Administrators</p>
                    </CardHeader>
                    <CardContent className="prose dark:prose-invert max-w-none space-y-6">
                        <section>
                            <h3 className="text-xl font-semibold">1. Overview</h3>
                            <p>FastFare maintains a zero-tolerance policy toward fraudulent activity. This Anti-Fraud & Compliance Policy defines the types of fraud monitored, detection mechanisms, investigation procedures, and enforcement actions applicable to all platform participants—sellers, delivery partners, and internal staff.</p>
                        </section>

                        <section>
                            <h3 className="text-xl font-semibold">2. Types of Fraud Monitored</h3>
                            <h4 className="text-lg font-medium mt-4">2.1 Seller Fraud</h4>
                            <ul className="list-disc pl-6 mt-2 space-y-1">
                                <li>Shipping empty or incorrect parcels to generate fraudulent settlement claims.</li>
                                <li>Inflating declared order values for COD manipulation.</li>
                                <li>Creating fake orders to manipulate tier upgrade metrics.</li>
                                <li>Identity fraud: registering with forged or stolen documents.</li>
                                <li>Collusion with delivery partners to falsify delivery confirmations.</li>
                                <li>Duplicate account creation to circumvent restrictions.</li>
                            </ul>

                            <h4 className="text-lg font-medium mt-4">2.2 Partner Fraud</h4>
                            <ul className="list-disc pl-6 mt-2 space-y-1">
                                <li>COD misappropriation: collecting cash and not remitting to FastFare.</li>
                                <li>Falsifying delivery status or POD to trigger settlement.</li>
                                <li>GPS spoofing to fake delivery location.</li>
                                <li>Parcel theft or contents tampering.</li>
                                <li>Collusion with sellers or consignees.</li>
                                <li>Operating with expired or fraudulent KYC documents.</li>
                            </ul>

                            <h4 className="text-lg font-medium mt-4">2.3 Internal Fraud</h4>
                            <ul className="list-disc pl-6 mt-2 space-y-1">
                                <li>Unauthorized settlement adjustments or manual overrides without justification.</li>
                                <li>Leaking confidential seller or partner data.</li>
                                <li>Creating fictitious accounts or orders.</li>
                            </ul>
                        </section>

                        <section>
                            <h3 className="text-xl font-semibold">3. Detection Mechanisms</h3>
                            <ul className="list-disc pl-6 mt-2 space-y-1">
                                <li><strong>Automated Rules Engine:</strong> Real-time monitoring of order patterns, settlement anomalies, COD discrepancies, and unusual account behavior.</li>
                                <li><strong>Weight Audit System:</strong> Automatic flagging of shipments with significant weight discrepancies (declared vs. actual).</li>
                                <li><strong>GPS Verification:</strong> Cross-referencing delivery location coordinates with declared delivery addresses.</li>
                                <li><strong>POD Verification:</strong> Automated and manual review of Proof of Delivery for anomalies.</li>
                                <li><strong>Ledger Reconciliation:</strong> Daily automated reconciliation of COD collections, settlements, and payouts against expected values.</li>
                                <li><strong>Behavioral Analysis:</strong> Machine learning models to detect suspicious patterns in order creation, delivery behavior, and financial flows.</li>
                                <li><strong>Manual Audits:</strong> Periodic sampling and review by the compliance team.</li>
                            </ul>
                        </section>

                        <section>
                            <h3 className="text-xl font-semibold">4. Investigation Process</h3>
                            <ol className="list-decimal pl-6 mt-2 space-y-1">
                                <li><strong>Flag:</strong> Suspicious activity detected by automated system or manual report.</li>
                                <li><strong>Hold:</strong> Immediate settlement/payout hold on the flagged account.</li>
                                <li><strong>Investigation:</strong> Compliance team reviews evidence, interviews involved parties, analyzes ledger records.</li>
                                <li><strong>Decision:</strong> Determination of whether fraud occurred, with documented findings.</li>
                                <li><strong>Action:</strong> Enforcement of appropriate penalties (see Section 5).</li>
                                <li><strong>Reporting:</strong> Severe cases reported to law enforcement.</li>
                            </ol>
                            <p className="mt-2">Investigation timeline: 5–15 business days depending on complexity.</p>
                        </section>

                        <section>
                            <h3 className="text-xl font-semibold">5. Enforcement Actions</h3>
                            <div className="overflow-x-auto mt-2">
                                <table className="w-full border-collapse border border-border">
                                    <thead>
                                        <tr className="bg-muted">
                                            <th className="border border-border px-4 py-2 text-left">Severity</th>
                                            <th className="border border-border px-4 py-2 text-left">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr>
                                            <td className="border border-border px-4 py-2 font-medium">Suspected</td>
                                            <td className="border border-border px-4 py-2">Settlement/payout hold pending investigation</td>
                                        </tr>
                                        <tr>
                                            <td className="border border-border px-4 py-2 font-medium">Confirmed – Minor</td>
                                            <td className="border border-border px-4 py-2">Warning, tier downgrade, temporary suspension, recovery of losses</td>
                                        </tr>
                                        <tr>
                                            <td className="border border-border px-4 py-2 font-medium">Confirmed – Major</td>
                                            <td className="border border-border px-4 py-2">Permanent termination, forfeiture of pending settlements, full loss recovery</td>
                                        </tr>
                                        <tr>
                                            <td className="border border-border px-4 py-2 font-medium">Criminal</td>
                                            <td className="border border-border px-4 py-2">Termination + FIR/police report + civil legal action for recovery</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </section>

                        <section>
                            <h3 className="text-xl font-semibold">6. Admin Override Controls</h3>
                            <p>The Admin Panel includes safeguards for manual operations:</p>
                            <ul className="list-disc pl-6 mt-2 space-y-1">
                                <li>All manual settlement adjustments require justification and are logged in the AdminOverrides table.</li>
                                <li>Tier overrides are logged with reason, authorizing admin, and date.</li>
                                <li>Payout holds require documented cause and are reviewed within 48 hours.</li>
                                <li>Sensitive operations require two-factor admin authentication.</li>
                                <li>Admin actions are subject to periodic audit by the compliance team.</li>
                            </ul>
                        </section>

                        <section>
                            <h3 className="text-xl font-semibold">7. Whistleblower Protection</h3>
                            <p>FastFare encourages reporting of suspected fraud. Reporters are protected by:</p>
                            <ul className="list-disc pl-6 mt-2 space-y-1">
                                <li>Confidential reporting channels (email: compliance@fastfare.in).</li>
                                <li>Protection against retaliation for good-faith reports.</li>
                                <li>Anonymous reporting option available.</li>
                            </ul>
                        </section>

                        <section>
                            <h3 className="text-xl font-semibold">8. Regulatory Compliance</h3>
                            <p>FastFare complies with:</p>
                            <ul className="list-disc pl-6 mt-2 space-y-1">
                                <li>Information Technology Act, 2000 and IT Rules.</li>
                                <li>Prevention of Money Laundering Act (PMLA), 2002 — where applicable.</li>
                                <li>Digital Personal Data Protection Act (DPDP), 2023.</li>
                                <li>Indian Penal Code provisions for fraud, theft, and forgery.</li>
                                <li>GST and Income Tax compliance requirements.</li>
                            </ul>
                        </section>

                        <section>
                            <h3 className="text-xl font-semibold">9. Contact</h3>
                            <address className="mt-2 not-italic">
                                <strong>Compliance & Legal Team</strong><br />
                                FastFare Logistics Pvt. Ltd.<br />
                                Email: compliance@fastfare.in<br />
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

export default AntiFraudPolicy;
