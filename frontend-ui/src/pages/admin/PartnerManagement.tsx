import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    Dialog, DialogContent, DialogDescription, DialogFooter,
    DialogHeader, DialogTitle
} from "@/components/ui/dialog";
import {
    DropdownMenu, DropdownMenuContent, DropdownMenuItem,
    DropdownMenuSeparator, DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import DashboardLayout from "@/components/DashboardLayout";
import {
    Users, Search, Shield, Medal, Crown, Wallet, TrendingUp,
    ArrowUpRight, ArrowDownRight, CheckCircle2, XCircle, Clock,
    Eye, ChevronLeft, IndianRupee, Truck, AlertCircle,
    RefreshCw, Ban, CheckCheck, Clock3, Trash2, PauseCircle,
    ShieldAlert, ShieldCheck, MoreHorizontal
} from "lucide-react";
import { settlementApi } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

const TIER_STYLES: Record<string, { label: string; icon: any; bg: string; text: string; badge: string }> = {
    bronze: {
        label: "Bronze", icon: Shield,
        bg: "bg-amber-50 dark:bg-amber-950/30",
        text: "text-amber-700 dark:text-amber-400",
        badge: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300"
    },
    silver: {
        label: "Silver", icon: Medal,
        bg: "bg-slate-50 dark:bg-slate-950/30",
        text: "text-slate-600 dark:text-slate-400",
        badge: "bg-slate-200 text-slate-800 dark:bg-slate-800 dark:text-slate-300"
    },
    gold: {
        label: "Gold", icon: Crown,
        bg: "bg-yellow-50 dark:bg-yellow-950/30",
        text: "text-yellow-600 dark:text-yellow-500",
        badge: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300"
    }
};

const PartnerManagement = () => {
    const { toast } = useToast();
    const [loading, setLoading] = useState(true);
    const [partners, setPartners] = useState<any[]>([]);
    const [summary, setSummary] = useState<any>({});
    const [pagination, setPagination] = useState<any>({});
    const [search, setSearch] = useState('');
    const [tierFilter, setTierFilter] = useState('all');
    const [page, setPage] = useState(1);

    // Detail view
    const [selectedPartner, setSelectedPartner] = useState<any>(null);
    const [detailLoading, setDetailLoading] = useState(false);

    // Withdrawal management
    const [withdrawals, setWithdrawals] = useState<any[]>([]);
    const [withdrawalSummary, setWithdrawalSummary] = useState<any>({});
    const [withdrawalFilter, setWithdrawalFilter] = useState('all');

    // Admin action dialogs
    const [tierDialogOpen, setTierDialogOpen] = useState(false);
    const [tierTarget, setTierTarget] = useState<any>(null);
    const [newTier, setNewTier] = useState('');
    const [tierReason, setTierReason] = useState('');
    const [approveDialogOpen, setApproveDialogOpen] = useState(false);
    const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
    const [withdrawalTarget, setWithdrawalTarget] = useState<any>(null);
    const [transactionRef, setTransactionRef] = useState('');
    const [adminNote, setAdminNote] = useState('');
    const [rejectionReason, setRejectionReason] = useState('');

    // Account management dialogs
    const [statusDialogOpen, setStatusDialogOpen] = useState(false);
    const [statusTarget, setStatusTarget] = useState<any>(null);
    const [statusAction, setStatusAction] = useState('');
    const [statusReason, setStatusReason] = useState('');
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState<any>(null);
    const [deleteReason, setDeleteReason] = useState('');
    const [deleteConfirm, setDeleteConfirm] = useState('');

    useEffect(() => { loadPartners(); loadWithdrawals(); }, [page, tierFilter]);

    const loadPartners = async () => {
        setLoading(true);
        try {
            const data = await settlementApi.getAdminPartners(page, search || undefined, tierFilter === 'all' ? undefined : tierFilter);
            setPartners(data.partners || []);
            setSummary(data.summary || {});
            setPagination(data.pagination || {});
        } catch (err: any) {
            toast({ title: "Error loading partners", description: err.message, variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    const loadWithdrawals = async () => {
        try {
            const data = await settlementApi.getAdminWithdrawals(withdrawalFilter === 'all' ? undefined : withdrawalFilter);
            setWithdrawals(data.requests || []);
            setWithdrawalSummary(data.summary || {});
        } catch { }
    };

    const openPartnerDetail = async (partner: any) => {
        setDetailLoading(true);
        try {
            const data = await settlementApi.getAdminPartnerDetail(partner._id);
            setSelectedPartner(data.partner);
        } catch (err: any) {
            toast({ title: "Error", description: err.message, variant: "destructive" });
        } finally {
            setDetailLoading(false);
        }
    };

    const handleTierOverride = async () => {
        if (!tierTarget || !newTier || !tierReason) return;
        try {
            await settlementApi.overrideTier(tierTarget._id, newTier, tierReason);
            toast({ title: "✅ Tier updated", description: `${tierTarget.businessName || tierTarget.email} → ${newTier.charAt(0).toUpperCase() + newTier.slice(1)}` });
            setTierDialogOpen(false);
            setTierReason('');
            setNewTier('');
            loadPartners();
            if (selectedPartner?._id === tierTarget._id) openPartnerDetail(tierTarget);
        } catch (err: any) {
            toast({ title: "Error", description: err.message, variant: "destructive" });
        }
    };

    const handleApproveWithdrawal = async () => {
        if (!withdrawalTarget) return;
        try {
            await settlementApi.approveWithdrawal(withdrawalTarget._id, transactionRef, adminNote);
            toast({ title: "✅ Withdrawal approved", description: `₹${withdrawalTarget.amount?.toLocaleString('en-IN')} payout processed` });
            setApproveDialogOpen(false);
            setTransactionRef('');
            setAdminNote('');
            loadWithdrawals();
            loadPartners();
        } catch (err: any) {
            toast({ title: "Error", description: err.message, variant: "destructive" });
        }
    };

    const handleRejectWithdrawal = async () => {
        if (!withdrawalTarget) return;
        try {
            await settlementApi.rejectWithdrawal(withdrawalTarget._id, rejectionReason);
            toast({ title: "Withdrawal rejected" });
            setRejectDialogOpen(false);
            setRejectionReason('');
            loadWithdrawals();
            loadPartners();
        } catch (err: any) {
            toast({ title: "Error", description: err.message, variant: "destructive" });
        }
    };

    const handleStatusUpdate = async () => {
        if (!statusTarget || !statusAction || !statusReason) return;
        try {
            await settlementApi.updateAccountStatus(statusTarget._id, statusAction, statusReason);
            const label = statusAction === 'active' ? 'Reactivated' : statusAction === 'held' ? 'Put on Hold' : 'Restricted';
            toast({ title: `✅ Account ${label}`, description: statusTarget.businessName || statusTarget.email });
            setStatusDialogOpen(false);
            setStatusReason('');
            setStatusAction('');
            loadPartners();
            if (selectedPartner?._id === statusTarget._id) openPartnerDetail(statusTarget);
        } catch (err: any) {
            toast({ title: "Error", description: err.message, variant: "destructive" });
        }
    };

    const handleDeleteAccount = async () => {
        if (!deleteTarget || !deleteReason || deleteConfirm !== 'DELETE') return;
        try {
            await settlementApi.deleteAccount(deleteTarget._id, deleteReason);
            toast({ title: "🗑️ Account Deleted", description: `${deleteTarget.businessName || deleteTarget.email} permanently removed` });
            setDeleteDialogOpen(false);
            setDeleteReason('');
            setDeleteConfirm('');
            setSelectedPartner(null);
            loadPartners();
        } catch (err: any) {
            toast({ title: "Error", description: err.message, variant: "destructive" });
        }
    };

    // ── Detail View ──
    if (selectedPartner) {
        const tier = TIER_STYLES[selectedPartner.tier] || TIER_STYLES.bronze;
        const TierIcon = tier.icon;
        return (
            <DashboardLayout>
                <div className="space-y-6 p-6">
                    <div className="flex items-center gap-3">
                        <Button variant="ghost" size="icon" onClick={() => setSelectedPartner(null)}>
                            <ChevronLeft className="h-5 w-5" />
                        </Button>
                        <div className="flex-1">
                            <h1 className="text-2xl font-bold">{selectedPartner.businessName || selectedPartner.email}</h1>
                            <p className="text-muted-foreground text-sm">{selectedPartner.email} • {selectedPartner.phone}</p>
                        </div>
                        <Badge className={tier.badge}>
                            <TierIcon className="h-3.5 w-3.5 mr-1" />
                            {tier.label}
                        </Badge>
                        {selectedPartner.accountStatus && selectedPartner.accountStatus !== 'active' && (
                            <Badge className={selectedPartner.accountStatus === 'held' ? 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300' : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'}>
                                {selectedPartner.accountStatus === 'held' ? <PauseCircle className="h-3.5 w-3.5 mr-1" /> : <ShieldAlert className="h-3.5 w-3.5 mr-1" />}
                                {selectedPartner.accountStatus.charAt(0).toUpperCase() + selectedPartner.accountStatus.slice(1)}
                            </Badge>
                        )}
                        <div className="flex gap-1">
                            <Button variant="outline" size="sm" onClick={() => {
                                setTierTarget(selectedPartner);
                                setTierDialogOpen(true);
                            }}>
                                Change Tier
                            </Button>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="outline" size="icon" className="h-8 w-8">
                                        <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    {(!selectedPartner.accountStatus || selectedPartner.accountStatus === 'active') ? (
                                        <>
                                            <DropdownMenuItem onClick={() => { setStatusTarget(selectedPartner); setStatusAction('held'); setStatusDialogOpen(true); }}>
                                                <PauseCircle className="h-4 w-4 mr-2 text-orange-500" /> Hold Account
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => { setStatusTarget(selectedPartner); setStatusAction('restricted'); setStatusDialogOpen(true); }}>
                                                <ShieldAlert className="h-4 w-4 mr-2 text-red-500" /> Restrict Account
                                            </DropdownMenuItem>
                                        </>
                                    ) : (
                                        <DropdownMenuItem onClick={() => { setStatusTarget(selectedPartner); setStatusAction('active'); setStatusDialogOpen(true); }}>
                                            <ShieldCheck className="h-4 w-4 mr-2 text-green-500" /> Reactivate Account
                                        </DropdownMenuItem>
                                    )}
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => { setDeleteTarget(selectedPartner); setDeleteDialogOpen(true); }}>
                                        <Trash2 className="h-4 w-4 mr-2" /> Delete Account
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    </div>

                    {/* Financial Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <Card className="hover:shadow-md transition-shadow">
                            <CardContent className="p-4">
                                <p className="text-sm text-muted-foreground">Current Balance</p>
                                <p className="text-2xl font-bold text-green-600 mt-1">₹{(selectedPartner.balance || 0).toLocaleString('en-IN')}</p>
                            </CardContent>
                        </Card>
                        <Card className="hover:shadow-md transition-shadow">
                            <CardContent className="p-4">
                                <p className="text-sm text-muted-foreground">Total Earnings</p>
                                <p className="text-2xl font-bold mt-1">₹{(selectedPartner.totalEarnings || 0).toLocaleString('en-IN')}</p>
                            </CardContent>
                        </Card>
                        <Card className="hover:shadow-md transition-shadow">
                            <CardContent className="p-4">
                                <p className="text-sm text-muted-foreground">Total Payouts</p>
                                <p className="text-2xl font-bold text-purple-600 mt-1">₹{(selectedPartner.totalPayouts || 0).toLocaleString('en-IN')}</p>
                            </CardContent>
                        </Card>
                        <Card className="hover:shadow-md transition-shadow">
                            <CardContent className="p-4">
                                <p className="text-sm text-muted-foreground">Joined</p>
                                <p className="text-lg font-bold mt-1">
                                    {new Date(selectedPartner.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                                </p>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Tabs: Ledger & Withdrawals */}
                    <Tabs defaultValue="ledger" className="w-full">
                        <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger value="ledger">Financial Ledger</TabsTrigger>
                            <TabsTrigger value="withdrawals">Withdrawals</TabsTrigger>
                        </TabsList>

                        <TabsContent value="ledger">
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-lg">Recent Transactions</CardTitle>
                                    <CardDescription>Last 20 ledger entries</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    {(!selectedPartner.ledger || selectedPartner.ledger.length === 0) ? (
                                        <div className="text-center py-8 text-muted-foreground">
                                            <IndianRupee className="h-12 w-12 mx-auto mb-3 opacity-40" />
                                            <p>No ledger entries yet.</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-2">
                                            {selectedPartner.ledger.map((entry: any) => (
                                                <div key={entry._id} className="flex items-center justify-between p-3 rounded-lg border hover:bg-accent/30 transition-colors">
                                                    <div className="flex items-center gap-3">
                                                        <div className={`p-1.5 rounded-md ${entry.type === 'earning' ? 'bg-green-100 dark:bg-green-900/30' :
                                                            entry.type === 'payout' ? 'bg-purple-100 dark:bg-purple-900/30' :
                                                                'bg-gray-100 dark:bg-gray-800'
                                                            }`}>
                                                            {entry.type === 'earning' ? (
                                                                <ArrowUpRight className="h-4 w-4 text-green-600" />
                                                            ) : (
                                                                <ArrowDownRight className="h-4 w-4 text-purple-600" />
                                                            )}
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-medium capitalize">{entry.type}</p>
                                                            <p className="text-xs text-muted-foreground truncate max-w-[400px]">{entry.description}</p>
                                                        </div>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className={`text-sm font-semibold ${entry.type === 'earning' ? 'text-green-600' : 'text-purple-600'}`}>
                                                            {entry.type === 'earning' ? '+' : '-'}₹{(entry.amount || 0).toLocaleString('en-IN')}
                                                        </p>
                                                        <p className="text-xs text-muted-foreground">
                                                            Bal: ₹{(entry.balanceAfter || 0).toLocaleString('en-IN')}
                                                        </p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </TabsContent>

                        <TabsContent value="withdrawals">
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-lg">Withdrawal Requests</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    {(!selectedPartner.withdrawals || selectedPartner.withdrawals.length === 0) ? (
                                        <div className="text-center py-8 text-muted-foreground">
                                            <Wallet className="h-12 w-12 mx-auto mb-3 opacity-40" />
                                            <p>No withdrawal requests from this partner.</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-3">
                                            {selectedPartner.withdrawals.map((w: any) => (
                                                <div key={w._id} className="flex items-center justify-between p-4 rounded-lg border hover:bg-accent/30 transition-colors">
                                                    <div className="flex items-center gap-3">
                                                        <div className={`p-2 rounded-lg ${w.status === 'completed' ? 'bg-green-100 dark:bg-green-900/30' :
                                                            w.status === 'pending' ? 'bg-orange-100 dark:bg-orange-900/30' :
                                                                w.status === 'rejected' ? 'bg-red-100 dark:bg-red-900/30' :
                                                                    'bg-blue-100 dark:bg-blue-900/30'
                                                            }`}>
                                                            {w.status === 'completed' ? <CheckCircle2 className="h-5 w-5 text-green-600" /> :
                                                                w.status === 'pending' ? <Clock3 className="h-5 w-5 text-orange-600" /> :
                                                                    w.status === 'rejected' ? <XCircle className="h-5 w-5 text-red-600" /> :
                                                                        <Clock className="h-5 w-5 text-blue-600" />}
                                                        </div>
                                                        <div>
                                                            <p className="font-semibold">₹{(w.amount || 0).toLocaleString('en-IN')}</p>
                                                            <p className="text-xs text-muted-foreground">
                                                                {new Date(w.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-3">
                                                        <StatusBadge status={w.status} />
                                                        {w.status === 'pending' && (
                                                            <div className="flex gap-1">
                                                                <Button size="sm" className="h-7" onClick={() => {
                                                                    setWithdrawalTarget(w);
                                                                    setApproveDialogOpen(true);
                                                                }}>
                                                                    <CheckCheck className="h-3.5 w-3.5 mr-1" /> Approve
                                                                </Button>
                                                                <Button size="sm" variant="destructive" className="h-7" onClick={() => {
                                                                    setWithdrawalTarget(w);
                                                                    setRejectDialogOpen(true);
                                                                }}>
                                                                    <Ban className="h-3.5 w-3.5 mr-1" /> Reject
                                                                </Button>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </TabsContent>
                    </Tabs>
                </div>

                {/* Tier Override Dialog */}
                <TierDialog
                    open={tierDialogOpen}
                    onOpenChange={setTierDialogOpen}
                    target={tierTarget}
                    newTier={newTier}
                    setNewTier={setNewTier}
                    reason={tierReason}
                    setReason={setTierReason}
                    onSubmit={handleTierOverride}
                />

                {/* Approve Withdrawal Dialog */}
                <ApproveDialog
                    open={approveDialogOpen}
                    onOpenChange={setApproveDialogOpen}
                    target={withdrawalTarget}
                    transactionRef={transactionRef}
                    setTransactionRef={setTransactionRef}
                    adminNote={adminNote}
                    setAdminNote={setAdminNote}
                    onSubmit={handleApproveWithdrawal}
                />

                {/* Reject Dialog */}
                <RejectDialog
                    open={rejectDialogOpen}
                    onOpenChange={setRejectDialogOpen}
                    target={withdrawalTarget}
                    reason={rejectionReason}
                    setReason={setRejectionReason}
                    onSubmit={handleRejectWithdrawal}
                />

                {/* Account Status Dialog */}
                <StatusUpdateDialog
                    open={statusDialogOpen}
                    onOpenChange={setStatusDialogOpen}
                    target={statusTarget}
                    action={statusAction}
                    reason={statusReason}
                    setReason={setStatusReason}
                    onSubmit={handleStatusUpdate}
                />

                {/* Delete Account Dialog */}
                <DeleteAccountDialog
                    open={deleteDialogOpen}
                    onOpenChange={setDeleteDialogOpen}
                    target={deleteTarget}
                    reason={deleteReason}
                    setReason={setDeleteReason}
                    confirm={deleteConfirm}
                    setConfirm={setDeleteConfirm}
                    onSubmit={handleDeleteAccount}
                />
            </DashboardLayout>
        );
    }

    // ── Main List View ──
    return (
        <DashboardLayout>
            <div className="space-y-6 p-6">
                {/* Page Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                            <Users className="h-6 w-6" /> Partner Management
                        </h1>
                        <p className="text-muted-foreground mt-1">Manage delivery partners, tiers, balances & withdrawals</p>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => { loadPartners(); loadWithdrawals(); }}>
                        <RefreshCw className="h-4 w-4 mr-2" /> Refresh
                    </Button>
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    <SummaryCard label="Total Partners" value={summary.total || 0} icon={Users} />
                    <SummaryCard label="Bronze" value={summary.bronze || 0} icon={Shield} color="text-amber-600" />
                    <SummaryCard label="Silver" value={summary.silver || 0} icon={Medal} color="text-slate-500" />
                    <SummaryCard label="Gold" value={summary.gold || 0} icon={Crown} color="text-yellow-500" />
                    <SummaryCard label="Pending Withdrawals" value={summary.pendingWithdrawals || 0} icon={AlertCircle} color="text-orange-600" />
                </div>

                {/* Tabs: Partners / Withdrawals */}
                <Tabs defaultValue="partners" className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="partners">All Partners</TabsTrigger>
                        <TabsTrigger value="withdrawals" className="relative">
                            Withdrawal Requests
                            {(withdrawalSummary.pending || 0) > 0 && (
                                <span className="ml-2 inline-flex items-center justify-center h-5 w-5 rounded-full bg-orange-500 text-white text-xs font-bold">
                                    {withdrawalSummary.pending}
                                </span>
                            )}
                        </TabsTrigger>
                    </TabsList>

                    {/* Partners Tab */}
                    <TabsContent value="partners">
                        <Card>
                            <CardHeader>
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                                    <div>
                                        <CardTitle className="text-lg">Partners</CardTitle>
                                        <CardDescription>{pagination.total || 0} partners total</CardDescription>
                                    </div>
                                    <div className="flex gap-2">
                                        <div className="relative flex-1 md:w-64">
                                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                            <Input
                                                placeholder="Search by name, email, phone..."
                                                value={search}
                                                onChange={(e) => setSearch(e.target.value)}
                                                onKeyDown={(e) => e.key === 'Enter' && loadPartners()}
                                                className="pl-9"
                                            />
                                        </div>
                                        <Select value={tierFilter} onValueChange={(v) => { setTierFilter(v); setPage(1); }}>
                                            <SelectTrigger className="w-32">
                                                <SelectValue placeholder="Tier" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="all">All Tiers</SelectItem>
                                                <SelectItem value="bronze">Bronze</SelectItem>
                                                <SelectItem value="silver">Silver</SelectItem>
                                                <SelectItem value="gold">Gold</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent>
                                {loading ? (
                                    <div className="flex items-center justify-center py-12">
                                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
                                    </div>
                                ) : partners.length === 0 ? (
                                    <div className="text-center py-12 text-muted-foreground">
                                        <Truck className="h-12 w-12 mx-auto mb-3 opacity-40" />
                                        <p>No partners found.</p>
                                    </div>
                                ) : (
                                    <div className="space-y-2">
                                        {/* Table Header */}
                                        <div className="grid grid-cols-12 gap-3 px-4 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider border-b">
                                            <div className="col-span-3">Partner</div>
                                            <div className="col-span-1 text-center">Tier</div>
                                            <div className="col-span-2 text-right">Balance</div>
                                            <div className="col-span-2 text-right">Earnings</div>
                                            <div className="col-span-1 text-right">Trips</div>
                                            <div className="col-span-1 text-right">Payouts</div>
                                            <div className="col-span-2 text-right">Actions</div>
                                        </div>

                                        {partners.map((p: any) => {
                                            const ts = TIER_STYLES[p.tier] || TIER_STYLES.bronze;
                                            const TIcon = ts.icon;
                                            return (
                                                <div key={p._id} className="grid grid-cols-12 gap-3 items-center px-4 py-3 rounded-lg border hover:bg-accent/30 transition-colors">
                                                    <div className="col-span-3">
                                                        <p className="font-medium text-sm truncate">{p.businessName || '—'}</p>
                                                        <p className="text-xs text-muted-foreground truncate">{p.email}</p>
                                                        {p.phone && <p className="text-xs text-muted-foreground">{p.phone}</p>}
                                                    </div>
                                                    <div className="col-span-1 flex justify-center">
                                                        <Badge className={`${ts.badge} text-xs`}>
                                                            <TIcon className="h-3 w-3 mr-1" />
                                                            {ts.label}
                                                        </Badge>
                                                    </div>
                                                    <div className="col-span-2 text-right">
                                                        <span className="font-semibold text-sm text-green-600">
                                                            ₹{(p.balance || 0).toLocaleString('en-IN')}
                                                        </span>
                                                        {p.pendingWithdrawal && (
                                                            <p className="text-xs text-orange-500">
                                                                ₹{p.pendingWithdrawal.amount.toLocaleString('en-IN')} pending
                                                            </p>
                                                        )}
                                                    </div>
                                                    <div className="col-span-2 text-right text-sm">
                                                        ₹{(p.totalEarnings || 0).toLocaleString('en-IN')}
                                                    </div>
                                                    <div className="col-span-1 text-right text-sm">
                                                        {p.totalTrips || 0}
                                                    </div>
                                                    <div className="col-span-1 text-right text-sm text-purple-600">
                                                        ₹{(p.totalPayouts || 0).toLocaleString('en-IN')}
                                                    </div>
                                                    <div className="col-span-2 flex justify-end gap-1">
                                                        <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => openPartnerDetail(p)}>
                                                            <Eye className="h-3 w-3 mr-1" /> View
                                                        </Button>
                                                        <DropdownMenu>
                                                            <DropdownMenuTrigger asChild>
                                                                <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                                                                    <MoreHorizontal className="h-3.5 w-3.5" />
                                                                </Button>
                                                            </DropdownMenuTrigger>
                                                            <DropdownMenuContent align="end">
                                                                <DropdownMenuItem onClick={() => { setTierTarget(p); setTierDialogOpen(true); }}>
                                                                    <Crown className="h-3.5 w-3.5 mr-2" /> Change Tier
                                                                </DropdownMenuItem>
                                                                {(!p.accountStatus || p.accountStatus === 'active') ? (
                                                                    <>
                                                                        <DropdownMenuItem onClick={() => { setStatusTarget(p); setStatusAction('held'); setStatusDialogOpen(true); }}>
                                                                            <PauseCircle className="h-3.5 w-3.5 mr-2 text-orange-500" /> Hold
                                                                        </DropdownMenuItem>
                                                                        <DropdownMenuItem onClick={() => { setStatusTarget(p); setStatusAction('restricted'); setStatusDialogOpen(true); }}>
                                                                            <ShieldAlert className="h-3.5 w-3.5 mr-2 text-red-500" /> Restrict
                                                                        </DropdownMenuItem>
                                                                    </>
                                                                ) : (
                                                                    <DropdownMenuItem onClick={() => { setStatusTarget(p); setStatusAction('active'); setStatusDialogOpen(true); }}>
                                                                        <ShieldCheck className="h-3.5 w-3.5 mr-2 text-green-500" /> Reactivate
                                                                    </DropdownMenuItem>
                                                                )}
                                                                <DropdownMenuSeparator />
                                                                <DropdownMenuItem className="text-destructive" onClick={() => { setDeleteTarget(p); setDeleteDialogOpen(true); }}>
                                                                    <Trash2 className="h-3.5 w-3.5 mr-2" /> Delete
                                                                </DropdownMenuItem>
                                                            </DropdownMenuContent>
                                                        </DropdownMenu>
                                                    </div>
                                                </div>
                                            );
                                        })}

                                        {/* Pagination */}
                                        {pagination.pages > 1 && (
                                            <div className="flex items-center justify-between pt-4">
                                                <p className="text-sm text-muted-foreground">
                                                    Page {pagination.page} of {pagination.pages}
                                                </p>
                                                <div className="flex gap-2">
                                                    <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>
                                                        Previous
                                                    </Button>
                                                    <Button variant="outline" size="sm" disabled={page >= pagination.pages} onClick={() => setPage(p => p + 1)}>
                                                        Next
                                                    </Button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Withdrawals Tab */}
                    <TabsContent value="withdrawals">
                        <Card>
                            <CardHeader>
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                                    <div>
                                        <CardTitle className="text-lg">Withdrawal Requests</CardTitle>
                                        <CardDescription className="flex gap-4 mt-1">
                                            <span className="text-orange-600 font-medium">{withdrawalSummary.pending || 0} pending</span>
                                            <span className="text-green-600">{withdrawalSummary.approved || 0} approved</span>
                                            <span className="text-red-500">{withdrawalSummary.rejected || 0} rejected</span>
                                        </CardDescription>
                                    </div>
                                    <Select value={withdrawalFilter} onValueChange={(v) => { setWithdrawalFilter(v); }}>
                                        <SelectTrigger className="w-36">
                                            <SelectValue placeholder="Status" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">All Status</SelectItem>
                                            <SelectItem value="pending">Pending</SelectItem>
                                            <SelectItem value="completed">Completed</SelectItem>
                                            <SelectItem value="rejected">Rejected</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </CardHeader>
                            <CardContent>
                                {withdrawals.length === 0 ? (
                                    <div className="text-center py-12 text-muted-foreground">
                                        <Wallet className="h-12 w-12 mx-auto mb-3 opacity-40" />
                                        <p>No withdrawal requests.</p>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {withdrawals.map((w: any) => (
                                            <div key={w._id} className="flex items-center justify-between p-4 rounded-lg border hover:bg-accent/30 transition-colors">
                                                <div className="flex items-center gap-4">
                                                    <div className={`p-2.5 rounded-lg ${w.status === 'completed' ? 'bg-green-100 dark:bg-green-900/30' :
                                                        w.status === 'pending' ? 'bg-orange-100 dark:bg-orange-900/30' :
                                                            'bg-red-100 dark:bg-red-900/30'
                                                        }`}>
                                                        {w.status === 'completed' ? <CheckCircle2 className="h-5 w-5 text-green-600" /> :
                                                            w.status === 'pending' ? <Clock3 className="h-5 w-5 text-orange-600" /> :
                                                                <XCircle className="h-5 w-5 text-red-600" />}
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-lg">₹{(w.amount || 0).toLocaleString('en-IN')}</p>
                                                        <p className="text-sm text-muted-foreground">
                                                            {w.partnerId?.businessName || w.partnerId?.email || 'Unknown'} •
                                                            {' '}{new Date(w.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                                                        </p>
                                                        {w.partnerId?.tier && (
                                                            <Badge className={`${TIER_STYLES[w.partnerId.tier]?.badge || ''} mt-1 text-xs`}>
                                                                {(w.partnerId.tier || 'bronze').charAt(0).toUpperCase() + (w.partnerId.tier || 'bronze').slice(1)}
                                                            </Badge>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <StatusBadge status={w.status} />
                                                    {w.status === 'pending' && (
                                                        <div className="flex gap-2">
                                                            <Button size="sm" onClick={() => {
                                                                setWithdrawalTarget(w);
                                                                setApproveDialogOpen(true);
                                                            }}>
                                                                <CheckCheck className="h-4 w-4 mr-1" /> Approve
                                                            </Button>
                                                            <Button size="sm" variant="destructive" onClick={() => {
                                                                setWithdrawalTarget(w);
                                                                setRejectDialogOpen(true);
                                                            }}>
                                                                <Ban className="h-4 w-4 mr-1" /> Reject
                                                            </Button>
                                                        </div>
                                                    )}
                                                    {w.transactionRef && (
                                                        <span className="text-xs text-muted-foreground">Ref: {w.transactionRef}</span>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>

            {/* Tier Override Dialog */}
            <TierDialog
                open={tierDialogOpen}
                onOpenChange={setTierDialogOpen}
                target={tierTarget}
                newTier={newTier}
                setNewTier={setNewTier}
                reason={tierReason}
                setReason={setTierReason}
                onSubmit={handleTierOverride}
            />

            {/* Approve Withdrawal Dialog */}
            <ApproveDialog
                open={approveDialogOpen}
                onOpenChange={setApproveDialogOpen}
                target={withdrawalTarget}
                transactionRef={transactionRef}
                setTransactionRef={setTransactionRef}
                adminNote={adminNote}
                setAdminNote={setAdminNote}
                onSubmit={handleApproveWithdrawal}
            />

            {/* Reject Dialog */}
            <RejectDialog
                open={rejectDialogOpen}
                onOpenChange={setRejectDialogOpen}
                target={withdrawalTarget}
                reason={rejectionReason}
                setReason={setRejectionReason}
                onSubmit={handleRejectWithdrawal}
            />

            {/* Account Status Dialog */}
            <StatusUpdateDialog
                open={statusDialogOpen}
                onOpenChange={setStatusDialogOpen}
                target={statusTarget}
                action={statusAction}
                reason={statusReason}
                setReason={setStatusReason}
                onSubmit={handleStatusUpdate}
            />

            {/* Delete Account Dialog */}
            <DeleteAccountDialog
                open={deleteDialogOpen}
                onOpenChange={setDeleteDialogOpen}
                target={deleteTarget}
                reason={deleteReason}
                setReason={setDeleteReason}
                confirm={deleteConfirm}
                setConfirm={setDeleteConfirm}
                onSubmit={handleDeleteAccount}
            />
        </DashboardLayout>
    );
};

// ── Reusable Sub-Components ──

const SummaryCard = ({ label, value, icon: Icon, color }: {
    label: string; value: number; icon: any; color?: string;
}) => (
    <Card>
        <CardContent className="p-4 flex items-center gap-3">
            <div className={`p-2.5 rounded-xl bg-muted`}>
                <Icon className={`h-5 w-5 ${color || 'text-muted-foreground'}`} />
            </div>
            <div>
                <p className="text-xs text-muted-foreground">{label}</p>
                <p className="text-xl font-bold">{value}</p>
            </div>
        </CardContent>
    </Card>
);

const StatusBadge = ({ status }: { status: string }) => (
    <Badge className={`${status === 'completed' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' :
        status === 'pending' ? 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300' :
            status === 'rejected' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300' :
                'bg-blue-100 text-blue-800'
        }`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
    </Badge>
);

const TierDialog = ({ open, onOpenChange, target, newTier, setNewTier, reason, setReason, onSubmit }: any) => (
    <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Change Tier</DialogTitle>
                <DialogDescription>
                    Override tier for {target?.businessName || target?.email || 'partner'}
                </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-2">
                <div>
                    <label className="text-sm font-medium mb-1.5 block">New Tier</label>
                    <Select value={newTier} onValueChange={setNewTier}>
                        <SelectTrigger>
                            <SelectValue placeholder="Select tier..." />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="bronze">🥉 Bronze (7-day settlement)</SelectItem>
                            <SelectItem value="silver">🥈 Silver (5-day settlement)</SelectItem>
                            <SelectItem value="gold">🥇 Gold (3-day settlement)</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <div>
                    <label className="text-sm font-medium mb-1.5 block">Reason (required)</label>
                    <Textarea placeholder="Why is this tier being changed?" value={reason} onChange={(e) => setReason(e.target.value)} />
                </div>
            </div>
            <DialogFooter>
                <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                <Button onClick={onSubmit} disabled={!newTier || !reason}>Confirm Change</Button>
            </DialogFooter>
        </DialogContent>
    </Dialog>
);

const ApproveDialog = ({ open, onOpenChange, target, transactionRef, setTransactionRef, adminNote, setAdminNote, onSubmit }: any) => (
    <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Approve Withdrawal</DialogTitle>
                <DialogDescription>
                    Approve ₹{(target?.amount || 0).toLocaleString('en-IN')} payout
                </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-2">
                <div>
                    <label className="text-sm font-medium mb-1.5 block">Transaction Reference (optional)</label>
                    <Input placeholder="Bank ref / UPI ID / NEFT ref..." value={transactionRef} onChange={(e) => setTransactionRef(e.target.value)} />
                </div>
                <div>
                    <label className="text-sm font-medium mb-1.5 block">Admin Note (optional)</label>
                    <Textarea placeholder="Any notes..." value={adminNote} onChange={(e) => setAdminNote(e.target.value)} />
                </div>
            </div>
            <DialogFooter>
                <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                <Button onClick={onSubmit} className="bg-green-600 hover:bg-green-700">
                    <CheckCheck className="h-4 w-4 mr-2" /> Approve & Process
                </Button>
            </DialogFooter>
        </DialogContent>
    </Dialog>
);

const RejectDialog = ({ open, onOpenChange, target, reason, setReason, onSubmit }: any) => (
    <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Reject Withdrawal</DialogTitle>
                <DialogDescription>
                    Reject ₹{(target?.amount || 0).toLocaleString('en-IN')} withdrawal request
                </DialogDescription>
            </DialogHeader>
            <div className="py-2">
                <label className="text-sm font-medium mb-1.5 block">Rejection Reason</label>
                <Textarea placeholder="Reason for rejection..." value={reason} onChange={(e) => setReason(e.target.value)} />
            </div>
            <DialogFooter>
                <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                <Button variant="destructive" onClick={onSubmit} disabled={!reason}>
                    <Ban className="h-4 w-4 mr-2" /> Reject
                </Button>
            </DialogFooter>
        </DialogContent>
    </Dialog>
);

const StatusUpdateDialog = ({ open, onOpenChange, target, action, reason, setReason, onSubmit }: any) => {
    const labels: Record<string, { title: string; desc: string; icon: any; color: string }> = {
        held: { title: 'Hold Account', desc: 'This will temporarily suspend the account. The partner/user will not be able to log in or perform any actions.', icon: PauseCircle, color: 'bg-orange-600 hover:bg-orange-700' },
        restricted: { title: 'Restrict Account', desc: 'This will restrict the account. The partner/user will have limited access to the platform.', icon: ShieldAlert, color: 'bg-red-600 hover:bg-red-700' },
        active: { title: 'Reactivate Account', desc: 'This will restore full access to the account.', icon: ShieldCheck, color: 'bg-green-600 hover:bg-green-700' }
    };
    const cfg = labels[action] || labels.held;
    const ActionIcon = cfg.icon;
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <ActionIcon className="h-5 w-5" /> {cfg.title}
                    </DialogTitle>
                    <DialogDescription>
                        {cfg.desc}<br />
                        <strong>{target?.businessName || target?.email || 'Account'}</strong>
                    </DialogDescription>
                </DialogHeader>
                <div className="py-2">
                    <label className="text-sm font-medium mb-1.5 block">Reason (required)</label>
                    <Textarea placeholder="Why is this action being taken?" value={reason} onChange={(e) => setReason(e.target.value)} />
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                    <Button onClick={onSubmit} disabled={!reason} className={cfg.color}>
                        <ActionIcon className="h-4 w-4 mr-2" /> {cfg.title}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

const DeleteAccountDialog = ({ open, onOpenChange, target, reason, setReason, confirm, setConfirm, onSubmit }: any) => (
    <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-destructive">
                    <Trash2 className="h-5 w-5" /> Delete Account Permanently
                </DialogTitle>
                <DialogDescription>
                    This action <strong>cannot be undone</strong>. This will permanently delete the account
                    for <strong>{target?.businessName || target?.email || 'this user'}</strong> and all associated data.
                </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-2">
                <div>
                    <label className="text-sm font-medium mb-1.5 block">Reason for deletion (required)</label>
                    <Textarea placeholder="Reason for permanent account deletion..." value={reason} onChange={(e) => setReason(e.target.value)} />
                </div>
                <div>
                    <label className="text-sm font-medium mb-1.5 block">Type <code className="bg-muted px-1 rounded">DELETE</code> to confirm</label>
                    <Input placeholder="Type DELETE to confirm" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
                </div>
            </div>
            <DialogFooter>
                <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                <Button variant="destructive" onClick={onSubmit} disabled={!reason || confirm !== 'DELETE'}>
                    <Trash2 className="h-4 w-4 mr-2" /> Delete Permanently
                </Button>
            </DialogFooter>
        </DialogContent>
    </Dialog>
);

export default PartnerManagement;
