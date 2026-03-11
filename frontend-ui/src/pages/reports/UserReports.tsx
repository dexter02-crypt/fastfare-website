import { Component, useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Package, CheckCircle, Truck, IndianRupee, FileText,
    Download, AlertCircle, Loader2, RefreshCw, ChevronLeft,
    ChevronRight, Calendar, MapPin, TrendingUp, Clock
} from "lucide-react";
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import DashboardLayout from "@/components/DashboardLayout";
import {
    PieChart, Pie, Cell, LineChart, Line,
    XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from "recharts";
import { API_BASE_URL } from "@/config";

// ─── Error Boundary ───────────────────────────────────────────────────────────
class ErrorBoundary extends Component<{ children: React.ReactNode }, { hasError: boolean; error: string }> {
    constructor(props: any) {
        super(props);
        this.state = { hasError: false, error: "" };
    }
    static getDerivedStateFromError(error: Error) {
        return { hasError: true, error: error.message };
    }
    render() {
        if (this.state.hasError) {
            return (
                <DashboardLayout>
                    <div className="flex flex-col items-center justify-center h-64 gap-4">
                        <AlertCircle className="h-12 w-12 text-red-500" />
                        <h2 className="text-xl font-semibold">Something went wrong</h2>
                        <p className="text-muted-foreground text-sm">{this.state.error}</p>
                        <Button onClick={() => window.location.reload()}>
                            <RefreshCw className="h-4 w-4 mr-2" /> Reload Page
                        </Button>
                    </div>
                </DashboardLayout>
            );
        }
        return this.props.children;
    }
}

// ─── Types ────────────────────────────────────────────────────────────────────
interface Summary {
    totalShipments: number;
    delivered: number;
    inTransit: number;
    returned: number;
    totalSpend: number;
    avgDeliveryDays: number;
    successRate: number;
    avgCostPerShipment: number;
}

interface TrendPoint { date: string; count: number; }
interface StatusPoint { status: string; count: number; }
interface CarrierRow { carrier: string; totalShipments: number; delivered: number; avgDeliveryDays: number; successRate: number; }
interface ZoneRow { city: string; shipments: number; percentage: number; }
interface ShipmentRow { awb: string; date: string; origin: string; destination: string; carrier: string; status: string; weight: string; cost: number; }

// ─── Helpers ─────────────────────────────────────────────────────────────────
const DONUT_COLORS = ['#22c55e', '#3b82f6', '#f97316', '#eab308', '#a855f7', '#ef4444', '#64748b'];

const STATUS_BADGE_MAP: Record<string, JSX.Element> = {
    delivered: <Badge className="bg-green-100 text-green-800 border-green-200">Delivered</Badge>,
    in_transit: <Badge className="bg-blue-100 text-blue-800 border-blue-200">In Transit</Badge>,
    returned: <Badge className="bg-red-100 text-red-800 border-red-200">Returned</Badge>,
    cancelled: <Badge className="bg-gray-100 text-gray-700 border-gray-200">Cancelled</Badge>,
    pending: <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">Pending</Badge>,
    picked_up: <Badge className="bg-purple-100 text-purple-800 border-purple-200">Picked Up</Badge>,
    out_for_delivery: <Badge className="bg-orange-100 text-orange-800 border-orange-200">Out for Delivery</Badge>,
    pickup_scheduled: <Badge className="bg-cyan-100 text-cyan-800 border-cyan-200">Pickup Scheduled</Badge>,
    partner_assigned: <Badge className="bg-indigo-100 text-indigo-800 border-indigo-200">Partner Assigned</Badge>,
};

const getStatusBadge = (status: string) =>
    STATUS_BADGE_MAP[status] ?? <Badge variant="secondary">{status}</Badge>;

const getDateRange = (range: string): { from: string; to: string } => {
    const to = new Date();
    const from = new Date();
    if (range === "7days") from.setDate(from.getDate() - 7);
    else if (range === "90days") from.setDate(from.getDate() - 90);
    else if (range === "180days") from.setDate(from.getDate() - 180);
    else from.setDate(from.getDate() - 30); // default 30days
    return {
        from: from.toISOString().split("T")[0],
        to: to.toISOString().split("T")[0],
    };
};

const SkeletonCard = () => (
    <Card>
        <CardContent className="p-5">
            <div className="h-4 bg-gray-200 rounded animate-pulse mb-3 w-1/2" />
            <div className="h-8 bg-gray-200 rounded animate-pulse w-3/4" />
        </CardContent>
    </Card>
);

// ─── Main Component ───────────────────────────────────────────────────────────
const UserReportsInner = () => {
    const [dateRange, setDateRange] = useState("30days");
    const [isLoading, setIsLoading] = useState(true);
    const [fetchError, setFetchError] = useState<string | null>(null);

    const [summary, setSummary] = useState<Summary>({ totalShipments: 0, delivered: 0, inTransit: 0, returned: 0, totalSpend: 0, avgDeliveryDays: 0, successRate: 0, avgCostPerShipment: 0 });
    const [trend, setTrend] = useState<TrendPoint[]>([]);
    const [statusBreakdown, setStatusBreakdown] = useState<StatusPoint[]>([]);
    const [carrierPerf, setCarrierPerf] = useState<CarrierRow[]>([]);
    const [topZones, setTopZones] = useState<ZoneRow[]>([]);
    const [history, setHistory] = useState<ShipmentRow[]>([]);
    const [historyTotal, setHistoryTotal] = useState(0);
    const [historyPage, setHistoryPage] = useState(1);
    const [historyTotalPages, setHistoryTotalPages] = useState(0);

    const fetchAll = useCallback(async (page = 1) => {
        setIsLoading(true);
        setFetchError(null);
        const token = localStorage.getItem("token");
        const headers = { Authorization: `Bearer ${token}` };
        const { from, to } = getDateRange(dateRange);
        const qs = `from=${from}&to=${to}`;

        try {
            const [
                sumRes, trendRes, statusRes, carrierRes, zonesRes, histRes
            ] = await Promise.all([
                fetch(`${API_BASE_URL}/api/user/reports/summary?${qs}`, { headers }),
                fetch(`${API_BASE_URL}/api/user/reports/shipment-trend?${qs}`, { headers }),
                fetch(`${API_BASE_URL}/api/user/reports/status-breakdown?${qs}`, { headers }),
                fetch(`${API_BASE_URL}/api/user/reports/carrier-performance?${qs}`, { headers }),
                fetch(`${API_BASE_URL}/api/user/reports/top-zones?${qs}`, { headers }),
                fetch(`${API_BASE_URL}/api/user/reports/shipment-history?${qs}&page=${page}&limit=10`, { headers }),
            ]);

            // Parse & guard all responses
            const [sumData, trendData, statusData, carrierData, zonesData, histData] = await Promise.all([
                sumRes.json().catch(() => ({})),
                trendRes.json().catch(() => []),
                statusRes.json().catch(() => []),
                carrierRes.json().catch(() => []),
                zonesRes.json().catch(() => []),
                histRes.json().catch(() => ({ data: [], total: 0, page: 1, totalPages: 0 })),
            ]);

            setSummary({
                totalShipments: sumData?.totalShipments ?? 0,
                delivered: sumData?.delivered ?? 0,
                inTransit: sumData?.inTransit ?? 0,
                returned: sumData?.returned ?? 0,
                totalSpend: sumData?.totalSpend ?? 0,
                avgDeliveryDays: sumData?.avgDeliveryDays ?? 0,
                successRate: sumData?.successRate ?? 0,
                avgCostPerShipment: sumData?.avgCostPerShipment ?? 0,
            });
            setTrend(Array.isArray(trendData) ? trendData : []);
            setStatusBreakdown(Array.isArray(statusData) ? statusData : []);
            setCarrierPerf(Array.isArray(carrierData) ? carrierData : []);
            setTopZones(Array.isArray(zonesData) ? zonesData : []);
            setHistory(Array.isArray(histData?.data) ? histData.data : []);
            setHistoryTotal(histData?.total ?? 0);
            setHistoryPage(histData?.page ?? 1);
            setHistoryTotalPages(histData?.totalPages ?? 0);
        } catch (err: any) {
            setFetchError(err?.message || "Network error");
        } finally {
            setIsLoading(false);
        }
    }, [dateRange]);

    useEffect(() => {
        fetchAll(1);
    }, [fetchAll]);

    const handleExport = async () => {
        const token = localStorage.getItem("token");
        const { from, to } = getDateRange(dateRange);
        const res = await fetch(`${API_BASE_URL}/api/user/reports/export?from=${from}&to=${to}`, {
            headers: { Authorization: `Bearer ${token}` },
        });
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `fastfare_report_${from}_to_${to}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

    // ─── Error State ───────────────────────────────────────────────────────
    if (fetchError) {
        return (
            <DashboardLayout>
                <div className="flex flex-col items-center justify-center h-[50vh] gap-4">
                    <AlertCircle className="h-12 w-12 text-red-500" />
                    <div className="text-center">
                        <h3 className="font-semibold text-lg">Unable to load reports</h3>
                        <p className="text-muted-foreground text-sm mt-1">Please try again.</p>
                    </div>
                    <Button onClick={() => fetchAll(1)}>
                        <RefreshCw className="h-4 w-4 mr-2" /> Retry
                    </Button>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            <div className="space-y-8">

                {/* ─── Header ──────────────────────────────────────── */}
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold flex items-center gap-2">
                            <FileText className="h-6 w-6 text-primary" />
                            My Reports
                        </h1>
                        <p className="text-muted-foreground text-sm mt-1">Analytics and insights for your shipments</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <Select value={dateRange} onValueChange={(v) => { setDateRange(v); setHistoryPage(1); }}>
                            <SelectTrigger className="w-[170px]">
                                <Calendar className="h-4 w-4 mr-2" />
                                <SelectValue placeholder="Date Range" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="7days">Last 7 Days</SelectItem>
                                <SelectItem value="30days">Last 30 Days</SelectItem>
                                <SelectItem value="90days">Last 3 Months</SelectItem>
                                <SelectItem value="180days">Last 6 Months</SelectItem>
                            </SelectContent>
                        </Select>
                        <Button onClick={handleExport} variant="outline">
                            <Download className="h-4 w-4 mr-2" /> Export Report
                        </Button>
                    </div>
                </div>

                {/* ─── A. Summary Stats ─────────────────────────────── */}
                {isLoading ? (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {[1, 2, 3, 4].map(i => <SkeletonCard key={i} />)}
                    </div>
                ) : (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <Card className="border-l-4 border-l-blue-500">
                            <CardContent className="p-5">
                                <div className="flex items-center gap-2 mb-2">
                                    <Package className="h-5 w-5 text-blue-500" />
                                    <span className="text-sm font-medium text-muted-foreground">Total Shipments</span>
                                </div>
                                <p className="text-3xl font-bold">{summary.totalShipments ?? 0}</p>
                                <p className="text-xs text-muted-foreground mt-1">In selected period</p>
                            </CardContent>
                        </Card>
                        <Card className="border-l-4 border-l-green-500">
                            <CardContent className="p-5">
                                <div className="flex items-center gap-2 mb-2">
                                    <CheckCircle className="h-5 w-5 text-green-500" />
                                    <span className="text-sm font-medium text-muted-foreground">Delivered</span>
                                </div>
                                <p className="text-3xl font-bold">{summary.delivered ?? 0}</p>
                                <p className="text-xs text-muted-foreground mt-1">{summary.successRate ?? 0}% success rate</p>
                            </CardContent>
                        </Card>
                        <Card className="border-l-4 border-l-blue-400">
                            <CardContent className="p-5">
                                <div className="flex items-center gap-2 mb-2">
                                    <Truck className="h-5 w-5 text-blue-400" />
                                    <span className="text-sm font-medium text-muted-foreground">In Transit</span>
                                </div>
                                <p className="text-3xl font-bold">{summary.inTransit ?? 0}</p>
                                <p className="text-xs text-muted-foreground mt-1">Currently active</p>
                            </CardContent>
                        </Card>
                        <Card className="border-l-4 border-l-purple-500">
                            <CardContent className="p-5">
                                <div className="flex items-center gap-2 mb-2">
                                    <IndianRupee className="h-5 w-5 text-purple-500" />
                                    <span className="text-sm font-medium text-muted-foreground">Total Spend</span>
                                </div>
                                <p className="text-3xl font-bold">₹{(summary.totalSpend ?? 0).toLocaleString()}</p>
                                <p className="text-xs text-muted-foreground mt-1">Avg ₹{(summary.avgCostPerShipment ?? 0).toLocaleString()} per shipment</p>
                            </CardContent>
                        </Card>
                    </div>
                )}

                {/* ─── B+C. Charts Row ──────────────────────────────── */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                    {/* C. Shipment Trend Line Chart */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base flex items-center gap-2">
                                <TrendingUp className="h-4 w-4 text-blue-500" />
                                Shipment Volume Over Time
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {isLoading ? (
                                <div className="h-56 flex items-center justify-center">
                                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                                </div>
                            ) : (Array.isArray(trend) && trend.length > 0) ? (
                                <ResponsiveContainer width="100%" height={220}>
                                    <LineChart data={trend}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                                        <YAxis allowDecimals={false} />
                                        <Tooltip />
                                        <Line type="monotone" dataKey="count" stroke="#3b82f6" strokeWidth={2} dot={false} name="Shipments" />
                                    </LineChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="h-56 flex flex-col items-center justify-center text-muted-foreground gap-2">
                                    <Package className="h-10 w-10 opacity-20" />
                                    <p className="text-sm">No data for selected period</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* D. Status Breakdown Donut Chart */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base flex items-center gap-2">
                                <Clock className="h-4 w-4 text-orange-500" />
                                Status Breakdown
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {isLoading ? (
                                <div className="h-56 flex items-center justify-center">
                                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                                </div>
                            ) : (Array.isArray(statusBreakdown) && statusBreakdown.length > 0) ? (
                                <ResponsiveContainer width="100%" height={220}>
                                    <PieChart>
                                        <Pie
                                            data={statusBreakdown}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={55}
                                            outerRadius={90}
                                            paddingAngle={2}
                                            dataKey="count"
                                            nameKey="status"
                                        >
                                            {statusBreakdown.map((_, i) => (
                                                <Cell key={i} fill={DONUT_COLORS[i % DONUT_COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip formatter={(v, n) => [v, n]} />
                                        <Legend />
                                    </PieChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="h-56 flex flex-col items-center justify-center text-muted-foreground gap-2">
                                    <Package className="h-10 w-10 opacity-20" />
                                    <p className="text-sm">No data for selected period</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* ─── E. Carrier Performance Table ────────────────── */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base flex items-center gap-2">
                            <Truck className="h-4 w-4 text-blue-500" />
                            Carrier-wise Performance
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {isLoading ? (
                            <div className="space-y-2">
                                {[1, 2].map(i => <div key={i} className="h-10 bg-gray-100 rounded animate-pulse" />)}
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b">
                                            <th className="text-left py-3 px-4 font-medium text-muted-foreground">Carrier Name</th>
                                            <th className="text-center py-3 px-4 font-medium text-muted-foreground">Total</th>
                                            <th className="text-center py-3 px-4 font-medium text-muted-foreground">Delivered</th>
                                            <th className="text-center py-3 px-4 font-medium text-muted-foreground">Avg Days</th>
                                            <th className="text-left py-3 px-4 font-medium text-muted-foreground">Success Rate</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {(Array.isArray(carrierPerf) && carrierPerf.length > 0) ? carrierPerf.map((row, i) => (
                                            <tr key={i} className="border-b hover:bg-muted/40">
                                                <td className="py-3 px-4 font-medium">{row.carrier}</td>
                                                <td className="py-3 px-4 text-center">{row.totalShipments ?? 0}</td>
                                                <td className="py-3 px-4 text-center">{row.delivered ?? 0}</td>
                                                <td className="py-3 px-4 text-center">{row.avgDeliveryDays ?? 0}</td>
                                                <td className="py-3 px-4">
                                                    <div className="flex items-center gap-2">
                                                        <div className="flex-1 h-2 rounded-full bg-gray-200 overflow-hidden">
                                                            <div
                                                                className={`h-2 rounded-full ${(row.successRate ?? 0) >= 80 ? 'bg-green-500' : (row.successRate ?? 0) >= 60 ? 'bg-yellow-500' : 'bg-red-500'}`}
                                                                style={{ width: `${Math.min(100, row.successRate ?? 0)}%` }}
                                                            />
                                                        </div>
                                                        <span className="text-xs font-medium w-10 text-right">{row.successRate ?? 0}%</span>
                                                    </div>
                                                </td>
                                            </tr>
                                        )) : (
                                            <tr>
                                                <td colSpan={5} className="py-8 text-center text-muted-foreground text-sm">No carrier data available</td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* ─── F. Top Delivery Zones ────────────────────────── */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-rose-500" />
                            Top Delivery Zones
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {isLoading ? (
                            <div className="space-y-2">
                                {[1, 2, 3].map(i => <div key={i} className="h-10 bg-gray-100 rounded animate-pulse" />)}
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b">
                                            <th className="text-left py-3 px-4 font-medium text-muted-foreground">Rank</th>
                                            <th className="text-left py-3 px-4 font-medium text-muted-foreground">City</th>
                                            <th className="text-center py-3 px-4 font-medium text-muted-foreground">Shipments</th>
                                            <th className="text-center py-3 px-4 font-medium text-muted-foreground">Share %</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {(Array.isArray(topZones) && topZones.length > 0) ? topZones.map((z, i) => (
                                            <tr key={i} className="border-b hover:bg-muted/40">
                                                <td className="py-3 px-4">
                                                    <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${i === 0 ? 'bg-yellow-100 text-yellow-700' : i === 1 ? 'bg-gray-100 text-gray-700' : i === 2 ? 'bg-orange-100 text-orange-700' : 'bg-muted text-muted-foreground'}`}>
                                                        {i + 1}
                                                    </span>
                                                </td>
                                                <td className="py-3 px-4 font-medium">{z.city}</td>
                                                <td className="py-3 px-4 text-center">{z.shipments ?? 0}</td>
                                                <td className="py-3 px-4 text-center">{z.percentage ?? 0}%</td>
                                            </tr>
                                        )) : (
                                            <tr>
                                                <td colSpan={4} className="py-8 text-center text-muted-foreground text-sm">No zone data available</td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* ─── G. Shipment History + Pagination ─────────────── */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between flex-wrap gap-2">
                        <CardTitle className="text-base flex items-center gap-2">
                            <Package className="h-4 w-4 text-indigo-500" />
                            Shipment History
                            {!isLoading && <span className="text-muted-foreground font-normal text-sm ml-1">({historyTotal ?? 0} total)</span>}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {isLoading ? (
                            <div className="space-y-2">
                                {[1, 2, 3, 4, 5].map(i => <div key={i} className="h-12 bg-gray-100 rounded animate-pulse" />)}
                            </div>
                        ) : (
                            <>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr className="border-b">
                                                <th className="text-left py-3 px-4 font-medium text-muted-foreground">AWB</th>
                                                <th className="text-left py-3 px-4 font-medium text-muted-foreground">Date</th>
                                                <th className="text-left py-3 px-4 font-medium text-muted-foreground">Route</th>
                                                <th className="text-left py-3 px-4 font-medium text-muted-foreground">Carrier</th>
                                                <th className="text-left py-3 px-4 font-medium text-muted-foreground">Status</th>
                                                <th className="text-center py-3 px-4 font-medium text-muted-foreground">Weight</th>
                                                <th className="text-right py-3 px-4 font-medium text-muted-foreground">Cost</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {(Array.isArray(history) && history.length > 0) ? history.map((row, i) => (
                                                <tr key={i} className="border-b hover:bg-muted/40">
                                                    <td className="py-3 px-4 font-mono text-xs">{row.awb}</td>
                                                    <td className="py-3 px-4 text-muted-foreground">{row.date}</td>
                                                    <td className="py-3 px-4">
                                                        <span className="flex items-center gap-1 text-xs">
                                                            <span className="font-medium">{row.origin}</span>
                                                            <span className="text-muted-foreground">→</span>
                                                            <span className="font-medium">{row.destination}</span>
                                                        </span>
                                                    </td>
                                                    <td className="py-3 px-4 text-xs">{row.carrier}</td>
                                                    <td className="py-3 px-4">{getStatusBadge(row.status)}</td>
                                                    <td className="py-3 px-4 text-center text-xs">{row.weight}</td>
                                                    <td className="py-3 px-4 text-right font-medium">₹{(row.cost ?? 0).toLocaleString()}</td>
                                                </tr>
                                            )) : (
                                                <tr>
                                                    <td colSpan={7} className="py-10 text-center text-muted-foreground text-sm">No shipments found for selected period</td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>

                                {/* Pagination */}
                                {historyTotalPages > 1 && (
                                    <div className="flex items-center justify-between pt-4 mt-2 border-t">
                                        <p className="text-sm text-muted-foreground">
                                            Page {historyPage} of {historyTotalPages}
                                        </p>
                                        <div className="flex items-center gap-2">
                                            <Button
                                                variant="outline" size="sm"
                                                disabled={historyPage <= 1}
                                                onClick={() => {
                                                    const newPage = historyPage - 1;
                                                    setHistoryPage(newPage);
                                                    fetchAll(newPage);
                                                }}
                                            >
                                                <ChevronLeft className="h-4 w-4" /> Prev
                                            </Button>
                                            {Array.from({ length: Math.min(5, historyTotalPages) }, (_, i) => {
                                                const page = i + 1;
                                                return (
                                                    <Button
                                                        key={page}
                                                        variant={page === historyPage ? "default" : "outline"}
                                                        size="sm"
                                                        className="w-9"
                                                        onClick={() => { setHistoryPage(page); fetchAll(page); }}
                                                    >
                                                        {page}
                                                    </Button>
                                                );
                                            })}
                                            <Button
                                                variant="outline" size="sm"
                                                disabled={historyPage >= historyTotalPages}
                                                onClick={() => {
                                                    const newPage = historyPage + 1;
                                                    setHistoryPage(newPage);
                                                    fetchAll(newPage);
                                                }}
                                            >
                                                Next <ChevronRight className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                )}
                            </>
                        )}
                    </CardContent>
                </Card>

            </div>
        </DashboardLayout>
    );
};

// ─── Exported component wrapped in ErrorBoundary ──────────────────────────────
const UserReports = () => (
    <ErrorBoundary>
        <UserReportsInner />
    </ErrorBoundary>
);

export default UserReports;
