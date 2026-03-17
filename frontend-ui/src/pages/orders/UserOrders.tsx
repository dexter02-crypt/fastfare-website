import { useState, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatDate } from "@/utils/dateFormat";
import { formatStatus } from "@/utils/formatStatus";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { OrderActions } from "@/components/orders/OrderActions";
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
  Search, Download, ShoppingBag, Loader2, Plus, Trash2, X
} from "lucide-react";
import { API_BASE_URL } from "@/config";
import { useToast } from "@/hooks/use-toast";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const UserOrders = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [paymentFilter, setPaymentFilter] = useState("all");
  const [channelFilter, setChannelFilter] = useState("all");
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  // Create Order Drawer State
  const [isCreateDrawerOpen, setIsCreateDrawerOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const initialOrderState = {
    customerName: "",
    customerPhone: "",
    customerEmail: "",
    addressLine1: "",
    addressLine2: "",
    city: "",
    state: "",
    pincode: "",
    items: [{ name: "", qty: 1, unitPrice: 0, total: 0 }],
    paymentStatus: "Unpaid",
    status: "New",
    channel: "Manual",
    notes: ""
  };

  const [newOrderForm, setNewOrderForm] = useState(initialOrderState);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const indianStates = [
    "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", "Goa", "Gujarat", "Haryana",
    "Himachal Pradesh", "Jharkhand", "Karnataka", "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur",
    "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana",
    "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal", "Andaman and Nicobar Islands", "Chandigarh",
    "Dadra and Nagar Haveli and Daman and Diu", "Delhi", "Lakshadweep", "Puducherry", "Ladakh", "Jammu and Kashmir"
  ];

  // Helper to recalculate order value when items change
  const calculateOrderValue = (items: any[]) => {
    return items.reduce((sum, item) => sum + (item.total || 0), 0);
  };

  // Fetch real orders from the newly created backend endpoint
  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');
        const res = await fetch(`${API_BASE_URL}/api/orders/my-orders`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        const data = await res.json();
        setOrders(data.orders || []);
      } catch (err) {
        console.error("Failed to fetch orders:", err);
        setOrders([]);
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, []);

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case "new":
        return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100 border-none">New</Badge>;
      case "processing":
        return <Badge className="bg-indigo-100 text-indigo-800 hover:bg-indigo-100 border-none">Processing</Badge>;
      case "confirmed":
        return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100 border-none">Confirmed</Badge>;
      case "shipped":
        return <Badge className="bg-purple-100 text-purple-800 hover:bg-purple-100 border-none">Shipped</Badge>;
      case "delivered":
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100 border-none">Delivered</Badge>;
      case "cancelled":
        return <Badge variant="destructive" className="border-none">Cancelled</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-100 border-none">{formatStatus(status)}</Badge>;
    }
  };

  const getPaymentStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'paid':
        return <Badge className="bg-green-50 text-green-700 border-green-200" variant="outline">Paid</Badge>;
      case 'pending':
      case 'cod pending':
      case 'unpaid':
        return <Badge className="bg-amber-50 text-amber-700 border-amber-200" variant="outline">{status}</Badge>;
      default:
        return <Badge variant="outline">{status.toUpperCase()}</Badge>;
    }
  };

  // Filter Logic
  const filteredOrders = orders.filter(order => {
    const matchesSearch =
      order.orderId?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.customer?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.customer?.phone?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === "all" || (order.orderStatus || '').toLowerCase() === statusFilter.toLowerCase();
    const matchesPayment = paymentFilter === "all" || order.paymentStatus.toLowerCase().includes(paymentFilter.toLowerCase());
    const matchesChannel = channelFilter === "all" || (order.channel || '').toLowerCase() === channelFilter.toLowerCase();

    return matchesSearch && matchesStatus && matchesPayment && matchesChannel;
  });

  const handleExportCSV = () => {
    const headers = [
      "Order ID", "Customer Name", "Customer Phone", "Date", "Items", "Order Value", "Payment Status", "Order Status", "Channel"
    ];

    const rows = filteredOrders.map(o => [
      o.orderId,
      o.customer?.name || "",
      o.customer?.phone || "",
      new Date(o.createdAt).toLocaleDateString(),
      o.items?.length || 0,
      o.orderValue,
      o.paymentStatus,
      o.orderStatus,
      o.channel || 'Manual'
    ].map(v => `"${v}"`).join(","));

    const csvContent = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `FastFare_Orders_${new Date().getTime()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Callbacks passed to OrderActions
  const handleOrderUpdateLocally = (updatedOrder: any) => {
    setOrders(prev => prev.map(o => o._id === updatedOrder._id ? updatedOrder : o));
  };
  const handleOrderDuplicateLocally = (newOrder: any) => {
    setOrders(prev => [newOrder, ...prev]);
  };

  // CREATE ORDER SUBMISSION
  const handleCreateOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormErrors({});
    let errors: Record<string, string> = {};

    // 1. Validation Logic
    if (!newOrderForm.customerName.trim()) errors.customerName = "Customer Name is required";
    if (!/^\d{10}$/.test(newOrderForm.customerPhone)) errors.customerPhone = "Please enter a valid 10-digit mobile number";

    if (!newOrderForm.addressLine1.trim()) errors.addressLine1 = "Address Line 1 is required";
    if (!newOrderForm.city.trim()) errors.city = "City is required";
    if (!newOrderForm.state) errors.state = "State is required";
    if (!/^\d{6}$/.test(newOrderForm.pincode)) errors.pincode = "Please enter a valid 6-digit Pincode";

    newOrderForm.items.forEach((item, index) => {
      if (!item.name.trim()) errors[`itemName_${index}`] = "Item name is required";
      if (item.qty < 1) errors[`itemQty_${index}`] = "Quantity must be at least 1";
      if (item.unitPrice <= 0 && item.unitPrice !== 0) errors[`itemPrice_${index}`] = "Price cannot be negative";
    });

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setIsSubmitting(true);
    try {
      const token = localStorage.getItem('token');

      const payload = {
        customer: {
          name: newOrderForm.customerName,
          phone: newOrderForm.customerPhone,
          email: newOrderForm.customerEmail
        },
        address: {
          line1: newOrderForm.addressLine1,
          line2: newOrderForm.addressLine2,
          city: newOrderForm.city,
          state: newOrderForm.state,
          pincode: newOrderForm.pincode
        },
        items: newOrderForm.items,
        orderValue: calculateOrderValue(newOrderForm.items),
        paymentStatus: newOrderForm.paymentStatus,
        orderStatus: newOrderForm.status,
        channel: newOrderForm.channel,
        notes: newOrderForm.notes
      };

      const res = await fetch(`${API_BASE_URL}/api/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.message || 'Failed to create order');

      // Optimistic update
      setOrders(prev => [data.order, ...prev]);

      toast({ title: "Order Created", description: `Order ${data.order.orderId} created successfully.`, variant: "default" });
      setNewOrderForm(initialOrderState);
      setIsCreateDrawerOpen(false);

    } catch (error: any) {
      toast({ title: "Failed to create order", description: error.message || "Please try again.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <ShoppingBag className="h-6 w-6 text-primary" />
              My Orders
            </h1>
            <p className="text-muted-foreground">
              Manage all your customer orders from various channels.
            </p>
          </div>
          <Button className="gradient-primary" onClick={() => setIsCreateDrawerOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create Order
          </Button>
        </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="flex flex-col md:flex-row gap-4 w-full md:w-auto flex-1">
            <div className="relative flex-1 md:max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search Order ID, Customer..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-10 w-full"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-[140px] h-10">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="new">New</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="confirmed">Confirmed</SelectItem>
                <SelectItem value="processing">Processing</SelectItem>
                <SelectItem value="shipped">Shipped</SelectItem>
                <SelectItem value="delivered">Delivered</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
            <Select value={paymentFilter} onValueChange={setPaymentFilter}>
              <SelectTrigger className="w-full md:w-[140px] h-10">
                <SelectValue placeholder="Payment" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Modes</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="unpaid">Unpaid</SelectItem>
                <SelectItem value="cod">COD</SelectItem>
              </SelectContent>
            </Select>
            <Select value={channelFilter} onValueChange={setChannelFilter}>
              <SelectTrigger className="w-full md:w-[140px] h-10">
                <SelectValue placeholder="Channel" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Channels</SelectItem>
                <SelectItem value="shopify">Shopify</SelectItem>
                <SelectItem value="woocommerce">WooCommerce</SelectItem>
                <SelectItem value="custom">Custom</SelectItem>
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

        {/* Main Orders Table */}
        {!loading && (
          <Card className="border shadow-sm overflow-hidden">
            <div className="overflow-x-auto w-full">
              <Table className="whitespace-nowrap w-max min-w-full">
                <TableHeader className="bg-muted/50">
                  <TableRow>
                    <TableHead className="w-[50px]"><input type="checkbox" className="rounded border-gray-300" /></TableHead>
                    <TableHead>Order ID</TableHead>
                    <TableHead>Customer Name</TableHead>
                    <TableHead>Customer Phone</TableHead>
                    <TableHead>Order Date</TableHead>
                    <TableHead className="text-center">Items</TableHead>
                    <TableHead className="text-right">Order Value</TableHead>
                    <TableHead>Payment Status</TableHead>
                    <TableHead>Order Status</TableHead>
                    <TableHead>Channel</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredOrders.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={11} className="text-center py-16 bg-white">
                        <div className="flex flex-col items-center justify-center space-y-3">
                          <div className="h-16 w-16 rounded-full bg-muted/60 flex items-center justify-center">
                            <ShoppingBag className="h-8 w-8 text-muted-foreground/50" />
                          </div>
                          <p className="text-lg font-medium text-foreground">
                            {orders.length === 0 ? "No orders yet" : "No matching orders found"}
                          </p>
                          <p className="text-sm text-muted-foreground max-w-sm">
                            Orders synced from your channels will appear here.
                          </p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredOrders.map((order) => (
                      <TableRow key={order._id} className="hover:bg-muted/30">
                        <TableCell><input type="checkbox" className="rounded border-gray-300" /></TableCell>
                        <TableCell className="font-mono font-semibold text-primary">{order.orderId}</TableCell>
                        <TableCell className="font-medium">{order.customer?.name}</TableCell>
                        <TableCell className="text-muted-foreground">{order.customer?.phone}</TableCell>
                        <TableCell>{formatDate(order.createdAt)}</TableCell>
                        <TableCell className="text-center">{order.items?.length || 0}</TableCell>
                        <TableCell className="text-right font-medium">₹{order.orderValue?.toLocaleString('en-IN')}</TableCell>
                        <TableCell>{getPaymentStatusBadge(order.paymentStatus)}</TableCell>
                        <TableCell>{getStatusBadge(order.orderStatus || 'New')}</TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="bg-slate-100 font-normal shadow-sm">
                            {order.channel || 'Manual'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right pr-4">
                          <OrderActions
                            order={order}
                            onOrderUpdate={handleOrderUpdateLocally}
                            onOrderDuplicate={handleOrderDuplicateLocally}
                          />
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </Card>
        )}
      </div>

      {/* CREATE ORDER RIGHT SLIDE-OVER */}
      <Sheet open={isCreateDrawerOpen} onOpenChange={setIsCreateDrawerOpen}>
        <SheetContent className="sm:max-w-xl overflow-y-auto">
          <SheetHeader className="mb-6">
            <SheetTitle>Create New Order</SheetTitle>
            <SheetDescription>
              Fill in the required information below to rapidly generate a new order.
            </SheetDescription>
          </SheetHeader>

          <form onSubmit={handleCreateOrder} className="space-y-6">

            {/* SECTION 1: Customer Details */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-primary border-b pb-2 uppercase tracking-wider">Customer Details</h3>
              <div className="grid gap-4">
                <div className="space-y-2">
                  <Label>Customer Name <span className="text-red-500">*</span></Label>
                  <Input
                    placeholder="Enter full name"
                    value={newOrderForm.customerName}
                    onChange={(e) => setNewOrderForm({ ...newOrderForm, customerName: e.target.value })}
                  />
                  {formErrors.customerName && <p className="text-xs text-red-500">{formErrors.customerName}</p>}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Customer Phone <span className="text-red-500">*</span></Label>
                    <Input
                      placeholder="+91 XXXXX XXXXX"
                      type="tel"
                      maxLength={10}
                      value={newOrderForm.customerPhone}
                      onChange={(e) => setNewOrderForm({ ...newOrderForm, customerPhone: e.target.value.replace(/\D/g, '') })}
                    />
                    {formErrors.customerPhone && <p className="text-xs text-red-500">{formErrors.customerPhone}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label>Customer Email</Label>
                    <Input
                      placeholder="customer@email.com"
                      type="email"
                      value={newOrderForm.customerEmail}
                      onChange={(e) => setNewOrderForm({ ...newOrderForm, customerEmail: e.target.value })}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* SECTION 2: Delivery Address */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-primary border-b pb-2 uppercase tracking-wider">Delivery Address</h3>
              <div className="grid gap-4">
                <div className="space-y-2">
                  <Label>Address Line 1 <span className="text-red-500">*</span></Label>
                  <Input
                    placeholder="House/Flat no., Street, Area"
                    value={newOrderForm.addressLine1}
                    onChange={(e) => setNewOrderForm({ ...newOrderForm, addressLine1: e.target.value })}
                  />
                  {formErrors.addressLine1 && <p className="text-xs text-red-500">{formErrors.addressLine1}</p>}
                </div>
                <div className="space-y-2">
                  <Label>Address Line 2</Label>
                  <Input
                    placeholder="Landmark (optional)"
                    value={newOrderForm.addressLine2}
                    onChange={(e) => setNewOrderForm({ ...newOrderForm, addressLine2: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>City <span className="text-red-500">*</span></Label>
                    <Input
                      placeholder="City"
                      value={newOrderForm.city}
                      onChange={(e) => setNewOrderForm({ ...newOrderForm, city: e.target.value })}
                    />
                    {formErrors.city && <p className="text-xs text-red-500">{formErrors.city}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label>State <span className="text-red-500">*</span></Label>
                    <Select value={newOrderForm.state} onValueChange={(v) => setNewOrderForm({ ...newOrderForm, state: v })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select State" />
                      </SelectTrigger>
                      <SelectContent>
                        {indianStates.map(state => (
                          <SelectItem key={state} value={state}>{state}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {formErrors.state && <p className="text-xs text-red-500">{formErrors.state}</p>}
                  </div>
                  <div className="space-y-2 col-span-2 md:col-span-1">
                    <Label>Pincode <span className="text-red-500">*</span></Label>
                    <Input
                      placeholder="000000"
                      maxLength={6}
                      value={newOrderForm.pincode}
                      onChange={(e) => setNewOrderForm({ ...newOrderForm, pincode: e.target.value.replace(/\D/g, '') })}
                    />
                    {formErrors.pincode && <p className="text-xs text-red-500">{formErrors.pincode}</p>}
                  </div>
                </div>
              </div>
            </div>

            {/* SECTION 3: Order Items */}
            <div className="space-y-4">
              <div className="flex justify-between items-center border-b pb-2">
                <h3 className="text-sm font-semibold text-primary uppercase tracking-wider">Order Items</h3>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs"
                  onClick={() => setNewOrderForm(prev => ({
                    ...prev,
                    items: [...prev.items, { name: "", qty: 1, unitPrice: 0, total: 0 }]
                  }))}
                >
                  <Plus className="h-3 w-3 mr-1" /> Add Item
                </Button>
              </div>

              <div className="space-y-3">
                {newOrderForm.items.map((item, idx) => (
                  <div key={idx} className="flex items-start gap-2 bg-slate-50 p-3 rounded-lg border">
                    <div className="grid grid-cols-12 gap-3 flex-1">
                      <div className="col-span-12 sm:col-span-5 space-y-1">
                        <Label className="text-xs">Item Name <span className="text-red-500">*</span></Label>
                        <Input
                          placeholder="Product Name"
                          value={item.name}
                          onChange={(e) => {
                            const newItems = [...newOrderForm.items];
                            newItems[idx].name = e.target.value;
                            setNewOrderForm({ ...newOrderForm, items: newItems });
                          }}
                        />
                        {formErrors[`itemName_${idx}`] && <p className="text-[10px] text-red-500 m-0">{formErrors[`itemName_${idx}`]}</p>}
                      </div>
                      <div className="col-span-4 sm:col-span-2 space-y-1">
                        <Label className="text-xs">Qty <span className="text-red-500">*</span></Label>
                        <Input
                          type="number"
                          min="1"
                          value={item.qty}
                          onChange={(e) => {
                            const newItems = [...newOrderForm.items];
                            newItems[idx].qty = parseInt(e.target.value) || 0;
                            newItems[idx].total = newItems[idx].qty * newItems[idx].unitPrice;
                            setNewOrderForm({ ...newOrderForm, items: newItems });
                          }}
                        />
                      </div>
                      <div className="col-span-8 sm:col-span-3 space-y-1">
                        <Label className="text-xs">Price (₹) <span className="text-red-500">*</span></Label>
                        <Input
                          type="number"
                          min="0"
                          value={item.unitPrice}
                          onChange={(e) => {
                            const newItems = [...newOrderForm.items];
                            newItems[idx].unitPrice = parseFloat(e.target.value) || 0;
                            newItems[idx].total = newItems[idx].qty * newItems[idx].unitPrice;
                            setNewOrderForm({ ...newOrderForm, items: newItems });
                          }}
                        />
                      </div>
                      <div className="col-span-12 sm:col-span-2 space-y-1">
                        <Label className="text-xs">Total</Label>
                        <Input disabled value={`₹${item.total}`} className="bg-slate-100 font-semibold" />
                      </div>
                    </div>
                    {newOrderForm.items.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="text-red-500 shrink-0 mt-5"
                        onClick={() => {
                          const newItems = newOrderForm.items.filter((_, i) => i !== idx);
                          setNewOrderForm({ ...newOrderForm, items: newItems });
                        }}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>

              <div className="flex justify-end p-3 bg-slate-100 rounded-lg border">
                <div className="text-right">
                  <span className="text-sm text-muted-foreground mr-3">Total Order Value:</span>
                  <span className="text-lg font-bold text-primary">₹{(calculateOrderValue(newOrderForm.items)).toLocaleString('en-IN')}</span>
                </div>
              </div>
            </div>

            {/* SECTION 4: Order Metadata */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-primary border-b pb-2 uppercase tracking-wider">Order Details</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Payment Status <span className="text-red-500">*</span></Label>
                  <Select value={newOrderForm.paymentStatus} onValueChange={(v) => setNewOrderForm({ ...newOrderForm, paymentStatus: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Paid">Paid</SelectItem>
                      <SelectItem value="Unpaid">Unpaid</SelectItem>
                      <SelectItem value="COD Pending">COD Pending</SelectItem>
                      <SelectItem value="Refunded">Refunded</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Order Status <span className="text-red-500">*</span></Label>
                  <Select value={newOrderForm.status} onValueChange={(v) => setNewOrderForm({ ...newOrderForm, status: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="New">New</SelectItem>
                      <SelectItem value="Pending">Pending</SelectItem>
                      <SelectItem value="Confirmed">Confirmed</SelectItem>
                      <SelectItem value="Processing">Processing</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2 col-span-2">
                  <Label>Channel <span className="text-red-500">*</span></Label>
                  <Select value={newOrderForm.channel} onValueChange={(v) => setNewOrderForm({ ...newOrderForm, channel: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Manual">Manual</SelectItem>
                      <SelectItem value="Shopify">Shopify</SelectItem>
                      <SelectItem value="WooCommerce">WooCommerce</SelectItem>
                      <SelectItem value="Marketplace">Marketplace</SelectItem>
                      <SelectItem value="API">API</SelectItem>
                      <SelectItem value="Custom">Custom</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2 col-span-2">
                  <Label>Notes / Remarks</Label>
                  <Textarea
                    placeholder="Any special instructions..."
                    rows={2}
                    value={newOrderForm.notes}
                    onChange={(e) => setNewOrderForm({ ...newOrderForm, notes: e.target.value })}
                  />
                </div>
              </div>
            </div>

            <SheetFooter className="mt-8 pt-4 border-t flex gap-2">
              <Button type="button" variant="outline" onClick={() => setIsCreateDrawerOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" className="gradient-primary" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create Order
              </Button>
            </SheetFooter>
          </form>
        </SheetContent>
      </Sheet>
    </DashboardLayout>
  );
};

export default UserOrders;
