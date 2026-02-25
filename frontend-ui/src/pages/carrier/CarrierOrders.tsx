import { useState, useEffect, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { API_BASE_URL } from "@/config";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    Package, MapPin, Phone, User, ArrowLeft, CheckCircle, XCircle,
    Clock, Truck, Loader2, RefreshCw, Search, Calendar, X
} from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import { io as socketIO, Socket } from "socket.io-client";

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
    pickupDate?: string;
    pickupSlot?: string;
    assignedVehicle?: string;
    assignedDriverName?: string;
}

// --- Time slot options (industry-standard like Delhivery / BlueDart) ---
const TIME_SLOTS = [
    { value: "09:00-12:00", label: "9:00 AM – 12:00 PM (Morning)" },
    { value: "12:00-15:00", label: "12:00 PM – 3:00 PM (Afternoon)" },
    { value: "15:00-18:00", label: "3:00 PM – 6:00 PM (Evening)" },
    { value: "18:00-21:00", label: "6:00 PM – 9:00 PM (Late Evening)" },
];

const VEHICLE_TYPES = [
    { value: "two_wheeler", label: "🏍️ Two Wheeler (up to 5 kg)" },
    { value: "three_wheeler", label: "🛺 Three Wheeler (up to 100 kg)" },
    { value: "mini_van", label: "🚐 Mini Van (up to 500 kg)" },
    { value: "delivery_truck", label: "🚛 Delivery Truck (500+ kg)" },
    { value: "refrigerated", label: "❄️ Refrigerated Van (Temperature-sensitive)" },
];

