import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Package,
    MapPin,
    Phone,
    Truck,
    CheckCircle,
    Loader2,
    AlertTriangle,
    Navigation,
    LogIn,
} from "lucide-react";
import { API_BASE_URL } from "@/config";

interface ScanShipment {
    shipment_id: string;
    awb: string;
    status: string;
    pickup: { contact_name: string; address: string; phone: string };
    delivery: { contact_name: string; address: string; phone: string };
    packages: Array<{ name: string; qty: number; weight_kg: number; dims: string }>;
    total_weight_kg: number;
    content_type: string;
    payment_mode: string;
    shipping_cost: number;
    carrier: string;
    service: string;
    expected_delivery: string;
}

const PickupScan = () => {
    const { qrToken } = useParams<{ qrToken: string }>();
    const navigate = useNavigate();

    const [shipment, setShipment] = useState<ScanShipment | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [alreadyPickedUp, setAlreadyPickedUp] = useState<{
        driver_name: string;
        scanned_at: string;
    } | null>(null);

    const [confirming, setConfirming] = useState(false);
    const [confirmed, setConfirmed] = useState<{
        awb: string;
        delivery_address: string;
        google_maps_url: string;
    } | null>(null);

    // Check if user is logged in as partner
    const user = (() => {
        try {
            return JSON.parse(localStorage.getItem("user") || "null");
        } catch {
            return null;
        }
    })();
    const token = localStorage.getItem("token");
    const isPartner = user?.role === "shipment_partner" || user?.role === "admin";

    useEffect(() => {
        const fetchShipment = async () => {
            try {
                const res = await fetch(`${API_BASE_URL}/api/scan/${qrToken}`);
                const data = await res.json();

                if (res.status === 404) {
                    setError(data.error || "Invalid or expired label");
                    return;
                }
                if (res.status === 409) {
                    setAlreadyPickedUp({
                        driver_name: data.driver_name,
                        scanned_at: data.scanned_at,
                    });
                    return;
                }
                if (!res.ok) {
                    setError(data.error || "Failed to load shipment");
                    return;
                }

                setShipment(data);
            } catch (err) {
                setError("Network error. Please check your connection.");
            } finally {
                setLoading(false);
            }
        };

        if (qrToken) fetchShipment();
    }, [qrToken]);

    const handleConfirmPickup = async () => {
        setConfirming(true);

        try {
            // Try to get geolocation
            let lat: number | undefined;
            let lng: number | undefined;

            try {
                const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
                    navigator.geolocation.getCurrentPosition(resolve, reject, {
                        timeout: 5000,
                        enableHighAccuracy: true,
                    });
                });
                lat = pos.coords.latitude;
                lng = pos.coords.longitude;
            } catch {
                // Location not available — proceed without it
            }

            const res = await fetch(`${API_BASE_URL}/api/scan/${qrToken}/confirm-pickup`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    location_lat: lat,
                    location_lng: lng,
                }),
            });

            const data = await res.json();

            if (res.status === 409) {
                setAlreadyPickedUp({
                    driver_name: data.driver_name,
                    scanned_at: data.scanned_at,
                });
                return;
            }

            if (!res.ok) {
                setError(data.error || "Failed to confirm pickup");
                return;
            }

            setConfirmed({
                awb: data.awb,
                delivery_address: data.delivery_address,
                google_maps_url: data.google_maps_url,
            });
        } catch (err) {
            setError("Network error during confirmation");
        } finally {
            setConfirming(false);
        }
    };

    const handleLoginRedirect = () => {
        navigate(`/login?role=partner&redirect=/pickup/${qrToken}`);
    };

    // ── Loading ──
    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background p-4">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    // ── Already picked up ──
    if (alreadyPickedUp) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background p-4">
                <Card className="w-full max-w-md">
                    <CardContent className="pt-8 pb-8 text-center space-y-4">
                        <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto">
                            <AlertTriangle className="h-8 w-8 text-red-600" />
                        </div>
                        <h2 className="text-xl font-bold text-red-600">Already Picked Up</h2>
                        <p className="text-muted-foreground">
                            This shipment was already picked up by{" "}
                            <strong>{alreadyPickedUp.driver_name}</strong> at{" "}
                            {new Date(alreadyPickedUp.scanned_at).toLocaleString("en-IN")}
                        </p>
                    </CardContent>
                </Card>
            </div>
        );
    }

    // ── Error ──
    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background p-4">
                <Card className="w-full max-w-md">
                    <CardContent className="pt-8 pb-8 text-center space-y-4">
                        <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto">
                            <AlertTriangle className="h-8 w-8 text-red-600" />
                        </div>
                        <h2 className="text-xl font-bold">Error</h2>
                        <p className="text-muted-foreground">{error}</p>
                    </CardContent>
                </Card>
            </div>
        );
    }

    // ── Success — pickup confirmed ──
    if (confirmed) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background p-4">
                <Card className="w-full max-w-md">
                    <CardContent className="pt-8 pb-8 text-center space-y-5">
                        <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto">
                            <CheckCircle className="h-10 w-10 text-green-600" />
                        </div>
                        <h2 className="text-2xl font-bold text-green-600">Pickup Confirmed!</h2>
                        <p className="text-muted-foreground">
                            Shipment <strong className="text-foreground">{confirmed.awb}</strong> is
                            now <Badge className="bg-purple-100 text-purple-700 ml-1">In Transit</Badge>
                        </p>
                        <Button
                            className="w-full bg-blue-600 hover:bg-blue-700"
                            size="lg"
                            onClick={() => window.open(confirmed.google_maps_url, "_blank")}
                        >
                            <Navigation className="h-5 w-5 mr-2" />
                            Navigate to Delivery
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    // ── Not logged in as partner ──
    if (!isPartner) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background p-4">
                <Card className="w-full max-w-md">
                    <CardContent className="pt-6 pb-6 space-y-5">
                        {shipment && (
                            <div className="space-y-3">
                                <div className="flex items-center gap-2">
                                    <Package className="h-5 w-5 text-primary" />
                                    <span className="font-bold">AWB: {shipment.awb}</span>
                                </div>
                                <div className="text-sm text-muted-foreground space-y-1">
                                    <p>
                                        <MapPin className="h-3 w-3 inline mr-1 text-green-600" />
                                        From: {shipment.pickup.contact_name} — {shipment.pickup.address.split(",")[1]?.trim()}
                                    </p>
                                    <p>
                                        <MapPin className="h-3 w-3 inline mr-1 text-red-600" />
                                        To: {shipment.delivery.contact_name} — {shipment.delivery.address.split(",")[1]?.trim()}
                                    </p>
                                    {shipment.packages[0] && (
                                        <p>
                                            📦 {shipment.packages[0].name} — {shipment.total_weight_kg} kg
                                        </p>
                                    )}
                                </div>
                            </div>
                        )}

                        <Button
                            className="w-full bg-blue-600 hover:bg-blue-700"
                            size="lg"
                            onClick={handleLoginRedirect}
                        >
                            <LogIn className="h-5 w-5 mr-2" />
                            Log in as Delivery Partner
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    // ── Main: logged in as partner, show shipment details ──
    return (
        <div className="min-h-screen bg-background p-4 flex items-start justify-center pt-8">
            <Card className="w-full max-w-md shadow-lg">
                <CardContent className="pt-5 pb-5 space-y-0">
                    {/* Header */}
                    <div className="flex items-center justify-between pb-4 border-b">
                        <div className="flex items-center gap-2">
                            <Package className="h-5 w-5 text-primary" />
                            <span className="font-bold font-mono">AWB: {shipment!.awb}</span>
                        </div>
                        <Badge className="capitalize">
                            {shipment!.status.replace(/_/g, " ")}
                        </Badge>
                    </div>

                    {/* Pickup From */}
                    <div className="py-4 border-b">
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                            Pickup From
                        </p>
                        <p className="font-bold text-base">{shipment!.pickup.contact_name}</p>
                        <p className="text-sm text-muted-foreground">{shipment!.pickup.address}</p>
                        <p className="text-sm flex items-center gap-1 mt-1">
                            <Phone className="h-3 w-3" />
                            {shipment!.pickup.phone}
                        </p>
                    </div>

                    {/* Deliver To */}
                    <div className="py-4 border-b">
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                            Deliver To
                        </p>
                        <p className="font-bold text-base">{shipment!.delivery.contact_name}</p>
                        <p className="text-sm text-muted-foreground">{shipment!.delivery.address}</p>
                        <p className="text-sm flex items-center gap-1 mt-1">
                            <Phone className="h-3 w-3" />
                            {shipment!.delivery.phone}
                        </p>
                    </div>

                    {/* Package Details */}
                    <div className="py-4 border-b">
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                            Package
                        </p>
                        {shipment!.packages.map((pkg, i) => (
                            <div key={i} className="text-sm">
                                <p className="font-medium">{pkg.name}</p>
                                <p className="text-muted-foreground">
                                    Qty: {pkg.qty} | Weight: {shipment!.total_weight_kg} kg
                                </p>
                            </div>
                        ))}
                        <p className="text-sm text-muted-foreground mt-1">
                            Type: <span className="capitalize">{shipment!.content_type}</span>
                            {" | "}
                            {shipment!.payment_mode} ₹{shipment!.shipping_cost.toLocaleString()}
                        </p>
                    </div>

                    {/* Confirm Button */}
                    <div className="pt-4">
                        <Button
                            className="w-full bg-green-600 hover:bg-green-700 text-white h-14 text-lg font-bold"
                            size="lg"
                            onClick={handleConfirmPickup}
                            disabled={confirming}
                        >
                            {confirming ? (
                                <>
                                    <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                                    Confirming...
                                </>
                            ) : (
                                <>
                                    <CheckCircle className="h-5 w-5 mr-2" />
                                    CONFIRM PICKUP
                                </>
                            )}
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default PickupScan;
