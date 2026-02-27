import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import DashboardLayout from "@/components/DashboardLayout";
import { useToast } from "@/hooks/use-toast";
import { API_BASE_URL } from "@/config";
import {
    ArrowLeft, RotateCcw, Package, MapPin, Phone, User,
    AlertTriangle, Loader2, CheckCircle, Truck
} from "lucide-react";

const REASON_CODES = [
    { code: "CUSTOMER_NA", label: "Customer Not Available", desc: "Customer was not available at the delivery address" },
    { code: "ADDRESS_ISSUE", label: "Address Issue", desc: "Incorrect or incomplete delivery address" },
    { code: "REFUSED", label: "Customer Refused", desc: "Customer refused to accept the delivery" },
    { code: "FAILED_ATTEMPTS", label: "Failed Delivery Attempts", desc: "Multiple delivery attempts unsuccessful" },
    { code: "DAMAGED", label: "Package Damaged", desc: "Package was damaged during transit" },
    { code: "REGULATORY", label: "Regulatory Issue", desc: "Regulatory or compliance issue" },
    { code: "RESCHEDULED", label: "Rescheduled by Customer", desc: "Customer requested rescheduling" },
    { code: "UNSERVICEABLE", label: "Unserviceable Area", desc: "Delivery area is not serviceable" },
    { code: "OTHER", label: "Other", desc: "Other reason" },
];

interface ShipmentData {
    _id: string;
    awb: string;
    status: string;
    pickup?: { name?: string; phone?: string; address?: string; city?: string; state?: string; pincode?: string };
    delivery?: { name?: string; phone?: string; address?: string; city?: string; state?: string; pincode?: string };
    packages?: { name?: string; weight?: number }[];
    contentType?: string;
    carrier?: string;
}

