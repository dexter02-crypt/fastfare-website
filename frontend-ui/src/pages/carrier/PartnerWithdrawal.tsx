import { API_BASE_URL } from "@/config";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import DashboardLayout from "@/components/DashboardLayout";
import {
  ArrowLeft, Banknote, Clock, CheckCircle2, XCircle,
  AlertTriangle, Loader2, IndianRupee, ShieldCheck, Building2
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface WalletSummary {
  totalBalance: number;
  withdrawableBalance: number;
  heldBalance: number;
  availableForWithdrawal: number;
  pendingWithdrawalAmount: number;
  holdPeriodDays: number;
}

interface Withdrawal {
  _id: string;
  amount: number;
  status: string;
  bankDetails?: {
    accountName?: string;
    accountNumber?: string;
    ifsc?: string;
    bankName?: string;
    upiId?: string;
  };
  adminNote?: string;
  rejectionReason?: string;
  transactionRef?: string;
  balanceAtRequest: number;
  balanceAfterPayout: number;
  createdAt: string;
  paidAt?: string;
  reviewedAt?: string;
}

const formatCurrency = (amount: number) => `₹${Math.abs(amount).toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
const formatDate = (dateStr: string) => new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

const PartnerWithdrawal = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [wallet, setWallet] = useState<WalletSummary | null>(null);
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [amount, setAmount] = useState("");
  const [accountName, setAccountName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [ifsc, setIfsc] = useState("");
  const [bankName, setBankName] = useState("");
  const [upiId, setUpiId] = useState("");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem("token");
      const [walletRes, withdrawalRes] = await Promise.all([
        fetch(`${API_BASE_URL}/api/partner/wallet-summary`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        fetch(`${API_BASE_URL}/api/partner/withdrawals`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);

      if (walletRes.ok) {
        const data = await walletRes.json();
        setWallet(data.wallet);
      }
      if (withdrawalRes.ok) {
        const data = await withdrawalRes.json();
        setWithdrawals(data.withdrawals || []);
      }
    } catch (error) {
      console.error("Fetch error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleWithdraw = async () => {
    const amountNum = parseFloat(amount);
    if (!amountNum || amountNum <= 0) {
      toast({ title: "Invalid Amount", description: "Please enter a valid amount", variant: "destructive" });
      return;
    }
    if (amountNum > (wallet?.availableForWithdrawal || 0)) {
      toast({ title: "Insufficient Balance", description: "Amount exceeds your available withdrawal balance", variant: "destructive" });
      return;
    }
    if (!accountNumber && !upiId) {
      toast({ title: "Bank Details Required", description: "Please provide either bank account details or UPI ID", variant: "destructive" });
      return;
    }

    setSubmitting(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE_URL}/api/partner/withdraw`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          amount: amountNum,
          bankDetails: {
            accountName: accountName || undefined,
            accountNumber: accountNumber || undefined,
            ifsc: ifsc || undefined,
            bankName: bankName || undefined,
            upiId: upiId || undefined
          }
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        toast({ title: "Withdrawal Requested", description: `₹${amountNum.toLocaleString('en-IN')} withdrawal submitted for approval.` });
        setAmount("");
        fetchData(); // Refresh
      } else {
        toast({
          title: "Withdrawal Failed",
          description: data.error || "Something went wrong",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({ title: "Network Error", description: "Could not reach server", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, { bg: string; text: string; icon: any }> = {
      pending: { bg: "bg-amber-100", text: "text-amber-700", icon: Clock },
      approved: { bg: "bg-blue-100", text: "text-blue-700", icon: CheckCircle2 },
      processing: { bg: "bg-purple-100", text: "text-purple-700", icon: Loader2 },
      completed: { bg: "bg-emerald-100", text: "text-emerald-700", icon: CheckCircle2 },
      rejected: { bg: "bg-red-100", text: "text-red-700", icon: XCircle },
    };
    const s = styles[status] || styles.pending;
    const IconComp = s.icon;
    return (
      <Badge className={`${s.bg} ${s.text} border-0 gap-1`}>
        <IconComp className="h-3 w-3" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const hasPendingWithdrawal = withdrawals.some(w => ['pending', 'approved', 'processing'].includes(w.status));

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
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/partner/wallet")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Withdraw Funds</h1>
            <p className="text-muted-foreground text-sm">Transfer earnings to your bank account</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Withdrawal Form */}
          <div className="lg:col-span-3 space-y-6">
            {/* Balance Info */}
            <Card className="bg-gradient-to-r from-emerald-50 to-green-50 border-emerald-200">
              <CardContent className="p-5">
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <p className="text-xs text-emerald-700 font-medium">Total Balance</p>
                    <p className="text-xl font-bold text-emerald-800">{formatCurrency(wallet?.totalBalance || 0)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-blue-700 font-medium">Available</p>
                    <p className="text-xl font-bold text-blue-800">{formatCurrency(wallet?.availableForWithdrawal || 0)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-amber-700 font-medium">Held ({wallet?.holdPeriodDays || 2}d)</p>
                    <p className="text-xl font-bold text-amber-800">{formatCurrency(wallet?.heldBalance || 0)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {hasPendingWithdrawal ? (
              <Card className="border-amber-200 bg-amber-50/50">
                <CardContent className="p-5 flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-amber-800">Pending Withdrawal</p>
                    <p className="text-sm text-amber-700 mt-1">
                      You have an active withdrawal request of <span className="font-semibold">{formatCurrency(wallet?.pendingWithdrawalAmount || 0)}</span>.   
                      Please wait for it to be processed before requesting a new one.
                    </p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Banknote className="h-5 w-5" />
                    Request Withdrawal
                  </CardTitle>
                  <CardDescription>Funds will be transferred within 2 business days after approval</CardDescription>
                </CardHeader>
                <CardContent className="space-y-5">
                  {/* Amount */}
                  <div className="space-y-2">
                    <Label htmlFor="withdraw-amount">Amount (₹)</Label>
                    <div className="relative">
                      <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="withdraw-amount"
                        type="number"
                        placeholder="Enter amount"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        className="pl-9"
                        max={wallet?.availableForWithdrawal || 0}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Max withdrawable: <span className="font-medium">{formatCurrency(wallet?.availableForWithdrawal || 0)}</span>
                    </p>
                    {amount && (
                      <Button variant="link" className="p-0 h-auto text-xs" onClick={() => setAmount(String(wallet?.availableForWithdrawal || 0))}>
                        Withdraw full available amount
                      </Button>
                    )}
                  </div>

                  {/* Bank Details */}
                  <div className="border rounded-lg p-4 space-y-4">
                    <div className="flex items-center gap-2 mb-1">
                      <Building2 className="h-4 w-4 text-muted-foreground" />
                      <p className="font-medium text-sm">Bank Account Details</p>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label htmlFor="account-name" className="text-xs">Account Holder Name</Label>
                        <Input id="account-name" placeholder="Name on account" value={accountName} onChange={(e) => setAccountName(e.target.value)} />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="bank-name" className="text-xs">Bank Name</Label>
                        <Input id="bank-name" placeholder="e.g. State Bank of India" value={bankName} onChange={(e) => setBankName(e.target.value)} />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="account-number" className="text-xs">Account Number</Label>
                        <Input id="account-number" placeholder="Account number" value={accountNumber} onChange={(e) => setAccountNumber(e.target.value)} />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="ifsc" className="text-xs">IFSC Code</Label>
                        <Input id="ifsc" placeholder="e.g. SBIN0000001" value={ifsc} onChange={(e) => setIfsc(e.target.value.toUpperCase())} />
                      </div>
                    </div>
                    <div className="flex items-center gap-2 pt-2">
                      <div className="h-px flex-1 bg-border" />
                      <span className="text-xs text-muted-foreground">or</span>
                      <div className="h-px flex-1 bg-border" />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="upi" className="text-xs">UPI ID</Label>
                      <Input id="upi" placeholder="e.g. partner@upi" value={upiId} onChange={(e) => setUpiId(e.target.value)} />
                    </div>
                  </div>

                  <Button
                    className="w-full gradient-primary gap-2"
                    onClick={handleWithdraw}
                    disabled={submitting || !amount || parseFloat(amount) <= 0}
                  >
                    {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowLeft className="h-4 w-4 rotate-[-90deg]" />}
                    {submitting ? "Submitting..." : `Request Withdrawal of ${amount ? formatCurrency(parseFloat(amount)) : '₹0'}`}
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Withdrawal History */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Withdrawal History</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {withdrawals.length > 0 ? withdrawals.map((w) => (
                    <div key={w._id} className="p-3 rounded-lg border space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold">{formatCurrency(w.amount)}</span>
                        {getStatusBadge(w.status)}
                      </div>
                      <div className="text-xs text-muted-foreground space-y-0.5">
                        <p>Requested: {formatDate(w.createdAt)}</p>
                        {w.paidAt && <p>Paid: {formatDate(w.paidAt)}</p>}
                        {w.transactionRef && <p className="font-mono">Ref: {w.transactionRef}</p>}
                        {w.rejectionReason && (
                          <p className="text-red-600">Reason: {w.rejectionReason}</p>
                        )}
                        {w.bankDetails?.accountNumber && (
                          <p>A/C: ••••{w.bankDetails.accountNumber.slice(-4)}</p>
                        )}
                        {w.bankDetails?.upiId && (
                          <p>UPI: {w.bankDetails.upiId}</p>
                        )}
                      </div>
                    </div>
                  )) : (
                    <div className="text-center py-8">
                      <Banknote className="h-10 w-10 text-muted-foreground mx-auto mb-2 opacity-40" />
                      <p className="text-sm text-muted-foreground">No withdrawal history</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Security Info */}
            <Card className="mt-4 bg-gradient-to-b from-blue-50/50 to-transparent border-blue-200">
              <CardContent className="p-4">
                <div className="flex items-start gap-2">
                  <ShieldCheck className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-blue-800 text-xs">Secure Withdrawals</p>
                    <p className="text-[11px] text-blue-600 mt-0.5 leading-relaxed">
                      All withdrawals are reviewed by our team for security. Funds are transferred within 
                      2 business days after approval. Keep your bank details up to date for quick processing.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default PartnerWithdrawal;
