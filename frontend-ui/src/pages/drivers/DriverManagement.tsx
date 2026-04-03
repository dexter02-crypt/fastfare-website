import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import DashboardLayout from "@/components/DashboardLayout";
import {
  Search, Plus, User, Phone, MapPin, Truck, Star,
  Package, Clock, CheckCircle, AlertTriangle
} from "lucide-react";
import { API_BASE_URL } from "@/config";
import { useToast } from "@/hooks/use-toast";
import VerifiedBadge from "@/components/VerifiedBadge";

const DriverManagement = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [drivers, setDrivers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchDrivers();
  }, []);

  const fetchDrivers = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE_URL}/api/fleet/drivers`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setDrivers(data.drivers || []);
      }
    } catch (error) {
      console.error("Failed to fetch drivers", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredDrivers = drivers.filter(d => 
    d.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) || 
    d.mobile?.includes(searchQuery)
  );

  const currentStats = [
    { label: "Total Drivers", value: drivers.length.toString(), icon: User },
    { label: "Active Now", value: drivers.filter(d => d.status === 'active').length.toString(), icon: Truck },
    { label: "On Delivery", value: "0", icon: Package },
    { label: "Available", value: drivers.filter(d => d.status === 'active').length.toString(), icon: CheckCircle },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Driver Management</h1>
            <p className="text-muted-foreground">Manage your fleet and drivers</p>
          </div>
          <div className="flex gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search drivers..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 w-64"
              />
            </div>
            <Link to="/drivers/new">
              <Button className="gap-2 gradient-primary">
                <Plus className="h-4 w-4" />
                Add Driver
              </Button>
            </Link>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          {currentStats.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                      <stat.icon className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <p className="text-3xl font-bold">{stat.value}</p>
                      <p className="text-sm text-muted-foreground">{stat.label}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Drivers Grid */}
        {loading ? (
            <div className="flex justify-center p-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>
        ) : filteredDrivers.length === 0 ? (
            <div className="text-center p-8 text-muted-foreground">No drivers found.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredDrivers.map((driver, index) => (
              <motion.div
                key={driver._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="hover:border-primary transition-colors cursor-pointer">
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-4">
                        <Avatar className="h-14 w-14">
                          <AvatarFallback>{driver.fullName?.split(" ").map((n: string) => n[0]).join("")}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-semibold">{driver.fullName}</p>
                          <p className="text-sm text-muted-foreground flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            {driver.mobile}
                          </p>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <Badge variant={driver.status === "active" ? "default" : "outline"}>
                          {driver.status}
                        </Badge>
                        {driver.verifiedIdentity?.status === 'verified' && (
                          <VerifiedBadge status="verified" source="digilocker" />
                        )}
                      </div>
                    </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground flex items-center gap-1">
                        <Truck className="h-4 w-4" />
                        Vehicle DL
                      </span>
                      <span className="font-medium">{driver.dlNo || '—'}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground flex items-center gap-1">
                        <MapPin className="h-4 w-4" />
                        Aadhaar
                      </span>
                      <span className="font-medium">•••• •••• {driver.aadhaar?.slice(-4) || '—'}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground flex items-center gap-1">
                        <Package className="h-4 w-4" />
                        Deliveries
                      </span>
                      <span className="font-medium">{0}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground flex items-center gap-1">
                        <Star className="h-4 w-4" />
                        Rating
                      </span>
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        <span className="font-medium">5.0</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2 mt-4 pt-4 border-t">
                    <Button variant="outline" size="sm" className="flex-1">
                      View Profile
                    </Button>
                    <Button variant="outline" size="sm" className="flex-1">
                      Assign Task
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default DriverManagement;
