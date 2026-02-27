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
} from "lucide-react";
import { useState } from "react";
import { useWallet } from "@/contexts/WalletContext";
import logo from "@/assets/logo.png";
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

const Header = ({ mobileMenuOpen: propMobileMenuOpen, onMobileMenuToggle }: HeaderProps = {}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [localMobileMenuOpen, setLocalMobileMenuOpen] = useState(false);
  const isAuthenticated = authApi.isAuthenticated();
  const user = authApi.getCurrentUser();
  const [searchQuery, setSearchQuery] = useState("");
  const { balance } = useWallet();

  // Unified mobile menu state: use prop if provided (authenticated layout), else local
  const mobileMenuOpen = onMobileMenuToggle ? (propMobileMenuOpen ?? false) : localMobileMenuOpen;
  const toggleMobileMenu = onMobileMenuToggle || (() => setLocalMobileMenuOpen(prev => !prev));
  const closeMobileMenu = () => {
    if (onMobileMenuToggle && propMobileMenuOpen) onMobileMenuToggle();
    setLocalMobileMenuOpen(false);
  };

  const navLinks = [
    { label: "Solutions", href: "#solutions", dropdown: true },
    { label: "Products", href: "#products", dropdown: true },
    { label: "Pricing", href: "/pricing" },
    { label: "Integrations", href: "#integrations" },
    { label: "Resources", href: "#resources", dropdown: true },
  ];

  const solutionsItems = [
    { label: "Courier Services", href: "/solutions/courier", icon: Truck },
    { label: "Warehousing", href: "/solutions/warehousing", icon: Grid },
    { label: "Returns Management", href: "/solutions/returns", icon: Package },
  ];

  const productsItems = [
    { label: "Bulk Shipping", href: "/products/bulk", icon: Package },
    { label: "Express Delivery", href: "/products/express", icon: Zap },
    { label: "International", href: "/products/international", icon: Truck },
  ];

  const resourcesItems = [
    { label: "Documentation", href: "/resources/docs", icon: FileText },
    { label: "API", href: "/resources/api", icon: Package },
    { label: "Support", href: "/support", icon: HelpCircle },
  ];

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

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between gap-4">
        <div className="flex items-center gap-2 shrink-0">
          {/* Mobile Menu Button - for authenticated dashboard sidebar */}
          {isAuthenticated && onMobileMenuToggle && (
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={toggleMobileMenu}
              title="Toggle Menu"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          )}
          {/* Back Button — hidden on dashboard (root page) */}
          {location.pathname !== "/" && location.pathname !== "/dashboard" && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(-1)}
              title="Go Back"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
          )}
          <Link to={isAuthenticated ? "/dashboard" : "/"} className="flex items-center gap-2">
            <img src={logo} alt="FastFare" className="h-8 w-auto" />
          </Link>
        </div>

        {isAuthenticated ? (
          /* Authenticated Header */
          <>
            {/* Search Bar - Center Left */}
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
              {/* Wallet Balance */}
              <div
                className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary/5 border border-primary/20 cursor-pointer hover:bg-primary/10 transition-colors"
                onClick={() => navigate('/billing/recharge')}
                title="Wallet Balance"
              >
                <Wallet className="h-4 w-4 text-primary" />
                <span className="text-sm font-semibold text-primary">₹{balance?.toLocaleString('en-IN') || '0'}</span>
              </div>
              {/* Track Order Link */}
              <div className="hidden md:flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground cursor-pointer transition-colors" onClick={() => navigate('/track')}>
                <MapPin className="h-4 w-4" />
                <span className="hidden lg:inline">Track Order</span>
              </div>

              {/* Help */}
              <div className="hidden md:flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground cursor-pointer" onClick={() => navigate('/support')}>
                <HelpCircle className="h-5 w-5" />
                <span className="hidden lg:inline">Need Help</span>
              </div>

              {/* All Products */}
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
                  <DropdownMenuItem onClick={() => navigate('/fleet-tracking')}>Fleet</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Notifications */}
              <Button variant="ghost" size="icon" className="relative" onClick={() => navigate('/notifications')}>
                <Bell className="h-5 w-5 text-muted-foreground" />
                <span className="absolute top-2 right-2 h-2 w-2 bg-red-500 rounded-full" />
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
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive">
                    <LogOut className="mr-2 h-4 w-4" /> Log out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </>
        ) : (
          /* Public Header */
          <>
            <nav className="hidden md:flex items-center gap-8">
              {navLinks.map((link) => (
                link.dropdown ? (
                  <DropdownMenu key={link.label}>
                    <DropdownMenuTrigger asChild>
                      <Link
                        to={link.href}
                        className="flex items-center gap-1 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
                      >
                        {link.label}
                        <ChevronDown className="h-3 w-3" />
                      </Link>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="w-56">
                      {link.label === "Solutions" && solutionsItems.map((item, idx) => (
                        <DropdownMenuItem key={idx} asChild>
                          <Link to={item.href} className="flex items-center gap-2 cursor-pointer">
                            <item.icon className="h-4 w-4" />
                            {item.label}
                          </Link>
                        </DropdownMenuItem>
                      ))}
                      {link.label === "Products" && productsItems.map((item, idx) => (
                        <DropdownMenuItem key={idx} asChild>
                          <Link to={item.href} className="flex items-center gap-2 cursor-pointer">
                            <item.icon className="h-4 w-4" />
                            {item.label}
                          </Link>
                        </DropdownMenuItem>
                      ))}
                      {link.label === "Resources" && resourcesItems.map((item, idx) => (
                        <DropdownMenuItem key={idx} asChild>
                          <Link to={item.href} className="flex items-center gap-2 cursor-pointer">
                            <item.icon className="h-4 w-4" />
                            {item.label}
                          </Link>
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                ) : (
                  <Link
                    key={link.label}
                    to={link.href}
                    className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {link.label}
                  </Link>
                )
              ))}
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
        {!isAuthenticated && (
          <button
            className="md:hidden p-2 ml-auto"
            onClick={toggleMobileMenu}
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        )}
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-border bg-background p-4">
          <nav className="flex flex-col gap-4">
            {isAuthenticated ? (
              <>
                <form onSubmit={handleSearch} className="relative w-full mb-4">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="search"
                    placeholder="Order ID"
                    className="w-full bg-muted/50 pl-9 h-9"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </form>
                <Link to="/dashboard" onClick={closeMobileMenu}>
                  <Button variant="ghost" className="w-full justify-start">
                    <LayoutDashboard className="mr-2 h-4 w-4" /> Dashboard
                  </Button>
                </Link>
                <Link to="/shipments" onClick={closeMobileMenu}>
                  <Button variant="ghost" className="w-full justify-start">
                    <Grid className="mr-2 h-4 w-4" /> Shipments
                  </Button>
                </Link>
                <Button variant="ghost" className="w-full justify-start" onClick={() => navigate('/billing/recharge')}>
                  <Wallet className="mr-2 h-4 w-4" /> Wallet: ₹{balance.toLocaleString()}
                </Button>
                <Button variant="ghost" className="w-full justify-start" onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4" /> Logout
                </Button>
              </>
            ) : (
              <>
                {navLinks.map((link) => (
                  <Link
                    key={link.label}
                    to={link.href}
                    className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
                    onClick={closeMobileMenu}
                  >
                    {link.label}
                  </Link>
                ))}
                <div className="flex flex-col gap-2 pt-4 border-t border-border">

                  <Link to="/login" onClick={closeMobileMenu}>
                    <Button variant="ghost" className="w-full">Log in</Button>
                  </Link>
                  <Link to="/register" onClick={closeMobileMenu}>
                    <Button className="w-full gradient-primary">Get Started Free</Button>
                  </Link>
                </div>
              </>
            )}
          </nav>
        </div>
      )}
    </header>
  );
};

export default Header;

