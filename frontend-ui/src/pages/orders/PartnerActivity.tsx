import { useState, useEffect } from "react";
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
  ArrowLeft,
  Calendar,
  Filter,
  User,
  Phone,
  Mail,
  Box,
  CreditCard,
  FileText,
  Navigation,
  Loader2
} from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Link } from "react-router-dom";
import { API_BASE_URL } from "@/config";
import { BackButton } from "@/components/BackButton";

// Activity data type
type ActivityItem = {
  id: string;
  customer: string;
  customerEmail: string;
  customerPhone: string;
  pickup: { city: string; address: string; contact: string; phone: string };
  delivery: { city: string; address: string; contact: string; phone: string };
  status: string;
  date: string;
  eta: string;
  amount: number;
  truck: string | null;
  driver: string | null;
  driverPhone: string | null;
  weight: string;
  dimensions: string;
  packages: number;
  paymentMode: string;
  awb: string;
};

const PartnerActivity = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [activityData, setActivityData] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<ActivityItem | null>(null);
  const [orderDialog, setOrderDialog] = useState(false);

  const handleOrderClick = (order: ActivityItem) => {
    setSelectedOrder(order);
    setOrderDialog(true);
  };

  useEffect(() => {
    const fetchActivity = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem("token");
        const res = await fetch(`${API_BASE_URL}/api/shipments/carrier/incoming`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {}
        });
        const data = await res.json();
        if (data.success && data.shipments) {
          const mapped: ActivityItem[] = data.shipments.map((s: any) => ({
            id: s._id,
            awb: s.awb,
            customer: s.sender?.user_id?.name || s.pickup?.name || "Customer",
            customerEmail: s.sender?.user_id?.email || "N/A",
            customerPhone: s.pickup?.phone || "N/A",
            pickup: {
              city: s.pickup?.city || "",
              address: s.pickup?.address || "",
              contact: s.pickup?.name || "",
              phone: s.pickup?.phone || ""
            },
            delivery: {
              city: s.delivery?.city || "",
              address: s.delivery?.address || "",
              contact: s.delivery?.name || "",
              phone: s.delivery?.phone || ""
            },
            status: s.status,
            date: new Date(s.createdAt).toLocaleDateString(),
            eta: "TBD",
            amount: s.shippingCost || 0,
            truck: s.assignedVehicle || null,
            driver: s.assignedDriverName || s.assigned_driver_name || null,
            driverPhone: s.assigned_driver_phone || null,
            weight: `${s.totalWeight || 0} kg`,
            dimensions: "Standard",
            packages: s.packages?.reduce((acc: number, pkg: any) => acc + (pkg.quantity || 1), 0) || 1,
            paymentMode: s.paymentMode || "prepaid"
          }));
          setActivityData(mapped);
        }
      } catch (err) {
        console.error("Failed to fetch activity:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchActivity();
  }, []);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800"><Clock className="h-3 w-3 mr-1" /> Pending</Badge>;
      case "in_transit":
        return <Badge variant="default" className="bg-orange-500"><Truck className="h-3 w-3 mr-1" /> In Transit</Badge>;
      case "delivered":
        return <Badge variant="outline" className="text-green-600 border-green-600"><CheckCircle className="h-3 w-3 mr-1" /> Delivered</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const filterByTab = (item: ActivityItem) => {
    switch (activeTab) {
      case "transit": return item.status === "in_transit";
      case "delivered": return item.status === "delivered";
      case "pending": return item.status === "pending";
      case "all": return true;
      default: return true;
    }
  };

  const filteredActivity = activityData.filter(item => {
    const matchesSearch =
      item.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.customer.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.delivery.city.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesTab = filterByTab(item);
    return matchesSearch && matchesTab;
  });

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-4">
            <BackButton fallback="/dashboard" />
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <Package className="h-6 w-6 text-primary" />
                All Activity
              </h1>
              <p className="text-muted-foreground">
                View all your shipment activity and order history
              </p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full justify-start overflow-x-auto h-auto p-1 bg-transparent border-b rounded-none mb-6">
            <TabsTrigger value="all" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent">All Activity</TabsTrigger>
            <TabsTrigger value="pending" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent">Pending</TabsTrigger>
            <TabsTrigger value="transit" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent">In Transit</TabsTrigger>
            <TabsTrigger value="delivered" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent">Delivered</TabsTrigger>
          </TabsList>

          {/* Search */}
          <Card className="mb-6">
            <CardContent className="pt-4 sm:pt-6 pb-4">
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 items-center w-full">
                <div className="relative w-full sm:flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by ID, Customer, or Destination..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 w-full"
                  />
                </div>
                <Button variant="outline" className="w-full sm:w-auto">
                  <Filter className="mr-2 h-4 w-4" /> Filter
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Activity Table (Desktop) */}
          <div className="hidden md:block">
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Order ID</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Route</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Assigned Truck</TableHead>
                      <TableHead>Driver</TableHead>
                      <TableHead>ETA</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-12">
                          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
                        </TableCell>
                      </TableRow>
                    ) : filteredActivity.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                          No activity found
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredActivity.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell>
                            <div className="flex flex-col">
                              <button
                                onClick={() => handleOrderClick(item)}
                                className="font-medium text-primary hover:underline cursor-pointer text-left"
                              >
                                {item.id}
                              </button>
                              <span className="text-xs text-muted-foreground">{item.date}</span>
                            </div>
                          </TableCell>
                          <TableCell className="font-medium">{item.customer}</TableCell>
                          <TableCell>
                            <div className="flex flex-col gap-1 text-sm">
                              <div className="flex items-center gap-1">
                                <MapPin className="h-3 w-3 text-green-600" />
                                <span>{item.pickup.city}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <MapPin className="h-3 w-3 text-red-600" />
                                <span>{item.delivery.city}</span>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>{getStatusBadge(item.status)}</TableCell>
                          <TableCell>
                            {item.truck ? (
                              <span className="flex items-center gap-1 text-sm">
                                <Truck className="h-3 w-3" />
                                {item.truck}
                              </span>
                            ) : (
                              <span className="text-muted-foreground text-sm">Not assigned</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {item.driver ? (
                              <span className="text-sm">{item.driver}</span>
                            ) : (
                              <span className="text-muted-foreground text-sm">-</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <span className="flex items-center gap-1 text-sm text-muted-foreground">
                              <Calendar className="h-3 w-3" />
                              {item.eta}
                            </span>
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            ₹{item.amount.toLocaleString()}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>

          {/* Activity Cards (Mobile) */}
          <div className="md:hidden space-y-3">
            {loading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : filteredActivity.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground bg-card rounded-lg border">
                No activity found
              </div>
            ) : (
              filteredActivity.map((item) => (
                <Card
                  key={item.id}
                  className="cursor-pointer hover:bg-muted/50 transition-colors active:scale-[0.98]"
                  onClick={() => handleOrderClick(item)}
                >
                  <CardContent className="p-4 flex flex-col gap-3 pb-3">
                    <div className="flex justify-between items-start gap-2">
                      <div className="min-w-0">
                        <p className="font-medium text-primary text-sm truncate">{item.id}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{item.date}</p>
                      </div>
                      <div className="shrink-0">
                        {getStatusBadge(item.status)}
                      </div>
                    </div>

                    <div className="flex flex-col gap-1.5 text-xs bg-muted/40 p-2.5 rounded-md">
                      <div className="flex items-center gap-2">
                        <MapPin className="h-3.5 w-3.5 text-green-600 shrink-0" />
                        <span className="line-clamp-1 truncate">{item.pickup.city || 'N/A'}</span>
                      </div>
                      <div className="border-l-2 border-dashed border-muted-foreground/30 h-2.5 ml-1.5 my-0.5"></div>
                      <div className="flex items-center gap-2">
                        <MapPin className="h-3.5 w-3.5 text-red-600 shrink-0" />
                        <span className="line-clamp-1 truncate">{item.delivery.city || 'N/A'}</span>
                      </div>
                    </div>

                    <div className="flex justify-between items-center text-sm pt-1.5">
                      <div className="flex items-center gap-1.5 min-w-0 pr-2">
                        <User className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                        <span className="truncate font-medium text-xs">{item.customer}</span>
                      </div>
                      <span className="font-bold text-primary text-sm shrink-0">₹{item.amount.toLocaleString()}</span>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </Tabs>
      </div>

      {/* Order Details Dialog */}
      <Dialog open={orderDialog} onOpenChange={setOrderDialog}>
        <DialogContent className="max-w-3xl w-[95vw] sm:w-auto p-4 sm:p-6 max-h-[90vh] overflow-y-auto rounded-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg sm:text-xl">
              <Package className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
              <span className="truncate">Order {selectedOrder?.awb}</span>
            </DialogTitle>
          </DialogHeader>

          {selectedOrder && (
            <div className="space-y-4 sm:space-y-6 mt-2 sm:mt-4">
              {/* Status and AWB */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 sm:p-4 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-2 sm:gap-3">
                  {getStatusBadge(selectedOrder.status)}
                  <span className="text-xs sm:text-sm text-muted-foreground truncate">AWB: <span className="font-mono font-medium">{selectedOrder.awb}</span></span>
                </div>
                <div className="text-left sm:text-right">
                  <p className="text-xl sm:text-2xl font-bold text-primary">₹{selectedOrder.amount.toLocaleString()}</p>
                  <p className="text-[10px] sm:text-xs text-muted-foreground">{selectedOrder.paymentMode}</p>
                </div>
              </div>

              {/* Customer Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardContent className="pt-4">
                    <h4 className="font-semibold mb-3 flex items-center gap-2">
                      <User className="h-4 w-4 text-primary" />
                      Customer Information
                    </h4>
                    <div className="space-y-2 text-sm">
                      <p className="font-medium">{selectedOrder.customer}</p>
                      <p className="flex items-center gap-2 text-muted-foreground">
                        <Mail className="h-3 w-3" /> {selectedOrder.customerEmail}
                      </p>
                      <p className="flex items-center gap-2 text-muted-foreground">
                        <Phone className="h-3 w-3" /> {selectedOrder.customerPhone}
                      </p>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-4">
                    <h4 className="font-semibold mb-3 flex items-center gap-2">
                      <Box className="h-4 w-4 text-primary" />
                      Package Details
                    </h4>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <p className="text-muted-foreground">Weight</p>
                        <p className="font-medium">{selectedOrder.weight}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Packages</p>
                        <p className="font-medium">{selectedOrder.packages} pcs</p>
                      </div>
                      <div className="col-span-2">
                        <p className="text-muted-foreground">Dimensions</p>
                        <p className="font-medium">{selectedOrder.dimensions}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Pickup and Delivery */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="border-green-200 bg-green-50/30">
                  <CardContent className="pt-4">
                    <h4 className="font-semibold mb-3 flex items-center gap-2 text-green-700">
                      <Navigation className="h-4 w-4" />
                      Pickup Location
                    </h4>
                    <div className="space-y-2 text-sm">
                      <p className="font-medium">{selectedOrder.pickup.city}</p>
                      <p className="text-muted-foreground">{selectedOrder.pickup.address}</p>
                      <div className="pt-2 border-t mt-2">
                        <p className="font-medium">{selectedOrder.pickup.contact}</p>
                        <p className="text-muted-foreground flex items-center gap-1">
                          <Phone className="h-3 w-3" /> {selectedOrder.pickup.phone}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-red-200 bg-red-50/30">
                  <CardContent className="pt-4">
                    <h4 className="font-semibold mb-3 flex items-center gap-2 text-red-700">
                      <MapPin className="h-4 w-4" />
                      Delivery Location
                    </h4>
                    <div className="space-y-2 text-sm">
                      <p className="font-medium">{selectedOrder.delivery.city}</p>
                      <p className="text-muted-foreground">{selectedOrder.delivery.address}</p>
                      <div className="pt-2 border-t mt-2">
                        <p className="font-medium">{selectedOrder.delivery.contact}</p>
                        <p className="text-muted-foreground flex items-center gap-1">
                          <Phone className="h-3 w-3" /> {selectedOrder.delivery.phone}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Truck and Driver Info */}
              {selectedOrder.truck && (
                <Card>
                  <CardContent className="pt-4">
                    <h4 className="font-semibold mb-3 flex items-center gap-2">
                      <Truck className="h-4 w-4 text-primary" />
                      Assigned Vehicle & Driver
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Truck Number</p>
                        <p className="font-medium font-mono">{selectedOrder.truck}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Driver Name</p>
                        <p className="font-medium">{selectedOrder.driver}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Driver Phone</p>
                        <p className="font-medium">{selectedOrder.driverPhone}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Order Timeline */}
              <Card>
                <CardContent className="pt-4">
                  <h4 className="font-semibold mb-3 flex items-center gap-2">
                    <FileText className="h-4 w-4 text-primary" />
                    Order Summary
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Order Date</p>
                      <p className="font-medium">{selectedOrder.date}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">ETA</p>
                      <p className="font-medium">{selectedOrder.eta}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground flex items-center gap-1">
                        <CreditCard className="h-3 w-3" /> Payment
                      </p>
                      <p className="font-medium">{selectedOrder.paymentMode}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Amount</p>
                      <p className="font-medium text-primary">₹{selectedOrder.amount.toLocaleString()}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Actions */}
              <div className="flex flex-col sm:flex-row justify-end gap-2 pt-4 border-t">
                <Button variant="outline" className="w-full sm:w-auto order-last sm:order-first" onClick={() => setOrderDialog(false)}>
                  Close
                </Button>
                <Link to={`/track/${selectedOrder.awb}`} className="w-full sm:w-auto">
                  <Button className="w-full">
                    <Navigation className="mr-2 h-4 w-4" /> Track Shipment
                  </Button>
                </Link>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default PartnerActivity;

