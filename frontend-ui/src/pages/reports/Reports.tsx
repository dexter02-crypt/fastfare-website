import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
    Truck, Users, CheckCircle, Clock, XCircle, Download,
    Search, FileText, FileSpreadsheet, TrendingUp, Calendar,
    ChevronLeft, ChevronRight, Loader2, Filter
} from "lucide-react";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import DashboardLayout from "@/components/DashboardLayout";
import {
    reportsApi,
    KPIData,
    AnalyticsData,
    TruckTableData,
    DriverTableData,
    PaginationInfo
} from "@/lib/reportsApi";
import {
    PieChart, Pie, Cell, BarChart, Bar, LineChart, Line,
    XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from "recharts";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const COLORS = ['#22c55e', '#f59e0b', '#ef4444', '#3b82f6'];

const Reports = () => {
    // Filters
    const [dateRange, setDateRange] = useState("30days");
    const [truckStatusFilter, setTruckStatusFilter] = useState("all");
    const [driverStatusFilter, setDriverStatusFilter] = useState("all");
    
    // Loading states
    const [loading, setLoading] = useState(true);
    const [exporting, setExporting] = useState<string | null>(null);
    
    // Data states
    const [kpis, setKpis] = useState<KPIData | null>(null);
    const [trucksAnalytics, setTrucksAnalytics] = useState<AnalyticsData | null>(null);
    const [driversAnalytics, setDriversAnalytics] = useState<AnalyticsData | null>(null);
    
    // Table states
    const [trucksData, setTrucksData] = useState<TruckTableData[]>([]);
    const [trucksPagination, setTrucksPagination] = useState<PaginationInfo>({ total: 0, page: 1, limit: 5, pages: 1 });
    const [trucksSearch, setTrucksSearch] = useState("");
    
    const [driversData, setDriversData] = useState<DriverTableData[]>([]);
    const [driversPagination, setDriversPagination] = useState<PaginationInfo>({ total: 0, page: 1, limit: 5, pages: 1 });
    const [driversSearch, setDriversSearch] = useState("");

    // Fetch all data
    useEffect(() => {
        fetchAllData();
    }, [dateRange]);

    useEffect(() => {
        fetchTrucksTable();
    }, [truckStatusFilter, trucksPagination.page, trucksSearch]);

    useEffect(() => {
        fetchDriversTable();
    }, [driverStatusFilter, driversPagination.page, driversSearch]);

    const fetchAllData = async () => {
        setLoading(true);
        try {
            const [kpiRes, trucksRes, driversRes] = await Promise.all([
                reportsApi.getKPIs({ dateRange }),
                reportsApi.getTrucksAnalytics({ dateRange }),
                reportsApi.getDriversAnalytics({ dateRange })
            ]);
            setKpis(kpiRes.kpis);
            setTrucksAnalytics(trucksRes);
            setDriversAnalytics(driversRes);
        } catch (error) {
            console.error("Error fetching reports data:", error);
        } finally {
            setLoading(false);
        }
    };

    const fetchTrucksTable = async () => {
        try {
            const res = await reportsApi.getTrucksTable({
                page: trucksPagination.page,
                limit: 5,
                status: truckStatusFilter,
                search: trucksSearch
            });
            setTrucksData(res.trucks);
            setTrucksPagination(res.pagination);
        } catch (error) {
            console.error("Error fetching trucks table:", error);
        }
    };

    const fetchDriversTable = async () => {
        try {
            const res = await reportsApi.getDriversTable({
                page: driversPagination.page,
                limit: 5,
                status: driverStatusFilter,
                search: driversSearch
            });
            setDriversData(res.drivers);
            setDriversPagination(res.pagination);
        } catch (error) {
            console.error("Error fetching drivers table:", error);
        }
    };

    // Export functions
    const exportToCSV = (data: any[], filename: string) => {
        const headers = Object.keys(data[0] || {});
        const csvContent = [
            headers.join(","),
            ...data.map(row => headers.map(h => `"${row[h] || ''}"`).join(","))
        ].join("\n");
        
        const blob = new Blob([csvContent], { type: "text/csv" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${filename}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const exportToExcel = (data: any[], filename: string) => {
        const ws = XLSX.utils.json_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Report");
        XLSX.writeFile(wb, `${filename}.xlsx`);
    };

    const exportToPDF = (data: any[], filename: string, title: string) => {
        const doc = new jsPDF();
        doc.setFontSize(18);
        doc.text(title, 14, 22);
        doc.setFontSize(10);
        doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 30);
        
        const headers = Object.keys(data[0] || {});
        const rows = data.map(row => headers.map(h => row[h] || ''));
        
        autoTable(doc, {
            head: [headers],
            body: rows,
            startY: 35,
            styles: { fontSize: 8 },
            headStyles: { fillColor: [59, 130, 246] }
        });
        
        doc.save(`${filename}.pdf`);
    };

    const handleExport = async (type: 'trucks' | 'drivers', format: 'csv' | 'excel' | 'pdf') => {
        setExporting(`${type}-${format}`);
        try {
            const res = type === 'trucks' 
                ? await reportsApi.exportTrucks(truckStatusFilter)
                : await reportsApi.exportDrivers(driverStatusFilter);
            
            const filename = `${type}_report_${new Date().toISOString().split('T')[0]}`;
            const title = type === 'trucks' ? 'Trucks Report' : 'Drivers Report';
            
            switch (format) {
                case 'csv':
                    exportToCSV(res.data, filename);
                    break;
                case 'excel':
                    exportToExcel(res.data, filename);
                    break;
                case 'pdf':
                    exportToPDF(res.data, filename, title);
                    break;
            }
        } catch (error) {
            console.error(`Error exporting ${type}:`, error);
        } finally {
            setExporting(null);
        }
    };

    const getStatusBadge = (status: string) => {
        const capitalizedStatus = status.charAt(0).toUpperCase() + status.slice(1);
        switch (status) {
            case 'approved':
            case 'active':
                return <Badge className="bg-green-100 text-green-700">{capitalizedStatus}</Badge>;
            case 'pending':
                return <Badge className="bg-yellow-100 text-yellow-700">{capitalizedStatus}</Badge>;
            case 'rejected':
            case 'inactive':
                return <Badge className="bg-red-100 text-red-700">{capitalizedStatus}</Badge>;
            default:
                return <Badge variant="secondary">{capitalizedStatus}</Badge>;
        }
    };

    if (loading) {
        return (
            <DashboardLayout>
                <div className="flex items-center justify-center h-96">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <span className="ml-2 text-muted-foreground">Loading reports...</span>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            <div className="space-y-6">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold">Reports & Analytics</h1>
                        <p className="text-muted-foreground">Overview of fleet and driver performance</p>
                    </div>
                    
                    {/* Global Filters */}
                    <div className="flex flex-wrap gap-2">
                        <Select value={dateRange} onValueChange={setDateRange}>
                            <SelectTrigger className="w-[150px]">
                                <Calendar className="h-4 w-4 mr-2" />
                                <SelectValue placeholder="Date Range" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="today">Today</SelectItem>
                                <SelectItem value="7days">Last 7 Days</SelectItem>
                                <SelectItem value="30days">Last 30 Days</SelectItem>
                                <SelectItem value="90days">Last 90 Days</SelectItem>
                                <SelectItem value="all">All Time</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                {/* KPI Cards */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                    <Card>
                        <CardContent className="pt-4">
                            <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
                                <Truck className="h-4 w-4" />
                                Total Trucks
                            </div>
                            <p className="text-2xl font-bold">{kpis?.totalTrucks || 0}</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="pt-4">
                            <div className="flex items-center gap-2 text-green-600 text-xs mb-1">
                                <CheckCircle className="h-4 w-4" />
                                Active Trucks
                            </div>
                            <p className="text-2xl font-bold text-green-600">{kpis?.activeTrucks || 0}</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="pt-4">
                            <div className="flex items-center gap-2 text-yellow-600 text-xs mb-1">
                                <Clock className="h-4 w-4" />
                                Pending
                            </div>
                            <p className="text-2xl font-bold text-yellow-600">{kpis?.pendingTrucks || 0}</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="pt-4">
                            <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
                                <Users className="h-4 w-4" />
                                Total Drivers
                            </div>
                            <p className="text-2xl font-bold">{kpis?.totalDrivers || 0}</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="pt-4">
                            <div className="flex items-center gap-2 text-green-600 text-xs mb-1">
                                <CheckCircle className="h-4 w-4" />
                                Active Drivers
                            </div>
                            <p className="text-2xl font-bold text-green-600">{kpis?.activeDrivers || 0}</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="pt-4">
                            <div className="flex items-center gap-2 text-blue-600 text-xs mb-1">
                                <TrendingUp className="h-4 w-4" />
                                Added (Period)
                            </div>
                            <p className="text-2xl font-bold text-blue-600">{(kpis?.trucksInPeriod || 0) + (kpis?.driversInPeriod || 0)}</p>
                        </CardContent>
                    </Card>
                </div>

                <Separator />

                {/* Trucks Analytics Section */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-semibold flex items-center gap-2">
                            <Truck className="h-5 w-5" /> Trucks Analytics
                        </h2>
                        <div className="flex gap-2">
                            <Button 
                                variant="outline" 
                                size="sm" 
                                onClick={() => handleExport('trucks', 'csv')}
                                disabled={!!exporting}
                            >
                                {exporting === 'trucks-csv' ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <FileText className="h-4 w-4 mr-1" />}
                                CSV
                            </Button>
                            <Button 
                                variant="outline" 
                                size="sm" 
                                onClick={() => handleExport('trucks', 'excel')}
                                disabled={!!exporting}
                            >
                                {exporting === 'trucks-excel' ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <FileSpreadsheet className="h-4 w-4 mr-1" />}
                                Excel
                            </Button>
                            <Button 
                                variant="outline" 
                                size="sm" 
                                onClick={() => handleExport('trucks', 'pdf')}
                                disabled={!!exporting}
                            >
                                {exporting === 'trucks-pdf' ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Download className="h-4 w-4 mr-1" />}
                                PDF
                            </Button>
                        </div>
                    </div>

                    {/* Trucks Charts */}
                    <div className="grid md:grid-cols-2 gap-4">
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-sm">Trucks by Status</CardTitle>
                            </CardHeader>
                            <CardContent>
                                {trucksAnalytics?.byStatus && trucksAnalytics.byStatus.length > 0 ? (
                                    <ResponsiveContainer width="100%" height={200}>
                                        <PieChart>
                                            <Pie
                                                data={trucksAnalytics.byStatus}
                                                dataKey="count"
                                                nameKey="status"
                                                cx="50%"
                                                cy="50%"
                                                outerRadius={70}
                                                label={({ status, count }) => `${status}: ${count}`}
                                            >
                                                {trucksAnalytics.byStatus.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                ))}
                                            </Pie>
                                            <Tooltip />
                                        </PieChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <div className="h-[200px] flex items-center justify-center text-muted-foreground">
                                        No data available
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="text-sm">Trucks Added Over Time</CardTitle>
                            </CardHeader>
                            <CardContent>
                                {trucksAnalytics?.overTime && trucksAnalytics.overTime.length > 0 ? (
                                    <ResponsiveContainer width="100%" height={200}>
                                        <LineChart data={trucksAnalytics.overTime}>
                                            <CartesianGrid strokeDasharray="3 3" />
                                            <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                                            <YAxis />
                                            <Tooltip />
                                            <Line type="monotone" dataKey="count" stroke="#3b82f6" strokeWidth={2} />
                                        </LineChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <div className="h-[200px] flex items-center justify-center text-muted-foreground">
                                        No data available
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>

                    {/* Trucks Table */}
                    <Card>
                        <CardHeader className="pb-2">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                                <CardTitle className="text-sm">Trucks Data</CardTitle>
                                <div className="flex gap-2">
                                    <div className="relative">
                                        <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            placeholder="Search..."
                                            className="pl-8 h-8 w-[150px]"
                                            value={trucksSearch}
                                            onChange={(e) => setTrucksSearch(e.target.value)}
                                        />
                                    </div>
                                    <Select value={truckStatusFilter} onValueChange={setTruckStatusFilter}>
                                        <SelectTrigger className="h-8 w-[120px]">
                                            <Filter className="h-3 w-3 mr-1" />
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">All</SelectItem>
                                            <SelectItem value="approved">Approved</SelectItem>
                                            <SelectItem value="pending">Pending</SelectItem>
                                            <SelectItem value="rejected">Rejected</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead className="text-xs text-muted-foreground border-b">
                                        <tr>
                                            <th className="text-left py-2 px-2">Name</th>
                                            <th className="text-left py-2 px-2">Chassis No</th>
                                            <th className="text-left py-2 px-2">Status</th>
                                            <th className="text-left py-2 px-2">Created</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {trucksData.length > 0 ? trucksData.map((truck) => (
                                            <tr key={truck._id} className="border-b hover:bg-muted/50">
                                                <td className="py-2 px-2 font-medium">{truck.name}</td>
                                                <td className="py-2 px-2 font-mono text-xs">{truck.chassisNo}</td>
                                                <td className="py-2 px-2">{getStatusBadge(truck.status)}</td>
                                                <td className="py-2 px-2 text-muted-foreground">{new Date(truck.createdAt).toLocaleDateString()}</td>
                                            </tr>
                                        )) : (
                                            <tr>
                                                <td colSpan={4} className="py-8 text-center text-muted-foreground">No trucks found</td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                            {trucksPagination.pages > 1 && (
                                <div className="flex items-center justify-between mt-4">
                                    <span className="text-xs text-muted-foreground">
                                        Page {trucksPagination.page} of {trucksPagination.pages}
                                    </span>
                                    <div className="flex gap-1">
                                        <Button 
                                            variant="outline" 
                                            size="icon" 
                                            className="h-7 w-7"
                                            disabled={trucksPagination.page <= 1}
                                            onClick={() => setTrucksPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                                        >
                                            <ChevronLeft className="h-4 w-4" />
                                        </Button>
                                        <Button 
                                            variant="outline" 
                                            size="icon" 
                                            className="h-7 w-7"
                                            disabled={trucksPagination.page >= trucksPagination.pages}
                                            onClick={() => setTrucksPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                                        >
                                            <ChevronRight className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                <Separator />

                {/* Drivers Analytics Section */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-semibold flex items-center gap-2">
                            <Users className="h-5 w-5" /> Drivers Analytics
                        </h2>
                        <div className="flex gap-2">
                            <Button 
                                variant="outline" 
                                size="sm" 
                                onClick={() => handleExport('drivers', 'csv')}
                                disabled={!!exporting}
                            >
                                {exporting === 'drivers-csv' ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <FileText className="h-4 w-4 mr-1" />}
                                CSV
                            </Button>
                            <Button 
                                variant="outline" 
                                size="sm" 
                                onClick={() => handleExport('drivers', 'excel')}
                                disabled={!!exporting}
                            >
                                {exporting === 'drivers-excel' ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <FileSpreadsheet className="h-4 w-4 mr-1" />}
                                Excel
                            </Button>
                            <Button 
                                variant="outline" 
                                size="sm" 
                                onClick={() => handleExport('drivers', 'pdf')}
                                disabled={!!exporting}
                            >
                                {exporting === 'drivers-pdf' ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Download className="h-4 w-4 mr-1" />}
                                PDF
                            </Button>
                        </div>
                    </div>

                    {/* Drivers Charts */}
                    <div className="grid md:grid-cols-2 gap-4">
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-sm">Drivers by Status</CardTitle>
                            </CardHeader>
                            <CardContent>
                                {driversAnalytics?.byStatus && driversAnalytics.byStatus.length > 0 ? (
                                    <ResponsiveContainer width="100%" height={200}>
                                        <BarChart data={driversAnalytics.byStatus}>
                                            <CartesianGrid strokeDasharray="3 3" />
                                            <XAxis dataKey="status" />
                                            <YAxis />
                                            <Tooltip />
                                            <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <div className="h-[200px] flex items-center justify-center text-muted-foreground">
                                        No data available
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="text-sm">Drivers Added Over Time</CardTitle>
                            </CardHeader>
                            <CardContent>
                                {driversAnalytics?.overTime && driversAnalytics.overTime.length > 0 ? (
                                    <ResponsiveContainer width="100%" height={200}>
                                        <LineChart data={driversAnalytics.overTime}>
                                            <CartesianGrid strokeDasharray="3 3" />
                                            <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                                            <YAxis />
                                            <Tooltip />
                                            <Line type="monotone" dataKey="count" stroke="#22c55e" strokeWidth={2} />
                                        </LineChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <div className="h-[200px] flex items-center justify-center text-muted-foreground">
                                        No data available
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>

                    {/* Drivers Table */}
                    <Card>
                        <CardHeader className="pb-2">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                                <CardTitle className="text-sm">Drivers Data</CardTitle>
                                <div className="flex gap-2">
                                    <div className="relative">
                                        <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            placeholder="Search..."
                                            className="pl-8 h-8 w-[150px]"
                                            value={driversSearch}
                                            onChange={(e) => setDriversSearch(e.target.value)}
                                        />
                                    </div>
                                    <Select value={driverStatusFilter} onValueChange={setDriverStatusFilter}>
                                        <SelectTrigger className="h-8 w-[120px]">
                                            <Filter className="h-3 w-3 mr-1" />
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">All</SelectItem>
                                            <SelectItem value="active">Active</SelectItem>
                                            <SelectItem value="inactive">Inactive</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead className="text-xs text-muted-foreground border-b">
                                        <tr>
                                            <th className="text-left py-2 px-2">Name</th>
                                            <th className="text-left py-2 px-2">Mobile</th>
                                            <th className="text-left py-2 px-2">DL No</th>
                                            <th className="text-left py-2 px-2">Status</th>
                                            <th className="text-left py-2 px-2">Created</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {driversData.length > 0 ? driversData.map((driver) => (
                                            <tr key={driver._id} className="border-b hover:bg-muted/50">
                                                <td className="py-2 px-2 font-medium">{driver.fullName}</td>
                                                <td className="py-2 px-2">{driver.mobile}</td>
                                                <td className="py-2 px-2 font-mono text-xs">{driver.dlNo}</td>
                                                <td className="py-2 px-2">{getStatusBadge(driver.status)}</td>
                                                <td className="py-2 px-2 text-muted-foreground">{new Date(driver.createdAt).toLocaleDateString()}</td>
                                            </tr>
                                        )) : (
                                            <tr>
                                                <td colSpan={5} className="py-8 text-center text-muted-foreground">No drivers found</td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                            {driversPagination.pages > 1 && (
                                <div className="flex items-center justify-between mt-4">
                                    <span className="text-xs text-muted-foreground">
                                        Page {driversPagination.page} of {driversPagination.pages}
                                    </span>
                                    <div className="flex gap-1">
                                        <Button 
                                            variant="outline" 
                                            size="icon" 
                                            className="h-7 w-7"
                                            disabled={driversPagination.page <= 1}
                                            onClick={() => setDriversPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                                        >
                                            <ChevronLeft className="h-4 w-4" />
                                        </Button>
                                        <Button 
                                            variant="outline" 
                                            size="icon" 
                                            className="h-7 w-7"
                                            disabled={driversPagination.page >= driversPagination.pages}
                                            onClick={() => setDriversPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                                        >
                                            <ChevronRight className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                <Separator />

                {/* Quick Export Section */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-sm flex items-center gap-2">
                            <Download className="h-4 w-4" /> Quick Export All Data
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-wrap gap-3">
                            <Button onClick={() => handleExport('trucks', 'excel')} disabled={!!exporting}>
                                <FileSpreadsheet className="h-4 w-4 mr-2" />
                                Download Full Trucks Report
                            </Button>
                            <Button onClick={() => handleExport('drivers', 'excel')} disabled={!!exporting}>
                                <FileSpreadsheet className="h-4 w-4 mr-2" />
                                Download Full Drivers Report
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </DashboardLayout>
    );
};

export default Reports;
