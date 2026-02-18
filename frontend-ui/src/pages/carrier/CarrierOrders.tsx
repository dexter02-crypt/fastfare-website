import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { API_BASE_URL } from "@/config";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
    Package, MapPin, Phone, User, ArrowLeft, CheckCircle, XCircle,
    Clock, Truck, Loader2, RefreshCw, Search
} from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";

interface ShipmentData {
    _id: string;
    awb: string;
    status: string;
    pickup: { name: string; phone: string; address: string; city: string; pincode: string };
    delivery: { name: string; phone: string; address: string; city: string; pincode: string };
    packages: { name: string; quantity: number; weight: number }[];
    serviceType: string;
    contentType: string;
    shippingCost: number;
    totalWeight: number;
    createdAt: string;
    paymentMode: string;
    codAmount: number;
}

const CarrierOrders = () => {
    const navigate = useNavigate();
    const { toast } = useToast();
    const [searchParams] = useSearchParams();
    const [tab, setTab] = useState(searchParams.get("tab") || "new");
    const [shipments, setShipments] = useState<ShipmentData[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [search, setSearch] = useState("");

    const token = localStorage.getItem("carrierToken");
    const headers = () => ({ Authorization: `Bearer ${token}`, "Content-Type": "application/json" });

    const fetchShipments = async () => {
        if (!token) { navigate("/carrier/login"); return; }
        setLoading(true);
        try {
            const statusMap: Record<string, string> = {
                new: "pending_acceptance",
                active: "accepted",
                transit: "in_transit",
                completed: "delivered",
            };
            const status = statusMap[tab] || "";
            const url = `${API_BASE_URL}/api/shipments/carrier/incoming${status ? `?status=${status}` : ""}`;
            const res = await fetch(url, { headers: headers() });
            const data = await res.json();
            if (data.success) setShipments(data.shipments);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchShipments(); }, [tab]);

    const handleAccept = async (id: string) => {
        setActionLoading(id);
        try {
            const res = await fetch(`${API_BASE_URL}/api/shipments/carrier/${id}/accept`, {
                method: "PUT", headers: headers()
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message);
            toast({ title: "Shipment Accepted!", description: `AWB ${shipments.find(s => s._id === id)?.awb} accepted` });
            fetchShipments();
        } catch (error: any) {
            toast({ title: "Error", description: error.message, variant: "destructive" });
        } finally {
            setActionLoading(null);
        }
    };

    const handleReject = async (id: string) => {
        const reason = prompt("Reason for rejection (optional):");
        if (reason === null) return; // cancelled

        setActionLoading(id);
        try {
            const res = await fetch(`${API_BASE_URL}/api/shipments/carrier/${id}/reject`, {
                method: "PUT", headers: headers(), body: JSON.stringify({ reason })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message);
            toast({ title: "Shipment Rejected", description: "The shipment has been returned to the queue" });
            fetchShipments();
        } catch (error: any) {
            toast({ title: "Error", description: error.message, variant: "destructive" });
        } finally {
            setActionLoading(null);
        }
    };

    const getStatusBadge = (status: string) => {
        const map: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
            pending_acceptance: { label: "New", variant: "default" },
            accepted: { label: "Accepted", variant: "secondary" },
            pickup_scheduled: { label: "Pickup Scheduled", variant: "secondary" },
            picked_up: { label: "Picked Up", variant: "secondary" },
            in_transit: { label: "In Transit", variant: "default" },
            out_for_delivery: { label: "Out for Delivery", variant: "default" },
            delivered: { label: "Delivered", variant: "secondary" },
            rejected_by_carrier: { label: "Rejected", variant: "destructive" },
        };
        const s = map[status] || { label: status, variant: "outline" as const };
        return <Badge variant={s.variant}>{s.label}</Badge>;
    };

    const filtered = shipments.filter((s) =>
        !search ||
        s.awb?.toLowerCase().includes(search.toLowerCase()) ||
        s.pickup?.name?.toLowerCase().includes(search.toLowerCase()) ||
        s.delivery?.name?.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
            {/* Header */}
            <header className="bg-white border-b sticky top-0 z-10">
                <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Button variant="ghost" size="icon" onClick={() => navigate("/carrier/dashboard")}>
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                        <div>
                            <h1 className="text-xl font-bold">Shipment Orders</h1>
                            <p className="text-sm text-muted-foreground">{filtered.length} shipments</p>
                        </div>
                    </div>
                    <Button variant="outline" size="sm" onClick={fetchShipments}>
                        <RefreshCw className="h-4 w-4 mr-1" /> Refresh
                    </Button>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 py-4 space-y-4">
                {/* Tabs */}
                <Tabs value={tab} onValueChange={setTab}>
                    <TabsList className="w-full grid grid-cols-4">
                        <TabsTrigger value="new">🔔 New</TabsTrigger>
                        <TabsTrigger value="active">🚚 Active</TabsTrigger>
                        <TabsTrigger value="transit">📦 In Transit</TabsTrigger>
                        <TabsTrigger value="completed">✅ Completed</TabsTrigger>
                    </TabsList>
                </Tabs>

                {/* Search */}
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        className="pl-10"
                        placeholder="Search by AWB, sender, or receiver..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>

                {/* Shipment Cards */}
                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="text-center py-20">
                        <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <h3 className="text-lg font-medium">No shipments found</h3>
                        <p className="text-sm text-muted-foreground">
                            {tab === "new" ? "No new orders awaiting acceptance" : "No shipments in this category"}
                        </p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {filtered.map((shipment, i) => (
                            <motion.div
                                key={shipment._id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.05 }}
                            >
                                <Card className="hover:shadow-md transition-shadow">
                                    <CardContent className="p-5">
                                        {/* Header */}
                                        <div className="flex items-center justify-between mb-4">
                                            <div className="flex items-center gap-3">
                                                <code className="text-sm font-mono bg-gray-100 px-2 py-1 rounded">
                                                    {shipment.awb}
                                                </code>
                                                {getStatusBadge(shipment.status)}
                                            </div>
                                            <div className="text-right">
                                                <p className="text-lg font-bold text-primary">
                                                    ₹{shipment.shippingCost || 0}
                                                </p>
                                                <p className="text-xs text-muted-foreground capitalize">
                                                    {shipment.paymentMode} {shipment.paymentMode === "cod" && `• ₹${shipment.codAmount}`}
                                                </p>
                                            </div>
                                        </div>

                                        {/* Pickup & Delivery */}
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                            <div className="bg-green-50 rounded-lg p-3">
                                                <p className="text-xs font-medium text-green-700 mb-1 flex items-center gap-1">
                                                    <MapPin className="h-3 w-3" /> PICKUP
                                                </p>
                                                <p className="font-medium text-sm">{shipment.pickup?.name}</p>
                                                <p className="text-xs text-muted-foreground">{shipment.pickup?.address}</p>
                                                <p className="text-xs text-muted-foreground">
                                                    {shipment.pickup?.city} — {shipment.pickup?.pincode}
                                                </p>
                                                <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                                                    <Phone className="h-3 w-3" /> {shipment.pickup?.phone}
                                                </p>
                                            </div>
                                            <div className="bg-blue-50 rounded-lg p-3">
                                                <p className="text-xs font-medium text-blue-700 mb-1 flex items-center gap-1">
                                                    <MapPin className="h-3 w-3" /> DELIVERY
                                                </p>
                                                <p className="font-medium text-sm">{shipment.delivery?.name}</p>
                                                <p className="text-xs text-muted-foreground">{shipment.delivery?.address}</p>
                                                <p className="text-xs text-muted-foreground">
                                                    {shipment.delivery?.city} — {shipment.delivery?.pincode}
                                                </p>
                                                <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                                                    <Phone className="h-3 w-3" /> {shipment.delivery?.phone}
                                                </p>
                                            </div>
                                        </div>

                                        {/* Package details */}
                                        <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                                            <span className="flex items-center gap-1">
                                                <Package className="h-3.5 w-3.5" />
                                                {shipment.packages?.length || 0} pkg(s) • {shipment.totalWeight || 0} kg
                                            </span>
                                            <span className="capitalize">{shipment.serviceType}</span>
                                            <span className="capitalize">{shipment.contentType}</span>
                                            <span className="text-xs">
                                                {new Date(shipment.createdAt).toLocaleDateString("en-IN", {
                                                    day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit"
                                                })}
                                            </span>
                                        </div>

                                        {/* Actions */}
                                        {shipment.status === "pending_acceptance" && (
                                            <div className="flex items-center gap-3 pt-3 border-t">
                                                <Button
                                                    className="flex-1 bg-green-600 hover:bg-green-700"
                                                    onClick={() => handleAccept(shipment._id)}
                                                    disabled={actionLoading === shipment._id}
                                                >
                                                    {actionLoading === shipment._id ? (
                                                        <Loader2 className="h-4 w-4 animate-spin mr-1" />
                                                    ) : (
                                                        <CheckCircle className="h-4 w-4 mr-1" />
                                                    )}
                                                    Accept
                                                </Button>
                                                <Button
                                                    variant="destructive"
                                                    className="flex-1"
                                                    onClick={() => handleReject(shipment._id)}
                                                    disabled={actionLoading === shipment._id}
                                                >
                                                    <XCircle className="h-4 w-4 mr-1" /> Reject
                                                </Button>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            </motion.div>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
};

export default CarrierOrders;
