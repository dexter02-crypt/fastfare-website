import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert } from "@/components/ui/alert";
import {
  LayoutDashboard,
  Truck,
  MapPin,
  Wallet,
  BarChart3,
  Settings,
  HelpCircle,
  Search,
  Bell,
  Menu,
  X,
  ChevronRight,
  TrendingUp,
  CheckCircle,
  Package,
  RefreshCw,
  Plus,
  Calculator,
  MoreVertical,
  Shield,
  AlertCircle,

} from "lucide-react";
import { motion } from "framer-motion";
import logo from "@/assets/logo.png";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

const sidebarLinks = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/dashboard" },
  { icon: Truck, label: "Shipments", href: "/dashboard/shipments" },
  { icon: MapPin, label: "Tracking", href: "/dashboard/tracking" },
  { icon: Wallet, label: "Wallet", href: "/dashboard/wallet" },
  { icon: BarChart3, label: "Analytics", href: "/dashboard/analytics" },
];

const bottomLinks = [
  { icon: Settings, label: "Settings", href: "/dashboard/settings" },
  { icon: HelpCircle, label: "Help Center", href: "/dashboard/help" },
];

const stats = [
  {
    label: "Total Shipments",
    value: "0",
    sublabel: "No shipments yet",
    icon: Package,
    color: "bg-blue-50 text-primary",
  },
  {
    label: "In Transit",
    value: "0",
    sublabel: "No active deliveries",
    icon: Truck,
    color: "bg-orange-50 text-orange-600",
  },
  {
    label: "Delivered Today",
    value: "0",
    sublabel: "No deliveries today",
    icon: CheckCircle,
    color: "bg-green-50 text-success",
  },
  {
    label: "Wallet Balance",
    value: "₹0",
    sublabel: "Available credits",
    icon: Wallet,
    color: "bg-purple-50 text-purple-600",
  },
];

const shipments: { id: string; date: string; destination: string; customer: { name: string; initials: string }; amount: string; status: string; statusColor: string }[] = [];

