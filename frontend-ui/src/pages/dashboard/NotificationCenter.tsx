import { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import {
  Bell, Package, Truck, AlertTriangle, CheckCircle, Info, Clock,
  Trash2, CheckCheck, Filter, Settings
} from "lucide-react";

const notifications: { id: number; type: string; title: string; message: string; time: string; read: boolean; icon: typeof CheckCircle; color: string }[] = [];

const NotificationCenter = () => {
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [filter, setFilter] = useState("all");

  const filteredNotifications = notifications.filter((n) => {
    if (filter === "all") return true;
    if (filter === "unread") return !n.read;
    return n.type === filter;
  });

  const toggleSelect = (id: number) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const selectAll = () => {
    if (selectedIds.length === filteredNotifications.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredNotifications.map((n) => n.id));
    }
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container py-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              Notifications
              {unreadCount > 0 && (
                <Badge className="text-lg px-3">{unreadCount}</Badge>
              )}
            </h1>
            <p className="text-muted-foreground">Stay updated with your shipments and account</p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" className="gap-2">
              <Settings className="h-4 w-4" />
              Settings
            </Button>
            <Button variant="outline" className="gap-2">
              <CheckCheck className="h-4 w-4" />
              Mark all read
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Filters Sidebar */}
          <Card className="lg:col-span-1 h-fit">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Filter className="h-4 w-4" />
                Filters
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {[
                { label: "All Notifications", value: "all", count: notifications.length },
                { label: "Unread", value: "unread", count: unreadCount },
                { label: "Shipments", value: "shipment", count: notifications.filter((n) => n.type === "shipment").length },
                { label: "Alerts", value: "alert", count: notifications.filter((n) => n.type === "alert").length },
                { label: "Billing", value: "billing", count: notifications.filter((n) => n.type === "billing").length },
                { label: "System", value: "system", count: notifications.filter((n) => n.type === "system").length },
              ].map((item) => (
                <button
                  key={item.value}
                  onClick={() => setFilter(item.value)}
                  className={`w-full flex items-center justify-between p-3 rounded-lg text-left transition-colors ${filter === item.value ? "bg-primary/10 text-primary" : "hover:bg-muted"
                    }`}
                >
                  <span className="text-sm font-medium">{item.label}</span>
                  <Badge variant="secondary">{item.count}</Badge>
                </button>
              ))}
            </CardContent>
          </Card>

          {/* Notifications List */}
          <div className="lg:col-span-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div className="flex items-center gap-4">
                  <Checkbox
                    checked={selectedIds.length === filteredNotifications.length && filteredNotifications.length > 0}
                    onCheckedChange={selectAll}
                  />
                  <CardTitle className="text-base">
                    {selectedIds.length > 0
                      ? `${selectedIds.length} selected`
                      : `${filteredNotifications.length} notifications`}
                  </CardTitle>
                </div>
                {selectedIds.length > 0 && (
                  <div className="flex gap-2">
                    <Button variant="ghost" size="sm" className="gap-2">
                      <CheckCheck className="h-4 w-4" />
                      Mark read
                    </Button>
                    <Button variant="ghost" size="sm" className="gap-2 text-red-500">
                      <Trash2 className="h-4 w-4" />
                      Delete
                    </Button>
                  </div>
                )}
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {filteredNotifications.map((notification, index) => (
                    <motion.div
                      key={notification.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className={`flex items-start gap-4 p-4 rounded-lg border transition-colors cursor-pointer ${notification.read ? "bg-background" : "bg-primary/5 border-primary/20"
                        } hover:bg-muted/50`}
                    >
                      <Checkbox
                        checked={selectedIds.includes(notification.id)}
                        onCheckedChange={() => toggleSelect(notification.id)}
                        onClick={(e) => e.stopPropagation()}
                      />
                      <div className={`h-10 w-10 rounded-full flex items-center justify-center shrink-0 ${notification.read ? "bg-muted" : "bg-primary/10"
                        }`}>
                        <notification.icon className={`h-5 w-5 ${notification.color}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className={`font-medium ${!notification.read && "text-foreground"}`}>
                              {notification.title}
                            </p>
                            <p className="text-sm text-muted-foreground mt-1">
                              {notification.message}
                            </p>
                          </div>
                          {!notification.read && (
                            <div className="h-2 w-2 rounded-full bg-primary shrink-0 mt-2" />
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {notification.time}
                        </p>
                      </div>
                    </motion.div>
                  ))}

                  {filteredNotifications.length === 0 && (
                    <div className="text-center py-12">
                      <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-lg font-medium">No notifications</p>
                      <p className="text-sm text-muted-foreground">You're all caught up!</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default NotificationCenter;
