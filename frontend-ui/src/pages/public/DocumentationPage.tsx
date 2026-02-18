import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Book, Code2, Webhook, FileJson, Truck, Key, ExternalLink, Search } from "lucide-react";
import { Button } from "@/components/ui/button";

const guides = [
    {
        icon: Book,
        title: "Getting Started",
        description: "Learn the basics of FastFare: create your account, set up your business profile, and book your first shipment in under 5 minutes.",
        link: "/register",
    },
    {
        icon: Truck,
        title: "Shipping Guide",
        description: "Everything about booking shipments, scheduling pickups, generating labels, and tracking deliveries across India.",
        link: "/services",
    },
    {
        icon: Code2,
        title: "API Documentation",
        description: "Technical reference for integrating FastFare into your applications. RESTful APIs with code samples in multiple languages.",
        link: "/api-reference",
    },
    {
        icon: Webhook,
        title: "Webhooks",
        description: "Set up real-time event notifications for shipment status changes, delivery confirmations, and more.",
        link: "/api-reference",
    },
    {
        icon: FileJson,
        title: "Bulk Upload Format",
        description: "CSV template and field specifications for uploading bulk shipments. Supports up to 10,000 orders per file.",
        link: "/services",
    },
    {
        icon: Key,
        title: "Authentication",
        description: "Learn about API key management, OAuth 2.0 integration, and role-based access control for your team.",
        link: "/api-reference",
    },
];

const DocumentationPage = () => {
    return (
        <div className="min-h-screen bg-background">
            <Header />
            <main>
                <section className="py-20 bg-gradient-to-b from-primary/5 to-background">
                    <div className="container">
                        <div className="max-w-3xl mx-auto text-center">
                            <Badge className="mb-4">Documentation</Badge>
                            <h1 className="text-4xl md:text-5xl font-bold mb-6">FastFare Documentation</h1>
                            <p className="text-xl text-muted-foreground mb-8">
                                Comprehensive guides, API references, and tutorials to help you get the
                                most out of FastFare.
                            </p>
                            <div className="max-w-md mx-auto relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                                <input
                                    type="text"
                                    placeholder="Search documentation..."
                                    className="w-full pl-10 pr-4 py-3 rounded-lg border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                                />
                            </div>
                        </div>
                    </div>
                </section>

                <section className="py-16 container">
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {guides.map((guide, index) => (
                            <motion.div key={guide.title} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }}>
                                <Card className="h-full hover:shadow-lg transition-shadow group">
                                    <CardContent className="pt-6 flex flex-col h-full">
                                        <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                                            <guide.icon className="h-6 w-6 text-primary" />
                                        </div>
                                        <h3 className="font-semibold mb-2">{guide.title}</h3>
                                        <p className="text-sm text-muted-foreground flex-1">{guide.description}</p>
                                        <Button variant="ghost" size="sm" className="mt-4 self-start gap-1 group-hover:text-primary" asChild>
                                            <Link to={guide.link}>
                                                Read more <ExternalLink className="h-3 w-3" />
                                            </Link>
                                        </Button>
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

export default DocumentationPage;
