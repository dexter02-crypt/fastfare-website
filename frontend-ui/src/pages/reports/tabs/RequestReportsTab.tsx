import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Info, Download, Clock, AlertCircle } from "lucide-react";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

const RequestReportsTab = () => {
    const [activeRequest, setActiveRequest] = useState<string | null>(null);

    const reportCategories = [
        {
            title: "FULFILMENT REPORTS",
            colorClass: "text-orange-700",
            badgeClass: "bg-orange-100 text-orange-700",
            btnClass: "bg-orange-600 hover:bg-orange-700 text-white",
            reports: [
                { id: "f1", name: "Orders Report", desc: "All orders — AWB, route, weight, zone, all charges, IGST, status. 35 columns.", btn: "bg-orange-600 hover:bg-orange-700" },
                { id: "f2", name: "Pickup Report", desc: "Pickup handover status for each order — picked up, re-attempt, timestamp.", btn: "bg-blue-900 hover:bg-blue-950" },
                { id: "f3", name: "Returns / RTO Report", desc: "All RTO orders — reason, charges, COD impact, return tracking status.", btn: "bg-orange-600 hover:bg-orange-700" },
                { id: "f4", name: "Weight Anomaly Report", desc: "Orders with weight discrepancy — declared vs scanned, extra charges raised.", btn: "bg-yellow-700 hover:bg-yellow-800" },
            ]
        },
        {
            title: "PAYMENT REPORTS",
            colorClass: "text-green-700",
            badgeClass: "bg-green-100 text-green-700",
            btnClass: "bg-green-600 hover:bg-green-700 text-white",
            reports: [
                { id: "p1", name: "Settlement Report", desc: "All settled transactions — freight, COD remittances, debits/credits.", btn: "bg-green-600 hover:bg-green-700" },
                { id: "p2", name: "COD Remittance Report", desc: "COD cash flow — collected by partner, deducted, net remitted to your bank.", btn: "bg-yellow-700 hover:bg-yellow-800" },
                { id: "p3", name: "P&L Report", desc: "Your profit & loss — product revenue vs logistics cost vs net margin per order.", btn: "bg-purple-600 hover:bg-purple-700" },
                { id: "p4", name: "Financial Year Report", desc: "All settled transactions for FY — for CA and annual accounts.", btn: "bg-blue-900 hover:bg-blue-950" },
            ]
        },
        {
            title: "TAX REPORTS",
            colorClass: "text-purple-700",
            badgeClass: "bg-purple-100 text-purple-700",
            btnClass: "bg-purple-600 hover:bg-purple-700 text-white",
            reports: [
                { id: "t1", name: "GSTR Report (ITC)", desc: "Invoice-wise IGST — for claiming ITC in GSTR-3B. FastFare GSTIN + SAC included.", btn: "bg-purple-600 hover:bg-purple-700" },
                { id: "t2", name: "Sales Report", desc: "Your shipments as sales register — for your own GSTR-1 outward supply filing.", btn: "bg-purple-600 hover:bg-purple-700" },
                { id: "t3", name: "TDS Report", desc: "TDS on your account (if applicable) — for Income Tax return filing.", btn: "bg-purple-600 hover:bg-purple-700" },
            ]
        },
        {
            title: "INVOICES REPORTS",
            colorClass: "text-blue-700",
            badgeClass: "bg-blue-100 text-blue-700",
            btnClass: "bg-blue-600 hover:bg-blue-700 text-white",
            reports: [
                { id: "i1", name: "Commission Invoice Details", desc: "All invoice transactions — order-level detail for each charge line item.", btn: "bg-blue-600 hover:bg-blue-700" },
            ]
        }
    ];

    const generatedReports = [
        { id: "1", type: "Orders Report", dateRange: "01 Mar 2026 – 15 Mar 2026", requestedOn: "15 Mar 2026, 14:30", status: "Ready" },
        { id: "2", type: "GSTR Report (ITC)", dateRange: "01 Feb 2026 – 28 Feb 2026", requestedOn: "10 Mar 2026, 09:15", status: "Ready" },
        { id: "3", type: "Settlement Report", dateRange: "01 Jan 2026 – 31 Jan 2026", requestedOn: "05 Feb 2026, 11:00", status: "Expired" },
    ];

    const getStatusBadge = (status: string) => {
        switch (status) {
            case "Generating": return <Badge className="bg-yellow-100 text-yellow-800">Generating</Badge>;
            case "Ready": return <Badge className="bg-green-100 text-green-800">Ready</Badge>;
            case "Expired": return <Badge className="bg-gray-100 text-gray-500">Expired</Badge>;
            default: return null;
        }
    };

    return (
        <div className="space-y-8 mt-6 pb-12">
            <div className="flex flex-col items-center justify-center py-[80px] px-4 text-center">
                <Clock className="h-20 w-20 text-blue-400 mb-6" />
                <h2 className="text-3xl font-bold mb-4">Coming Soon</h2>
                <p className="text-muted-foreground max-w-lg mb-4">
                    Custom report generation is currently being built. You'll be able to request detailed fulfilment, payment, tax, and invoice reports very soon.
                </p>
                <p className="text-sm text-muted-foreground/60">
                    Check back soon — we'll notify you when this feature goes live.
                </p>
            </div>

            {false && (
                <>
            <div>
                <h2 className="text-xl font-bold">Request Reports — All Types</h2>
                <div className="mt-2 flex items-start gap-2 bg-blue-50 border border-blue-200 text-blue-800 p-3 rounded-md text-sm">
                    <Info className="h-5 w-5 shrink-0 text-blue-600" />
                    <p>
                        All reports are generated fresh on request. Download available for 7 days. Date ranges over 3 months may take 10–15 minutes.
                    </p>
                </div>
            </div>

            <div className="space-y-8">
                {reportCategories.map((category) => (
                    <div key={category.title} className="space-y-4">
                        <h3 className={`text-sm font-bold tracking-widest ${category.colorClass}`}>{category.title}</h3>
                        <div className="grid gap-3">
                            {category.reports.map((report, index) => (
                                <Card key={report.id} className="border shadow-sm hover:shadow-md transition-shadow">
                                    <CardContent className="p-4 sm:p-5">
                                        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                                            <div className="flex items-start gap-3 w-full">
                                                <div className={`mt-0.5 shrink-0 flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${category.badgeClass}`}>
                                                    {index + 1}
                                                </div>
                                                <div className="flex-1">
                                                    <p className="font-bold text-base">{report.name}</p>
                                                    <p className="text-sm text-gray-500 mt-1 leading-snug">{report.desc}</p>
                                                </div>
                                            </div>

                                            {activeRequest !== report.id && (
                                                <div className="sm:shrink-0 w-full sm:w-auto">
                                                    <Button
                                                        className={`w-full text-white ${report.btn}`}
                                                        onClick={() => setActiveRequest(report.id)}
                                                    >
                                                        <Download className="h-4 w-4 mr-2" /> Request
                                                    </Button>
                                                </div>
                                            )}
                                        </div>

                                        {/* Inline Expanded Area for Request Form */}
                                        {activeRequest === report.id && (
                                            <div className="mt-4 pt-4 border-t border-gray-100 animate-in fade-in slide-in-from-top-2 duration-200">
                                                <div className="bg-muted/30 p-4 rounded-lg flex flex-col sm:flex-row gap-4 items-end">
                                                    <div className="flex-1 space-y-1.5 w-full">
                                                        <label className="text-xs font-semibold text-muted-foreground">Date Range (From - To)</label>
                                                        <div className="flex gap-2">
                                                            <Input type="date" className="h-9" />
                                                            <Input type="date" className="h-9" />
                                                        </div>
                                                    </div>
                                                    <div className="flex-1 space-y-1.5 w-full">
                                                        <label className="text-xs font-semibold text-muted-foreground">Delivery Email</label>
                                                        <Input type="email" defaultValue="user@fastfare.com" className="h-9" />
                                                    </div>
                                                    <div className="flex gap-2 w-full sm:w-auto mt-2 sm:mt-0">
                                                        <Button variant="ghost" onClick={() => setActiveRequest(null)}>Cancel</Button>
                                                        <Button className={category.btnClass}>Generate &amp; Download</Button>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </div>
                ))}
            </div>

            <div className="pt-8 border-t">
                <h3 className="text-lg font-bold mb-4">My Generated Reports</h3>
                <Card className="border shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <Table className="whitespace-nowrap min-w-full">
                            <TableHeader className="bg-muted/50">
                                <TableRow>
                                    <TableHead>Report Type</TableHead>
                                    <TableHead>Date Range</TableHead>
                                    <TableHead>Requested On</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Action</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {generatedReports.map((report) => (
                                    <TableRow key={report.id}>
                                        <TableCell className="font-semibold">{report.type}</TableCell>
                                        <TableCell className="text-muted-foreground text-sm">{report.dateRange}</TableCell>
                                        <TableCell className="text-muted-foreground text-sm">
                                            <div className="flex items-center gap-1.5">
                                                <Clock className="h-3 w-3" />
                                                {report.requestedOn}
                                            </div>
                                        </TableCell>
                                        <TableCell>{getStatusBadge(report.status)}</TableCell>
                                        <TableCell className="text-right">
                                            <Button variant="outline" size="sm" disabled={report.status !== "Ready"}>
                                                <Download className="h-4 w-4 mr-2" /> Download
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </Card>
                <p className="text-sm text-muted-foreground mt-2 flex items-center gap-1">
                    <AlertCircle className="h-4 w-4" /> Downloads expire after 7 days.
                </p>
            </div>

                </>
            )}
        </div>
    );
};

export default RequestReportsTab;
