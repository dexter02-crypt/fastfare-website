import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { motion } from "framer-motion";
import { ShoppingCart, Warehouse, BarChart3, CreditCard, Globe, Database, FileText, Truck } from "lucide-react";

const integrations = [
    {
        icon: ShoppingCart,
        title: "Shopify",
        description: "Sync orders automatically from your Shopify store. Auto-import new orders and push tracking updates back.",
        status: "Available",
    },
    {
        icon: Globe,
        title: "WooCommerce",
        description: "Seamless WordPress/WooCommerce integration. One-click install plugin syncs your store in minutes.",
        status: "Available",
    },
    {
        icon: Warehouse,
        title: "Amazon Seller Central",
        description: "Fulfill Amazon orders through FastFare. Automated label generation and tracking sync.",
        status: "Available",
    },
    {
        icon: CreditCard,
        title: "Razorpay",
        description: "Integrated COD reconciliation with Razorpay. Automatic payment tracking and settlement.",
        status: "Available",
    },
    {
        icon: BarChart3,
        title: "Google Analytics",
        description: "Track logistics KPIs directly in Google Analytics. Custom events for shipment milestones.",
        status: "Available",
    },
    {
        icon: Database,
        title: "SAP / ERP Systems",
        description: "Enterprise ERP integration for large-scale operations. Bi-directional data sync with SAP, Oracle, and more.",
        status: "Coming Soon",
    },
    {
        icon: FileText,
        title: "Tally / Zoho Books",
        description: "Auto-generate invoices and sync billing data with your accounting software.",
        status: "Available",
    },
    {
        icon: Truck,
        title: "Custom Webhooks",
        description: "Build your own integrations with our webhook system. Get real-time event notifications for any shipment update.",
        status: "Available",
    },
];

const IntegrationsPage = () => {
    return (
        <div className="min-h-screen bg-background">
            <Header />
            <main>
                <section className="py-20 bg-gradient-to-b from-primary/5 to-background">
                    <div className="container">
                        <div className="max-w-3xl mx-auto text-center">
                            <Badge className="mb-4">Integrations</Badge>
                            <h1 className="text-4xl md:text-5xl font-bold mb-6">
                                Connect with your favorite tools
                            </h1>
                            <p className="text-xl text-muted-foreground">
                                FastFare integrates seamlessly with the platforms you already use.
                                Automate your workflow and save hours every week.
                            </p>
                        </div>
                    </div>
                </section>

                <section className="py-20 container">
                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {integrations.map((integration, index) => (
                            <motion.div
                                key={integration.title}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.05 }}
                            >
                                <Card className="h-full hover:shadow-lg transition-shadow">
                                    <CardContent className="pt-6">
                                        <div className="flex items-center justify-between mb-4">
                                            <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                                                <integration.icon className="h-6 w-6 text-primary" />
                                            </div>
                                            <Badge variant={integration.status === "Available" ? "default" : "secondary"}>
                                                {integration.status}
                                            </Badge>
                                        </div>
                                        <h3 className="font-semibold mb-2">{integration.title}</h3>
                                        <p className="text-sm text-muted-foreground">{integration.description}</p>
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

export default IntegrationsPage;
