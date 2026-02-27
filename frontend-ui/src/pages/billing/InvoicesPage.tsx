import { useState } from "react";
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

const invoices: Invoice[] = [];

const InvoicesPage = () => {
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
                        <div className="flex items-center justify-between">
                            <CardTitle>Invoice History</CardTitle>
                            <div className="relative w-64">
                                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search invoices..."
                                    className="pl-9"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
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
