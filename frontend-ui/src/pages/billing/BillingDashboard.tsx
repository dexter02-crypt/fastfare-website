import { API_BASE_URL } from "@/config";
import { useState, useEffect } from "react";
import { formatDate } from "@/utils/dateFormat";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import DashboardLayout from "@/components/DashboardLayout";
import {
  Wallet, CreditCard, Receipt, TrendingUp, Plus, Download,
  ArrowUpRight, ArrowDownRight, Clock, AlertTriangle
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// Stats moved inside component for dynamic roles

const recentTransactions: { id: string; type: string; amount: string; date: string; status: string }[] = [];

interface Invoice {
  _id: string;
  invoiceNo: string;
  awb: string;
  amount: number;
  date: string;
  paymentMode: string;
  status: string;
  carrier: string;
}

interface BillingSummary {
  walletBalance: number;
  thisMonthSpend: number;
  pendingPayments: number;
  creditLimit: number | null;
}

interface Transaction {
  _id: string;
  type: string;
  amount: number;
  status: string;
  description?: string;
  balanceAfter?: number;
  createdAt: string;
}

interface WalletData {
  balance: number;
  transactions: Transaction[];
}

const BillingDashboard = () => {
  const { toast } = useToast();
  const [userRole, setUserRole] = useState<string>("");

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    setUserRole(user.role || "");
  }, []);

  const [walletData, setWalletData] = useState<WalletData | null>(null);
  const [loading, setLoading] = useState(true);
  const [billingData, setBillingData] = useState<BillingSummary | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [invoicesLoading, setInvoicesLoading] = useState(true);


  useEffect(() => {
    const fetchWalletData = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await fetch(`${API_BASE_URL}/api/payment/wallet`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (response.ok) {
          const data = await response.json();
          setWalletData(data);
        }
      } catch (error) {
        console.error("Failed to fetch wallet data", error);
      } finally {
        setLoading(false);
      }
    };
    fetchWalletData();
  }, []);

  // Bug 26 — fetch billing summary
  useEffect(() => {
    const fetchBilling = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(`${API_BASE_URL}/api/billing/summary`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setBillingData(data);
        }
      } catch (err) {
        console.error('Billing fetch error:', err);
      }
    };
    fetchBilling();
  }, []);

  // Bug 27 — fetch invoices
  useEffect(() => {
    const fetchInvoices = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(`${API_BASE_URL}/api/billing/invoices`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setInvoices(data);
        }
      } catch (err) {
        console.error('Invoices fetch error:', err);
      } finally {
        setInvoicesLoading(false);
      }
    };
    fetchInvoices();
  }, []);

  const recentTxns = walletData?.transactions || [];
  const balance = billingData?.walletBalance ?? walletData?.balance ?? 0;

  // Use billing API for spend, fallback to wallet transactions
  const monthlyAmount = billingData?.thisMonthSpend ?? 0;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Billing & Payments</h1>
            <p className="text-muted-foreground">Manage your wallet, invoices, and payments</p>
          </div>
          <div className="flex gap-3">
            <Button className="gap-2 gradient-primary" onClick={() => toast({ title: "Coming Soon", description: "Wallet recharge will be available soon!" })}>
              <Plus className="h-4 w-4" />
              Add Funds
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 mb-6 sm:mb-8">
          <Card>
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between mb-2 sm:mb-4">
                <div className="h-10 w-10 sm:h-14 sm:w-14 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Wallet className="h-5 w-5 sm:h-7 sm:w-7 text-primary" />
                </div>
              </div>
              <p className="text-2xl sm:text-4xl font-bold tracking-tight">₹{balance.toLocaleString('en-IN')}</p>
              <p className="text-xs sm:text-sm text-muted-foreground mt-1">Wallet Balance</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between mb-2 sm:mb-4">
                <div className="h-10 w-10 sm:h-14 sm:w-14 rounded-xl bg-orange-100 flex items-center justify-center">
                  <TrendingUp className="h-5 w-5 sm:h-7 sm:w-7 text-orange-600" />
                </div>
              </div>
              <p className="text-2xl sm:text-4xl font-bold tracking-tight">₹{monthlyAmount.toLocaleString('en-IN')}</p>
              <p className="text-xs sm:text-sm text-muted-foreground mt-1 line-clamp-1">
                {userRole === 'shipment_partner' ? "Earnings" : "Spend"}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between mb-2 sm:mb-4">
                <div className="h-10 w-10 sm:h-14 sm:w-14 rounded-xl bg-blue-100 flex items-center justify-center">
                  <Clock className="h-5 w-5 sm:h-7 sm:w-7 text-blue-600" />
                </div>
              </div>
              <p className="text-2xl sm:text-4xl font-bold tracking-tight">₹{(billingData?.pendingPayments ?? 0).toLocaleString('en-IN')}</p>
              <p className="text-xs sm:text-sm text-muted-foreground mt-1 line-clamp-1">Pending Payments</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between mb-2 sm:mb-4">
                <div className="h-10 w-10 sm:h-14 sm:w-14 rounded-xl bg-purple-100 flex items-center justify-center">
                  <CreditCard className="h-5 w-5 sm:h-7 sm:w-7 text-purple-600" />
                </div>
              </div>
              <p className="text-2xl sm:text-4xl font-bold tracking-tight">
                {billingData?.creditLimit !== null && billingData?.creditLimit !== undefined
                  ? '₹' + Number(billingData.creditLimit).toLocaleString('en-IN')
                  : <span className="text-muted-foreground text-[1rem] sm:text-lg">Not Activated</span>
                }
              </p>
              <p className="text-xs sm:text-sm text-muted-foreground mt-1 line-clamp-1">Credit Limit</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Transactions */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Recent Transactions</CardTitle>
                <CardDescription>Your latest wallet activity</CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentTxns.length > 0 ? recentTxns.map((txn: Transaction) => (
                  <div key={txn._id} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-lg border gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                         <p className="font-medium text-sm capitalize">
                           {txn.type.replace('_', ' ')}
                         </p>
                         <Badge variant="outline" className="text-[10px] h-5 capitalize bg-muted/50">
                           {txn.status || 'completed'}
                         </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5 max-w-[250px] truncate" title={txn.description}>
                        {txn.description || 'Wallet Transaction'} • {formatDate(txn.createdAt)}
                      </p>
                    </div>
                    <div className="flex flex-col sm:items-end mt-1 sm:mt-0">
                      <span className={`font-semibold text-sm ${txn.type === 'recharge' || txn.type === 'refund' || txn.amount > 0 && txn.type !== 'shipment_charge' && txn.type !== 'debit' ? "text-green-600" : "text-foreground"}`}>
                        {txn.type === 'recharge' || txn.type === 'refund' || (txn.amount > 0 && txn.type !== 'shipment_charge' && txn.type !== 'debit') ? "+" : "-"}₹{Math.abs(txn.amount).toLocaleString('en-IN')}
                      </span>
                      {txn.balanceAfter !== undefined && txn.balanceAfter !== null && (
                         <span className="text-[10px] text-muted-foreground">Bal: ₹{txn.balanceAfter.toLocaleString('en-IN')}</span>
                      )}
                    </div>
                  </div>
                )) : (
                  <p className="text-center text-muted-foreground py-4">No recent transactions</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Invoices — Bug 27 */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Invoices</CardTitle>
                <CardDescription>Your billing history</CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              {invoicesLoading ? (
                <p className="text-center text-muted-foreground py-4">Loading invoices...</p>
              ) : invoices.length === 0 ? (
                <div className="text-center py-8">
                  <Receipt className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                  <p className="text-muted-foreground">No invoices yet.</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Invoices will appear here after shipments are created.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {invoices.slice(0, 10).map((inv) => (
                    <div key={inv._id} className="flex items-center justify-between p-3 rounded-lg border">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
                          <Receipt className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium text-sm text-primary">{inv.invoiceNo}</p>
                          <p className="text-xs text-muted-foreground">AWB: {inv.awb} • {formatDate(inv.date)}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-sm">₹{inv.amount.toLocaleString('en-IN')}</p>
                        <Badge
                          variant={inv.status === 'Paid' ? 'default' : 'secondary'}
                          className="text-xs mt-1"
                          style={{
                            background: inv.status === 'Paid' ? '#dcfce7' : '#dbeafe',
                            color: inv.status === 'Paid' ? '#16a34a' : '#1d4ed8'
                          }}
                        >
                          {inv.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

      </div>
    </DashboardLayout>
  );
};

export default BillingDashboard;
