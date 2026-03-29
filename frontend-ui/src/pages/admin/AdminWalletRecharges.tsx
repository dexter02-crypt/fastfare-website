import { useState, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Wallet, Search, CheckCircle, AlertCircle, XCircle, Clock, Check, Loader2, ArrowRightLeft } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { API_BASE_URL } from "@/config";
import { format } from "date-fns";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface RechargeOrder {
    _id: string;
    order_id: string;
    user_id: { _id: string; name: string; businessName: string; email: string };
    amount: number;
    status: 'pending' | 'paid' | 'failed' | 'amount_mismatch';
    wallet_credited: boolean;
    cashfree_payment_id?: string;
    created_at: string;
}

const AdminWalletRecharges = () => {
    const [orders, setOrders] = useState<RechargeOrder[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    
    // Manual Credit Dialog
    const [isConfirmingCredit, setIsConfirmingCredit] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState<RechargeOrder | null>(null);
    const [isCrediting, setIsCrediting] = useState(false);

    const fetchOrders = async () => {
        setIsLoading(true);
        try {
            const token = localStorage.getItem("token");
            const res = await fetch(`${API_BASE_URL}/api/admin/recharges`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setOrders(data);
            } else {
                toast.error("Failed to load generic recharges");
            }
        } catch (error) {
            toast.error("Error connecting to server");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchOrders();
    }, []);

    const handleManualCredit = async () => {
        if (!selectedOrder) return;
        setIsCrediting(true);
        try {
            const token = localStorage.getItem("token");
            const res = await fetch(`${API_BASE_URL}/api/admin/recharges/${selectedOrder._id}/credit`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = await res.json();
            
            if (res.ok) {
                toast.success(data.message);
                setIsConfirmingCredit(false);
                setSelectedOrder(null);
                fetchOrders(); // refresh
            } else {
                toast.error(data.message || "Failed to credit wallet");
            }
        } catch (error) {
            toast.error("Network error");
        } finally {
            setIsCrediting(false);
        }
    };

    const confirmCredit = (order: RechargeOrder) => {
        setSelectedOrder(order);
        setIsConfirmingCredit(true);
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'paid': return <Badge className="bg-green-500"><CheckCircle className="w-3 h-3 mr-1"/> Paid</Badge>;
            case 'pending': return <Badge variant="outline" className="text-yellow-600 border-yellow-300 bg-yellow-50"><Clock className="w-3 h-3 mr-1"/> Pending</Badge>;
            case 'failed': return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1"/> Failed</Badge>;
            case 'amount_mismatch': return <Badge className="bg-orange-500"><AlertCircle className="w-3 h-3 mr-1"/> Mismatch</Badge>;
            default: return <Badge variant="secondary">{status}</Badge>;
        }
    };

    const filteredOrders = orders.filter(order => {
        // Search by order_id, user name, or email
        const q = searchQuery.toLowerCase();
        const matchSearch = order.order_id.toLowerCase().includes(q) || 
                            (order.user_id?.name || '').toLowerCase().includes(q) ||
                            (order.user_id?.businessName || '').toLowerCase().includes(q) ||
                            (order.user_id?.email || '').toLowerCase().includes(q) ||
                            (order.cashfree_payment_id || '').toLowerCase().includes(q);

        const matchStatus = statusFilter === 'all' || order.status === statusFilter || 
                            (statusFilter === 'uncredited' && order.status === 'paid' && !order.wallet_credited);
        return matchSearch && matchStatus;
    });

    return (
        <DashboardLayout>
            <div className="space-y-6">
                <div className="flex justify-between items-end">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Wallet Recharges</h1>
                        <p className="text-muted-foreground mt-2">Monitor Cashfree orders, amount mismatches, and view ledger credits.</p>
                    </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 mb-6">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search Order ID, Trans ID, User, Email..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-9"
                        />
                    </div>
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger className="w-full sm:w-[180px]">
                            <SelectValue placeholder="All Status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Orders</SelectItem>
                            <SelectItem value="paid">Paid & Credited</SelectItem>
                            <SelectItem value="uncredited">Paid (Uncredited)</SelectItem>
                            <SelectItem value="amount_mismatch">Amount Mismatch</SelectItem>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="failed">Failed</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                {isLoading ? (
                    <div className="flex justify-center items-center py-12">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                ) : filteredOrders.length === 0 ? (
                    <div className="text-center py-12 border rounded-lg bg-card bg-muted/20">
                        <Wallet className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                        <h3 className="text-lg font-medium">No recharge orders found</h3>
                        <p className="text-muted-foreground">Adjust filters or search criteria.</p>
                    </div>
                ) : (
                    <div className="rounded-md border bg-card">
                        <div className="relative w-full overflow-auto">
                            <table className="w-full caption-bottom text-sm">
                                <thead className="[&_tr]:border-b">
                                    <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                                        <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground border-r border-r-muted/40">Timestamp</th>
                                        <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground border-r border-r-muted/40">Order & User</th>
                                        <th className="h-12 px-4 text-right align-middle font-medium text-muted-foreground border-r border-r-muted/40">Amount</th>
                                        <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground border-r border-r-muted/40">PG Status</th>
                                        <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground border-r border-r-muted/40">Wallet Credited</th>
                                        <th className="h-12 px-4 text-center align-middle font-medium text-muted-foreground">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="[&_tr:last-child]:border-0">
                                    {filteredOrders.map((order) => (
                                        <tr key={order._id} className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                                            <td className="p-4 align-middle whitespace-nowrap text-muted-foreground border-r border-r-muted/40 text-xs">
                                                {format(new Date(order.created_at), "dd MMM yy, HH:mm")}
                                            </td>
                                            <td className="p-4 align-middle border-r border-r-muted/40">
                                                <div className="font-medium text-primary text-xs tracking-tight">{order.order_id}</div>
                                                <div className="text-sm mt-1">{order.user_id?.businessName || order.user_id?.name || 'Unknown User'}</div>
                                                <div className="text-xs text-muted-foreground">{order.user_id?.email}</div>
                                                {order.cashfree_payment_id && (
                                                    <div className="text-[10px] text-muted-foreground mt-1 flex items-center gap-1">
                                                        <ArrowRightLeft className="w-3 h-3"/> PG: {order.cashfree_payment_id}
                                                    </div>
                                                )}
                                            </td>
                                            <td className="p-4 align-middle text-right font-medium text-base border-r border-r-muted/40">
                                                ₹{order.amount.toFixed(2)}
                                            </td>
                                            <td className="p-4 align-middle border-r border-r-muted/40 whitespace-nowrap">
                                                {getStatusBadge(order.status)}
                                            </td>
                                            <td className="p-4 align-middle border-r border-r-muted/40 text-sm">
                                                {order.wallet_credited ? (
                                                    <span className="flex items-center text-green-600 font-medium">
                                                        <Check className="w-4 h-4 mr-1" /> Yes
                                                    </span>
                                                ) : (
                                                    <span className="text-muted-foreground text-xs">No</span>
                                                )}
                                            </td>
                                            <td className="p-4 align-middle text-center">
                                                {(!order.wallet_credited && (order.status === 'paid' || order.status === 'amount_mismatch')) ? (
                                                    <Button variant="outline" size="sm" onClick={() => confirmCredit(order)}>
                                                        Force Credit
                                                    </Button>
                                                ) : (
                                                    <span className="text-xs text-muted-foreground">-</span>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* Confirm Dialg */}
                <AlertDialog open={isConfirmingCredit} onOpenChange={setIsConfirmingCredit}>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Manual Wallet Credit</AlertDialogTitle>
                            <AlertDialogDescription>
                                Are you sure you want to manually credit <strong>₹{selectedOrder?.amount}</strong> to the wallet of <strong>{selectedOrder?.user_id?.businessName || selectedOrder?.user_id?.name}</strong>?
                                <br/><br/>
                                This is an override operation and will generate a permanent ledger entry. Use this only if the webhook failed or you are resolving an amount mismatch manually.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel disabled={isCrediting}>Cancel</AlertDialogCancel>
                            <AlertDialogAction 
                                onClick={(e) => { e.preventDefault(); handleManualCredit(); }}
                                className="bg-primary hover:bg-primary/90"
                                disabled={isCrediting}
                            >
                                {isCrediting ? "Processing..." : "Yes, Force Credit Wallet"}
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>

            </div>
        </DashboardLayout>
    );
};

export default AdminWalletRecharges;
