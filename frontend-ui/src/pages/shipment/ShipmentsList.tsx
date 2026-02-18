import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Search,
  Plus,
  Download,
  MoreVertical,
  Eye,
  Edit,
  Trash2,
  Package,
  Truck,
  CheckCircle,
  Clock,
  XCircle,
  ArrowUpDown,
  RefreshCw,
  Copy,
  Loader2,
} from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import { useToast } from "@/hooks/use-toast";
import { shipmentsApi } from "@/lib/api";

const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline"; icon: typeof Clock }> = {
  pending: { label: "Pending Pickup", variant: "secondary", icon: Clock },
  pickup_scheduled: { label: "Pickup Scheduled", variant: "secondary", icon: Clock },
  picked_up: { label: "Picked Up", variant: "default", icon: Package },
  in_transit: { label: "In Transit", variant: "default", icon: Truck },
  out_for_delivery: { label: "Out for Delivery", variant: "default", icon: Package },
  delivered: { label: "Delivered", variant: "outline", icon: CheckCircle },
  cancelled: { label: "Cancelled", variant: "destructive", icon: XCircle },
  returned: { label: "Returned", variant: "destructive", icon: RefreshCw },
};

const ShipmentsList = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [carrierFilter, setCarrierFilter] = useState("all");
  const [shipments, setShipments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  // Fetch shipments from API
  useEffect(() => {
    const fetchShipments = async () => {
      try {
        const data = await shipmentsApi.getAll({ limit: 100 });
        if (data.success) {
          setShipments(data.shipments || []);
        }
      } catch (err) {
        console.error('Failed to fetch shipments:', err);
        toast({ title: "Error", description: "Could not load shipments", variant: "destructive" });
      } finally {
        setLoading(false);
      }
    };
    fetchShipments();
  }, []);

  // Scroll to top on page load
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const copyToClipboard = (text: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(text);
    toast({ title: "Copied!", description: `${text} copied to clipboard` });
  };

  const handleExport = () => {
    const headers = ["AWB", "Status", "Carrier", "Pickup City", "Delivery City", "Customer", "Shipping Cost"];
    const csvData = filteredShipments.map((s: any) => [
      s.awb, s.status, s.carrier || '', s.pickup?.city || '', s.delivery?.city || '', s.delivery?.name || '', s.shippingCost || 0
    ].join(","));
    const csv = [headers.join(","), ...csvData].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `FastFare-Shipments-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const filteredShipments = shipments.filter((shipment: any) => {
    const matchesSearch =
      (shipment.awb || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (shipment.delivery?.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (shipment.delivery?.city || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || shipment.status === statusFilter;
    const matchesCarrier = carrierFilter === 'all' || (shipment.carrier || '').toLowerCase() === carrierFilter;

    return matchesSearch && matchesStatus && matchesCarrier;
  });

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Shipments</h1>
            <p className="text-muted-foreground">
              Manage your orders and shipments
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              className="gradient-primary"
              onClick={() => navigate("/shipment/new")}
            >
              <Plus className="h-4 w-4 mr-2" /> New Shipment
            </Button>
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search shipments..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[150px] md:w-[180px] shrink-0">
                <SelectValue placeholder="Filter Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="pickup_scheduled">Pickup Scheduled</SelectItem>
                <SelectItem value="picked_up">Picked Up</SelectItem>
                <SelectItem value="in_transit">In Transit</SelectItem>
                <SelectItem value="out_for_delivery">Out for Delivery</SelectItem>
                <SelectItem value="delivered">Delivered</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>

            <Select value={carrierFilter} onValueChange={setCarrierFilter}>
              <SelectTrigger className="w-[150px] md:w-[180px] shrink-0">
                <SelectValue placeholder="Carrier" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Carriers</SelectItem>
                <SelectItem value="bluedart">BlueDart</SelectItem>
                <SelectItem value="delhivery">Delhivery</SelectItem>
                <SelectItem value="fedex">FedEx</SelectItem>
                <SelectItem value="dtdc">DTDC</SelectItem>
              </SelectContent>
            </Select>

            <Button variant="outline" onClick={handleExport} className="shrink-0">
              <Download className="h-4 w-4 mr-2" /> Export
            </Button>
          </div>
        </div>

        {/* Shipments Table */}
        <Card>
          <CardContent className="p-0 overflow-x-auto">
            {loading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
                <span className="ml-2 text-muted-foreground">Loading shipments…</span>
              </div>
            ) : filteredShipments.length === 0 ? (
              <div className="text-center py-12">
                <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-1">No shipments found</h3>
                <p className="text-muted-foreground mb-4">
                  {searchQuery || statusFilter !== 'all' || carrierFilter !== 'all'
                    ? "Try adjusting your search or filters"
                    : "Create your first shipment to get started"}
                </p>
                <Button onClick={() => navigate("/shipment/new")}>
                  <Plus className="h-4 w-4 mr-2" /> Create New Shipment
                </Button>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="cursor-pointer">
                      <div className="flex items-center gap-1">
                        Order ID <ArrowUpDown className="h-3 w-3" />
                      </div>
                    </TableHead>
                    <TableHead>Route</TableHead>
                    <TableHead className="hidden md:table-cell">Customer</TableHead>
                    <TableHead className="hidden lg:table-cell">Carrier</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="hidden md:table-cell cursor-pointer">
                      <div className="flex items-center gap-1">
                        Created <ArrowUpDown className="h-3 w-3" />
                      </div>
                    </TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredShipments.map((shipment: any) => {
                    const StatusIcon = statusConfig[shipment.status]?.icon || Truck;
                    const shipmentId = shipment._id || shipment.id;
                    return (
                      <TableRow
                        key={shipmentId}
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => navigate(`/shipment/${shipmentId}`)}
                      >
                        <TableCell className="font-medium">
                          {shipment.awb || shipmentId}
                          <div className="flex items-center gap-1">
                            <span className="text-xs text-muted-foreground font-mono">{shipment.awb}</span>
                            {shipment.awb && (
                              <button
                                onClick={(e) => copyToClipboard(shipment.awb, e)}
                                className="h-5 w-5 p-0.5 rounded hover:bg-muted transition-colors inline-flex items-center justify-center"
                                title="Copy AWB"
                              >
                                <Copy className="h-3 w-3 text-muted-foreground" />
                              </button>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col text-sm">
                            <span className="truncate max-w-[100px]" title={shipment.pickup?.city}>{shipment.pickup?.city || '—'}</span>
                            <span className="text-muted-foreground text-xs">to</span>
                            <span className="truncate max-w-[100px]" title={shipment.delivery?.city}>{shipment.delivery?.city || '—'}</span>
                          </div>
                        </TableCell>
                        <TableCell className="hidden md:table-cell">{shipment.delivery?.name || '—'}</TableCell>
                        <TableCell className="hidden lg:table-cell">{shipment.carrier || '—'}</TableCell>
                        <TableCell>
                          <Badge
                            variant={statusConfig[shipment.status]?.variant || "default"}
                            className="gap-1 whitespace-nowrap text-[11px] px-2 py-0.5"
                          >
                            <StatusIcon className="h-3 w-3" />
                            {statusConfig[shipment.status]?.label || shipment.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground whitespace-nowrap hidden md:table-cell">
                          {shipment.createdAt ? new Date(shipment.createdAt).toLocaleDateString() : '—'}
                        </TableCell>
                        <TableCell className="font-medium">
                          ₹{(shipment.shippingCost || 0).toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger
                              asChild
                              onClick={(e) => e.stopPropagation()}
                            >
                              <Button variant="ghost" size="icon">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={(e) => {
                                  e.stopPropagation();
                                  navigate(`/shipment/${shipmentId}`);
                                }}
                              >
                                <Eye className="h-4 w-4 mr-2" /> View Details
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={(e) => {
                                  e.stopPropagation();
                                  navigate(`/shipment/${shipmentId}/edit`);
                                }}
                              >
                                <Edit className="h-4 w-4 mr-2" /> Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={(e) => {
                                  e.stopPropagation();
                                  navigate(`/returns/create?shipmentId=${shipmentId}`);
                                }}
                              >
                                <RefreshCw className="h-4 w-4 mr-2" /> Create Return
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={(e) => e.stopPropagation()}
                                className="text-destructive"
                              >
                                <Trash2 className="h-4 w-4 mr-2" /> Cancel
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default ShipmentsList;
