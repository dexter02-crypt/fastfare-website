import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
    MoreVertical, Eye, Edit, Truck, CheckCircle2,
    Printer, Copy, XCircle, Loader2
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { API_BASE_URL } from "@/config";
import { toast } from 'sonner';

// Import our Dialogs and Sheets components
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatDate } from "@/utils/dateFormat";

interface OrderActionsProps {
    order: any;
    onOrderUpdate: (updatedOrder: any) => void;
    onOrderDuplicate: (newOrder: any) => void;
}

export const OrderActions: React.FC<OrderActionsProps> = ({ order, onOrderUpdate, onOrderDuplicate }) => {
    const { toast } = useToast();
    const navigate = useNavigate();
    const [isOpen, setIsOpen] = useState(false);

    // Modals & Panels state
    const [isViewOpen, setIsViewOpen] = useState(false);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [isCancelOpen, setIsCancelOpen] = useState(false);

    // Action Loading states
    const [isConfirming, setIsConfirming] = useState(false);
    const [isDuplicating, setIsDuplicating] = useState(false);
    const [isCancelling, setIsCancelling] = useState(false);
    const [isSavingEdit, setIsSavingEdit] = useState(false);

    // Edit Form State
    const [editForm, setEditForm] = useState(order);

    // Status Checkers
    const st = order.orderStatus || 'New';
    const canEdit = ['New', 'Pending', 'Confirmed', 'Processing'].includes(st);
    const canShip = ['Confirmed', 'Processing'].includes(st);
    const canConfirm = ['New', 'Pending'].includes(st);
    const canCancel = ['New', 'Pending', 'Confirmed', 'Processing'].includes(st);

    // Confirmation dialog state
    const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
    const [pendingStatus, setPendingStatus] = useState('');
    const [isUpdating, setIsUpdating] = useState(false);

    // Api Handlers
    const handleStatusUpdate = async (newStatus: string) => {
        setConfirmDialogOpen(false);
        setIsUpdating(true);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_BASE_URL}/api/orders/${order._id}/status`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ status: newStatus })
            });
            const data = await res.json();

            if (data.success) {
                onOrderUpdate(data.order);
                toast.success('Status updated and customer notified via email');
            } else {
                throw new Error(data.message);
            }
        } catch (e: any) {
            toast.error('Status update failed. Please try again.');
        } finally {
            setIsUpdating(false);
            setPendingStatus('');
        }
    };

    const handleStatusClick = (newStatus: string) => {
        setPendingStatus(newStatus);
        setConfirmDialogOpen(true);
    };

    const handleDuplicate = async () => {
        // Check minimum order value
        if (order.orderValue < 150) {
            toast({
                variant: 'destructive',
                title: 'Order value too low',
                description: 'Orders below ₹150 cannot be processed. Please increase the order value to continue.'
            });
            return;
        }
        setIsDuplicating(true);
        try {
            const token = localStorage.getItem('token');
            // Remove unique identifiers
            const { _id, orderId, statusHistory, createdAt, updatedAt, orderStatus, paymentStatus, ...copyData } = order;

            const payload = {
                ...copyData,
                status: 'New',
                paymentStatus: 'Unpaid'
            };

            const res = await fetch(`${API_BASE_URL}/api/orders`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(payload)
            });
            const data = await res.json();

            if (data.success) {
                onOrderDuplicate(data.order);
                toast({
                    title: 'Success',
                    description: `Order duplicated successfully — ${data.order.orderId} created`,
                    className: "bg-green-50 border-green-200"
                });
            } else {
                throw new Error(data.message);
            }
        } catch (e: any) {
            toast({
                variant: 'destructive',
                title: 'Error duplicated order',
                description: e.message || 'Server error occurred'
            });
        } finally {
            setIsDuplicating(false);
        }
    };

    const handleSaveEdit = async () => {
        // Check minimum order value
        if (editForm.orderValue < 150) {
            toast({
                variant: 'destructive',
                title: 'Order value too low',
                description: 'Orders below ₹150 cannot be processed. Please increase the order value to continue.'
            });
            return;
        }
        setIsSavingEdit(true);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_BASE_URL}/api/orders/${order._id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(editForm)
            });
            const data = await res.json();

            if (data.success) {
                onOrderUpdate(data.order);
                setIsEditOpen(false);
                toast({
                    title: 'Order Updated',
                    description: `Successfully saved changes for ${order.orderId}`,
                    className: "bg-green-50 z-[100] border-green-200"
                });
            }
        } catch (e: any) {
            toast({ variant: 'destructive', title: 'Edit failed', description: e.message });
        } finally {
            setIsSavingEdit(false);
        }
    };

    const printInvoice = () => {
        // Generate a basic printable window containing the invoice details.
        const printWindow = window.open('', '_blank');
        if (!printWindow) return;

        const html = `
      <html>
        <head>
          <title>Invoice - ${order.orderId}</title>
          <style>
            body { font-family: 'Inter', sans-serif; padding: 40px; color: #333; }
            .header { display: flex; justify-content: space-between; border-bottom: 2px solid #eee; padding-bottom: 20px; margin-bottom: 20px; }
            .logo { font-size: 24px; font-weight: bold; color: #4F46E5; }
            .invoice-details { text-align: right; }
            .addresses { display: flex; justify-content: space-between; margin-bottom: 40px; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
            th, td { padding: 12px; text-align: left; border-bottom: 1px solid #eee; }
            th { background: #f9fafb; font-weight: 600; }
            .totals { width: 300px; float: right; }
            .total-row { display: flex; justify-content: space-between; padding: 8px 0; }
            .grand-total { font-weight: bold; font-size: 18px; border-top: 2px solid #333; padding-top: 10px; margin-top: 10px; }
            .footer { margin-top: 80px; text-align: center; color: #666; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="logo">FastFare</div>
            <div class="invoice-details">
              <h2>INVOICE</h2>
              <p><strong># INV-${order.orderId}</strong></p>
              <p>Date: ${new Date().toLocaleDateString()}</p>
            </div>
          </div>
          
          <div class="addresses">
            <div>
              <h3>Bill From:</h3>
              <p>FastFare Logistics<br>123 Shipping Lane<br>Mumbai, MH 400001</p>
            </div>
            <div>
              <h3>Bill To:</h3>
              <p><strong>${order.customer?.name}</strong><br>
              ${order.address?.line1} ${order.address?.line2 || ''}<br>
              ${order.address?.city}, ${order.address?.state} ${order.address?.pincode}<br>
              Phone: ${order.customer?.phone}
              </p>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th>Item Description</th>
                <th>Qty</th>
                <th>Unit Price</th>
                <th>Amount</th>
              </tr>
            </thead>
            <tbody>
              ${order.items.map((item: any) => `
                <tr>
                  <td>${item.name}</td>
                  <td>${item.qty}</td>
                  <td>₹${item.unitPrice.toLocaleString('en-IN')}</td>
                  <td>₹${item.total.toLocaleString('en-IN')}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>

          <div class="totals">
            <div class="total-row grand-total"><span>Grand Total:</span> <span>₹${order.orderValue.toLocaleString('en-IN')}</span></div>
            
            <div style="margin-top: 20px; font-size: 14px;">
                <p>Payment Mode: <strong>${order.paymentStatus === 'Paid' ? 'PREPAID' : 'COD'}</strong></p>
                <p>Status: <strong>${order.paymentStatus}</strong></p>
            </div>
          </div>

          <div style="clear: both;"></div>

          <div class="footer">
            <p>Thank you for your business!</p>
            <p>Powered by FastFare</p>
          </div>
          
          <script>window.onload = function() { window.print(); }</script>
        </body>
      </html>
    `;
        printWindow.document.write(html);
        printWindow.document.close();
    };


    return (
        <>
            <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
                <DropdownMenuTrigger asChild>
                    <Button
                        variant="ghost"
                        size="sm"
                        className={`h-8 w-8 p-0 border border-border bg-white shadow-sm hover:bg-muted ${isOpen ? 'bg-blue-50 border-blue-200 text-blue-600' : ''}`}
                    >
                        <MoreVertical className="h-4 w-4" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-[200px] z-[50]">

                    {/* 1. View Order */}
                    <DropdownMenuItem onClick={() => setIsViewOpen(true)} className="cursor-pointer py-2.5">
                        <Eye className="h-4 w-4 mr-2" /> View Order Details
                    </DropdownMenuItem>

                    {/* 2. Edit Order */}
                    {canEdit && (
                        <DropdownMenuItem onClick={() => setIsEditOpen(true)} className="cursor-pointer py-2.5">
                            <Edit className="h-4 w-4 mr-2" /> Edit Order
                        </DropdownMenuItem>
                    )}

                    {/* 3. Convert to Shipment */}
                    {canShip && (
                        <DropdownMenuItem
                            onClick={() => navigate('/shipments/new', { state: { importedOrder: order } })}
                            className="cursor-pointer py-2.5"
                        >
                            <Truck className="h-4 w-4 mr-2" /> Convert to Shipment
                        </DropdownMenuItem>
                    )}

                    {/* 4. Mark as Confirmed */}
                    {canConfirm && (
                        <DropdownMenuItem
                            onClick={async (e) => { e.preventDefault(); setIsConfirming(true); await handleStatusUpdate('Confirmed'); setIsConfirming(false); setIsOpen(false); }}
                            className="cursor-pointer py-2.5"
                        >
                            {isConfirming ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <CheckCircle2 className="h-4 w-4 mr-2" />}
                            Mark as Confirmed
                        </DropdownMenuItem>
                    )}

                    {/* 5. Print Invoice */}
                    <DropdownMenuItem onClick={() => { printInvoice(); setIsOpen(false); }} className="cursor-pointer py-2.5">
                        <Printer className="h-4 w-4 mr-2" /> Print Invoice
                    </DropdownMenuItem>

                    {/* 6. Duplicate Order */}
                    <DropdownMenuItem
                        onClick={async (e) => { e.preventDefault(); await handleDuplicate(); setIsOpen(false); }}
                        className="cursor-pointer py-2.5"
                        disabled={isDuplicating}
                    >
                        {isDuplicating ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Copy className="h-4 w-4 mr-2" />}
                        Duplicate Order
                    </DropdownMenuItem>

                    {/* 7. Cancel Order */}
                    {canCancel && (
                        <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                                onClick={() => handleStatusClick('Accepted')}
                                className="cursor-pointer py-2.5 text-blue-600"
                            >
                                <Truck className="h-4 w-4 mr-2" /> Mark Accepted
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                onClick={() => handleStatusClick('in_transit')}
                                className="cursor-pointer py-2.5 text-orange-600"
                            >
                                <Truck className="h-4 w-4 mr-2" /> Mark In Transit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                onClick={() => handleStatusClick('out_for_delivery')}
                                className="cursor-pointer py-2.5 text-indigo-600"
                            >
                                <Truck className="h-4 w-4 mr-2" /> Out for Delivery
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                onClick={() => handleStatusClick('delivered')}
                                className="cursor-pointer py-2.5 text-green-600"
                            >
                                <CheckCircle2 className="h-4 w-4 mr-2" /> Mark Delivered
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                onClick={() => handleStatusClick('failed_delivery')}
                                className="cursor-pointer py-2.5 text-red-600"
                            >
                                <XCircle className="h-4 w-4 mr-2" /> Failed Delivery
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                                onClick={() => setIsCancelOpen(true)}
                                className="cursor-pointer py-2.5 text-red-600 hover:text-red-700 hover:bg-red-50 focus:text-red-700 focus:bg-red-50"
                            >
                                <XCircle className="h-4 w-4 mr-2" /> Cancel Order
                            </DropdownMenuItem>
                        </>
                    )}

                </DropdownMenuContent>
            </DropdownMenu>

            {/* Slide-over Sheet: View Order Details */}
            <Sheet open={isViewOpen} onOpenChange={setIsViewOpen}>
                <SheetContent className="w-[400px] sm:w-[540px] overflow-y-auto sm:max-w-[700px] z-[100]">
                    <SheetHeader className="mb-6">
                        <SheetTitle className="text-xl">Order Details</SheetTitle>
                        <SheetDescription>Viewing full data for {order.orderId}</SheetDescription>
                    </SheetHeader>

                    <div className="space-y-6">
                        <div className="grid grid-cols-2 gap-4">
                            <div><p className="text-sm text-muted-foreground">Order ID</p><p className="font-semibold">{order.orderId}</p></div>
                            <div><p className="text-sm text-muted-foreground">Order Date</p><p className="font-medium">{formatDate(order.createdAt)}</p></div>
                            <div><p className="text-sm text-muted-foreground">Channel</p><Badge variant="secondary">{order.channel || 'Custom'}</Badge></div>
                            <div>
                                <p className="text-sm text-muted-foreground">Payment Status</p>
                                <Badge className={order.paymentStatus === 'Paid' ? 'bg-green-100 text-green-800 hover:bg-green-100 border-none' : 'bg-amber-100 text-amber-800 hover:bg-amber-100 border-none'}>{order.paymentStatus}</Badge>
                            </div>
                        </div>

                        <div className="border bg-muted/20 p-4 rounded-lg">
                            <h3 className="font-semibold mb-2">Customer & Delivery</h3>
                            <p className="font-medium">{order.customer?.name}</p>
                            <p className="text-sm text-muted-foreground mt-1">{order.address?.line1} {order.address?.line2 || ''}</p>
                            <p className="text-sm text-muted-foreground">{order.address?.city}, {order.address?.state} - {order.address?.pincode}</p>
                            <div className="mt-3 flex gap-4 text-sm">
                                <span>📞 {order.customer?.phone}</span>
                                {order.customer?.email && <span>✉️ {order.customer?.email}</span>}
                            </div>
                        </div>

                        <div>
                            <h3 className="font-semibold mb-3">Items list</h3>
                            <div className="border rounded-lg overflow-hidden">
                                <table className="w-full text-sm">
                                    <thead className="bg-muted/50 border-b">
                                        <tr><th className="p-2 text-left">Item Name</th><th className="p-2 text-center">Qty</th><th className="p-2 text-right">Unit Price</th><th className="p-2 text-right">Total</th></tr>
                                    </thead>
                                    <tbody>
                                        {order.items?.map((it: any, idx: number) => (
                                            <tr key={idx} className="border-b last:border-0"><td className="p-2">{it.name}</td><td className="p-2 text-center">{it.qty}</td><td className="p-2 text-right">₹{it.unitPrice}</td><td className="p-2 text-right">₹{it.total}</td></tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        <div className="flex justify-end pr-4 text-sm">
                            <div className="w-[200px] space-y-2">
                                <div className="flex justify-between font-bold text-base mt-2 pt-2 border-t"><span>Grand Total</span><span>₹{order.orderValue}</span></div>
                            </div>
                        </div>

                        {order.linkedAwb && (
                            <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                                <p className="text-sm font-semibold text-blue-900 mb-1">Linked Shipment</p>
                                <p className="text-sm text-blue-800">This order has been converted to a shipment.</p>
                                <Button variant="link" className="p-0 h-auto text-blue-700" onClick={() => navigate(`/shipments`)}>
                                    View Tracking AWB: {order.linkedAwb}
                                </Button>
                            </div>
                        )}
                    </div>
                </SheetContent>
            </Sheet>

            {/* Dialog: Edit Order */}
            <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                <DialogContent className="max-w-md z-[100]">
                    <DialogHeader>
                        <DialogTitle>Edit Order</DialogTitle>
                        <DialogDescription>Modify customer or order details.</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-2">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label>Customer Name</Label>
                                <Input value={editForm.customer?.name} onChange={e => setEditForm({ ...editForm, customer: { ...editForm.customer, name: e.target.value } })} className="mt-1" />
                            </div>
                            <div>
                                <Label>Phone</Label>
                                <Input value={editForm.customer?.phone} onChange={e => setEditForm({ ...editForm, customer: { ...editForm.customer, phone: e.target.value } })} className="mt-1" />
                            </div>
                        </div>
                        <div>
                            <Label>Delivery Address</Label>
                            <Input value={editForm.address?.line1} onChange={e => setEditForm({ ...editForm, address: { ...editForm.address, line1: e.target.value } })} className="mt-1" />
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                            <div>
                                <Label>City</Label>
                                <Input value={editForm.address?.city} onChange={e => setEditForm({ ...editForm, address: { ...editForm.address, city: e.target.value } })} className="mt-1" />
                            </div>
                            <div>
                                <Label>State</Label>
                                <Input value={editForm.address?.state} onChange={e => setEditForm({ ...editForm, address: { ...editForm.address, state: e.target.value } })} className="mt-1" />
                            </div>
                            <div>
                                <Label>Pincode</Label>
                                <Input value={editForm.address?.pincode} onChange={e => setEditForm({ ...editForm, address: { ...editForm.address, pincode: e.target.value } })} className="mt-1" />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4 mt-2">
                            <div>
                                <Label>Order Value</Label>
                                <Input type="number" value={editForm.orderValue} onChange={e => setEditForm({ ...editForm, orderValue: Number(e.target.value) })} className="mt-1" />
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsEditOpen(false)}>Cancel</Button>
                        <Button onClick={handleSaveEdit} disabled={isSavingEdit}>
                            {isSavingEdit && <Loader2 className="h-4 w-4 mr-2 animate-spin" />} Save Changes
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Dialog: Cancel Confirmation */}
            <Dialog open={isCancelOpen} onOpenChange={setIsCancelOpen}>
                <DialogContent className="max-w-sm z-[100]">
                    <DialogHeader>
                        <DialogTitle>Cancel Order?</DialogTitle>
                    </DialogHeader>
                    <div className="py-2">
                        <p className="text-sm text-muted-foreground">
                            Are you sure you want to cancel Order <span className="font-semibold text-foreground">{order.orderId}</span> for <strong>{order.customer?.name}</strong>? This action cannot be undone.
                        </p>
                    </div>
                    <DialogFooter className="mt-4 gap-2 sm:gap-0">
                        <Button variant="outline" onClick={() => setIsCancelOpen(false)}>Keep Order</Button>
                        <Button variant="destructive"
                            onClick={async () => { setIsCancelling(true); await handleStatusUpdate('Cancelled'); setIsCancelling(false); setIsCancelOpen(false); }}
                            disabled={isCancelling}
                        >
                            {isCancelling ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null} Yes, Cancel Order
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Status Update Confirmation Dialog */}
            <Dialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Confirm Status Update</DialogTitle>
                        <DialogDescription>
                            Update order #{order.orderId} status to {pendingStatus}? An email notification will be sent to the customer.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setConfirmDialogOpen(false)}>
                            Cancel
                        </Button>
                        <Button onClick={() => handleStatusUpdate(pendingStatus)} disabled={isUpdating}>
                            {isUpdating ? 'Updating...' : 'Confirm'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
};
