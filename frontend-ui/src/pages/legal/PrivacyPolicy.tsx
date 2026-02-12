import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const PrivacyPolicy = () => {
    return (
        <div className="min-h-screen bg-background">
            <Header />
            <main className="container py-12">
                <Card className="max-w-4xl mx-auto">
                    <CardHeader>
                        <CardTitle className="text-3xl font-bold text-center">Privacy Policy</CardTitle>
                        <p className="text-center text-muted-foreground mt-2">Last Updated: February 12, 2026</p>
                        <p className="text-center text-sm text-muted-foreground">Applicable to: All Users, Sellers, and Partners of the FastFare Platform</p>
                    </CardHeader>
                    <CardContent className="prose dark:prose-invert max-w-none space-y-6">
                        <section>
                            <h3 className="text-xl font-semibold">1. Introduction</h3>
                            <p>
                                FastFare Logistics Pvt. Ltd. ("FastFare," "we," "us," or "our") is committed to protecting the privacy and security of your personal information. This Privacy Policy explains how we collect, use, disclose, store, and protect information obtained through our B2B logistics aggregation and settlement platform (the "Platform"), including our website, seller dashboard, partner panel, APIs, and mobile applications.
                            </p>
                            <p>
                                This policy is published in compliance with the Information Technology Act, 2000, the Information Technology (Reasonable Security Practices and Procedures and Sensitive Personal Data or Information) Rules, 2011, and the Digital Personal Data Protection Act, 2023 ("DPDP Act") of India.
                            </p>
                        </section>

                        <section>
                            <h3 className="text-xl font-semibold">2. Information We Collect</h3>
                            <p>We collect the following categories of information:</p>

                            <h4 className="text-lg font-medium mt-4">2.1 Personal Information (Provided by You)</h4>
                            <ul className="list-disc pl-6 mt-2 space-y-1">
                                <li>Full name, email address, phone number, and mailing address.</li>
                                <li>Business name, GSTIN, PAN, and trade license details.</li>
                                <li>Bank account details, UPI IDs, and payment instrument information.</li>
                                <li>KYC documents (identity proof, address proof, business registration certificates).</li>
                                <li>Login credentials (encrypted passwords, security questions).</li>
                                <li>Authorized signatory and contact person details.</li>
                            </ul>

                            <h4 className="text-lg font-medium mt-4">2.2 Transactional Data</h4>
                            <ul className="list-disc pl-6 mt-2 space-y-1">
                                <li>Order details: shipment information, consignee details, weight, dimensions, declared value, and payment mode.</li>
                                <li>Financial records: settlement amounts, COD collections, platform fees, shipping charges, wallet balances, and payout history.</li>
                                <li>Ledger data: pending settlements, available balances, and transaction logs.</li>
                                <li>Tier membership history and performance metrics.</li>
                            </ul>

                            <h4 className="text-lg font-medium mt-4">2.3 Automatically Collected Data</h4>
                            <ul className="list-disc pl-6 mt-2 space-y-1">
                                <li>Device information: IP address, browser type, operating system, device identifiers.</li>
                                <li>Usage data: pages visited, features used, session duration, clickstream data.</li>
                                <li>Cookies and tracking technologies (see Section 6).</li>
                                <li>Log data: access logs, error logs, API call records.</li>
                            </ul>

                            <h4 className="text-lg font-medium mt-4">2.4 Location Data (Partners)</h4>
                            <ul className="list-disc pl-6 mt-2 space-y-1">
                                <li>Real-time GPS location during active delivery operations.</li>
                                <li>Trip routes, pickup points, and delivery confirmation locations.</li>
                            </ul>
                        </section>

                        <section>
                            <h3 className="text-xl font-semibold">3. How We Use Your Information</h3>
                            <p>We process your personal information for the following purposes:</p>
                            <ul className="list-disc pl-6 mt-2 space-y-2">
                                <li><strong>Account Management:</strong> To create and manage your seller/partner account, verify your identity through KYC, and authenticate access.</li>
                                <li><strong>Service Delivery:</strong> To process shipments, assign delivery partners, track orders, manage pickups and deliveries, and facilitate proof of delivery.</li>
                                <li><strong>Financial Operations:</strong> To calculate settlements, process COD reconciliation, manage wallet balances, compute tier-based payouts, generate invoices, and maintain immutable ledger records.</li>
                                <li><strong>Tier Management:</strong> To evaluate performance metrics, process tier upgrades/downgrades, and maintain tier evaluation logs.</li>
                                <li><strong>Dashboard & Analytics:</strong> To provide real-time order tracking, performance indicators, revenue analytics, RTO percentage, settlement forecasting, and trend analysis.</li>
                                <li><strong>Communication:</strong> To send order updates, settlement notifications, policy changes, security alerts, and promotional communications (with opt-out).</li>
                                <li><strong>Legal Compliance:</strong> To comply with tax regulations (GST filing), anti-money laundering requirements, court orders, and regulatory requests.</li>
                                <li><strong>Security & Fraud Prevention:</strong> To detect and prevent unauthorized access, fraudulent activity, and abuse of the Platform.</li>
                            </ul>
                        </section>

                        <section>
                            <h3 className="text-xl font-semibold">4. Legal Basis for Processing</h3>
                            <p>We process your data based on the following legal grounds:</p>
                            <ul className="list-disc pl-6 mt-2 space-y-2">
                                <li><strong>Contractual Necessity:</strong> Processing required to fulfill our obligations under the Terms of Service, Partner Agreement, and related policies.</li>
                                <li><strong>Consent:</strong> Where you have explicitly consented, such as for marketing communications, optional analytics, and non-essential cookies.</li>
                                <li><strong>Legitimate Interests:</strong> For fraud prevention, platform security, service improvement, and internal analytics, where these interests do not override your fundamental rights.</li>
                                <li><strong>Legal Obligation:</strong> To comply with applicable Indian laws, tax regulations, and regulatory requirements.</li>
                            </ul>
                        </section>

                        <section>
                            <h3 className="text-xl font-semibold">5. Information Sharing and Disclosure</h3>
                            <p>We may share your information with the following categories of recipients:</p>
                            <ul className="list-disc pl-6 mt-2 space-y-2">
                                <li><strong>Delivery Partners:</strong> Seller shipment details (consignee name, address, phone) are shared with assigned delivery partners solely for the purpose of fulfilling deliveries.</li>
                                <li><strong>Payment Processors:</strong> Bank account details and transaction data are shared with authorized payment gateways and banking partners for settlement processing.</li>
                                <li><strong>Technology Partners:</strong> Data may be shared with cloud infrastructure providers, analytics tools, and communication service providers under strict data processing agreements.</li>
                                <li><strong>Legal and Regulatory Authorities:</strong> Information may be disclosed to comply with court orders, legal processes, government requests, or to protect FastFare's legal rights.</li>
                                <li><strong>Business Transfers:</strong> In the event of a merger, acquisition, or sale of assets, your information may be transferred as part of the transaction.</li>
                            </ul>
                            <p>We do not sell your personal information to third parties for marketing purposes.</p>
                        </section>

                        <section>
                            <h3 className="text-xl font-semibold">6. Cookies and Tracking Technologies</h3>
                            <p>We use cookies and similar technologies to enhance your experience:</p>
                            <ul className="list-disc pl-6 mt-2 space-y-1">
                                <li><strong>Essential Cookies:</strong> Required for authentication, session management, and security. Cannot be disabled.</li>
                                <li><strong>Functional Cookies:</strong> Remember your preferences, dashboard layout, and display settings.</li>
                                <li><strong>Analytics Cookies:</strong> Help us understand usage patterns and improve the Platform. Can be opted out.</li>
                                <li><strong>Performance Cookies:</strong> Monitor Platform performance and error reporting.</li>
                            </ul>
                            <p>You can manage cookie preferences through your browser settings. Disabling essential cookies may affect Platform functionality.</p>
                        </section>

                        <section>
                            <h3 className="text-xl font-semibold">7. Data Retention</h3>
                            <p>We retain your information for the following periods:</p>
                            <ul className="list-disc pl-6 mt-2 space-y-1">
                                <li><strong>Account Data:</strong> For the duration of your active account plus 3 years after account closure.</li>
                                <li><strong>Financial Records:</strong> Minimum 8 years as required under Indian tax and accounting regulations.</li>
                                <li><strong>Settlement Ledger:</strong> Retained indefinitely as immutable audit records.</li>
                                <li><strong>KYC Documents:</strong> 5 years from account closure or as required by regulation.</li>
                                <li><strong>Communication Logs:</strong> 2 years from date of communication.</li>
                                <li><strong>Usage Analytics:</strong> 1 year in identifiable form; anonymized data may be retained longer.</li>
                            </ul>
                        </section>

                        <section>
                            <h3 className="text-xl font-semibold">8. Data Security</h3>
                            <p>We implement industry-standard security measures to protect your information:</p>
                            <ul className="list-disc pl-6 mt-2 space-y-1">
                                <li>AES-256 encryption for data at rest and TLS 1.3 for data in transit.</li>
                                <li>Role-based access controls (RBAC) limiting data access to authorized personnel only.</li>
                                <li>Regular security audits, vulnerability assessments, and penetration testing.</li>
                                <li>Secure API authentication using OAuth 2.0 tokens.</li>
                                <li>Automated intrusion detection and monitoring systems.</li>
                                <li>Incident response procedures for data breach notifications within 72 hours.</li>
                            </ul>
                            <p>While we strive to protect your information, no method of transmission over the internet or electronic storage is 100% secure. We cannot guarantee absolute security.</p>
                        </section>

                        <section>
                            <h3 className="text-xl font-semibold">9. Your Rights Under DPDP Act 2023</h3>
                            <p>As a Data Principal under the Digital Personal Data Protection Act, 2023, you have the following rights:</p>
                            <ul className="list-disc pl-6 mt-2 space-y-2">
                                <li><strong>Right to Access:</strong> Request a summary of your personal data being processed and the processing activities.</li>
                                <li><strong>Right to Correction:</strong> Request correction of inaccurate or incomplete personal data.</li>
                                <li><strong>Right to Erasure:</strong> Request deletion of your personal data, subject to legal retention obligations.</li>
                                <li><strong>Right to Withdraw Consent:</strong> Withdraw previously given consent for data processing. This does not affect the lawfulness of processing based on consent before withdrawal.</li>
                                <li><strong>Right to Grievance Redressal:</strong> File complaints through our Grievance Officer or with the Data Protection Board of India.</li>
                                <li><strong>Right to Nominate:</strong> Nominate another individual to exercise your rights in case of death or incapacity.</li>
                            </ul>
                            <p>To exercise any of these rights, contact our Data Protection Officer at privacy@fastfare.in. We will respond within 30 days of receiving a verifiable request.</p>
                        </section>

                        <section>
                            <h3 className="text-xl font-semibold">10. Cross-Border Data Transfers</h3>
                            <p>
                                Your data is primarily stored and processed within India. In cases where data is transferred to servers or service providers outside India, we ensure adequate safeguards are in place, including standard contractual clauses and compliance with DPDP Act provisions on cross-border transfers. We will not transfer data to countries notified as restricted by the Central Government.
                            </p>
                        </section>

                        <section>
                            <h3 className="text-xl font-semibold">11. Children's Privacy</h3>
                            <p>
                                The Platform is intended for use by individuals who are 18 years of age or older. We do not knowingly collect personal information from minors. If we discover that we have inadvertently collected information from a minor, we will promptly delete it.
                            </p>
                        </section>

                        <section>
                            <h3 className="text-xl font-semibold">12. Changes to This Policy</h3>
                            <p>
                                We may update this Privacy Policy periodically to reflect changes in our practices, technology, legal requirements, or for other operational reasons. Material changes will be notified via email or through a prominent notice on the Platform. We encourage you to review this policy regularly.
                            </p>
                        </section>

                        <section>
                            <h3 className="text-xl font-semibold">13. Contact Us</h3>
                            <p>For questions or concerns about this Privacy Policy, or to exercise your data rights, contact us at:</p>
                            <address className="mt-2 not-italic">
                                <strong>Data Protection Officer</strong><br />
                                FastFare Logistics Pvt. Ltd.<br />
                                Email: privacy@fastfare.in<br />
                                Phone: +91-XXXX-XXXXXX<br />
                                Registered Office: Mumbai, Maharashtra, India
                            </address>
                            <p className="mt-4">
                                <strong>Grievance Officer:</strong><br />
                                Name: [Grievance Officer Name]<br />
                                Email: grievance@fastfare.in<br />
                                Complaints will be acknowledged within 24 hours and resolved within 30 days.
                            </p>
                        </section>
                    </CardContent>
                </Card>
            </main>
            <Footer />
        </div>
    );
};

export default PrivacyPolicy;
