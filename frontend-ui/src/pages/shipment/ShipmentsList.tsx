import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatDate } from "@/utils/dateFormat";
import { formatStatus, getStatusStyle } from "@/utils/formatStatus";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableFooter,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Search, Truck, MapPin, Package, CheckCircle, Clock, Eye, Download, Info, ClipboardCopy, User, Calendar, Navigation, Loader2
} from "lucide-react";
import { API_BASE_URL } from "@/config";
import { useToast } from "@/components/ui/use-toast";

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
  receiver: { name?: string; phone?: string; address?: string; city?: string; pincode?: string };
  sender: { name?: string; phone?: string; address?: string; city?: string; pincode?: string };
  scannedBy: { partnerId: string; name: string };
  assignedDriver: string | null;
  driverLocation: {
    lat: number;
    lng: number;
    driverName: string;
    online: boolean;
    timestamp: number;
  } | null;
}

interface OrderData {
  id: string;
  awb: string;
  orderId?: string;
  status: string;
  pickup: any;
  delivery: any;
  packages: any[];
  contentType: string;
  serviceType: string;
  paymentMode: string;
  codAmount: number;
  totalWeight: number;
  shippingCost: number;
  packageValue?: number;
  estimatedDelivery: string;
  actualDelivery: string;
  trackingHistory: any[];
  assignedDriver: string | null;
  assignedDriverName: string | null;
  assignedVehicle: string | null;
  carrier?: string;
  carrierAwb?: string;
  rto_reason?: string;
  return_status?: string;
  rto_charge?: number;
  scan_pickup: any;
  driverLocation: any;
  promoCode?: string;
  discountApplied?: number;
  createdAt: string;
}

