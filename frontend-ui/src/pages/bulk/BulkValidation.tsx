import { useState } from "react";
import { useNavigate } from "react-router-dom";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowLeft,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Download,
  ArrowRight,
} from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";

const mockValidationResults = {
  total: 50,
  valid: 42,
  errors: 5,
  warnings: 3,
  records: [
    {
      row: 1,
      orderId: "ORD001",
      pickup: "Mumbai",
      delivery: "Delhi",
      status: "valid",
      message: null,
    },
    {
      row: 2,
      orderId: "ORD002",
      pickup: "Bangalore",
      delivery: "Chennai",
      status: "valid",
      message: null,
    },
    {
      row: 3,
      orderId: "ORD003",
      pickup: "Hyderabad",
      delivery: "Pune",
      status: "error",
      message: "Invalid PIN code: 99999",
    },
    {
      row: 4,
      orderId: "ORD004",
      pickup: "Kolkata",
      delivery: "Jaipur",
      status: "warning",
      message: "Phone number format may be incorrect",
    },
    {
      row: 5,
      orderId: "ORD005",
      pickup: "Ahmedabad",
      delivery: "Surat",
      status: "valid",
      message: null,
    },
    {
      row: 6,
      orderId: "ORD006",
      pickup: "Mumbai",
      delivery: "",
      status: "error",
      message: "Missing delivery address",
    },
    {
      row: 7,
      orderId: "ORD007",
      pickup: "Delhi",
      delivery: "Noida",
      status: "valid",
      message: null,
    },
    {
      row: 8,
      orderId: "ORD008",
      pickup: "Chennai",
      delivery: "Coimbatore",
      status: "warning",
      message: "COD amount exceeds limit",
    },
    {
      row: 9,
      orderId: "",
      pickup: "Pune",
      delivery: "Mumbai",
      status: "error",
      message: "Missing Order ID",
    },
    {
      row: 10,
      orderId: "ORD010",
      pickup: "Bangalore",
      delivery: "Mysore",
      status: "valid",
      message: null,
    },
  ],
};

const BulkValidation = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("all");

  const filteredRecords = mockValidationResults.records.filter((record) => {
    if (activeTab === "all") return true;
    if (activeTab === "errors") return record.status === "error";
    if (activeTab === "warnings") return record.status === "warning";
    return record.status === "valid";
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "valid":
        return (
          <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50">
            <CheckCircle className="h-3 w-3 mr-1" /> Valid
          </Badge>
        );
      case "error":
        return (
          <Badge variant="destructive">
            <XCircle className="h-3 w-3 mr-1" /> Error
          </Badge>
        );
      case "warning":
        return (
          <Badge variant="secondary" className="text-yellow-700 bg-yellow-100">
            <AlertTriangle className="h-3 w-3 mr-1" /> Warning
          </Badge>
        );
      default:
        return null;
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
          {/* Page Header */}
          <div className="flex items-center gap-4 mb-8">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/bulk/upload")}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold">Validation Results</h1>
              <p className="text-muted-foreground">
                Review and fix errors before processing
              </p>
            </div>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-3xl font-bold">{mockValidationResults.total}</p>
                  <p className="text-sm text-muted-foreground">Total Records</p>
                </div>
              </CardContent>
            </Card>
            <Card className="border-green-200 bg-green-50/50">
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-3xl font-bold text-green-600">
                    {mockValidationResults.valid}
                  </p>
                  <p className="text-sm text-green-600/70">Valid Records</p>
                </div>
              </CardContent>
            </Card>
            <Card className="border-red-200 bg-red-50/50">
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-3xl font-bold text-red-600">
                    {mockValidationResults.errors}
                  </p>
                  <p className="text-sm text-red-600/70">Errors</p>
                </div>
              </CardContent>
            </Card>
            <Card className="border-yellow-200 bg-yellow-50/50">
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-3xl font-bold text-yellow-600">
                    {mockValidationResults.warnings}
                  </p>
                  <p className="text-sm text-yellow-600/70">Warnings</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Validation Table */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Record Details</CardTitle>
                <Button variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-2" /> Download Report
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList>
                  <TabsTrigger value="all">
                    All ({mockValidationResults.total})
                  </TabsTrigger>
                  <TabsTrigger value="valid">
                    Valid ({mockValidationResults.valid})
                  </TabsTrigger>
                  <TabsTrigger value="errors">
                    Errors ({mockValidationResults.errors})
                  </TabsTrigger>
                  <TabsTrigger value="warnings">
                    Warnings ({mockValidationResults.warnings})
                  </TabsTrigger>
                </TabsList>

                <div className="mt-4">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Row</TableHead>
                        <TableHead>Order ID</TableHead>
                        <TableHead>Pickup</TableHead>
                        <TableHead>Delivery</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Message</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredRecords.map((record) => (
                        <TableRow key={record.row}>
                          <TableCell className="font-mono text-sm">
                            {record.row}
                          </TableCell>
                          <TableCell className="font-medium">
                            {record.orderId || "-"}
                          </TableCell>
                          <TableCell>{record.pickup || "-"}</TableCell>
                          <TableCell>{record.delivery || "-"}</TableCell>
                          <TableCell>{getStatusBadge(record.status)}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {record.message || "-"}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </Tabs>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex justify-between mt-6">
            <Button variant="outline" onClick={() => navigate("/bulk/upload")}>
              <ArrowLeft className="h-4 w-4 mr-2" /> Upload New File
            </Button>
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => navigate("/bulk/upload")}
              >
                Fix Errors & Re-upload
              </Button>
              <Button
                className="gradient-primary"
                onClick={() => navigate("/bulk/processing")}
                disabled={mockValidationResults.errors > 0}
              >
                Process {mockValidationResults.valid} Orders
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </div>

          {mockValidationResults.errors > 0 && (
            <p className="text-sm text-muted-foreground text-right mt-2">
              Please fix all errors before processing
            </p>
          )}
      </div>
    </DashboardLayout>
  );
};

export default BulkValidation;
