import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import DashboardLayout from "@/components/DashboardLayout";
import { Input } from "@/components/ui/input";
import {
    Crown, Medal, Shield, TrendingUp, Wallet, Clock,
    ArrowUpRight, ArrowDownRight, IndianRupee, CalendarClock,
    Package, RotateCcw, CheckCircle2, AlertCircle, ChevronRight,
    Send, XCircle, Clock3, Banknote
} from "lucide-react";
import { settlementApi } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

// ── Tier visual config ──
const TIER_CONFIG = {
    bronze: {
        label: "Bronze",
        icon: Shield,
        gradient: "from-amber-700 to-amber-900",
        bg: "bg-amber-50 dark:bg-amber-950/30",
        border: "border-amber-200 dark:border-amber-800",
        text: "text-amber-700 dark:text-amber-400",
        badge: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300",
        ring: "ring-amber-500/20",
        progress: "bg-amber-500",
    },
    silver: {
        label: "Silver",
        icon: Medal,
        gradient: "from-slate-400 to-slate-600",
        bg: "bg-slate-50 dark:bg-slate-950/30",
        border: "border-slate-300 dark:border-slate-700",
        text: "text-slate-600 dark:text-slate-400",
        badge: "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300",
        ring: "ring-slate-500/20",
        progress: "bg-slate-500",
    },
    gold: {
        label: "Gold",
        icon: Crown,
        gradient: "from-yellow-400 to-yellow-600",
        bg: "bg-yellow-50 dark:bg-yellow-950/30",
        border: "border-yellow-300 dark:border-yellow-700",
        text: "text-yellow-600 dark:text-yellow-500",
        badge: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
        ring: "ring-yellow-500/20",
        progress: "bg-yellow-500",
    },
};