const ShipmentsList = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [paymentFilter, setPaymentFilter] = useState("all");
  const [selectedOrder, setSelectedOrder] = useState<OrderData | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [orders, setOrders] = useState<OrderData[]>([]);
  const [loading, setLoading] = useState(true);
  const [parcels, setParcels] = useState<ParcelData[]>([]);
  const [parcelsLoading, setParcelsLoading] = useState(true);

  // Fetch real orders from backend
  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch(`${API_BASE_URL}/api/shipments/my-orders`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        const data = await res.json();
        if (data.success && data.orders) {
          setOrders(data.orders);
        }
      } catch (err) {
        console.error("Failed to fetch orders:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();

    // Fetch user's parcels
    const fetchParcels = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch(`${API_BASE_URL}/api/parcels/user/my-parcels`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        const data = await res.json();
        if (data.success && data.parcels) {
          setParcels(data.parcels);
        }
      } catch (err) {
        console.error("Failed to fetch parcels:", err);
      } finally {
        setParcelsLoading(false);
      }
    };
    fetchParcels();
  }, []);

  const getParcelStatusBadge = (status: string) => {
    const map: Record<string, { label: string; color: string; icon: any }> = {
      scanned: { label: "Scanned", color: "bg-blue-100 text-blue-800", icon: Package },
      in_warehouse: { label: "In Warehouse", color: "bg-indigo-100 text-indigo-800", icon: Package },
      dispatched: { label: "Dispatched", color: "bg-purple-100 text-purple-800", icon: Truck },
      in_transit: { label: "In Transit", color: "bg-orange-100 text-orange-800", icon: Navigation },
      out_for_delivery: { label: "Out for Delivery", color: "bg-yellow-100 text-yellow-800", icon: MapPin },
      delivered: { label: "Delivered", color: "bg-green-100 text-green-800", icon: CheckCircle },
      returned: { label: "Returned", color: "bg-red-100 text-red-800", icon: Package },
      failed: { label: "Failed", color: "bg-red-100 text-red-800", icon: Package },
    };
    const s = map[status] || { label: status, color: "bg-gray-100 text-gray-800", icon: Package };
    const Icon = s.icon;
    return (
      <Badge className={s.color}>
        <Icon className="h-3 w-3 mr-1" /> {s.label}
      </Badge>
    );
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800"><Clock className="h-3 w-3 mr-1" /> Pending</Badge>;
      case "pickup_scheduled":
        return <Badge variant="default" className="bg-blue-600"><Clock className="h-3 w-3 mr-1" /> Pickup Scheduled</Badge>;
      case "picked_up":
        return <Badge variant="default" className="bg-indigo-600"><Package className="h-3 w-3 mr-1" /> Picked Up</Badge>;
      case "in_transit":
        return <Badge variant="default" className="bg-purple-600"><MapPin className="h-3 w-3 mr-1" /> In Transit</Badge>;
      case "out_for_delivery":
        return <Badge variant="default" className="bg-orange-600"><Truck className="h-3 w-3 mr-1" /> Out for Delivery</Badge>;
      case "delivered":
        return <Badge variant="outline" className="text-green-600 border-green-600"><CheckCircle className="h-3 w-3 mr-1" /> Delivered</Badge>;
      case "cancelled":
        return <Badge variant="destructive">Cancelled</Badge>;
      default:
        return <Badge style={{ ...getStatusStyle(status), padding: '3px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: '500' }}>{formatStatus(status)}</Badge>;
    }
  };

  const canTrackLive = (status: string) => {
    return ["picked_up", "in_transit", "out_for_delivery"].includes(status);
  };

  // Filter Logic
  const filteredOrders = orders.filter(order => {
    const matchesSearch =
      order.awb?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.orderId?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.delivery?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.delivery?.phone?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === "all" || order.status === statusFilter || (statusFilter === 'transit' && canTrackLive(order.status));
    const matchesPayment = paymentFilter === "all" || order.paymentMode === paymentFilter;

    return matchesSearch && matchesStatus && matchesPayment;
  });

  const viewOrderDetails = (order: OrderData) => {
    setSelectedOrder(order);
    setDetailsOpen(true);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Copied!", description: `${text} copied to clipboard.`, duration: 2000 });
  };

  const handleExportCSV = () => {
    const headers = [
      "AWB", "Date", "Status", "Payment Mode", "Shipping Cost", "COD Amount", "Declared Value", "Service Type", "Content Type",
      "Applied Weight", "Volumetric Weight", "Physical Weight", "L (cm)", "W (cm)", "H (cm)",
      "Sender Name", "Sender Phone", "Pickup Address", "Pickup City", "Pickup State", "Pickup Pincode",
      "Receiver Name", "Receiver Phone", "Delivery Address", "Delivery City", "Delivery State", "Delivery Pincode",
      "Carrier", "Carrier AWB", "Estimated Delivery", "Actual Delivery", "RTO Reason", "Return Status", "RTO Charge"
    ];

    const rows = filteredOrders.map(o => {
      const pkg = o.packages?.[0] || {};
      const appliedWeight = Math.max(o.totalWeight || 0, ((pkg.length || 1) * (pkg.width || 1) * (pkg.height || 1)) / 5000 * (pkg.quantity || 1));

      return [
        o.awb,
        new Date(o.createdAt).toLocaleDateString(),
        formatStatus(o.status),
        o.paymentMode || "—",
        o.shippingCost || 0,
        o.codAmount || 0,
        o.packageValue || 0,
        o.serviceType || "—",
        o.contentType || "—",
        appliedWeight.toFixed(2),
        (((pkg.length || 1) * (pkg.width || 1) * (pkg.height || 1)) / 5000 * (pkg.quantity || 1)).toFixed(2),
        o.totalWeight || 0,
        pkg.length || 0,
        pkg.width || 0,
        pkg.height || 0,
        o.pickup?.name || "—",
        o.pickup?.phone || "—",
        o.pickup?.address?.replace(/,/g, ' ') || "—",
        o.pickup?.city || "—",
        o.pickup?.state || "—",
        o.pickup?.pincode || "—",
        o.delivery?.name || "—",
        o.delivery?.phone || "—",
        o.delivery?.address?.replace(/,/g, ' ') || "—",
        o.delivery?.city || "—",
        o.delivery?.state || "—",
        o.delivery?.pincode || "—",
        o.carrier || "—",
        o.carrierAwb || "—",
        o.estimatedDelivery ? new Date(o.estimatedDelivery).toLocaleDateString() : "—",
        o.actualDelivery ? new Date(o.actualDelivery).toLocaleDateString() : "—",
        o.rto_reason || "—",
        o.return_status || "—",
        o.rto_charge || 0
      ].map(v => `"${v}"`).join(",");
    });

    const csvContent = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `FastFare_Shipments_${new Date().getTime()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const isNew = (dateString: string) => {
    const d = new Date(dateString);
    const now = new Date();
    return (now.getTime() - d.getTime()) < 24 * 60 * 60 * 1000; // Less than 24h
  };

  // Totals calculations
  const totalShipments = filteredOrders.length;
  const totalRevenue = filteredOrders.reduce((sum, order) => sum + (order.shippingCost || 0), 0);
  const totalCOD = filteredOrders.reduce((sum, order) => sum + (order.paymentMode === 'cod' ? (order.codAmount || 0) : 0), 0);
  const totalWgt = filteredOrders.reduce((sum, order) => sum + (order.totalWeight || 0), 0);
  const avgWeight = totalShipments > 0 ? (totalWgt / totalShipments).toFixed(2) : 0;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Package className="h-6 w-6 text-primary" />
            Shipments
          </h1>
          <p className="text-muted-foreground">
            Comprehensive view of all your shipments, forward and return
          </p>
        </div>

        {/* Info Banner */}
        <div className="bg-blue-50 border border-blue-200 text-blue-800 px-4 py-3 rounded-lg flex items-start gap-3">
          <Info className="h-5 w-5 text-blue-600 mt-0.5" />
          <div>
            <p className="text-sm font-medium">Notice: Weight discrepancy reports are now generated every Tuesday.</p>
            <p className="text-sm text-blue-700/80">Please check your <a href="/weight-disputes" className="underline font-medium hover:text-blue-900">Weight Disputes</a> tab to resolve any open anomalies.</p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="flex flex-col md:flex-row gap-4 w-full md:w-auto flex-1">
            <div className="relative flex-1 md:max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search AWB, Name, Phone..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-10 w-full"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-[160px] h-10">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="transit">In Transit / Live</SelectItem>
                <SelectItem value="delivered">Delivered</SelectItem>
                <SelectItem value="rto">RTO / Returned</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
            <Select value={paymentFilter} onValueChange={setPaymentFilter}>
              <SelectTrigger className="w-full md:w-[140px] h-10">
                <SelectValue placeholder="Payment" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Modes</SelectItem>
                <SelectItem value="prepaid">Prepaid</SelectItem>
                <SelectItem value="cod">COD</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button onClick={handleExportCSV} variant="outline" className="h-10 w-full md:w-auto">
            <Download className="h-4 w-4 mr-2" />
            Download CSV
          </Button>
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        )}

        {/* Main 35-Column Table */}
        {!loading && (
          <Card className="border shadow-sm overflow-hidden w-full">
            <div className="overflow-x-auto w-full">
              <Table className="whitespace-nowrap w-full table-auto">
                <TableHeader className="bg-muted/50">
                  <TableRow>
                    {/* Sticky Column */}
                    <TableHead className="sticky left-0 z-20 bg-muted/90 backdrop-blur min-w-[180px]">AWB #</TableHead>
                    <TableHead>Actions</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Payment Mode</TableHead>
                    <TableHead>Shipping Cost</TableHead>
                    <TableHead>COD Amount</TableHead>
                    <TableHead>Declared Value</TableHead>
                    <TableHead>Service</TableHead>
                    <TableHead>Content</TableHead>
                    <TableHead>Physical Wgt</TableHead>
                    <TableHead>Volumetric Wgt</TableHead>
                    <TableHead>L(cm)</TableHead>
                    <TableHead>W(cm)</TableHead>
                    <TableHead>H(cm)</TableHead>
                    <TableHead>Sender</TableHead>
                    <TableHead>Sender Phone</TableHead>
                    <TableHead>Pickup City</TableHead>
                    <TableHead>Pickup State</TableHead>
                    <TableHead>Receiver</TableHead>
                    <TableHead>Receiver Phone</TableHead>
                    <TableHead>Delivery City</TableHead>
                    <TableHead>Delivery State</TableHead>
                    <TableHead>Carrier</TableHead>
                    <TableHead>Carrier AWB</TableHead>
                    <TableHead>Est. Delivery</TableHead>
                    <TableHead>Actual Delivery</TableHead>
                    <TableHead>RTO Reason</TableHead>
                    <TableHead>Return Status</TableHead>
                    <TableHead>RTO Charge</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredOrders.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={31} className="text-center py-16 bg-white">
                        <div className="flex flex-col items-center justify-center space-y-3">
                          <div className="h-16 w-16 rounded-full bg-muted/60 flex items-center justify-center">
                            <Package className="h-8 w-8 text-muted-foreground/50" />
                          </div>
                          <p className="text-lg font-medium text-foreground">
                            {orders.length === 0 ? "No orders yet" : "No matching orders"}
                          </p>
                          <p className="text-sm text-muted-foreground max-w-sm">
                            {orders.length === 0
                              ? "Your orders will appear here once you create your first shipment."
                              : "Try adjusting your search or filter criteria."}
                          </p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredOrders.map(order => {
                      const pkg = order.packages?.[0] || {};
                      const volWt = (((pkg.length || 1) * (pkg.width || 1) * (pkg.height || 1)) / 5000 * (pkg.quantity || 1));
                      return (
                        <TableRow key={order.id} className="hover:bg-muted/30">
                          {/* Sticky First Column */}
                          <TableCell className="sticky left-0 z-10 bg-white shadow-[1px_0_0_0_#e5e7eb]">
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-semibold text-primary">{order.awb}</span>
                              <button onClick={() => copyToClipboard(order.awb)} className="text-muted-foreground hover:text-foreground">
                                <ClipboardCopy className="h-3.5 w-3.5" />
                              </button>
                              {isNew(order.createdAt) && <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100 px-1.5 py-0 text-[9px] uppercase tracking-wider">New</Badge>}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Button variant="ghost" size="sm" onClick={() => navigate(`/shipment/${order.id}`)} className="h-7 px-2 border border-border bg-white shadow-sm">
                                <Eye className="h-3.5 w-3.5 mr-1 text-muted-foreground" /> View
                              </Button>
                              {canTrackLive(order.status) && order.assignedDriver && (
                                <Button variant="outline" size="sm" onClick={() => navigate(`/track-live/${order.awb}`)} className="h-7 px-2 border-blue-200 bg-blue-50 text-blue-600 hover:bg-blue-100">
                                  <Navigation className="h-3.5 w-3.5 mr-1" /> Track
                                </Button>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>{formatDate(order.createdAt)}</TableCell>
                          <TableCell>{getStatusBadge(order.status)}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className={order.paymentMode === 'cod' ? "bg-amber-50 text-amber-700 border-amber-200" : "bg-green-50 text-green-700 border-green-200"}>
                              {order.paymentMode?.toUpperCase()}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-medium">
                            ₹{order.shippingCost?.toLocaleString() || "0"}
                            {order.promoCode && (order.discountApplied || 0) > 0 && (
                              <Badge variant="outline" className="ml-2 text-[9px] bg-green-50 text-green-700 border-green-200 uppercase tracking-wider px-1.5 py-0 items-center justify-center -translate-y-[1px]">Promo</Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-amber-700 font-medium">₹{order.codAmount?.toLocaleString() || "0"}</TableCell>
                          <TableCell>₹{order.packageValue?.toLocaleString() || "0"}</TableCell>
                          <TableCell className="capitalize">{order.serviceType || "Standard"}</TableCell>
                          <TableCell className="capitalize">{order.contentType || "Documents"}</TableCell>
                          <TableCell>{order.totalWeight} kg</TableCell>
                          <TableCell>{volWt.toFixed(2)} kg</TableCell>
                          <TableCell>{pkg.length || 0}</TableCell>
                          <TableCell>{pkg.width || 0}</TableCell>
                          <TableCell>{pkg.height || 0}</TableCell>
                          <TableCell>{order.pickup?.name || "—"}</TableCell>
                          <TableCell className="text-muted-foreground text-sm">{order.pickup?.phone || "—"}</TableCell>
                          <TableCell>{order.pickup?.city || "—"}</TableCell>
                          <TableCell>{order.pickup?.state || "—"}</TableCell>
                          <TableCell>{order.delivery?.name || "—"}</TableCell>
                          <TableCell className="text-muted-foreground text-sm">{order.delivery?.phone || "—"}</TableCell>
                          <TableCell>{order.delivery?.city || "—"}</TableCell>
                          <TableCell>{order.delivery?.state || "—"}</TableCell>
                          <TableCell>{order.carrier || "FastFare Logistics"}</TableCell>
                          <TableCell className="font-mono text-xs text-muted-foreground">{order.carrierAwb || "—"}</TableCell>
                          <TableCell>{order.estimatedDelivery ? formatDate(order.estimatedDelivery) : "—"}</TableCell>
                          <TableCell>{order.actualDelivery ? formatDate(order.actualDelivery) : "—"}</TableCell>
                          <TableCell className="text-red-600">{order.rto_reason || "—"}</TableCell>
                          <TableCell>{order.return_status ? <Badge variant="destructive">{order.return_status}</Badge> : "—"}</TableCell>
                          <TableCell className="text-red-600 font-medium">₹{order.rto_charge || "0"}</TableCell>
                        </TableRow>
                      )
                    })
                  )}
                </TableBody>
                {/* Fixed Totals Row */}
                {filteredOrders.length > 0 && (
                  <TableFooter className="bg-sidebar-accent font-semibold sticky bottom-0 border-t-2 z-10 hidden md:table-footer-group">
                    <TableRow>
                      <TableCell className="sticky left-0 bg-sidebar-accent shadow-[1px_0_0_0_#e5e7eb] py-4 text-primary">TOTALS</TableCell>
                      <TableCell colSpan={4} className="text-muted-foreground font-normal">{totalShipments} shipments selected</TableCell>
                      <TableCell></TableCell>
                      <TableCell className="text-primary text-base">₹{totalRevenue.toLocaleString()}</TableCell>
                      <TableCell className="text-amber-700 text-base">₹{totalCOD.toLocaleString()}</TableCell>
                      <TableCell></TableCell>
                      <TableCell></TableCell>
                      <TableCell></TableCell>
                      <TableCell>{avgWeight} kg avg</TableCell>
                      <TableCell colSpan={19}></TableCell>
                    </TableRow>
                  </TableFooter>
                )}
              </Table>
            </div>
            {/* Mobile totals fallback */}
            {filteredOrders.length > 0 && (
              <div className="md:hidden p-4 bg-muted/50 border-t flex flex-wrap gap-4 text-sm font-medium">
                <div>Shipments: <span className="text-primary">{totalShipments}</span></div>
                <div>Revenue: <span className="text-primary">₹{totalRevenue.toLocaleString()}</span></div>
                <div>COD: <span className="text-amber-700">₹{totalCOD.toLocaleString()}</span></div>
                <div>Avg Wgt: <span>{avgWeight} kg</span></div>
              </div>
            )}
          </Card>
        )}

        {/* ─── My Parcels Section ─── */}
        {parcels.length > 0 && (
          <div className="mt-12 pt-8 border-t">
            <h2 className="text-xl font-bold flex items-center gap-2 mb-4">
              <Truck className="h-5 w-5 text-blue-600" />
              My Parcels (Scanned)
              <Badge variant="secondary" className="ml-2">{parcels.length}</Badge>
            </h2>
            <p className="text-muted-foreground text-sm mb-4">
              Parcels currently active in the physical delivery network
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {parcels.map((p) => (
                <Card key={p._id} className="hover:shadow-md transition-shadow">
                  <CardContent className="pt-5 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-sm font-medium text-primary">{p.parcelId}</span>
                      {getParcelStatusBadge(p.status)}
                    </div>

                    <div className="space-y-1 text-sm">
                      <div className="flex items-center gap-2">
                        <Package className="h-3.5 w-3.5 text-muted-foreground" />
                        <span>{p.packageName || p.barcode}</span>
                      </div>
                      {p.receiver?.name && (
                        <div className="flex items-center gap-2">
                          <User className="h-3.5 w-3.5 text-muted-foreground" />
                          <span>{p.receiver.name}{p.receiver.city ? ` — ${p.receiver.city}` : ""}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Clock className="h-3.5 w-3.5" />
                        <span>Scanned {new Date(p.scannedAt).toLocaleDateString()}</span>
                      </div>
                      {p.scannedBy?.name && (
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <User className="h-3.5 w-3.5" />
                          <span>By {p.scannedBy.name}</span>
                        </div>
                      )}
                    </div>

                    {/* Driver info */}
                    {p.driverLocation && (
                      <div className="flex items-center gap-2 p-2 bg-blue-50 rounded-md text-sm">
                        <div className={`w-2 h-2 rounded-full ${p.driverLocation.online ? "bg-green-500" : "bg-gray-400"}`} />
                        <span className="font-medium">{p.driverLocation.driverName}</span>
                        <span className="text-muted-foreground">{p.driverLocation.online ? "Online" : "Offline"}</span>
                      </div>
                    )}

                    {p.awb && ["dispatched", "in_transit", "out_for_delivery"].includes(p.status) && p.assignedDriver && (
                      <Button
                        size="sm"
                        className="w-full bg-blue-600 hover:bg-blue-700"
                        onClick={() => navigate(`/track-live/${p.awb}`)}
                      >
                        <Navigation className="h-4 w-4 mr-2" />
                        Track Live
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

      </div>
    </DashboardLayout>
  );
};

export default ShipmentsList;
