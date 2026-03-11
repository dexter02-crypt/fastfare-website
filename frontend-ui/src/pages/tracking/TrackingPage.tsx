import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Search, Package, Truck, MapPin } from "lucide-react";
import Header from "@/components/Header";

/**
 * /tracking — Public page to enter AWB/Order ID.
 * Behaves identically to PublicTracking (/track) so the sidebar link works.
 */
const TrackingPage = () => {
    const navigate = useNavigate();
    const [trackingId, setTrackingId] = useState("");
    const [error, setError] = useState("");

    const handleTrack = (e: React.FormEvent) => {
        e.preventDefault();
        if (!trackingId.trim()) {
            setError("Please enter a tracking number");
            return;
        }
        setError("");
        navigate(`/track/${trackingId.trim()}`);
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
            <Header />
            <main className="container mx-auto px-4 py-16">
                <div className="max-w-2xl mx-auto">
                    <div className="text-center mb-12">
                        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary/10 mb-6">
                            <Package className="h-10 w-10 text-primary" />
                        </div>
                        <h1 className="text-4xl font-bold mb-4">Track Your Shipment</h1>
                        <p className="text-lg text-muted-foreground">
                            Enter your AWB number or Order ID to track your package in real-time
                        </p>
                    </div>

                    <Card className="shadow-lg">
                        <CardContent className="pt-6">
                            <form onSubmit={handleTrack} className="space-y-4">
                                <div className="relative">
                                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                                    <Input
                                        type="text"
                                        placeholder="Enter AWB number or Order ID (e.g., AWB1234567890)"
                                        value={trackingId}
                                        onChange={(e) => {
                                            setTrackingId(e.target.value);
                                            setError("");
                                        }}
                                        className="pl-12 h-14 text-lg"
                                        autoFocus
                                    />
                                </div>
                                {error && <p className="text-sm text-destructive">{error}</p>}
                                <Button type="submit" className="w-full h-12 text-lg">
                                    Track Shipment
                                </Button>
                            </form>
                        </CardContent>
                    </Card>

                    <div className="mt-8 text-center text-sm text-muted-foreground">
                        <p>You can find your tracking number in:</p>
                        <ul className="mt-2 space-y-1">
                            <li>• Order confirmation email</li>
                            <li>• SMS notification from carrier</li>
                            <li>• Shipping label on your package</li>
                        </ul>
                    </div>

                    <div className="grid md:grid-cols-3 gap-6 mt-16">
                        {[
                            { icon: Package, color: "blue", title: "Real-Time Updates", desc: "Instant updates on your package location" },
                            { icon: MapPin, color: "green", title: "Live Map View", desc: "See your package on the map in real-time" },
                            { icon: Truck, color: "purple", title: "Delivery ETA", desc: "Know exactly when to expect your delivery" },
                        ].map(({ icon: Icon, color, title, desc }) => (
                            <Card key={title}>
                                <CardContent className="pt-6 text-center">
                                    <div className={`w-12 h-12 rounded-full bg-${color}-100 flex items-center justify-center mx-auto mb-4`}>
                                        <Icon className={`h-6 w-6 text-${color}-600`} />
                                    </div>
                                    <h3 className="font-semibold mb-2">{title}</h3>
                                    <p className="text-sm text-muted-foreground">{desc}</p>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
            </main>
        </div>
    );
};

export default TrackingPage;