const Dashboard = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showKycReminder, setShowKycReminder] = useState(false);
  const location = useLocation();
  const [userRole, setUserRole] = useState<string>("");

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    setUserRole(user.role || "");

    // Show KYC reminder if GSTIN is missing or KYC not verified
    if (!user.gstin || user.kyc?.status === 'pending') {
      setShowKycReminder(true);
    }
  }, []);

  const stats = [
    {
      label: "Total Shipments",
      value: "0",
      sublabel: "No shipments yet",
      icon: Package,
      color: "bg-blue-50 text-primary",
    },
    {
      label: "In Transit",
      value: "0",
      sublabel: "No active deliveries",
      icon: Truck,
      color: "bg-orange-50 text-orange-600",
    },
    {
      label: "Delivered Today",
      value: "0",
      sublabel: "No deliveries today",
      icon: CheckCircle,
      color: "bg-green-50 text-success",
    },
    {
      label: userRole === 'shipment_partner' ? "Account Funds" : "Wallet Balance",
      value: "₹0",
      sublabel: "Available credits",
      icon: Wallet,
      color: "bg-purple-50 text-purple-600",
    },
  ];

  const handleDismissKycReminder = () => {
    setShowKycReminder(false);
  };



  return (
    <div className="min-h-screen bg-muted/30 flex w-full">
      {/* Sidebar Overlay for Mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-foreground/20 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed lg:sticky top-0 left-0 z-50 h-screen w-64 bg-card border-r border-border flex flex-col transition-transform duration-300 ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
          }`}
      >
        {/* Logo */}
        <div className="p-4 border-b border-border flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <img src={logo} alt="FastFare" className="h-9 w-auto" />
          </Link>
          <button
            className="lg:hidden p-1"
            onClick={() => setSidebarOpen(false)}
          >
            <X size={20} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1">
          {sidebarLinks.map((link) => {
            const isActive = location.pathname === link.href;
            return (
              <Link
                key={link.label}
                to={link.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${isActive
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
              >
                <link.icon size={20} />
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* Bottom Links */}
        <div className="p-4 border-t border-border space-y-1">
          {bottomLinks.map((link) => (
            <Link
              key={link.label}
              to={link.href}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            >
              <link.icon size={20} />
              {link.label}
            </Link>
          ))}
        </div>

        {/* User */}
        <div className="p-4 border-t border-border">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              <AvatarFallback className="bg-primary/10 text-primary">AM</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">Alex Morgan</p>
              <p className="text-xs text-muted-foreground truncate">Logistics Manager</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <header className="sticky top-0 z-30 bg-card border-b border-border px-4 lg:px-6 py-3">
          <div className="flex items-center gap-4">
            <button
              className="lg:hidden p-2 -ml-2"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu size={24} />
            </button>

            {/* Search */}
            <div className="flex-1 max-w-md relative hidden sm:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
              <Input
                placeholder="Search by Order ID, Customer, or Destination..."
                className="pl-10 bg-muted/50"
              />
            </div>

            <div className="flex-1 sm:hidden" />

            {/* Actions */}
            <Button variant="ghost" size="icon" className="relative">
              <Bell size={20} />
              <span className="absolute top-1 right-1 w-2 h-2 bg-destructive rounded-full" />
            </Button>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 lg:p-6 overflow-auto">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            {/* Page Title */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
              <div>
                <h1 className="text-2xl font-bold">Dashboard Home</h1>
                <p className="text-muted-foreground">
                  Overview of your current logistics operations.
                </p>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                Last updated: Just now
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <RefreshCw size={16} />
                </Button>
              </div>
            </div>

            {/* KYC Reminder Banner */}
            {showKycReminder && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="mb-6"
              >
                <Alert className="bg-red-50 border-red-300 dark:bg-red-950/30 dark:border-red-800">
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
                        <strong className="text-red-800 dark:text-red-100">Complete KYC Verification</strong>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-red-600 hover:text-red-800 dark:text-red-400"
                        onClick={handleDismissKycReminder}
                      >
                        <X size={14} />
                      </Button>
                    </div>
                    <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                      Your GSTIN/KYC verification is incomplete. Complete it to unlock all features and start shipping.
                    </p>
                    <div className="mt-3 flex gap-2">
                      <Button
                        size="sm"
                        className="bg-red-600 hover:bg-red-700 text-white"
                        onClick={() => {
                          handleDismissKycReminder();
                        }}
                      >
                        <Link to="/dashboard/settings" className="flex items-center gap-1">
                          Complete KYC Now <ChevronRight size={14} />
                        </Link>
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-red-300 text-red-700 hover:bg-red-100 dark:border-red-700 dark:text-red-300 dark:hover:bg-red-950/30"
                        onClick={handleDismissKycReminder}
                      >
                        Remind Later
                      </Button>
                    </div>
                  </div>
                </Alert>
              </motion.div>
            )}

            {/* Stats Grid */}
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              {stats.map((stat) => (
                <div
                  key={stat.label}
                  className="bg-card rounded-xl p-5 border border-border shadow-card"
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
                  {stat.sublabel && (
                    <p className="text-sm text-muted-foreground">{stat.sublabel}</p>
                  )}
                </div>
              ))}
            </div>

            {/* Quick Actions */}
            <div className="mb-8">
              <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
              <div className="grid sm:grid-cols-3 gap-4">
                <Button className="h-auto py-4 gradient-primary text-primary-foreground hover:opacity-90 gap-2">
                  <Plus size={20} />
                  New Shipment
                </Button>
                <Button variant="outline" className="h-auto py-4 gap-2">
                  <Calculator size={20} />
                  Calculate Rates
                </Button>
                <Button variant="outline" className="h-auto py-4 gap-2">
                  <Search size={20} />
                  Track Order
                </Button>
              </div>
            </div>

            {/* Recent Shipments */}
            <div className="bg-card rounded-xl border border-border shadow-card">
              <div className="p-5 border-b border-border flex items-center justify-between">
                <h2 className="text-lg font-semibold">Recent Shipments</h2>
                <Link to="/shipments">
                  <Button variant="ghost" size="sm" className="text-primary gap-1">
                    View all <ChevronRight size={16} />
                  </Button>
                </Link>
              </div>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ORDER ID</TableHead>
                      <TableHead>DATE</TableHead>
                      <TableHead>DESTINATION</TableHead>
                      <TableHead>CUSTOMER</TableHead>
                      <TableHead>AMOUNT</TableHead>
                      <TableHead>STATUS</TableHead>
                      <TableHead className="w-12">ACTION</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {shipments.map((shipment) => (
                      <TableRow key={shipment.id}>
                        <TableCell className="font-medium text-primary">
                          {shipment.id}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {shipment.date}
                        </TableCell>
                        <TableCell>{shipment.destination}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Avatar className="h-8 w-8">
                              <AvatarFallback className="text-xs bg-muted">
                                {shipment.customer.initials}
                              </AvatarFallback>
                            </Avatar>
                            <span>{shipment.customer.name}</span>
                          </div>
                        </TableCell>
                        <TableCell className="font-medium">{shipment.amount}</TableCell>
                        <TableCell>
                          <Badge variant="secondary" className={shipment.statusColor}>
                            {shipment.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreVertical size={16} />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <div className="p-4 border-t border-border flex items-center justify-between text-sm text-muted-foreground">
                <span>Showing 4 of 142 shipments</span>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">Previous</Button>
                  <Button variant="outline" size="sm">Next</Button>
                </div>
              </div>
            </div>
          </motion.div>
        </main>
      </div>
    </div>
  );
};

export default Dashboard;
