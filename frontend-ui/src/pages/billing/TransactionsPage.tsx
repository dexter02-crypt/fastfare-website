import { useState, useEffect } from "react";
import { API_BASE_URL } from "@/config";
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import DashboardLayout from "@/components/DashboardLayout";
import { Search, Download, ArrowUpRight, ArrowDownRight, Filter } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const TransactionsPage = () => {
    const [transactions, setTransactions] = useState<{ id: string; type: string; amount: string; date: string; status: string; method: string }[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchTransactions = async () => {
            try {
                const token = localStorage.getItem("token");
                const res = await fetch(`${API_BASE_URL}/api/payment/wallet`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                const data = await res.json();
                if (data && data.transactions) {
                    const formatted = data.transactions.map((txn: any) => ({
                        id: txn.id,
                        type: txn.type,
                        amount: `₹${txn.amount}`,
                        date: new Date(txn.createdAt).toLocaleDateString(),
                        status: txn.status,
                        method: txn.type === 'recharge' ? 'Razorpay' : 'Wallet'
                    }));
                    setTransactions(formatted);
                }
            } catch (error) {
                console.error("Failed to fetch transactions:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchTransactions();
    }, []);
    const [searchTerm, setSearchTerm] = useState("");

    const filteredTransactions = transactions.filter(txn =>
        txn.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        txn.type.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <DashboardLayout>
            <div className="space-y-6">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h1 className="text-3xl font-bold">Transaction History</h1>
                        <p className="text-muted-foreground">View and download your wallet transactions</p>
                    </div>
                    <Button variant="outline" className="gap-2">
                        <Download className="h-4 w-4" />
                        Export CSV
                    </Button>
                </div>

                <Card>
                    <CardHeader>
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                            <CardTitle>All Transactions</CardTitle>
                            <div className="flex items-center gap-2 w-full sm:w-auto">
                                <div className="relative flex-1 sm:w-64">
                                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        placeholder="Search transactions..."
                                        className="pl-9 w-full"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                    />
                                </div>
                                <Button variant="outline" size="icon">
                                    <Filter className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="p-0 sm:p-6 table-responsive-wrapper">
                        <span className="scroll-hint px-4 pt-4 pb-2 block sm:hidden">Scroll right to view all columns →</span>
                        <div className="min-w-[600px]">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Transaction ID</TableHead>
                                        <TableHead>Type</TableHead>
                                        <TableHead>Date</TableHead>
                                        <TableHead>Method</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead className="text-right">Amount</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredTransactions.map((txn) => (
                                        <TableRow key={txn.id}>
                                            <TableCell className="font-medium">{txn.id}</TableCell>
                                            <TableCell>{txn.type}</TableCell>
                                            <TableCell>{txn.date}</TableCell>
                                            <TableCell>{txn.method}</TableCell>
                                            <TableCell>
                                                <Badge variant={txn.status === "Completed" ? "default" : "secondary"}>
                                                    {txn.status}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className={`text-right font-semibold ${txn.amount.startsWith('+') ? "text-green-600" : ""}`}>
                                                {txn.amount}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </DashboardLayout>
    );
};

export default TransactionsPage;
