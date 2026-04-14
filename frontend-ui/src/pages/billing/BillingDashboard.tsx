import { API_BASE_URL } from "@/config";
import { useState, useEffect, useCallback } from "react";
import { formatDate } from "@/utils/dateFormat";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import DashboardLayout from "@/components/DashboardLayout";
import {
  Wallet, CreditCard, Receipt, TrendingUp, Plus, Download,
  ArrowUpRight, ArrowDownRight, Clock, AlertTriangle,
  RefreshCw, ChevronDown, Package, ExternalLink, Loader2
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useWallet } from "@/contexts/WalletContext";

// ─── Types ───────────────────────────────────────────────────────────────────

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

interface TransactionShipment {
  _id: string;
  awb: string;
  carrier?: string;
  paymentMode?: string;
}

interface Transaction {
  _id: string;
  type: string;
  amount: number;
  status: string;
  description?: string;
  balanceBefore?: number;
  balanceAfter?: number;
  shipmentId?: TransactionShipment | null;
  createdAt: string;
}

interface WalletData {
  balance: number;
  transactions: Transaction[];
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const TXN_TYPE_CONFIG: Record<string, {
  label: string;
  icon: typeof ArrowUpRight;
  iconBg: string;
  iconColor: string;
  amountColor: string;
  badgeBg: string;
  badgeText: string;
  prefix: string;
}> = {
  recharge: {
    label: "Wallet Recharge",
    icon: ArrowUpRight,
    iconBg: "bg-blue-100",
    iconColor: "text-blue-600",
    amountColor: "text-green-600",
    badgeBg: "bg-blue-50",
    badgeText: "text-blue-700",
    prefix: "+",
  },
  refund: {
    label: "Refund",
    icon: RefreshCw,
    iconBg: "bg-green-100",
    iconColor: "text-green-600",
    amountColor: "text-green-600",
    badgeBg: "bg-green-50",
    badgeText: "text-green-700",
    prefix: "+",
  },
  shipment_charge: {
    label: "Shipment Charge",
    icon: ArrowDownRight,
    iconBg: "bg-red-100",
    iconColor: "text-red-500",
    amountColor: "text-foreground",
    badgeBg: "bg-red-50",
    badgeText: "text-red-700",
    prefix: "-",
  },
  adjustment: {
    label: "Adjustment",
    icon: RefreshCw,
    iconBg: "bg-amber-100",
    iconColor: "text-amber-600",
    amountColor: "text-amber-700",
    badgeBg: "bg-amber-50",
    badgeText: "text-amber-700",
    prefix: "±",
  },
  withdrawal: {
    label: "Withdrawal",
    icon: ArrowDownRight,
    iconBg: "bg-purple-100",
    iconColor: "text-purple-600",
    amountColor: "text-foreground",
    badgeBg: "bg-purple-50",
    badgeText: "text-purple-700",
    prefix: "-",
  },
};

const getConfig = (type: string) =>
  TXN_TYPE_CONFIG[type] || {
    label: type.replace(/_/g, " "),
    icon: Clock,
    iconBg: "bg-gray-100",
    iconColor: "text-gray-500",
    amountColor: "text-foreground",
    badgeBg: "bg-gray-50",
    badgeText: "text-gray-700",
    prefix: "",
  };

const isCredit = (type: string) => ["recharge", "refund"].includes(type);

// ─── Component ───────────────────────────────────────────────────────────────

const BillingDashboard = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { balance: walletBalance } = useWallet();
  const [userRole, setUserRole] = useState<string>("");

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    setUserRole(user.role || "");
  }, []);

  // ── Wallet / Billing Data ──
  const [walletData, setWalletData] = useState<WalletData | null>(null);
  const [loading, setLoading] = useState(true);
  const [billingData, setBillingData] = useState<BillingSummary | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [invoicesLoading, setInvoicesLoading] = useState(true);

  // ── Transactions State ──
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [txnFilter, setTxnFilter] = useState("ALL");
  const [txnPage, setTxnPage] = useState(1);
  const [txnHasMore, setTxnHasMore] = useState(false);
  const [txnLoading, setTxnLoading] = useState(true);
  const [txnLoadingMore, setTxnLoadingMore] = useState(false);
  const TXN_PER_PAGE = 20;

  // ── Fetch wallet balance (legacy) ──
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

  // ── Fetch billing summary ──
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

  // ── Fetch invoices ──
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

  // ── Fetch transactions (with filter + pagination) ──
  const fetchTransactions = useCallback(async (page: number, filter: string, append = false) => {
    if (append) {
      setTxnLoadingMore(true);
    } else {
      setTxnLoading(true);
    }

    try {
      const token = localStorage.getItem("token");
      const params = new URLSearchParams({
        page: String(page),
        limit: String(TXN_PER_PAGE),
        ...(filter !== "ALL" ? { type: filter } : {}),
      });

      const res = await fetch(`${API_BASE_URL}/api/wallet/transactions?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        const data = await res.json();
        setTransactions(prev => append ? [...prev, ...data.transactions] : data.transactions);
        setTxnHasMore(data.has_more || false);
      }
    } catch (err) {
      console.error("Transactions fetch error:", err);
    } finally {
      setTxnLoading(false);
      setTxnLoadingMore(false);
    }
  }, []);

  // Initial load + filter change
  useEffect(() => {
    setTxnPage(1);
    fetchTransactions(1, txnFilter, false);
  }, [txnFilter, fetchTransactions]);

  // ── Derived values ──
  // Use WalletContext as single source of truth for balance (synced with header)
  const balance = walletBalance;
  const monthlyAmount = billingData?.thisMonthSpend ?? 0;

  const handleLoadMore = () => {
    const nextPage = txnPage + 1;
    setTxnPage(nextPage);
    fetchTransactions(nextPage, txnFilter, true);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Billing & Payments</h1>
            <p className="text-muted-foreground">Manage your wallet, invoices, and payments</p>
          </div>
          <div className="flex gap-3">
            <Button className="gap-2 gradient-primary" onClick={() => navigate("/billing/recharge")}>
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
          {/* ═══════════════════════════════════════════════════════════════ */}
          {/* Recent Transactions — Enhanced */}
          {/* ═══════════════════════════════════════════════════════════════ */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-2">
              <div>
                <CardTitle>Recent Transactions</CardTitle>
                <CardDescription>Your latest wallet activity</CardDescription>
              </div>
              <Select value={txnFilter} onValueChange={setTxnFilter}>
                <SelectTrigger className="w-[130px] h-8 text-xs">
                  <SelectValue placeholder="Filter" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Types</SelectItem>
                  <SelectItem value="DEBIT">Debits</SelectItem>
                  <SelectItem value="REFUND">Refunds</SelectItem>
                  <SelectItem value="RECHARGE">Recharges</SelectItem>
                </SelectContent>
              </Select>
            </CardHeader>
            <CardContent>
              {txnLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : transactions.length === 0 ? (
                <div className="text-center py-10">
                  <div className="h-14 w-14 rounded-full bg-muted/60 flex items-center justify-center mx-auto mb-3">
                    <Wallet className="h-7 w-7 text-muted-foreground/50" />
                  </div>
                  <p className="text-muted-foreground font-medium">No transactions yet</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Transactions will appear here once you recharge your wallet or create shipments.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {transactions.map((txn) => {
                    const cfg = getConfig(txn.type);
                    const Icon = cfg.icon;
                    const awb = txn.shipmentId?.awb;

                    return (
                      <div
                        key={txn._id}
                        className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/30 transition-colors"
                      >
                        {/* Icon */}
                        <div className={`h-9 w-9 rounded-lg ${cfg.iconBg} flex items-center justify-center shrink-0`}>
                          <Icon className={`h-4 w-4 ${cfg.iconColor}`} />
                        </div>

                        {/* Details */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-medium text-sm">{cfg.label}</p>
                            <Badge
                              variant="outline"
                              className={`text-[10px] h-5 border-none ${cfg.badgeBg} ${cfg.badgeText}`}
                            >
                              {isCredit(txn.type) ? "CREDIT" : "DEBIT"}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <p className="text-xs text-muted-foreground truncate max-w-[180px]" title={txn.description}>
                              {txn.description || cfg.label}
                            </p>
                            <span className="text-[10px] text-muted-foreground/70">•</span>
                            <span className="text-[10px] text-muted-foreground/70 whitespace-nowrap">{formatDate(txn.createdAt)}</span>
                          </div>
                          {awb && (
                            <button
                              onClick={() => navigate(`/shipment/${txn.shipmentId?._id}`)}
                              className="flex items-center gap-1 mt-1 text-[11px] text-primary hover:underline"
                            >
                              <Package className="h-3 w-3" />
                              AWB: {awb}
                              <ExternalLink className="h-2.5 w-2.5" />
                            </button>
                          )}
                        </div>

                        {/* Amount */}
                        <div className="text-right shrink-0">
                          <span className={`font-semibold text-sm ${cfg.amountColor}`}>
                            {cfg.prefix}₹{Math.abs(txn.amount).toLocaleString("en-IN")}
                          </span>
                          {txn.balanceAfter !== undefined && txn.balanceAfter !== null && (
                            <p className="text-[10px] text-muted-foreground mt-0.5">
                              Bal: ₹{txn.balanceAfter.toLocaleString("en-IN")}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}

                  {/* Load More */}
                  {txnHasMore && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full text-muted-foreground hover:text-foreground mt-2"
                      onClick={handleLoadMore}
                      disabled={txnLoadingMore}
                    >
                      {txnLoadingMore ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : (
                        <ChevronDown className="h-4 w-4 mr-2" />
                      )}
                      {txnLoadingMore ? "Loading..." : "Load More"}
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Invoices */}
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
