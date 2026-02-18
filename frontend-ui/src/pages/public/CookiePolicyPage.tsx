import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { motion } from "framer-motion";
import { Cookie, Shield, Settings, BarChart3, Eye, Clock } from "lucide-react";

const sections = [
    {
        icon: Cookie,
        title: "What Are Cookies?",
        content: "Cookies are small text files stored on your device when you visit our website. They help us improve your browsing experience, remember your preferences, and provide relevant content. Cookies cannot access other data on your device.",
    },
    {
        icon: Shield,
        title: "Essential Cookies",
        content: "These cookies are necessary for the website to function properly. They enable core features like secure login, session management, and payment processing. You cannot opt out of essential cookies as disabling them would break the website.",
    },
    {
        icon: BarChart3,
        title: "Analytics Cookies",
        content: "We use analytics cookies (Google Analytics) to understand how visitors interact with our website. These cookies collect information like pages visited, time spent, and bounce rates. All data is aggregated and anonymized — we cannot identify individual users.",
    },
    {
        icon: Settings,
        title: "Functional Cookies",
        content: "Functional cookies remember your preferences such as language, region, and dashboard layout. They enhance your experience by personalizing content. Disabling these may result in a less personalized experience.",
    },
    {
        icon: Eye,
        title: "Marketing Cookies",
        content: "We may use marketing cookies to serve relevant advertisements on third-party platforms. These cookies track your browsing behavior across websites. You can opt out of marketing cookies at any time through your browser settings or our cookie preferences panel.",
    },
    {
        icon: Clock,
        title: "Cookie Retention",
        content: "Session cookies are deleted when you close your browser. Persistent cookies remain for up to 12 months. Analytics cookies are retained for 26 months maximum. You can clear all cookies at any time through your browser settings.",
    },
];

const CookiePolicyPage = () => {
    return (
        <div className="min-h-screen bg-background">
            <Header />
            <main>
                <section className="py-20 bg-gradient-to-b from-primary/5 to-background">
                    <div className="container">
                        <div className="max-w-3xl mx-auto text-center">
                            <Badge className="mb-4">Legal</Badge>
                            <h1 className="text-4xl md:text-5xl font-bold mb-6">Cookie Policy</h1>
                            <p className="text-xl text-muted-foreground">
                                This policy explains how FastFare Technologies Inc. uses cookies and similar
                                tracking technologies on our website and services.
                            </p>
                            <p className="text-sm text-muted-foreground mt-4">Last updated: February 1, 2026</p>
                        </div>
                    </div>
                </section>

                <section className="py-16 container max-w-4xl">
                    <div className="space-y-6">
                        {sections.map((section, index) => (
                            <motion.div key={section.title} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }}>
                                <Card>
                                    <CardContent className="pt-6">
                                        <div className="flex gap-4">
                                            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                                                <section.icon className="h-5 w-5 text-primary" />
                                            </div>
                                            <div>
                                                <h3 className="text-lg font-semibold mb-2">{section.title}</h3>
                                                <p className="text-muted-foreground leading-relaxed">{section.content}</p>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </motion.div>
                        ))}
                    </div>

                    <div className="mt-12 p-6 bg-muted/50 rounded-xl">
                        <h3 className="font-semibold mb-3">Managing Your Cookie Preferences</h3>
                        <p className="text-sm text-muted-foreground mb-4">
                            You can control and manage cookies in several ways. Most browsers allow you to:
                        </p>
                        <ul className="text-sm text-muted-foreground space-y-2">
                            <li>• View and delete individual cookies</li>
                            <li>• Block cookies from specific or all websites</li>
                            <li>• Set preferences for cookies from first-party vs third-party sites</li>
                            <li>• Clear all cookies when you close your browser</li>
                        </ul>
                        <p className="text-sm text-muted-foreground mt-4">
                            For questions about our cookie practices, contact us at <span className="text-primary">privacy@fastfare.org</span>.
                        </p>
                    </div>
                </section>
            </main>
            <Footer />
        </div>
    );
};

export default CookiePolicyPage;
