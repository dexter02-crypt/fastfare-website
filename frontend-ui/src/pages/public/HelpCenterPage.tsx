import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { MessageCircle, Mail, Phone, FileQuestion, Book, Bug, ExternalLink, Clock } from "lucide-react";

const faqs = [
    { q: "How do I track my shipment?", a: "Visit our tracking page and enter your AWB number. You can also track via SMS or WhatsApp by sending your AWB number to our support line." },
    { q: "What are the supported payment methods?", a: "We support Razorpay, UPI, net banking, credit/debit cards, and wallet payments. Enterprise clients can also use invoice-based billing." },
    { q: "How do I schedule a pickup?", a: "Log into your dashboard, navigate to 'Schedule Pickup', select your address and preferred time slot. Pickups are available from 9 AM to 7 PM." },
    { q: "What is your delivery time for Delhi to Jaipur?", a: "Standard delivery takes 24-48 hours. Express delivery is available with same-day or next-day options at premium rates." },
    { q: "How do returns (RTO) work?", a: "If a delivery attempt fails, the parcel enters our RTO process. We attempt re-delivery once, then return to the origin address within 5-7 business days." },
    { q: "How do I get an API key?", a: "API keys can be generated from your Dashboard → Settings → API Keys. You'll need a verified business account to access the API." },
];

const HelpCenterPage = () => {
    return (
        <div className="min-h-screen bg-background">
            <Header />
            <main>
                <section className="py-20 bg-gradient-to-b from-primary/5 to-background">
                    <div className="container">
                        <div className="max-w-3xl mx-auto text-center">
                            <Badge className="mb-4">Help Center</Badge>
                            <h1 className="text-4xl md:text-5xl font-bold mb-6">How can we help you?</h1>
                            <p className="text-xl text-muted-foreground">
                                Find answers to common questions or reach out to our support team.
                            </p>
                        </div>
                    </div>
                </section>

                {/* Contact Options */}
                <section className="py-12 container">
                    <div className="grid md:grid-cols-3 gap-6 mb-16">
                        {[
                            { icon: MessageCircle, title: "Live Chat", desc: "Chat with our support team in real-time. Average response time: 2 minutes.", action: "Start Chat", color: "text-green-500" },
                            { icon: Mail, title: "Email Support", desc: "Send us a detailed query. We respond within 4 business hours.", action: "support@fastfare.org", color: "text-blue-500" },
                            { icon: Phone, title: "Phone Support", desc: "Call us Mon-Sat, 9 AM - 7 PM IST for immediate assistance.", action: "+91 1800-XXX-XXXX", color: "text-purple-500" },
                        ].map((item, i) => (
                            <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
                                <Card className="h-full text-center">
                                    <CardContent className="pt-6">
                                        <item.icon className={`h-10 w-10 mx-auto mb-3 ${item.color}`} />
                                        <h3 className="font-semibold mb-2">{item.title}</h3>
                                        <p className="text-sm text-muted-foreground mb-3">{item.desc}</p>
                                        <p className="text-sm font-medium text-primary">{item.action}</p>
                                    </CardContent>
                                </Card>
                            </motion.div>
                        ))}
                    </div>
                </section>

                {/* FAQs */}
                <section className="py-12 bg-muted/30">
                    <div className="container max-w-3xl">
                        <h2 className="text-2xl font-bold mb-8 text-center">Frequently Asked Questions</h2>
                        <div className="space-y-4">
                            {faqs.map((faq, i) => (
                                <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                                    <Card>
                                        <CardContent className="pt-5 pb-5">
                                            <h3 className="font-semibold mb-2 flex items-start gap-2">
                                                <FileQuestion className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                                                {faq.q}
                                            </h3>
                                            <p className="text-sm text-muted-foreground ml-7">{faq.a}</p>
                                        </CardContent>
                                    </Card>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Quick Links */}
                <section className="py-12 container">
                    <div className="grid md:grid-cols-2 gap-4">
                        {[
                            { icon: Book, title: "Browse Documentation", link: "/documentation", desc: "Technical guides and API reference" },
                            { icon: Bug, title: "Report a Bug", link: "/contact", desc: "Found an issue? Let us know" },
                            { icon: Clock, title: "System Status", link: "/", desc: "Check platform uptime and performance" },
                            { icon: ExternalLink, title: "Community Forum", link: "/community", desc: "Connect with other FastFare users" },
                        ].map((item, i) => (
                            <Button key={i} variant="outline" className="h-auto p-4 justify-start gap-3" asChild>
                                <Link to={item.link}>
                                    <item.icon className="h-5 w-5 text-primary" />
                                    <div className="text-left">
                                        <p className="font-medium">{item.title}</p>
                                        <p className="text-xs text-muted-foreground">{item.desc}</p>
                                    </div>
                                </Link>
                            </Button>
                        ))}
                    </div>
                </section>
            </main>
            <Footer />
        </div>
    );
};

export default HelpCenterPage;
