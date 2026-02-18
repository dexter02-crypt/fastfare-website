import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { Newspaper, Download, Mail, ExternalLink } from "lucide-react";

const pressReleases = [
    {
        date: "Feb 2026",
        title: "FastFare Launches Driver & Partner Mobile Apps",
        description: "New Android apps empower delivery drivers with real-time GPS tracking and scan partners with barcode-based parcel management.",
    },
    {
        date: "Jan 2026",
        title: "FastFare Expands Delhi-Jaipur Express Delivery Corridor",
        description: "24-hour guaranteed delivery now available on the Delhi-Jaipur route with real-time tracking and competitive rates.",
    },
    {
        date: "Nov 2025",
        title: "FastFare Crosses 10 Million Shipments Milestone",
        description: "The logistics platform celebrates delivering 10 million packages, serving over 50,000 businesses across India.",
    },
    {
        date: "Sep 2025",
        title: "FastFare Launches API Platform for Developers",
        description: "RESTful APIs and webhook integrations enable businesses to embed shipping directly into their applications.",
    },
    {
        date: "Jul 2025",
        title: "FastFare Partners with Shopify for Seamless eCommerce Shipping",
        description: "One-click Shopify plugin auto-syncs orders, generates labels, and pushes tracking updates to customers.",
    },
    {
        date: "Apr 2025",
        title: "FastFare Raises Series A Funding to Expand Pan-India Operations",
        description: "The $10M round led by logistics-focused VC firms will fuel expansion to 500+ cities and technology R&D.",
    },
];

const mediaKit = [
    { label: "Brand Guidelines", desc: "Logo usage, colors, and typography" },
    { label: "Logo Pack (SVG, PNG)", desc: "High-resolution logos for all backgrounds" },
    { label: "Executive Headshots", desc: "Leadership team photos for press use" },
    { label: "Company Fact Sheet", desc: "Key stats, timeline, and company overview" },
];

const PressPage = () => {
    return (
        <div className="min-h-screen bg-background">
            <Header />
            <main>
                <section className="py-20 bg-gradient-to-b from-primary/5 to-background">
                    <div className="container">
                        <div className="max-w-3xl mx-auto text-center">
                            <Badge className="mb-4">Press & Media</Badge>
                            <h1 className="text-4xl md:text-5xl font-bold mb-6">FastFare in the News</h1>
                            <p className="text-xl text-muted-foreground mb-6">
                                Latest announcements, press releases, and media resources.
                            </p>
                            <div className="flex justify-center gap-3">
                                <Button variant="outline" className="gap-2">
                                    <Mail className="h-4 w-4" /> Media Inquiries: press@fastfare.org
                                </Button>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Press Releases */}
                <section className="py-16 container">
                    <h2 className="text-2xl font-bold mb-8">Press Releases</h2>
                    <div className="space-y-4">
                        {pressReleases.map((release, i) => (
                            <motion.div key={release.title} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                                <Card className="hover:shadow-md transition-shadow">
                                    <CardContent className="py-5">
                                        <div className="flex items-start gap-4">
                                            <Newspaper className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <Badge variant="secondary" className="text-xs">{release.date}</Badge>
                                                </div>
                                                <h3 className="font-semibold mb-1">{release.title}</h3>
                                                <p className="text-sm text-muted-foreground">{release.description}</p>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </motion.div>
                        ))}
                    </div>
                </section>

                {/* Media Kit */}
                <section className="py-16 bg-muted/30">
                    <div className="container">
                        <h2 className="text-2xl font-bold mb-8">Media Kit</h2>
                        <div className="grid md:grid-cols-2 gap-4">
                            {mediaKit.map((item, i) => (
                                <motion.div key={item.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
                                    <Card>
                                        <CardContent className="py-4 flex items-center justify-between">
                                            <div>
                                                <p className="font-medium">{item.label}</p>
                                                <p className="text-sm text-muted-foreground">{item.desc}</p>
                                            </div>
                                            <Button variant="ghost" size="sm" className="gap-1">
                                                <Download className="h-4 w-4" />
                                            </Button>
                                        </CardContent>
                                    </Card>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </section>
            </main>
            <Footer />
        </div>
    );
};

export default PressPage;
