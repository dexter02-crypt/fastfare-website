import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import { wmsApi } from '../../lib/api';
import { Loader2, TrendingUp, Package, Truck, Download } from 'lucide-react';

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4'];

const ReportsPage = () => {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try { setData(await wmsApi.getReportSummary()); } catch (err) { console.error(err); }
            setLoading(false);
        };
        fetchData();
    }, []);

    const handleExport = () => {
        if (!data) return;
        let csv = 'Report Type,Category,Value\n';
        data.inventoryByCategory?.forEach((i: any) => { csv += `Inventory,${i.name || 'Uncategorized'},${i.value || 0}\n`; });
        data.tripsByStatus?.forEach((t: any) => { csv += `Trips,${t.name},${t.value}\n`; });
        data.vehiclesByType?.forEach((v: any) => { csv += `Vehicles,${v.name},${v.value}\n`; });
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a'); a.href = url; a.download = 'wms-report.csv'; a.click();
    };

    return (
        <DashboardLayout>
            <div className="space-y-6 flex-1 h-full p-2">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold">WMS Reports</h1>
                        <p className="text-muted-foreground">Analytics and operational insights</p>
                    </div>
                    <button onClick={handleExport} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border font-medium hover:bg-muted transition-colors text-sm">
                        <Download className="h-4 w-4" /> Export CSV
                    </button>
                </div>

                {loading ? (
                    <div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
                ) : !data ? (
                    <div className="text-center py-16 text-muted-foreground">
                        <TrendingUp className="h-12 w-12 mx-auto mb-3 opacity-40" />
                        <p>No report data available</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Inventory by Category */}
                        <div className="rounded-xl border bg-card p-5">
                            <div className="flex items-center gap-2 mb-4">
                                <Package className="h-5 w-5 text-blue-600" />
                                <h3 className="font-semibold">Inventory by Category</h3>
                            </div>
                            {data.inventoryByCategory?.length > 0 ? (
                                <div className="space-y-3">
                                    {data.inventoryByCategory.map((item: any, i: number) => {
                                        const maxVal = Math.max(...data.inventoryByCategory.map((x: any) => x.value || 0));
                                        const pct = maxVal > 0 ? ((item.value || 0) / maxVal) * 100 : 0;
                                        return (
                                            <div key={i}>
                                                <div className="flex justify-between text-sm mb-1">
                                                    <span className="font-medium">{item.name || 'Uncategorized'}</span>
                                                    <span className="text-muted-foreground">₹{(item.value || 0).toLocaleString()} ({item.count} items)</span>
                                                </div>
                                                <div className="h-2 bg-muted rounded-full overflow-hidden">
                                                    <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: COLORS[i % COLORS.length] }} />
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : <p className="text-sm text-muted-foreground">No inventory data</p>}
                        </div>

                        {/* Trips by Status */}
                        <div className="rounded-xl border bg-card p-5">
                            <div className="flex items-center gap-2 mb-4">
                                <TrendingUp className="h-5 w-5 text-emerald-600" />
                                <h3 className="font-semibold">Trips by Status</h3>
                            </div>
                            {data.tripsByStatus?.length > 0 ? (
                                <div className="space-y-3">
                                    {data.tripsByStatus.map((item: any, i: number) => {
                                        const total = data.tripsByStatus.reduce((sum: number, x: any) => sum + (x.value || 0), 0);
                                        const pct = total > 0 ? ((item.value || 0) / total) * 100 : 0;
                                        return (
                                            <div key={i} className="flex items-center gap-3">
                                                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                                                <span className="text-sm flex-1">{item.name}</span>
                                                <span className="text-sm font-medium">{item.value}</span>
                                                <span className="text-xs text-muted-foreground w-12 text-right">{pct.toFixed(0)}%</span>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : <p className="text-sm text-muted-foreground">No trip data</p>}
                        </div>

                        {/* Vehicles by Type */}
                        <div className="rounded-xl border bg-card p-5">
                            <div className="flex items-center gap-2 mb-4">
                                <Truck className="h-5 w-5 text-purple-600" />
                                <h3 className="font-semibold">Vehicles by Type</h3>
                            </div>
                            {data.vehiclesByType?.length > 0 ? (
                                <div className="grid grid-cols-2 gap-3">
                                    {data.vehiclesByType.map((item: any, i: number) => (
                                        <div key={i} className="p-3 rounded-lg border" style={{ borderColor: COLORS[i % COLORS.length] + '40' }}>
                                            <p className="text-2xl font-bold">{item.value}</p>
                                            <p className="text-sm text-muted-foreground capitalize">{item.name}</p>
                                        </div>
                                    ))}
                                </div>
                            ) : <p className="text-sm text-muted-foreground">No vehicle data</p>}
                        </div>
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
};

export default ReportsPage;
