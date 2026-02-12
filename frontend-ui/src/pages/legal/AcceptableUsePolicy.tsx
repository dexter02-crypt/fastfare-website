import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const AcceptableUsePolicy = () => {
    return (
        <div className="min-h-screen bg-background">
            <Header />
            <main className="container py-12">
                <Card className="max-w-4xl mx-auto">
                    <CardHeader>
                        <CardTitle className="text-3xl font-bold text-center">Acceptable Use Policy</CardTitle>
                        <p className="text-center text-muted-foreground mt-2">Effective Date: February 12, 2026</p>
                        <p className="text-center text-sm text-muted-foreground">Applicable to: All Users and Sellers of the FastFare Platform</p>
                    </CardHeader>
                    <CardContent className="prose dark:prose-invert max-w-none space-y-6">
                        <section>
                            <h3 className="text-xl font-semibold">1. Purpose</h3>
                            <p>
                                This Acceptable Use Policy ("AUP") defines the permitted and prohibited uses of the FastFare B2B logistics aggregation and settlement platform (the "Platform"). This policy is supplementary to the Terms of Service and applies to all registered Sellers, Users, and any person accessing or interacting with the Platform. Violation of this AUP may result in immediate account suspension, forfeiture of pending settlements, and legal action.
                            </p>
                        </section>

                        <section>
                            <h3 className="text-xl font-semibold">2. Permitted Use</h3>
                            <p>The Platform is made available exclusively for the following legitimate business purposes:</p>
                            <ul className="list-disc pl-6 mt-2 space-y-1">
                                <li>Creating and managing shipment orders for lawful goods and merchandise.</li>
                                <li>Tracking the status and delivery progress of shipments.</li>
                                <li>Managing financial settlements, wallet balances, and payout records.</li>
                                <li>Accessing the seller dashboard for performance analytics, settlement tracking, and order management.</li>
                                <li>Communicating with FastFare support for order-related queries, disputes, and account management.</li>
                                <li>Using APIs for authorized integrations with your e-commerce or ERP systems.</li>
                            </ul>
                        </section>

                        <section>
                            <h3 className="text-xl font-semibold">3. Prohibited Items for Shipment</h3>
                            <p>You may not use the Platform to ship any of the following prohibited items:</p>
                            <ul className="list-disc pl-6 mt-2 space-y-1">
                                <li>Narcotics, psychotropic substances, or any controlled drugs.</li>
                                <li>Firearms, ammunition, explosives, or weapons of any kind.</li>
                                <li>Hazardous materials, flammable substances, radioactive materials, or toxic chemicals.</li>
                                <li>Counterfeit goods, pirated software, or items infringing intellectual property rights.</li>
                                <li>Currency (cash, coins), bearer instruments, or negotiable instruments.</li>
                                <li>Human remains, organs, body parts, or biological samples.</li>
                                <li>Live animals (unless explicitly authorized in writing by FastFare).</li>
                                <li>Pornographic or obscene materials.</li>
                                <li>Goods prohibited under the Indian Customs Act, NDPS Act, Arms Act, Wildlife Protection Act, or any other applicable law.</li>
                                <li>Items requiring special licenses or permits that the Seller does not possess.</li>
                            </ul>
                            <p>FastFare reserves the right to inspect, refuse, or return any shipment suspected of containing prohibited items. Costs for such actions will be borne by the Seller.</p>
                        </section>

                        <section>
                            <h3 className="text-xl font-semibold">4. Prohibited Activities</h3>

                            <h4 className="text-lg font-medium mt-4">4.1 Fraudulent Activities</h4>
                            <ul className="list-disc pl-6 mt-2 space-y-1">
                                <li>Creating fake or fictitious orders to manipulate settlement amounts, tier upgrades, or performance metrics.</li>
                                <li>Inflating COD values beyond the actual order value.</li>
                                <li>Intentionally declaring incorrect weight, dimensions, or value of shipments to avoid correct billing.</li>
                                <li>Filing fraudulent claims for lost, damaged, or undelivered shipments.</li>
                                <li>Colluding with delivery partners to falsify delivery proofs or order statuses.</li>
                            </ul>

                            <h4 className="text-lg font-medium mt-4">4.2 Account Abuse</h4>
                            <ul className="list-disc pl-6 mt-2 space-y-1">
                                <li>Creating multiple accounts to exploit promotions, tier benefits, settlement cycles, or circumvent account restrictions.</li>
                                <li>Sharing account credentials with unauthorized individuals.</li>
                                <li>Using another Seller's account without proper authorization.</li>
                                <li>Registering accounts with false or misleading business information.</li>
                                <li>Manipulating tier evaluation metrics through artificial order inflation.</li>
                            </ul>

                            <h4 className="text-lg font-medium mt-4">4.3 Technical Abuse</h4>
                            <ul className="list-disc pl-6 mt-2 space-y-1">
                                <li>Using automated bots, scrapers, crawlers, or any automated tools to access the Platform without written authorization.</li>
                                <li>Attempting to reverse engineer, decompile, or disassemble any part of the Platform.</li>
                                <li>Exploiting vulnerabilities, bugs, or security flaws in the Platform.</li>
                                <li>Overloading the Platform with excessive API requests beyond published rate limits.</li>
                                <li>Attempting to bypass authentication, authorization, or security mechanisms.</li>
                                <li>Introducing viruses, malware, or other harmful code into the Platform.</li>
                            </ul>

                            <h4 className="text-lg font-medium mt-4">4.4 Communication Abuse</h4>
                            <ul className="list-disc pl-6 mt-2 space-y-1">
                                <li>Harassing, threatening, or abusing FastFare staff, delivery partners, or other users.</li>
                                <li>Sending spam or unsolicited communications through the Platform.</li>
                                <li>Impersonating FastFare or any FastFare representative.</li>
                                <li>Posting defamatory, misleading, or harmful content.</li>
                            </ul>
                        </section>

                        <section>
                            <h3 className="text-xl font-semibold">5. Weight and Dimension Accuracy</h3>
                            <p>
                                Sellers must declare accurate weight and dimensions for all shipments at the time of order creation. FastFare and its delivery partners may conduct weight audits at pickup or during transit. If a discrepancy is found between the declared weight/dimensions and the actual weight/dimensions:
                            </p>
                            <ul className="list-disc pl-6 mt-2 space-y-1">
                                <li>The shipment will be re-rated based on actual or volumetric weight (whichever is higher).</li>
                                <li>Additional charges will be deducted from the Seller's wallet or adjusted in the next settlement cycle.</li>
                                <li>Repeated discrepancies (3 or more instances within 30 days) may trigger a warning, account review, or temporary suspension.</li>
                            </ul>
                        </section>

                        <section>
                            <h3 className="text-xl font-semibold">6. COD Compliance</h3>
                            <p>
                                Sellers using Cash on Delivery (COD) must ensure that the declared COD amount accurately reflects the order value payable by the consignee. Artificially inflating or deflating COD values for the purpose of financial manipulation, money laundering, or circumventing tax obligations is strictly prohibited and may result in immediate account termination and reporting to relevant authorities.
                            </p>
                        </section>

                        <section>
                            <h3 className="text-xl font-semibold">7. Monitoring and Enforcement</h3>
                            <p>
                                FastFare actively monitors Platform usage through automated systems and manual reviews. We may, at our sole discretion:
                            </p>
                            <ul className="list-disc pl-6 mt-2 space-y-1">
                                <li>Conduct audits of seller accounts, order patterns, and financial transactions.</li>
                                <li>Flag suspicious activity for investigation.</li>
                                <li>Place holds on settlements when anomalies are detected.</li>
                                <li>Request additional documentation or verification from Sellers.</li>
                            </ul>
                        </section>

                        <section>
                            <h3 className="text-xl font-semibold">8. Consequences of Violation</h3>
                            <p>Violations of this Acceptable Use Policy may result in one or more of the following actions:</p>
                            <ul className="list-disc pl-6 mt-2 space-y-1">
                                <li><strong>Warning:</strong> Written notice of the violation with an opportunity to correct.</li>
                                <li><strong>Temporary Suspension:</strong> Suspension of account access for a defined period during investigation.</li>
                                <li><strong>Settlement Hold:</strong> Freezing of pending settlements until the matter is resolved.</li>
                                <li><strong>Tier Downgrade:</strong> Immediate downgrade to a lower tier level.</li>
                                <li><strong>Permanent Termination:</strong> Permanent closure of the seller account with forfeiture of any pending settlements tied to fraudulent activity.</li>
                                <li><strong>Legal Action:</strong> Initiation of civil or criminal proceedings as applicable under Indian law.</li>
                                <li><strong>Reporting:</strong> Reporting to relevant law enforcement or regulatory authorities.</li>
                            </ul>
                        </section>

                        <section>
                            <h3 className="text-xl font-semibold">9. Reporting Violations</h3>
                            <p>
                                If you become aware of any violation of this AUP by another user, partner, or any person, you are encouraged to report it immediately. Reports can be submitted through:
                            </p>
                            <ul className="list-disc pl-6 mt-2 space-y-1">
                                <li>Email: compliance@fastfare.in</li>
                                <li>Support Center within the Platform dashboard.</li>
                                <li>Phone: +91-XXXX-XXXXXX</li>
                            </ul>
                            <p>All reports will be treated confidentially and investigated promptly.</p>
                        </section>

                        <section>
                            <h3 className="text-xl font-semibold">10. Amendments</h3>
                            <p>
                                FastFare reserves the right to modify this Acceptable Use Policy at any time. Changes will be effective upon posting on the Platform. Continued use of the Platform after changes constitutes acceptance of the updated policy.
                            </p>
                        </section>

                        <section>
                            <h3 className="text-xl font-semibold">11. Contact</h3>
                            <p>For questions regarding this policy, contact:</p>
                            <address className="mt-2 not-italic">
                                <strong>Compliance Team</strong><br />
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

export default AcceptableUsePolicy;
