import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const PartnerOnboardingPolicy = () => {
    return (
        <div className="min-h-screen bg-background">
            <Header />
            <main className="container py-12">
                <Card className="max-w-4xl mx-auto">
                    <CardHeader>
                        <CardTitle className="text-3xl font-bold text-center">Partner Onboarding & KYC Policy</CardTitle>
                        <p className="text-center text-muted-foreground mt-2">Effective Date: February 12, 2026</p>
                        <p className="text-center text-sm text-muted-foreground">Applicable to: All Delivery Partners</p>
                    </CardHeader>
                    <CardContent className="prose dark:prose-invert max-w-none space-y-6">
                        <section>
                            <h3 className="text-xl font-semibold">1. Overview</h3>
                            <p>This policy outlines the registration, verification, and onboarding process for delivery partners joining the FastFare logistics platform. All partners must complete the KYC (Know Your Customer) verification before being assigned any deliveries.</p>
                        </section>

                        <section>
                            <h3 className="text-xl font-semibold">2. Eligibility Criteria</h3>
                            <ul className="list-disc pl-6 mt-2 space-y-1">
                                <li>Minimum age: 18 years.</li>
                                <li>Valid government-issued photo identification.</li>
                                <li>Valid driving license (for motorized delivery partners).</li>
                                <li>Vehicle in roadworthy condition with valid registration and insurance.</li>
                                <li>Smartphone with GPS capability and internet access.</li>
                                <li>No pending criminal cases or disqualifying criminal history.</li>
                                <li>Ability to communicate in the regional language and basic English/Hindi.</li>
                            </ul>
                        </section>

                        <section>
                            <h3 className="text-xl font-semibold">3. Registration Process</h3>
                            <ol className="list-decimal pl-6 mt-2 space-y-2">
                                <li><strong>Application Submission:</strong> Partner submits registration through the FastFare Partner app or website with basic details (name, phone, email, city, vehicle type).</li>
                                <li><strong>OTP Verification:</strong> Phone number verified via one-time password.</li>
                                <li><strong>Document Upload:</strong> Partner uploads required KYC documents through the app.</li>
                                <li><strong>Document Verification:</strong> FastFare's verification team reviews and validates uploaded documents (1–3 business days).</li>
                                <li><strong>Background Check:</strong> Address and identity verification through authorized verification agencies.</li>
                                <li><strong>Training Module:</strong> Partner completes mandatory online training covering delivery procedures, app usage, COD handling, and safety protocols.</li>
                                <li><strong>Account Activation:</strong> Upon successful verification and training completion, the partner account is activated and orders may be assigned.</li>
                            </ol>
                        </section>

                        <section>
                            <h3 className="text-xl font-semibold">4. Required KYC Documents</h3>
                            <div className="overflow-x-auto mt-2">
                                <table className="w-full border-collapse border border-border">
                                    <thead>
                                        <tr className="bg-muted">
                                            <th className="border border-border px-4 py-2 text-left">Document</th>
                                            <th className="border border-border px-4 py-2 text-center">Required</th>
                                            <th className="border border-border px-4 py-2 text-left">Purpose</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr><td className="border border-border px-4 py-2">Aadhaar Card</td><td className="border border-border px-4 py-2 text-center">✅ Mandatory</td><td className="border border-border px-4 py-2">Identity & address verification</td></tr>
                                        <tr><td className="border border-border px-4 py-2">PAN Card</td><td className="border border-border px-4 py-2 text-center">✅ Mandatory</td><td className="border border-border px-4 py-2">Tax compliance</td></tr>
                                        <tr><td className="border border-border px-4 py-2">Driving License</td><td className="border border-border px-4 py-2 text-center">✅ Mandatory*</td><td className="border border-border px-4 py-2">Driving authorization (*for motorized)</td></tr>
                                        <tr><td className="border border-border px-4 py-2">Vehicle RC</td><td className="border border-border px-4 py-2 text-center">✅ Mandatory*</td><td className="border border-border px-4 py-2">Vehicle registration (*for motorized)</td></tr>
                                        <tr><td className="border border-border px-4 py-2">Vehicle Insurance</td><td className="border border-border px-4 py-2 text-center">✅ Mandatory*</td><td className="border border-border px-4 py-2">Insurance coverage (*for motorized)</td></tr>
                                        <tr><td className="border border-border px-4 py-2">Bank Passbook / Cheque</td><td className="border border-border px-4 py-2 text-center">✅ Mandatory</td><td className="border border-border px-4 py-2">Payout bank account verification</td></tr>
                                        <tr><td className="border border-border px-4 py-2">Profile Photo</td><td className="border border-border px-4 py-2 text-center">✅ Mandatory</td><td className="border border-border px-4 py-2">Visual identification</td></tr>
                                    </tbody>
                                </table>
                            </div>
                        </section>

                        <section>
                            <h3 className="text-xl font-semibold">5. Document Validity and Re-verification</h3>
                            <ul className="list-disc pl-6 mt-2 space-y-1">
                                <li>All documents must be valid and unexpired at the time of upload.</li>
                                <li>Partners must update expired documents within 15 days of expiry.</li>
                                <li>FastFare may request periodic re-verification (typically annually).</li>
                                <li>Failure to maintain valid documents results in <strong>temporary suspension</strong> until updated documents are verified.</li>
                                <li>Fraudulent or forged documents result in <strong>immediate and permanent termination</strong> and may be reported to authorities.</li>
                            </ul>
                        </section>

                        <section>
                            <h3 className="text-xl font-semibold">6. Training Requirements</h3>
                            <p>All partners must complete mandatory training covering:</p>
                            <ul className="list-disc pl-6 mt-2 space-y-1">
                                <li>FastFare Partner App operation and features.</li>
                                <li>Order pickup, transit, and delivery procedures.</li>
                                <li>COD collection, reporting, and remittance.</li>
                                <li>Proof of Delivery (POD) upload procedures.</li>
                                <li>RTO process and handling refused deliveries.</li>
                                <li>Safety protocols and emergency procedures.</li>
                                <li>Code of Conduct and professional behavior standards.</li>
                                <li>Data privacy and confidentiality obligations.</li>
                            </ul>
                            <p>Training is provided through the Partner app and must be completed before account activation. Refresher training may be required periodically.</p>
                        </section>

                        <section>
                            <h3 className="text-xl font-semibold">7. Account Status</h3>
                            <ul className="list-disc pl-6 mt-2 space-y-1">
                                <li><strong>Pending Verification:</strong> Documents submitted, awaiting review.</li>
                                <li><strong>Active:</strong> Fully verified, eligible for order assignments.</li>
                                <li><strong>Suspended:</strong> Temporarily disabled (expired documents, policy violation under review).</li>
                                <li><strong>Terminated:</strong> Permanently deactivated. No further orders assigned.</li>
                            </ul>
                        </section>

                        <section>
                            <h3 className="text-xl font-semibold">8. Contact</h3>
                            <address className="mt-2 not-italic">
                                <strong>Partner Onboarding Team</strong><br />
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

export default PartnerOnboardingPolicy;
