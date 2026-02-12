import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const GrievanceRedressalPolicy = () => {
    return (
        <div className="min-h-screen bg-background">
            <Header />
            <main className="container py-12">
                <Card className="max-w-4xl mx-auto">
                    <CardHeader>
                        <CardTitle className="text-3xl font-bold text-center">Grievance Redressal Policy</CardTitle>
                        <p className="text-center text-muted-foreground mt-2">Effective Date: February 12, 2026</p>
                        <p className="text-center text-sm text-muted-foreground">Applicable to: All Users — Sellers, Delivery Partners, and Platform Users</p>
                    </CardHeader>
                    <CardContent className="prose dark:prose-invert max-w-none space-y-6">
                        <section>
                            <h3 className="text-xl font-semibold">1. Overview</h3>
                            <p>FastFare is committed to addressing complaints and concerns from all platform stakeholders in a fair, transparent, and timely manner. This Grievance Redressal Policy complies with the Information Technology (Intermediary Guidelines and Digital Media Ethics Code) Rules, 2021 and the Consumer Protection Act, 2019.</p>
                        </section>

                        <section>
                            <h3 className="text-xl font-semibold">2. Scope</h3>
                            <p>This policy covers grievances related to:</p>
                            <ul className="list-disc pl-6 mt-2 space-y-1">
                                <li>Platform services, features, and functionality.</li>
                                <li>Settlement and payout disputes (for both sellers and partners).</li>
                                <li>Order-related complaints (damage, loss, delivery issues).</li>
                                <li>Privacy and data protection concerns.</li>
                                <li>Account suspension, termination, or access issues.</li>
                                <li>Tier evaluation or membership disputes.</li>
                                <li>Billing, fees, and charge disputes.</li>
                                <li>Harassment, discrimination, or misconduct by any platform participant.</li>
                            </ul>
                        </section>

                        <section>
                            <h3 className="text-xl font-semibold">3. How to File a Grievance</h3>
                            <ul className="list-disc pl-6 mt-2 space-y-2">
                                <li><strong>Dashboard Support Center:</strong> Log into your Seller Dashboard or Partner Panel → Navigate to Support → Submit Grievance with category, description, and supporting documents.</li>
                                <li><strong>Email:</strong> grievance@fastfare.in — Include your account ID, order/payout reference numbers, description, and attachments.</li>
                                <li><strong>Phone:</strong> +91-XXXX-XXXXXX (Monday to Saturday, 9 AM – 7 PM IST).</li>
                                <li><strong>Written Correspondence:</strong> FastFare Logistics Pvt. Ltd., [Registered Office Address], Attn: Grievance Officer.</li>
                            </ul>
                        </section>

                        <section>
                            <h3 className="text-xl font-semibold">4. Grievance Resolution Timeline</h3>
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
                                        <tr><td className="border border-border px-4 py-2">Acknowledgement</td><td className="border border-border px-4 py-2">Ticket created, confirmation sent</td><td className="border border-border px-4 py-2 text-center">Within 24 hours</td></tr>
                                        <tr><td className="border border-border px-4 py-2">Initial Response</td><td className="border border-border px-4 py-2">Preliminary assessment communicated</td><td className="border border-border px-4 py-2 text-center">Within 48 hours</td></tr>
                                        <tr><td className="border border-border px-4 py-2">Investigation</td><td className="border border-border px-4 py-2">Detailed review and evidence analysis</td><td className="border border-border px-4 py-2 text-center">5–10 business days</td></tr>
                                        <tr><td className="border border-border px-4 py-2">Resolution</td><td className="border border-border px-4 py-2">Final decision with reasoning</td><td className="border border-border px-4 py-2 text-center">Within 15 business days</td></tr>
                                        <tr><td className="border border-border px-4 py-2">Action</td><td className="border border-border px-4 py-2">Corrective measures implemented</td><td className="border border-border px-4 py-2 text-center">Within 30 days of filing</td></tr>
                                    </tbody>
                                </table>
                            </div>
                        </section>

                        <section>
                            <h3 className="text-xl font-semibold">5. Escalation Path</h3>
                            <ol className="list-decimal pl-6 mt-2 space-y-2">
                                <li><strong>Level 1 — Support Team:</strong> Initial handling by the customer/partner support team.</li>
                                <li><strong>Level 2 — Department Manager:</strong> Escalation to the relevant department head if Level 1 does not resolve within the stated timeline.</li>
                                <li><strong>Level 3 — Grievance Officer:</strong> Final escalation to the designated Grievance Officer as per IT Rules, 2021. The Grievance Officer will provide a final binding resolution.</li>
                            </ol>
                        </section>

                        <section>
                            <h3 className="text-xl font-semibold">6. Designated Grievance Officer</h3>
                            <p>As required under the Information Technology (Intermediary Guidelines) Rules, 2021:</p>
                            <address className="mt-2 not-italic bg-muted p-4 rounded-lg">
                                <strong>Name:</strong> [Grievance Officer Name]<br />
                                <strong>Designation:</strong> Grievance Officer<br />
                                <strong>Email:</strong> grievance-officer@fastfare.in<br />
                                <strong>Phone:</strong> +91-XXXX-XXXXXX<br />
                                <strong>Address:</strong> FastFare Logistics Pvt. Ltd., [Registered Office Address]
                            </address>
                            <p className="mt-2">The Grievance Officer will acknowledge the complaint within 24 hours and resolve it within 15 days from receipt, as per applicable regulations.</p>
                        </section>

                        <section>
                            <h3 className="text-xl font-semibold">7. External Remedies</h3>
                            <p>If the internal grievance process does not provide satisfactory resolution, users may approach:</p>
                            <ul className="list-disc pl-6 mt-2 space-y-1">
                                <li><strong>National Consumer Helpline:</strong> 1800-11-4000 or consumerhelpline.gov.in.</li>
                                <li><strong>District Consumer Disputes Redressal Forum:</strong> For consumer-related complaints.</li>
                                <li><strong>Appropriate civil courts</strong> with jurisdiction in Mumbai, Maharashtra.</li>
                            </ul>
                        </section>

                        <section>
                            <h3 className="text-xl font-semibold">8. Contact</h3>
                            <address className="mt-2 not-italic">
                                <strong>Grievance Redressal Cell</strong><br />
                                FastFare Logistics Pvt. Ltd.<br />
                                Email: grievance@fastfare.in<br />
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

export default GrievanceRedressalPolicy;
