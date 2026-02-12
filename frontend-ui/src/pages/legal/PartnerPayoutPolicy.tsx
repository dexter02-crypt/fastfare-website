import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const PartnerPayoutPolicy = () => {
    return (
        <div className="min-h-screen bg-background">
            <Header />
            <main className="container py-12">
                <Card className="max-w-4xl mx-auto">
                    <CardHeader>
                        <CardTitle className="text-3xl font-bold text-center">Partner Payout & Compensation Policy</CardTitle>
                        <p className="text-center text-muted-foreground mt-2">Effective Date: February 12, 2026</p>
                        <p className="text-center text-sm text-muted-foreground">Applicable to: All Delivery Partners</p>
                    </CardHeader>
                    <CardContent className="prose dark:prose-invert max-w-none space-y-6">
                        <section>
                            <h3 className="text-xl font-semibold">1. Overview</h3>
                            <p>This policy details the compensation structure, payout schedules, deductions, and financial ledger management for delivery partners on the FastFare platform. Partner payouts operate on a <strong>completely separate financial ledger</strong> from seller settlements, ensuring no cross-dependency or accounting conflicts.</p>
                        </section>

                        <section>
                            <h3 className="text-xl font-semibold">2. Compensation Formula</h3>
                            <p>Partner earnings per order are calculated using configurable pricing formulas:</p>
                            <div className="bg-muted p-4 rounded-lg mt-2 font-mono text-sm">
                                PartnerPayout = (Distance × PartnerRate) + SlabAdd
                            </div>
                            <p className="mt-2">Where:</p>
                            <ul className="list-disc pl-6 mt-2 space-y-1">
                                <li><strong>Distance:</strong> Calculated distance between pickup and delivery locations (km).</li>
                                <li><strong>PartnerRate:</strong> Per-kilometer rate as per the partner's rate agreement, which may vary by zone, vehicle type, and service type.</li>
                                <li><strong>SlabAdd:</strong> Additional slab-based charges based on weight tiers, special handling requirements, or premium service categories.</li>
                            </ul>
                            <p className="mt-2">Additional compensation components may include:</p>
                            <ul className="list-disc pl-6 mt-2 space-y-1">
                                <li><strong>COD Collection Incentive:</strong> Bonus for successful COD orders.</li>
                                <li><strong>Peak Hour Bonus:</strong> Surge compensation during high-demand periods.</li>
                                <li><strong>Long-Distance Premium:</strong> Additional rate for orders exceeding threshold distance.</li>
                                <li><strong>Performance Bonus:</strong> Monthly bonus for partners exceeding quality and volume targets.</li>
                            </ul>
                        </section>

                        <section>
                            <h3 className="text-xl font-semibold">3. Payout Schedule</h3>
                            <p>Partner payouts follow one of two models (assigned during onboarding):</p>
                            <div className="overflow-x-auto mt-2">
                                <table className="w-full border-collapse border border-border">
                                    <thead>
                                        <tr className="bg-muted">
                                            <th className="border border-border px-4 py-2 text-left">Model</th>
                                            <th className="border border-border px-4 py-2 text-left">Schedule</th>
                                            <th className="border border-border px-4 py-2 text-left">Suited For</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr>
                                            <td className="border border-border px-4 py-2 font-medium">Weekly Fixed Payout</td>
                                            <td className="border border-border px-4 py-2">Every Monday for the previous week's earnings (Mon–Sun)</td>
                                            <td className="border border-border px-4 py-2">Individual partners, small fleet operators</td>
                                        </tr>
                                        <tr>
                                            <td className="border border-border px-4 py-2 font-medium">Volume-Based Release</td>
                                            <td className="border border-border px-4 py-2">Triggered when accumulated earnings exceed threshold (e.g., ₹10,000)</td>
                                            <td className="border border-border px-4 py-2">High-volume partners, logistics companies</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                            <p className="mt-2">Payout processing takes 1–2 business days. If a payout day falls on a bank holiday, it is processed on the next business day.</p>
                        </section>

                        <section>
                            <h3 className="text-xl font-semibold">4. Partner Ledger</h3>
                            <p>Each partner has a dedicated ledger tracking:</p>
                            <ul className="list-disc pl-6 mt-2 space-y-1">
                                <li>Total orders completed (all time and current period).</li>
                                <li>Total earnings (gross).</li>
                                <li>Deductions (damages, penalties, COD shortfalls).</li>
                                <li>Net payable amount.</li>
                                <li>Payout history with order-level detail.</li>
                                <li>Pending COD remittance amount.</li>
                                <li>Next payout date and estimated amount.</li>
                            </ul>
                            <p>The partner ledger is <strong>completely independent</strong> from the seller ledger. Seller settlement delays never affect partner payouts.</p>
                        </section>

                        <section>
                            <h3 className="text-xl font-semibold">5. Deductions</h3>
                            <p>The following deductions may be applied to partner payouts:</p>
                            <ul className="list-disc pl-6 mt-2 space-y-1">
                                <li><strong>COD Shortfall:</strong> If COD collected is less than declared amount and discrepancy is partner's responsibility.</li>
                                <li><strong>Goods Damage/Loss:</strong> Liability for damaged or lost parcels attributable to partner negligence (after investigation).</li>
                                <li><strong>Late Remittance Penalty:</strong> Fee for delayed COD remittance beyond the 48-hour window.</li>
                                <li><strong>Policy Violations:</strong> Fines for code of conduct or operational policy violations.</li>
                                <li><strong>Equipment Damage:</strong> Cost of FastFare-provided equipment damaged by the partner.</li>
                                <li><strong>TDS (Tax Deduction at Source):</strong> As applicable under Indian tax law for contractor payments.</li>
                            </ul>
                            <p>All deductions are documented with justification and visible on the Partner Panel ledger.</p>
                        </section>

                        <section>
                            <h3 className="text-xl font-semibold">6. Payout Methods</h3>
                            <ul className="list-disc pl-6 mt-2 space-y-1">
                                <li>Bank transfer (NEFT/RTGS/IMPS) to verified bank account.</li>
                                <li>UPI transfer (if bank account supports UPI).</li>
                                <li>Minimum payout threshold: ₹500 (amounts below threshold are carried forward).</li>
                                <li>Partners must maintain an active, verified bank account. Account changes require re-verification (3–5 business days).</li>
                            </ul>
                        </section>

                        <section>
                            <h3 className="text-xl font-semibold">7. Payout Holds</h3>
                            <p>Payouts may be held under the following circumstances:</p>
                            <ul className="list-disc pl-6 mt-2 space-y-1">
                                <li>Pending COD remittance not cleared.</li>
                                <li>Active investigation for fraud, theft, or misconduct.</li>
                                <li>Expired KYC documents or bank account re-verification pending.</li>
                                <li>Outstanding penalties or damage claims under investigation.</li>
                                <li>Upon termination: payouts held for 30 days to settle outstanding claims.</li>
                            </ul>
                        </section>

                        <section>
                            <h3 className="text-xl font-semibold">8. Payout Disputes</h3>
                            <ul className="list-disc pl-6 mt-2 space-y-1">
                                <li>Partners can raise payout disputes via the Partner Panel within 15 days.</li>
                                <li>Dispute categories: incorrect calculation, missing orders, unauthorized deductions, bank transfer issues.</li>
                                <li>Investigation completed within 5 business days.</li>
                                <li>Corrective credits applied to the next payout cycle if dispute is upheld.</li>
                            </ul>
                        </section>

                        <section>
                            <h3 className="text-xl font-semibold">9. Tax Compliance</h3>
                            <p>Partners are responsible for their own tax filings. FastFare will:</p>
                            <ul className="list-disc pl-6 mt-2 space-y-1">
                                <li>Deduct TDS as applicable under Section 194C/194H of the Income Tax Act.</li>
                                <li>Provide annual TDS certificates (Form 16A) for tax filing purposes.</li>
                                <li>Issue monthly earning statements accessible via the Partner Panel.</li>
                            </ul>
                        </section>

                        <section>
                            <h3 className="text-xl font-semibold">10. Contact</h3>
                            <address className="mt-2 not-italic">
                                <strong>Partner Finance Team</strong><br />
                                FastFare Logistics Pvt. Ltd.<br />
                                Email: partner-finance@fastfare.in<br />
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

export default PartnerPayoutPolicy;
