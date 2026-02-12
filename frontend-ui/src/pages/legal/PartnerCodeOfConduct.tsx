import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const PartnerCodeOfConduct = () => {
    return (
        <div className="min-h-screen bg-background">
            <Header />
            <main className="container py-12">
                <Card className="max-w-4xl mx-auto">
                    <CardHeader>
                        <CardTitle className="text-3xl font-bold text-center">Partner Code of Conduct</CardTitle>
                        <p className="text-center text-muted-foreground mt-2">Effective Date: February 12, 2026</p>
                        <p className="text-center text-sm text-muted-foreground">Applicable to: All Delivery Partners</p>
                    </CardHeader>
                    <CardContent className="prose dark:prose-invert max-w-none space-y-6">
                        <section>
                            <h3 className="text-xl font-semibold">1. Purpose</h3>
                            <p>This Code of Conduct establishes the behavioral, ethical, and professional standards expected of all delivery partners operating on the FastFare platform. Adherence to this code is a condition of continued partnership.</p>
                        </section>

                        <section>
                            <h3 className="text-xl font-semibold">2. Professional Conduct</h3>
                            <ul className="list-disc pl-6 mt-2 space-y-1">
                                <li>Treat all sellers, consignees, FastFare staff, and fellow partners with respect and courtesy.</li>
                                <li>Maintain a professional and clean appearance during deliveries.</li>
                                <li>Communicate clearly and politely — no abusive, threatening, or discriminatory language.</li>
                                <li>Arrive on time for scheduled pickups and deliveries.</li>
                                <li>Carry valid identification and present it when requested by sellers or consignees.</li>
                                <li>Follow all instructions provided through the Partner Panel and operations team.</li>
                            </ul>
                        </section>

                        <section>
                            <h3 className="text-xl font-semibold">3. Parcel Handling</h3>
                            <ul className="list-disc pl-6 mt-2 space-y-1">
                                <li>Handle all parcels with care to prevent damage, loss, or tampering.</li>
                                <li><strong>Never open, inspect, or tamper</strong> with the contents of any parcel.</li>
                                <li>Use appropriate bags, containers, or vehicle compartments to protect parcels during transit.</li>
                                <li>Report any pre-existing damage to parcels at pickup time through the app.</li>
                                <li>Ensure parcels are delivered to the correct consignee — verify identity where required.</li>
                            </ul>
                        </section>

                        <section>
                            <h3 className="text-xl font-semibold">4. Financial Integrity</h3>
                            <ul className="list-disc pl-6 mt-2 space-y-1">
                                <li>Collect the <strong>exact declared COD amount</strong> from consignees — no more, no less.</li>
                                <li>Never negotiate, discount, or waive COD amounts with consignees.</li>
                                <li>Remit all COD collections to FastFare within the designated remittance cycle (24–48 hours).</li>
                                <li><strong>Misappropriation of COD funds is considered theft</strong> and will result in immediate termination, recovery action, and criminal prosecution.</li>
                                <li>Do not accept tips or payments outside the Platform for FastFare deliveries.</li>
                            </ul>
                        </section>

                        <section>
                            <h3 className="text-xl font-semibold">5. Safety and Compliance</h3>
                            <ul className="list-disc pl-6 mt-2 space-y-1">
                                <li>Obey all traffic laws, speed limits, and road safety regulations.</li>
                                <li>Wear helmets (for two-wheelers) and seatbelts (for four-wheelers) at all times.</li>
                                <li>Do not operate vehicles under the influence of alcohol, drugs, or any impairing substances.</li>
                                <li>Maintain vehicle in safe, roadworthy condition with valid insurance and registration.</li>
                                <li>Report all accidents, incidents, or near-misses immediately to FastFare operations.</li>
                                <li>Do not deliver prohibited, illegal, or hazardous materials.</li>
                            </ul>
                        </section>

                        <section>
                            <h3 className="text-xl font-semibold">6. Data and Privacy</h3>
                            <ul className="list-disc pl-6 mt-2 space-y-1">
                                <li>Keep all seller and consignee information <strong>strictly confidential</strong>.</li>
                                <li>Do not share, photograph, or record consignee personal details (names, phone numbers, addresses) for personal use.</li>
                                <li>Do not contact consignees or sellers through personal channels unless required for delivery coordination.</li>
                                <li>Report any data breach or unauthorized access immediately.</li>
                            </ul>
                        </section>

                        <section>
                            <h3 className="text-xl font-semibold">7. Prohibited Behaviors</h3>
                            <p>The following behaviors are <strong>strictly prohibited</strong> and may result in immediate termination:</p>
                            <ul className="list-disc pl-6 mt-2 space-y-1">
                                <li>Theft, fraud, or misappropriation of goods or funds.</li>
                                <li>Physical violence, threats, or intimidation.</li>
                                <li>Sexual harassment or inappropriate behavior of any kind.</li>
                                <li>Discrimination based on race, religion, caste, gender, or any protected characteristic.</li>
                                <li>Tampering with or opening parcel contents.</li>
                                <li>Falsifying delivery status, POD, or GPS location.</li>
                                <li>Operating under the influence of substances.</li>
                                <li>Unauthorized sub-contracting of deliveries.</li>
                                <li>Soliciting business from FastFare sellers or consignees for personal ventures.</li>
                            </ul>
                        </section>

                        <section>
                            <h3 className="text-xl font-semibold">8. Violation Consequences</h3>
                            <div className="overflow-x-auto mt-2">
                                <table className="w-full border-collapse border border-border">
                                    <thead>
                                        <tr className="bg-muted">
                                            <th className="border border-border px-4 py-2 text-left">Severity</th>
                                            <th className="border border-border px-4 py-2 text-left">Examples</th>
                                            <th className="border border-border px-4 py-2 text-left">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr>
                                            <td className="border border-border px-4 py-2 font-medium">Minor</td>
                                            <td className="border border-border px-4 py-2">Late pickups, incomplete POD, unprofessional appearance</td>
                                            <td className="border border-border px-4 py-2">Warning + counseling</td>
                                        </tr>
                                        <tr>
                                            <td className="border border-border px-4 py-2 font-medium">Moderate</td>
                                            <td className="border border-border px-4 py-2">Repeated delays, careless handling, COD late remittance</td>
                                            <td className="border border-border px-4 py-2">Written warning + temporary suspension (3–7 days)</td>
                                        </tr>
                                        <tr>
                                            <td className="border border-border px-4 py-2 font-medium">Severe</td>
                                            <td className="border border-border px-4 py-2">Theft, fraud, violence, harassment, falsification</td>
                                            <td className="border border-border px-4 py-2">Immediate termination + legal action</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </section>

                        <section>
                            <h3 className="text-xl font-semibold">9. Reporting Violations</h3>
                            <p>Partners, sellers, or consignees can report code of conduct violations through:</p>
                            <ul className="list-disc pl-6 mt-2 space-y-1">
                                <li>Partner Panel complaint system.</li>
                                <li>Email: conduct@fastfare.in.</li>
                                <li>FastFare helpline: +91-XXXX-XXXXXX.</li>
                            </ul>
                            <p>All reports are investigated confidentially. Retaliation against reporters is prohibited and will be treated as a severe violation.</p>
                        </section>

                        <section>
                            <h3 className="text-xl font-semibold">10. Contact</h3>
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

export default PartnerCodeOfConduct;
