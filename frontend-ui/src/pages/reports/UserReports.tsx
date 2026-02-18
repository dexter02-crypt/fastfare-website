import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Package, TrendingUp, Calendar, Download, FileText,
    FileSpreadsheet, Loader2, CheckCircle, Clock, XCircle,
    IndianRupee, Truck, MapPin
} from "lucide-react";
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import DashboardLayout from "@/components/DashboardLayout";
import {
    PieChart, Pie, Cell, LineChart, Line,
    XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from "recharts";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const UserReports = () => {
    const [dateRange, setDateRange] = useState("30days");
    const [loading, setLoading] = useState(true);
    const [userRole, setUserRole] = useState<string>("");

    useEffect(() => {
        const user = JSON.parse(localStorage.getItem("user") || "{}");
        setUserRole(user.role || "");
    }, []);

    const [stats, setStats] = useState({
        totalShipments: 0,
        activeShipments: 0,
        deliveredShipments: 0,
        pendingShipments: 0,
        totalAmount: 0,
        avgDeliveryTime: 0,
    });
    const [shipmentsByStatus, setShipmentsByStatus] = useState<{ name: string; value: number; color: string }[]>([]);
    const [shipmentsOverTime, setShipmentsOverTime] = useState<{ date: string; count: number }[]>([]);
    const [recentShipments, setRecentShipments] = useState<any[]>([]);

    useEffect(() => {
        fetchUserReports();
    }, [dateRange]);

    const fetchUserReports = async () => {
        setLoading(true);
        try {
            // Production: replace with actual API call
            await new Promise(resolve => setTimeout(resolve, 800));

            // Empty production state
            setStats({
                totalShipments: 0,
                activeShipments: 0,
                deliveredShipments: 0,
                pendingShipments: 0,
                totalAmount: 0,
                avgDeliveryTime: 0,
            });

            setShipmentsByStatus([]);

            setShipmentsOverTime([]);

            setRecentShipments([]);
        } catch (error) {
            console.error("Error fetching reports:", error);
        } finally {
            setLoading(false);
        }
    };

    const exportToCSV = () => {
        let csv = "Shipment ID,Destination,Status,Date,Cost (₹)\n";
        recentShipments.forEach(s => {
            csv += `${s.id},${s.destination},${s.status},${s.date},${s.cost}\n`;
        });

        const blob = new Blob([csv], { type: "text/csv" });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `my_shipments_report_${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
    };

    const exportToExcel = () => {
        const data = recentShipments.map(s => ({
            "Shipment ID": s.id,
            "Destination": s.destination,
            "Status": s.status,
            "Date": s.date,
            "Cost (₹)": s.cost
        }));

        const ws = XLSX.utils.json_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "My Shipments");
        XLSX.writeFile(wb, `my_shipments_report_${new Date().toISOString().split('T')[0]}.xlsx`);
    };

    const exportToPDF = () => {
        const doc = new jsPDF();
        doc.setFontSize(18);
        doc.text("My Shipments Report", 14, 22);
        doc.setFontSize(11);
        doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 30);

        autoTable(doc, {
            startY: 40,
            head: [["Shipment ID", "Destination", "Status", "Date", "Cost (₹)"]],
            body: recentShipments.map(s => [s.id, s.destination, s.status, s.date, `₹${s.cost}`]),
        });

        doc.save(`my_shipments_report_${new Date().toISOString().split('T')[0]}.pdf`);
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case "delivered":
                return <Badge className="bg-green-100 text-green-800"><CheckCircle className="h-3 w-3 mr-1" /> Delivered</Badge>;
            case "in_transit":
                return <Badge className="bg-blue-100 text-blue-800"><Truck className="h-3 w-3 mr-1" /> In Transit</Badge>;
            case "pending":
                return <Badge className="bg-yellow-100 text-yellow-800"><Clock className="h-3 w-3 mr-1" /> Pending</Badge>;
            default:
                return <Badge>{status}</Badge>;
        }
    };

    if (loading) {
        return (
            <DashboardLayout>
                <div className="flex items-center justify-center h-64">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
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
                        <h1 className="text-2xl font-bold flex items-center gap-2">
                            <FileText className="h-6 w-6 text-primary" />
                            My Reports
                        </h1>
                        <p className="text-muted-foreground text-sm mt-1">
                            View and export your shipment data and activity
                        </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <Select value={dateRange} onValueChange={setDateRange}>
                            <SelectTrigger className="w-[150px]">
                                <Calendar className="h-4 w-4 mr-2" />
                                <SelectValue placeholder="Date Range" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="7days">Last 7 Days</SelectItem>
                                <SelectItem value="30days">Last 30 Days</SelectItem>
                                <SelectItem value="90days">Last 90 Days</SelectItem>
                                <SelectItem value="all">All Time</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                    <Card>
                        <CardContent className="p-4">
                            <div className="flex items-center gap-2">
                                <Package className="h-5 w-5 text-blue-500" />
                                <span className="text-sm text-muted-foreground">Total</span>
                            </div>
                            <p className="text-2xl font-bold mt-1">{stats.totalShipments}</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-4">
                            <div className="flex items-center gap-2">
                                <Truck className="h-5 w-5 text-blue-500" />
                                <span className="text-sm text-muted-foreground">Active</span>
                            </div>
                            <p className="text-2xl font-bold mt-1">{stats.activeShipments}</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-4">
                            <div className="flex items-center gap-2">
                                <CheckCircle className="h-5 w-5 text-green-500" />
                                <span className="text-sm text-muted-foreground">Delivered</span>
                            </div>
                            <p className="text-2xl font-bold mt-1">{stats.deliveredShipments}</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-4">
                            <div className="flex items-center gap-2">
                                <Clock className="h-5 w-5 text-yellow-500" />
                                <span className="text-sm text-muted-foreground">Pending</span>
                            </div>
                            <p className="text-2xl font-bold mt-1">{stats.pendingShipments}</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-4">
                            <div className="flex items-center gap-2">
                                <IndianRupee className="h-5 w-5 text-green-500" />
                                <span className="text-sm text-muted-foreground">
                                    {userRole === 'shipment_partner' ? 'Earned' : 'Spent'}
                                </span>
                            </div>
                            <p className="text-2xl font-bold mt-1">₹{stats.totalAmount.toLocaleString()}</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-4">
                            <div className="flex items-center gap-2">
                                <TrendingUp className="h-5 w-5 text-purple-500" />
                                <span className="text-sm text-muted-foreground">Avg Days</span>
                            </div>
                            <p className="text-2xl font-bold mt-1">{stats.avgDeliveryTime}</p>
                        </CardContent>
                    </Card>
                </div>

                <Separator />

                {/* Charts */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Shipment Status Pie Chart */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">Shipments by Status</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ResponsiveContainer width="100%" height={250}>
                                <PieChart>
                                    <Pie
                                        data={shipmentsByStatus}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={100}
                                        paddingAngle={2}
                                        dataKey="value"
                                        label={({ name, value }) => `${name}: ${value}`}
                                    >
                                        {shipmentsByStatus.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                    <Legend />
                                </PieChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>

                    {/* Shipments Over Time Line Chart */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">Shipments Over Time</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ResponsiveContainer width="100%" height={250}>
                                <LineChart data={shipmentsOverTime}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="date" />
                                    <YAxis />
                                    <Tooltip />
                                    <Legend />
                                    <Line
                                        type="monotone"
                                        dataKey="count"
                                        stroke="#3b82f6"
                                        strokeWidth={2}
                                        name="Shipments"
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>
                </div>

                <Separator />

                {/* Recent Shipments Table */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle className="text-lg">Recent Shipments</CardTitle>
                        <div className="flex gap-2">
                            <Button variant="outline" size="sm" onClick={exportToCSV}>
                                <Download className="h-4 w-4 mr-1" /> CSV
                            </Button>
                            <Button variant="outline" size="sm" onClick={exportToExcel}>
                                <FileSpreadsheet className="h-4 w-4 mr-1" /> Excel
                            </Button>
                            <Button variant="outline" size="sm" onClick={exportToPDF}>
                                <FileText className="h-4 w-4 mr-1" /> PDF
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b">
                                        <th className="text-left py-3 px-4 font-medium text-muted-foreground">Shipment ID</th>
                                        <th className="text-left py-3 px-4 font-medium text-muted-foreground">Destination</th>
                                        <th className="text-left py-3 px-4 font-medium text-muted-foreground">Status</th>
                                        <th className="text-left py-3 px-4 font-medium text-muted-foreground">Date</th>
                                        <th className="text-right py-3 px-4 font-medium text-muted-foreground">Cost</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {recentShipments.map((shipment) => (
                                        <tr key={shipment.id} className="border-b hover:bg-muted/50">
                                            <td className="py-3 px-4 font-mono text-sm">{shipment.id}</td>
                                            <td className="py-3 px-4">
                                                <div className="flex items-center gap-1">
                                                    <MapPin className="h-4 w-4 text-muted-foreground" />
                                                    {shipment.destination}
                                                </div>
                                            </td>
                                            <td className="py-3 px-4">{getStatusBadge(shipment.status)}</td>
                                            <td className="py-3 px-4">{new Date(shipment.date).toLocaleDateString()}</td>
                                            <td className="py-3 px-4 text-right font-medium">₹{shipment.cost.toLocaleString()}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </DashboardLayout>
    );
};

export default UserReports;
