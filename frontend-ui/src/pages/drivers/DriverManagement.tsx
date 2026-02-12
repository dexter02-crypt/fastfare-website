import { useState } from "react";
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

const stats = [
  { label: "Total Drivers", value: "156", icon: User },
  { label: "Active Now", value: "89", icon: Truck },
  { label: "On Delivery", value: "45", icon: Package },
  { label: "Available", value: "44", icon: CheckCircle },
];

const drivers = [
  { id: 1, name: "Rahul Sharma", phone: "+91 98765 43210", status: "On Delivery", vehicle: "Tata Ace", rating: 4.8, deliveries: 1234, location: "Mumbai" },
  { id: 2, name: "Amit Kumar", phone: "+91 98765 43211", status: "Available", vehicle: "Mahindra Bolero", rating: 4.6, deliveries: 987, location: "Delhi" },
  { id: 3, name: "Vijay Singh", phone: "+91 98765 43212", status: "On Delivery", vehicle: "Tata 407", rating: 4.9, deliveries: 2345, location: "Bangalore" },
  { id: 4, name: "Suresh Patel", phone: "+91 98765 43213", status: "Offline", vehicle: "Ashok Leyland", rating: 4.5, deliveries: 567, location: "Chennai" },
  { id: 5, name: "Manoj Verma", phone: "+91 98765 43214", status: "Available", vehicle: "Eicher Pro", rating: 4.7, deliveries: 890, location: "Pune" },
];

const DriverManagement = () => {
  const [searchQuery, setSearchQuery] = useState("");

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
          {stats.map((stat, index) => (
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {drivers.map((driver, index) => (
            <motion.div
              key={driver.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="hover:border-primary transition-colors cursor-pointer">
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-4">
                      <Avatar className="h-14 w-14">
                        <AvatarFallback>{driver.name.split(" ").map(n => n[0]).join("")}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-semibold">{driver.name}</p>
                        <p className="text-sm text-muted-foreground flex items-center gap-1">
                          <Phone className="h-3 w-3" />
                          {driver.phone}
                        </p>
                      </div>
                    </div>
                    <Badge
                      variant={
                        driver.status === "Available" ? "default" :
                        driver.status === "On Delivery" ? "secondary" : "outline"
                      }
                    >
                      {driver.status}
                    </Badge>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground flex items-center gap-1">
                        <Truck className="h-4 w-4" />
                        Vehicle
                      </span>
                      <span className="font-medium">{driver.vehicle}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground flex items-center gap-1">
                        <MapPin className="h-4 w-4" />
                        Location
                      </span>
                      <span className="font-medium">{driver.location}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground flex items-center gap-1">
                        <Package className="h-4 w-4" />
                        Deliveries
                      </span>
                      <span className="font-medium">{driver.deliveries.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground flex items-center gap-1">
                        <Star className="h-4 w-4" />
                        Rating
                      </span>
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        <span className="font-medium">{driver.rating}</span>
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
      </div>
    </DashboardLayout>
  );
};

export default DriverManagement;
