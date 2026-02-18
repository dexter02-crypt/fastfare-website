import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { API_BASE_URL } from "@/config";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Package, Truck, CheckCircle, Clock, BarChart3, ArrowRight, LogOut, Bell
} from "lucide-react";
import { motion } from "framer-motion";

const CarrierDashboard = () => {
    const navigate = useNavigate();
    const [stats, setStats] = useState({ pending: 0, accepted: 0, inTransit: 0, delivered: 0, total: 0 });
    const [carrier, setCarrier] = useState<any>(null);

    useEffect(() => {
        const token = localStorage.getItem("carrierToken");
        const data = localStorage.getItem("carrierData");
        if (!token) { navigate("/carrier/login"); return; }
        if (data) setCarrier(JSON.parse(data));

        fetch(`${API_BASE_URL}/api/shipments/carrier/stats`, {
            headers: { Authorization: `Bearer ${token}` },
        })
            .then((r) => r.json())
            .then((d) => { if (d.success) setStats(d.stats); })
            .catch(console.error);
    }, [navigate]);

    const handleLogout = () => {
        localStorage.removeItem("carrierToken");
        localStorage.removeItem("carrierData");
        navigate("/carrier/login");
    };

    const statCards = [
        { label: "New Orders", value: stats.pending, icon: Bell, color: "text-orange-600", bg: "bg-orange-100" },
        { label: "Active Pickups", value: stats.accepted, icon: Truck, color: "text-blue-600", bg: "bg-blue-100" },
        { label: "In Transit", value: stats.inTransit, icon: Package, color: "text-purple-600", bg: "bg-purple-100" },
        { label: "Delivered", value: stats.delivered, icon: CheckCircle, color: "text-green-600", bg: "bg-green-100" },
    ];

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
            {/* Header */}
            <header className="bg-white border-b sticky top-0 z-10">
                <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
                    <div>
                        <h1 className="text-xl font-bold">Carrier Dashboard</h1>
                        <p className="text-sm text-muted-foreground">
                            {carrier?.businessName || "Loading..."}
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" onClick={() => navigate("/carrier/orders")}>
                            <Package className="h-4 w-4 mr-1" /> Orders
                        </Button>
                        <Button variant="ghost" size="sm" onClick={handleLogout}>
                            <LogOut className="h-4 w-4 mr-1" /> Logout
                        </Button>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 py-6 space-y-6">
                {/* Stats */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {statCards.map((s, i) => (
                        <motion.div
                            key={s.label}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.1 }}
                        >
                            <Card className="hover:shadow-md transition-shadow">
                                <CardContent className="p-6">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm text-muted-foreground">{s.label}</p>
                                            <p className="text-3xl font-bold mt-1">{s.value}</p>
                                        </div>
                                        <div className={`w-12 h-12 ${s.bg} rounded-xl flex items-center justify-center`}>
                                            <s.icon className={`h-6 w-6 ${s.color}`} />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </motion.div>
                    ))}
                </div>

                {/* Quick Actions */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Card
                        className="cursor-pointer hover:shadow-md transition-all hover:border-primary/50"
                        onClick={() => navigate("/carrier/orders?tab=new")}
                    >
                        <CardContent className="p-6 flex items-center gap-4">
                            <div className="w-14 h-14 bg-orange-100 rounded-xl flex items-center justify-center">
                                <Bell className="h-7 w-7 text-orange-600" />
                            </div>
                            <div className="flex-1">
                                <h3 className="font-semibold text-lg">New Orders</h3>
                                <p className="text-sm text-muted-foreground">
                                    {stats.pending} shipments waiting for your acceptance
                                </p>
                            </div>
                            <ArrowRight className="h-5 w-5 text-muted-foreground" />
                        </CardContent>
                    </Card>

                    <Card
                        className="cursor-pointer hover:shadow-md transition-all hover:border-primary/50"
                        onClick={() => navigate("/carrier/orders?tab=active")}
                    >
                        <CardContent className="p-6 flex items-center gap-4">
                            <div className="w-14 h-14 bg-blue-100 rounded-xl flex items-center justify-center">
                                <Truck className="h-7 w-7 text-blue-600" />
                            </div>
                            <div className="flex-1">
                                <h3 className="font-semibold text-lg">Active Pickups</h3>
                                <p className="text-sm text-muted-foreground">
                                    {stats.accepted} active shipments to process
                                </p>
                            </div>
                            <ArrowRight className="h-5 w-5 text-muted-foreground" />
                        </CardContent>
                    </Card>
                </div>

                {/* Total Stats */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <BarChart3 className="h-5 w-5" /> Overview
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center gap-4">
                            <div className="flex-1 text-center p-4 bg-gray-50 rounded-lg">
                                <p className="text-3xl font-bold">{stats.total}</p>
                                <p className="text-sm text-muted-foreground">Total Shipments</p>
                            </div>
                            <div className="flex-1 text-center p-4 bg-green-50 rounded-lg">
                                <p className="text-3xl font-bold text-green-600">{stats.delivered}</p>
                                <p className="text-sm text-muted-foreground">Completed</p>
                            </div>
                            <div className="flex-1 text-center p-4 bg-blue-50 rounded-lg">
                                <p className="text-3xl font-bold text-blue-600">
                                    {stats.total > 0 ? Math.round((stats.delivered / stats.total) * 100) : 0}%
                                </p>
                                <p className="text-sm text-muted-foreground">Completion Rate</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </main>
        </div>
    );
};

export default CarrierDashboard;
