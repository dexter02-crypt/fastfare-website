import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import DashboardLayout from "@/components/DashboardLayout";
import { API_BASE_URL } from "@/config";
import {
  RotateCcw, Package, Clock, CheckCircle, Plus,
  Search, Loader2
} from "lucide-react";

interface RTDItem {
  _id: string;
  rtdId: string;
  shipmentId: string;
  reasonCode: string;
  status: string;
  createdAt: string;
  description?: string;
}

const REASON_LABELS: Record<string, string> = {
  CUSTOMER_NA: "Customer Not Available",
  ADDRESS_ISSUE: "Address Issue",
  REFUSED: "Customer Refused",
  FAILED_ATTEMPTS: "Failed Delivery Attempts",
  DAMAGED: "Package Damaged",
  REGULATORY: "Regulatory Issue",
  RESCHEDULED: "Rescheduled",
  UNSERVICEABLE: "Unserviceable Area",
  OTHER: "Other",
};

const ReturnsDashboard = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [returns, setReturns] = useState<RTDItem[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchReturns();
  }, []);

  const fetchReturns = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE_URL}/api/wms/rtd`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setReturns(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error("Error fetching returns:", err);
    } finally {
      setLoading(false);
    }
  };

  const total = returns.length;
  const pending = returns.filter(r => r.status === "reported").length;
  const inTransit = returns.filter(r => ["received_at_depot", "analyzed"].includes(r.status)).length;
  const completed = returns.filter(r => ["restocked", "rescheduled", "discarded"].includes(r.status)).length;

  const stats = [
    { label: "Total Returns", value: total.toString(), icon: RotateCcw },
    { label: "Pending", value: pending.toString(), icon: Clock },
    { label: "In Progress", value: inTransit.toString(), icon: Package },
    { label: "Completed", value: completed.toString(), icon: CheckCircle },
  ];

  const filtered = returns.filter(item =>
    !searchQuery ||
    item.rtdId?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.shipmentId?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusBadge = (status: string) => {
    const map: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
      reported: { label: "Reported", variant: "default" },
      received_at_depot: { label: "At Depot", variant: "secondary" },
      analyzed: { label: "Analyzed", variant: "secondary" },
      restocked: { label: "Restocked", variant: "outline" },
      rescheduled: { label: "Rescheduled", variant: "outline" },
      discarded: { label: "Discarded", variant: "destructive" },
    };
    const s = map[status] || { label: status, variant: "outline" as const };
    return <Badge variant={s.variant}>{s.label}</Badge>;
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Returns Management</h1>
            <p className="text-muted-foreground">Manage return requests and RTO shipments</p>
          </div>
          <Button className="gap-2 gradient-primary" onClick={() => navigate("/shipments")}>
            <Plus className="h-4 w-4" />
            Create Return
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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

        {/* Search */}
        <Card>
          <CardContent className="pt-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by Return ID, AWB..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </CardContent>
        </Card>

        {/* Returns Table */}
        <Card>
          <CardHeader>
            <CardTitle>Return Requests</CardTitle>
            <CardDescription>All return and RTO shipments</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Return ID</TableHead>
                    <TableHead>Shipment / AWB</TableHead>
                    <TableHead>Reason</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((item) => (
                    <TableRow key={item._id}>
                      <TableCell className="font-medium font-mono text-sm">{item.rtdId}</TableCell>
                      <TableCell className="font-mono text-sm">{item.shipmentId}</TableCell>
                      <TableCell>{REASON_LABELS[item.reasonCode] || item.reasonCode}</TableCell>
                      <TableCell>{getStatusBadge(item.status)}</TableCell>
                      <TableCell>{new Date(item.createdAt).toLocaleDateString("en-IN")}</TableCell>
                    </TableRow>
                  ))}
                  {filtered.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-12 text-muted-foreground">
                        <RotateCcw className="h-10 w-10 mx-auto mb-3 text-muted-foreground/50" />
                        <p className="font-medium">No return requests found</p>
                        <p className="text-sm mt-1">Return requests will appear here when created from shipment details.</p>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default ReturnsDashboard;
