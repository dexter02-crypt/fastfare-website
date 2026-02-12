import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import DashboardLayout from "@/components/DashboardLayout";
import {
  Warehouse, Package, TrendingUp, AlertTriangle, Plus, Search,
  ArrowUpRight, ArrowDownRight, MapPin, Users, Truck, BarChart3
} from "lucide-react";

const stats = [
  { label: "Total Warehouses", value: "4", change: "+1", trend: "up", icon: Warehouse },
  { label: "Total SKUs", value: "12,456", change: "+234", trend: "up", icon: Package },
  { label: "Orders Today", value: "189", change: "+12%", trend: "up", icon: TrendingUp },
  { label: "Low Stock Alerts", value: "23", change: "+5", trend: "down", icon: AlertTriangle },
];

const warehouses = [
  { id: 1, name: "Mumbai Central", location: "Mumbai, MH", capacity: 85, orders: 89, status: "Active" },
  { id: 2, name: "Delhi Hub", location: "Delhi, DL", capacity: 72, orders: 56, status: "Active" },
  { id: 3, name: "Bangalore South", location: "Bangalore, KA", capacity: 45, orders: 34, status: "Active" },
  { id: 4, name: "Chennai Warehouse", location: "Chennai, TN", capacity: 30, orders: 10, status: "Maintenance" },
];

const recentOrders = [
  { id: "ORD-001", sku: "SKU-12345", qty: 5, status: "Picking", warehouse: "Mumbai Central" },
  { id: "ORD-002", sku: "SKU-67890", qty: 2, status: "Packing", warehouse: "Delhi Hub" },
  { id: "ORD-003", sku: "SKU-11223", qty: 10, status: "Ready", warehouse: "Mumbai Central" },
  { id: "ORD-004", sku: "SKU-44556", qty: 1, status: "Shipped", warehouse: "Bangalore South" },
];

const WarehouseDashboard = () => {
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Warehouse Management</h1>
            <p className="text-muted-foreground">Manage inventory and fulfillment operations</p>
          </div>
          <div className="flex gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search SKU, order..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 w-64"
              />
            </div>
            <Link to="/warehouse/new">
              <Button className="gap-2 gradient-primary">
                <Plus className="h-4 w-4" />
                Add Warehouse
              </Button>
            </Link>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                      <stat.icon className="h-6 w-6 text-primary" />
                    </div>
                    <Badge variant={stat.trend === "up" ? "default" : "destructive"} className="gap-1">
                      {stat.trend === "up" ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                      {stat.change}
                    </Badge>
                  </div>
                  <div className="mt-4">
                    <p className="text-3xl font-bold">{stat.value}</p>
                    <p className="text-sm text-muted-foreground">{stat.label}</p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Warehouses List */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Warehouses</CardTitle>
                  <CardDescription>Your fulfillment locations</CardDescription>
                </div>
                <Link to="/warehouses">
                  <Button variant="ghost" size="sm">View all</Button>
                </Link>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {warehouses.map((warehouse) => (
                    <div
                      key={warehouse.id}
                      className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted/50 transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                          <Warehouse className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium">{warehouse.name}</p>
                          <p className="text-sm text-muted-foreground flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {warehouse.location}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm text-muted-foreground">Capacity:</span>
                          <Progress value={warehouse.capacity} className="w-20 h-2" />
                          <span className="text-sm font-medium">{warehouse.capacity}%</span>
                        </div>
                        <Badge variant={warehouse.status === "Active" ? "default" : "secondary"}>
                          {warehouse.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions & Fulfillment Queue */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Link to="/warehouse/stock-in">
                  <Button variant="outline" className="w-full justify-start gap-2">
                    <Package className="h-4 w-4" />
                    Stock In
                  </Button>
                </Link>
                <Link to="/warehouse/stock-out">
                  <Button variant="outline" className="w-full justify-start gap-2">
                    <Truck className="h-4 w-4" />
                    Stock Out
                  </Button>
                </Link>
                <Link to="/warehouse/inventory">
                  <Button variant="outline" className="w-full justify-start gap-2">
                    <BarChart3 className="h-4 w-4" />
                    View Inventory
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Fulfillment Queue */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Fulfillment Queue</CardTitle>
                <CardDescription>Orders pending fulfillment</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {recentOrders.map((order) => (
                    <div key={order.id} className="flex items-center justify-between p-3 rounded-lg border">
                      <div>
                        <p className="font-medium text-sm">{order.id}</p>
                        <p className="text-xs text-muted-foreground">{order.sku} × {order.qty}</p>
                      </div>
                      <Badge
                        variant={
                          order.status === "Shipped" ? "default" :
                          order.status === "Ready" ? "secondary" : "outline"
                        }
                      >
                        {order.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default WarehouseDashboard;
