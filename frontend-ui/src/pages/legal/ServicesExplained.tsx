import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const ServicesExplained = () => {
    return (
        <div className="min-h-screen bg-background">
            <Header />
            <main className="container py-12">
                <Card className="max-w-4xl mx-auto">
                    <CardHeader>
                        <CardTitle className="text-3xl font-bold text-center">Services Explained</CardTitle>
                        <p className="text-center text-muted-foreground mt-2">Last Updated: March 2026</p>
                        <p className="text-center text-sm text-muted-foreground">Applicable to: All Business Users and Sellers on the FastFare Platform</p>
                    </CardHeader>
                    <CardContent className="prose dark:prose-invert max-w-none space-y-6">

                        <section>
                            <h3 className="text-xl font-semibold">1. What is FastFare?</h3>
                            <p>
                                FastFare is a B2B logistics platform that connects businesses — sellers, e-commerce operators, and enterprises — with verified local delivery partners across India. We provide a single dashboard to book shipments, generate labels and barcodes, track deliveries in real time, manage returns, and handle billing — all in one place.
                            </p>
                            <p>
                                FastFare does not own any trucks or employ any delivery personnel directly. We are a technology platform that enables businesses to access a network of registered delivery partners and manage their logistics operations end-to-end.
                            </p>
                        </section>

                        <section>
                            <h3 className="text-xl font-semibold">2. Who Can Use FastFare?</h3>
                            <p>FastFare is designed for:</p>
                            <ul className="list-disc pl-6 mt-2 space-y-2">
                                <li><strong>Business Sellers & E-commerce Operators</strong> — Any registered business or individual seller who needs to ship products to customers across India.</li>
                                <li><strong>Delivery Partners</strong> — Logistics companies, fleet owners, and transport operators who want to offer their services to businesses through the FastFare platform.</li>
                                <li><strong>Warehouse & Fulfillment Users</strong> — Businesses that use FastFare's WMS (Warehouse Management System) features for inbound, inventory, and outbound operations.</li>
                            </ul>
                            <p className="mt-3">
                                To create a business account, you must complete KYC verification including GSTIN and identity proof. Unverified accounts have limited access to shipment booking and wallet features.
                            </p>
                        </section>

                        <section>
                            <h3 className="text-xl font-semibold">3. Shipment Booking</h3>

                            <h4 className="text-lg font-medium mt-4">3.1 How to Book a Shipment</h4>
                            <p>To book a shipment on FastFare:</p>
                            <ol className="list-decimal pl-6 mt-2 space-y-1">
                                <li>Log in to your dashboard and click "New Shipment"</li>
                                <li>Enter the pickup address and delivery address (or select from saved addresses)</li>
                                <li>Enter package details — weight, dimensions, declared value, and content type</li>
                                <li>Select a delivery partner and service type (Standard or Express) from the available options</li>
                                <li>Choose payment mode (Prepaid or COD)</li>
                                <li>Confirm and pay from your wallet balance</li>
                                <li>Download or print the auto-generated shipping label</li>
                            </ol>

                            <h4 className="text-lg font-medium mt-4">3.2 Shipment Label & Barcode</h4>
                            <p>Every confirmed shipment generates a unique barcode label containing:</p>
                            <ul className="list-disc pl-6 mt-2 space-y-1">
                                <li>AWB (Air Waybill) number</li>
                                <li>Pickup and delivery address</li>
                                <li>Package details and declared value</li>
                                <li>Assigned delivery partner information</li>
                            </ul>
                            <p className="mt-2">
                                This label must be affixed to the package before the delivery partner arrives for pickup. The barcode is scannable by delivery partners at pickup to confirm consignment details.
                            </p>

                            <h4 className="text-lg font-medium mt-4">3.3 Minimum Requirements</h4>
                            <ul className="list-disc pl-6 mt-2 space-y-1">
                                <li>Minimum chargeable weight: 0.5 kg</li>
                                <li>Maximum single-piece weight: as defined by the selected partner's service limits</li>
                                <li>Packages must be properly sealed and labelled before pickup</li>
                            </ul>
                        </section>

                        <section>
                            <h3 className="text-xl font-semibold">4. Service Types</h3>

                            <h4 className="text-lg font-medium mt-4">4.1 Standard Delivery</h4>
                            <ul className="list-disc pl-6 mt-2 space-y-1">
                                <li>Estimated delivery: 3–5 business days depending on route and partner</li>
                                <li>Best for non-urgent, bulk, or cost-sensitive shipments</li>
                                <li>Lower per-kg rate compared to Express</li>
                                <li>COD available (subject to partner)</li>
                            </ul>

                            <h4 className="text-lg font-medium mt-4">4.2 Express Delivery</h4>
                            <ul className="list-disc pl-6 mt-2 space-y-1">
                                <li>Estimated delivery: 1–2 business days</li>
                                <li>Best for time-sensitive shipments</li>
                                <li>Higher per-kg rate applies</li>
                                <li>COD availability depends on the delivery partner</li>
                            </ul>

                            <h4 className="text-lg font-medium mt-4">4.3 Same-Day Delivery</h4>
                            <ul className="list-disc pl-6 mt-2 space-y-1">
                                <li>Available in select cities only (subject to partner availability and route)</li>
                                <li>Must be booked before the cutoff time specified by the partner</li>
                                <li>Premium pricing applies</li>
                            </ul>

                            <h4 className="text-lg font-medium mt-4">4.4 COD (Cash on Delivery)</h4>
                            <ul className="list-disc pl-6 mt-2 space-y-1">
                                <li>Available only on shipments where the delivery partner supports COD</li>
                                <li>A COD handling charge is added to the shipping cost at checkout</li>
                                <li>COD amount collected from consignee is remitted to the seller's FastFare wallet after settlement (typically within 2–7 business days post-delivery)</li>
                            </ul>
                        </section>

                        <section>
                            <h3 className="text-xl font-semibold">5. Pickup & Delivery Process</h3>

                            <h4 className="text-lg font-medium mt-4">5.1 Pickup</h4>
                            <ul className="list-disc pl-6 mt-2 space-y-1">
                                <li>After booking, the assigned delivery partner will arrive at the pickup address within the scheduled pickup window</li>
                                <li>The driver will scan the shipment label at pickup to confirm collection</li>
                                <li>You will receive a real-time notification when your shipment is picked up</li>
                            </ul>

                            <h4 className="text-lg font-medium mt-4">5.2 In Transit</h4>
                            <ul className="list-disc pl-6 mt-2 space-y-1">
                                <li>You can track your shipment in real time from your dashboard under "Shipments"</li>
                                <li>Status updates are provided at each milestone: Pickup Confirmed → In Transit → Out for Delivery → Delivered</li>
                                <li>A live location view of the assigned driver is available on shipments in transit</li>
                            </ul>

                            <h4 className="text-lg font-medium mt-4">5.3 Delivery Attempt</h4>
                            <ul className="list-disc pl-6 mt-2 space-y-1">
                                <li>Delivery partners will make up to 3 delivery attempts at the consignee's address</li>
                                <li>If the consignee is unavailable on all 3 attempts, the shipment will be marked as RTO (Return to Origin) and returned to the seller's address</li>
                                <li>RTO charges as per the selected partner's rate card will apply</li>
                            </ul>

                            <h4 className="text-lg font-medium mt-4">5.4 Failed Delivery & RTO</h4>
                            <ul className="list-disc pl-6 mt-2 space-y-1">
                                <li>RTO (Return to Origin) is initiated when: consignee refuses delivery, address is incorrect, or 3 attempts fail</li>
                                <li>RTO shipments are tracked separately and the seller is notified at each stage</li>
                                <li>Return shipping charges will be deducted from the seller's wallet</li>
                            </ul>
                        </section>

                        <section>
                            <h3 className="text-xl font-semibold">6. Prohibited Items</h3>
                            <p>The following items are strictly prohibited from being shipped through FastFare:</p>
                            <ul className="list-disc pl-6 mt-2 space-y-1">
                                <li>Narcotics, controlled substances, and illegal drugs</li>
                                <li>Currency, coins, and negotiable instruments</li>
                                <li>Firearms, ammunition, and explosive materials</li>
                                <li>Live animals or animal products requiring special permits</li>
                                <li>Human remains or biological hazardous material</li>
                                <li>Counterfeit goods or items infringing intellectual property rights</li>
                                <li>Perishable food items unless using a partner specifically certified for cold chain</li>
                                <li>Liquids or hazardous chemicals without proper declaration and packaging</li>
                            </ul>
                            <p className="mt-3">
                                FastFare reserves the right to reject, hold, or return any shipment found to contain prohibited items. Repeated violations may result in account suspension.
                            </p>
                        </section>

                        <section>
                            <h3 className="text-xl font-semibold">7. Wallet & Payments</h3>

                            <h4 className="text-lg font-medium mt-4">7.1 Wallet Recharge</h4>
                            <ul className="list-disc pl-6 mt-2 space-y-1">
                                <li>FastFare uses a prepaid wallet system. You must maintain sufficient wallet balance to book shipments</li>
                                <li>Recharge your wallet from the Billing section using UPI, Net Banking, or Debit/Credit Card</li>
                                <li>Minimum recharge: ₹200 | Maximum single recharge: ₹2,00,000</li>
                            </ul>

                            <h4 className="text-lg font-medium mt-4">7.2 How Charges Are Deducted</h4>
                            <ul className="list-disc pl-6 mt-2 space-y-1">
                                <li>Shipping charges are deducted from your wallet at the time of shipment booking</li>
                                <li>If your wallet balance is insufficient, the shipment cannot be confirmed</li>
                                <li>Weight discrepancy adjustments (if the actual weight differs from declared weight) will be applied after delivery</li>
                            </ul>

                            <h4 className="text-lg font-medium mt-4">7.3 GST</h4>
                            <ul className="list-disc pl-6 mt-2 space-y-1">
                                <li>18% GST is applicable on all shipping charges as per Indian tax regulations</li>
                                <li>A GST-compliant invoice is available for download from the Billing section for every transaction</li>
                            </ul>
                        </section>

                        <section>
                            <h3 className="text-xl font-semibold">8. Tracking & Notifications</h3>
                            <ul className="list-disc pl-6 mt-2 space-y-1">
                                <li>All shipments are trackable in real time from your FastFare dashboard</li>
                                <li>You can share a public tracking link with your customer from the Shipment Details page</li>
                                <li>Automated SMS/email notifications are sent to the consignee at key milestones (if enabled in Settings)</li>
                                <li>Driver live location is visible for in-transit shipments on supported routes</li>
                            </ul>
                        </section>

                        <section>
                            <h3 className="text-xl font-semibold">9. Weight & Dimension Verification</h3>
                            <p>
                                All shipments are subject to weight verification by the delivery partner at pickup. If the actual weight or volumetric weight (L×W×H÷5000) exceeds the declared weight, a weight discrepancy charge will be levied based on the difference. Sellers are advised to declare accurate weight and dimensions to avoid disputes.
                            </p>
                        </section>

                        <section>
                            <h3 className="text-xl font-semibold">10. Support & Dispute Resolution</h3>
                            <p>
                                For any shipment-related issues — including delayed delivery, damaged goods, or missing packages — raise a support ticket from the "Need Help" section of your dashboard within 7 days of the expected delivery date. FastFare will coordinate with the delivery partner to resolve the issue within 5–10 business days.
                            </p>
                            <p className="mt-2">
                                For billing disputes, contact <strong>support@fastfare.in</strong> with your invoice number and issue description.
                            </p>
                        </section>

                    </CardContent>
                </Card>
            </main>
            <Footer />
        </div>
    );
};

export default ServicesExplained;
