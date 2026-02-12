import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  CheckCircle2,
  Download,
  Package,
  Eye,
  Home,
  Plus,
} from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";

const mockCreatedOrders = [
  {
    orderId: "FF10001",
    awb: "AWB1234567890",
    pickup: "Mumbai",
    delivery: "Delhi",
    carrier: "BlueDart",
  },
  {
    orderId: "FF10002",
    awb: "AWB1234567891",
    pickup: "Bangalore",
    delivery: "Chennai",
    carrier: "Delhivery",
  },
  {
    orderId: "FF10003",
    awb: "AWB1234567892",
    pickup: "Hyderabad",
    delivery: "Pune",
    carrier: "FedEx",
  },
  {
    orderId: "FF10004",
    awb: "AWB1234567893",
    pickup: "Kolkata",
    delivery: "Jaipur",
    carrier: "DTDC",
  },
  {
    orderId: "FF10005",
    awb: "AWB1234567894",
    pickup: "Ahmedabad",
    delivery: "Surat",
    carrier: "BlueDart",
  },
];

const BulkSuccess = () => {
  const navigate = useNavigate();

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-6">
          {/* Success Animation */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 15 }}
            className="text-center mb-8"
          >
            <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-green-100 mb-4">
              <CheckCircle2 className="h-12 w-12 text-green-600" />
            </div>
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-3xl font-bold mb-2"
            >
              Bulk Upload Successful!
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-muted-foreground"
            >
              42 orders have been created successfully
            </motion.p>
          </motion.div>

          {/* Summary Cards */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8"
          >
            <Card>
              <CardContent className="pt-6 text-center">
                <p className="text-2xl font-bold text-green-600">42</p>
                <p className="text-sm text-muted-foreground">Orders Created</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 text-center">
                <p className="text-2xl font-bold">₹10,458</p>
                <p className="text-sm text-muted-foreground">Total Shipping</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 text-center">
                <p className="text-2xl font-bold">4</p>
                <p className="text-sm text-muted-foreground">Carriers Used</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 text-center">
                <p className="text-2xl font-bold">126 kg</p>
                <p className="text-sm text-muted-foreground">Total Weight</p>
              </CardContent>
            </Card>
          </motion.div>

          {/* Order List Preview */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Package className="h-5 w-5 text-primary" />
                    Created Orders (Preview)
                  </CardTitle>
                  <Button variant="outline" size="sm">
                    <Download className="h-4 w-4 mr-2" /> Download All AWBs
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Order ID</TableHead>
                      <TableHead>AWB Number</TableHead>
                      <TableHead>Route</TableHead>
                      <TableHead>Carrier</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {mockCreatedOrders.map((order) => (
                      <TableRow key={order.orderId}>
                        <TableCell className="font-medium">
                          {order.orderId}
                        </TableCell>
                        <TableCell className="font-mono text-sm">
                          {order.awb}
                        </TableCell>
                        <TableCell>
                          {order.pickup} → {order.delivery}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{order.carrier}</Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              navigate(`/shipment/${order.orderId}`)
                            }
                          >
                            <Eye className="h-4 w-4 mr-1" /> View
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                <div className="text-center py-4 border-t mt-4">
                  <Button
                    variant="link"
                    onClick={() => navigate("/shipments")}
                  >
                    View all 42 orders →
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Action Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="flex flex-col sm:flex-row gap-3 mt-8"
          >
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => navigate("/dashboard")}
            >
              <Home className="h-4 w-4 mr-2" /> Go to Dashboard
            </Button>
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => navigate("/shipments")}
            >
              <Eye className="h-4 w-4 mr-2" /> View All Shipments
            </Button>
            <Button
              className="flex-1 gradient-primary"
              onClick={() => navigate("/bulk/upload")}
            >
              <Plus className="h-4 w-4 mr-2" /> Upload More Orders
            </Button>
          </motion.div>
      </div>
    </DashboardLayout>
  );
};

export default BulkSuccess;
