import { API_BASE_URL } from "@/config";
import { useState, useEffect } from "react";
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

const invoices: { id: string; period: string; amount: string; status: string; dueDate: string }[] = [];

interface Transaction {
  id: string;
  type: string;
  amount: number;
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

  const recentTxns = walletData?.transactions || [];
  const balance = walletData?.balance !== undefined ? walletData.balance : 0;

  // Calculate this month's spend/earnings
  const currentMonth = new Date().getMonth();
  const monthlyAmount = recentTxns
    .filter((t: Transaction) => {
      const isThisMonth = new Date(t.createdAt).getMonth() === currentMonth;
      if (userRole === 'shipment_partner') {
        return isThisMonth && t.amount > 0; // Sum earnings
      }
      return isThisMonth && t.amount < 0; // Sum spend
    })
    .reduce((sum: number, t: Transaction) => sum + Math.abs(t.amount), 0);

  const stats = [
    {
      label: userRole === 'shipment_partner' ? "Account Funds" : "Wallet Balance",
      value: `₹${balance.toLocaleString()}`,
      change: "+₹0.00",
      trend: "neutral",
      icon: Wallet
    },
    {
      label: userRole === 'shipment_partner' ? "This Month's Earnings" : "This Month's Spend",
      value: `₹${monthlyAmount.toLocaleString()}`, // Dynamic value
      change: "",
      trend: "neutral",
      icon: TrendingUp
    },
    { label: "Pending Payments", value: "₹0", change: "0 invoices", trend: "neutral", icon: Clock },
    { label: "Credit Limit", value: "₹0", change: "₹0 used", trend: "neutral", icon: CreditCard },
  ];

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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="h-14 w-14 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Wallet className="h-7 w-7 text-primary" />
                </div>
              </div>
              <p className="text-4xl font-bold tracking-tight">₹{balance.toLocaleString()}</p>
              <p className="text-sm text-muted-foreground mt-1">Wallet Balance</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="h-14 w-14 rounded-xl bg-orange-100 flex items-center justify-center">
                  <TrendingUp className="h-7 w-7 text-orange-600" />
                </div>
              </div>
              <p className="text-4xl font-bold tracking-tight">₹{monthlyAmount.toLocaleString()}</p>
              <p className="text-sm text-muted-foreground mt-1">This Month's Spend</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="h-14 w-14 rounded-xl bg-blue-100 flex items-center justify-center">
                  <Clock className="h-7 w-7 text-blue-600" />
                </div>
              </div>
              <p className="text-4xl font-bold tracking-tight">₹0</p>
              <p className="text-sm text-muted-foreground mt-1">Pending Payments</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="h-14 w-14 rounded-xl bg-purple-100 flex items-center justify-center">
                  <CreditCard className="h-7 w-7 text-purple-600" />
                </div>
              </div>
              <p className="text-4xl font-bold tracking-tight">--</p>
              <p className="text-sm text-muted-foreground mt-1">Credit Limit</p>
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
                  <div key={txn.id} className="flex items-center justify-between p-3 rounded-lg border">
                    <div>
                      <p className="font-medium text-sm capitalize">{txn.type}</p>
                      <p className="text-xs text-muted-foreground">{new Date(txn.createdAt).toLocaleDateString()}</p>
                    </div>
                    <span className={`font-semibold ${txn.amount > 0 ? "text-green-500" : "text-foreground"}`}>
                      {txn.amount > 0 ? "+" : ""}₹{Math.abs(txn.amount).toLocaleString()}
                    </span>
                  </div>
                )) : (
                  <p className="text-center text-muted-foreground py-4">No recent transactions</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Invoices (Static for now as no backend) */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Invoices</CardTitle>
                <CardDescription>Your billing history</CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {invoices.map((invoice) => (
                  <div key={invoice.id} className="flex items-center justify-between p-4 rounded-lg border">
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Receipt className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">{invoice.id}</p>
                        <p className="text-sm text-muted-foreground">{invoice.period}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">{invoice.amount}</p>
                      <Badge variant={invoice.status === "Paid" ? "default" : "secondary"}>
                        {invoice.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

      </div>
    </DashboardLayout>
  );
};

export default BillingDashboard;
