import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const SellerRegistrationPolicy = () => {
    return (
        <div className="min-h-screen bg-background">
            <Header />
            <main className="container py-12">
                <Card className="max-w-4xl mx-auto">
                    <CardHeader>
                        <CardTitle className="text-3xl font-bold text-center">Seller Registration & KYC Policy</CardTitle>
                        <p className="text-center text-muted-foreground mt-2">Effective Date: February 12, 2026</p>
                        <p className="text-center text-sm text-muted-foreground">Applicable to: All Sellers registering on the FastFare Platform</p>
                    </CardHeader>
                    <CardContent className="prose dark:prose-invert max-w-none space-y-6">
                        <section>
                            <h3 className="text-xl font-semibold">1. Overview</h3>
                            <p>
                                This Seller Registration & KYC Policy outlines the requirements, procedures, and obligations for businesses and individuals registering as Sellers on the FastFare B2B logistics aggregation and settlement platform. Completion of KYC (Know Your Customer) verification is mandatory before any seller can access settlement features, create shipments, or receive payouts.
                            </p>
                        </section>

                        <section>
                            <h3 className="text-xl font-semibold">2. Eligibility Criteria</h3>
                            <p>To register as a Seller on FastFare, you must meet the following criteria:</p>
                            <ul className="list-disc pl-6 mt-2 space-y-1">
                                <li>Be a legally registered business entity (proprietorship, partnership, LLP, private limited, or public limited company) operating within India.</li>
                                <li>Hold a valid Goods and Services Tax Identification Number (GSTIN) or be registered for GST exemption where applicable.</li>
                                <li>Hold a valid Permanent Account Number (PAN) in the name of the business or its proprietor/directors.</li>
                                <li>Maintain a functional bank account in the name of the registered business entity.</li>
                                <li>The authorized signatory must be at least 18 years of age with legal capacity to enter into binding agreements.</li>
                                <li>The business must not be part of any debarred, blacklisted, or sanctioned entity list maintained by Indian regulatory authorities.</li>
                            </ul>
                        </section>

                        <section>
                            <h3 className="text-xl font-semibold">3. Registration Process</h3>
                            <p>The seller registration process follows these steps:</p>
                            <ol className="list-decimal pl-6 mt-2 space-y-2">
                                <li><strong>Account Creation:</strong> Register using a valid business email and mobile number. Verify both via OTP (One-Time Password) authentication.</li>
                                <li><strong>Business Profile Setup:</strong> Provide legal business name, trade name, business type, industry category, registered address, and warehouse/pickup addresses.</li>
                                <li><strong>KYC Document Submission:</strong> Upload all required KYC documents as specified in Section 4 below.</li>
                                <li><strong>Bank Account Linking:</strong> Add bank account details for settlement payouts, including account number, IFSC code, and account holder name. Bank verification will be conducted via penny drop verification or cancelled cheque verification.</li>
                                <li><strong>Verification Review:</strong> FastFare's verification team reviews submitted documents within 2–5 business days. Additional documents may be requested if initial submissions are insufficient.</li>
                                <li><strong>Account Activation:</strong> Upon successful verification, the seller account is activated with Bronze tier status and default settlement cycle of 7 days.</li>
                            </ol>
                        </section>

                        <section>
                            <h3 className="text-xl font-semibold">4. Required KYC Documents</h3>

                            <h4 className="text-lg font-medium mt-4">4.1 For Proprietorship Firms</h4>
                            <ul className="list-disc pl-6 mt-2 space-y-1">
                                <li>PAN card of the proprietor.</li>
                                <li>Aadhaar card or Voter ID or Passport of the proprietor.</li>
                                <li>GSTIN certificate.</li>
                                <li>Current address proof (utility bill, rental agreement, or property deed).</li>
                                <li>Cancelled cheque or bank statement (first page) of the business bank account.</li>
                            </ul>

                            <h4 className="text-lg font-medium mt-4">4.2 For Partnership Firms / LLPs</h4>
                            <ul className="list-disc pl-6 mt-2 space-y-1">
                                <li>Partnership deed or LLP agreement.</li>
                                <li>PAN card of the firm/LLP.</li>
                                <li>PAN and Aadhaar of all partners (or authorized signatories).</li>
                                <li>GSTIN certificate.</li>
                                <li>Certificate of registration (for LLPs).</li>
                                <li>Cancelled cheque or bank statement of the firm's bank account.</li>
                                <li>Authorization letter designating the authorized signatory for FastFare operations.</li>
                            </ul>

                            <h4 className="text-lg font-medium mt-4">4.3 For Private Limited / Public Limited Companies</h4>
                            <ul className="list-disc pl-6 mt-2 space-y-1">
                                <li>Certificate of Incorporation.</li>
                                <li>Memorandum and Articles of Association (MOA/AOA).</li>
                                <li>PAN card of the company.</li>
                                <li>PAN and Aadhaar of directors and authorized signatories.</li>
                                <li>GSTIN certificate.</li>
                                <li>Board resolution authorizing the use of FastFare Platform and designating the authorized signatory.</li>
                                <li>Cancelled cheque or bank statement of the company's bank account.</li>
                            </ul>
                        </section>

                        <section>
                            <h3 className="text-xl font-semibold">5. Document Verification Standards</h3>
                            <p>All submitted documents must meet the following standards:</p>
                            <ul className="list-disc pl-6 mt-2 space-y-1">
                                <li>Documents must be clear, legible, and in color (scanned copies or high-quality photographs accepted).</li>
                                <li>Supported formats: PDF, JPG, JPEG, PNG. Maximum file size: 5 MB per document.</li>
                                <li>Self-attested copies are required for identity and address proof documents.</li>
                                <li>Documents must be current and not expired. Government-issued IDs must have at least 3 months of validity remaining.</li>
                                <li>Business registration documents should reflect the current business name and address.</li>
                            </ul>
                        </section>

                        <section>
                            <h3 className="text-xl font-semibold">6. Bank Account Verification</h3>
                            <p>
                                FastFare verifies bank account ownership through one or more of the following methods:
                            </p>
                            <ul className="list-disc pl-6 mt-2 space-y-1">
                                <li><strong>Penny Drop Verification:</strong> A small amount (₹1) is deposited into the linked bank account. The seller must confirm receipt and the details shown in their bank statement.</li>
                                <li><strong>Cancelled Cheque Verification:</strong> The account holder name, account number, and IFSC code on the cancelled cheque must match the information provided during registration.</li>
                                <li><strong>Bank Statement Verification:</strong> First page of a recent bank statement showing account holder name, account number, and IFSC code.</li>
                            </ul>
                            <p>
                                Settlement payouts will only be processed to verified bank accounts. Sellers may update their bank account details, but re-verification will be required and payouts may be held for up to 72 hours during the re-verification process.
                            </p>
                        </section>

                        <section>
                            <h3 className="text-xl font-semibold">7. GSTIN Verification</h3>
                            <p>
                                GSTIN provided during registration is verified against the GST Network (GSTN) database. The following conditions must be met:
                            </p>
                            <ul className="list-disc pl-6 mt-2 space-y-1">
                                <li>The GSTIN must be in "Active" status.</li>
                                <li>The legal name or trade name associated with the GSTIN must match the business name provided during registration.</li>
                                <li>The registered address on the GSTIN certificate must correspond to the business address provided.</li>
                                <li>If the GSTIN is suspended, cancelled, or surrendered, the registration will be rejected.</li>
                            </ul>
                        </section>

                        <section>
                            <h3 className="text-xl font-semibold">8. Onboarding Workflow</h3>
                            <p>After successful registration and KYC verification, the seller onboarding includes:</p>
                            <ul className="list-disc pl-6 mt-2 space-y-1">
                                <li>Assignment to Bronze tier with a 7-day settlement cycle.</li>
                                <li>Access to the standardized professional seller dashboard.</li>
                                <li>Configuration of pickup addresses and warehouse locations.</li>
                                <li>Setup of preferred delivery partner preferences (if applicable).</li>
                                <li>API key generation for third-party integration (optional).</li>
                                <li>Welcome communication with platform guides and support contacts.</li>
                            </ul>
                        </section>

                        <section>
                            <h3 className="text-xl font-semibold">9. KYC Failure and Rejection</h3>
                            <p>If KYC verification fails or documents are rejected:</p>
                            <ul className="list-disc pl-6 mt-2 space-y-1">
                                <li>The seller will be notified via email and in-app notification with specific reasons for rejection.</li>
                                <li>Sellers have 15 days to resubmit corrected or additional documents.</li>
                                <li>A maximum of 3 resubmission attempts are allowed per registration.</li>
                                <li>If KYC cannot be completed after 3 attempts, the registration will be permanently rejected, and the seller may re-apply after a cooling-off period of 90 days.</li>
                                <li>No shipments can be created and no settlements processed until KYC is complete.</li>
                            </ul>
                        </section>

                        <section>
                            <h3 className="text-xl font-semibold">10. Periodic Re-Verification</h3>
                            <p>
                                FastFare reserves the right to conduct periodic re-verification of seller KYC documents, particularly when:
                            </p>
                            <ul className="list-disc pl-6 mt-2 space-y-1">
                                <li>There is a change in business ownership, directorship, or authorized signatory.</li>
                                <li>Suspicious or fraudulent activity is detected on the account.</li>
                                <li>A submitted document has expired or become invalid.</li>
                                <li>Regulatory requirements mandate fresh verification.</li>
                                <li>Bank account details are changed.</li>
                            </ul>
                            <p>Failure to comply with re-verification requests within 15 days may result in account suspension.</p>
                        </section>

                        <section>
                            <h3 className="text-xl font-semibold">11. Data Handling and Confidentiality</h3>
                            <p>
                                All KYC documents and personal information submitted during registration are handled in accordance with our Privacy Policy and Data Retention & Security Policy. Documents are stored in encrypted format with role-based access controls and are retained as per regulatory requirements.
                            </p>
                        </section>

                        <section>
                            <h3 className="text-xl font-semibold">12. Contact</h3>
                            <p>For questions regarding seller registration or KYC verification, contact:</p>
                            <address className="mt-2 not-italic">
                                <strong>Seller Onboarding Team</strong><br />
                                FastFare Logistics Pvt. Ltd.<br />
                                Email: onboarding@fastfare.in<br />
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

export default SellerRegistrationPolicy;
