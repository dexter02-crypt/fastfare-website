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
        const win = window.open('', '_blank');
        if (win) {
            win.document.write(generateInvoiceHTML(inv));
            win.document.close();
        }
    };

    const handlePrintInvoice = (inv: Invoice) => {
        setSelectedInvoice(inv);
        const win = window.open('', '_blank');
        if (win) {
            win.document.write(generateInvoiceHTML(inv));
            win.document.close();
            setTimeout(() => win.print(), 500);
        }
    };

    const handleDownloadManifest = () => {
        const win = window.open('', '_blank');
        if (win) {
            win.document.write(generateManifestHTML());
            win.document.close();
        }
    };

    const generateInvoiceHTML = (inv: Invoice) => `
        <!DOCTYPE html>
        <html>
            <head>
                <title>Invoice ${inv.id}</title>
                <style>
                    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 40px; color: #333; line-height: 1.6; }
                    .header { display: flex; justify-content: space-between; border-bottom: 2px solid #e5e7eb; padding-bottom: 20px; margin-bottom: 30px; }
                    .logo { font-size: 28px; font-weight: bold; color: #6366f1; }
                    .invoice-details { text-align: right; }
                    .invoice-details h1 { margin: 0; color: #1f2937; font-size: 32px; }
                    .invoice-details p { margin: 5px 0; color: #6b7280; }
                    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-bottom: 40px; }
                    .section-title { font-weight: 600; color: #374151; margin-bottom: 10px; }
                    .table { width: 100%; margin-top: 20px; border-collapse: collapse; }
                    .table th { text-align: left; background: #f9fafb; padding: 12px; border-bottom: 2px solid #e5e7eb; color: #374151; font-weight: 600; }
                    .table td { padding: 12px; border-bottom: 1px solid #e5e7eb; }
                    .total-section { margin-top: 40px; text-align: right; }
                    .total-row { display: flex; justify-content: flex-end; gap: 20px; margin-bottom: 10px; }
                    .total-label { color: #6b7280; min-width: 150px; text-align: right; }
                    .total-value { font-weight: 600; min-width: 100px; }
                    .grand-total { font-size: 24px; color: #6366f1; font-weight: bold; border-top: 2px solid #e5e7eb; padding-top: 20px; }
                    .footer { margin-top: 60px; padding-top: 20px; border-top: 2px solid #e5e7eb; text-align: center; font-size: 14px; color: #6b7280; }
                    .badge { display: inline-block; padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: 500; }
                    .badge-paid { background: #dcfce7; color: #166534; }
                    .badge-pending { background: #fef3c7; color: #92400e; }
                </style>
            </head>
            <body>
                <div class="header">
                    <div class="logo">FastFare Logistics</div>
                    <div class="invoice-details">
                        <h1>INVOICE</h1>
                        <p><strong>#${inv.id}</strong></p>
                        <p>Date: ${inv.date}</p>
                        <p>Due: ${inv.dueDate}</p>
                        <span class="badge ${inv.status === 'Paid' ? 'badge-paid' : 'badge-pending'}">${inv.status.toUpperCase()}</span>
                    </div>
                </div>

                <div class="grid">
                    <div>
                        <p class="section-title">Bill To</p>
                        <p><strong>User Business Name</strong></p>
                        <p>123 Business Street</p>
                        <p>Mumbai, Maharashtra 400001</p>
                        <p>India</p>
                        <p>GSTIN: 22AAAAA0000A1Z5</p>
                    </div>
                    <div>
                        <p class="section-title">Invoice Details</p>
                        <p><strong>Period:</strong> ${inv.period}</p>
                        <p><strong>Invoice Date:</strong> ${inv.date}</p>
                        <p><strong>Due Date:</strong> ${inv.dueDate}</p>
                        <p><strong>Payment Method:</strong> Wallet Balance / Credit</p>
                    </div>
                </div>

                <table class="table">
                    <thead>
                        <tr>
                            <th style="width: 50%">Description</th>
                            <th style="width: 15%">Quantity</th>
                            <th style="width: 15%">Unit Price</th>
                            <th style="width: 20%; text-align: right;">Amount</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td>
                                <strong>Shipping Services - ${inv.period}</strong><br>
                                <span style="color: #6b7280; font-size: 13px;">Domestic courier services, surface delivery</span>
                            </td>
                            <td>1</td>
                            <td>₹${parseInt(inv.amount.replace(/[₹,]/g, '')).toLocaleString()}</td>
                            <td style="text-align: right;">${inv.amount}</td>
                        </tr>
                        <tr>
                            <td>
                                <strong>Handling & Packaging</strong><br>
                                <span style="color: #6b7280; font-size: 13px;">Standard packaging services</span>
                            </td>
                            <td>1</td>
                            <td>₹0</td>
                            <td style="text-align: right;">₹0</td>
                        </tr>
                        <tr>
                            <td>
                                <strong>Insurance</strong><br>
                                <span style="color: #6b7280; font-size: 13px;">Basic shipment insurance coverage</span>
                            </td>
                            <td>1</td>
                            <td>₹0</td>
                            <td style="text-align: right;">₹0</td>
                        </tr>
                    </tbody>
                </table>

                <div class="total-section">
                    <div class="total-row">
                        <span class="total-label">Subtotal:</span>
                        <span class="total-value">${inv.amount}</span>
                    </div>
                    <div class="total-row">
                        <span class="total-label">IGST (18%):</span>
                        <span class="total-value">₹0</span>
                    </div>
                    <div class="total-row grand-total">
                        <span class="total-label" style="color: #6366f1;">Total:</span>
                        <span class="total-value" style="color: #6366f1;">${inv.amount}</span>
                    </div>
                </div>

                <div class="footer">
                    <p><strong>Thank you for your business!</strong></p>
                    <p>FastFare Logistics Pvt Ltd</p>
                    <p>For queries, contact: support@fastfare.com | +91 1800-XXX-XXXX</p>
                    <p style="margin-top: 10px; color: #9ca3af; font-size: 12px;">This is a computer-generated invoice and does not require a signature.</p>
                </div>
            </body>
        </html>
    `;

    const generateManifestHTML = () => `
        <!DOCTYPE html>
        <html>
            <head>
                <title>Shipment Manifest</title>
                <style>
                    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 30px; color: #333; }
                    .header { text-align: center; border-bottom: 2px solid #e5e7eb; padding-bottom: 20px; margin-bottom: 20px; }
                    .logo { font-size: 24px; font-weight: bold; color: #6366f1; }
                    .info-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 20px; margin-bottom: 20px; font-size: 12px; }
                    .table { width: 100%; border-collapse: collapse; font-size: 11px; }
                    .table th, .table td { border: 1px solid #e5e7eb; padding: 8px; text-align: left; }
                    .table th { background: #f9fafb; font-weight: 600; }
                    .footer { margin-top: 20px; text-align: center; font-size: 10px; color: #6b7280; }
                </style>
            </head>
            <body>
                <div class="header">
                    <div class="logo">FastFare Logistics - Shipment Manifest</div>
                </div>
                <div class="info-grid">
                    <div><strong>Manifest ID:</strong> MFT-${new Date().getFullYear()}${new Date().getMonth() + 1}${new Date().getDate()}-${Math.floor(Math.random() * 10000)}</div>
                    <div><strong>Date:</strong> ${new Date().toLocaleDateString()}</div>
                    <div><strong>Carrier:</strong> Multiple Carriers</div>
                </div>
                <table class="table">
                    <thead>
                        <tr>
                            <th>AWB Number</th>
                            <th>Order ID</th>
                            <th>Recipient</th>
                            <th>Destination</th>
                            <th>Pincode</th>
                            <th>Weight (kg)</th>
                            <th>Service Type</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr><td>AWB2024010101</td><td>ORD-001</td><td>Rohan Gupta</td><td>Mumbai, MH</td><td>400001</td><td>2.5</td><td>Surface</td><td>Pending</td></tr>
                        <tr><td>AWB2024010102</td><td>ORD-002</td><td>Anita Sharma</td><td>Bangalore, KA</td><td>560001</td><td>1.8</td><td>Express</td><td>In Transit</td></tr>
                        <tr><td>AWB2024010103</td><td>ORD-003</td><td>Vikram Singh</td><td>Delhi, DL</td><td>110001</td><td>3.2</td><td>Surface</td><td>Delivered</td></tr>
                    </tbody>
                </table>
                <div class="footer">Total Shipments: 3 | Total Weight: 7.5 kg | Generated: ${new Date().toLocaleString()}</div>
            </body>
        </html>
    `;

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
