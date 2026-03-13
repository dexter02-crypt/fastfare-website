import { useLocation, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { authApi } from '@/lib/api';
import {
    LayoutDashboard, Package, Warehouse, Truck, Menu,
    Activity, MapPin, Navigation, Wallet, TrendingUp,
    BarChart2, Users, Settings, HelpCircle, Box,
    ArrowDownToLine, RotateCcw, Radio, FileBarChart, X, ChevronRight
} from 'lucide-react';

const MobileBottomNav = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const [moreOpen, setMoreOpen] = useState(false);

    const user = authApi.getCurrentUser();
    const isPartnerOrAdmin = user?.role === 'admin' || user?.role === 'shipment_partner';

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

    const moreNavGroups = isPartnerOrAdmin ? [
        {
            title: 'Operations',
            items: [
                { icon: Navigation, label: 'Fleet Tracking', path: '/fleet-tracking' },
                { icon: Radio, label: 'Fleet View', path: '/partner/fleet-view' },
                { icon: Activity, label: 'Activity', path: '/partner/activity' },
                { icon: MapPin, label: 'Track Shipment', path: '/track' },
            ]
        },
        {
            title: 'Finance',
            items: [
                { icon: Wallet, label: 'Billing', path: '/billing' },
                { icon: TrendingUp, label: 'Settlement', path: '/settlement' },
                { icon: BarChart2, label: 'My Reports', path: '/my-reports' },
            ]
        },
        {
            title: 'Warehouse',
            items: [
                { icon: Box, label: 'Inventory', path: '/wms/inventory' },
                { icon: ArrowDownToLine, label: 'Inbound', path: '/wms/inbound' },
                { icon: RotateCcw, label: 'Returns (RTD)', path: '/wms/rtd' },
                { icon: Radio, label: 'Live Tracking', path: '/wms/tracking' },
                { icon: FileBarChart, label: 'WMS Reports', path: '/wms/reports' },
            ]
        },
        {
            title: 'Account',
            items: [
                { icon: Users, label: 'Team', path: '/partner/team' },
                { icon: Settings, label: 'Settings', path: '/settings' },
                { icon: HelpCircle, label: 'Help Center', path: '/support' },
            ]
        },
    ] : [
        {
            title: 'Operations',
            items: [
                { icon: MapPin, label: 'Track Shipment', path: '/track' },
            ]
        },
        {
            title: 'Finance',
            items: [
                { icon: Wallet, label: 'Billing', path: '/billing' },
                { icon: TrendingUp, label: 'Settlement', path: '/settlement' },
                { icon: BarChart2, label: 'My Reports', path: '/my-reports' },
            ]
        },
        {
            title: 'Account',
            items: [
                { icon: Settings, label: 'Settings', path: '/settings' },
                { icon: HelpCircle, label: 'Help Center', path: '/support' },
            ]
        },
    ];

    const isActive = (path: string | null) => path && location.pathname === path;

    return (
        <>
            {/* Bottom Navigation Bar */}
            <nav className="
        lg:hidden
        fixed bottom-0 left-0 right-0
        z-[1000]
        h-[60px]
        bg-white
        border-t border-gray-200
        flex flex-row items-center justify-around
        shadow-[0_-2px_10px_rgba(0,0,0,0.08)]
        pb-[env(safe-area-inset-bottom)]
      ">
                {mainNavItems.map((item) => {
                    const Icon = item.icon;
                    const active = isActive(item.path);
                    return (
                        <button
                            key={item.label}
                            onClick={() => item.action ? item.action() : item.path && navigate(item.path)}
                            className={`
                flex flex-col items-center justify-center
                flex-1 h-full
                min-w-[44px]
                bg-transparent border-none
                transition-colors duration-150
                ${active ? 'text-blue-600' : 'text-gray-500'}
              `}
                            style={{ WebkitTapHighlightColor: 'transparent', touchAction: 'manipulation' }}
                        >
                            <Icon size={22} strokeWidth={active ? 2.2 : 1.8} />
                            <span className="text-[10px] mt-[2px] font-medium">{item.label}</span>
                        </button>
                    );
                })}
            </nav>

            {/* More Drawer Overlay */}
            {moreOpen && (
                <div
                    className="lg:hidden fixed inset-0 bg-black/50 z-[1001]"
                    onClick={() => setMoreOpen(false)}
                />
            )}

            {/* More Drawer Sheet */}
            <div className={`
        lg:hidden
        fixed bottom-0 left-0 right-0
        z-[1002]
        bg-white
        rounded-t-[16px]
        max-h-[80vh]
        overflow-y-auto
        transition-transform duration-[280ms] ease-[cubic-bezier(0.32,0.72,0,1)]
        pb-[env(safe-area-inset-bottom)]
        ${moreOpen ? 'translate-y-0' : 'translate-y-full'}
      `}>
                {/* Drag Handle */}
                <div className="w-9 h-1 bg-gray-300 rounded-full mx-auto mt-2.5 mb-1" />

                {/* Sheet Header */}
                <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
                    <span className="text-base font-semibold text-gray-900">Menu</span>
                    <button
                        onClick={() => setMoreOpen(false)}
                        className="w-[44px] h-[44px] flex items-center justify-center text-gray-500"
                        style={{ WebkitTapHighlightColor: 'transparent' }}
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Navigation Groups */}
                {moreNavGroups.map((group) => (
                    <div key={group.title}>
                        <p className="px-5 pt-3 pb-1 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
                            {group.title}
                        </p>
                        {group.items.map((item) => {
                            const Icon = item.icon;
                            return (
                                <button
                                    key={item.path}
                                    onClick={() => { navigate(item.path); setMoreOpen(false); }}
                                    className="
                    w-full flex items-center gap-3.5
                    px-5 py-3.5
                    min-h-[52px]
                    text-left text-[15px] font-medium text-gray-900
                    hover:bg-gray-50 active:bg-gray-100
                    border-none bg-transparent
                  "
                                    style={{ WebkitTapHighlightColor: 'transparent', touchAction: 'manipulation' }}
                                >
                                    <Icon size={20} className="text-gray-600 flex-shrink-0" />
                                    <span className="flex-1">{item.label}</span>
                                    <ChevronRight size={16} className="text-gray-400" />
                                </button>
                            );
                        })}
                    </div>
                ))}

                <div className="h-4" /> {/* bottom spacer */}
            </div>
        </>
    );
};

export default MobileBottomNav;