// --- Schedule Pickup Modal ---
const SchedulePickupModal = ({
    shipment,
    onClose,
    onSchedule,
    loading,
}: {
    shipment: ShipmentData;
    onClose: () => void;
    onSchedule: (data: ScheduleData) => void;
    loading: boolean;
}) => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const minDate = tomorrow.toISOString().split("T")[0];
    const maxDate = new Date(Date.now() + 7 * 86400000).toISOString().split("T")[0]; // 7 days out

    const [form, setForm] = useState<ScheduleData>({
        pickupDate: minDate,
        pickupSlot: "09:00-12:00",
        vehicleType: "two_wheeler",
        driverName: "",
        driverPhone: "",
        instructions: "",
    });

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
            >
                {/* Header */}
                <div className="flex items-center justify-between p-5 border-b bg-gradient-to-r from-blue-50 to-indigo-50 rounded-t-xl">
                    <div>
                        <h2 className="text-lg font-bold flex items-center gap-2">
                            <Calendar className="h-5 w-5 text-blue-600" />
                            Schedule Pickup
                        </h2>
                        <p className="text-sm text-muted-foreground mt-0.5">
                            AWB: <code className="bg-white px-1.5 py-0.5 rounded text-xs font-mono">{shipment.awb}</code>
                        </p>
                    </div>
                    <Button variant="ghost" size="icon" onClick={onClose}>
                        <X className="h-5 w-5" />
                    </Button>
                </div>

                {/* Pickup address summary */}
                <div className="mx-5 mt-4 p-3 bg-green-50 rounded-lg border border-green-100">
                    <p className="text-xs font-medium text-green-700 mb-1 flex items-center gap-1">
                        <MapPin className="h-3 w-3" /> PICKUP FROM
                    </p>
                    <p className="text-sm font-medium">{shipment.pickup?.name}</p>
                    <p className="text-xs text-muted-foreground">{shipment.pickup?.address}, {shipment.pickup?.city} — {shipment.pickup?.pincode}</p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                        <Phone className="h-3 w-3" /> {shipment.pickup?.phone}
                    </p>
                </div>

                {/* Form */}
                <div className="p-5 space-y-4">
                    {/* Date & Slot */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <Label htmlFor="pickupDate" className="text-sm font-medium">
                                Pickup Date <span className="text-red-500">*</span>
                            </Label>
                            <Input
                                id="pickupDate"
                                type="date"
                                min={minDate}
                                max={maxDate}
                                value={form.pickupDate}
                                onChange={(e) => setForm({ ...form, pickupDate: e.target.value })}
                                className="mt-1"
                            />
                            <p className="text-xs text-muted-foreground mt-1">Within next 7 days</p>
                        </div>
                        <div>
                            <Label htmlFor="pickupSlot" className="text-sm font-medium">
                                Time Slot <span className="text-red-500">*</span>
                            </Label>
                            <select
                                id="pickupSlot"
                                value={form.pickupSlot}
                                onChange={(e) => setForm({ ...form, pickupSlot: e.target.value })}
                                className="mt-1 w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring"
                            >
                                {TIME_SLOTS.map((slot) => (
                                    <option key={slot.value} value={slot.value}>{slot.label}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Vehicle Type */}
                    <div>
                        <Label className="text-sm font-medium">Vehicle Type</Label>
                        <div className="grid grid-cols-1 gap-2 mt-2">
                            {VEHICLE_TYPES.map((v) => (
                                <label
                                    key={v.value}
                                    className={`flex items-center gap-2 p-2.5 rounded-lg border cursor-pointer transition-all text-sm ${form.vehicleType === v.value
                                        ? "border-blue-500 bg-blue-50 ring-1 ring-blue-500"
                                        : "border-gray-200 hover:border-gray-300"
                                        }`}
                                >
                                    <input
                                        type="radio"
                                        name="vehicleType"
                                        value={v.value}
                                        checked={form.vehicleType === v.value}
                                        onChange={() => setForm({ ...form, vehicleType: v.value })}
                                        className="sr-only"
                                    />
                                    <span>{v.label}</span>
                                </label>
                            ))}
                        </div>
                    </div>

                    {/* Driver details (optional) */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <Label htmlFor="driverName" className="text-sm font-medium">Driver Name</Label>
                            <Input
                                id="driverName"
                                placeholder="e.g. Ramesh Kumar"
                                value={form.driverName}
                                onChange={(e) => setForm({ ...form, driverName: e.target.value })}
                                className="mt-1"
                            />
                        </div>
                        <div>
                            <Label htmlFor="driverPhone" className="text-sm font-medium">Driver Phone</Label>
                            <Input
                                id="driverPhone"
                                placeholder="e.g. 9876543210"
                                value={form.driverPhone}
                                onChange={(e) => setForm({ ...form, driverPhone: e.target.value })}
                                className="mt-1"
                            />
                        </div>
                    </div>

                    {/* Special Instructions */}
                    <div>
                        <Label htmlFor="instructions" className="text-sm font-medium">Special Instructions</Label>
                        <Textarea
                            id="instructions"
                            placeholder="e.g. Call before arriving, fragile items, gate code 1234, use back entrance..."
                            value={form.instructions}
                            onChange={(e) => setForm({ ...form, instructions: e.target.value })}
                            className="mt-1"
                            rows={3}
                        />
                    </div>
                </div>

                {/* Footer Actions */}
                <div className="flex items-center gap-3 p-5 border-t bg-gray-50 rounded-b-xl">
                    <Button variant="outline" className="flex-1" onClick={onClose} disabled={loading}>
                        Cancel
                    </Button>
                    <Button
                        className="flex-1 bg-blue-600 hover:bg-blue-700"
                        onClick={() => onSchedule(form)}
                        disabled={loading || !form.pickupDate || !form.pickupSlot}
                    >
                        {loading ? (
                            <><Loader2 className="h-4 w-4 animate-spin mr-2" />Scheduling...</>
                        ) : (
                            <><Calendar className="h-4 w-4 mr-2" />Confirm Schedule</>
                        )}
                    </Button>
                </div>
            </motion.div>
        </div>
    );
};

interface ScheduleData {
    pickupDate: string;
    pickupSlot: string;
    vehicleType: string;
    driverName: string;
    driverPhone: string;
    instructions: string;
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
    const [scheduleShipment, setScheduleShipment] = useState<ShipmentData | null>(null);

    const token = localStorage.getItem("carrierToken");
    const headers = () => ({ Authorization: `Bearer ${token}`, "Content-Type": "application/json" });

    const fetchShipments = async () => {
        if (!token) { navigate("/carrier/login"); return; }
        setLoading(true);
        try {
            // Active = accepted + pickup_scheduled + picked_up
            const statusMap: Record<string, string> = {
                new: "pending_acceptance",
                active: "accepted,pickup_scheduled,picked_up",
                transit: "in_transit,out_for_delivery",
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

    // Socket.IO: listen for new shipments in real time
    useEffect(() => {
        const carrierId = localStorage.getItem("carrierId");
        if (!carrierId) return;

        const socket: Socket = socketIO(API_BASE_URL, {
            query: { type: 'carrier', carrierId },
            transports: ['websocket', 'polling']
        });

        socket.on('connect', () => {
            socket.emit('join_carrier', { carrierId });
        });

        socket.on('new_shipment', () => {
            toast({
                title: "🔔 New Shipment!",
                description: "A new shipment has been assigned to you.",
            });
            if (tab === 'new') fetchShipments();
        });

        socket.on('shipment_status_updated', () => {
            fetchShipments();
        });

        return () => { socket.disconnect(); };
    }, [tab]);

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

    const handleSchedulePickup = async (id: string, scheduleData: ScheduleData) => {
        setActionLoading(id);
        try {
            const body = {
                status: "pickup_scheduled",
                pickupDate: scheduleData.pickupDate,
                pickupSlot: scheduleData.pickupSlot,
                vehicleType: scheduleData.vehicleType,
                driverName: scheduleData.driverName,
                driverPhone: scheduleData.driverPhone,
                description: scheduleData.instructions
                    ? `Pickup scheduled. Instructions: ${scheduleData.instructions}`
                    : `Pickup scheduled for ${new Date(scheduleData.pickupDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })} (${scheduleData.pickupSlot})`,
            };
            const res = await fetch(`${API_BASE_URL}/api/shipments/carrier/${id}/update-status`, {
                method: "PUT", headers: headers(), body: JSON.stringify(body),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message);
            toast({
                title: "✅ Pickup Scheduled!",
                description: `${new Date(scheduleData.pickupDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} • ${scheduleData.pickupSlot}`
            });
            setScheduleShipment(null);
            fetchShipments();
        } catch (error: any) {
            toast({ title: "Error", description: error.message, variant: "destructive" });
        } finally {
            setActionLoading(null);
        }
    };

    const handleStatusUpdate = async (id: string, newStatus: string) => {
        setActionLoading(id);
        try {
            const res = await fetch(`${API_BASE_URL}/api/shipments/carrier/${id}/update-status`, {
                method: "PUT", headers: headers(), body: JSON.stringify({ status: newStatus })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message);
            toast({
                title: "Status Updated",
                description: `Shipment updated to ${newStatus.replace(/_/g, ' ')}`
            });
            fetchShipments();
        } catch (error: any) {
            toast({ title: "Error", description: error.message, variant: "destructive" });
        } finally {
            setActionLoading(null);
        }
    };

    const getNextStatusAction = (status: string): { label: string; nextStatus: string; icon: string; isSchedule?: boolean } | null => {
        const map: Record<string, { label: string; nextStatus: string; icon: string; isSchedule?: boolean }> = {
            accepted: { label: "Schedule Pickup", nextStatus: "pickup_scheduled", icon: "📋", isSchedule: true },
            pickup_scheduled: { label: "Mark Picked Up", nextStatus: "picked_up", icon: "📦" },
            picked_up: { label: "Mark In Transit", nextStatus: "in_transit", icon: "🚚" },
            in_transit: { label: "Out for Delivery", nextStatus: "out_for_delivery", icon: "🏍️" },
            out_for_delivery: { label: "Mark Delivered", nextStatus: "delivered", icon: "✅" },
        };
        return map[status] || null;
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

                                        {/* Scheduled Pickup Info */}
                                        {shipment.status === "pickup_scheduled" && shipment.pickupDate && (
                                            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4 flex items-center gap-3">
                                                <Calendar className="h-5 w-5 text-amber-600 flex-shrink-0" />
                                                <div>
                                                    <p className="text-sm font-medium text-amber-800">
                                                        Pickup: {new Date(shipment.pickupDate).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}
                                                        {shipment.pickupSlot && ` • ${shipment.pickupSlot}`}
                                                    </p>
                                                    {shipment.assignedVehicle && (
                                                        <p className="text-xs text-amber-700">Vehicle: {shipment.assignedVehicle.replace(/_/g, ' ')}</p>
                                                    )}
                                                    {shipment.assignedDriverName && (
                                                        <p className="text-xs text-amber-700">Driver: {shipment.assignedDriverName}</p>
                                                    )}
                                                </div>
                                            </div>
                                        )}

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

                                        {/* Status progression actions */}
                                        {getNextStatusAction(shipment.status) && (
                                            <div className="flex items-center gap-3 pt-3 border-t">
                                                <Button
                                                    className="flex-1 bg-blue-600 hover:bg-blue-700"
                                                    onClick={() => {
                                                        const action = getNextStatusAction(shipment.status)!;
                                                        if (action.isSchedule) {
                                                            setScheduleShipment(shipment);
                                                        } else {
                                                            handleStatusUpdate(shipment._id, action.nextStatus);
                                                        }
                                                    }}
                                                    disabled={actionLoading === shipment._id}
                                                >
                                                    {actionLoading === shipment._id ? (
                                                        <Loader2 className="h-4 w-4 animate-spin mr-1" />
                                                    ) : (
                                                        <span className="mr-1">{getNextStatusAction(shipment.status)!.icon}</span>
                                                    )}
                                                    {getNextStatusAction(shipment.status)!.label}
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

            {/* Schedule Pickup Modal */}
            <AnimatePresence>
                {scheduleShipment && (
                    <SchedulePickupModal
                        shipment={scheduleShipment}
                        onClose={() => setScheduleShipment(null)}
                        onSchedule={(data) => handleSchedulePickup(scheduleShipment._id, data)}
                        loading={actionLoading === scheduleShipment._id}
                    />
                )}
            </AnimatePresence>
        </div>
    );
};

export default CarrierOrders;
