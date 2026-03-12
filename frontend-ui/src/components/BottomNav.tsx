import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import {
    LayoutDashboard,
    Package,
    Warehouse,
    Truck,
    Menu,
    X,
    ChevronRight,
    MapPin,
    BarChart3,
    Wallet,
    Crown,
    FileBarChart2,
    Users,
    Settings,
    HelpCircle,
    Box,
    RotateCcw,
    Radio
} from "lucide-react";
import { authApi } from "@/lib/api";

const BottomNav = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const user = authApi.getCurrentUser();
    const [drawerOpen, setDrawerOpen] = useState(false);

    if (!user) return null;

    const isActive = (href: string) => {
        const currentPath = location.pathname;
        const exactMatchOnly = ["/dashboard", "/wms"];
        if (exactMatchOnly.includes(href)) {
            return currentPath === href;
        }
        if (currentPath === href) return true;
        if (currentPath.startsWith(href + "/")) return true;
        return false;
    };

    // Define the primary bottom 5 icons
    const bottomNavItems = [
        { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
        { label: "Orders", href: "/partner/orders", icon: Package },
        { label: "WMS", href: "/wms", icon: Warehouse },
        { label: "Fleet", href: "/fleet", icon: Truck },
    ];

    // Filter based on user role (similar to dashboard sidebar)
    const renderBottomItems = () => {
        // Just show the first 4 safe items here for simplicity that apply to both partners and users
        let items = [
            { label: "Home", href: "/dashboard", icon: LayoutDashboard },
            { label: "Ship", href: "/shipments", icon: Package },
            { label: "Wallet", href: "/billing", icon: Wallet },
            { label: "Track", href: "/track", icon: MapPin },
        ];

        if (user?.role === 'shipment_partner' || user?.role === 'admin') {
            items = [
                { label: "Home", href: "/dashboard", icon: LayoutDashboard },
                { label: "Orders", href: "/partner/orders", icon: Package },
                { label: "WMS", href: "/wms", icon: Warehouse },
                { label: "Fleet", href: "/partner/fleet-view", icon: Radio },
            ];
        }

        return items;
    };

    // The rest goes in the drawer
    const drawerItems = [
        { label: "Fleet Tracking", href: "/fleet-tracking", icon: MapPin, roles: ['admin', 'shipment_partner'] },
        { label: "Activity", href: "/partner/activity", icon: BarChart3, roles: ['admin', 'shipment_partner'] },
        { label: "Wallet", href: "/billing", icon: Wallet, roles: ['all'] },
        { label: "Settlement", href: "/settlement", icon: Crown, roles: ['admin', 'shipment_partner'] },
        { label: "Reports", href: "/reports", icon: FileBarChart2, roles: ['admin'] },
        { label: "My Reports", href: "/my-reports", icon: FileBarChart2, roles: ['shipment_partner', 'user'] },
        { label: "Team", href: "/partner/team", icon: Users, roles: ['admin', 'shipment_partner'] },
        { label: "Inventory", href: "/wms/inventory", icon: Box, roles: ['admin', 'shipment_partner'] },
        { label: "Inbound", href: "/wms/inbound", icon: Box, roles: ['admin', 'shipment_partner'] },
        { label: "RTD Returns", href: "/wms/rtd", icon: RotateCcw, roles: ['admin', 'shipment_partner'] },
        { label: "Settings", href: "/settings", icon: Settings, roles: ['all'] },
        { label: "Support", href: "/support", icon: HelpCircle, roles: ['all'] },
    ];

    const activeBottomItems = renderBottomItems();

    const renderDrawerItems = () => {
        return drawerItems.filter(item => {
            if (item.roles.includes('all')) return true;
            return item.roles.includes(user?.role || '');
        });
    };

    const handleNavigate = (href: string) => {
        setDrawerOpen(false);
        navigate(href);
    };

    return (
        <>
            {/* The Bottom Bar itself */}
            <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 h-[60px] bg-background border-t border-border flex items-center justify-around px-2 pb-[env(safe-area-inset-bottom)]">
                {activeBottomItems.map((item) => {
                    const active = isActive(item.href);
                    return (
                        <Link
                            key={item.href}
                            to={item.href}
                            className={cn(
                                "flex flex-col items-center justify-center w-full h-full gap-1",
                                active ? "text-primary" : "text-muted-foreground hover:text-foreground"
                            )}
                        >
                            <item.icon className={cn("h-5 w-5", active ? "fill-primary/20" : "")} />
                            <span className="text-[10px] font-medium">{item.label}</span>
                        </Link>
                    );
                })}

                <button
                    onClick={() => setDrawerOpen(true)}
                    className={cn(
                        "flex flex-col items-center justify-center w-full h-full gap-1 text-muted-foreground hover:text-foreground"
                    )}
                >
                    <Menu className="h-5 w-5" />
                    <span className="text-[10px] font-medium">Menu</span>
                </button>
            </div>

            {/* The Mobile Drawer */}
            {drawerOpen && (
                <div className="lg:hidden fixed inset-0 z-[100] bg-black/50 overflow-hidden" onClick={() => setDrawerOpen(false)}>
                    <div
                        className="absolute bottom-0 left-0 right-0 bg-background rounded-t-2xl max-h-[90vh] overflow-y-auto pb-[calc(env(safe-area-inset-bottom)+20px)] shadow-xl transform transition-transform"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Drag handler pill */}
                        <div className="flex justify-center pt-3 pb-2 sticky top-0 bg-background z-10 w-full">
                            <div className="w-12 h-1.5 bg-muted-foreground/20 rounded-full" />
                        </div>

                        <div className="flex items-center justify-between px-4 pb-2 sticky top-[28px] bg-background z-10 border-b border-border">
                            <h2 className="text-lg font-semibold">Menu</h2>
                            <button onClick={() => setDrawerOpen(false)} className="p-2 -mr-2 text-muted-foreground rounded-full hover:bg-muted">
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <div className="px-2 py-2">
                            {renderDrawerItems().map((item) => {
                                const active = isActive(item.href);
                                return (
                                    <button
                                        key={item.label}
                                        onClick={() => handleNavigate(item.href)}
                                        className={cn(
                                            "flex items-center justify-between w-full p-4 rounded-xl mb-1 transition-colors",
                                            active ? "bg-primary/10 text-primary" : "hover:bg-muted text-foreground"
                                        )}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className={cn("p-2 rounded-lg", active ? "bg-primary/20" : "bg-muted")}>
                                                <item.icon className={cn("h-5 w-5", active ? "text-primary" : "text-muted-foreground")} />
                                            </div>
                                            <span className="font-medium">{item.label}</span>
                                        </div>
                                        <ChevronRight className="h-4 w-4 text-muted-foreground/50" />
                                    </button>
                                );
                            })}
                        </div>

                        <div className="px-4 py-4 mt-2 border-t border-border">
                            <button
                                onClick={() => { authApi.logout(); navigate('/login'); }}
                                className="w-full py-3.5 bg-destructive/10 text-destructive font-medium rounded-xl hover:bg-destructive/20 transition-colors"
                            >
                                Log out
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default BottomNav;
