import { Link, useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Menu,
  X,
  LayoutDashboard,
  LogOut,
  Search,
  Wallet,
  MapPin,
  HelpCircle,
  Grid,
  Bell,
  User,
  ChevronDown,
  ArrowLeft,
  Package,
  Zap,
  FileText,
  Truck,
  Settings,
  Globe,
  BarChart3,
  Users,
  CreditCard,
  Code,
  BookOpen,
  MessageSquare,
  History,
  ShoppingCart,
  Building2,
} from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { useWallet } from "@/contexts/WalletContext";
import Logo from "@/components/Logo";
import { authApi } from "@/lib/api";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface HeaderProps {
  mobileMenuOpen?: boolean;
  onMobileMenuToggle?: () => void;
}

// ── Dropdown item data with descriptions ──
const solutionsItems = [
  { label: "E-commerce Shipping", desc: "Seamless delivery for online stores", href: "/solutions/ecommerce", icon: ShoppingCart },
  { label: "B2B Logistics", desc: "Enterprise supply chain solutions", href: "/solutions/b2b", icon: Building2 },
  { label: "Hyperlocal Delivery", desc: "Same-day intra-city deliveries", href: "/solutions/hyperlocal", icon: Zap },
  { label: "Fulfillment & Warehousing", desc: "End-to-end order fulfillment", href: "/solutions/fulfillment", icon: Package },
  { label: "Cross-border Shipping", desc: "International logistics made simple", href: "/solutions/international", icon: Globe },
];

const productsItems = [
  { label: "Shipment Dashboard", desc: "Track and manage all shipments", href: "/products/dashboard", icon: LayoutDashboard },
  { label: "Fleet Tracking", desc: "Real-time vehicle monitoring", href: "/products/fleet", icon: Truck },
  { label: "Partner Network", desc: "Connect with logistics partners", href: "/products/partners", icon: Users },
  { label: "Analytics Suite", desc: "Data-driven logistics insights", href: "/products/analytics", icon: BarChart3 },
  { label: "API Platform", desc: "Developer-friendly shipping APIs", href: "/products/api", icon: Code },
  { label: "Wallet & Payments", desc: "Manage billing and settlements", href: "/products/wallet", icon: CreditCard },
];

const resourcesItems = [
  { label: "Documentation", desc: "Guides and technical docs", href: "/documentation", icon: FileText },
  { label: "Help Center", desc: "Find answers to common questions", href: "/help-center", icon: HelpCircle },
  { label: "API Reference", desc: "Complete API documentation", href: "/api-reference", icon: Code },
  { label: "Logistics Guide", desc: "Industry insights and best practices", href: "/logistics-guide", icon: BookOpen },
  { label: "Community", desc: "Join the FastFare community", href: "/community", icon: MessageSquare },
  { label: "Changelog", desc: "Latest updates and releases", href: "/changelog", icon: History },
];

