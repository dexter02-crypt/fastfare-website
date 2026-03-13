import { useLocation, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { authApi } from '@/lib/api';
import {
    LayoutDashboard, Package, Warehouse, Truck, Menu,
    Activity, MapPin, Navigation, Wallet, TrendingUp,
    BarChart2, Users, Settings, HelpCircle, Box,
    ArrowDownToLine, RotateCcw, Radio, FileBarChart, X, ChevronRight, LogOut
} from 'lucide-react';

const MobileBottomNav = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const [moreOpen, setMoreOpen] = useState(false);

    const user = authApi.getCurrentUser();
    const isPartner = user?.role === 'shipment_partner';
    const isAdmin = user?.role === 'admin';
    const isPartnerOrAdmin = isAdmin || isPartner;

    const mainNavItems = isPartnerOrAdmin ? [
        { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
        { icon: Package, label: 'Orders', path: '/partner/orders' },
        { icon: Warehouse, label: 'WMS', path: '/wms' },
        { icon: Truck, label: 'Fleet', path: '/fleet' },
        { icon: Menu, label: 'More', path: null, action: () => setMoreOpen(true) },
    ] : [
        { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
        { icon: Package, label: 'Shipments', path: '/shipments' },
        { icon: MapPin, label: 'Track', path: '/track' },
        { icon: Wallet, label: 'Billing', path: '/billing' },
        { icon: Menu, label: 'More', path: null, action: () => setMoreOpen(true) },
    ];

    // Build More menu groups based on role
    const buildMoreNavGroups = () => {
        const groups: { title: string; items: { icon: any; label: string; path: string }[] }[] = [];

        // Operations group — different per role
        if (isAdmin) {
            groups.push({
                title: 'Operations',
                items: [
                    { icon: Navigation, label: 'Fleet Tracking', path: '/fleet-tracking' },
                    { icon: Radio, label: 'Fleet View', path: '/partner/fleet-view' },
                    { icon: Activity, label: 'Activity', path: '/partner/activity' },
                    { icon: MapPin, label: 'Track Shipment', path: '/track' },
                ]
            });
        } else if (isPartner) {
            groups.push({
                title: 'Operations',
                items: [
                    { icon: Navigation, label: 'Fleet Tracking', path: '/fleet-tracking' },
                    { icon: Radio, label: 'Fleet View', path: '/partner/fleet-view' },
                    { icon: Activity, label: 'Activity', path: '/partner/activity' },
                    { icon: MapPin, label: 'Track Shipment', path: '/track' },
                ]
            });
        } else {
            // User role
            groups.push({
                title: 'Operations',
                items: [
                    { icon: MapPin, label: 'Track Shipment', path: '/track' },
                ]
            });
        }

        // Finance group — same for all
        groups.push({
            title: 'Finance',
            items: [
                { icon: Wallet, label: 'Billing', path: '/billing' },
                { icon: TrendingUp, label: 'Settlement', path: '/settlement' },
                { icon: BarChart2, label: 'My Reports', path: '/my-reports' },
            ]
        });

        // Warehouse group — only for Partner and Admin
        if (isPartnerOrAdmin) {
            groups.push({
                title: 'Warehouse',
                items: [
                    { icon: Box, label: 'Inventory', path: '/wms/inventory' },
                    { icon: ArrowDownToLine, label: 'Inbound', path: '/wms/inbound' },
                    { icon: RotateCcw, label: 'Returns (RTD)', path: '/wms/rtd' },
                    { icon: Radio, label: 'Live Tracking', path: '/wms/tracking' },
                    { icon: FileBarChart, label: 'WMS Reports', path: '/wms/reports' },
                ]
            });
        }

        // Account group — same for all, but Team only for Partner/Admin
        const accountItems: { icon: any; label: string; path: string }[] = [];
        if (isPartnerOrAdmin) {
            accountItems.push({ icon: Users, label: 'Team', path: '/partner/team' });
        }
        accountItems.push({ icon: Settings, label: 'Settings', path: '/settings' });
        accountItems.push({ icon: HelpCircle, label: 'Help Center', path: '/support' });
        groups.push({ title: 'Account', items: accountItems });

        return groups;
    };

    const moreNavGroups = buildMoreNavGroups();

    const isActive = (path: string | null) => path && location.pathname === path;

    const handleLogout = () => {
        setMoreOpen(false);
        authApi.logout();
        navigate('/login');
    };

    // Hardcoded icon style to guarantee 20x20 and prevent any blowup
    const drawerIconStyle: React.CSSProperties = {
        width: 20,
        height: 20,
        minWidth: 20,
        minHeight: 20,
        maxWidth: 20,
        maxHeight: 20,
        flexShrink: 0,
    };

    return (
        <>
            {/* Bottom Navigation Bar */}
            <nav
                className="lg:hidden fixed bottom-0 left-0 right-0 z-[1000] bg-white border-t border-gray-200 shadow-[0_-2px_10px_rgba(0,0,0,0.08)]"
                style={{
                    height: 60,
                    display: 'flex',
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-around',
                    paddingBottom: 'env(safe-area-inset-bottom)',
                    width: '100%',
                }}
            >
                {mainNavItems.map((item) => {
                    const Icon = item.icon;
                    const active = isActive(item.path);
                    return (
                        <button
                            key={item.label}
                            onClick={() => item.action ? item.action() : item.path && navigate(item.path)}
                            style={{
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center',
                                flex: 1,
                                height: '100%',
                                minWidth: 44,
                                background: 'transparent',
                                border: 'none',
                                color: active ? '#2563eb' : '#6b7280',
                                WebkitTapHighlightColor: 'transparent',
                                touchAction: 'manipulation',
                                cursor: 'pointer',
                                padding: 0,
                            }}
                        >
                            <Icon style={{ width: 22, height: 22 }} strokeWidth={active ? 2.2 : 1.8} />
                            <span style={{ fontSize: 10, marginTop: 2, fontWeight: 500 }}>{item.label}</span>
                        </button>
                    );
                })}
            </nav>

            {/* More Drawer Overlay — covers full screen */}
            {moreOpen && (
                <div
                    onClick={() => setMoreOpen(false)}
                    style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        width: '100vw',
                        height: '100vh',
                        backgroundColor: 'rgba(0,0,0,0.5)',
                        zIndex: 1001,
                    }}
                    className="lg:hidden"
                />
            )}

            {/* More Drawer Sheet — true full-width bottom sheet */}
            <div
                className="lg:hidden"
                style={{
                    position: 'fixed',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    width: '100%',
                    maxWidth: '100vw',
                    maxHeight: '85vh',
                    overflowY: 'auto',
                    overflowX: 'hidden',
                    backgroundColor: '#ffffff',
                    borderTopLeftRadius: 16,
                    borderTopRightRadius: 16,
                    borderBottomLeftRadius: 0,
                    borderBottomRightRadius: 0,
                    zIndex: 1002,
                    transform: moreOpen ? 'translateY(0)' : 'translateY(100%)',
                    transition: 'transform 280ms cubic-bezier(0.32, 0.72, 0, 1)',
                    paddingBottom: 'env(safe-area-inset-bottom)',
                    boxShadow: '0 -4px 20px rgba(0,0,0,0.15)',
                }}
            >
                {/* Drag Handle */}
                <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 10, paddingBottom: 4 }}>
                    <div style={{ width: 36, height: 5, backgroundColor: '#d1d5db', borderRadius: 999 }} />
                </div>

                {/* Sheet Header */}
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    paddingLeft: 20,
                    paddingRight: 8,
                    paddingTop: 8,
                    paddingBottom: 8,
                    borderBottom: '1px solid #f3f4f6',
                }}>
                    <span style={{ fontSize: 16, fontWeight: 600, color: '#111827' }}>Menu</span>
                    <button
                        onClick={() => setMoreOpen(false)}
                        style={{
                            width: 44,
                            height: 44,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            background: 'transparent',
                            border: 'none',
                            color: '#6b7280',
                            cursor: 'pointer',
                            WebkitTapHighlightColor: 'transparent',
                        }}
                    >
                        <X style={{ width: 20, height: 20 }} />
                    </button>
                </div>

                {/* Navigation Groups */}
                {moreNavGroups.map((group) => (
                    <div key={group.title}>
                        <p style={{
                            paddingLeft: 20,
                            paddingRight: 20,
                            paddingTop: 12,
                            paddingBottom: 4,
                            fontSize: 11,
                            fontWeight: 600,
                            color: '#9ca3af',
                            textTransform: 'uppercase',
                            letterSpacing: '0.05em',
                            margin: 0,
                        }}>
                            {group.title}
                        </p>
                        {group.items.map((item) => {
                            const Icon = item.icon;
                            return (
                                <button
                                    key={item.path + item.label}
                                    onClick={() => { navigate(item.path); setMoreOpen(false); }}
                                    style={{
                                        width: '100%',
                                        display: 'flex',
                                        flexDirection: 'row',
                                        alignItems: 'center',
                                        gap: 14,
                                        paddingLeft: 20,
                                        paddingRight: 20,
                                        paddingTop: 14,
                                        paddingBottom: 14,
                                        minHeight: 52,
                                        textAlign: 'left',
                                        fontSize: 15,
                                        fontWeight: 500,
                                        color: '#111827',
                                        backgroundColor: 'transparent',
                                        border: 'none',
                                        cursor: 'pointer',
                                        WebkitTapHighlightColor: 'transparent',
                                        touchAction: 'manipulation',
                                    }}
                                >
                                    <Icon style={drawerIconStyle} className="text-gray-600" />
                                    <span style={{ flex: 1, color: '#111827', fontSize: 15, fontWeight: 500 }}>{item.label}</span>
                                    <ChevronRight style={{ width: 16, height: 16, color: '#9ca3af', flexShrink: 0 }} />
                                </button>
                            );
                        })}
                    </div>
                ))}

                {/* Logout */}
                <div style={{ padding: '12px 20px 20px 20px', borderTop: '1px solid #f3f4f6', marginTop: 8 }}>
                    <button
                        onClick={handleLogout}
                        style={{
                            width: '100%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: 8,
                            padding: '14px 0',
                            backgroundColor: '#fef2f2',
                            color: '#dc2626',
                            border: 'none',
                            borderRadius: 12,
                            fontSize: 15,
                            fontWeight: 600,
                            cursor: 'pointer',
                        }}
                    >
                        <LogOut style={{ width: 18, height: 18 }} />
                        Log out
                    </button>
                </div>
            </div>
        </>
    );
};

export default MobileBottomNav;
