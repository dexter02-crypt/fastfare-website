import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const TermsOfService = () => {
    return (
        <div className="min-h-screen bg-background">
            <Header />
            <main className="container py-12">
                <Card className="max-w-4xl mx-auto">
                    <CardHeader>
                        <CardTitle className="text-3xl font-bold text-center">Terms of Service</CardTitle>
                        <p className="text-center text-muted-foreground mt-2">Effective Date: February 12, 2026</p>
                        <p className="text-center text-sm text-muted-foreground">Applicable to: All Sellers and Users of the FastFare Platform</p>
                    </CardHeader>
                    <CardContent className="prose dark:prose-invert max-w-none space-y-6">
                        <section>
                            <h3 className="text-xl font-semibold">1. Agreement to Terms</h3>
                            <p>
                                These Terms of Service ("Terms") constitute a legally binding agreement between you—whether personally or on behalf of a business entity ("Seller," "User," or "you")—and FastFare Logistics Pvt. Ltd. ("FastFare," "we," "us," or "our"), governing your access to and use of the FastFare B2B logistics aggregation and settlement platform, including the website, dashboard, APIs, and all associated services (collectively, the "Platform").
                            </p>
                            <p>
                                By registering an account, accessing, or using any part of the Platform, you acknowledge that you have read, understood, and agree to be bound by these Terms, our Privacy Policy, Acceptable Use Policy, and all other policies referenced herein. If you do not agree to these Terms, you must immediately cease all use of the Platform.
                            </p>
                        </section>

                        <section>
                            <h3 className="text-xl font-semibold">2. Definitions</h3>
                            <ul className="list-disc pl-6 mt-2 space-y-2">
                                <li><strong>"Platform"</strong> means the FastFare website, seller dashboard, admin panel, partner panel, APIs, mobile applications, and all related tools and services.</li>
                                <li><strong>"Seller"</strong> means any individual or business entity registered on the Platform for the purpose of shipping goods using FastFare's logistics aggregation services.</li>
                                <li><strong>"Partner"</strong> means any delivery or logistics service provider integrated into the Platform for performing pickup, transit, and delivery operations.</li>
                                <li><strong>"Order"</strong> means a shipment request created by a Seller through the Platform.</li>
                                <li><strong>"RTD (Return to Destination)"</strong> means an order successfully delivered to the consignee, as confirmed within the Platform.</li>
                                <li><strong>"RTO (Return to Origin)"</strong> means an order that could not be delivered and is returned to the Seller's origin address.</li>
                                <li><strong>"Settlement"</strong> means the release of funds from the held/pending ledger to the Seller's available-for-withdrawal balance after the tier-based settlement cycle is completed.</li>
                                <li><strong>"Tier"</strong> means the membership level (Bronze, Silver, or Gold) assigned to a Seller based on performance thresholds.</li>
                                <li><strong>"COD"</strong> means Cash on Delivery, where the consignee pays the order value at the time of delivery.</li>
                                <li><strong>"Platform Fee"</strong> means the service charge levied by FastFare on each processed order.</li>
                            </ul>
                        </section>

                        <section>
                            <h3 className="text-xl font-semibold">3. Eligibility</h3>
                            <p>To use the Platform, you represent and warrant that:</p>
                            <ul className="list-disc pl-6 mt-2 space-y-1">
                                <li>You are at least 18 years of age and have the legal capacity to enter into binding agreements.</li>
                                <li>If registering on behalf of a business entity, you have the authority to bind such entity to these Terms.</li>
                                <li>All registration information you provide is true, accurate, current, and complete.</li>
                                <li>You will maintain the accuracy of such information and promptly update it as necessary.</li>
                                <li>You hold all necessary licenses, permits, and registrations required for your business operations, including but not limited to GSTIN, PAN, Trade License, and any other applicable registrations.</li>
                                <li>You are not barred from using the Platform under any applicable laws or regulations.</li>
                            </ul>
                        </section>

                        <section>
                            <h3 className="text-xl font-semibold">4. Account Registration and Security</h3>
                            <p>
                                To access the Platform, you must create a Seller account by providing all required information, including but not limited to your legal business name, GSTIN, PAN, registered address, bank account details, and authorized contact details. You are solely responsible for maintaining the confidentiality of your account credentials. Any activity that occurs under your account is your responsibility.
                            </p>
                            <p>
                                You must immediately notify FastFare of any unauthorized use of your account or any other breach of security. FastFare will not be liable for any loss or damage arising from your failure to comply with this obligation.
                            </p>
                            <p>
                                FastFare reserves the right to suspend or terminate any account that is found to be in violation of these Terms, or where fraudulent, illegal, or suspicious activity is detected.
                            </p>
                        </section>

                        <section>
                            <h3 className="text-xl font-semibold">5. Platform Services</h3>
                            <p>FastFare operates as a B2B logistics aggregation and financial settlement engine. The Platform provides the following services:</p>
                            <ul className="list-disc pl-6 mt-2 space-y-1">
                                <li>Multi-carrier logistics aggregation with automated partner assignment.</li>
                                <li>Shipment creation, label generation, and tracking.</li>
                                <li>Order lifecycle management (Created → Picked → In Transit → Delivered/RTO).</li>
                                <li>Tier-based financial settlement with automated reconciliation.</li>
                                <li>COD collection management and payout processing.</li>
                                <li>Professional seller dashboard with analytics, reporting, and performance monitoring.</li>
                                <li>Wallet management and balance tracking.</li>
                                <li>Return-to-Origin (RTO) management and reverse logistics.</li>
                                <li>Bulk shipment processing.</li>
                            </ul>
                            <p>
                                FastFare acts solely as a logistics aggregation platform. We do not take ownership or possession of any goods shipped through our Platform. The Seller retains full ownership and liability for the goods at all times.
                            </p>
                        </section>

                        <section>
                            <h3 className="text-xl font-semibold">6. Tier Membership Structure</h3>
                            <p>
                                All Sellers are assigned a tier (Bronze, Silver, or Gold) that determines their settlement cycle speed, service priority, and enhanced analytics access. Tier assignment is based on performance metrics evaluated on a monthly basis. Details of tier benefits, settlement cycles, upgrade/downgrade thresholds, and feature enhancements are governed by the <strong>Tier Membership Policy</strong>.
                            </p>
                            <p>
                                All Sellers receive a standardized professional dashboard interface regardless of tier. Tier-based feature enhancements are layered on top of the standard dashboard and do not restrict access to core functionality.
                            </p>
                        </section>

                        <section>
                            <h3 className="text-xl font-semibold">7. Settlement and Financial Terms</h3>
                            <p>
                                Settlement of funds is governed by the <strong>Settlement & Payout Policy</strong> and the <strong>COD Reconciliation & Refund Policy</strong>. Key principles include:
                            </p>
                            <ul className="list-disc pl-6 mt-2 space-y-1">
                                <li>Settlement is triggered only after an order is marked as Delivered (RTD) within the Platform.</li>
                                <li>The settlement timer begins on the date of delivery confirmation and is calculated as: <code>SettlementDate = DeliveryDate + TierSettlementDays</code>.</li>
                                <li>Bronze: 7-day settlement cycle; Silver: 5-day cycle; Gold: 3-day cycle.</li>
                                <li>Seller earnings are calculated as: <code>SellerEarning = OrderValue − ShippingCharges − PlatformFee</code>.</li>
                                <li>Funds move from "Pending Settlement" to "Available for Withdrawal" only after the tier-based timer completes.</li>
                                <li>All transactions are recorded in an immutable settlement ledger for audit compliance.</li>
                            </ul>
                        </section>

                        <section>
                            <h3 className="text-xl font-semibold">8. Fees and Charges</h3>
                            <p>
                                FastFare charges the following fees, which may be updated from time to time with prior notice:
                            </p>
                            <ul className="list-disc pl-6 mt-2 space-y-1">
                                <li><strong>Shipping Charges:</strong> Based on weight, dimensions, origin-destination pair, and selected delivery partner's rate card.</li>
                                <li><strong>Platform Fee:</strong> A per-order service fee deducted from settlement amounts.</li>
                                <li><strong>COD Handling Fee:</strong> An additional charge for Cash on Delivery orders to cover collection and reconciliation costs.</li>
                                <li><strong>RTO Charges:</strong> Reverse logistics charges applicable when an order is returned to origin.</li>
                                <li><strong>Label/Manifest Charges:</strong> If applicable, charges for label generation and manifest processing.</li>
                            </ul>
                            <p>
                                All fees are exclusive of applicable taxes (GST). Tax invoices will be generated for all charges. Payment methods accepted include UPI, Net Banking, credit/debit cards, and wallet balance.
                            </p>
                        </section>

                        <section>
                            <h3 className="text-xl font-semibold">9. Seller Obligations</h3>
                            <p>As a Seller on the Platform, you agree to:</p>
                            <ul className="list-disc pl-6 mt-2 space-y-1">
                                <li>Provide accurate shipment details including consignee information, weight, dimensions, declared value, and payment mode.</li>
                                <li>Ensure all goods comply with applicable laws and are not prohibited, restricted, or hazardous materials.</li>
                                <li>Package goods securely to prevent damage during transit.</li>
                                <li>Make parcels available for pickup within the scheduled pickup window.</li>
                                <li>Maintain accurate records and respond to disputes, claims, and chargebacks promptly.</li>
                                <li>Not misrepresent the weight, dimensions, or value of shipments to avoid correct billing.</li>
                                <li>Comply with all applicable Indian laws including but not limited to the Indian Contract Act, Consumer Protection Act, IT Act, and GST laws.</li>
                            </ul>
                        </section>

                        <section>
                            <h3 className="text-xl font-semibold">10. Prohibited Activities</h3>
                            <p>You may not use the Platform to:</p>
                            <ul className="list-disc pl-6 mt-2 space-y-1">
                                <li>Ship prohibited, illegal, hazardous, or restricted goods as defined by Indian law and carrier policies.</li>
                                <li>Engage in fraudulent activity, including but not limited to fake orders, inflated COD values, or weight manipulation.</li>
                                <li>Circumvent or attempt to circumvent Platform security measures, rate limits, or settlement logic.</li>
                                <li>Use automated bots, scrapers, or other tools to access the Platform without authorization.</li>
                                <li>Create multiple accounts to exploit promotions, tier benefits, or settlement cycles.</li>
                                <li>Interfere with or disrupt the integrity or performance of the Platform.</li>
                            </ul>
                            <p>Violation of these prohibitions may result in immediate account suspension, forfeiture of pending settlements, and legal action.</p>
                        </section>

                        <section>
                            <h3 className="text-xl font-semibold">11. Intellectual Property</h3>
                            <p>
                                The Platform, including all source code, databases, functionality, software, website designs, text, graphics, logos, and trademarks ("Content"), is the proprietary property of FastFare and is protected under Indian intellectual property laws. You are granted a limited, non-exclusive, non-transferable license to use the Platform solely for the purposes described in these Terms.
                            </p>
                            <p>
                                You may not reproduce, distribute, modify, create derivative works from, publicly display, or exploit any Content without prior written consent from FastFare. Any feedback, suggestions, or ideas you provide regarding the Platform may be used by FastFare without obligation to compensate you.
                            </p>
                        </section>

                        <section>
                            <h3 className="text-xl font-semibold">12. Limitation of Liability</h3>
                            <p>
                                TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, FASTFARE SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING BUT NOT LIMITED TO LOSS OF PROFITS, REVENUE, DATA, OR BUSINESS OPPORTUNITIES, ARISING OUT OF OR IN CONNECTION WITH YOUR USE OF THE PLATFORM.
                            </p>
                            <p>
                                FastFare's total aggregate liability for any claims arising from these Terms shall not exceed the total fees paid by you to FastFare during the twelve (12) months immediately preceding the event giving rise to the claim. FastFare is not liable for delays, losses, or damages caused by delivery partners, carriers, natural disasters, government actions, or other force majeure events.
                            </p>
                        </section>

                        <section>
                            <h3 className="text-xl font-semibold">13. Indemnification</h3>
                            <p>
                                You agree to indemnify, defend, and hold harmless FastFare, its officers, directors, employees, agents, and affiliates from and against any and all claims, damages, losses, liabilities, costs, and expenses (including reasonable attorneys' fees) arising from: (a) your use of the Platform; (b) your violation of these Terms; (c) your violation of any third-party rights; (d) the goods you ship through the Platform; or (e) any fraudulent, negligent, or wrongful act or omission by you.
                            </p>
                        </section>

                        <section>
                            <h3 className="text-xl font-semibold">14. Modifications to Terms</h3>
                            <p>
                                FastFare reserves the right to modify these Terms at any time. We will provide notice of material changes by posting the updated Terms on the Platform and updating the "Effective Date." Your continued use of the Platform after the effective date of any modifications constitutes your acceptance of the revised Terms. If you do not agree to the modified Terms, you must discontinue use of the Platform.
                            </p>
                        </section>

                        <section>
                            <h3 className="text-xl font-semibold">15. Account Suspension and Termination</h3>
                            <p>
                                FastFare may suspend or terminate your account at any time, with or without notice, for any reason including but not limited to: violation of these Terms, fraudulent activity, excessive RTO rates, non-compliance with KYC requirements, or failure to resolve disputes. Upon termination:
                            </p>
                            <ul className="list-disc pl-6 mt-2 space-y-1">
                                <li>All pending settlements will be held for a minimum period of 90 days to account for chargebacks and disputes.</li>
                                <li>Any outstanding fees or charges owed to FastFare will be deducted from held funds.</li>
                                <li>Remaining eligible funds will be released after the hold period, subject to verification.</li>
                                <li>You must cease all use of the Platform and its services immediately.</li>
                            </ul>
                        </section>

                        <section>
                            <h3 className="text-xl font-semibold">16. Dispute Resolution</h3>
                            <p>
                                Any disputes arising out of or relating to these Terms shall first be attempted to be resolved through good-faith negotiation between the parties for a period of thirty (30) days. If the dispute cannot be resolved through negotiation, it shall be referred to binding arbitration under the Arbitration and Conciliation Act, 1996 of India. The arbitration shall be conducted by a sole arbitrator appointed by mutual consent, with the seat of arbitration in Mumbai, Maharashtra, India.
                            </p>
                        </section>

                        <section>
                            <h3 className="text-xl font-semibold">17. Governing Law</h3>
                            <p>
                                These Terms shall be governed by and construed in accordance with the laws of India, without regard to conflict of law principles. Subject to the arbitration clause above, the courts of Mumbai, Maharashtra shall have exclusive jurisdiction over any legal proceedings arising from these Terms.
                            </p>
                        </section>

                        <section>
                            <h3 className="text-xl font-semibold">18. Severability</h3>
                            <p>
                                If any provision of these Terms is found to be invalid, illegal, or unenforceable, the remaining provisions shall continue in full force and effect. The invalid provision shall be modified to the minimum extent necessary to make it valid and enforceable while preserving its original intent.
                            </p>
                        </section>

                        <section>
                            <h3 className="text-xl font-semibold">19. Entire Agreement</h3>
                            <p>
                                These Terms, together with the Privacy Policy, Acceptable Use Policy, Tier Membership Policy, Settlement & Payout Policy, COD Reconciliation & Refund Policy, Shipping & Delivery Policy, RTO & Cancellation Policy, and all other policies referenced herein, constitute the entire agreement between you and FastFare concerning the Platform and supersede all prior agreements, communications, and understandings.
                            </p>
                        </section>

                        <section>
                            <h3 className="text-xl font-semibold">20. Contact Information</h3>
                            <p>For questions regarding these Terms, please contact us at:</p>
                            <address className="mt-2 not-italic">
                                <strong>FastFare Logistics Pvt. Ltd.</strong><br />
                                Email: legal@fastfare.in<br />
                                Phone: +91-XXXX-XXXXXX<br />
                                Registered Office: Mumbai, Maharashtra, India
                            </address>
                        </section>
                    </CardContent>
                </Card>
            </main>
            <Footer />
        </div>
    );
};

export default TermsOfService;
