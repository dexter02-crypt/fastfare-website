import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  Filter,
  Download,
  MoreVertical,
  Eye,
  Edit,
  Trash2,
  MapPin,
  Package,
  Truck,
  CheckCircle,
  Clock,
  XCircle,
  ArrowUpDown,
  RefreshCw,
  FileText,
} from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";

const mockShipments = [
  {
    id: "FF12345678",
    awb: "AWBDHL123456",
    pickup: { city: "Mumbai", pincode: "400001", address: "G-12, Industrial Estate" },
    delivery: { city: "Delhi", pincode: "110001", name: "John Doe", phone: "9876543210", email: "john@example.com", address: "12/B, MG Road" },
    status: "in-transit",
    carrier: "BlueDart",
    weight: "2.5 kg",
    dimensions: "10x10x10",
    createdAt: "2024-01-15",
    eta: "2024-01-18",
    amount: 249,
    paymentMethod: "Prepaid",
    product: { name: "Wireless Headphones", sku: "WH-001", qty: 1, value: 2499 },
    channel: "Shopify"
  },
  {
    id: "FF12345679",
    awb: "AWBFED789012",
    pickup: { city: "Bangalore", pincode: "560001", address: "Tech Park, B-Block" },
    delivery: { city: "Chennai", pincode: "600001", name: "Jane Smith", phone: "9876543211", email: "jane@example.com", address: "Flat 402, Sea View" },
    status: "delivered",
    carrier: "FedEx",
    weight: "1.2 kg",
    dimensions: "15x10x5",
    createdAt: "2024-01-14",
    eta: "2024-01-16",
    amount: 189,
    paymentMethod: "COD",
    product: { name: "Cotton T-Shirt", sku: "TS-002", qty: 2, value: 999 },
    channel: "WooCommerce"
  },
  {
    id: "FF12345680",
    awb: "AWBDTDC345678",
    pickup: { city: "Hyderabad", pincode: "500001", address: "Warehouse 9" },
    delivery: { city: "Pune", pincode: "411001", name: "Bob Wilson", phone: "9876543212", email: "bob@example.com", address: "Plot 55, IT Park" },
    status: "pending",
    carrier: "DTDC",
    weight: "5.0 kg",
    dimensions: "20x20x20",
    createdAt: "2024-01-16",
    eta: "2024-01-20",
    amount: 349,
    paymentMethod: "Prepaid",
    product: { name: "Kitchen Blender", sku: "KB-003", qty: 1, value: 3500 },
    channel: "Magento"
  },
  {
    id: "FF12345681",
    awb: "AWBDEL901234",
    pickup: { city: "Kolkata", pincode: "700001", address: "Salt Lake Sector V" },
    delivery: { city: "Jaipur", pincode: "302001", name: "Alice Brown", phone: "9876543213", email: "alice@example.com", address: "H-12, Pink City" },
    status: "cancelled",
    carrier: "Delhivery",
    weight: "0.8 kg",
    dimensions: "12x8x4",
    createdAt: "2024-01-13",
    eta: "2024-01-17",
    amount: 129,
    paymentMethod: "Prepaid",
    product: { name: "Phone Case", sku: "PC-004", qty: 1, value: 499 },
    channel: "Custom"
  },
  {
    id: "FF12345682",
    awb: "AWBBLUE567890",
    pickup: { city: "Ahmedabad", pincode: "380001", address: "GIDC Phase 2" },
    delivery: { city: "Surat", pincode: "395001", name: "Charlie Davis", phone: "9876543214", email: "charlie@example.com", address: "Ring Road, A-1" },
    status: "out-for-delivery",
    carrier: "BlueDart",
    weight: "3.2 kg",
    dimensions: "18x12x10",
    createdAt: "2024-01-15",
    eta: "2024-01-17",
    amount: 199,
    paymentMethod: "COD",
    product: { name: "Running Shoes", sku: "RS-005", qty: 1, value: 1800 },
    channel: "Shopify"
  },
];

const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline"; icon: typeof Clock }> = {
  pending: { label: "Pending Pickup", variant: "secondary", icon: Clock },
  "in-transit": { label: "In Transit", variant: "default", icon: Truck },
  "out-for-delivery": { label: "Out for Delivery", variant: "default", icon: Package },
  delivered: { label: "Delivered", variant: "outline", icon: CheckCircle },
  cancelled: { label: "Cancelled", variant: "destructive", icon: XCircle },
  rto: { label: "RTO", variant: "destructive", icon: RefreshCw },
};

