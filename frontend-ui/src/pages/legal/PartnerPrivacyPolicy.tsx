import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const PartnerPrivacyPolicy = () => {
    return (
        <div className="min-h-screen bg-background">
            <Header />
            <main className="container py-12">
                <Card className="max-w-4xl mx-auto">
                    <CardHeader>
                        <CardTitle className="text-3xl font-bold text-center">Partner Privacy Policy</CardTitle>
                        <p className="text-center text-muted-foreground mt-2">Last Updated: February 12, 2026</p>
                        <p className="text-center text-sm text-muted-foreground">Applicable to: All Delivery Partners on the FastFare Platform</p>
                    </CardHeader>
                    <CardContent className="prose dark:prose-invert max-w-none space-y-6">
                        <section>
                            <h3 className="text-xl font-semibold">1. Introduction</h3>
                            <p>This Partner Privacy Policy explains how FastFare Logistics Pvt. Ltd. collects, uses, stores, and protects the personal information of delivery partners ("Partners") who provide logistics services through our platform. This policy supplements the general Privacy Policy with partner-specific data practices.</p>
                        </section>

                        <section>
                            <h3 className="text-xl font-semibold">2. Information We Collect from Partners</h3>
                            <h4 className="text-lg font-medium mt-4">2.1 Identity and Verification Data</h4>
                            <ul className="list-disc pl-6 mt-2 space-y-1">
                                <li>Full name, photo, date of birth, and gender.</li>
                                <li>Government-issued ID: Aadhaar, PAN card, driving license, voter ID, or passport.</li>
                                <li>Vehicle registration certificate and insurance documents.</li>
                                <li>Bank account details for payout processing.</li>
                                <li>Emergency contact information.</li>
                            </ul>

                            <h4 className="text-lg font-medium mt-4">2.2 Operational Data</h4>
                            <ul className="list-disc pl-6 mt-2 space-y-1">
                                <li>Order pickup and delivery records.</li>
                                <li>COD collection amounts and remittance records.</li>
                                <li>Proof of Delivery uploads (photos, signatures, OTP logs).</li>
                                <li>Performance metrics: delivery success rate, average delivery time, rating scores.</li>
                                <li>Communication logs with FastFare operations and sellers.</li>
                            </ul>

                            <h4 className="text-lg font-medium mt-4">2.3 Location and Device Data</h4>
                            <ul className="list-disc pl-6 mt-2 space-y-1">
                                <li><strong>Real-time GPS Location:</strong> Collected continuously during active delivery operations for live tracking, route optimization, and delivery verification.</li>
                                <li><strong>Trip Data:</strong> Routes taken, pickup points, delivery locations, timestamps, and distance traveled.</li>
                                <li><strong>Device Information:</strong> Device model, OS version, app version, IMEI (if permitted), and network information.</li>
                                <li><strong>Background Location:</strong> May be collected while the Partner app is in background mode during an active shift to maintain tracking accuracy.</li>
                            </ul>
                        </section>

                        <section>
                            <h3 className="text-xl font-semibold">3. How We Use Partner Data</h3>
                            <ul className="list-disc pl-6 mt-2 space-y-1">
                                <li><strong>Order Fulfillment:</strong> To assign orders, track pickup and delivery progress, and verify completion.</li>
                                <li><strong>Live Tracking:</strong> To share real-time location with sellers and consignees for shipment visibility.</li>
                                <li><strong>Payout Processing:</strong> To calculate and process partner compensation using the partner ledger.</li>
                                <li><strong>Performance Evaluation:</strong> To rate partner performance, determine assignment priority, and identify improvement areas.</li>
                                <li><strong>Safety and Security:</strong> To ensure safe delivery operations and investigate incidents.</li>
                                <li><strong>Route Optimization:</strong> To improve delivery routes, reduce transit time, and optimize operations.</li>
                                <li><strong>Compliance:</strong> To meet regulatory requirements for transportation and labor laws.</li>
                            </ul>
                        </section>

                        <section>
                            <h3 className="text-xl font-semibold">4. Data Sharing</h3>
                            <p>Partner data is shared with:</p>
                            <ul className="list-disc pl-6 mt-2 space-y-1">
                                <li><strong>Sellers:</strong> Partner name, contact number (masked), and real-time location during active delivery for tracking purposes.</li>
                                <li><strong>Consignees:</strong> Partner name and contact number (masked) for delivery coordination.</li>
                                <li><strong>Payment Partners:</strong> Bank details for payout processing.</li>
                                <li><strong>Insurance Providers:</strong> Relevant data for claims processing when applicable.</li>
                                <li><strong>Law Enforcement:</strong> As required by court orders, legal processes, or regulatory requests.</li>
                            </ul>
                            <p>We do not sell partner personal data to third parties.</p>
                        </section>

                        <section>
                            <h3 className="text-xl font-semibold">5. Location Data Practices</h3>
                            <ul className="list-disc pl-6 mt-2 space-y-1">
                                <li>Location tracking is active <strong>only during active shifts/delivery operations</strong>.</li>
                                <li>Partners can end their shift via the app, which stops location collection.</li>
                                <li>Location data is retained for 90 days for operational and dispute resolution purposes, then anonymized.</li>
                                <li>Anonymized and aggregated location data may be used for analytics and route optimization.</li>
                                <li>Partners will be clearly notified when location tracking is active via a persistent notification.</li>
                            </ul>
                        </section>

                        <section>
                            <h3 className="text-xl font-semibold">6. Data Retention</h3>
                            <ul className="list-disc pl-6 mt-2 space-y-1">
                                <li><strong>Identity Documents:</strong> Duration of partnership + 3 years after offboarding.</li>
                                <li><strong>Financial/Payout Records:</strong> 8 years as per tax regulations.</li>
                                <li><strong>Location Data:</strong> 90 days in identifiable form; anonymized thereafter.</li>
                                <li><strong>Performance Records:</strong> Duration of partnership + 1 year.</li>
                                <li><strong>POD Records:</strong> 6 months from delivery date.</li>
                                <li><strong>Communication Logs:</strong> 1 year from date of communication.</li>
                            </ul>
                        </section>

                        <section>
                            <h3 className="text-xl font-semibold">7. Partner Rights</h3>
                            <p>Under the DPDP Act 2023, partners have the right to:</p>
                            <ul className="list-disc pl-6 mt-2 space-y-1">
                                <li>Access a summary of personal data being processed.</li>
                                <li>Request correction of inaccurate or outdated information.</li>
                                <li>Request deletion of data (subject to legal retention requirements).</li>
                                <li>Withdraw consent for non-essential data processing.</li>
                                <li>File grievances with our Grievance Officer.</li>
                            </ul>
                            <p>Contact: privacy@fastfare.in to exercise any of these rights.</p>
                        </section>

                        <section>
                            <h3 className="text-xl font-semibold">8. Data Security</h3>
                            <p>We protect partner data through:</p>
                            <ul className="list-disc pl-6 mt-2 space-y-1">
                                <li>Encrypted storage (AES-256) and transmission (TLS 1.3).</li>
                                <li>Role-based access controls limiting data access to authorized personnel.</li>
                                <li>Regular security audits and penetration testing.</li>
                                <li>Secure API authentication for all Partner Panel interactions.</li>
                            </ul>
                        </section>

                        <section>
                            <h3 className="text-xl font-semibold">9. Contact</h3>
                            <address className="mt-2 not-italic">
                                <strong>Data Protection Officer</strong><br />
                                FastFare Logistics Pvt. Ltd.<br />
                                Email: privacy@fastfare.in<br />
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

export default PartnerPrivacyPolicy;
