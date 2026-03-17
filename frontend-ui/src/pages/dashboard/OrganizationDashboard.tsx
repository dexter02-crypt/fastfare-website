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
import ActionsNeeded from "@/components/dashboard/ActionsNeeded";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Package, TrendingUp, Clock, CheckCircle, AlertTriangle, Truck,
  Plus, Search, Bell, ArrowUpRight, ArrowDownRight, ArrowRight, BarChart3,
  Calendar, MapPin, Users, Wallet, Shield, Mail, Undo2, Loader2
} from "lucide-react";

import { authApi, alertsApi, shipmentsApi } from "@/lib/api";
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

  // Fetch dynamic alerts based on actual shipment data + system alerts
  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        setAlertsLoading(true);
        const data = await alertsApi.getAlerts();
        let fetchedAlerts = data.success ? data.alerts || [] : [];

        // Generate dynamic alerts from shipments
        const rtoCount = shipments.filter(s => ['Returned', 'RTO'].includes(s.status)).length;
        const pendingCount = shipments.filter(s => ['Pending', 'Pending Acceptance', 'Partner Assigned'].includes(s.status)).length;

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
  const summaryData = useMemo(() => {
    const today = shipments.filter(s => isToday(parseISO(s.createdAt)));
    const yesterday = shipments.filter(s => isYesterday(parseISO(s.createdAt)));

    const ordersToday = today.length;
    const ordersYesterday = yesterday.length;

    const getRevenue = (orders: any[]) => orders.reduce((sum, order) => {
      // Default to declaredValue, fallback to codAmount if available
      return sum + (Number(order.packageDetails?.declaredValue) || Number(order.paymentDetails?.codAmount) || 0);
    }, 0);

    const revenueToday = getRevenue(today);
    const revenueYesterday = getRevenue(yesterday);

    const calcChange = (current: number, previous: number) => {
      if (previous === 0) return current > 0 ? 100 : 0;
      return ((current - previous) / previous) * 100;
    };

    return {
      ordersToday,
      ordersYesterday,
      ordersChange: calcChange(ordersToday, ordersYesterday),
      revenueToday,
      revenueYesterday,
      revenueChange: calcChange(revenueToday, revenueYesterday),
    };
  }, [shipments]);

  // Derived calculations for Metric Cards (Total, Transit, Delivered, Pending)
  const displayStats = useMemo(() => {
    const totalShipments = shipments.length;
    let inTransit = 0, deliveredToday = 0, pendingPickup = 0;

    shipments.forEach(s => {
      const status = s.status;
      if (status === "In Transit") inTransit++;
      if (status === "Delivered" && isToday(parseISO(s.statusUpdates?.[s.statusUpdates.length - 1]?.date || s.createdAt))) deliveredToday++;
      if (['Pending', 'Pending Acceptance', 'Partner Assigned'].includes(status)) pendingPickup++;
    });

    // Dummy trends for now, could be calculated similarly to ordersChange
    return [
      { label: "Total Shipments", value: shipmentsLoading ? "-" : totalShipments.toString(), change: "0%", trend: "neutral", icon: Package },
      { label: "In Transit", value: shipmentsLoading ? "-" : inTransit.toString(), change: "0%", trend: "neutral", icon: Truck },
      { label: "Delivered Today", value: shipmentsLoading ? "-" : deliveredToday.toString(), change: "0%", trend: "neutral", icon: CheckCircle },
      { label: "Pending Pickup", value: shipmentsLoading ? "-" : pendingPickup.toString(), change: "0%", trend: "neutral", icon: Clock },
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
      if (s.status === "Delivered") {
        deliveredCount++;
        // Rough estimate of on-time: delivered date <= estDelivery date
        const deliveryDateUpdate = s.statusUpdates?.find((su: any) => su.status === "Delivered");
        if (s.estDelivery && deliveryDateUpdate) {
          if (!isAfter(parseISO(deliveryDateUpdate.date), parseISO(s.estDelivery))) {
            onTimeCount++;
          }
        } else {
          // Default to on-time if dates are muddy but it's delivered
          onTimeCount++;
        }
      }
      if (['Returned', 'RTO'].includes(s.status)) {
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

  // Recent Shipments (top 5)
  const recentTopShipments = useMemo(() => {
    return [...shipments]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5)
      .map(s => ({
        id: s.awbNumber || s._id.substring(0, 8).toUpperCase(),
        actualId: s._id,
        status: s.status,
        date: format(parseISO(s.createdAt), 'dd MMM yyyy'),
        origin: s.pickupDetails?.address?.city || 'Unknown',
        destination: s.deliveryDetails?.address?.city || 'Unknown',
        amount: s.paymentDetails?.codAmount || s.packageDetails?.declaredValue || 0,
        paymentMode: s.paymentDetails?.mode || 'PREPAID',
      }));
  }, [shipments]);

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
        {showOnboarding && shipments.length === 0 && !shipmentsLoading && (
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
          {shipmentsLoading ? (
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
                            <p className="text-sm font-semibold">₹{shipment.amount.toLocaleString('en-IN')}</p>
                            <p className="text-xs text-muted-foreground">{shipment.paymentMode}</p>
                          </div>
                          <div className="text-right">
                            <Badge
                              variant={
                                shipment.status === "Delivered" ? "default" :
                                  shipment.status === "In Transit" ? "secondary" : "outline"
                              }
                            >
                              {shipment.status}
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
        <ActionsNeeded hasActions={false} />

        <Footer />
      </div>
    </DashboardLayout>
  );
};

export default OrganizationDashboard;

