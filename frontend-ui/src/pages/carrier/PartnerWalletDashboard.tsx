import { API_BASE_URL } from "@/config";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import DashboardLayout from "@/components/DashboardLayout";
import {
  Wallet, TrendingUp, Clock, ArrowDownToLine, ArrowUpRight,
  IndianRupee, Package, Timer, ChevronRight, Banknote, ShieldCheck
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface WalletSummary {
  totalBalance: number;
  withdrawableBalance: number;
  heldBalance: number;
  pendingWithdrawalAmount: number;
  availableForWithdrawal: number;
  totalEarned: number;
  totalOrders: number;
  totalWithdrawn: number;
  totalWithdrawals: number;
  holdPeriodDays: number;
}

interface LedgerEntry {
  _id: string;
  type: string;
  amount: number;
  description: string;
  balanceBefore: number;
  balanceAfter: number;
  orderId?: {
    awb: string;
    carrier: string;
    delivery?: { city: string };
  };
  createdAt: string;
}

const formatCurrency = (amount: number) => `₹${Math.abs(amount).toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
const formatDate = (dateStr: string) => {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
};
const formatTime = (dateStr: string) => {
  const d = new Date(dateStr);
  return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
};

const PartnerWalletDashboard = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [wallet, setWallet] = useState<WalletSummary | null>(null);
  const [transactions, setTransactions] = useState<LedgerEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchWalletSummary();
  }, []);

  const fetchWalletSummary = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE_URL}/api/partner/wallet-summary`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setWallet(data.wallet);
        setTransactions(data.recentTransactions || []);
      } else {
        toast({ title: "Error", description: "Failed to load wallet data", variant: "destructive" });
      }
    } catch (error) {
      console.error("Wallet fetch error:", error);
      toast({ title: "Network Error", description: "Could not reach server", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const getTypeBadge = (type: string) => {
    const styles: Record<string, { bg: string; text: string; label: string }> = {
      earning: { bg: "bg-emerald-100", text: "text-emerald-700", label: "Earning" },
      payout: { bg: "bg-red-100", text: "text-red-700", label: "Withdrawal" },
      bonus: { bg: "bg-blue-100", text: "text-blue-700", label: "Bonus" },
      deduction: { bg: "bg-amber-100", text: "text-amber-700", label: "Deduction" },
      penalty: { bg: "bg-red-100", text: "text-red-700", label: "Penalty" },
    };
    const s = styles[type] || { bg: "bg-gray-100", text: "text-gray-700", label: type };
    return <Badge className={`${s.bg} ${s.text} border-0 text-[11px] font-medium`}>{s.label}</Badge>;
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Partner Wallet</h1>
            <p className="text-muted-foreground">Manage your earnings and withdrawals</p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" className="gap-2" onClick={() => navigate("/partner/transactions")}>
              <Clock className="h-4 w-4" />
              Transaction History
            </Button>
            <Button className="gap-2 gradient-primary" onClick={() => navigate("/partner/withdraw")}>
              <ArrowDownToLine className="h-4 w-4" />
              Withdraw Funds
            </Button>
          </div>
        </div>

        {/* Balance Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
          {/* Total Balance */}
          <Card className="border-l-4 border-l-emerald-500">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between mb-3">
                <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl bg-emerald-100 flex items-center justify-center">
                  <Wallet className="h-5 w-5 sm:h-6 sm:w-6 text-emerald-600" />
                </div>
              </div>
              <p className="text-2xl sm:text-3xl font-bold tracking-tight text-emerald-700">
                {formatCurrency(wallet?.totalBalance || 0)}
              </p>
              <p className="text-xs sm:text-sm text-muted-foreground mt-1">Total Balance</p>
            </CardContent>
          </Card>

          {/* Withdrawable Balance */}
          <Card className="border-l-4 border-l-blue-500">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between mb-3">
                <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl bg-blue-100 flex items-center justify-center">
                  <Banknote className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
                </div>
              </div>
              <p className="text-2xl sm:text-3xl font-bold tracking-tight text-blue-700">
                {formatCurrency(wallet?.availableForWithdrawal || 0)}
              </p>
              <p className="text-xs sm:text-sm text-muted-foreground mt-1">Available to Withdraw</p>
            </CardContent>
          </Card>

          {/* Held Balance (2-day hold) */}
          <Card className="border-l-4 border-l-amber-500">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between mb-3">
                <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl bg-amber-100 flex items-center justify-center">
                  <Timer className="h-5 w-5 sm:h-6 sm:w-6 text-amber-600" />
                </div>
              </div>
              <p className="text-2xl sm:text-3xl font-bold tracking-tight text-amber-700">
                {formatCurrency(wallet?.heldBalance || 0)}
              </p>
              <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                Held ({wallet?.holdPeriodDays || 2}-day hold)
              </p>
            </CardContent>
          </Card>

          {/* Total Earned */}
          <Card className="border-l-4 border-l-purple-500">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between mb-3">
                <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl bg-purple-100 flex items-center justify-center">
                  <TrendingUp className="h-5 w-5 sm:h-6 sm:w-6 text-purple-600" />
                </div>
              </div>
              <p className="text-2xl sm:text-3xl font-bold tracking-tight text-purple-700">
                {formatCurrency(wallet?.totalEarned || 0)}
              </p>
              <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                Total Earned ({wallet?.totalOrders || 0} orders)
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Withdrawal Hold Info Banner */}
        <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
          <CardContent className="p-4 flex items-start gap-3">
            <ShieldCheck className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium text-blue-800 text-sm">2-Day Withdrawal Hold</p>
              <p className="text-xs text-blue-600 mt-0.5">
                For security, earnings are held for 2 days before they become withdrawable. 
                Your held balance of <span className="font-semibold">{formatCurrency(wallet?.heldBalance || 0)}</span> will 
                become available after the hold period.
                {wallet?.pendingWithdrawalAmount ? (
                  <span className="block mt-1">
                    You have a pending withdrawal of <span className="font-semibold">{formatCurrency(wallet.pendingWithdrawalAmount)}</span>.
                  </span>
                ) : null}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Stats Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold">{wallet?.totalOrders || 0}</p>
              <p className="text-xs text-muted-foreground mt-1">Total Deliveries</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold">{formatCurrency(wallet?.totalEarned || 0)}</p>
              <p className="text-xs text-muted-foreground mt-1">Lifetime Earnings</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold">{formatCurrency(wallet?.totalWithdrawn || 0)}</p>
              <p className="text-xs text-muted-foreground mt-1">Total Withdrawn</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold">{wallet?.totalWithdrawals || 0}</p>
              <p className="text-xs text-muted-foreground mt-1">Withdrawal Count</p>
            </CardContent>
          </Card>
        </div>

        {/* Recent Transactions */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Recent Transactions</CardTitle>
              <CardDescription>Your latest wallet activity</CardDescription>
            </div>
            <Button variant="ghost" className="gap-1 text-sm" onClick={() => navigate("/partner/transactions")}>
              View All <ChevronRight className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {transactions.length > 0 ? transactions.map((txn) => (
                <div key={txn._id} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-lg border gap-2 hover:bg-muted/30 transition-colors">
                  <div className="flex items-start gap-3">
                    <div className={`h-9 w-9 rounded-lg flex items-center justify-center flex-shrink-0 ${
                      txn.type === 'earning' ? 'bg-emerald-100' : txn.type === 'payout' ? 'bg-red-100' : 'bg-gray-100'
                    }`}>
                      {txn.type === 'earning' ? (
                        <ArrowUpRight className="h-4 w-4 text-emerald-600" />
                      ) : txn.type === 'payout' ? (
                        <ArrowDownToLine className="h-4 w-4 text-red-600" />
                      ) : (
                        <IndianRupee className="h-4 w-4 text-gray-600" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        {getTypeBadge(txn.type)}
                        {txn.orderId?.awb && (
                          <span className="text-xs text-muted-foreground font-mono">{txn.orderId.awb}</span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5 max-w-[300px] truncate" title={txn.description}>
                        {txn.description}
                      </p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">
                        {formatDate(txn.createdAt)} • {formatTime(txn.createdAt)}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-col sm:items-end">
                    <span className={`font-semibold text-sm ${
                      ['earning', 'bonus'].includes(txn.type) ? 'text-emerald-600' : 'text-red-600'
                    }`}>
                      {['earning', 'bonus'].includes(txn.type) ? '+' : '-'}{formatCurrency(txn.amount)}
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      Bal: {formatCurrency(txn.balanceAfter)}
                    </span>
                  </div>
                </div>
              )) : (
                <div className="text-center py-10">
                  <Package className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-50" />
                  <p className="text-muted-foreground font-medium">No transactions yet</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Earnings will appear here when customers book shipments with you.
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default PartnerWalletDashboard;
