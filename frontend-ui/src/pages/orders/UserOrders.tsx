import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Search,
  Truck,
  MapPin,
  Package,
  CheckCircle,
  Clock,
  Eye,
  Phone,
  User,
  Calendar,
  Navigation,
  Radio,
  Loader2,
} from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { API_BASE_URL } from "@/config";

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
  estimatedDelivery: string;
  actualDelivery: string;
  trackingHistory: any[];
  assignedDriver: string | null;
  assignedDriverName: string | null;
  assignedVehicle: string | null;
  driverLocation: {
    lat: number;
    lng: number;
    driverName: string;
    online: boolean;
    timestamp: number;
  } | null;
  createdAt: string;
}

const UserOrders = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("all");
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
        return <Badge>{status}</Badge>;
    }
  };

  const filterByTab = (order: OrderData) => {
    switch (activeTab) {
      case "pending": return order.status === "pending" || order.status === "pickup_scheduled";
      case "transit": return ["picked_up", "in_transit", "out_for_delivery"].includes(order.status);
      case "delivered": return order.status === "delivered";
      case "all": return true;
      default: return true;
    }
  };

  const canTrackLive = (status: string) => {
    return ["picked_up", "in_transit", "out_for_delivery"].includes(status);
  };

  const filteredOrders = orders.filter(order => {
    const matchesSearch =
      order.awb?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.pickup?.city?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.delivery?.city?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesTab = filterByTab(order);
    return matchesSearch && matchesTab;
  });

  const viewOrderDetails = (order: OrderData) => {
    setSelectedOrder(order);
    setDetailsOpen(true);
  };

  const formatDate = (d: string) => d ? new Date(d).toLocaleDateString() : "—";

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Package className="h-6 w-6 text-primary" />
            My Orders
          </h1>
          <p className="text-muted-foreground">
            Track your shipments and view delivery status
          </p>
        </div>

        <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full justify-start overflow-x-auto h-auto p-1 bg-transparent border-b rounded-none mb-6">
            <TabsTrigger value="all" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent">All Orders</TabsTrigger>
            <TabsTrigger value="pending" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent">Pending</TabsTrigger>
            <TabsTrigger value="transit" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent">In Transit</TabsTrigger>
            <TabsTrigger value="delivered" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent">Delivered</TabsTrigger>
          </TabsList>

          {/* Search */}
          <Card className="mb-6">
            <CardContent className="pt-6 py-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by AWB, City..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </CardContent>
          </Card>

          {/* Loading */}
          {loading && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          )}

          {/* Orders Table */}
          {!loading && (
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>AWB</TableHead>
                      <TableHead>Route</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Driver</TableHead>
                      <TableHead className="text-right">Cost</TableHead>
                      <TableHead className="text-center">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredOrders.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                          {orders.length === 0 ? "No orders yet. Create your first shipment!" : "No orders match your search."}
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredOrders.map((order) => (
                        <TableRow key={order.id}>
                          <TableCell>
                            <div className="flex flex-col">
                              <span className="font-medium text-primary font-mono text-sm">{order.awb}</span>
                              <span className="text-xs text-muted-foreground">{formatDate(order.createdAt)}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col gap-1 text-sm">
                              <div className="flex items-center gap-1">
                                <MapPin className="h-3 w-3 text-green-600" />
                                <span>{order.pickup?.city || "—"}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Navigation className="h-3 w-3 text-red-600" />
                                <span>{order.delivery?.city || "—"}</span>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className="text-sm capitalize">{order.contentType || "—"}</span>
                          </TableCell>
                          <TableCell>{getStatusBadge(order.status)}</TableCell>
                          <TableCell>
                            {order.assignedDriverName ? (
                              <div className="flex flex-col text-sm">
                                <span className="font-medium flex items-center gap-1">
                                  <User className="h-3 w-3" />
                                  {order.assignedDriverName}
                                </span>
                                {order.driverLocation && (
                                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                                    <div className={`w-2 h-2 rounded-full ${order.driverLocation.online ? "bg-green-500" : "bg-gray-400"}`} />
                                    {order.driverLocation.online ? "Online" : "Offline"}
                                  </span>
                                )}
                              </div>
                            ) : (
                              <span className="text-muted-foreground text-sm">Not assigned</span>
                            )}
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            {order.shippingCost ? `₹${order.shippingCost.toLocaleString()}` : "—"}
                            <div className="text-xs text-muted-foreground capitalize">{order.paymentMode}</div>
                          </TableCell>
                          <TableCell className="text-center">
                            <div className="flex items-center justify-center gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => viewOrderDetails(order)}
                              >
                                <Eye className="h-4 w-4 mr-1" />
                                View
                              </Button>
                              {canTrackLive(order.status) && order.assignedDriver && (
                                <Button
                                  variant="default"
                                  size="sm"
                                  className="bg-blue-600 hover:bg-blue-700"
                                  onClick={() => navigate(`/track-live/${order.awb}`)}
                                >
                                  <Radio className="h-4 w-4 mr-1" />
                                  Track Live
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

        {/* ─── My Parcels Section ─── */}
        {parcels.length > 0 && (
          <div className="mt-8">
            <h2 className="text-xl font-bold flex items-center gap-2 mb-4">
              <Truck className="h-5 w-5 text-blue-600" />
              My Parcels
              <Badge variant="secondary" className="ml-2">{parcels.length}</Badge>
            </h2>
            <p className="text-muted-foreground text-sm mb-4">
              Parcels linked to your account — scanned and tracked across the delivery network
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

                    {/* Track Live button */}
                    {p.awb && ["dispatched", "in_transit", "out_for_delivery"].includes(p.status) && p.assignedDriver && (
                      <Button
                        size="sm"
                        className="w-full bg-blue-600 hover:bg-blue-700"
                        onClick={() => navigate(`/track-live/${p.awb}`)}
                      >
                        <Radio className="h-4 w-4 mr-2" />
                        Track Live
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {parcelsLoading && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            <span className="ml-2 text-muted-foreground">Loading parcels...</span>
          </div>
        )}

        {/* Order Details Dialog */}
        <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Order Details - {selectedOrder?.awb}
              </DialogTitle>
            </DialogHeader>

            {selectedOrder && (
              <div className="space-y-6">
                {/* Status Banner */}
                <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                  <div>
                    <p className="text-sm text-muted-foreground">Current Status</p>
                    <div className="mt-1">{getStatusBadge(selectedOrder.status)}</div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">Estimated Delivery</p>
                    <p className="font-medium flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      {formatDate(selectedOrder.estimatedDelivery)}
                    </p>
                  </div>
                </div>

                {/* Route Info */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 border rounded-lg">
                    <p className="text-sm text-muted-foreground flex items-center gap-1 mb-2">
                      <MapPin className="h-4 w-4 text-green-600" /> Pickup Location
                    </p>
                    <p className="font-medium">{selectedOrder.pickup?.address}</p>
                    <p className="text-sm text-muted-foreground">{selectedOrder.pickup?.city} - {selectedOrder.pickup?.pincode}</p>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <p className="text-sm text-muted-foreground flex items-center gap-1 mb-2">
                      <Navigation className="h-4 w-4 text-red-600" /> Delivery Location
                    </p>
                    <p className="font-medium">{selectedOrder.delivery?.address}</p>
                    <p className="text-sm text-muted-foreground">{selectedOrder.delivery?.city} - {selectedOrder.delivery?.pincode}</p>
                  </div>
                </div>

                {/* Driver Info */}
                {selectedOrder.assignedDriverName && (
                  <div className="p-4 border rounded-lg bg-blue-50">
                    <p className="text-sm text-muted-foreground flex items-center gap-1 mb-2">
                      <User className="h-4 w-4" /> Assigned Driver
                    </p>
                    <p className="font-medium text-lg">{selectedOrder.assignedDriverName}</p>
                    {selectedOrder.driverLocation && (
                      <div className="flex items-center gap-1 mt-1">
                        <div className={`w-2 h-2 rounded-full ${selectedOrder.driverLocation.online ? "bg-green-500" : "bg-gray-400"}`} />
                        <span className="text-sm">{selectedOrder.driverLocation.online ? "Currently Online" : "Offline"}</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Track Live Button */}
                {canTrackLive(selectedOrder.status) && selectedOrder.assignedDriver && (
                  <Button
                    className="w-full bg-blue-600 hover:bg-blue-700"
                    onClick={() => {
                      setDetailsOpen(false);
                      navigate(`/track-live/${selectedOrder.awb}`);
                    }}
                  >
                    <Radio className="h-4 w-4 mr-2" />
                    Track Live on Map
                  </Button>
                )}

                {/* Tracking Timeline */}
                {selectedOrder.trackingHistory && selectedOrder.trackingHistory.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-3">Tracking History</h4>
                    <div className="space-y-3">
                      {[...selectedOrder.trackingHistory].reverse().map((event, index) => (
                        <div key={index} className="flex items-start gap-3">
                          <div className={`w-3 h-3 rounded-full mt-1.5 ${index === 0 ? 'bg-primary' : 'bg-gray-300'}`} />
                          <div className="flex-1">
                            <p className="font-medium">{event.description || event.status}</p>
                            <p className="text-sm text-muted-foreground">
                              {event.location && `${event.location} • `}
                              {new Date(event.timestamp).toLocaleString()}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Order Summary */}
                <div className="p-4 border rounded-lg">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Content</span>
                    <span className="capitalize">{selectedOrder.contentType}</span>
                  </div>
                  <div className="flex justify-between items-center mt-2">
                    <span className="text-muted-foreground">Weight</span>
                    <span>{selectedOrder.totalWeight ? `${selectedOrder.totalWeight} kg` : "—"}</span>
                  </div>
                  <div className="flex justify-between items-center mt-2">
                    <span className="text-muted-foreground">Service</span>
                    <Badge variant="outline" className="capitalize">{selectedOrder.serviceType}</Badge>
                  </div>
                  <div className="flex justify-between items-center mt-2 pt-2 border-t">
                    <span className="font-medium">Shipping Cost</span>
                    <span className="font-bold text-lg">
                      {selectedOrder.shippingCost ? `₹${selectedOrder.shippingCost.toLocaleString()}` : "—"}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default UserOrders;
