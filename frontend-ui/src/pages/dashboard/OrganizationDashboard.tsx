import { useState, useEffect } from "react";
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
  Plus, Search, Bell, ArrowUpRight, ArrowDownRight, BarChart3,
  Calendar, MapPin, Users, Wallet, Shield, Mail, Undo2, Loader2
} from "lucide-react";

import { authApi, alertsApi } from "@/lib/api";

const recentShipments: { id: string; status: string; origin: string; destination: string; eta: string }[] = [];

const OrganizationDashboard = () => {
  const navigate = useNavigate();
  // Onboarding progress — auto-hide when all steps completed
  const [showOnboarding, setShowOnboarding] = useState(true);
  const [kycCompleted] = useState(false);
  const [walletRecharged] = useState(false);
  const [firstOrderPlaced] = useState(false);
  const [dateRange, setDateRange] = useState("today");
  const [alerts, setAlerts] = useState<any[]>([]);
  const [alertsLoading, setAlertsLoading] = useState(true);

  // Fetch real alerts from API
  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        const data = await alertsApi.getAlerts();
        if (data.success) {
          setAlerts(data.alerts);
        }
      } catch (err) {
        console.error('Failed to fetch alerts:', err);
      } finally {
        setAlertsLoading(false);
      }
    };
    fetchAlerts();
  }, []);

  // Auto-remove Getting Started when all steps are completed
  useEffect(() => {
    if (kycCompleted && walletRecharged && firstOrderPlaced) {
      setShowOnboarding(false);
    }
  }, [kycCompleted, walletRecharged, firstOrderPlaced]);

  const [stats, setStats] = useState([
    { label: "Total Shipments", value: "0", change: "0%", trend: "up", icon: Package },
    { label: "In Transit", value: "0", change: "0%", trend: "up", icon: Truck },
    { label: "Delivered Today", value: "0", change: "0%", trend: "up", icon: CheckCircle },
    { label: "Pending Pickup", value: "0", change: "0%", trend: "up", icon: Clock },
  ]);

  const user = authApi.getCurrentUser();
  const isAdmin = user?.role === 'admin';

  // Data update on date change
  useEffect(() => {
    const labelSuffix = dateRange === "today" ? "Today" : "Total";

    setStats([
      { label: "Total Shipments", value: "0", change: "0%", trend: "up", icon: Package },
      { label: "In Transit", value: "0", change: "0%", trend: "up", icon: Truck },
      { label: "Delivered " + labelSuffix, value: "0", change: "0%", trend: "up", icon: CheckCircle },
      { label: "Pending Pickup", value: "0", change: "0%", trend: "up", icon: Clock },
    ]);
  }, [dateRange]);

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
            <h1 className="text-2xl font-bold">Welcome back, FastFare</h1>
            <p className="text-sm text-muted-foreground">Here's what's happening with your shipments today.</p>
          </div>
          <div className="flex gap-3">
            <Select value={dateRange} onValueChange={setDateRange}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select period" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="today">Today: Jan 27</SelectItem>
                <SelectItem value="7d">Last 7 Days</SelectItem>
                <SelectItem value="30d">Last 30 Days</SelectItem>
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

        {/* KYC Alert — show when GSTIN is missing or KYC is not verified */}
        {user && (!user.gstin || user.kyc?.status !== 'verified') && (
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

        {/* Quick Actions — at top for easy access */}
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

        {/* Getting Started Section (for new users — auto-hidden when all steps complete) */}
        {showOnboarding && (
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
          <DashboardSummary
            data={{
              ordersToday: 0,
              ordersYesterday: 0,
              revenueToday: 0,
              revenueYesterday: 0,
            }}
          />
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat, index) => (
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
                    <Badge variant={stat.trend === "up" ? "default" : "secondary"} className="gap-1">
                      {stat.trend === "up" ? (
                        <ArrowUpRight className="h-3 w-3" />
                      ) : (
                        <ArrowDownRight className="h-3 w-3" />
                      )}
                      {stat.change}
                    </Badge>
                  </div>
                  <div className="mt-3">
                    <p className="text-2xl font-bold">{stat.value}</p>
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
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Recent Shipments</CardTitle>
                  <CardDescription>Your latest shipment activity</CardDescription>
                </div>
                <Link to="/shipments">
                  <Button variant="ghost" size="sm">View all</Button>
                </Link>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentShipments.map((shipment) => (
                    <div
                      key={shipment.id}
                      className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-lg border hover:bg-muted/50 transition-colors gap-3 sm:gap-0"
                    >
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <Package className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium">{shipment.id}</p>
                          <p className="text-sm text-muted-foreground">
                            {shipment.origin} → {shipment.destination}
                          </p>
                        </div>
                      </div>
                      <div className="text-left sm:text-right pl-14 sm:pl-0">
                        <Badge
                          variant={
                            shipment.status === "Delivered" ? "default" :
                              shipment.status === "In Transit" ? "secondary" : "outline"
                          }
                        >
                          {shipment.status}
                        </Badge>
                        <p className="text-xs text-muted-foreground mt-1">{shipment.eta}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Real-Time Alerts */}
          <div className="space-y-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-base">Alerts</CardTitle>
                {alerts.length > 0 && (
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
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-green-500/10 border border-green-500/20">
                    <CheckCircle className="h-5 w-5 text-green-500 shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-green-700 dark:text-green-300">All clear!</p>
                      <p className="text-xs text-muted-foreground">No pending alerts at this time.</p>
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
                        className={`flex items-start gap-3 p-3 rounded-lg ${colors.bg} border ${colors.border}`}
                      >
                        <IconComponent className={`h-5 w-5 ${colors.text} shrink-0 mt-0.5`} />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium">{alert.title}</p>
                          <p className="text-xs text-muted-foreground">{alert.description}</p>
                        </div>
                        {alert.action && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-xs shrink-0"
                            onClick={() => navigate(alert.action.href)}
                          >
                            {alert.action.label}
                          </Button>
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
            <CardDescription>Your shipping metrics for January 2024</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div>
                <p className="text-sm text-muted-foreground mb-2">Delivery Success Rate</p>
                <div className="flex items-center gap-2">
                  <Progress value={96} className="flex-1" />
                  <span className="text-sm font-medium">96%</span>
                </div>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-2">On-Time Delivery</p>
                <div className="flex items-center gap-2">
                  <Progress value={89} className="flex-1" />
                  <span className="text-sm font-medium">89%</span>
                </div>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-2">RTO Rate</p>
                <div className="flex items-center gap-2">
                  <Progress value={4} className="flex-1" />
                  <span className="text-sm font-medium">4%</span>
                </div>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-2">Customer Rating</p>
                <div className="flex items-center gap-2">
                  <Progress value={92} className="flex-1" />
                  <span className="text-sm font-medium">4.6/5</span>
                </div>
              </div>
            </div>
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
