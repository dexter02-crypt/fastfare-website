import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import DashboardLayout from '../../components/DashboardLayout';
import { wmsApi } from '../../lib/api';
import { Truck, Users, Package, RotateCcw, TrendingUp, MapPin, ArrowUpRight, Loader2, AlertTriangle, Box } from 'lucide-react';

const WMSDashboard = () => {
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const data = await wmsApi.getStats();
                setStats(data);
            } catch (err) {
                console.error('Failed to fetch WMS stats:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, []);

    const statCards = [
        { label: 'Active Fleet', value: stats?.fleet?.active || 0, total: stats?.fleet?.total || 0, icon: Truck, color: 'from-blue-500 to-blue-600', href: '/wms/fleet' },
        { label: 'Active Trips', value: stats?.operations?.activeTrips || 0, icon: MapPin, color: 'from-emerald-500 to-emerald-600', href: '/wms/fleet?tab=trips' },
        { label: 'Low Stock Items', value: stats?.inventory?.lowStock || 0, icon: AlertTriangle, color: 'from-amber-500 to-amber-600', href: '/wms/inventory' },
        { label: 'Pending Returns', value: stats?.operations?.pendingReturns || 0, icon: RotateCcw, color: 'from-red-500 to-red-600', href: '/wms/rtd' },
    ];

    const quickActions = [
        { label: 'Fleet Management', desc: 'Manage vehicles & drivers', icon: Truck, href: '/wms/fleet', color: 'bg-blue-50 text-blue-700 border-blue-200' },
        { label: 'Inventory', desc: 'Stock & warehouse items', icon: Package, href: '/wms/inventory', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
        { label: 'Inbound Receiving', desc: 'Incoming shipments', icon: Box, href: '/wms/inbound', color: 'bg-purple-50 text-purple-700 border-purple-200' },
        { label: 'Returns (RTD)', desc: 'Return to depot', icon: RotateCcw, href: '/wms/rtd', color: 'bg-orange-50 text-orange-700 border-orange-200' },
        { label: 'Live Tracking', desc: 'Real-time fleet tracking', icon: MapPin, href: '/wms/tracking', color: 'bg-cyan-50 text-cyan-700 border-cyan-200' },
        { label: 'Reports', desc: 'Analytics & reports', icon: TrendingUp, href: '/wms/reports', color: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
    ];

    return (
        <DashboardLayout>
            <div className="space-y-8 flex-1 h-full p-2">
                <div>
                    <h1 className="text-2xl font-bold">Warehouse Management</h1>
                    <p className="text-muted-foreground">Manage your fleet, inventory, and warehouse operations</p>
                </div>

                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                ) : (
                    <>
                        {/* Stats Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            {statCards.map((card) => (
                                <Link key={card.label} to={card.href} className="group">
                                    <div className="relative overflow-hidden rounded-xl border bg-card p-5 shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="text-sm text-muted-foreground">{card.label}</p>
                                                <p className="text-3xl font-bold mt-1">{card.value}</p>
                                                {card.total !== undefined && (
                                                    <p className="text-xs text-muted-foreground mt-1">of {card.total} total</p>
                                                )}
                                            </div>
                                            <div className={`h-12 w-12 rounded-xl bg-gradient-to-br ${card.color} flex items-center justify-center`}>
                                                <card.icon className="h-6 w-6 text-white" />
                                            </div>
                                        </div>
                                        <ArrowUpRight className="absolute top-3 right-3 h-4 w-4 text-muted-foreground/40 group-hover:text-primary transition-colors" />
                                    </div>
                                </Link>
                            ))}
                        </div>

                        {/* Quick Actions */}
                        <div>
                            <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {quickActions.map((action) => (
                                    <Link key={action.label} to={action.href}>
                                        <div className={`flex items-center gap-4 p-4 rounded-xl border transition-all hover:shadow-md hover:-translate-y-0.5 ${action.color}`}>
                                            <div className="h-10 w-10 rounded-lg bg-white/80 flex items-center justify-center shadow-sm">
                                                <action.icon className="h-5 w-5" />
                                            </div>
                                            <div>
                                                <p className="font-medium">{action.label}</p>
                                                <p className="text-sm opacity-75">{action.desc}</p>
                                            </div>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        </div>
                    </>
                )}
            </div>
        </DashboardLayout>
    );
};

export default WMSDashboard;
