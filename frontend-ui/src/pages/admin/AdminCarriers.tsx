import { useState, useEffect } from "react";
import { API_BASE_URL } from "@/config";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
    Truck, CheckCircle, XCircle, Clock, Search, Building2, MapPin,
    Phone, Mail, Star, Loader2, Shield, AlertCircle
} from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";

interface CarrierData {
    _id: string;
    businessName: string;
    contactPerson: string;
    email: string;
    phone: string;
    gstin?: string;
    panNumber?: string;
    partnerDetails?: {
        fleetDetails?: { totalVehicles: number; vehicleTypes: string[] };
        serviceZones?: { state: string; pincodes: string[] }[];
        supportedTypes?: string[];
        baseFare: number;
        perKgRate: number;
        rating: number;
        eta: string;
        features: string[];
        webhookUrl?: string;
        status: string;
        rejectionReason?: string;
        approvedAt?: string;
    };
    createdAt: string;
}

const AdminCarriers = () => {
    const { toast } = useToast();
    const [tab, setTab] = useState("pending_approval");
    const [carriers, setCarriers] = useState<CarrierData[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [search, setSearch] = useState("");

    const token = localStorage.getItem("token");
    const headers = () => ({ Authorization: `Bearer ${token}`, "Content-Type": "application/json" });

    const fetchCarriers = async () => {
        setLoading(true);
        try {
            const statusParam = tab !== "all" ? `?status=${tab}` : "";
            const res = await fetch(`${API_BASE_URL}/api/carriers${statusParam}`, {
                headers: headers(),
            });
            const data = await res.json();
            if (data.success) setCarriers(data.carriers);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchCarriers(); }, [tab]);

    const handleApprove = async (id: string) => {
        setActionLoading(id);
        try {
            const res = await fetch(`${API_BASE_URL}/api/carriers/${id}/approve`, {
                method: "PUT", headers: headers()
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message);
            toast({ title: "Carrier Approved", description: data.message });
            fetchCarriers();
        } catch (error: any) {
            toast({ title: "Error", description: error.message, variant: "destructive" });
        } finally {
            setActionLoading(null);
        }
    };

    const handleReject = async (id: string) => {
        const reason = prompt("Rejection reason:");
        if (!reason) return;
        setActionLoading(id);
        try {
            const res = await fetch(`${API_BASE_URL}/api/carriers/${id}/reject`, {
                method: "PUT", headers: headers(), body: JSON.stringify({ reason })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message);
            toast({ title: "Carrier Rejected", description: data.message });
            fetchCarriers();
        } catch (error: any) {
            toast({ title: "Error", description: error.message, variant: "destructive" });
        } finally {
            setActionLoading(null);
        }
    };

    const getStatusBadge = (status: string) => {
        const map: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
            pending_approval: { label: "Pending", variant: "default" },
            approved: { label: "Approved", variant: "secondary" },
            rejected: { label: "Rejected", variant: "destructive" },
            suspended: { label: "Suspended", variant: "outline" },
        };
        const s = map[status] || { label: status, variant: "outline" as const };
        return <Badge variant={s.variant}>{s.label}</Badge>;
    };

    const filtered = carriers.filter((c) =>
        !search ||
        c.businessName.toLowerCase().includes(search.toLowerCase()) ||
        c.contactPerson.toLowerCase().includes(search.toLowerCase()) ||
        c.email.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <DashboardLayout>
            <div className="space-y-6">
                <div>
                    <h1 className="text-2xl font-bold">Carrier Management</h1>
                    <p className="text-muted-foreground">Review and manage carrier registrations</p>
                </div>

                <Tabs value={tab} onValueChange={setTab}>
                    <TabsList>
                        <TabsTrigger value="pending_approval">
                            <Clock className="h-4 w-4 mr-1" /> Pending
                        </TabsTrigger>
                        <TabsTrigger value="approved">
                            <CheckCircle className="h-4 w-4 mr-1" /> Approved
                        </TabsTrigger>
                        <TabsTrigger value="rejected">
                            <XCircle className="h-4 w-4 mr-1" /> Rejected
                        </TabsTrigger>
                        <TabsTrigger value="all">All</TabsTrigger>
                    </TabsList>
                </Tabs>

                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        className="pl-10"
                        placeholder="Search carriers..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>

                {loading ? (
                    <div className="flex justify-center py-20">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="text-center py-20">
                        <Truck className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <h3 className="text-lg font-medium">No carriers found</h3>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {filtered.map((carrier, i) => (
                            <motion.div
                                key={carrier._id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.05 }}
                            >
                                <Card className="hover:shadow-md transition-shadow">
                                    <CardContent className="p-5">
                                        <div className="flex items-start justify-between mb-3">
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <Building2 className="h-5 w-5 text-primary" />
                                                    <h3 className="font-semibold text-lg">{carrier.businessName}</h3>
                                                    {getStatusBadge(carrier.partnerDetails?.status || "pending_approval")}
                                                </div>
                                                <p className="text-sm text-muted-foreground mt-1 flex items-center gap-4">
                                                    <span className="flex items-center gap-1"><Mail className="h-3 w-3" /> {carrier.email}</span>
                                                    <span className="flex items-center gap-1"><Phone className="h-3 w-3" /> {carrier.phone}</span>
                                                    <span className="flex items-center gap-1"><Star className="h-3 w-3" /> {carrier.partnerDetails?.rating || 4.0}</span>
                                                </p>
                                            </div>
                                            <div className="text-right text-sm text-muted-foreground">
                                                <p>Applied: {new Date(carrier.createdAt).toLocaleDateString("en-IN")}</p>
                                                {carrier.partnerDetails?.approvedAt && <p>Approved: {new Date(carrier.partnerDetails.approvedAt).toLocaleDateString("en-IN")}</p>}
                                            </div>
                                        </div>

                                        {/* Details Grid */}
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3 text-sm">
                                            <div className="bg-gray-50 rounded p-2">
                                                <p className="text-xs text-muted-foreground">Fleet</p>
                                                <p className="font-medium">{carrier.partnerDetails?.fleetDetails?.totalVehicles || 0} vehicles</p>
                                                {carrier.partnerDetails?.fleetDetails?.vehicleTypes && (
                                                    <p className="text-xs text-muted-foreground">{carrier.partnerDetails.fleetDetails.vehicleTypes.join(", ")}</p>
                                                )}
                                            </div>
                                            <div className="bg-gray-50 rounded p-2">
                                                <p className="text-xs text-muted-foreground">Base Fare</p>
                                                <p className="font-medium">₹{carrier.partnerDetails?.baseFare || 0}</p>
                                                <p className="text-xs text-muted-foreground">+ ₹{carrier.partnerDetails?.perKgRate || 0}/kg</p>
                                            </div>
                                            <div className="bg-gray-50 rounded p-2">
                                                <p className="text-xs text-muted-foreground">ETA</p>
                                                <p className="font-medium">{carrier.partnerDetails?.eta || "N/A"}</p>
                                            </div>
                                            <div className="bg-gray-50 rounded p-2">
                                                <p className="text-xs text-muted-foreground">Types</p>
                                                <p className="font-medium text-xs">{carrier.partnerDetails?.supportedTypes?.join(", ") || "Standard"}</p>
                                            </div>
                                        </div>

                                        {carrier.partnerDetails?.serviceZones && carrier.partnerDetails.serviceZones.length > 0 && (
                                            <div className="mb-3">
                                                <p className="text-xs text-muted-foreground mb-1">Service Zones:</p>
                                                <div className="flex flex-wrap gap-1">
                                                    {carrier.partnerDetails.serviceZones.map((z, zi) => (
                                                        <Badge key={zi} variant="outline" className="text-xs">
                                                            <MapPin className="h-3 w-3 mr-1" /> {z.state}
                                                        </Badge>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {carrier.partnerDetails?.features && carrier.partnerDetails.features.length > 0 && (
                                            <div className="mb-3 flex flex-wrap gap-1">
                                                {carrier.partnerDetails.features.map((f, fi) => (
                                                    <span key={fi} className="bg-primary/10 text-primary text-xs px-2 py-0.5 rounded-full">{f}</span>
                                                ))}
                                            </div>
                                        )}

                                        {carrier.partnerDetails?.rejectionReason && (
                                            <div className="bg-red-50 text-red-700 rounded p-2 text-sm mb-3 flex items-start gap-2">
                                                <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                                                <span>Rejection reason: {carrier.partnerDetails.rejectionReason}</span>
                                            </div>
                                        )}

                                        {/* Actions */}
                                        {carrier.partnerDetails?.status === "pending_approval" && (
                                            <div className="flex items-center gap-3 pt-3 border-t">
                                                <Button
                                                    className="flex-1 bg-green-600 hover:bg-green-700"
                                                    onClick={() => handleApprove(carrier._id)}
                                                    disabled={actionLoading === carrier._id}
                                                >
                                                    {actionLoading === carrier._id ? (
                                                        <Loader2 className="h-4 w-4 animate-spin mr-1" />
                                                    ) : (
                                                        <CheckCircle className="h-4 w-4 mr-1" />
                                                    )}
                                                    Approve
                                                </Button>
                                                <Button
                                                    variant="destructive"
                                                    className="flex-1"
                                                    onClick={() => handleReject(carrier._id)}
                                                    disabled={actionLoading === carrier._id}
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
            </div>
        </DashboardLayout>
    );
};

export default AdminCarriers;