const Header = ({ mobileMenuOpen: propMobileMenuOpen, onMobileMenuToggle }: HeaderProps = {}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [localMobileMenuOpen, setLocalMobileMenuOpen] = useState(false);
  const isAuthenticated = authApi.isAuthenticated();
  const user = authApi.getCurrentUser();
  const hasUnreadNotifications = false;
  const isHomepage = location.pathname === '/';
  const [searchQuery, setSearchQuery] = useState("");
  const { balance } = useWallet();

  // Click-toggle dropdown state
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpenDropdown(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Close dropdown on route change
  useEffect(() => {
    setOpenDropdown(null);
  }, [location.pathname]);

  const toggleDropdown = (label: string) => {
    setOpenDropdown(prev => prev === label ? null : label);
  };

  // Unified mobile menu state
  const mobileMenuOpen = onMobileMenuToggle ? (propMobileMenuOpen ?? false) : localMobileMenuOpen;
  const toggleMobileMenu = onMobileMenuToggle || (() => setLocalMobileMenuOpen(prev => !prev));
  const closeMobileMenu = () => {
    if (onMobileMenuToggle && propMobileMenuOpen) onMobileMenuToggle();
    setLocalMobileMenuOpen(false);
  };

  const handleLogout = () => {
    authApi.logout();
    navigate("/login");
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${searchQuery}`);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  // Render a single dropdown panel
  const renderDropdownItems = (items: typeof solutionsItems) => (
    <div
      className="absolute top-full left-0 w-72 pt-2 z-50"
      style={{ animation: 'fadeIn 0.15s ease-out' }}
    >
      <div className="bg-popover text-popover-foreground rounded-lg shadow-lg border border-border p-2">
        {items.map((item, idx) => (
          <Link
            key={idx}
            to={item.href}
            onClick={() => setOpenDropdown(null)}
            className="flex items-start gap-3 px-3 py-2.5 rounded-md hover:bg-accent hover:text-accent-foreground cursor-pointer transition-colors group"
          >
            <item.icon className="h-4 w-4 mt-0.5 text-muted-foreground group-hover:text-foreground flex-shrink-0" />
            <div>
              <p className="text-sm font-medium leading-tight">{item.label}</p>
              <p className="text-xs text-muted-foreground mt-0.5 leading-snug">{item.desc}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-4px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
      <div className="flex h-16 w-full items-center justify-between gap-4" style={{ paddingLeft: 0, paddingRight: '1rem' }}>
        <div className="flex items-center gap-2 shrink-0" style={{ paddingLeft: '16px' }}>
          {/* Back Button */}
          {location.pathname !== "/" && location.pathname !== "/dashboard" && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(-1)}
              title="Go Back"
              className="mr-2 h-8 w-8 rounded-md shrink-0 flex items-center justify-center p-0"
              style={{ marginLeft: 0, position: 'static' }}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
          )}

          {/* Mobile Menu Button */}
          {isAuthenticated && onMobileMenuToggle && (
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden shrink-0"
              onClick={toggleMobileMenu}
              title="Toggle Menu"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          )}

          {/* Logo container - Hidden on desktop, visible on mobile */}
          <div className="flex items-center lg:hidden pl-2">
            <Link to="/dashboard" className="flex items-center gap-2">
              <Logo size="sm" variant="full" />
            </Link>
          </div>
        </div>

        {isAuthenticated && !isHomepage ? (
          /* ══════ Authenticated Header ══════ */
          <>
            {/* Search Bar */}
            <div className="flex-1 max-w-md hidden md:flex">
              <form onSubmit={handleSearch} className="relative w-full">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Order ID"
                  className="w-full bg-muted/50 pl-9 h-9"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </form>
            </div>

            {/* Right Actions */}
            <div className="flex items-center gap-3 md:gap-4 shrink-0">
              {/* Wallet Balance — hidden for partners */}
              {user?.role !== 'shipment_partner' && (
                <div
                  className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary/5 border border-primary/20 cursor-pointer hover:bg-primary/10 transition-colors"
                  onClick={() => navigate('/billing/recharge')}
                  title="Wallet Balance"
                >
                  <Wallet className="h-4 w-4 text-primary" />
                  <span className="text-sm font-semibold text-primary">₹{balance?.toLocaleString('en-IN') || '0'}</span>
                </div>
              )}
              {/* Track Order */}
              <div className="hidden md:flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground cursor-pointer transition-colors" onClick={() => navigate('/track')}>
                <MapPin className="h-4 w-4" />
                <span className="hidden lg:inline">Track Order</span>
              </div>

              {/* Help */}
              <div className="hidden md:flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground cursor-pointer" onClick={() => navigate('/support')}>
                <HelpCircle className="h-5 w-5" />
                <span className="hidden lg:inline">Need Help</span>
              </div>

              {/* Apps — hidden for partners */}
              {user?.role !== 'shipment_partner' && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="hidden md:flex">
                      <Grid className="h-5 w-5 text-muted-foreground" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>All Products</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => navigate('/shipments')}>Shipments</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate('/analytics')}>Analytics</DropdownMenuItem>
                    {user?.role !== 'user' && (
                      <DropdownMenuItem onClick={() => navigate('/fleet-tracking')}>Fleet</DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}

              {/* Notifications */}
              <Button variant="ghost" size="icon" className="relative" onClick={() => navigate('/notifications')}>
                <Bell className="h-5 w-5 text-muted-foreground" />
                {hasUnreadNotifications && (
                  <span className="absolute top-2 right-2 h-2 w-2 bg-red-500 rounded-full" />
                )}
              </Button>

              {/* User Profile */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <div className="flex items-center gap-2 cursor-pointer">
                    <div className={`rounded-full p-[2px] ${user?.role === 'shipment_partner'
                      ? user?.tier === 'gold'
                        ? 'bg-gradient-to-br from-yellow-400 via-yellow-500 to-yellow-600 shadow-[0_0_8px_rgba(234,179,8,0.4)]'
                        : user?.tier === 'silver'
                          ? 'bg-gradient-to-br from-slate-300 via-slate-400 to-slate-500 shadow-[0_0_8px_rgba(148,163,184,0.4)]'
                          : 'bg-gradient-to-br from-amber-600 via-amber-700 to-amber-800 shadow-[0_0_8px_rgba(180,83,9,0.3)]'
                      : ''
                      }`}>
                      <Avatar className={`h-9 w-9 border-2 border-background`}>
                        <AvatarImage src="" />
                        <AvatarFallback className="bg-primary/10 text-primary">
                          {getInitials(user?.businessName || "U")}
                        </AvatarFallback>
                      </Avatar>
                    </div>
                    <ChevronDown className="h-4 w-4 text-muted-foreground hidden md:block" />
                  </div>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">{user?.businessName || "User"}</p>
                      <p className="text-xs leading-none text-muted-foreground">{user?.email}</p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => navigate('/profile')}>
                    <User className="mr-2 h-4 w-4" /> Profile
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('/dashboard')}>
                    <LayoutDashboard className="mr-2 h-4 w-4" /> Dashboard
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('/settings')}>
                    <Settings className="mr-2 h-4 w-4" /> Settings
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive">
                    <LogOut className="mr-2 h-4 w-4" /> Log out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </>
        ) : (
          /* ══════ Public Header ══════ */
          <>
            <nav className="hidden md:flex items-center gap-8" ref={dropdownRef}>
              {/* Solutions — click toggle */}
              <div className="relative">
                <button
                  onClick={() => toggleDropdown("Solutions")}
                  className="flex items-center gap-1 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground py-4 bg-transparent border-0 cursor-pointer"
                >
                  Solutions
                  <ChevronDown className={`h-3 w-3 transition-transform duration-200 ${openDropdown === "Solutions" ? "rotate-180" : ""}`} />
                </button>
                {openDropdown === "Solutions" && renderDropdownItems(solutionsItems)}
              </div>

              {/* Products — click toggle */}
              <div className="relative">
                <button
                  onClick={() => toggleDropdown("Products")}
                  className="flex items-center gap-1 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground py-4 bg-transparent border-0 cursor-pointer"
                >
                  Products
                  <ChevronDown className={`h-3 w-3 transition-transform duration-200 ${openDropdown === "Products" ? "rotate-180" : ""}`} />
                </button>
                {openDropdown === "Products" && renderDropdownItems(productsItems)}
              </div>

              {/* Integrations — direct link */}
              <Link
                to="/integrations"
                className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                Integrations
              </Link>

              {/* Resources — click toggle */}
              <div className="relative">
                <button
                  onClick={() => toggleDropdown("Resources")}
                  className="flex items-center gap-1 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground py-4 bg-transparent border-0 cursor-pointer"
                >
                  Resources
                  <ChevronDown className={`h-3 w-3 transition-transform duration-200 ${openDropdown === "Resources" ? "rotate-180" : ""}`} />
                </button>
                {openDropdown === "Resources" && renderDropdownItems(resourcesItems)}
              </div>
            </nav>

            <div className="hidden md:flex items-center gap-4">
              <Link to="/track">
                <Button variant="ghost" size="sm" className="gap-1">
                  <Package className="h-4 w-4" />
                  Track Orders
                </Button>
              </Link>

              <Link to="/login">
                <Button variant="ghost" size="sm">
                  Log in
                </Button>
              </Link>
              <Link to="/register">
                <Button size="sm" className="gradient-primary text-primary-foreground hover:opacity-90">
                  Get Started Free
                </Button>
              </Link>
            </div>
          </>
        )}

        {/* Mobile Menu Toggle - public pages */}
        {(!isAuthenticated || isHomepage) && (
          <button
            className="md:hidden p-2 ml-auto"
            onClick={toggleMobileMenu}
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        )}
      </div>

      {/* Mobile Menu — rendered via Portal */}
      {mobileMenuOpen && createPortal(
        <>
          {/* Backdrop */}
          <div
            onClick={closeMobileMenu}
            style={{
              position: 'fixed',
              top: 0, left: 0, right: 0, bottom: 0,
              zIndex: 99998,
              backgroundColor: 'rgba(0,0,0,0.5)',
            }}
          />
          {/* Menu panel */}
          <div
            style={{
              position: 'fixed',
              top: 0, left: 0, right: 0, bottom: 0,
              zIndex: 99999,
              backgroundColor: '#ffffff',
              overflowY: 'auto',
              WebkitOverflowScrolling: 'touch',
            }}
          >
            {/* Header — logo + close */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '0 20px',
              height: '56px',
              borderBottom: '1px solid #e5e7eb',
              flexShrink: 0,
            }}>
              <Link to="/" onClick={closeMobileMenu} style={{ display: 'flex', alignItems: 'center' }}>
                <Logo size="lg" variant="full" />
              </Link>
              <button
                onClick={closeMobileMenu}
                aria-label="Close menu"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '44px',
                  height: '44px',
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                }}
              >
                <X size={22} color="#374151" />
              </button>
            </div>

            {/* Flat navigation links */}
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {[
                { label: 'Home', href: '/' },
                { label: 'Track Shipment', href: '/track' },
                { label: 'Integrations', href: '/integrations' },
                // Solutions
                { label: 'E-commerce Shipping', href: '/solutions/ecommerce' },
                { label: 'B2B Logistics', href: '/solutions/b2b' },
                { label: 'Hyperlocal Delivery', href: '/solutions/hyperlocal' },
                { label: 'Fulfillment & Warehousing', href: '/solutions/fulfillment' },
                { label: 'Cross-border Shipping', href: '/solutions/international' },
                // Products
                { label: 'Shipment Dashboard', href: '/products/dashboard' },
                { label: 'Fleet Tracking', href: '/products/fleet' },
                { label: 'API Platform', href: '/products/api' },
                // Resources
                { label: 'Documentation', href: '/documentation' },
                { label: 'API Reference', href: '/api-reference' },
                { label: 'Help Center', href: '/help-center' },
                { label: 'Community', href: '/community' },
              ].map((item) => (
                <Link
                  key={item.href + item.label}
                  to={item.href}
                  onClick={closeMobileMenu}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    padding: '0 24px',
                    minHeight: '52px',
                    fontSize: '16px',
                    fontWeight: 500,
                    color: '#111827',
                    textDecoration: 'none',
                    borderBottom: '1px solid #f3f4f6',
                    backgroundColor: '#ffffff',
                    WebkitTapHighlightColor: 'transparent',
                    touchAction: 'manipulation',
                    boxSizing: 'border-box' as const,
                    width: '100%',
                  }}
                >
                  {item.label}
                </Link>
              ))}
            </div>

            {/* CTA Buttons */}
            <div style={{
              padding: '20px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
              borderTop: '1px solid #e5e7eb',
            }}>
              <Link
                to="/login"
                onClick={closeMobileMenu}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  height: '52px',
                  border: '2px solid #2563eb',
                  borderRadius: '10px',
                  color: '#2563eb',
                  fontWeight: 600,
                  fontSize: '15px',
                  textDecoration: 'none',
                  backgroundColor: '#ffffff',
                  boxSizing: 'border-box' as const,
                }}
              >
                Sign In
              </Link>
              <Link
                to="/register"
                onClick={closeMobileMenu}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  height: '52px',
                  backgroundColor: '#2563eb',
                  borderRadius: '10px',
                  color: '#ffffff',
                  fontWeight: 700,
                  fontSize: '15px',
                  textDecoration: 'none',
                  border: 'none',
                  boxSizing: 'border-box' as const,
                }}
              >
                Get Started Free
              </Link>
            </div>
          </div>
        </>,
        document.body
      )}
    </header>
  );
};

export default Header;