const CreateReturn = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const shipmentId = searchParams.get("shipmentId");
    const { toast } = useToast();

    const [shipment, setShipment] = useState<ShipmentData | null>(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [selectedReason, setSelectedReason] = useState("");
    const [description, setDescription] = useState("");

    useEffect(() => {
        if (!shipmentId) {
            setLoading(false);
            return;
        }
        fetchShipment();
    }, [shipmentId]);

    const fetchShipment = async () => {
        try {
            const token = localStorage.getItem("token");
            const res = await fetch(`${API_BASE_URL}/api/shipments/${shipmentId}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await res.json();
            if (data.shipment) {
                setShipment(data.shipment);
            } else if (data._id) {
                setShipment(data);
            }
        } catch (err) {
            toast({ title: "Error", description: "Failed to load shipment details", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async () => {
        if (!selectedReason) {
            toast({ title: "Required", description: "Please select a return reason", variant: "destructive" });
            return;
        }
        if (!shipment) return;

        setSubmitting(true);
        try {
            const token = localStorage.getItem("token");
            const res = await fetch(`${API_BASE_URL}/api/wms/rtd`, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    shipmentId: shipment.awb || shipment._id,
                    reasonCode: selectedReason,
                    description,
                }),
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.message || "Failed to create return");

            toast({ title: "Return Created", description: `Return ${data.rtdId} has been initiated successfully` });
            navigate("/returns");
        } catch (err: any) {
            toast({ title: "Error", description: err.message, variant: "destructive" });
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <DashboardLayout>
                <div className="flex items-center justify-center py-20">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            <div className="max-w-3xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold flex items-center gap-2">
                            <RotateCcw className="h-6 w-6 text-primary" />
                            Create Return
                        </h1>
                        <p className="text-muted-foreground">Initiate a return-to-origin (RTO) request</p>
                    </div>
                </div>

                {/* Shipment Summary */}
                {shipment ? (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                        <Card>
                            <CardHeader className="pb-3">
                                <div className="flex items-center justify-between">
                                    <CardTitle className="text-base">Shipment Details</CardTitle>
                                    <Badge variant="secondary">{shipment.status?.replace(/_/g, " ")}</Badge>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex items-center gap-2 text-sm">
                                    <Package className="h-4 w-4 text-muted-foreground" />
                                    <span className="font-medium">AWB:</span>
                                    <span className="font-mono">{shipment.awb}</span>
                                    {shipment.carrier && (
                                        <>
                                            <span className="text-muted-foreground">•</span>
                                            <Truck className="h-4 w-4 text-muted-foreground" />
                                            <span>{shipment.carrier}</span>
                                        </>
                                    )}
                                </div>

                                <div className="grid md:grid-cols-2 gap-4">
                                    {/* Pickup */}
                                    <div className="rounded-lg border p-3 space-y-1">
                                        <p className="text-xs font-medium text-green-600 flex items-center gap-1">
                                            <MapPin className="h-3 w-3" /> Pickup (From)
                                        </p>
                                        <p className="font-medium text-sm">{shipment.pickup?.name || "—"}</p>
                                        <p className="text-xs text-muted-foreground">{shipment.pickup?.address}, {shipment.pickup?.city} - {shipment.pickup?.pincode}</p>
                                        {shipment.pickup?.phone && (
                                            <p className="text-xs text-muted-foreground flex items-center gap-1">
                                                <Phone className="h-3 w-3" /> {shipment.pickup.phone}
                                            </p>
                                        )}
                                    </div>

                                    {/* Delivery */}
                                    <div className="rounded-lg border p-3 space-y-1">
                                        <p className="text-xs font-medium text-red-500 flex items-center gap-1">
                                            <MapPin className="h-3 w-3" /> Delivery (To)
                                        </p>
                                        <p className="font-medium text-sm">{shipment.delivery?.name || "—"}</p>
                                        <p className="text-xs text-muted-foreground">{shipment.delivery?.address}, {shipment.delivery?.city} - {shipment.delivery?.pincode}</p>
                                        {shipment.delivery?.phone && (
                                            <p className="text-xs text-muted-foreground flex items-center gap-1">
                                                <Phone className="h-3 w-3" /> {shipment.delivery.phone}
                                            </p>
                                        )}
                                    </div>
                                </div>

                                {shipment.packages && shipment.packages.length > 0 && (
                                    <div className="text-sm text-muted-foreground">
                                        <span className="font-medium text-foreground">Package:</span>{" "}
                                        {shipment.packages.map(p => p.name).join(", ")} •{" "}
                                        {shipment.packages.reduce((sum, p) => sum + (p.weight || 0), 0)} kg
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </motion.div>
                ) : (
                    <Card>
                        <CardContent className="py-8 text-center">
                            <AlertTriangle className="h-10 w-10 text-yellow-500 mx-auto mb-3" />
                            <p className="font-medium">Shipment not found</p>
                            <p className="text-sm text-muted-foreground mt-1">
                                The shipment ID "{shipmentId}" could not be loaded.
                            </p>
                        </CardContent>
                    </Card>
                )}

                {/* Return Reason */}
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">Return Reason</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {REASON_CODES.map((reason) => (
                                    <div
                                        key={reason.code}
                                        className={`rounded-lg border-2 p-3 cursor-pointer transition-all ${selectedReason === reason.code
                                                ? "border-primary bg-primary/5 shadow-sm"
                                                : "border-transparent bg-gray-50 hover:border-gray-200 hover:bg-gray-100"
                                            }`}
                                        onClick={() => setSelectedReason(reason.code)}
                                    >
                                        <div className="flex items-start gap-2">
                                            <div className={`mt-0.5 h-4 w-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${selectedReason === reason.code ? "border-primary" : "border-gray-300"
                                                }`}>
                                                {selectedReason === reason.code && (
                                                    <div className="h-2 w-2 rounded-full bg-primary" />
                                                )}
                                            </div>
                                            <div>
                                                <p className="font-medium text-sm">{reason.label}</p>
                                                <p className="text-xs text-muted-foreground">{reason.desc}</p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="space-y-2">
                                <Label>Additional Details (Optional)</Label>
                                <Textarea
                                    placeholder="Provide any additional context or details about the return..."
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    rows={3}
                                />
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>

                {/* Actions */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="flex items-center justify-between"
                >
                    <Button variant="outline" onClick={() => navigate(-1)}>
                        Cancel
                    </Button>
                    <Button
                        onClick={handleSubmit}
                        disabled={!selectedReason || !shipment || submitting}
                        className="gap-2 gradient-primary"
                    >
                        {submitting ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            <CheckCircle className="h-4 w-4" />
                        )}
                        {submitting ? "Creating Return..." : "Create Return Request"}
                    </Button>
                </motion.div>
            </div>
        </DashboardLayout>
    );
};

export default CreateReturn;
