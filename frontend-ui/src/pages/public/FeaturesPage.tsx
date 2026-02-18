import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { motion } from "framer-motion";
import {
    Truck, MapPin, BarChart3, Shield, Zap, Globe,
    Package, Clock, Smartphone, RefreshCw, Bell, FileText
} from "lucide-react";

const features = [
    {
        icon: Truck,
        title: "Multi-Carrier Shipping",
        description: "Access 20+ carrier partners through a single platform. Compare rates, choose the best option, and ship instantly.",
    },
    {
        icon: MapPin,
        title: "Real-Time Tracking",
        description: "Track every shipment in real-time with GPS precision. Keep your customers informed with automated status updates.",
    },
    {
        icon: BarChart3,
        title: "Advanced Analytics",
        description: "Gain deep insights into your shipping performance. Monitor delivery times, costs, and carrier reliability.",
    },
    {
        icon: Shield,
        title: "Secure & Compliant",
        description: "Enterprise-grade security with end-to-end encryption. SOC 2 compliant infrastructure keeps your data safe.",
    },
    {
        icon: Zap,
        title: "Instant Rate Calculator",
        description: "Get instant shipping rates for any destination. Compare pricing across carriers to find the best deal.",
    },
    {
        icon: Globe,
        title: "Pan-India Coverage",
        description: "Ship to 29,000+ pin codes across India. Reach every corner of the country with reliable delivery.",
    },
    {
        icon: Package,
        title: "Smart Label Generation",
        description: "Auto-generate shipping labels and AWB numbers. Print-ready labels with barcode support for fast processing.",
    },
    {
        icon: Clock,
        title: "Scheduled Pickups",
        description: "Schedule pickups at your convenience. Our drivers will collect packages right from your doorstep.",
    },
    {
        icon: Smartphone,
        title: "Mobile-First Dashboard",
        description: "Manage all your shipments on the go. Our mobile-responsive dashboard works seamlessly on any device.",
    },
    {
        icon: RefreshCw,
        title: "Easy Returns (RTO)",
        description: "Hassle-free return management. Automated RTO processing with real-time status updates.",
    },
    {
        icon: Bell,
        title: "Smart Notifications",
        description: "Get instant alerts for every shipment milestone. Customizable notification preferences for your team.",
    },
    {
        icon: FileText,
        title: "Bulk Operations",
        description: "Upload thousands of orders via CSV. Bulk label generation, manifest creation, and shipment booking.",
    },
];

const FeaturesPage = () => {
    return (
        <div className="min-h-screen bg-background">
            <Header />
            <main>
                <section className="py-20 bg-gradient-to-b from-primary/5 to-background">
                    <div className="container">
                        <div className="max-w-3xl mx-auto text-center">
                            <Badge className="mb-4">Features</Badge>
                            <h1 className="text-4xl md:text-5xl font-bold mb-6">
                                Everything you need to ship smarter
                            </h1>
                            <p className="text-xl text-muted-foreground">
                                Powerful features designed to simplify your logistics operations
                                and help you deliver exceptional customer experiences.
                            </p>
                        </div>
                    </div>
                </section>

                <section className="py-20 container">
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {features.map((feature, index) => (
                            <motion.div
                                key={feature.title}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.05 }}
                            >
                                <Card className="h-full hover:shadow-lg transition-shadow">
                                    <CardContent className="pt-6">
                                        <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                                            <feature.icon className="h-6 w-6 text-primary" />
                                        </div>
                                        <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                                        <p className="text-muted-foreground">{feature.description}</p>
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

export default FeaturesPage;
