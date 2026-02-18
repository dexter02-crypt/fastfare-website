import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { motion } from "framer-motion";
import { Package, Truck, MapPin, FileText, Shield, Clock, BarChart3, AlertTriangle } from "lucide-react";

const chapters = [
    {
        icon: Package,
        title: "1. Packaging Best Practices",
        content: "Proper packaging is the first step to safe delivery. Use corrugated boxes for items over 500g. Bubble wrap fragile items with at least 2 inches of cushioning. Seal all edges with strong packing tape. Label the package clearly with 'FRAGILE' stickers where applicable.",
    },
    {
        icon: Truck,
        title: "2. Choosing the Right Carrier",
        content: "Different carriers specialize in different delivery types. For same-day metro delivery, choose surface express. For tier-2/3 cities, standard air cargo offers the best value. Compare rates using our Rate Calculator to find the optimal balance of speed and cost.",
    },
    {
        icon: MapPin,
        title: "3. Pin Code Coverage",
        content: "FastFare covers 29,000+ pin codes across India. Metro cities (Delhi, Mumbai, Bangalore, etc.) have same-day and next-day delivery. Tier-2 cities typically receive deliveries within 2-3 days. Remote areas may take 5-7 business days.",
    },
    {
        icon: FileText,
        title: "4. Documentation & Compliance",
        content: "Ensure all shipments include proper documentation: commercial invoice, GST details, and E-way bill (for goods over ₹50,000). Hazardous materials require MSDS documentation. International shipments need customs declaration.",
    },
    {
        icon: Shield,
        title: "5. Insurance & Claims",
        content: "All shipments include basic insurance up to ₹5,000. Enhanced coverage (up to ₹50,000) is available at 1% of declared value. File claims within 7 days of delivery with proof of damage. Claims are typically processed within 10 business days.",
    },
    {
        icon: Clock,
        title: "6. Delivery Timelines",
        content: "Metro-to-Metro: 1-2 days. Metro-to-Tier 2: 2-3 days. Tier 2-to-Tier 2: 3-4 days. Remote areas: 5-7 days. Express delivery available at premium rates for most metro routes. Same-day delivery in select cities.",
    },
    {
        icon: BarChart3,
        title: "7. Cost Optimization Tips",
        content: "Use volumetric weight calculations to your advantage — pack efficiently. Consolidate multiple orders to the same destination. Subscribe to monthly plans for 15-20% discount on base rates. Use our Bulk Upload feature for orders over 100 per day.",
    },
    {
        icon: AlertTriangle,
        title: "8. Handling Returns (RTO)",
        content: "Minimize returns by verifying addresses via phone before shipping. Enable OTP-based delivery for high-value orders. Our AI system flags risky addresses based on historical data. RTO shipments are automatically rerouted to origin within 48 hours.",
    },
];

const LogisticsGuidePage = () => {
    return (
        <div className="min-h-screen bg-background">
            <Header />
            <main>
                <section className="py-20 bg-gradient-to-b from-primary/5 to-background">
                    <div className="container">
                        <div className="max-w-3xl mx-auto text-center">
                            <Badge className="mb-4">Logistics Guide</Badge>
                            <h1 className="text-4xl md:text-5xl font-bold mb-6">
                                The Complete Logistics Guide
                            </h1>
                            <p className="text-xl text-muted-foreground">
                                Everything you need to know about shipping, packaging, and delivering
                                products across India. Built from experience handling 10M+ shipments.
                            </p>
                        </div>
                    </div>
                </section>

                <section className="py-16 container max-w-4xl">
                    <div className="space-y-6">
                        {chapters.map((chapter, index) => (
                            <motion.div key={chapter.title} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }}>
                                <Card className="hover:shadow-md transition-shadow">
                                    <CardContent className="pt-6">
                                        <div className="flex gap-4">
                                            <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                                                <chapter.icon className="h-6 w-6 text-primary" />
                                            </div>
                                            <div>
                                                <h3 className="text-lg font-semibold mb-2">{chapter.title}</h3>
                                                <p className="text-muted-foreground leading-relaxed">{chapter.content}</p>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </motion.div>
                        ))}
                    </div>
                </section>
            </main>
            <Footer />
        </div>
    );
};

export default LogisticsGuidePage;