const SettlementDashboard = () => {
    const { toast } = useToast();
    const [loading, setLoading] = useState(true);
    const [dashboard, setDashboard] = useState<any>(null);
    const [tierInfo, setTierInfo] = useState<any>(null);
    const [schedule, setSchedule] = useState<any[]>([]);
    const [ledger, setLedger] = useState<any[]>([]);
    const [performance, setPerformance] = useState<any>(null);
    const [withdrawals, setWithdrawals] = useState<any[]>([]);
    const [earnings, setEarnings] = useState<any>(null);
    const [withdrawAmount, setWithdrawAmount] = useState('');
    const [withdrawing, setWithdrawing] = useState(false);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const results = await Promise.allSettled([
                settlementApi.getDashboard(),
                settlementApi.getCurrentTier(),
                settlementApi.getSchedule(),
                settlementApi.getLedger(1, 10),
                settlementApi.getPerformance(),
                settlementApi.getWithdrawals(),
                settlementApi.getPartnerEarnings(),
            ]);

            if (results[0].status === "fulfilled") setDashboard(results[0].value.dashboard);
            if (results[1].status === "fulfilled") setTierInfo(results[1].value.tier);
            if (results[2].status === "fulfilled") setSchedule(results[2].value.schedules || []);
            if (results[3].status === "fulfilled") setLedger(results[3].value.ledger || []);
            if (results[4].status === "fulfilled") setPerformance(results[4].value.performance);
            if (results[5].status === "fulfilled") setWithdrawals(results[5].value.withdrawals || []);
            if (results[6].status === "fulfilled") setEarnings(results[6].value.earnings);
        } catch (err: any) {
            toast({ title: "Error loading data", description: err.message, variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    const currentTier = tierInfo?.current || dashboard?.tier?.current || "bronze";
    const config = TIER_CONFIG[currentTier as keyof typeof TIER_CONFIG] || TIER_CONFIG.bronze;
    const TierIcon = config.icon;

    if (loading) {
        return (
            <DashboardLayout>
                <div className="flex items-center justify-center h-96">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            <div className="space-y-6 p-6">
                {/* Page Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Settlement & Tier Dashboard</h1>
                        <p className="text-muted-foreground mt-1">Manage your earnings, settlements, and tier progress</p>
                    </div>
                    <Button variant="outline" size="sm" onClick={loadData}>
                        Refresh
                    </Button>
                </div>

                {/* ═══ TIER CARD ═══ */}
                <Card className={`relative overflow-hidden ${config.border} border-2`}>
                    <div className={`absolute inset-0 bg-gradient-to-br ${config.gradient} opacity-5`} />
                    <CardContent className="relative p-6">
                        <div className="flex flex-col md:flex-row md:items-center gap-6">
                            {/* Tier Badge */}
                            <div className={`flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br ${config.gradient} shadow-lg`}>
                                <TierIcon className="h-10 w-10 text-white" />
                            </div>

                            {/* Tier Info */}
                            <div className="flex-1 space-y-2">
                                <div className="flex items-center gap-3">
                                    <h2 className="text-2xl font-bold">{config.label} Tier</h2>
                                    <Badge className={config.badge}>
                                        {tierInfo?.settlementDays || dashboard?.tier?.settlementDays || 7}-Day Settlement
                                    </Badge>
                                </div>
                                <p className="text-muted-foreground text-sm">
                                    {tierInfo?.monthlyOrders || performance?.monthlyOrders || 0} orders this month •
                                    {' '}{tierInfo?.rtoPercent?.toFixed(1) || '0.0'}% RTO rate
                                </p>

                                {/* Upgrade Progress */}
                                {(tierInfo?.nextTier || performance?.upgradeProgress?.nextTier) && (
                                    <div className="mt-3 space-y-1.5">
                                        <div className="flex justify-between text-sm">
                                            <span className="text-muted-foreground">
                                                Progress to {(tierInfo?.nextTier || performance?.upgradeProgress?.nextTier || '').charAt(0).toUpperCase() + (tierInfo?.nextTier || performance?.upgradeProgress?.nextTier || '').slice(1)}
                                            </span>
                                            <span className="font-medium">
                                                {performance?.upgradeProgress?.progress || 0}%
                                            </span>
                                        </div>
                                        <Progress
                                            value={performance?.upgradeProgress?.progress || 0}
                                            className="h-2"
                                        />
                                        <p className="text-xs text-muted-foreground">
                                            {performance?.upgradeProgress?.message || `${tierInfo?.ordersForUpgrade || 0} more orders needed`}
                                        </p>
                                    </div>
                                )}
                            </div>

                            {/* Tier Benefits */}
                            <div className="md:w-64">
                                <h4 className="text-sm font-semibold mb-2">Your Benefits</h4>
                                <ul className="space-y-1.5">
                                    {(tierInfo?.benefits || []).slice(0, 4).map((b: string, i: number) => (
                                        <li key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
                                            <CheckCircle2 className="h-3.5 w-3.5 text-green-500 mt-0.5 shrink-0" />
                                            {b}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* ═══ FINANCIAL OVERVIEW CARDS ═══ */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <StatCard
                        title="Available Balance"
                        value={dashboard?.financials?.availableForWithdrawal || 0}
                        icon={Wallet}
                        format="currency"
                        accent="text-green-600"
                        bg="bg-green-50 dark:bg-green-950/20"
                    />
                    <StatCard
                        title="Pending Settlement"
                        value={dashboard?.financials?.pendingSettlement || 0}
                        icon={Clock}
                        format="currency"
                        accent="text-orange-600"
                        bg="bg-orange-50 dark:bg-orange-950/20"
                    />
                    <StatCard
                        title="Total Settled"
                        value={dashboard?.financials?.totalSettled || 0}
                        icon={CheckCircle2}
                        format="currency"
                        accent="text-blue-600"
                        bg="bg-blue-50 dark:bg-blue-950/20"
                    />
                    <StatCard
                        title="Platform Fees"
                        value={dashboard?.financials?.totalPlatformFees || 0}
                        icon={IndianRupee}
                        format="currency"
                        accent="text-purple-600"
                        bg="bg-purple-50 dark:bg-purple-950/20"
                    />
                </div>

                {/* ═══ ORDER STATS ═══ */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    <MiniStat label="Total Orders" value={dashboard?.overview?.totalOrders || 0} icon={Package} />
                    <MiniStat label="Delivered" value={dashboard?.overview?.deliveredOrders || 0} icon={CheckCircle2} color="text-green-600" />
                    <MiniStat label="In Transit" value={dashboard?.overview?.inTransitOrders || 0} icon={TrendingUp} color="text-blue-600" />
                    <MiniStat label="RTO / Returns" value={dashboard?.overview?.rtoOrders || 0} icon={RotateCcw} color="text-orange-600" />
                    <MiniStat label="Cancelled" value={dashboard?.overview?.cancelledOrders || 0} icon={AlertCircle} color="text-red-600" />
                </div>

                {/* ═══ TABS: Schedule / Ledger / Withdrawals / Performance ═══ */}
                <Tabs defaultValue="withdrawals" className="w-full">
                    <TabsList className="grid w-full grid-cols-4">
                        <TabsTrigger value="withdrawals">Withdrawals</TabsTrigger>
                        <TabsTrigger value="schedule">Schedule</TabsTrigger>
                        <TabsTrigger value="ledger">Ledger</TabsTrigger>
                        <TabsTrigger value="performance">Performance</TabsTrigger>
                    </TabsList>

                    {/* Schedule Tab */}
                    <TabsContent value="schedule">
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg">Upcoming Settlements</CardTitle>
                                <CardDescription>
                                    {schedule.length > 0
                                        ? `${schedule.length} settlement batch${schedule.length > 1 ? 'es' : ''} pending`
                                        : 'No upcoming settlements'}
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                {schedule.length === 0 ? (
                                    <div className="text-center py-8 text-muted-foreground">
                                        <CalendarClock className="h-12 w-12 mx-auto mb-3 opacity-40" />
                                        <p>No scheduled settlements right now.</p>
                                        <p className="text-sm mt-1">Settlements are created when orders are delivered.</p>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {schedule.map((s: any) => (
                                            <div key={s._id} className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors">
                                                <div className="flex items-center gap-4">
                                                    <div className={`p-2 rounded-lg ${TIER_CONFIG[s.tier as keyof typeof TIER_CONFIG]?.bg || 'bg-muted'}`}>
                                                        <CalendarClock className={`h-5 w-5 ${TIER_CONFIG[s.tier as keyof typeof TIER_CONFIG]?.text || ''}`} />
                                                    </div>
                                                    <div>
                                                        <p className="font-medium">
                                                            ₹{(s.totalAmount || 0).toLocaleString('en-IN')}
                                                        </p>
                                                        <p className="text-sm text-muted-foreground">
                                                            {s.orderIds?.length || 0} orders • {(s.tier || 'bronze').charAt(0).toUpperCase() + (s.tier || 'bronze').slice(1)} tier
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <Badge variant="outline" className="mb-1">
                                                        {s.status}
                                                    </Badge>
                                                    <p className="text-xs text-muted-foreground">
                                                        {new Date(s.settlementDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                                                    </p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Ledger Tab */}
                    <TabsContent value="ledger">
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg">Financial Ledger</CardTitle>
                                <CardDescription>Immutable record of all financial events</CardDescription>
                            </CardHeader>
                            <CardContent>
                                {ledger.length === 0 ? (
                                    <div className="text-center py-8 text-muted-foreground">
                                        <IndianRupee className="h-12 w-12 mx-auto mb-3 opacity-40" />
                                        <p>No ledger entries yet.</p>
                                    </div>
                                ) : (
                                    <div className="space-y-2">
                                        {ledger.map((entry: any) => (
                                            <div key={entry._id} className="flex items-center justify-between p-3 rounded-lg border hover:bg-accent/30 transition-colors">
                                                <div className="flex items-center gap-3">
                                                    <div className={`p-1.5 rounded-md ${entry.type === 'earning' ? 'bg-green-100 dark:bg-green-900/30' :
                                                        entry.type === 'settlement' ? 'bg-blue-100 dark:bg-blue-900/30' :
                                                            entry.type === 'deduction' || entry.type === 'rto_charge' ? 'bg-red-100 dark:bg-red-900/30' :
                                                                'bg-gray-100 dark:bg-gray-800'
                                                        }`}>
                                                        {entry.type === 'earning' || entry.type === 'settlement' ? (
                                                            <ArrowUpRight className="h-4 w-4 text-green-600" />
                                                        ) : (
                                                            <ArrowDownRight className="h-4 w-4 text-red-600" />
                                                        )}
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-medium capitalize">{entry.type.replace('_', ' ')}</p>
                                                        <p className="text-xs text-muted-foreground truncate max-w-[300px]">
                                                            {entry.description}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <p className={`text-sm font-semibold ${['earning', 'settlement', 'refund', 'cod_collection'].includes(entry.type) ? 'text-green-600' : 'text-red-600'
                                                        }`}>
                                                        {['earning', 'settlement', 'refund', 'cod_collection'].includes(entry.type) ? '+' : '-'}
                                                        ₹{(entry.amount || 0).toLocaleString('en-IN')}
                                                    </p>
                                                    <p className="text-xs text-muted-foreground">
                                                        {new Date(entry.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                                                    </p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Performance Tab */}
                    <TabsContent value="performance">
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg">Performance Metrics</CardTitle>
                                <CardDescription>Your monthly performance for tier evaluation</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <div className="space-y-3">
                                        <h4 className="text-sm font-semibold text-muted-foreground">Delivery Success Rate</h4>
                                        <div className="flex items-end gap-2">
                                            <span className="text-3xl font-bold">
                                                {dashboard?.performance?.deliverySuccessRate?.toFixed(1) || '0.0'}%
                                            </span>
                                        </div>
                                        <Progress value={dashboard?.performance?.deliverySuccessRate || 0} className="h-2" />
                                    </div>

                                    <div className="space-y-3">
                                        <h4 className="text-sm font-semibold text-muted-foreground">RTO Rate</h4>
                                        <div className="flex items-end gap-2">
                                            <span className="text-3xl font-bold">
                                                {dashboard?.performance?.rtoPercent?.toFixed(1) || '0.0'}%
                                            </span>
                                            <span className="text-sm text-muted-foreground mb-1">
                                                (max 15% for upgrade)
                                            </span>
                                        </div>
                                        <Progress
                                            value={Math.min(100, (dashboard?.performance?.rtoPercent || 0) / 15 * 100)}
                                            className="h-2"
                                        />
                                    </div>

                                    <div className="space-y-3">
                                        <h4 className="text-sm font-semibold text-muted-foreground">Avg Delivery Time</h4>
                                        <div className="flex items-end gap-2">
                                            <span className="text-3xl font-bold">
                                                {dashboard?.performance?.averageDeliveryDays?.toFixed(1) || '0'}
                                            </span>
                                            <span className="text-sm text-muted-foreground mb-1">days</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Tier Thresholds */}
                                <div className="mt-8 border-t pt-6">
                                    <h4 className="text-sm font-semibold mb-4">Tier Requirements</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        {[
                                            { tier: 'bronze', orders: '0+', rto: 'No limit', days: 7 },
                                            { tier: 'silver', orders: '300+/mo', rto: '≤ 15%', days: 5 },
                                            { tier: 'gold', orders: '800+/mo', rto: '≤ 15%', days: 3 },
                                        ].map((t) => {
                                            const tc = TIER_CONFIG[t.tier as keyof typeof TIER_CONFIG];
                                            const isCurrent = currentTier === t.tier;
                                            return (
                                                <div
                                                    key={t.tier}
                                                    className={`p-4 rounded-xl border-2 transition-all ${isCurrent ? `${tc.border} ${tc.bg} shadow-md ring-2 ${tc.ring}` : 'border-border'
                                                        }`}
                                                >
                                                    <div className="flex items-center gap-2 mb-3">
                                                        <tc.icon className={`h-5 w-5 ${tc.text}`} />
                                                        <span className="font-semibold">{tc.label}</span>
                                                        {isCurrent && <Badge variant="secondary" className="text-xs ml-auto">Current</Badge>}
                                                    </div>
                                                    <div className="space-y-1.5 text-sm text-muted-foreground">
                                                        <div className="flex justify-between">
                                                            <span>Orders</span>
                                                            <span className="font-medium text-foreground">{t.orders}</span>
                                                        </div>
                                                        <div className="flex justify-between">
                                                            <span>Max RTO</span>
                                                            <span className="font-medium text-foreground">{t.rto}</span>
                                                        </div>
                                                        <div className="flex justify-between">
                                                            <span>Settlement</span>
                                                            <span className="font-medium text-foreground">{t.days} days</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Withdrawals Tab */}
                    <TabsContent value="withdrawals">
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            {/* Request Withdrawal Card */}
                            <Card className="lg:col-span-1">
                                <CardHeader>
                                    <CardTitle className="text-lg flex items-center gap-2">
                                        <Banknote className="h-5 w-5" /> Request Withdrawal
                                    </CardTitle>
                                    <CardDescription>
                                        Available: <span className="font-bold text-green-600">₹{(earnings?.currentBalance || 0).toLocaleString('en-IN')}</span>
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <form onSubmit={async (e) => {
                                        e.preventDefault();
                                        const amt = parseFloat(withdrawAmount);
                                        if (!amt || amt <= 0) return toast({ title: 'Enter a valid amount', variant: 'destructive' });
                                        if (amt > (earnings?.currentBalance || 0)) return toast({ title: 'Insufficient balance', variant: 'destructive' });
                                        setWithdrawing(true);
                                        try {
                                            await settlementApi.requestWithdrawal(amt);
                                            toast({ title: '✅ Withdrawal requested', description: `₹${amt.toLocaleString('en-IN')} withdrawal submitted for admin approval.` });
                                            setWithdrawAmount('');
                                            loadData();
                                        } catch (err: any) {
                                            toast({ title: 'Error', description: err.message, variant: 'destructive' });
                                        } finally {
                                            setWithdrawing(false);
                                        }
                                    }} className="space-y-4">
                                        <div>
                                            <label className="text-sm font-medium mb-1.5 block">Amount (₹)</label>
                                            <Input
                                                type="number"
                                                placeholder="Enter amount"
                                                value={withdrawAmount}
                                                onChange={(e) => setWithdrawAmount(e.target.value)}
                                                min={1}
                                                max={earnings?.currentBalance || 0}
                                                className="text-lg"
                                            />
                                        </div>
                                        <div className="flex gap-2">
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                onClick={() => setWithdrawAmount(String(Math.floor((earnings?.currentBalance || 0) * 0.5)))}
                                            >
                                                50%
                                            </Button>
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                onClick={() => setWithdrawAmount(String(earnings?.currentBalance || 0))}
                                            >
                                                Max
                                            </Button>
                                        </div>
                                        <Button type="submit" className="w-full" disabled={withdrawing || !withdrawAmount}>
                                            <Send className="h-4 w-4 mr-2" />
                                            {withdrawing ? 'Submitting...' : 'Request Withdrawal'}
                                        </Button>
                                        <p className="text-xs text-muted-foreground text-center">
                                            Withdrawal requires admin approval before processing.
                                        </p>
                                    </form>
                                </CardContent>
                            </Card>

                            {/* Withdrawal History */}
                            <Card className="lg:col-span-2">
                                <CardHeader>
                                    <CardTitle className="text-lg">Withdrawal History</CardTitle>
                                    <CardDescription>{withdrawals.length} request{withdrawals.length !== 1 ? 's' : ''}</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    {withdrawals.length === 0 ? (
                                        <div className="text-center py-8 text-muted-foreground">
                                            <Wallet className="h-12 w-12 mx-auto mb-3 opacity-40" />
                                            <p>No withdrawal requests yet.</p>
                                            <p className="text-sm mt-1">Request a withdrawal from the form on the left.</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-3">
                                            {withdrawals.map((w: any) => (
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
                                                                {new Date(w.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <div className="text-right">
                                                        <Badge className={`${w.status === 'completed' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' :
                                                                w.status === 'pending' ? 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300' :
                                                                    w.status === 'rejected' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300' :
                                                                        'bg-blue-100 text-blue-800'
                                                            }`}>
                                                            {w.status.charAt(0).toUpperCase() + w.status.slice(1)}
                                                        </Badge>
                                                        {w.status === 'rejected' && w.rejectionReason && (
                                                            <p className="text-xs text-red-500 mt-1 max-w-[200px] truncate">{w.rejectionReason}</p>
                                                        )}
                                                        {w.transactionRef && (
                                                            <p className="text-xs text-muted-foreground mt-1">Ref: {w.transactionRef}</p>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </div>
                    </TabsContent>
                </Tabs>
            </div>
        </DashboardLayout>
    );
};

// ── Reusable Stat Card ──
const StatCard = ({ title, value, icon: Icon, format, accent, bg }: {
    title: string; value: number; icon: any; format?: string; accent?: string; bg?: string;
}) => (
    <Card className="hover:shadow-md transition-shadow">
        <CardContent className="p-4">
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-sm text-muted-foreground">{title}</p>
                    <p className={`text-2xl font-bold mt-1 ${accent || ''}`}>
                        {format === 'currency' ? `₹${value.toLocaleString('en-IN')}` : value.toLocaleString()}
                    </p>
                </div>
                <div className={`p-3 rounded-xl ${bg || 'bg-muted'}`}>
                    <Icon className={`h-5 w-5 ${accent || 'text-muted-foreground'}`} />
                </div>
            </div>
        </CardContent>
    </Card>
);

// ── Mini Stat ──
const MiniStat = ({ label, value, icon: Icon, color }: {
    label: string; value: number; icon: any; color?: string;
}) => (
    <Card>
        <CardContent className="p-3 flex items-center gap-3">
            <Icon className={`h-4 w-4 ${color || 'text-muted-foreground'}`} />
            <div>
                <p className="text-xs text-muted-foreground">{label}</p>
                <p className="text-lg font-bold">{value}</p>
            </div>
        </CardContent>
    </Card>
);

export default SettlementDashboard;
