import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const PartnerAgreement = () => {
    return (
        <div className="min-h-screen bg-background">
            <Header />
            <main className="container py-12">
                <Card className="max-w-4xl mx-auto">
                    <CardHeader>
                        <CardTitle className="text-3xl font-bold text-center">Delivery Partner Agreement</CardTitle>
                        <p className="text-center text-muted-foreground mt-2">Effective Date: February 12, 2026</p>
                        <p className="text-center text-sm text-muted-foreground">Applicable to: All Delivery Partners on the FastFare Platform</p>
                    </CardHeader>
                    <CardContent className="prose dark:prose-invert max-w-none space-y-6">
                        <section>
                            <h3 className="text-xl font-semibold">1. Parties and Relationship</h3>
                            <p>This Delivery Partner Agreement ("Agreement") is entered into between FastFare Logistics Pvt. Ltd. ("FastFare," "we," "us") and the delivery service provider ("Partner," "you"). The Partner operates as an <strong>independent contractor</strong> and is not an employee, agent, or joint venture partner of FastFare. Nothing in this Agreement creates an employer-employee relationship.</p>
                        </section>

                        <section>
                            <h3 className="text-xl font-semibold">2. Scope of Services</h3>
                            <p>The Partner agrees to provide the following services through the FastFare Platform:</p>
                            <ul className="list-disc pl-6 mt-2 space-y-1">
                                <li>Pickup of parcels from designated seller/warehouse locations.</li>
                                <li>Secure transit of parcels to destination addresses.</li>
                                <li>Delivery of parcels to consignees within estimated timelines.</li>
                                <li>Collection of Cash on Delivery (COD) amounts where applicable.</li>
                                <li>Recording and uploading Proof of Delivery (POD) via the Partner Panel.</li>
                                <li>Processing Return to Origin (RTO) shipments when delivery fails.</li>
                                <li>Updating order statuses in real-time through the Partner Panel or scanning app.</li>
                            </ul>
                        </section>

                        <section>
                            <h3 className="text-xl font-semibold">3. Partner Panel Access</h3>
                            <p>FastFare provides a dedicated Partner Panel where partners can:</p>
                            <ul className="list-disc pl-6 mt-2 space-y-1">
                                <li>View assigned orders with pickup and delivery details.</li>
                                <li>Confirm pickup with timestamp and location.</li>
                                <li>Update in-transit status at checkpoints and hubs.</li>
                                <li>Mark delivery completion with POD upload.</li>
                                <li>Upload Proof of Delivery (digital signature, photo, OTP confirmation).</li>
                                <li>Track payout due amounts and settlement history.</li>
                                <li>View performance metrics and ratings.</li>
                                <li>Raise disputes and communicate with FastFare operations team.</li>
                            </ul>
                        </section>

                        <section>
                            <h3 className="text-xl font-semibold">4. Order Assignment</h3>
                            <ul className="list-disc pl-6 mt-2 space-y-1">
                                <li>Orders are assigned to partners based on serviceability, capacity, proximity, and performance ratings.</li>
                                <li>Partners may accept or decline assigned orders within the specified time window.</li>
                                <li>Repeated order declines may affect performance scores and future assignment priority.</li>
                                <li>Partners must not sub-contract or delegate assigned orders without written authorization.</li>
                            </ul>
                        </section>

                        <section>
                            <h3 className="text-xl font-semibold">5. Operational Obligations</h3>
                            <ul className="list-disc pl-6 mt-2 space-y-1">
                                <li>Handle all parcels with care to prevent damage, loss, or tampering.</li>
                                <li>Maintain a valid driving license and vehicle registration (if applicable).</li>
                                <li>Ensure vehicles meet safety and maintenance standards.</li>
                                <li>Carry valid identification while performing deliveries.</li>
                                <li>Comply with all traffic laws, regulations, and local ordinances.</li>
                                <li>Maintain professional and courteous conduct with sellers and consignees.</li>
                                <li>Complete deliveries within the estimated timelines provided by the Platform.</li>
                                <li>Attempt delivery a minimum of 3 times before initiating RTO.</li>
                                <li>Report any issues, incidents, or anomalies immediately to FastFare operations.</li>
                            </ul>
                        </section>

                        <section>
                            <h3 className="text-xl font-semibold">6. COD Collection and Remittance</h3>
                            <ul className="list-disc pl-6 mt-2 space-y-1">
                                <li>Partners must collect the exact declared COD amount from consignees at delivery.</li>
                                <li>COD collections must be remitted to FastFare within the designated remittance cycle (typically 24–48 hours).</li>
                                <li>Partners must not accept partial payments or negotiate COD amounts with consignees.</li>
                                <li>Misappropriation of COD funds is considered theft and will result in immediate termination and legal action.</li>
                                <li>Daily COD collection reports must be submitted through the Partner Panel.</li>
                            </ul>
                        </section>

                        <section>
                            <h3 className="text-xl font-semibold">7. Compensation and Payouts</h3>
                            <p>Partner compensation is calculated using configurable pricing formulas:</p>
                            <div className="bg-muted p-4 rounded-lg mt-2 font-mono text-sm">
                                PartnerPayout = (Distance × PartnerRate) + SlabAdd
                            </div>
                            <p className="mt-2">Where:</p>
                            <ul className="list-disc pl-6 mt-2 space-y-1">
                                <li><strong>Distance:</strong> Calculated distance from pickup to delivery point.</li>
                                <li><strong>PartnerRate:</strong> Per-km rate as per the partner's rate agreement.</li>
                                <li><strong>SlabAdd:</strong> Additional slab-based charges for weight tiers, special handling, etc.</li>
                            </ul>
                            <p className="mt-2">Partner payouts follow either a <strong>weekly fixed payout schedule</strong> or a <strong>volume-based release model</strong>. Partner settlements are <strong>completely separate</strong> from seller settlement and operate on an independent financial ledger.</p>
                        </section>

                        <section>
                            <h3 className="text-xl font-semibold">8. Financial Ledger Segregation</h3>
                            <p>FastFare maintains <strong>two entirely separate financial ledgers</strong>:</p>
                            <ul className="list-disc pl-6 mt-2 space-y-1">
                                <li><strong>Seller Ledger:</strong> Tracks seller earnings, COD collections, settlement cycles, and payouts.</li>
                                <li><strong>Partner Ledger:</strong> Tracks partner earnings, delivery compensation, deductions, and payouts.</li>
                            </ul>
                            <p>These ledgers are independent and have no cross-dependency. Seller settlement delays do not affect partner payouts, and vice versa.</p>
                        </section>

                        <section>
                            <h3 className="text-xl font-semibold">9. Insurance and Liability</h3>
                            <ul className="list-disc pl-6 mt-2 space-y-1">
                                <li>FastFare provides limited liability coverage for goods in transit under the carrier's care.</li>
                                <li>Partners are responsible for their own vehicle insurance, personal accident coverage, and third-party liability insurance.</li>
                                <li>Partners are liable for loss or damage to goods caused by negligence, mishandling, or breach of duty.</li>
                                <li>Deductions for lost or damaged goods may be made from partner payouts after investigation.</li>
                            </ul>
                        </section>

                        <section>
                            <h3 className="text-xl font-semibold">10. Confidentiality</h3>
                            <p>Partners must maintain strict confidentiality regarding:</p>
                            <ul className="list-disc pl-6 mt-2 space-y-1">
                                <li>Seller business information and order details.</li>
                                <li>Consignee personal information (name, address, phone number).</li>
                                <li>Platform operational data, terms, and pricing.</li>
                                <li>FastFare proprietary systems, APIs, and technology.</li>
                            </ul>
                            <p>Confidentiality obligations survive termination of this Agreement.</p>
                        </section>

                        <section>
                            <h3 className="text-xl font-semibold">11. Termination</h3>
                            <ul className="list-disc pl-6 mt-2 space-y-1">
                                <li>Either party may terminate with 30 days' written notice.</li>
                                <li>FastFare may terminate immediately for: fraudulent activity, COD misappropriation, criminal behavior, repeated violations, or consistently poor ratings.</li>
                                <li>Upon termination, pending payouts will be processed after deducting any outstanding dues, damages, or penalties.</li>
                                <li>Partner must return any FastFare-provided equipment or materials.</li>
                            </ul>
                        </section>

                        <section>
                            <h3 className="text-xl font-semibold">12. Governing Law</h3>
                            <p>This Agreement is governed by the laws of India. Disputes shall be resolved through arbitration under the Arbitration and Conciliation Act, 1996, with Mumbai, Maharashtra as the seat of arbitration.</p>
                        </section>

                        <section>
                            <h3 className="text-xl font-semibold">13. Contact</h3>
                            <address className="mt-2 not-italic">
                                <strong>Partner Operations Team</strong><br />
                                FastFare Logistics Pvt. Ltd.<br />
                                Email: partners@fastfare.in<br />
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

export default PartnerAgreement;
