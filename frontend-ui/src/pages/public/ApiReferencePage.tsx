import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { motion } from "framer-motion";
import { Code2, Key, Webhook, FileJson, Lock, Zap } from "lucide-react";

const endpoints = [
    { method: "POST", path: "/api/shipments", description: "Create a new shipment" },
    { method: "GET", path: "/api/shipments/:id", description: "Get shipment details" },
    { method: "GET", path: "/api/shipments/:id/track", description: "Track a shipment" },
    { method: "PUT", path: "/api/shipments/:id/cancel", description: "Cancel a shipment" },
    { method: "POST", path: "/api/rates/calculate", description: "Calculate shipping rates" },
    { method: "POST", path: "/api/labels/generate", description: "Generate shipping label" },
    { method: "GET", path: "/api/parcels/track/:awb", description: "Track parcel by AWB" },
    { method: "POST", path: "/api/webhooks/register", description: "Register a webhook" },
];

const ApiReferencePage = () => {
    return (
        <div className="min-h-screen bg-background">
            <Header />
            <main>
                <section className="py-20 bg-gradient-to-b from-primary/5 to-background">
                    <div className="container">
                        <div className="max-w-3xl mx-auto text-center">
                            <Badge className="mb-4">API Reference</Badge>
                            <h1 className="text-4xl md:text-5xl font-bold mb-6">
                                Build with FastFare API
                            </h1>
                            <p className="text-xl text-muted-foreground">
                                RESTful APIs to integrate FastFare shipping into your applications.
                                Simple, powerful, and well-documented.
                            </p>
                        </div>
                    </div>
                </section>

                <section className="py-16 container">
                    <div className="grid md:grid-cols-3 gap-6 mb-16">
                        {[
                            { icon: Key, title: "API Keys", desc: "Generate keys from your dashboard. Use Bearer token authentication for all requests." },
                            { icon: FileJson, title: "JSON Format", desc: "All requests and responses use JSON. UTF-8 encoding with standard HTTP status codes." },
                            { icon: Lock, title: "Rate Limits", desc: "1000 requests/minute for production. Contact us for higher limits on enterprise plans." },
                        ].map((item, i) => (
                            <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
                                <Card className="h-full">
                                    <CardContent className="pt-6">
                                        <item.icon className="h-8 w-8 text-primary mb-3" />
                                        <h3 className="font-semibold mb-2">{item.title}</h3>
                                        <p className="text-sm text-muted-foreground">{item.desc}</p>
                                    </CardContent>
                                </Card>
                            </motion.div>
                        ))}
                    </div>

                    <h2 className="text-2xl font-bold mb-6">Endpoints</h2>
                    <div className="space-y-3">
                        {endpoints.map((ep, i) => (
                            <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}>
                                <Card>
                                    <CardContent className="py-4 flex items-center gap-4">
                                        <Badge variant={ep.method === "GET" ? "secondary" : ep.method === "POST" ? "default" : "outline"} className="font-mono w-16 justify-center">
                                            {ep.method}
                                        </Badge>
                                        <code className="text-sm font-mono text-primary flex-1">{ep.path}</code>
                                        <span className="text-sm text-muted-foreground hidden md:block">{ep.description}</span>
                                    </CardContent>
                                </Card>
                            </motion.div>
                        ))}
                    </div>

                    <div className="mt-12 p-6 bg-muted/50 rounded-xl">
                        <h3 className="font-semibold mb-3 flex items-center gap-2"><Code2 className="h-5 w-5" /> Quick Start Example</h3>
                        <pre className="bg-slate-900 text-slate-100 p-4 rounded-lg overflow-x-auto text-sm">
                            {`curl -X POST https://api.fastfare.org/api/shipments \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "origin": { "city": "Delhi", "pincode": "110001" },
    "destination": { "city": "Jaipur", "pincode": "302001" },
    "weight": 1.5,
    "dimensions": { "length": 30, "width": 20, "height": 10 }
  }'`}
                        </pre>
                    </div>
                </section>
            </main>
            <Footer />
        </div>
    );
};

export default ApiReferencePage;
