import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Search, Package, MapPin, Clock, CheckCircle, Eye, Truck,
  Loader2, Radio, User, Navigation, AlertCircle, Calendar, Phone, X, RefreshCw, XCircle
} from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { authApi } from "@/lib/api";
import DashboardLayout from "@/components/DashboardLayout";
import { API_BASE_URL } from "@/config";
import { motion, AnimatePresence } from "framer-motion";

interface ParcelData {
  _id: string;
  parcelId: string;
  barcode: string;
  orderId: string;
  awb: string;
  packageName: string;
  packageDescription: string;
  status: string;
  scannedAt: string;
  deliveredAt: string;
  scannedBy: { partnerId: string; name: string };
  receiver: { name?: string; phone?: string; address?: string; city?: string; pincode?: string };
}

// --- Carrier/Direct Shipment Types & Constants ---
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

interface ScheduleData {
  pickupDate: string;
  pickupSlot: string;
  vehicleType: string;
  driverName: string;
  driverPhone: string;
  instructions: string;
}

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
  const maxDate = new Date(Date.now() + 7 * 86400000).toISOString().split("T")[0];

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

        <div className="p-5 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="pickupDate" className="text-sm font-medium">Pickup Date *</Label>
              <Input id="pickupDate" type="date" min={minDate} max={maxDate} value={form.pickupDate} onChange={(e) => setForm({ ...form, pickupDate: e.target.value })} className="mt-1" />
            </div>
            <div>
              <Label htmlFor="pickupSlot" className="text-sm font-medium">Time Slot *</Label>
              <select id="pickupSlot" value={form.pickupSlot} onChange={(e) => setForm({ ...form, pickupSlot: e.target.value })} className="mt-1 w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm">
                {TIME_SLOTS.map((slot) => (<option key={slot.value} value={slot.value}>{slot.label}</option>))}
              </select>
            </div>
          </div>

          <div>
            <Label className="text-sm font-medium">Vehicle Type</Label>
            <div className="grid grid-cols-1 gap-2 mt-2">
              {VEHICLE_TYPES.map((v) => (
                <label key={v.value} className={`flex items-center gap-2 p-2.5 rounded-lg border cursor-pointer transition-all text-sm ${form.vehicleType === v.value ? "border-blue-500 bg-blue-50 ring-1 ring-blue-500" : "border-gray-200 hover:border-gray-300"}`}>
                  <input type="radio" name="vehicleType" value={v.value} checked={form.vehicleType === v.value} onChange={() => setForm({ ...form, vehicleType: v.value })} className="sr-only" />
                  <span>{v.label}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="driverName" className="text-sm font-medium">Driver Name</Label>
              <Input id="driverName" placeholder="e.g. Ramesh" value={form.driverName} onChange={(e) => setForm({ ...form, driverName: e.target.value })} className="mt-1" />
            </div>
            <div>
              <Label htmlFor="driverPhone" className="text-sm font-medium">Driver Phone</Label>
              <Input id="driverPhone" placeholder="e.g. 9876543210" value={form.driverPhone} onChange={(e) => setForm({ ...form, driverPhone: e.target.value })} className="mt-1" />
            </div>
          </div>

          <div>
            <Label htmlFor="instructions" className="text-sm font-medium">Special Instructions</Label>
            <Textarea id="instructions" placeholder="e.g. Call before arriving..." value={form.instructions} onChange={(e) => setForm({ ...form, instructions: e.target.value })} className="mt-1" rows={3} />
          </div>
        </div>

        <div className="flex items-center gap-3 p-5 border-t bg-gray-50 rounded-b-xl">
          <Button variant="outline" className="flex-1" onClick={onClose} disabled={loading}>Cancel</Button>
          <Button className="flex-1 bg-blue-600 hover:bg-blue-700" onClick={() => onSchedule(form)} disabled={loading || !form.pickupDate || !form.pickupSlot}>
            {loading ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Scheduling...</> : <><Calendar className="h-4 w-4 mr-2" />Confirm Schedule</>}
          </Button>
        </div>
      </motion.div>
    </div>
  );
};

const PartnerOrders = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const user = authApi.getCurrentUser();
  const [viewType, setViewType] = useState<"scans" | "shipments">("scans");

  // Read query parameters
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const tabParam = searchParams.get("tab");
    if (tabParam && ["new", "active", "transit", "completed"].includes(tabParam)) {
      setViewType("shipments");
      setShipmentsTab(tabParam);
    }
  }, [location.search]);

  // --- Scans State ---
  const [parcels, setParcels] = useState<ParcelData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [selectedParcel, setSelectedParcel] = useState<ParcelData | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [assigning, setAssigning] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // --- Shipments State ---
  const [shipments, setShipments] = useState<ShipmentData[]>([]);
  const [shipmentsTab, setShipmentsTab] = useState("new");
  const [shipmentsLoading, setShipmentsLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [scheduleShipment, setScheduleShipment] = useState<ShipmentData | null>(null);

  // Fetch real parcels
  useEffect(() => {
    fetchParcels();
  }, []);

  const fetchParcels = async () => {
    setError(null);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE_URL}/api/parcels/partner/my-scans?limit=100`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const data = await res.json();
      if (data.success && data.parcels) {
        setParcels(data.parcels);
      } else {
        setError(data.message || "Failed to load parcels");
      }
    } catch (err: any) {
      console.error("Failed to fetch parcels:", err);
      setError(`Network error: ${err.message}. Make sure the backend is running.`);
    } finally {
      setLoading(false);
    }
  };

  // Auto-assign driver to a parcel
  const handleAssignDriver = async (parcelId: string) => {
    setAssigning(parcelId);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE_URL}/api/parcels/${parcelId}/assign-driver`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      const data = await res.json();
      if (data.success) {
        toast({
          title: "Driver Assigned",
          description: data.message,
        });
        fetchParcels(); // Refresh
      } else {
        toast({
          title: "Assignment Failed",
          description: data.message || "Could not assign driver",
          variant: "destructive",
        });
      }
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to assign driver",
        variant: "destructive",
      });
    } finally {
      setAssigning(null);
    }
  };

  // --- Shipments Logic ---
  const fetchShipments = async () => {
    setShipmentsLoading(true);
    try {
      const token = localStorage.getItem("token");
      const statusMap: Record<string, string> = {
        new: "pending_acceptance",
        active: "accepted,pickup_scheduled,picked_up",
        transit: "in_transit,out_for_delivery",
        completed: "delivered",
      };
      const status = statusMap[shipmentsTab] || "";
      const url = `${API_BASE_URL}/api/shipments/carrier/incoming${status ? `?status=${status}` : ""}`;
      const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (data.success) setShipments(data.shipments);
    } catch (error) {
      console.error(error);
    } finally {
      setShipmentsLoading(false);
    }
  };

  useEffect(() => {
    if (viewType === "shipments" && user?.role === "shipment_partner") {
      fetchShipments();
    }
  }, [shipmentsTab, viewType]);

  const handleAccept = async (id: string) => {
    setActionLoading(id);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE_URL}/api/shipments/carrier/${id}/accept`, {
        method: "PUT", headers: { Authorization: `Bearer ${token}` }
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
    if (reason === null) return;

    setActionLoading(id);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE_URL}/api/shipments/carrier/${id}/reject`, {
        method: "PUT", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }, body: JSON.stringify({ reason })
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
      const token = localStorage.getItem("token");
      const body = {
        status: "pickup_scheduled",
        pickupDate: scheduleData.pickupDate,
        pickupSlot: scheduleData.pickupSlot,
        vehicleType: scheduleData.vehicleType,
        driverName: scheduleData.driverName,
        driverPhone: scheduleData.driverPhone,
        description: scheduleData.instructions
          ? `Pickup scheduled. Instructions: ${scheduleData.instructions}`
          : `Pickup scheduled for ${new Date(scheduleData.pickupDate).toLocaleDateString('en-IN')}`,
      };
      const res = await fetch(`${API_BASE_URL}/api/shipments/carrier/${id}/update-status`, {
        method: "PUT", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }, body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      toast({ title: "✅ Pickup Scheduled!", description: `For ${new Date(scheduleData.pickupDate).toLocaleDateString()} • ${scheduleData.pickupSlot}` });
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
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE_URL}/api/shipments/carrier/${id}/update-status`, {
        method: "PUT", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }, body: JSON.stringify({ status: newStatus })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      toast({ title: "Status Updated", description: `Shipment updated to ${newStatus.replace(/_/g, ' ')}` });
      fetchShipments();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setActionLoading(null);
    }
  };

  const getNextStatusAction = (status: string) => {
    const map: Record<string, { label: string; nextStatus: string; icon: any; isSchedule?: boolean }> = {
      accepted: { label: "Schedule Pickup", nextStatus: "pickup_scheduled", icon: Calendar, isSchedule: true },
      pickup_scheduled: { label: "Mark Picked Up", nextStatus: "picked_up", icon: Package },
      picked_up: { label: "Mark In Transit", nextStatus: "in_transit", icon: Truck },
      in_transit: { label: "Out for Delivery", nextStatus: "out_for_delivery", icon: MapPin },
      out_for_delivery: { label: "Mark Delivered", nextStatus: "delivered", icon: CheckCircle },
    };
    return map[status] || null;
  };

  const getShipmentStatusBadge = (status: string) => {
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

  // --- End Shipments Logic ---

  const getStatusBadge = (status: string) => {
    const map: Record<string, { label: string; color: string; icon: any }> = {
      scanned: { label: "Scanned", color: "bg-blue-100 text-blue-800", icon: Package },
      in_warehouse: { label: "In Warehouse", color: "bg-indigo-100 text-indigo-800", icon: Package },
      dispatched: { label: "Dispatched", color: "bg-purple-100 text-purple-800", icon: Truck },
      in_transit: { label: "In Transit", color: "bg-orange-100 text-orange-800", icon: Navigation },
      out_for_delivery: { label: "Out for Delivery", color: "bg-yellow-100 text-yellow-800", icon: MapPin },
      delivered: { label: "Delivered", color: "bg-green-100 text-green-800", icon: CheckCircle },
      returned: { label: "Returned", color: "bg-red-100 text-red-800", icon: AlertCircle },
      failed: { label: "Failed", color: "bg-red-100 text-red-800", icon: AlertCircle },
    };
    const s = map[status] || { label: status, color: "bg-gray-100 text-gray-800", icon: Package };
    const Icon = s.icon;
    return (
      <Badge className={s.color}>
        <Icon className="h-3 w-3 mr-1" /> {s.label}
      </Badge>
    );
  };

  const filterByTab = (parcel: ParcelData) => {
    switch (activeTab) {
      case "scanned": return parcel.status === "scanned" || parcel.status === "in_warehouse";
      case "transit": return ["dispatched", "in_transit", "out_for_delivery"].includes(parcel.status);
      case "delivered": return parcel.status === "delivered";
      case "all": return true;
      default: return true;
    }
  };

  const filteredParcels = parcels.filter((p) => {
    const matchesSearch =
      p.parcelId?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.barcode?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.packageName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.receiver?.city?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch && filterByTab(p);
  });

  const filteredShipments = shipments.filter((s) =>
    !searchQuery ||
    s.awb?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.pickup?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.delivery?.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatDate = (d: string) => d ? new Date(d).toLocaleDateString() : "—";
  const formatTime = (d: string) => d ? new Date(d).toLocaleString() : "—";

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Package className="h-6 w-6 text-primary" />
              Partner Operations
            </h1>
            <p className="text-muted-foreground">
              Manage your warehouse scans and direct platform shipments
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              className="gap-2"
              onClick={() => navigate("/partner/fleet-view")}
            >
              <Radio className="h-4 w-4" />
              Fleet View
            </Button>
            {viewType === "shipments" && (
              <Button variant="outline" onClick={fetchShipments}>
                <RefreshCw className="h-4 w-4 mr-1" /> Refresh
              </Button>
            )}
          </div>
        </div>

        {/* --- View Toggle --- */}
        <div className="flex p-1 bg-gray-100 rounded-lg w-full max-w-md mx-auto">
          <button
            className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${viewType === "scans" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-900"}`}
            onClick={() => setViewType("scans")}
          >
            Warehouse Scans
          </button>
          {user?.role === "shipment_partner" && (
            <button
              className={`flex-1 flex justify-center items-center gap-1 py-2 text-sm font-medium rounded-md transition-all ${viewType === "shipments" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-900"}`}
              onClick={() => setViewType("shipments")}
            >
              Direct Shipments {shipments.filter(s => s.status === "pending_acceptance").length > 0 && <span className="bg-orange-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">{shipments.filter(s => s.status === "pending_acceptance").length}</span>}
            </button>
          )}
        </div>

        {viewType === "scans" ? (
          <>
            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="pt-6 text-center">
                  <p className="text-2xl font-bold">{parcels.length}</p>
                  <p className="text-sm text-muted-foreground">Total Scanned</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6 text-center">
                  <p className="text-2xl font-bold text-blue-600">{parcels.filter(p => p.status === "scanned").length}</p>
                  <p className="text-sm text-muted-foreground">Pending Assignment</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6 text-center">
                  <p className="text-2xl font-bold text-purple-600">{parcels.filter(p => ["dispatched", "in_transit", "out_for_delivery"].includes(p.status)).length}</p>
                  <p className="text-sm text-muted-foreground">In Transit</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6 text-center">
                  <p className="text-2xl font-bold text-green-600">{parcels.filter(p => p.status === "delivered").length}</p>
                  <p className="text-sm text-muted-foreground">Delivered</p>
                </CardContent>
              </Card>
            </div>

            <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="w-full justify-start overflow-x-auto h-auto p-1 bg-transparent border-b rounded-none mb-6">
                <TabsTrigger value="all" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent">All</TabsTrigger>
                <TabsTrigger value="scanned" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent">Scanned</TabsTrigger>
                <TabsTrigger value="transit" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent">In Transit</TabsTrigger>
                <TabsTrigger value="delivered" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent">Delivered</TabsTrigger>
              </TabsList>

              {/* Search */}
              <Card className="mb-6">
                <CardContent className="pt-6 py-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search by Parcel ID, Barcode, Package..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </CardContent>
              </Card>

              {error && (
                <Card className="mb-4 border-red-300 bg-red-50">
                  <CardContent className="pt-4 pb-4">
                    <p className="text-sm text-red-700 flex items-center gap-2">
                      <AlertCircle className="h-4 w-4" /> {error}
                    </p>
                    <Button variant="outline" size="sm" className="mt-2" onClick={fetchParcels}>
                      Retry
                    </Button>
                  </CardContent>
                </Card>
              )}

              {loading && (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              )}

              {!loading && (
                <Card>
                  <CardContent className="p-0 overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Parcel ID</TableHead>
                          <TableHead className="hidden sm:table-cell">Barcode</TableHead>
                          <TableHead>Package</TableHead>
                          <TableHead>Receiver</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="hidden md:table-cell">Scanned</TableHead>
                          <TableHead className="text-center">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredParcels.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                              {parcels.length === 0 ? "No parcels scanned yet. Use the Partner app to scan barcodes." : "No parcels match your search."}
                            </TableCell>
                          </TableRow>
                        ) : (
                          filteredParcels.map((p) => (
                            <TableRow key={p._id}>
                              <TableCell className="font-mono text-sm font-medium">{p.parcelId}</TableCell>
                              <TableCell className="font-mono text-sm hidden sm:table-cell">{p.barcode}</TableCell>
                              <TableCell>{p.packageName || "—"}</TableCell>
                              <TableCell>
                                {p.receiver?.name ? (
                                  <div className="text-sm">
                                    <span className="font-medium">{p.receiver.name}</span>
                                    {p.receiver.city && (
                                      <span className="text-muted-foreground block text-xs">{p.receiver.city}</span>
                                    )}
                                  </div>
                                ) : "—"}
                              </TableCell>
                              <TableCell>{getStatusBadge(p.status)}</TableCell>
                              <TableCell className="text-sm hidden md:table-cell">{formatDate(p.scannedAt)}</TableCell>
                              <TableCell className="text-center">
                                <div className="flex items-center justify-center gap-1">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => { setSelectedParcel(p); setDetailsOpen(true); }}
                                  >
                                    <Eye className="h-4 w-4 mr-1" /> View
                                  </Button>
                                  {p.status === "scanned" && (
                                    <Button
                                      variant="default"
                                      size="sm"
                                      className="bg-blue-600 hover:bg-blue-700"
                                      disabled={assigning === p._id}
                                      onClick={() => handleAssignDriver(p._id)}
                                    >
                                      {assigning === p._id ? (
                                        <Loader2 className="h-4 w-4 animate-spin mr-1" />
                                      ) : (
                                        <Truck className="h-4 w-4 mr-1" />
                                      )}
                                      Assign Driver
                                    </Button>
                                  )}
                                </div>
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              )}
            </Tabs>
          </>
        ) : (
          <>
            {/* --- Shipments View --- */}
            <Tabs value={shipmentsTab} onValueChange={setShipmentsTab}>
              <TabsList className="w-full grid grid-cols-4 mb-4">
                <TabsTrigger value="new">🔔 New</TabsTrigger>
                <TabsTrigger value="active">🚚 Active</TabsTrigger>
                <TabsTrigger value="transit">📦 In Transit</TabsTrigger>
                <TabsTrigger value="completed">✅ Completed</TabsTrigger>
              </TabsList>
            </Tabs>

            {/* Search */}
            <div className="relative mb-6">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                className="pl-10 bg-white"
                placeholder="Search by AWB, sender, or receiver..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {/* Shipment Cards */}
            {shipmentsLoading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : filteredShipments.length === 0 ? (
              <Card className="text-center py-20 border-dashed">
                <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium">No shipments found</h3>
                <p className="text-sm text-muted-foreground">
                  {shipmentsTab === "new" ? "No new platform orders awaiting acceptance" : "No shipments in this category"}
                </p>
              </Card>
            ) : (
              <div className="space-y-4">
                {filteredShipments.map((shipment, i) => (
                  <motion.div
                    key={shipment._id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                  >
                    <Card className="hover:shadow-md transition-shadow cursor-default">
                      <CardContent className="p-5">
                        {/* Header */}
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <code className="text-sm font-mono bg-gray-100 px-2 py-1 rounded">
                              {shipment.awb}
                            </code>
                            {getShipmentStatusBadge(shipment.status)}
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
                        {getNextStatusAction(shipment.status) && (() => {
                          const action = getNextStatusAction(shipment.status)!;
                          return (
                            <div className="flex items-center gap-3 pt-3 border-t">
                              <Button
                                className="flex-1 bg-blue-600 hover:bg-blue-700"
                                onClick={() => {
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
                                  <span className="mr-1"><action.icon className="h-4 w-4" /></span>
                                )}
                                {action.label}
                              </Button>
                            </div>
                          );
                        })()}
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            )}
          </>
        )}

        {/* --- End View Toggle --- */}

        {/* Details Dialog */}
        <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Parcel Details — {selectedParcel?.parcelId}
              </DialogTitle>
            </DialogHeader>
            {selectedParcel && (
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <span className="text-sm text-muted-foreground">Status</span>
                  {getStatusBadge(selectedParcel.status)}
                </div>

                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-muted-foreground">Barcode</span>
                    <p className="font-mono font-medium">{selectedParcel.barcode}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">AWB</span>
                    <p className="font-mono font-medium">{selectedParcel.awb || "—"}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Package</span>
                    <p className="font-medium">{selectedParcel.packageName || "—"}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Scanned At</span>
                    <p>{formatTime(selectedParcel.scannedAt)}</p>
                  </div>
                </div>

                {selectedParcel.receiver?.name && (
                  <div className="p-3 border rounded-lg">
                    <p className="text-sm text-muted-foreground flex items-center gap-1 mb-2">
                      <User className="h-3 w-3" /> Receiver
                    </p>
                    <p className="font-medium">{selectedParcel.receiver.name}</p>
                    {selectedParcel.receiver.address && <p className="text-sm">{selectedParcel.receiver.address}</p>}
                    <p className="text-sm text-muted-foreground">
                      {selectedParcel.receiver.city} {selectedParcel.receiver.pincode}
                    </p>
                  </div>
                )}

                {selectedParcel.status === "scanned" && (
                  <Button
                    className="w-full bg-blue-600 hover:bg-blue-700"
                    disabled={assigning === selectedParcel._id}
                    onClick={() => {
                      handleAssignDriver(selectedParcel._id);
                      setDetailsOpen(false);
                    }}
                  >
                    <Truck className="h-4 w-4 mr-2" />
                    Auto-Assign Driver
                  </Button>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>
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
    </DashboardLayout>
  );
};

export default PartnerOrders;
