import { API_BASE_URL } from "@/config";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import DashboardLayout from "@/components/DashboardLayout";
import {
  ArrowLeft, ArrowUpRight, ArrowDownToLine, IndianRupee,
  ChevronLeft, ChevronRight, Filter, Package
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

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
const formatDate = (dateStr: string) => new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
const formatTime = (dateStr: string) => new Date(dateStr).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });

const PartnerTransactions = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [entries, setEntries] = useState<LedgerEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [typeFilter, setTypeFilter] = useState("all");

  useEffect(() => {
    fetchLedger();
  }, [page, typeFilter]);

  const fetchLedger = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const typeParam = typeFilter !== "all" ? `&type=${typeFilter}` : "";
      const res = await fetch(`${API_BASE_URL}/api/partner/ledger?page=${page}&limit=20${typeParam}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setEntries(data.ledger || []);
        setTotalPages(data.pagination?.pages || 1);
        setTotal(data.pagination?.total || 0);
      }
    } catch (error) {
      console.error("Ledger fetch error:", error);
    } finally {
      setLoading(false);
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'earning': return <ArrowUpRight className="h-4 w-4 text-emerald-600" />;
      case 'payout': return <ArrowDownToLine className="h-4 w-4 text-red-600" />;
      default: return <IndianRupee className="h-4 w-4 text-gray-600" />;
    }
  };

  const getTypeBadge = (type: string) => {
    const styles: Record<string, { bg: string; text: string; label: string }> = {
      earning: { bg: "bg-emerald-100", text: "text-emerald-700", label: "Earning" },
      payout: { bg: "bg-red-100", text: "text-red-700", label: "Withdrawal" },
      bonus: { bg: "bg-blue-100", text: "text-blue-700", label: "Bonus" },
      deduction: { bg: "bg-amber-100", text: "text-amber-700", label: "Deduction" },
      penalty: { bg: "bg-red-100", text: "text-red-700", label: "Penalty" },
      cod_collection: { bg: "bg-indigo-100", text: "text-indigo-700", label: "COD Collection" },
      cod_remittance: { bg: "bg-orange-100", text: "text-orange-700", label: "COD Remittance" },
    };
    const s = styles[type] || { bg: "bg-gray-100", text: "text-gray-700", label: type };
    return <Badge className={`${s.bg} ${s.text} border-0 text-[11px] font-medium`}>{s.label}</Badge>;
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate("/partner/wallet")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold">Transaction History</h1>
              <p className="text-muted-foreground text-sm">{total} total entries</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <Select value={typeFilter} onValueChange={(val) => { setTypeFilter(val); setPage(1); }}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="earning">Earnings</SelectItem>
                <SelectItem value="payout">Withdrawals</SelectItem>
                <SelectItem value="bonus">Bonuses</SelectItem>
                <SelectItem value="deduction">Deductions</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Transactions List */}
        <Card>
          <CardContent className="p-0">
            {loading ? (
              <div className="flex items-center justify-center py-16">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
              </div>
            ) : entries.length > 0 ? (
              <div className="divide-y">
                {entries.map((txn) => (
                  <div key={txn._id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 hover:bg-muted/30 transition-colors gap-2">
                    <div className="flex items-start gap-3">
                      <div className={`h-9 w-9 rounded-lg flex items-center justify-center flex-shrink-0 ${
                        txn.type === 'earning' ? 'bg-emerald-100' : txn.type === 'payout' ? 'bg-red-100' : 'bg-gray-100'
                      }`}>
                        {getTypeIcon(txn.type)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          {getTypeBadge(txn.type)}
                          {txn.orderId?.awb && (
                            <span className="text-xs text-muted-foreground font-mono bg-muted px-1.5 py-0.5 rounded">
                              {txn.orderId.awb}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1 max-w-[400px]" title={txn.description}>
                          {txn.description}
                        </p>
                        <p className="text-[10px] text-muted-foreground mt-0.5">
                          {formatDate(txn.createdAt)} at {formatTime(txn.createdAt)}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-col sm:items-end ml-12 sm:ml-0">
                      <span className={`font-semibold ${
                        ['earning', 'bonus', 'cod_collection'].includes(txn.type) ? 'text-emerald-600' : 'text-red-600'
                      }`}>
                        {['earning', 'bonus', 'cod_collection'].includes(txn.type) ? '+' : '-'}{formatCurrency(txn.amount)}
                      </span>
                      <div className="text-[10px] text-muted-foreground space-x-2">
                        <span>Before: {formatCurrency(txn.balanceBefore)}</span>
                        <span>→</span>
                        <span className="font-medium">After: {formatCurrency(txn.balanceAfter)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-16">
                <Package className="h-14 w-14 text-muted-foreground mx-auto mb-3 opacity-40" />
                <p className="text-muted-foreground font-medium">No transactions found</p>
                <p className="text-sm text-muted-foreground mt-1">
                  {typeFilter !== "all" ? "Try changing the filter." : "Transactions will appear when you receive orders."}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Page {page} of {totalPages}
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage(p => Math.max(1, p - 1))}
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => setPage(p => p + 1)}
              >
                Next
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default PartnerTransactions;
