import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const PartnerDisputePolicy = () => {
    return (
        <div className="min-h-screen bg-background">
            <Header />
            <main className="container py-12">
                <Card className="max-w-4xl mx-auto">
                    <CardHeader>
                        <CardTitle className="text-3xl font-bold text-center">Partner Dispute Resolution Policy</CardTitle>
                        <p className="text-center text-muted-foreground mt-2">Effective Date: February 12, 2026</p>
                        <p className="text-center text-sm text-muted-foreground">Applicable to: All Delivery Partners</p>
                    </CardHeader>
                    <CardContent className="prose dark:prose-invert max-w-none space-y-6">
                        <section>
                            <h3 className="text-xl font-semibold">1. Purpose</h3>
                            <p>This policy establishes a structured framework for resolving disputes between delivery partners and FastFare, including disputes related to payouts, order assignments, deductions, performance ratings, disciplinary actions, and operational matters.</p>
                        </section>

                        <section>
                            <h3 className="text-xl font-semibold">2. Dispute Categories</h3>
                            <ul className="list-disc pl-6 mt-2 space-y-1">
                                <li><strong>Payout Disputes:</strong> Incorrect calculations, missing orders, unauthorized deductions, delayed transfers.</li>
                                <li><strong>Order Disputes:</strong> Incorrect assignment, unfair RTO attribution, POD challenges, address-related issues.</li>
                                <li><strong>COD Disputes:</strong> Collection discrepancies, remittance reconciliation issues.</li>
                                <li><strong>Rating Disputes:</strong> Unfair performance ratings, incorrectly attributed poor reviews.</li>
                                <li><strong>Disciplinary Disputes:</strong> Appealing warnings, suspensions, fines, or termination decisions.</li>
                                <li><strong>Damage/Loss Claims:</strong> Disputes regarding liability attribution for damaged or lost parcels.</li>
                            </ul>
                        </section>

                        <section>
                            <h3 className="text-xl font-semibold">3. Raising a Dispute</h3>
                            <ol className="list-decimal pl-6 mt-2 space-y-2">
                                <li><strong>Through Partner Panel:</strong> Navigate to Disputes section → Select category → Provide order ID/payout ID → Describe issue → Attach evidence (screenshots, photos, communication records).</li>
                                <li><strong>Via Email:</strong> Send to disputes-partner@fastfare.in with subject line: [Dispute] [Category] [Partner ID] - Brief description.</li>
                                <li><strong>Helpline:</strong> Call +91-XXXX-XXXXXX during business hours for urgent operational disputes.</li>
                            </ol>
                            <p className="mt-2"><strong>Time Limit:</strong> Disputes must be raised within 15 days of the incident or within 15 days of the relevant payout cycle, whichever is later.</p>
                        </section>

                        <section>
                            <h3 className="text-xl font-semibold">4. Resolution Process</h3>
                            <div className="overflow-x-auto mt-2">
                                <table className="w-full border-collapse border border-border">
                                    <thead>
                                        <tr className="bg-muted">
                                            <th className="border border-border px-4 py-2 text-left">Stage</th>
                                            <th className="border border-border px-4 py-2 text-left">Action</th>
                                            <th className="border border-border px-4 py-2 text-center">Timeline</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr>
                                            <td className="border border-border px-4 py-2 font-medium">1. Acknowledgement</td>
                                            <td className="border border-border px-4 py-2">Dispute ticket created, confirmation sent to partner</td>
                                            <td className="border border-border px-4 py-2 text-center">Within 24 hours</td>
                                        </tr>
                                        <tr>
                                            <td className="border border-border px-4 py-2 font-medium">2. Investigation</td>
                                            <td className="border border-border px-4 py-2">Operations team reviews evidence, order data, ledger records</td>
                                            <td className="border border-border px-4 py-2 text-center">3–5 business days</td>
                                        </tr>
                                        <tr>
                                            <td className="border border-border px-4 py-2 font-medium">3. Resolution</td>
                                            <td className="border border-border px-4 py-2">Decision communicated with detailed reasoning</td>
                                            <td className="border border-border px-4 py-2 text-center">Within 7 business days</td>
                                        </tr>
                                        <tr>
                                            <td className="border border-border px-4 py-2 font-medium">4. Corrective Action</td>
                                            <td className="border border-border px-4 py-2">Credits, reversals, or status corrections applied</td>
                                            <td className="border border-border px-4 py-2 text-center">Next payout cycle</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </section>

                        <section>
                            <h3 className="text-xl font-semibold">5. Escalation</h3>
                            <p>If unsatisfied with the initial resolution, partners may escalate:</p>
                            <ul className="list-disc pl-6 mt-2 space-y-1">
                                <li><strong>Level 1 (Ops Team):</strong> Initial dispute handling by operations team.</li>
                                <li><strong>Level 2 (Regional Manager):</strong> Escalation to regional operations manager for review.</li>
                                <li><strong>Level 3 (Grievance Officer):</strong> Final internal escalation to the designated Grievance Officer.</li>
                                <li><strong>External:</strong> If internal resolution fails, disputes may be referred to arbitration under the Arbitration and Conciliation Act, 1996.</li>
                            </ul>
                        </section>

                        <section>
                            <h3 className="text-xl font-semibold">6. Partner Rights During Disputes</h3>
                            <ul className="list-disc pl-6 mt-2 space-y-1">
                                <li>Partners will continue receiving order assignments during dispute resolution (unless suspended for safety/compliance reasons).</li>
                                <li>Disputed payout amounts are held separately and released upon resolution.</li>
                                <li>Partners have the right to submit additional evidence at any stage.</li>
                                <li>All communications regarding disputes are documented and accessible.</li>
                            </ul>
                        </section>

                        <section>
                            <h3 className="text-xl font-semibold">7. Contact</h3>
                            <address className="mt-2 not-italic">
                                <strong>Dispute Resolution Team</strong><br />
                                FastFare Logistics Pvt. Ltd.<br />
                                Email: disputes-partner@fastfare.in<br />
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

export default PartnerDisputePolicy;
