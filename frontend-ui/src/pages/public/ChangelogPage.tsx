import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { motion } from "framer-motion";
import { Sparkles, Bug, Zap, Shield } from "lucide-react";

const changelog = [
    {
        version: "2.5.0",
        date: "February 2026",
        type: "feature",
        items: [
            "Driver App — Real-time GPS location tracking",
            "Partner App — Self-registration for scan partners",
            "New parcel delivery confirmation with proof-of-delivery",
            "Enhanced dashboard analytics with export to CSV",
        ],
    },
    {
        version: "2.4.0",
        date: "January 2026",
        type: "feature",
        items: [
            "Bulk shipment upload via CSV (up to 10,000 orders)",
            "Multi-carrier rate comparison engine",
            "Automated return (RTO) management",
            "WhatsApp notification integration for delivery updates",
        ],
    },
    {
        version: "2.3.2",
        date: "December 2025",
        type: "fix",
        items: [
            "Fixed COD reconciliation calculation for partial deliveries",
            "Improved tracking page load speed by 40%",
            "Resolved duplicate AWB generation in edge cases",
        ],
    },
    {
        version: "2.3.0",
        date: "November 2025",
        type: "feature",
        items: [
            "Fleet management dashboard for enterprise users",
            "Custom branding on tracking pages",
            "API rate limit increase to 1000 req/min",
        ],
    },
    {
        version: "2.2.0",
        date: "October 2025",
        type: "improvement",
        items: [
            "Redesigned shipment booking flow — 50% fewer clicks",
            "Enhanced security with 2FA support",
            "Improved carrier allocation algorithm",
        ],
    },
    {
        version: "2.1.0",
        date: "September 2025",
        type: "feature",
        items: [
            "Shopify and WooCommerce integration plugins",
            "Real-time webhook notifications",
            "Partner dashboard for scan partners",
        ],
    },
];

const typeConfig: Record<string, { icon: typeof Sparkles; color: string; label: string }> = {
    feature: { icon: Sparkles, color: "text-green-600", label: "New Feature" },
    fix: { icon: Bug, color: "text-red-500", label: "Bug Fix" },
    improvement: { icon: Zap, color: "text-blue-500", label: "Improvement" },
    security: { icon: Shield, color: "text-orange-500", label: "Security" },
};

const ChangelogPage = () => {
    return (
        <div className="min-h-screen bg-background">
            <Header />
            <main>
                <section className="py-20 bg-gradient-to-b from-primary/5 to-background">
                    <div className="container">
                        <div className="max-w-3xl mx-auto text-center">
                            <Badge className="mb-4">Changelog</Badge>
                            <h1 className="text-4xl md:text-5xl font-bold mb-6">What's New</h1>
                            <p className="text-xl text-muted-foreground">
                                Stay up to date with the latest features, improvements, and fixes.
                            </p>
                        </div>
                    </div>
                </section>

                <section className="py-16 container max-w-3xl">
                    <div className="space-y-8">
                        {changelog.map((release, index) => {
                            const config = typeConfig[release.type] || typeConfig.feature;
                            const Icon = config.icon;
                            return (
                                <motion.div key={release.version} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }}>
                                    <Card>
                                        <CardContent className="pt-6">
                                            <div className="flex items-center justify-between mb-4">
                                                <div className="flex items-center gap-3">
                                                    <Badge variant="outline" className="font-mono">v{release.version}</Badge>
                                                    <span className="text-sm text-muted-foreground">{release.date}</span>
                                                </div>
                                                <div className={`flex items-center gap-1 text-sm ${config.color}`}>
                                                    <Icon className="h-4 w-4" />
                                                    {config.label}
                                                </div>
                                            </div>
                                            <ul className="space-y-2">
                                                {release.items.map((item, i) => (
                                                    <li key={i} className="flex items-start gap-2 text-sm">
                                                        <span className="text-primary mt-1">•</span>
                                                        <span className="text-muted-foreground">{item}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </CardContent>
                                    </Card>
                                </motion.div>
                            );
                        })}
                    </div>
                </section>
            </main>
            <Footer />
        </div>
    );
};

export default ChangelogPage;
