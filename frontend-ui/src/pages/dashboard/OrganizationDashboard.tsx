import { useState, useEffect, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import DashboardLayout from "@/components/DashboardLayout";
import Footer from "@/components/Footer";
import GettingStarted from "@/components/dashboard/GettingStarted";
import DashboardSummary from "@/components/dashboard/DashboardSummary";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Package, TrendingUp, Clock, CheckCircle, AlertTriangle, Truck,
  Plus, Search, Bell, ArrowUpRight, ArrowDownRight, ArrowRight, BarChart3,
  Calendar, MapPin, Users, Wallet, Shield, Mail, Undo2, Loader2,
  ShoppingBag
} from "lucide-react";

import { authApi, alertsApi, shipmentsApi } from "@/lib/api";
import { API_BASE_URL } from "@/config";
import { format, isToday, isYesterday, isThisMonth, parseISO, isAfter } from "date-fns";

const OrganizationDashboard = () => {
  const navigate = useNavigate();
  // Onboarding progress
  const [showOnboarding, setShowOnboarding] = useState(true);
  const [kycCompleted] = useState(false);
  const [walletRecharged] = useState(false);
  const [firstOrderPlaced] = useState(false);

  const [dateRange, setDateRange] = useState("today");

  const [alerts, setAlerts] = useState<any[]>([]);
  const [alertsLoading, setAlertsLoading] = useState(true);

  // Shipments state
  const [shipments, setShipments] = useState<any[]>([]);
  const [shipmentsLoading, setShipmentsLoading] = useState(true);

  // Orders state (from My Orders)
  const [orders, setOrders] = useState<any[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(true);

  const user = authApi.getCurrentUser();
  const isAdmin = user?.role === 'admin';

  // Fetch real shipments
  useEffect(() => {
    const fetchShipments = async () => {
      try {
        setShipmentsLoading(true);
        const data = await shipmentsApi.getAll();
        if (data.success && data.shipments) {
          setShipments(data.shipments);
        }
      } catch (err) {
        console.error('Failed to fetch shipments:', err);
      } finally {
        setShipmentsLoading(false);
      }
    };
    fetchShipments();
  }, []);

  // Fetch real orders
  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setOrdersLoading(true);
        const token = localStorage.getItem('token');
        const res = await fetch(`${API_BASE_URL}/api/orders/my-orders`, {
          headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
        });
        if (res.ok) {
          const data = await res.json();
          setOrders(data.orders || []);
        }
      } catch (err) {
        console.error('Failed to fetch orders:', err);
      } finally {
        setOrdersLoading(false);
      }
    };
    fetchOrders();
  }, []);

  // Fetch dynamic alerts based on actual shipment data + system alerts
  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        setAlertsLoading(true);
        const data = await alertsApi.getAlerts();
        let fetchedAlerts = data.success ? data.alerts || [] : [];

        // Generate dynamic alerts from shipments (use lowercase statuses)
        const rtoCount = shipments.filter(s => ['returned', 'rto'].includes((s.status || '').toLowerCase())).length;
        const pendingCount = shipments.filter(s => ['pending', 'pending_acceptance', 'partner_assigned', 'payment_received', 'booked', 'pending_pickup'].includes((s.status || '').toLowerCase())).length;

        let dynamicAlerts = [...fetchedAlerts];

        if (rtoCount > 0) {
          dynamicAlerts.push({
            id: 'rto-alert',
            title: `${rtoCount} returned shipment(s) need your attention`,
            description: 'Action required on returned or RTO shipments.',
            type: 'critical',
            icon: 'undo',
            action: { label: 'View Returns', href: '/shipments' }
          });
        }

        if (pendingCount > 0) {
          dynamicAlerts.push({
            id: 'pending-alert',
            title: `${pendingCount} shipments awaiting pickup`,
            description: 'These shipments are ready to be picked up by the partner.',
            type: 'warning',
            icon: 'clock',
            action: { label: 'View Pending', href: '/shipments' }
          });
        }

        setAlerts(dynamicAlerts);
      } catch (err) {
        console.error('Failed to fetch alerts:', err);
      } finally {
        setAlertsLoading(false);
      }
    };

    if (!shipmentsLoading) {
      fetchAlerts();
    }
  }, [shipments, shipmentsLoading]);

  // Auto-remove Getting Started
  useEffect(() => {
    if (kycCompleted && walletRecharged && firstOrderPlaced) {
      setShowOnboarding(false);
    }
  }, [kycCompleted, walletRecharged, firstOrderPlaced]);

  // Derived calculations for Summary Cards (Orders + Revenue)
  // Combines both Orders (from My Orders) and Shipments for complete data
  const summaryData = useMemo(() => {
    // Orders from the orders collection
    const ordersCreatedToday = orders.filter(o => isToday(parseISO(o.createdAt)));
    const ordersCreatedYesterday = orders.filter(o => isYesterday(parseISO(o.createdAt)));
    // Shipments created today/yesterday
    const shipmentsToday = shipments.filter(s => isToday(parseISO(s.createdAt)));
    const shipmentsYesterday = shipments.filter(s => isYesterday(parseISO(s.createdAt)));

    const totalToday = ordersCreatedToday.length + shipmentsToday.length;
    const totalYesterday = ordersCreatedYesterday.length + shipmentsYesterday.length;

    // Revenue: sum orderValue from orders + totalValue/shippingCost from shipments
    const orderRevenueToday = ordersCreatedToday.reduce((sum, o) => sum + (Number(o.orderValue) || 0), 0);
    const orderRevenueYesterday = ordersCreatedYesterday.reduce((sum, o) => sum + (Number(o.orderValue) || 0), 0);
    const shipmentRevenueToday = shipmentsToday.reduce((sum, s) => sum + (Number(s.totalValue) || Number(s.shippingCost) || Number(s.codAmount) || 0), 0);
    const shipmentRevenueYesterday = shipmentsYesterday.reduce((sum, s) => sum + (Number(s.totalValue) || Number(s.shippingCost) || Number(s.codAmount) || 0), 0);

    const revenueToday = orderRevenueToday + shipmentRevenueToday;
    const revenueYesterday = orderRevenueYesterday + shipmentRevenueYesterday;

    const calcChange = (current: number, previous: number) => {
      if (previous === 0) return current > 0 ? 100 : 0;
      return ((current - previous) / previous) * 100;
    };

    return {
      ordersToday: totalToday,
      ordersYesterday: totalYesterday,
      ordersChange: calcChange(totalToday, totalYesterday),
      revenueToday,
      revenueYesterday,
      revenueChange: calcChange(revenueToday, revenueYesterday),
    };
  }, [shipments, orders]);

  // Derived calculations for Metric Cards (Total, Transit, Delivered, Pending)
  const displayStats = useMemo(() => {
    const totalShipments = shipments.length;
    let inTransit = 0, deliveredToday = 0, pendingPickup = 0;

    // Month-over-month for trend
    const now = new Date();
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const thisMonthShips = shipments.filter(s => new Date(s.createdAt) >= thisMonthStart);
    const lastMonthShips = shipments.filter(s => {
      const d = new Date(s.createdAt);
      return d >= lastMonthStart && d < thisMonthStart;
    });

    shipments.forEach(s => {
      const status = (s.status || '').toLowerCase();
      if (['in_transit', 'out_for_delivery', 'pickup'].includes(status)) inTransit++;
      if (status === 'delivered') {
        // Check if delivered today using trackingHistory or actualDelivery
        const deliveryDate = s.actualDelivery || s.updatedAt || s.createdAt;
        if (deliveryDate && isToday(new Date(deliveryDate))) deliveredToday++;
      }
      if (['pending', 'pending_acceptance', 'partner_assigned', 'payment_received', 'booked', 'pending_pickup'].includes(status)) pendingPickup++;
    });

    const calcTrend = (current: number, prev: number) => {
      if (prev === 0) return current > 0 ? { change: '+100%', trend: 'up' } : { change: '0%', trend: 'neutral' };
      const pct = Math.round(((current - prev) / prev) * 100);
      return { change: `${pct > 0 ? '+' : ''}${pct}%`, trend: pct > 0 ? 'up' : pct < 0 ? 'down' : 'neutral' };
    };

    const totalTrend = calcTrend(thisMonthShips.length, lastMonthShips.length);

    const loading = shipmentsLoading;
    return [
      { label: "Total Shipments", value: loading ? "-" : totalShipments.toString(), change: totalTrend.change, trend: totalTrend.trend, icon: Package },
      { label: "In Transit", value: loading ? "-" : inTransit.toString(), change: "0%", trend: "neutral", icon: Truck },
      { label: "Delivered Today", value: loading ? "-" : deliveredToday.toString(), change: "0%", trend: "neutral", icon: CheckCircle },
      { label: "Pending Pickup", value: loading ? "-" : pendingPickup.toString(), change: "0%", trend: "neutral", icon: Clock },
    ];
  }, [shipments, shipmentsLoading, dateRange]);

  // Derived calculations for This Month's Performance
  const performanceData = useMemo(() => {
    const thisMonthShipments = shipments.filter(s => isThisMonth(parseISO(s.createdAt)));
    const totalThisMonth = thisMonthShipments.length;

    let deliveredCount = 0;
    let onTimeCount = 0;
    let rtoCount = 0;

    thisMonthShipments.forEach(s => {
      const status = (s.status || '').toLowerCase();
      if (status === 'delivered') {
        deliveredCount++;
        // Rough estimate of on-time: actual delivery date <= estimated delivery date
        if (s.estimatedDelivery && s.actualDelivery) {
          if (!isAfter(new Date(s.actualDelivery), new Date(s.estimatedDelivery))) {
            onTimeCount++;
          }
        } else {
          // Default to on-time if dates are unavailable
          onTimeCount++;
        }
      }
      if (['returned', 'rto'].includes(status)) {
        rtoCount++;
      }
    });

    return {
      successRate: totalThisMonth ? Math.round((deliveredCount / totalThisMonth) * 100) : 0,
      onTimeRate: deliveredCount ? Math.round((onTimeCount / deliveredCount) * 100) : 0,
      rtoRate: totalThisMonth ? Math.round((rtoCount / totalThisMonth) * 100) : 0,
      monthName: format(new Date(), 'MMMM yyyy')
    };
  }, [shipments]);

  // Recent Shipments (top 5) — uses correct Shipment model field names
  const recentTopShipments = useMemo(() => {
    return [...shipments]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5)
      .map(s => ({
        id: s.awb || s._id?.substring(0, 8).toUpperCase(),
        actualId: s._id,
        status: s.status || 'payment_received',
        date: format(parseISO(s.createdAt), 'dd MMM yyyy'),
        origin: s.pickup?.city || s.pickup?.state || s.pickup?.pincode || '—',
        destination: s.delivery?.city || s.delivery?.state || s.delivery?.pincode || '—',
        amount: Number(s.shippingCost) || Number(s.totalValue) || Number(s.codAmount) || 0,
        paymentMode: (s.paymentMode || 'prepaid').toUpperCase(),
      }));
  }, [shipments]);

  // Recent Orders (top 5) — from Orders collection
  const recentTopOrders = useMemo(() => {
    return [...orders]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5);
  }, [orders]);

  // Actions needing attention (dynamic counts)
  const actionItems = useMemo(() => {
    const items: { label: string; count: number; href: string; color: string }[] = [];

    // Orders not yet shipped
    const unshippedOrders = orders.filter(o => ['New', 'Pending'].includes(o.orderStatus)).length;
    if (unshippedOrders > 0) items.push({ label: `${unshippedOrders} order(s) not yet shipped`, count: unshippedOrders, href: '/my-orders', color: 'text-blue-600' });

    // Pending pickups
    const pendingPickups = shipments.filter(s => ['pending', 'payment_received', 'booked', 'pending_pickup'].includes((s.status || '').toLowerCase())).length;
    if (pendingPickups > 0) items.push({ label: `${pendingPickups} shipment(s) need pickup scheduling`, count: pendingPickups, href: '/shipments', color: 'text-orange-600' });

    // RTO / returns
    const rtoCount = shipments.filter(s => ['returned', 'rto'].includes((s.status || '').toLowerCase())).length;
    if (rtoCount > 0) items.push({ label: `${rtoCount} returned shipment(s) need attention`, count: rtoCount, href: '/shipments', color: 'text-red-600' });

    // COD pending
    const codPending = shipments.filter(s => (s.paymentMode || '').toLowerCase() === 'cod' && (s.status || '').toLowerCase() === 'delivered').length;
    if (codPending > 0) items.push({ label: `${codPending} COD remittance(s) pending`, count: codPending, href: '/my-reports?tab=cod', color: 'text-amber-600' });

    return items;
  }, [shipments, orders]);

  const filteredQuickActions = [
    { label: "New Shipment", icon: Plus, href: "/shipment/new", color: "bg-primary" },
    { label: "Bulk Upload", icon: Package, href: "/bulk/upload", color: "bg-green-500" },
    { label: "Track Order", icon: Search, href: "/track", color: "bg-orange-500" },
    { label: "Rate Calculator", icon: BarChart3, href: "/rates", color: "bg-purple-500" },
  ].filter(action => {
    if (!isAdmin && action.label === "Bulk Upload") return false;
    return true;
  });

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Welcome Section */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Welcome back, {user?.name || user?.businessName || "FastFare"}</h1>
            <p className="text-sm text-muted-foreground">Here's what's happening with your shipments today.</p>
          </div>
          <div className="flex gap-3">
            <Select value={dateRange} onValueChange={setDateRange}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select period" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="today">Today: {format(new Date(), 'MMM d')}</SelectItem>
                <SelectItem value="yesterday">Yesterday</SelectItem>
                <SelectItem value="7d">Last 7 Days</SelectItem>
                <SelectItem value="30d">Last 30 Days</SelectItem>
                <SelectItem value="month">This Month</SelectItem>
              </SelectContent>
            </Select>
            <Link to="/shipment/new">
              <Button className="gap-2 gradient-primary">
                <Plus className="h-4 w-4" />
                New Shipment
              </Button>
            </Link>
          </div>
        </div>

        {/* KYC Alert */}
        {user && user?.kycStatus !== 'complete' && user?.kyc?.status !== 'verified' && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-lg border-2 border-red-500 bg-red-50 dark:bg-red-950/30 p-4"
          >
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <h3 className="text-base font-bold text-red-800 dark:text-red-200">
                  ⚠️ KYC Verification Incomplete
                </h3>
                <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                  Your GSTIN and KYC verification is pending. Please complete it to unlock all features including shipment booking, wallet recharge, and more.
                </p>
              </div>
              <Button
                size="sm"
                className="bg-red-600 hover:bg-red-700 text-white font-medium flex-shrink-0"
                onClick={() => navigate('/settings/kyc')}
              >
                Complete KYC →
              </Button>
            </div>
          </motion.div>
        )}

        {/* Quick Actions */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {filteredQuickActions.map((action) => (
            <Link key={action.label} to={action.href}>
              <Button
                variant="outline"
                className="w-full h-auto flex-row gap-3 py-3 px-4 hover:border-primary justify-start"
              >
                <div className={`h-9 w-9 rounded-lg ${action.color} flex items-center justify-center flex-shrink-0`}>
                  <action.icon className="h-4 w-4 text-white" />
                </div>
                <span className="text-sm font-medium">{action.label}</span>
              </Button>
            </Link>
          ))}
        </div>

        {/* Getting Started Section */}
        {showOnboarding && shipments.length === 0 && orders.length === 0 && !shipmentsLoading && !ordersLoading && (
          <GettingStarted
            showWelcomeOffer={true}
            kycCompleted={kycCompleted}
            walletRecharged={walletRecharged}
            firstOrderPlaced={firstOrderPlaced}
          />
        )}

        {/* Summary Section */}
        <div>
          <h2 className="text-lg font-semibold mb-4">Summary</h2>
          {shipmentsLoading && ordersLoading ? (
            <div className="grid md:grid-cols-2 gap-4">
              <div className="h-[120px] bg-muted animate-pulse rounded-xl"></div>
              <div className="h-[120px] bg-muted animate-pulse rounded-xl"></div>
            </div>
          ) : (
            <DashboardSummary data={summaryData} />
          )}
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
          {displayStats.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                      <stat.icon className="h-6 w-6 text-primary" />
                    </div>
                    <Badge variant={stat.trend === "up" ? "default" : stat.trend === "down" ? "destructive" : "secondary"} className="gap-1">
                      {stat.trend === "up" && <ArrowUpRight className="h-3 w-3" />}
                      {stat.trend === "down" && <ArrowDownRight className="h-3 w-3" />}
                      {stat.trend === "neutral" && <ArrowRight className="h-3 w-3" />}
                      {stat.change}
                    </Badge>
                  </div>
                  <div className="mt-3">
                    {shipmentsLoading ? (
                      <div className="h-8 w-16 bg-muted animate-pulse rounded mt-1"></div>
                    ) : (
                      <p className="text-2xl font-bold">{stat.value}</p>
                    )}
                    <p className="text-xs text-muted-foreground mt-1">{stat.label}</p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Shipments */}
          <div className="lg:col-span-2">
            <Card className="h-full flex flex-col">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Recent Shipments</CardTitle>
                  <CardDescription>Your latest shipment activity</CardDescription>
                </div>
                <Link to="/shipments">
                  <Button variant="ghost" size="sm">View all</Button>
                </Link>
              </CardHeader>
              <CardContent className="flex-1">
                {shipmentsLoading ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map(i => (
                      <div key={i} className="h-16 bg-muted animate-pulse rounded-lg"></div>
                    ))}
                  </div>
                ) : recentTopShipments.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-10 text-center space-y-3">
                    <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
                      <Package className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="font-medium text-muted-foreground">No shipments yet.</p>
                      <p className="text-sm text-muted-foreground">Book your first shipment to see it here.</p>
                    </div>
                    <Button className="mt-2" onClick={() => navigate('/shipment/new')}>+ New Shipment</Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {recentTopShipments.map((shipment) => (
                      <div
                        key={shipment.id}
                        className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-lg border hover:bg-muted/50 transition-colors gap-3 sm:gap-0"
                      >
                        <div className="flex items-center gap-4">
                          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                            <Package className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <Link to={`/shipments`} className="font-medium text-primary hover:underline">{shipment.id}</Link>
                            <p className="text-sm text-muted-foreground break-all">
                              {shipment.origin} → {shipment.destination}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center justify-between sm:justify-end gap-4 w-full sm:w-auto mt-2 sm:mt-0">
                          <div className="text-left sm:text-right">
                            <p className="text-sm font-semibold">₹{Number(shipment.amount).toLocaleString('en-IN')}</p>
                            <Badge variant="outline" className={shipment.paymentMode === 'COD' ? 'border-orange-300 text-orange-700 bg-orange-50' : 'border-green-300 text-green-700 bg-green-50'}>
                              {shipment.paymentMode}
                            </Badge>
                          </div>
                          <div className="text-right">
                            <Badge
                              variant="secondary"
                              className={(() => {
                                const st = (shipment.status || '').toLowerCase();
                                if (st === 'delivered') return 'bg-green-100 text-green-800';
                                if (['in_transit', 'out_for_delivery', 'pickup'].includes(st)) return 'bg-orange-100 text-orange-800';
                                if (['returned', 'rto'].includes(st)) return 'bg-red-100 text-red-800';
                                if (['partner_assigned', 'driver_assigned'].includes(st)) return 'bg-blue-100 text-blue-800';
                                return 'bg-slate-100 text-slate-800';
                              })()}
                            >
                              {(shipment.status || 'pending').replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase())}
                            </Badge>
                            <p className="text-xs text-muted-foreground mt-1">{shipment.date}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Real-Time Alerts */}
          <div className="space-y-6">
            <Card className="h-full">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-base">Alerts</CardTitle>
                {alerts.length > 0 && !alertsLoading && (
                  <Badge variant="destructive">{alerts.length}</Badge>
                )}
              </CardHeader>
              <CardContent className="space-y-3">
                {alertsLoading ? (
                  <div className="flex items-center justify-center py-6">
                    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                    <span className="ml-2 text-sm text-muted-foreground">Loading alerts…</span>
                  </div>
                ) : alerts.length === 0 ? (
                  <div className="flex items-center gap-3 p-4 rounded-lg bg-green-500/10 border border-green-500/20">
                    <CheckCircle className="h-6 w-6 text-green-500 shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-green-700 dark:text-green-300">All caught up!</p>
                      <p className="text-xs text-muted-foreground">No actions needed right now.</p>
                    </div>
                  </div>
                ) : (
                  alerts.map((alert) => {
                    const colorMap: Record<string, { bg: string; border: string; text: string }> = {
                      critical: { bg: 'bg-red-500/10', border: 'border-red-500/20', text: 'text-red-500' },
                      warning: { bg: 'bg-yellow-500/10', border: 'border-yellow-500/20', text: 'text-yellow-500' },
                      info: { bg: 'bg-blue-500/10', border: 'border-blue-500/20', text: 'text-blue-500' },
                    };
                    const iconMap: Record<string, React.ElementType> = {
                      shield: Shield,
                      mail: Mail,
                      wallet: Wallet,
                      clock: Clock,
                      package: Package,
                      undo: Undo2,
                      plus: Plus,
                    };
                    const colors = colorMap[alert.type] || colorMap.info;
                    const IconComponent = iconMap[alert.icon] || AlertTriangle;

                    return (
                      <div
                        key={alert.id}
                        className={`flex flex-col gap-2 p-3 rounded-lg ${colors.bg} border ${colors.border}`}
                      >
                        <div className="flex items-start gap-3">
                          <IconComponent className={`h-5 w-5 ${colors.text} shrink-0 mt-0.5`} />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium">{alert.title}</p>
                            <p className="text-xs text-muted-foreground">{alert.description}</p>
                          </div>
                        </div>
                        {alert.action && (
                          <div className="flex justify-end mt-1">
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-xs h-7 hover:bg-background"
                              onClick={() => navigate(alert.action.href || '/shipments')}
                            >
                              {alert.action.label} →
                            </Button>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Performance Overview */}
        <Card>
          <CardHeader>
            <CardTitle>This Month's Performance</CardTitle>
            <CardDescription>Your shipping metrics for {performanceData.monthName}</CardDescription>
          </CardHeader>
          <CardContent>
            {shipmentsLoading ? (
              <div className="flex gap-4 overflow-hidden">
                {[1, 2, 3, 4].map(i => <div key={i} className="h-12 min-w-[200px] bg-muted animate-pulse rounded"></div>)}
              </div>
            ) : (
              <div className="flex overflow-x-auto gap-4 pb-4 snap-x hide-scrollbar">
                <div className="min-w-[200px] snap-center shrink-0">
                  <p className="text-sm text-muted-foreground mb-2">Delivery Success Rate</p>
                  <div className="flex items-center gap-2">
                    <Progress value={performanceData.successRate} className="flex-1" />
                    <span className="text-sm font-medium">{performanceData.successRate}%</span>
                  </div>
                </div>
                <div className="min-w-[200px] snap-center shrink-0">
                  <p className="text-sm text-muted-foreground mb-2">On-Time Delivery</p>
                  <div className="flex items-center gap-2">
                    <Progress value={performanceData.onTimeRate} className="flex-1" />
                    <span className="text-sm font-medium">{performanceData.onTimeRate}%</span>
                  </div>
                </div>
                <div className="min-w-[200px] snap-center shrink-0">
                  <p className="text-sm text-muted-foreground mb-2">RTO Rate</p>
                  <div className="flex items-center gap-2">
                    <Progress value={performanceData.rtoRate} className="flex-1" />
                    <span className="text-sm font-medium">{performanceData.rtoRate}%</span>
                  </div>
                </div>
                <div className="min-w-[200px] snap-center shrink-0">
                  <p className="text-sm text-muted-foreground mb-2">Customer Rating</p>
                  <div className="flex items-center gap-2">
                    <Progress value={0} className="flex-1 opacity-50" />
                    <span className="text-sm font-medium text-muted-foreground">No ratings yet</span>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Actions Needed Section */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Actions Needing Your Attention Today</CardTitle>
          </CardHeader>
          <CardContent>
            {(shipmentsLoading && ordersLoading) ? (
              <div className="space-y-3">
                {[1, 2].map(i => <div key={i} className="h-12 bg-muted animate-pulse rounded-lg"></div>)}
              </div>
            ) : actionItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <div className="h-24 w-24 bg-muted/50 rounded-full flex items-center justify-center mb-4">
                  <CheckCircle className="h-10 w-10 text-green-500" />
                </div>
                <p className="text-muted-foreground">All caught up for today! No actions needed right now.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {actionItems.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors">
                    <div className="flex items-center gap-3">
                      <AlertTriangle className={`h-5 w-5 ${item.color}`} />
                      <span className="text-sm font-medium">{item.label}</span>
                    </div>
                    <Link to={item.href}>
                      <Button variant="ghost" size="sm" className="text-xs">View →</Button>
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Footer />
      </div>
    </DashboardLayout>
  );
};

export default OrganizationDashboard;

