import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  ChevronRight, TrendingUp, CheckCircle, Package, RefreshCw,
  Plus, Calculator, Search, Wallet, AlertCircle, X, Truck,
  Loader2, RotateCcw,
  ShoppingBag,
} from "lucide-react";
import { motion } from "framer-motion";
import { API_BASE_URL } from "@/config";
import { FEATURES } from "@/config/features";
import { formatDate } from "@/utils/dateFormat";
import { useWallet } from "@/contexts/WalletContext";

interface DashboardStats {
  totalOrders: number;
  deliveredOrders: number;
  newOrders: number;
  processingOrders: number;
  cancelledOrders: number;
  inTransitShipments: number;
  rtoShipments: number;
  deliveredShipments: number;
  codPendingAmount: number;
  totalRevenue: number;
  walletBalance: number;
  businessName: string;
  recentOrders: any[];
}

const Dashboard = () => {
  const navigate = useNavigate();
  const [showKycReminder, setShowKycReminder] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const { balance } = useWallet();

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE_URL}/api/orders/stats/dashboard`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();

      if (data.success) {
        setStats(data.stats);
      } else {
        throw new Error(data.message || "Failed to load dashboard");
      }
    } catch (err: any) {
      console.error("Dashboard fetch error:", err);
      setError(err.message || "Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();

    // Auto-refresh stats every 30 seconds for near real-time updates
    const pollInterval = setInterval(() => {
      fetchDashboard();
    }, 30000);

    // Check KYC status
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    if (FEATURES.KYC_ENABLED && (!user.gstin || user.kyc?.status === "pending")) {
      setShowKycReminder(true);
    }

    return () => clearInterval(pollInterval);
  }, []);

  const getStatusBadge = (status: string) => {
    const map: Record<string, string> = {
      New: "bg-blue-100 text-blue-800",
      Pending: "bg-amber-100 text-amber-800",
      Confirmed: "bg-indigo-100 text-indigo-800",
      Processing: "bg-indigo-100 text-indigo-800",
      Shipped: "bg-purple-100 text-purple-800",
      Delivered: "bg-green-100 text-green-800",
      Cancelled: "bg-red-100 text-red-800",
    };
    return map[status] || "bg-gray-100 text-gray-800";
  };

  // Build stat cards from live data
  const statCards = stats
    ? [
      {
        label: "Total Orders",
        value: stats.totalOrders.toString(),
        sublabel: stats.totalOrders === 0 ? "No orders yet" : `${stats.newOrders} new, ${stats.processingOrders} processing`,
        icon: Package,
        color: "bg-blue-50 text-primary",
      },
      {
        label: "In Transit",
        value: stats.inTransitShipments.toString(),
        sublabel: stats.inTransitShipments === 0 ? "No active deliveries" : "Active shipments",
        icon: Truck,
        color: "bg-orange-50 text-orange-600",
      },
      {
        label: "Delivered",
        value: (stats.deliveredOrders + stats.deliveredShipments).toString(),
        sublabel: stats.deliveredOrders === 0 && stats.deliveredShipments === 0 ? "No deliveries yet" : `${stats.deliveredOrders} orders, ${stats.deliveredShipments} shipments`,
        icon: CheckCircle,
        color: "bg-green-50 text-green-600",
      },
      {
        label: "Wallet Balance",
        value: `₹${(balance ?? stats.walletBalance ?? 0).toLocaleString("en-IN")}`,
        sublabel: "Available credits",
        icon: Wallet,
        color: "bg-purple-50 text-purple-600",
      },
    ]
    : [];

  return (
    <DashboardLayout>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="space-y-6"
      >
        {/* Page Title */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Dashboard</h1>
            <p className="text-muted-foreground">
              Overview of your logistics operations.
            </p>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            {!loading && (
              <>
                Last updated: Just now
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={fetchDashboard}>
                  <RefreshCw size={16} />
                </Button>
              </>
            )}
          </div>
        </div>

        {/* KYC Reminder Banner */}
        {showKycReminder && (
          <Alert className="bg-red-50 border-red-300">
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-red-600" />
                  <strong className="text-red-800">Complete KYC Verification</strong>
                </div>
                <Button variant="ghost" size="icon" className="h-6 w-6 text-red-600" onClick={() => setShowKycReminder(false)}>
                  <X size={14} />
                </Button>
              </div>
              <p className="text-sm text-red-700 mt-1">
                Your GSTIN/KYC verification is incomplete. Complete it to unlock all features.
              </p>
              <div className="mt-3 flex gap-2">
                <Button size="sm" className="bg-red-600 hover:bg-red-700 text-white">
                  <Link to="/settings" className="flex items-center gap-1">
                    Complete KYC Now <ChevronRight size={14} />
                  </Link>
                </Button>
                <Button size="sm" variant="outline" className="border-red-300 text-red-700" onClick={() => setShowKycReminder(false)}>
                  Remind Later
                </Button>
              </div>
            </div>
          </Alert>
        )}

        {/* Loading State */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
            <p className="text-muted-foreground">Loading dashboard...</p>
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="flex flex-col items-center justify-center py-20 bg-card rounded-xl border">
            <AlertCircle className="h-12 w-12 text-red-400 mb-4" />
            <p className="text-lg font-medium mb-2">Failed to load dashboard</p>
            <p className="text-sm text-muted-foreground mb-4">{error}</p>
            <Button onClick={fetchDashboard} className="gap-2">
              <RotateCcw size={16} /> Retry
            </Button>
          </div>
        )}

        {/* Stats + Content (only when loaded) */}
        {!loading && !error && stats && (
          <>
            {/* Stats Grid */}
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {statCards.map((stat) => (
                <div
                  key={stat.label}
                  className="bg-card rounded-xl p-5 border border-border shadow-sm"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="text-sm text-muted-foreground">{stat.label}</p>
                      <p className="text-3xl font-bold mt-1">{stat.value}</p>
                    </div>
                    <div className={`p-2 rounded-lg ${stat.color}`}>
                      <stat.icon size={20} />
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground">{stat.sublabel}</p>
                </div>
              ))}
            </div>

            {/* Secondary Stats Row */}
            <div className="grid sm:grid-cols-3 gap-4">
              <Card className="p-5 flex items-center gap-4">
                <div className="p-3 rounded-lg bg-red-50">
                  <RotateCcw className="h-5 w-5 text-red-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">RTO / Returns</p>
                  <p className="text-2xl font-bold">{stats.rtoShipments}</p>
                </div>
              </Card>
              <Card className="p-5 flex items-center gap-4">
                <div className="p-3 rounded-lg bg-amber-50">
                  <Wallet className="h-5 w-5 text-amber-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">COD Pending</p>
                  <p className="text-2xl font-bold">₹{stats.codPendingAmount.toLocaleString("en-IN")}</p>
                </div>
              </Card>
              <Card className="p-5 flex items-center gap-4">
                <div className="p-3 rounded-lg bg-green-50">
                  <TrendingUp className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Revenue</p>
                  <p className="text-2xl font-bold">₹{stats.totalRevenue.toLocaleString("en-IN")}</p>
                </div>
              </Card>
            </div>

            {/* Quick Actions */}
            <div>
              <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
              <div className="grid sm:grid-cols-4 gap-4">
                <Button className="h-auto py-4 gradient-primary text-primary-foreground hover:opacity-90 gap-2" onClick={() => navigate("/shipments/new")}>
                  <Plus size={20} /> New Shipment
                </Button>
                <Button variant="outline" className="h-auto py-4 gap-2" onClick={() => navigate("/rate-calculator")}>
                  <Calculator size={20} /> Calculate Rates
                </Button>
                <Button variant="outline" className="h-auto py-4 gap-2" onClick={() => navigate("/track")}>
                  <Search size={20} /> Track Order
                </Button>
                <Link to="/my-reports?tab=cod" className="contents">
                  <Button variant="outline" className="h-auto py-4 gap-2 w-full text-blue-700 border-blue-200 bg-blue-50/50 hover:bg-blue-100">
                    <Wallet size={20} /> COD Remittance
                  </Button>
                </Link>
              </div>
            </div>

            {/* Recent Orders Table */}
            <div className="bg-card rounded-xl border border-border shadow-sm">
              <div className="p-5 border-b border-border flex items-center justify-between">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <ShoppingBag className="h-5 w-5 text-primary" />
                  Recent Orders
                </h2>
                <Link to="/my-orders">
                  <Button variant="ghost" size="sm" className="text-primary gap-1">
                    View all <ChevronRight size={16} />
                  </Button>
                </Link>
              </div>

              {stats.recentOrders.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <div className="h-14 w-14 rounded-full bg-muted/60 flex items-center justify-center mb-3">
                    <Package className="h-7 w-7 text-muted-foreground/50" />
                  </div>
                  <p className="text-base font-medium">No orders yet</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Create your first order to see it here.
                  </p>
                  <Button className="mt-4 gradient-primary" onClick={() => navigate("/my-orders")}>
                    <Plus size={16} className="mr-2" /> Create Order
                  </Button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader className="bg-muted/50">
                      <TableRow>
                        <TableHead>Order ID</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Customer</TableHead>
                        <TableHead className="text-right">Value</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Channel</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {stats.recentOrders.map((order: any) => (
                        <TableRow key={order._id} className="hover:bg-muted/30">
                          <TableCell className="font-mono font-semibold text-primary">
                            {order.orderId}
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {formatDate(order.createdAt)}
                          </TableCell>
                          <TableCell className="font-medium">
                            {order.customer?.name || "—"}
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            ₹{order.orderValue?.toLocaleString("en-IN") || 0}
                          </TableCell>
                          <TableCell>
                            <Badge className={`${getStatusBadge(order.orderStatus || "New")} border-none`}>
                              {order.orderStatus || "New"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary" className="bg-slate-100 font-normal shadow-sm">
                              {order.channel || "Manual"}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}

              {stats.recentOrders.length > 0 && (
                <div className="p-4 border-t border-border text-sm text-muted-foreground">
                  Showing {stats.recentOrders.length} of {stats.totalOrders} orders
                </div>
              )}
            </div>
          </>
        )}
      </motion.div>
    </DashboardLayout>
  );
};

export default Dashboard;