const ShipmentsList = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [carrierFilter, setCarrierFilter] = useState("all");

  const handleExport = () => {
    // Simple CSV export of filtered shipments
    const headers = ["ID", "AWB", "Status", "Carrier", "Pickup City", "Delivery City", "Customer", "Amount"];
    const csvData = filteredShipments.map(s => [
      s.id, s.awb, s.status, s.carrier, s.pickup.city, s.delivery.city, s.delivery.name, s.amount
    ].join(","));
    const csv = [headers.join(","), ...csvData].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `shipments-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const filterByTab = (shipment: any) => {
    switch (activeTab) {
      case "new": return shipment.status === "pending"; // Map 'New' to pending/fresh
      case "ready": return shipment.status === "ready-to-ship";
      case "pickup": return shipment.status === "scheduled" || shipment.status === "out-for-pickup";
      case "transit": return shipment.status === "in-transit" || shipment.status === "out-for-delivery";
      case "delivered": return shipment.status === "delivered";
      case "rto": return shipment.status === "rto";
      case "all": return true;
      default: return true;
    }
  };

  const filteredShipments = mockShipments.filter((shipment) => {
    const matchesSearch =
      shipment.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      shipment.awb.toLowerCase().includes(searchQuery.toLowerCase()) ||
      shipment.delivery.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTab = filterByTab(shipment);
    
    return matchesSearch && matchesTab;
  });

  const renderTable = (data: typeof mockShipments) => (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Order Details</TableHead>
            <TableHead>Customer Details</TableHead>
            <TableHead>Product Details</TableHead>
            <TableHead>Package Details</TableHead>
            <TableHead>Payment</TableHead>
            <TableHead>Pickup Address</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Action</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.length === 0 ? (
            <TableRow>
              <TableCell colSpan={8} className="text-center py-6 text-muted-foreground">
                No shipments found in this category
              </TableCell>
            </TableRow>
          ) : (
            data.map((s) => (
              <TableRow key={s.id} onClick={() => navigate(`/shipment/${s.id}`)} className="cursor-pointer hover:bg-muted/50">
                <TableCell>
                  <div className="flex flex-col gap-1">
                    <span className="font-medium text-primary">{s.id}</span>
                    <span className="text-xs text-muted-foreground">{s.createdAt}</span>
                    <Badge variant="outline" className="w-fit text-[10px]">{s.channel}</Badge>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex flex-col gap-0.5 text-sm">
                    <span className="font-medium">{s.delivery.name}</span>
                    <span className="text-xs text-muted-foreground">{s.delivery.phone}</span>
                    <span className="text-xs text-muted-foreground truncate max-w-[120px]" title={s.delivery.email}>{s.delivery.email}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex flex-col gap-0.5 text-sm">
                    <span className="font-medium">{s.product.name}</span>
                    <span className="text-xs text-muted-foreground">SKU: {s.product.sku}</span>
                    <span className="text-xs">Qty: {s.product.qty}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex flex-col gap-0.5 text-sm">
                    <span>{s.weight}</span>
                    <span className="text-xs text-muted-foreground">{s.dimensions}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex flex-col gap-0.5 text-sm">
                    <span className="font-bold">₹{s.product.value}</span>
                    <Badge variant="secondary" className="w-fit text-[10px]">{s.paymentMethod}</Badge>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex flex-col text-sm max-w-[150px]">
                    <span className="font-medium">{s.pickup.city}</span>
                    <span className="text-xs text-muted-foreground truncate" title={s.pickup.address}>{s.pickup.address}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant={statusConfig[s.status]?.variant || "outline"}>
                    {statusConfig[s.status]?.label || s.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => navigate(`/shipment/${s.id}`)}><Eye className="mr-2 h-4 w-4" /> View</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => navigate(`/shipment/${s.id}/edit`)}><Edit className="mr-2 h-4 w-4" /> Edit</DropdownMenuItem>
                      <DropdownMenuItem><Truck className="mr-2 h-4 w-4" /> Track</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );

  const handlePrintManifest = () => {
    const win = window.open('', '_blank');
    if (win) {
      win.document.write(`
        <html>
          <head>
            <title>Shipment Manifest</title>
            <style>
              body { font-family: sans-serif; padding: 40px; color: #333; }
              .header { display: flex; justify-content: space-between; border-bottom: 2px solid #000; padding-bottom: 20px; margin-bottom: 30px; }
              .logo { font-size: 24px; font-weight: bold; color: #011E41; }
              .title { text-align: right; }
              h1 { margin: 0; color: #011E41; }
              table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 12px; }
              th { background-color: #f8fafc; padding: 12px; text-align: left; border-bottom: 2px solid #ddd; font-weight: bold; }
              td { padding: 12px; border-bottom: 1px solid #eee; }
              .footer { margin-top: 40px; text-align: center; font-size: 12px; color: #666; border-top: 1px solid #eee; padding-top: 20px; }
            </style>
          </head>
          <body>
            <div class="header">
              <div class="logo">FastFare</div>
              <div class="title">
                <h1>MANIFEST</h1>
                <p>Date: ${new Date().toLocaleDateString()}</p>
                <p>Total Shipments: ${filteredShipments.length}</p>
              </div>
            </div>
            <table>
              <thead>
                <tr>
                  <th>AWB Number</th>
                  <th>Order ID</th>
                  <th>Pickup Location</th>
                  <th>Delivery Location</th>
                  <th>Carrier</th>
                  <th>Weight</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                ${filteredShipments.map(s => `
                  <tr>
                    <td>${s.awb}</td>
                    <td>${s.id}</td>
                    <td>${s.pickup.city} - ${s.pickup.pincode}</td>
                    <td>${s.delivery.city} - ${s.delivery.pincode}</td>
                    <td>${s.carrier}</td>
                    <td>${s.weight}</td>
                    <td>${s.status.toUpperCase()}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
            <div class="footer">
              Generated by FastFare Logistics Platform<br/>
              Authorized Signature
            </div>
            <script>window.print();</script>
          </body>
        </html>
      `);
      win.document.close();
    }
  };

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
              <Button variant="outline" onClick={handlePrintManifest}>
                <FileText className="h-4 w-4 mr-2" /> Print Manifest
              </Button>
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
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
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
              <SelectTrigger className="w-[180px]">
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

            <Button variant="outline" onClick={handleExport}>
              <Download className="h-4 w-4 mr-2" /> Export
            </Button>
          </div>


          {/* Shipments Table */}
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="cursor-pointer">
                      <div className="flex items-center gap-1">
                        Order ID <ArrowUpDown className="h-3 w-3" />
                      </div>
                    </TableHead>
                    <TableHead>Route</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Carrier</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="cursor-pointer">
                      <div className="flex items-center gap-1">
                        Created <ArrowUpDown className="h-3 w-3" />
                      </div>
                    </TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredShipments.map((shipment) => {
                    const StatusIcon = statusConfig[shipment.status]?.icon || Truck;
                    return (
                      <TableRow
                        key={shipment.id}
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => navigate(`/shipment/${shipment.id}`)}
                      >
                        <TableCell className="font-medium">
                          {shipment.id}
                          <div className="text-xs text-muted-foreground font-mono">{shipment.awb}</div>
                        </TableCell>
                        <TableCell>
                           <div className="flex flex-col text-sm">
                             <span className="truncate max-w-[100px]" title={shipment.pickup.city}>{shipment.pickup.city}</span>
                             <span className="text-muted-foreground text-xs">to</span>
                             <span className="truncate max-w-[100px]" title={shipment.delivery.city}>{shipment.delivery.city}</span>
                           </div>
                        </TableCell>
                        <TableCell>{shipment.customer}</TableCell>
                        <TableCell>{shipment.carrier}</TableCell>
                        <TableCell>
                          <Badge
                            variant={statusConfig[shipment.status]?.variant || "default"}
                            className="gap-1 whitespace-nowrap"
                          >
                            <StatusIcon className="h-3 w-3" />
                            {statusConfig[shipment.status]?.label || shipment.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground whitespace-nowrap">
                          {shipment.createdAt}
                        </TableCell>
                        <TableCell className="font-medium">
                          ₹{shipment.amount.toLocaleString()}
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
                                  navigate(`/shipment/${shipment.id}`);
                                }}
                              >
                                <Eye className="h-4 w-4 mr-2" /> View Details
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={(e) => {
                                  e.stopPropagation();
                                  navigate(`/shipment/${shipment.id}/edit`);
                                }}
                              >
                                <Edit className="h-4 w-4 mr-2" /> Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={(e) => {
                                  e.stopPropagation();
                                  navigate(`/returns/create?shipmentId=${shipment.id}`);
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

              {filteredShipments.length === 0 && (
                <div className="text-center py-12">
                  <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-1">No shipments found</h3>
                  <p className="text-muted-foreground mb-4">
                    Try adjusting your search or filters
                  </p>
                  <Button onClick={() => navigate("/shipment/new")}>
                    <Plus className="h-4 w-4 mr-2" /> Create New Shipment
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
    </DashboardLayout>
  );
};

export default ShipmentsList;
