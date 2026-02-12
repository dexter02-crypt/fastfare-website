import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import DashboardLayout from "@/components/DashboardLayout";
import {
    Truck, CheckCircle, Package, Wallet, ChevronRight,
    Warehouse, MapPin, RotateCcw, Box, TrendingUp, ArrowUpRight
} from "lucide-react";
import { authApi } from "@/lib/api";

const stats = [
    { label: "Total Shipments", value: "142", icon: Package, bg: "bg-blue-100", text: "text-blue-600" },
    { label: "In Transit", value: "89", icon: Truck, bg: "bg-orange-100", text: "text-orange-600" },
    { label: "Delivered Today", value: "47", icon: CheckCircle, bg: "bg-green-100", text: "text-green-600" },
    { label: "Wallet Balance", value: "₹5,00,000", icon: Wallet, bg: "bg-purple-100", text: "text-purple-600" },
];

const wmsActions = [
    { label: "Fleet Management", desc: "Vehicles & drivers", icon: Truck, href: "/wms/fleet", color: "from-blue-500 to-blue-600" },
    { label: "Inventory", desc: "Stock management", icon: Package, href: "/wms/inventory", color: "from-emerald-500 to-emerald-600" },
    { label: "Inbound", desc: "Receiving dock", icon: Box, href: "/wms/inbound", color: "from-purple-500 to-purple-600" },
    { label: "Returns (RTD)", desc: "Return to depot", icon: RotateCcw, href: "/wms/rtd", color: "from-orange-500 to-orange-600" },
    { label: "Live Tracking", desc: "Track drivers", icon: MapPin, href: "/wms/tracking", color: "from-cyan-500 to-cyan-600" },
    { label: "WMS Reports", desc: "Analytics", icon: TrendingUp, href: "/wms/reports", color: "from-indigo-500 to-indigo-600" },
];

const activity = [
    { id: "#SHP-3021", dest: "San Francisco, CA", status: "In Transit", eta: "Oct 26, 2:00 PM" },
    { id: "#SHP-3020", dest: "Austin, TX", status: "Delivered", eta: "Oct 26, 11:30 AM" },
    { id: "#SHP-3019", dest: "New York, NY", status: "In Transit", eta: "Oct 26, 4:45 PM" },
    { id: "#SHP-3018", dest: "Miami, FL", status: "Delivered", eta: "Oct 25, 6:15 PM" },
    { id: "#SHP-3017", dest: "Chicago, IL", status: "In Transit", eta: "Oct 27, 9:00 AM" },
];

const PartnerDashboard = () => {
    const user = authApi.getCurrentUser();

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'In Transit': return 'bg-orange-100 text-orange-700';
            case 'Delivered': return 'bg-green-100 text-green-700';
            default: return 'bg-gray-100 text-gray-700';
        }
    };

    return (
        <DashboardLayout>
            <div className="space-y-8 flex-1 h-full bg-gray-50/50 p-2">
                {/* Welcome Section */}
                <div className="flex flex-col gap-1">
                    <h1 className="text-2xl font-bold">Welcome back, {user?.contactPerson || user?.businessName || "John"}!</h1>
                    <p className="text-muted-foreground">Here's what's happening with your logistics operations today.</p>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {stats.map((stat, index) => (
                        <motion.div
                            key={stat.label}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                        >
                            <Card className="shadow-sm border-none">
                                <CardContent className="p-6 flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-muted-foreground font-medium mb-1">{stat.label}</p>
                                        <p className="text-3xl font-bold">{stat.value}</p>
                                    </div>
                                    <div className={`h-12 w-12 rounded-full ${stat.bg} ${stat.text} flex items-center justify-center`}>
                                        <stat.icon className="h-6 w-6" />
                                    </div>
                                </CardContent>
                            </Card>
                        </motion.div>
                    ))}
                </div>

                {/* WMS Quick Actions */}
                <div>
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                            <Warehouse className="h-5 w-5 text-primary" />
                            <h3 className="font-semibold text-lg">Warehouse Management</h3>
                        </div>
                        <Link to="/wms">
                            <Button variant="ghost" className="text-blue-600 font-medium hover:text-blue-700 hover:bg-blue-50 text-sm">
                                View Full Dashboard <ArrowUpRight className="h-3.5 w-3.5 ml-1" />
                            </Button>
                        </Link>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                        {wmsActions.map((action, i) => (
                            <motion.div key={action.label} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 + i * 0.05 }}>
                                <Link to={action.href}>
                                    <div className="group p-4 rounded-xl border bg-white hover:shadow-md transition-all hover:-translate-y-0.5 text-center">
                                        <div className={`h-10 w-10 mx-auto rounded-xl bg-gradient-to-br ${action.color} flex items-center justify-center mb-3`}>
                                            <action.icon className="h-5 w-5 text-white" />
                                        </div>
                                        <p className="text-sm font-medium">{action.label}</p>
                                        <p className="text-xs text-muted-foreground mt-0.5">{action.desc}</p>
                                    </div>
                                </Link>
                            </motion.div>
                        ))}
                    </div>
                </div>

                {/* Recent Activity */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="p-4 md:p-6 flex items-center justify-between border-b border-gray-100">
                        <h3 className="font-semibold text-lg">Recent Activity</h3>
                        <Link to="/partner/activity">
                            <Button variant="ghost" className="text-blue-600 font-medium hover:text-blue-700 hover:bg-blue-50">View All</Button>
                        </Link>
                    </div>

                    <div className="w-full overflow-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-gray-50/50 text-gray-500 font-medium border-b border-gray-100">
                                <tr>
                                    <th className="px-6 py-4 uppercase text-xs tracking-wider">ID</th>
                                    <th className="px-6 py-4 uppercase text-xs tracking-wider">Destination</th>
                                    <th className="px-6 py-4 uppercase text-xs tracking-wider">Status</th>
                                    <th className="px-6 py-4 uppercase text-xs tracking-wider">ETA</th>
                                    <th className="px-6 py-4 uppercase text-xs tracking-wider text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {activity.map((item) => (
                                    <tr key={item.id} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="px-6 py-4 font-semibold text-gray-900">{item.id}</td>
                                        <td className="px-6 py-4 text-gray-600">{item.dest}</td>
                                        <td className="px-6 py-4">
                                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(item.status)}`}>
                                                • {item.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-gray-600">{item.eta}</td>
                                        <td className="px-6 py-4 text-right">
                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-gray-600">
                                                <ChevronRight className="h-4 w-4" />
                                            </Button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
};

export default PartnerDashboard;
