import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const ShippingDeliveryPolicy = () => {
    return (
        <div className="min-h-screen bg-background">
            <Header />
            <main className="container py-12">
                <Card className="max-w-4xl mx-auto">
                    <CardHeader>
                        <CardTitle className="text-3xl font-bold text-center">Shipping & Delivery Policy</CardTitle>
                        <p className="text-center text-muted-foreground mt-2">Effective Date: February 12, 2026</p>
                        <p className="text-center text-sm text-muted-foreground">Applicable to: All Sellers and Consignees</p>
                    </CardHeader>
                    <CardContent className="prose dark:prose-invert max-w-none space-y-6">
                        <section>
                            <h3 className="text-xl font-semibold">1. Overview</h3>
                            <p>This Shipping & Delivery Policy outlines the order lifecycle, delivery standards, serviceable areas, weight and dimension guidelines, delivery attempt protocols, and liability framework for shipments processed through the FastFare B2B logistics aggregation platform.</p>
                        </section>

                        <section>
                            <h3 className="text-xl font-semibold">2. Order Lifecycle</h3>
                            <p>Every shipment follows standardized statuses:</p>
                            <ol className="list-decimal pl-6 mt-2 space-y-1">
                                <li><strong>Created:</strong> Shipment created, label/AWB generated, queued for partner assignment.</li>
                                <li><strong>Assigned:</strong> Delivery partner assigned based on serviceability and availability.</li>
                                <li><strong>Picked:</strong> Parcel picked up from seller's designated pickup address.</li>
                                <li><strong>In Transit:</strong> Parcel in transit to delivery destination, including hub processing.</li>
                                <li><strong>Delivered (RTD):</strong> Successfully delivered, POD recorded. Triggers settlement timer.</li>
                                <li><strong>RTO (Return to Origin):</strong> Delivery failed, parcel returning to seller.</li>
                                <li><strong>Cancelled:</strong> Order cancelled before pickup.</li>
                            </ol>
                            <p className="mt-2">Settlement logic is triggered <strong>only</strong> when <code>OrderStatus == Delivered</code>. Cancelled or RTO orders do not enter the payout queue.</p>
                        </section>

                        <section>
                            <h3 className="text-xl font-semibold">3. Serviceability</h3>
                            <ul className="list-disc pl-6 mt-2 space-y-1">
                                <li><strong>Pan-India Coverage:</strong> All serviceable PIN codes through our carrier network.</li>
                                <li><strong>PIN Code Check:</strong> Verify serviceability via dashboard before shipment creation.</li>
                                <li><strong>Zone Classification:</strong> Routes classified into zones (local, within-city, within-state, metro-to-metro, rest of India, special) determining rates and timelines.</li>
                            </ul>
                        </section>

                        <section>
                            <h3 className="text-xl font-semibold">4. Estimated Delivery Timelines</h3>
                            <div className="overflow-x-auto mt-2">
                                <table className="w-full border-collapse border border-border">
                                    <thead>
                                        <tr className="bg-muted">
                                            <th className="border border-border px-4 py-2 text-left">Zone</th>
                                            <th className="border border-border px-4 py-2 text-center">Standard</th>
                                            <th className="border border-border px-4 py-2 text-center">Express</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr><td className="border border-border px-4 py-2">Local</td><td className="border border-border px-4 py-2 text-center">1–2 days</td><td className="border border-border px-4 py-2 text-center">Same/Next day</td></tr>
                                        <tr><td className="border border-border px-4 py-2">Within State</td><td className="border border-border px-4 py-2 text-center">2–4 days</td><td className="border border-border px-4 py-2 text-center">1–2 days</td></tr>
                                        <tr><td className="border border-border px-4 py-2">Metro to Metro</td><td className="border border-border px-4 py-2 text-center">3–5 days</td><td className="border border-border px-4 py-2 text-center">1–3 days</td></tr>
                                        <tr><td className="border border-border px-4 py-2">Rest of India</td><td className="border border-border px-4 py-2 text-center">5–8 days</td><td className="border border-border px-4 py-2 text-center">3–5 days</td></tr>
                                        <tr><td className="border border-border px-4 py-2">Remote Areas</td><td className="border border-border px-4 py-2 text-center">7–12 days</td><td className="border border-border px-4 py-2 text-center">5–7 days</td></tr>
                                    </tbody>
                                </table>
                            </div>
                            <p className="mt-2 text-sm text-muted-foreground">Timelines are estimates and may vary due to weather, natural disasters, or carrier constraints.</p>
                        </section>

                        <section>
                            <h3 className="text-xl font-semibold">5. Weight & Dimension Rules</h3>
                            <ul className="list-disc pl-6 mt-2 space-y-1">
                                <li><strong>Dead Weight:</strong> Actual weight on a scale.</li>
                                <li><strong>Volumetric Weight:</strong> <code>(L × W × H) / 5000</code> (cm/kg).</li>
                                <li><strong>Billable Weight:</strong> Higher of dead weight and volumetric weight.</li>
                                <li><strong>Weight Audit:</strong> Audits at pickup/hub; re-rating for discrepancies.</li>
                            </ul>
                        </section>

                        <section>
                            <h3 className="text-xl font-semibold">6. Packaging Requirements</h3>
                            <ul className="list-disc pl-6 mt-2 space-y-1">
                                <li>Use sturdy outer packaging appropriate for the goods.</li>
                                <li>Include adequate cushioning for fragile items.</li>
                                <li>Seal packages securely; affix AWB label clearly.</li>
                                <li>Remove old shipping labels or barcodes.</li>
                                <li>Liquid items require leak-proof containers with secondary containment.</li>
                            </ul>
                            <p>FastFare is not responsible for damage caused by inadequate packaging.</p>
                        </section>

                        <section>
                            <h3 className="text-xl font-semibold">7. Delivery Attempts</h3>
                            <ul className="list-disc pl-6 mt-2 space-y-1">
                                <li>Maximum <strong>3 delivery attempts</strong> per order.</li>
                                <li>Consignee notified via SMS/call between attempts.</li>
                                <li>If all 3 attempts fail, order is marked for RTO.</li>
                                <li>Delivery during standard hours (9 AM – 8 PM).</li>
                            </ul>
                        </section>

                        <section>
                            <h3 className="text-xl font-semibold">8. Proof of Delivery (POD)</h3>
                            <ul className="list-disc pl-6 mt-2 space-y-1">
                                <li><strong>OTP Verification:</strong> One-time password confirmed at delivery.</li>
                                <li><strong>Digital Signature:</strong> Captured on delivery partner's device.</li>
                                <li><strong>Photo Proof:</strong> Photographic evidence of delivery.</li>
                                <li><strong>GPS Confirmation:</strong> Location matching delivery address.</li>
                            </ul>
                            <p>POD records are accessible via order detail page for a minimum of 6 months.</p>
                        </section>

                        <section>
                            <h3 className="text-xl font-semibold">9. Liability for Loss & Damage</h3>
                            <ul className="list-disc pl-6 mt-2 space-y-1">
                                <li>Limited coverage: capped at declared value or ₹5,000, whichever is lower.</li>
                                <li>Claims must be filed within 7 days with photos, invoice, and AWB number.</li>
                                <li>Exclusions: improper packaging, prohibited items, natural disasters, customs.</li>
                                <li>Optional insurance available at order creation for higher-value goods.</li>
                            </ul>
                        </section>

                        <section>
                            <h3 className="text-xl font-semibold">10. Order Cancellation (Pre-Pickup)</h3>
                            <ul className="list-disc pl-6 mt-2 space-y-1">
                                <li>Free cancellation before partner assignment.</li>
                                <li>Nominal fee if partner is assigned but pickup hasn't occurred.</li>
                                <li>Post-pickup cancellation not possible—must go through RTO.</li>
                            </ul>
                        </section>

                        <section>
                            <h3 className="text-xl font-semibold">11. Contact</h3>
                            <address className="mt-2 not-italic">
                                <strong>Operations Team</strong><br />
                                FastFare Logistics Pvt. Ltd.<br />
                                Email: operations@fastfare.in<br />
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

export default ShippingDeliveryPolicy;
