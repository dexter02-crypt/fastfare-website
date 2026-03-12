import { useState, useEffect } from "react";
import { API_BASE_URL } from "@/config";
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import DashboardLayout from "@/components/DashboardLayout";
import { Search, Download, FileText, CheckCircle, Clock, Printer, FileSpreadsheet } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { generateTaxInvoiceHTML, generateManifestHTML as generateManifestDoc } from "@/utils/documentGenerators";

interface Invoice {
    id: string;
    period: string;
    amount: string;
    status: string;
    dueDate: string;
    date: string;
}

// Render will use state variable instead

const InvoicesPage = () => {
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchInvoices = async () => {
            try {
                const token = localStorage.getItem("token");
                const res = await fetch(`${API_BASE_URL}/api/billing/invoices`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                const data = await res.json();
                if (Array.isArray(data)) {
                    const formatted = data.map(inv => ({
                        id: inv.invoiceNo,
                        period: new Date(inv.date).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
                        amount: `₹${inv.amount}`,
                        status: inv.status,
                        dueDate: "N/A", // Not provided by backend, COD is paid on delivery, Paid is paid.
                        date: new Date(inv.date).toLocaleDateString()
                    }));
                    setInvoices(formatted);
                }
            } catch (error) {
                console.error("Failed to fetch invoices:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchInvoices();
    }, []);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
    const [showInvoiceDialog, setShowInvoiceDialog] = useState(false);

    const filteredInvoices = invoices.filter(inv =>
        inv.id.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleDownloadInvoice = (inv: Invoice) => {
        setSelectedInvoice(inv);
        // Convert billing invoice to shipment format for the generator
        const shipmentData = {
            awb: inv.id,
            shippingCost: parseInt(inv.amount.replace(/[₹,]/g, '')) || 0,
            createdAt: inv.date,
            status: inv.status.toLowerCase() === 'paid' ? 'delivered' : 'pending',
            serviceType: 'Standard',
            carrier: 'FastFare',
        };
        const userData = {
            businessName: 'Business Customer',
            email: '',
        };
        const win = window.open('', '_blank');
        if (win) {
            win.document.write(generateTaxInvoiceHTML(shipmentData, userData));
            win.document.close();
        }
    };

    const handlePrintInvoice = (inv: Invoice) => {
        setSelectedInvoice(inv);
        const shipmentData = {
            awb: inv.id,
            shippingCost: parseInt(inv.amount.replace(/[₹,]/g, '')) || 0,
            createdAt: inv.date,
            status: inv.status.toLowerCase() === 'paid' ? 'delivered' : 'pending',
            serviceType: 'Standard',
            carrier: 'FastFare',
        };
        const userData = {
            businessName: 'Business Customer',
            email: '',
        };
        const win = window.open('', '_blank');
        if (win) {
            win.document.write(generateTaxInvoiceHTML(shipmentData, userData));
            win.document.close();
            setTimeout(() => win.print(), 500);
        }
    };

    const handleDownloadManifest = () => {
        const win = window.open('', '_blank');
        if (win) {
            win.document.write(generateManifestDoc([], 'Business Customer', 'FastFare Logistics'));
            win.document.close();
        }
    };

    return (
        <DashboardLayout>
            <div className="space-y-6">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h1 className="text-3xl font-bold">Invoices</h1>
                        <p className="text-muted-foreground">View and download your monthly invoices</p>
                    </div>
                    <Button variant="outline" className="gap-2" onClick={handleDownloadManifest}>
                        <FileSpreadsheet className="h-4 w-4" />
                        Download Manifest
                    </Button>
                </div>

                <Card>
                    <CardHeader>
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                            <CardTitle>Invoice History</CardTitle>
                            <div className="relative w-full sm:w-64">
                                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search invoices..."
                                    className="pl-9 w-full"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="p-0 sm:p-6 table-responsive-wrapper">
                        <span className="scroll-hint px-4 pt-4 pb-2 block sm:hidden">Scroll right to view all columns →</span>
                        <div className="min-w-[700px]">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Invoice ID</TableHead>
                                        <TableHead>Date</TableHead>
                                        <TableHead>Billing Period</TableHead>
                                        <TableHead>Due Date</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead className="text-right">Amount</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredInvoices.map((inv) => (
                                        <TableRow key={inv.id}>
                                            <TableCell className="font-medium flex items-center gap-2">
                                                <FileText className="h-4 w-4 text-muted-foreground" />
                                                {inv.id}
                                            </TableCell>
                                            <TableCell>{inv.date}</TableCell>
                                            <TableCell>{inv.period}</TableCell>
                                            <TableCell>{inv.dueDate}</TableCell>
                                            <TableCell>
                                                <Badge variant={inv.status === "Paid" ? "default" : "secondary"} className={inv.status === "Paid" ? "bg-green-500 hover:bg-green-600" : ""}>
                                                    {inv.status === "Paid" ? <CheckCircle className="h-3 w-3 mr-1" /> : <Clock className="h-3 w-3 mr-1" />}
                                                    {inv.status}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right font-semibold">{inv.amount}</TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex items-center justify-end gap-1">
                                                    <Button variant="ghost" size="sm" title="Download Invoice" onClick={() => handleDownloadInvoice(inv)}>
                                                        <Download className="h-4 w-4" />
                                                    </Button>
                                                    <Button variant="ghost" size="sm" title="Print Invoice" onClick={() => handlePrintInvoice(inv)}>
                                                        <Printer className="h-4 w-4" />
                                                    </Button>
                                                    <Button variant="ghost" size="sm" title="View Details" onClick={() => {
                                                        setSelectedInvoice(inv);
                                                        setShowInvoiceDialog(true);
                                                    }}>
                                                        <FileText className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>

                {/* Invoice Detail Dialog */}
                <Dialog open={showInvoiceDialog} onOpenChange={setShowInvoiceDialog}>
                    <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle>Invoice Details</DialogTitle>
                        </DialogHeader>
                        {selectedInvoice && (
                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-sm text-muted-foreground">Invoice ID</p>
                                        <p className="font-semibold">{selectedInvoice.id}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-muted-foreground">Date</p>
                                        <p className="font-semibold">{selectedInvoice.date}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-muted-foreground">Billing Period</p>
                                        <p className="font-semibold">{selectedInvoice.period}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-muted-foreground">Status</p>
                                        <Badge className={selectedInvoice.status === "Paid" ? "bg-green-500 hover:bg-green-600" : "bg-yellow-500 hover:bg-yellow-600"}>
                                            {selectedInvoice.status}
                                        </Badge>
                                    </div>
                                </div>
                                <Separator />
                                <div className="flex justify-between items-center">
                                    <div>
                                        <p className="text-sm text-muted-foreground">Total Amount</p>
                                        <p className="text-3xl font-bold text-primary">{selectedInvoice.amount}</p>
                                    </div>
                                    <div className="flex gap-2">
                                        <Button variant="outline" onClick={() => handlePrintInvoice(selectedInvoice)}>
                                            <Printer className="h-4 w-4 mr-2" /> Print
                                        </Button>
                                        <Button onClick={() => handleDownloadInvoice(selectedInvoice)}>
                                            <Download className="h-4 w-4 mr-2" /> Download
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </DialogContent>
                </Dialog>
            </div>
        </DashboardLayout>
    );
};

export default InvoicesPage;
