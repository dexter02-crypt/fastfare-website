import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import {
  TrendingUp, TrendingDown, Package, Truck, Clock, CheckCircle,
  Download, Calendar, BarChart3, PieChart as PieChartIcon, LineChart as LineChartIcon, MapPin
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend
} from "recharts";
import { toast } from "sonner";

const AnalyticsDashboard = () => {
  const [dateRange, setDateRange] = useState("7d");
  const [stats, setStats] = useState([
    { label: "Total Shipments", value: "0", change: "0%", trend: "up" },
    { label: "Delivered", value: "0", change: "0%", trend: "up" },
    { label: "In Transit", value: "0", change: "0%", trend: "up" },
    { label: "RTO Rate", value: "0%", change: "0%", trend: "up" },
  ]);

  // Chart Data — populated from API
  const volumeData: { name: string; shipments: number }[] = [];

  const statusData: { name: string; value: number; color: string }[] = [];

  const carrierData: { name: string; onTime: number; volume: number }[] = [];

  const geoData: { name: string; value: number }[] = [];

  const trendData: { month: string; revenue: number; shipments: number }[] = [];

  // Data update based on filter
  useEffect(() => {
    setStats([
      { label: "Total Shipments", value: "0", change: "0%", trend: "up" },
      { label: "Delivered", value: "0", change: "0%", trend: "up" },
      { label: "In Transit", value: "0", change: "0%", trend: "up" },
      { label: "RTO Rate", value: "0%", change: "0%", trend: "up" },
    ]);
  }, [dateRange]);

  const handleExport = () => {
    const csvContent = "data:text/csv;charset=utf-8,Label,Value,Change\n" +
      stats.map(s => `${s.label},${s.value.replace(/,/g, '')},${s.change}`).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `analytics_report_${dateRange}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Report downloaded successfully");
  };

  const carrierPerformance: { name: string; deliveries: number; onTime: number; rating: number }[] = [];

  const topCities: { city: string; shipments: number; revenue: string }[] = [];

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container py-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
            <p className="text-muted-foreground">Business intelligence and insights</p>
          </div>
          <div className="flex gap-3">
            <Select value={dateRange} onValueChange={setDateRange}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7d">Last 7 days</SelectItem>
                <SelectItem value="30d">Last 30 days</SelectItem>
                <SelectItem value="90d">Last 90 days</SelectItem>
                <SelectItem value="1y">Last year</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" className="gap-2" onClick={handleExport}>
              <Download className="h-4 w-4" />
              Export Report
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card>
                <CardContent className="pt-6">
                  <p className="text-sm text-muted-foreground mb-1">{stat.label}</p>
                  <div className="flex items-center justify-between">
                    <p className="text-3xl font-bold">{stat.value}</p>
                    <Badge variant={stat.trend === "up" ? "default" : "secondary"} className="gap-1">
                      {stat.trend === "up" ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                      {stat.change}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="carriers">Carrier Performance</TabsTrigger>
            <TabsTrigger value="geography">Geography</TabsTrigger>
            <TabsTrigger value="trends">Trends</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Shipment Volume Chart */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Shipment Volume
                  </CardTitle>
                  <CardDescription>Daily shipment trends</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={volumeData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
                        <YAxis fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${value}`} />
                        <Tooltip />
                        <Bar dataKey="shipments" fill="#0f172a" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Delivery Status Distribution */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <PieChart className="h-5 w-5" />
                    Delivery Status
                  </CardTitle>
                  <CardDescription>Current status distribution</CardDescription>
                </CardHeader>
                <CardContent className="flex items-center justify-between">
                  <div className="h-64 w-1/2">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={statusData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {statusData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="w-1/2 space-y-2">
                    {statusData.map((item) => (
                      <div key={item.name} className="flex items-center gap-2 text-sm">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                        <span className="flex-1">{item.name}</span>
                        <span className="font-bold">{item.value}%</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Carrier Performance Summary */}
            <Card>
              <CardHeader>
                <CardTitle>Carrier Performance</CardTitle>
                <CardDescription>Compare carrier metrics</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {carrierPerformance.map((carrier) => (
                    <div key={carrier.name} className="p-4 rounded-lg border">
                      <p className="font-semibold mb-3">{carrier.name}</p>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Deliveries</span>
                          <span className="font-medium">{carrier.deliveries.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">On-Time %</span>
                          <span className="font-medium text-green-500">{carrier.onTime}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Rating</span>
                          <span className="font-medium">{carrier.rating}/5</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="carriers">
            <Card>
              <CardHeader>
                <CardTitle>Detailed Carrier Analytics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[400px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={carrierData} layout="vertical" margin={{ left: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                      <XAxis type="number" fontSize={12} tickLine={false} axisLine={false} />
                      <YAxis dataKey="name" type="category" fontSize={12} tickLine={false} axisLine={false} width={100} />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="volume" name="Shipment Volume" fill="#0f172a" radius={[0, 4, 4, 0]} barSize={20} />
                      <Bar dataKey="onTime" name="On-Time %" fill="#22c55e" radius={[0, 4, 4, 0]} barSize={20} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="geography">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Geographic Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={geoData} layout="vertical" margin={{ left: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                        <XAxis type="number" hide />
                        <YAxis dataKey="name" type="category" fontSize={12} tickLine={false} axisLine={false} width={100} />
                        <Tooltip />
                        <Bar dataKey="value" fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={30} label={{ position: 'right', fill: '#666' }} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Top Cities</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {topCities.map((city, index) => (
                      <div key={city.city} className="flex items-center gap-4">
                        <span className="text-lg font-bold text-muted-foreground w-6">{index + 1}</span>
                        <div className="flex-1">
                          <p className="font-medium">{city.city}</p>
                          <p className="text-sm text-muted-foreground">{city.shipments.toLocaleString()} shipments</p>
                        </div>
                        <Badge variant="secondary">{city.revenue}</Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="trends">
            <Card>
              <CardHeader>
                <CardTitle>Trend Analysis</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[400px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={trendData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="month" fontSize={12} tickLine={false} axisLine={false} />
                      <YAxis yAxisId="left" fontSize={12} tickLine={false} axisLine={false} />
                      <YAxis yAxisId="right" orientation="right" fontSize={12} tickLine={false} axisLine={false} />
                      <Tooltip />
                      <Legend />
                      <Line yAxisId="left" type="monotone" dataKey="shipments" name="Shipments" stroke="#0f172a" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                      <Line yAxisId="right" type="monotone" dataKey="revenue" name="Revenue (₹)" stroke="#22c55e" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      <Footer />
    </div >
  );
};

export default AnalyticsDashboard;
