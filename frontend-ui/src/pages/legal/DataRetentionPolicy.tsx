import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const DataRetentionPolicy = () => {
    return (
        <div className="min-h-screen bg-background">
            <Header />
            <main className="container py-12">
                <Card className="max-w-4xl mx-auto">
                    <CardHeader>
                        <CardTitle className="text-3xl font-bold text-center">Data Retention & Deletion Policy</CardTitle>
                        <p className="text-center text-muted-foreground mt-2">Effective Date: February 12, 2026</p>
                        <p className="text-center text-sm text-muted-foreground">Applicable to: All Platform Data — Sellers, Partners, and Platform Operations</p>
                    </CardHeader>
                    <CardContent className="prose dark:prose-invert max-w-none space-y-6">
                        <section>
                            <h3 className="text-xl font-semibold">1. Overview</h3>
                            <p>This Data Retention & Deletion Policy outlines the retention periods, storage practices, and deletion procedures for all data processed by the FastFare platform. This policy ensures compliance with the Digital Personal Data Protection Act (DPDP) 2023, Information Technology Act 2000, and applicable tax and regulatory requirements.</p>
                        </section>

                        <section>
                            <h3 className="text-xl font-semibold">2. Retention Schedule</h3>
                            <div className="overflow-x-auto mt-2">
                                <table className="w-full border-collapse border border-border">
                                    <thead>
                                        <tr className="bg-muted">
                                            <th className="border border-border px-4 py-2 text-left">Data Category</th>
                                            <th className="border border-border px-4 py-2 text-center">Retention Period</th>
                                            <th className="border border-border px-4 py-2 text-left">Legal Basis</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr><td className="border border-border px-4 py-2">Seller Account Data</td><td className="border border-border px-4 py-2 text-center">Active + 3 years</td><td className="border border-border px-4 py-2">Business records, DPDP Act</td></tr>
                                        <tr><td className="border border-border px-4 py-2">Partner Account Data</td><td className="border border-border px-4 py-2 text-center">Active + 3 years</td><td className="border border-border px-4 py-2">Contract, DPDP Act</td></tr>
                                        <tr><td className="border border-border px-4 py-2">KYC Documents</td><td className="border border-border px-4 py-2 text-center">Active + 5 years</td><td className="border border-border px-4 py-2">PMLA, KYC regulations</td></tr>
                                        <tr><td className="border border-border px-4 py-2">Order Records</td><td className="border border-border px-4 py-2 text-center">8 years</td><td className="border border-border px-4 py-2">Tax, GST compliance</td></tr>
                                        <tr><td className="border border-border px-4 py-2">Settlement Ledger</td><td className="border border-border px-4 py-2 text-center">8 years (immutable)</td><td className="border border-border px-4 py-2">Tax, audit compliance</td></tr>
                                        <tr><td className="border border-border px-4 py-2">Partner Ledger</td><td className="border border-border px-4 py-2 text-center">8 years</td><td className="border border-border px-4 py-2">TDS, tax compliance</td></tr>
                                        <tr><td className="border border-border px-4 py-2">COD Collection Records</td><td className="border border-border px-4 py-2 text-center">8 years</td><td className="border border-border px-4 py-2">Financial audit</td></tr>
                                        <tr><td className="border border-border px-4 py-2">Tier Evaluation Logs</td><td className="border border-border px-4 py-2 text-center">5 years</td><td className="border border-border px-4 py-2">Audit, dispute resolution</td></tr>
                                        <tr><td className="border border-border px-4 py-2">Admin Override Logs</td><td className="border border-border px-4 py-2 text-center">8 years (immutable)</td><td className="border border-border px-4 py-2">Compliance audit</td></tr>
                                        <tr><td className="border border-border px-4 py-2">Location/GPS Data</td><td className="border border-border px-4 py-2 text-center">90 days (then anonymized)</td><td className="border border-border px-4 py-2">Operational need</td></tr>
                                        <tr><td className="border border-border px-4 py-2">Proof of Delivery (POD)</td><td className="border border-border px-4 py-2 text-center">6 months</td><td className="border border-border px-4 py-2">Dispute resolution</td></tr>
                                        <tr><td className="border border-border px-4 py-2">Communication Logs</td><td className="border border-border px-4 py-2 text-center">1 year</td><td className="border border-border px-4 py-2">Support, dispute evidence</td></tr>
                                        <tr><td className="border border-border px-4 py-2">Server/Access Logs</td><td className="border border-border px-4 py-2 text-center">180 days</td><td className="border border-border px-4 py-2">IT Act, security</td></tr>
                                    </tbody>
                                </table>
                            </div>
                        </section>

                        <section>
                            <h3 className="text-xl font-semibold">3. Immutable Records</h3>
                            <p>The following records are maintained as <strong>immutable, append-only</strong> entries and cannot be modified or deleted even upon account deletion request:</p>
                            <ul className="list-disc pl-6 mt-2 space-y-1">
                                <li>Settlement Ledger entries (seller and partner).</li>
                                <li>Admin Override logs.</li>
                                <li>Fraud investigation records.</li>
                                <li>Financial transaction records required for tax compliance.</li>
                            </ul>
                            <p>These records are retained for the legally mandated period regardless of the data subject's deletion request, as required under Indian tax, financial, and compliance regulations.</p>
                        </section>

                        <section>
                            <h3 className="text-xl font-semibold">4. Account Deletion Process</h3>
                            <h4 className="text-lg font-medium mt-4">4.1 Seller Account Deletion</h4>
                            <ol className="list-decimal pl-6 mt-2 space-y-1">
                                <li>Submit deletion request via Dashboard Settings or email to privacy@fastfare.in.</li>
                                <li>All pending settlements must be cleared or forfeited.</li>
                                <li>Active orders must be completed or cancelled.</li>
                                <li>Account is deactivated within 7 days of request confirmation.</li>
                                <li>Personal data is deleted within 30 days (except legally retained records).</li>
                            </ol>

                            <h4 className="text-lg font-medium mt-4">4.2 Partner Account Deletion</h4>
                            <ol className="list-decimal pl-6 mt-2 space-y-1">
                                <li>Submit deletion request via Partner Panel or email.</li>
                                <li>All pending payouts and COD remittances must be settled.</li>
                                <li>Equipment (if any) returned to FastFare.</li>
                                <li>30-day holding period for outstanding claim resolution.</li>
                                <li>Personal data deleted within 30 days (except legally retained records).</li>
                            </ol>
                        </section>

                        <section>
                            <h3 className="text-xl font-semibold">5. Data Anonymization</h3>
                            <p>Where full deletion is not possible due to legal requirements, FastFare will anonymize personal data by:</p>
                            <ul className="list-disc pl-6 mt-2 space-y-1">
                                <li>Removing or hashing all personally identifiable information (names, phone, email, addresses).</li>
                                <li>Retaining only anonymized transaction records for financial compliance.</li>
                                <li>Aggregating location data for analytics without individual identification.</li>
                            </ul>
                        </section>

                        <section>
                            <h3 className="text-xl font-semibold">6. Data Storage and Security</h3>
                            <ul className="list-disc pl-6 mt-2 space-y-1">
                                <li>All data stored in encrypted form (AES-256 at rest, TLS 1.3 in transit).</li>
                                <li>Data stored on servers located in India, compliant with data localization requirements.</li>
                                <li>Regular backups with encrypted storage and access controls.</li>
                                <li>Access restricted to authorized personnel on a need-to-know basis.</li>
                                <li>Automated deletion/purging processes for data exceeding retention periods.</li>
                            </ul>
                        </section>

                        <section>
                            <h3 className="text-xl font-semibold">7. Data Subject Rights</h3>
                            <p>Under the DPDP Act 2023, data subjects may:</p>
                            <ul className="list-disc pl-6 mt-2 space-y-1">
                                <li>Request a summary of data being processed.</li>
                                <li>Request correction of inaccurate data.</li>
                                <li>Request deletion of data (subject to legal retention obligations).</li>
                                <li>Withdraw consent for non-essential processing.</li>
                                <li>Nominate a representative to exercise rights on their behalf.</li>
                            </ul>
                            <p>Requests are processed within 30 days. Contact: privacy@fastfare.in.</p>
                        </section>

                        <section>
                            <h3 className="text-xl font-semibold">8. Contact</h3>
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

export default DataRetentionPolicy;
