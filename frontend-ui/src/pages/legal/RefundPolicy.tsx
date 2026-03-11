import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const RefundPolicy = () => {
    return (
        <div className="min-h-screen bg-background">
            <Header />
            <main className="container py-12">
                <Card className="max-w-4xl mx-auto">
                    <CardHeader>
                        <CardTitle className="text-3xl font-bold text-center">Refund &amp; Cancellation Policy</CardTitle>
                        <p className="text-center text-muted-foreground mt-2">Last Updated: March 2026</p>
                        <p className="text-center text-sm text-muted-foreground">Applicable to: All Business Users and Sellers on the FastFare Platform</p>
                    </CardHeader>
                    <CardContent className="prose dark:prose-invert max-w-none space-y-6">

                        <section>
                            <h3 className="text-xl font-semibold">1. Overview</h3>
                            <p>
                                This Refund and Cancellation Policy governs the terms under which shipment bookings made on the FastFare platform can be cancelled, and under which refunds of wallet amounts or shipping charges may be issued. By using the FastFare platform, you agree to the terms described in this policy.
                            </p>
                            <p>
                                FastFare Logistics Pvt. Ltd. ("FastFare", "we", "us") acts as a technology intermediary between sellers and delivery partners. All shipping charges collected are passed on to delivery partners after deducting applicable platform fees. Refunds are therefore subject to the conditions and timelines described below.
                            </p>
                        </section>

                        <section>
                            <h3 className="text-xl font-semibold">2. Shipment Cancellation</h3>

                            <h4 className="text-lg font-medium mt-4">2.1 Cancellation Before Pickup</h4>
                            <p>A shipment can be cancelled by the seller at no charge if:</p>
                            <ul className="list-disc pl-6 mt-2 space-y-1">
                                <li>The cancellation is made before the delivery partner has scanned/confirmed the pickup</li>
                                <li>The shipment status is still "Booked" or "Pending Pickup" in the dashboard</li>
                            </ul>
                            <p className="mt-2">
                                To cancel: Go to <strong>Shipments → Select the shipment → Click "Cancel Shipment"</strong> from the Actions menu.
                            </p>
                            <p className="mt-2">
                                Upon successful cancellation before pickup, the full shipping charge will be refunded to your FastFare wallet within 24 hours.
                            </p>

                            <h4 className="text-lg font-medium mt-4">2.2 Cancellation After Pickup</h4>
                            <p>
                                Once the delivery partner has confirmed pickup (shipment status changes to "Picked Up" or "In Transit"), cancellation is not permitted. The shipment is already in the delivery partner's custody and the shipping charge is non-refundable at this stage.
                            </p>
                            <p className="mt-2">
                                If you wish to stop a delivery after pickup, please contact FastFare support immediately at <strong>support@fastfare.in</strong>. We will attempt to coordinate with the partner, but cannot guarantee a stop — and if the shipment has already moved beyond the origin hub, it cannot be recalled.
                            </p>

                            <h4 className="text-lg font-medium mt-4">2.3 Cancellation by FastFare or Delivery Partner</h4>
                            <p>FastFare or the assigned delivery partner may cancel a shipment in the following cases:</p>
                            <ul className="list-disc pl-6 mt-2 space-y-1">
                                <li>Pickup address is inaccessible or incorrect</li>
                                <li>Package contains prohibited items</li>
                                <li>The package dimensions or weight far exceed the declared values</li>
                                <li>Force majeure events (natural disaster, curfew, government order)</li>
                            </ul>
                            <p className="mt-2">
                                In such cases, the full shipping charge will be refunded to your FastFare wallet within 48 hours.
                            </p>
                        </section>

                        <section>
                            <h3 className="text-xl font-semibold">3. Refund Policy</h3>

                            <h4 className="text-lg font-medium mt-4">3.1 Wallet Recharge Refunds</h4>
                            <p>
                                Wallet recharges are generally non-refundable once credited to your FastFare wallet. However, a refund of unused wallet balance back to your bank account may be requested in the following circumstances:
                            </p>
                            <ul className="list-disc pl-6 mt-2 space-y-1">
                                <li>Account closure request by the user (subject to verification and pending dues clearance)</li>
                                <li>Accidental duplicate recharge (must be reported within 48 hours with payment proof)</li>
                                <li>Technical failure where money was debited but wallet was not credited</li>
                            </ul>
                            <p className="mt-2">
                                Approved wallet refunds will be processed to the original payment source within 7–10 business days.
                            </p>

                            <h4 className="text-lg font-medium mt-4">3.2 Shipping Charge Refunds</h4>
                            <p>Shipping charges are refunded to your FastFare wallet (not to bank account) in the following cases:</p>
                            <div className="overflow-x-auto mt-3">
                                <table className="w-full text-sm border-collapse">
                                    <thead>
                                        <tr className="border-b">
                                            <th className="text-left py-2 pr-4 font-semibold">Scenario</th>
                                            <th className="text-left py-2 pr-4 font-semibold">Refund Amount</th>
                                            <th className="text-left py-2 font-semibold">Timeline</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y">
                                        <tr><td className="py-2 pr-4">Shipment cancelled before pickup</td><td className="py-2 pr-4">100% of shipping charge</td><td className="py-2">Within 24 hours</td></tr>
                                        <tr><td className="py-2 pr-4">Shipment lost in transit (confirmed)</td><td className="py-2 pr-4">100% of shipping charge</td><td className="py-2">Within 10 business days of loss confirmation</td></tr>
                                        <tr><td className="py-2 pr-4">Shipment delivered to wrong address (partner fault)</td><td className="py-2 pr-4">100% of shipping charge</td><td className="py-2">Within 10 business days of investigation</td></tr>
                                        <tr><td className="py-2 pr-4">Delivery not attempted despite in-transit status</td><td className="py-2 pr-4">100% of shipping charge</td><td className="py-2">Within 7 business days</td></tr>
                                        <tr><td className="py-2 pr-4">Weight discrepancy overcharge</td><td className="py-2 pr-4">Difference amount only</td><td className="py-2">Within 5 business days of dispute resolution</td></tr>
                                        <tr><td className="py-2 pr-4">Duplicate charge due to technical error</td><td className="py-2 pr-4">100% of duplicate amount</td><td className="py-2">Within 48 hours</td></tr>
                                    </tbody>
                                </table>
                            </div>

                            <h4 className="text-lg font-medium mt-4">3.3 Non-Refundable Scenarios</h4>
                            <p>Refunds will <strong>NOT</strong> be issued in the following cases:</p>
                            <ul className="list-disc pl-6 mt-2 space-y-1">
                                <li>Shipment cancelled after pickup confirmation</li>
                                <li>Delivery failed due to wrong address provided by the seller</li>
                                <li>Delivery refused by the consignee (RTO charges still apply)</li>
                                <li>Prohibited or restricted items shipped without disclosure</li>
                                <li>Damage caused by improper packaging by the seller</li>
                                <li>Delay due to natural calamities, strikes, or government-imposed restrictions</li>
                                <li>COD amount disputes arising from consignee claims (these are settled separately)</li>
                            </ul>
                        </section>

                        <section>
                            <h3 className="text-xl font-semibold">4. RTO (Return to Origin) Charges</h3>
                            <p>When a shipment cannot be delivered and is returned to the seller's address (RTO), the following charges apply:</p>
                            <ul className="list-disc pl-6 mt-2 space-y-1">
                                <li><strong>RTO Shipping Charge:</strong> Charged at the same rate as the forward shipment (or as defined by the delivery partner's rate card)</li>
                                <li>RTO charges are non-refundable once the return shipment is initiated</li>
                                <li>RTO charges are auto-deducted from the seller's wallet when the return shipment is booked</li>
                                <li>Sellers can reduce RTO by ensuring accurate consignee details, reachable phone numbers, and correct delivery addresses at the time of shipment creation</li>
                            </ul>
                        </section>

                        <section>
                            <h3 className="text-xl font-semibold">5. COD Remittance &amp; Disputes</h3>

                            <h4 className="text-lg font-medium mt-4">5.1 COD Collection</h4>
                            <ul className="list-disc pl-6 mt-2 space-y-1">
                                <li>For COD shipments, the delivery partner collects cash from the consignee at the time of delivery</li>
                                <li>The collected amount is remitted to FastFare, which then credits it to the seller's FastFare wallet</li>
                            </ul>

                            <h4 className="text-lg font-medium mt-4">5.2 COD Remittance Timeline</h4>
                            <ul className="list-disc pl-6 mt-2 space-y-1">
                                <li>COD amounts are typically remitted to the seller's wallet within 2–7 business days after successful delivery confirmation</li>
                                <li>Delays beyond 10 business days must be reported to <strong>support@fastfare.in</strong> with the AWB number</li>
                            </ul>

                            <h4 className="text-lg font-medium mt-4">5.3 COD Disputes</h4>
                            <ul className="list-disc pl-6 mt-2 space-y-1">
                                <li>If a COD delivery is marked as delivered but payment was not collected, raise a dispute ticket within 48 hours of the delivery notification</li>
                                <li>FastFare will investigate with the delivery partner within 7 business days</li>
                                <li>If the partner confirms non-collection, the shipping charge for that order will be refunded to your wallet</li>
                            </ul>
                        </section>

                        <section>
                            <h3 className="text-xl font-semibold">6. Damaged or Lost Shipments</h3>

                            <h4 className="text-lg font-medium mt-4">6.1 Damaged Shipments</h4>
                            <ul className="list-disc pl-6 mt-2 space-y-1">
                                <li>If a shipment arrives damaged at the consignee's location, raise a claim within 48 hours of delivery with photographic evidence</li>
                                <li>Claims submitted after 48 hours will not be accepted</li>
                                <li>FastFare will coordinate with the delivery partner for investigation</li>
                                <li>If damage is confirmed as partner fault, the shipping charge will be refunded to your wallet within 10 business days</li>
                                <li>Compensation for the declared value of the shipment, if applicable, is subject to the delivery partner's insurance terms</li>
                            </ul>

                            <h4 className="text-lg font-medium mt-4">6.2 Lost Shipments</h4>
                            <ul className="list-disc pl-6 mt-2 space-y-1">
                                <li>A shipment is considered lost if it has not been delivered or updated for more than 15 business days from the booking date</li>
                                <li>Report a lost shipment immediately by raising a support ticket with the AWB number</li>
                                <li>FastFare will investigate with the delivery partner. If loss is confirmed, 100% of the shipping charge is refunded to your wallet</li>
                                <li>Compensation for the declared value of goods may be available under the partner's applicable insurance, subject to claim approval</li>
                            </ul>
                        </section>

                        <section>
                            <h3 className="text-xl font-semibold">7. How to Raise a Refund or Cancellation Request</h3>
                            <ol className="list-decimal pl-6 mt-2 space-y-1">
                                <li>Log in to your FastFare dashboard</li>
                                <li>Go to <strong>Shipments</strong> and locate the relevant AWB number</li>
                                <li>Click <strong>"Need Help"</strong> or navigate to <strong>Support Center</strong></li>
                                <li>Select the appropriate issue type (Cancellation / Refund / Lost / Damaged)</li>
                                <li>Provide required details and submit the ticket</li>
                            </ol>
                            <p className="mt-3">
                                Alternatively, email us at <strong>support@fastfare.in</strong> with your AWB number, registered email address, and a brief description of the issue.
                            </p>
                        </section>

                        <section>
                            <h3 className="text-xl font-semibold">8. Policy Updates</h3>
                            <p>
                                FastFare reserves the right to update this Refund &amp; Cancellation Policy at any time. Changes will be communicated via email or a notice on the platform. Continued use of the platform after any changes constitutes your acceptance of the revised policy.
                            </p>
                        </section>

                        <section>
                            <h3 className="text-xl font-semibold">9. Contact Us</h3>
                            <p>For refund and cancellation queries, reach us at:</p>
                            <address className="mt-2 not-italic">
                                <strong>Customer Support</strong><br />
                                FastFare Logistics Pvt. Ltd.<br />
                                Email: support@fastfare.in<br />
                                Hours: Monday–Saturday, 9 AM – 7 PM IST
                            </address>
                        </section>

                    </CardContent>
                </Card>
            </main>
            <Footer />
        </div>
    );
};

export default RefundPolicy;
