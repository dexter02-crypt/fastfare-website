import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
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
  Loader2, Radio, User, Navigation, AlertCircle
} from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import DashboardLayout from "@/components/DashboardLayout";
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
  scannedBy: { partnerId: string; name: string };
  receiver: { name?: string; phone?: string; address?: string; city?: string; pincode?: string };
}

const PartnerOrders = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [parcels, setParcels] = useState<ParcelData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [selectedParcel, setSelectedParcel] = useState<ParcelData | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [assigning, setAssigning] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Fetch real parcels
  useEffect(() => {
    fetchParcels();
  }, []);

  const fetchParcels = async () => {
    setError(null);
    try {
      const token = localStorage.getItem("token");
      console.log("[PartnerOrders] Fetching from:", `${API_BASE_URL}/api/parcels/partner/my-scans?limit=100`);
      console.log("[PartnerOrders] Token present:", !!token);
      const res = await fetch(`${API_BASE_URL}/api/parcels/partner/my-scans?limit=100`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      console.log("[PartnerOrders] Response status:", res.status);
      const data = await res.json();
      console.log("[PartnerOrders] Response data:", data);
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

  const formatDate = (d: string) => d ? new Date(d).toLocaleDateString() : "—";
  const formatTime = (d: string) => d ? new Date(d).toLocaleString() : "—";

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Package className="h-6 w-6 text-primary" />
              Scanned Parcels
            </h1>
            <p className="text-muted-foreground">
              Parcels scanned by your team — assign drivers and track deliveries
            </p>
          </div>
          <Button
            variant="outline"
            className="gap-2"
            onClick={() => navigate("/partner/fleet-view")}
          >
            <Radio className="h-4 w-4" />
            Fleet View
          </Button>
        </div>

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
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Parcel ID</TableHead>
                      <TableHead>Barcode</TableHead>
                      <TableHead>Package</TableHead>
                      <TableHead>Receiver</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Scanned</TableHead>
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
                          <TableCell className="font-mono text-sm">{p.barcode}</TableCell>
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
                          <TableCell className="text-sm">{formatDate(p.scannedAt)}</TableCell>
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
      </div>
    </DashboardLayout>
  );
};

export default PartnerOrders;
