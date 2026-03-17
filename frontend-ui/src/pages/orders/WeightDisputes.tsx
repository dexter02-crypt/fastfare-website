import { useState, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { Scale, Search, History, CheckCircle, AlertTriangle, Loader2, Info } from "lucide-react";
import api from "@/lib/api";
import { formatDate, formatDateTime } from "@/utils/dateFormat";

const WeightDisputes = () => {
    const { toast } = useToast();
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        openDisputes: 0,
        underReview: 0,
        resolvedRefunded: 0,
        confirmedAnomalies: 0,
    });
    const [disputesList, setDisputesList] = useState<any[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [disputeModalOpen, setDisputeModalOpen] = useState(false);
    const [selectedDispute, setSelectedDispute] = useState<any>(null);

    // Dispute Form State
    const [disputeReason, setDisputeReason] = useState("");

    const fetchData = async () => {
        try {
            setLoading(true);
            const res = await api.weightDisputes.getDisputes();
            if (res && res.success) {
                setStats({
                    openDisputes: res.stats?.openCount || 0,
                    underReview: 0, // Backend doesn't explicitly return this but we can default
                    resolvedRefunded: res.stats?.resolvedCount || 0,
                    confirmedAnomalies: res.stats?.confirmedCount || 0,
                });
                setDisputesList(res.anomalies || []);
            }
        } catch (error) {
            console.error("Failed to fetch dispute data:", error);
            toast({
                title: "Error",
                description: "Failed to load Weight Disputes data.",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleRaiseDispute = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedDispute || !disputeReason) {
            toast({ title: "Validation Error", description: "Please provide a reason.", variant: "destructive" });
            return;
        }

        try {
            const res = await api.weightDisputes.raiseDispute(selectedDispute._id, disputeReason);

            if (res.success) {
                toast({ title: "Dispute Submitted", description: "Your weight dispute is under review.", variant: "default" });
                setDisputeModalOpen(false);
                setDisputeReason("");
                setSelectedDispute(null);
                fetchData(); // Refresh list to reflect new status
            }
        } catch (err: any) {
            toast({ title: "Error", description: err.response?.data?.message || "Failed to submit dispute.", variant: "destructive" });
        }
    };

    const openDisputeModal = (dispute: any) => {
        setSelectedDispute(dispute);
        setDisputeReason("");
        setDisputeModalOpen(true);
    };

    const filteredList = (disputesList || []).filter(item =>
        item.shipment_id?.awb?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.status?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <DashboardLayout>
            <div className="space-y-6">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        <Scale className="h-6 w-6 text-primary" />
                        Weight Discrepancies & Disputes
                    </h1>
                    <p className="text-muted-foreground">
                        Review auto-flagged weight anomalies, raise disputes, and track resolutions.
                    </p>
                </div>

                {/* Info Banner - Timeline Warning Styling (Fix 11) */}
                <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg flex items-start gap-3 shadow-sm">
                    <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5 shrink-0" />
                    <div>
                        <p className="text-sm font-semibold">URGENT: 7-Day Auto-Confirmation Policy</p>
                        <p className="text-sm text-red-700/90 mt-1">
                            Weight discrepancies must be disputed within 7 days of detection. If no dispute is raised within the deadline,
                            the anomaly is automatically confirmed and charges are permanently settled to your wallet.
                        </p>
                    </div>
                </div>

                {/* 4 Stat Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <Card className="border-l-4 border-l-orange-500 shadow-sm">
                        <CardContent className="p-4 flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground font-medium">Action Required (Open)</p>
                                <h3 className="text-2xl font-bold text-orange-600">{stats.openDisputes}</h3>
                            </div>
                            <div className="h-10 w-10 bg-orange-100 rounded-full flex items-center justify-center text-orange-600">
                                <AlertTriangle className="h-5 w-5" />
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-l-4 border-l-blue-500 shadow-sm">
                        <CardContent className="p-4 flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground font-medium">Under Review</p>
                                <h3 className="text-2xl font-bold text-blue-600">{stats.underReview}</h3>
                            </div>
                            <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600">
                                <History className="h-5 w-5" />
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-l-4 border-l-green-500 shadow-sm">
                        <CardContent className="p-4 flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground font-medium">Resolved — Refunded</p>
                                <h3 className="text-2xl font-bold text-green-600">{stats.resolvedRefunded}</h3>
                            </div>
                            <div className="h-10 w-10 bg-green-100 rounded-full flex items-center justify-center text-green-600">
                                <CheckCircle className="h-5 w-5" />
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-l-4 border-l-red-500 shadow-sm">
                        <CardContent className="p-4 flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground font-medium">Confirmed (Charges Applied)</p>
                                <h3 className="text-2xl font-bold text-red-600">{stats.confirmedAnomalies}</h3>
                            </div>
                            <div className="h-10 w-10 bg-red-100 rounded-full flex items-center justify-center text-red-600">
                                <AlertTriangle className="h-5 w-5" />
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Search */}
                <div className="flex bg-white p-1 rounded-md border w-full max-w-sm">
                    <div className="flex items-center px-3 text-muted-foreground">
                        <Search className="h-4 w-4" />
                    </div>
                    <Input
                        placeholder="Search AWB or Status..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="border-0 shadow-none focus-visible:ring-0 px-0 h-9"
                    />
                </div>

                {/* Anomalies Table */}
                <Card className="shadow-sm border overflow-hidden">
                    {loading ? (
                        <div className="flex justify-center items-center p-12">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader className="bg-muted/40">
                                    <TableRow>
                                        <TableHead className="font-semibold text-primary">AWB #</TableHead>
                                        <TableHead>Date Detected</TableHead>
                                        <TableHead>Customer</TableHead>
                                        <TableHead>City</TableHead>
                                        <TableHead>Payment</TableHead>
                                        <TableHead>Service</TableHead>
                                        <TableHead>Declared (kg)</TableHead>
                                        <TableHead>Applied (kg)</TableHead>
                                        <TableHead>Extra Billed</TableHead>
                                        <TableHead>Deadline</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead className="text-right">Action</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredList.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={8} className="h-32 text-center text-muted-foreground bg-white">
                                                <div className="flex flex-col items-center justify-center space-y-2">
                                                    <CheckCircle className="h-8 w-8 text-green-500/40" />
                                                    <p>You have no recent weight discrepancies!</p>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        filteredList.map((item) => (
                                            <TableRow key={item._id} className="hover:bg-muted/50 bg-white group">
                                                <TableCell className="font-mono font-medium">{item.shipment_id?.awb || 'Unknown'}</TableCell>
                                                <TableCell>
                                                    {formatDate(item.created_at)}
                                                </TableCell>
                                                <TableCell>{item.shipment_id?.delivery?.name || '—'}</TableCell>
                                                <TableCell>{item.shipment_id?.delivery?.city || '—'}</TableCell>
                                                <TableCell>
                                                    <Badge variant="secondary" className="uppercase text-[10px]">{item.shipment_id?.paymentMode || '—'}</Badge>
                                                </TableCell>
                                                <TableCell className="capitalize">{item.shipment_id?.serviceType || '—'}</TableCell>
                                                <TableCell className="text-muted-foreground">{item.declared_weight.toFixed(2)}</TableCell>
                                                <TableCell className="font-medium">{item.chargeable_weight.toFixed(2)}</TableCell>
                                                <TableCell className="text-orange-600 font-medium whitespace-nowrap">
                                                    + ₹{item.extra_billed.toFixed(2)}
                                                </TableCell>
                                                <TableCell>
                                                    {item.status === 'Open' ? (
                                                        <span className="text-red-600 font-medium text-xs">
                                                            {formatDateTime(item.dispute_deadline)}
                                                        </span>
                                                    ) : (
                                                        <span className="text-muted-foreground text-xs">—</span>
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    {item.status === 'Open' ? (
                                                        <Badge className="bg-orange-100 text-orange-700 hover:bg-orange-200">Action Req.</Badge>
                                                    ) : item.status === 'Disputed' ? (
                                                        <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-200">Under Review</Badge>
                                                    ) : item.status === 'Resolved — Refunded' ? (
                                                        <Badge className="bg-green-100 text-green-700 hover:bg-green-200">Refunded ₹{item.refund_amount}</Badge>
                                                    ) : (
                                                        <Badge variant="secondary">Confirmed</Badge>
                                                    )}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    {item.status === 'Open' ? (
                                                        <Button variant="outline" size="sm" onClick={() => openDisputeModal(item)} className="h-8 text-xs font-medium border-orange-200 text-orange-700 hover:bg-orange-50">
                                                            Dispute Weight
                                                        </Button>
                                                    ) : (
                                                        <span className="text-xs text-muted-foreground">Locked</span>
                                                    )}
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </Card>

                {/* Dispute Modal */}
                <Dialog open={disputeModalOpen} onOpenChange={setDisputeModalOpen}>
                    <DialogContent className="sm:max-w-[500px]">
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                                <Scale className="h-5 w-5 text-primary" />
                                Raise Weight Dispute
                            </DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleRaiseDispute} className="space-y-4 pt-4">
                            <div className="grid grid-cols-2 gap-4 bg-muted/50 p-4 rounded-lg text-sm mb-4">
                                <div>
                                    <p className="text-muted-foreground mb-1">AWB #</p>
                                    <p className="font-mono font-medium">{selectedDispute?.shipment_id?.awb}</p>
                                </div>
                                <div>
                                    <p className="text-muted-foreground mb-1">Declared vs Applied</p>
                                    <p className="font-medium text-primary">
                                        {selectedDispute?.declared_weight?.toFixed(2)} kg vs {selectedDispute?.chargeable_weight?.toFixed(2)} kg
                                    </p>
                                </div>
                                <div>
                                    <p className="text-muted-foreground mb-1">Extra Amount Billed</p>
                                    <p className="font-medium text-orange-600">₹{selectedDispute?.extra_billed?.toFixed(2)}</p>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="disputeReason">Dispute Reason & Physical Dimensions</Label>
                                <Textarea
                                    id="disputeReason"
                                    value={disputeReason}
                                    onChange={(e) => setDisputeReason(e.target.value)}
                                    placeholder="E.g., The physical box was 10x10x10cm but charged for 5kg volumetric weight. Please review images of the package."
                                    required
                                    rows={4}
                                />
                                <p className="text-xs text-muted-foreground">
                                    Our team will review security camera footage of the dimension scanner. If the dispute is valid, the extra billed amount will be credited back to your wallet.
                                </p>
                            </div>

                            <div className="pt-4 flex justify-end gap-2">
                                <Button type="button" variant="outline" onClick={() => setDisputeModalOpen(false)}>Cancel</Button>
                                <Button type="submit">Submit Dispute</Button>
                            </div>
                        </form>
                    </DialogContent>
                </Dialog>

            </div>
        </DashboardLayout>
    );
};

export default WeightDisputes;
