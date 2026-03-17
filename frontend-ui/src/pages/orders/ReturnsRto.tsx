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
import { Download, RefreshCw, Package, Truck, Search, AlertCircle, Phone, MapPin, User, Loader2 } from "lucide-react";
import api from "@/lib/api";
import { formatDate } from "@/utils/dateFormat";

const ReturnsRto = () => {
    const { toast } = useToast();
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        totalRTOs: 0,
        rtoCharges: 0,
        activeReversePickups: 0,
        deliveredBack: 0,
    });
    const [rtoList, setRtoList] = useState<any[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [reversePickupModalOpen, setReversePickupModalOpen] = useState(false);
    const [selectedShipment, setSelectedShipment] = useState<any>(null);

    // Reverse Pickup Form State
    const [pickupAddress, setPickupAddress] = useState("");
    const [contactName, setContactName] = useState("");
    const [contactPhone, setContactPhone] = useState("");
    const [packageDescription, setPackageDescription] = useState("");

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const res = await api.returns.getRTOStats();
            if (res && res.success) {
                setStats({
                    totalRTOs: res.stats?.totalRTO || 0,
                    rtoCharges: res.stats?.rtoChargeBilled || 0,
                    activeReversePickups: res.stats?.reversePickupsCount || 0,
                    deliveredBack: 0,
                });
                setRtoList(res.shipments || []);
            }
        } catch (error) {
            console.error("Failed to fetch returns data:", error);
            toast({
                title: "Error",
                description: "Failed to load Returns & RTO data.",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    const handleExportCSV = () => {
        const headers = [
            "AWB", "Date", "Status", "RTO Reason", "RTO Triggered At", "Delivery Attempts", "RTO Charge", "Debit Note"
        ];

        const rows = filteredList.map(item => {
            const isRTO = !!item.rto_triggered_at;
            return [
                item.awb,
                formatDate(item.createdAt),
                item.status || "—",
                item.rto_reason || "—",
                item.rto_triggered_at ? formatDate(item.rto_triggered_at) : "—",
                item.delivery_attempts || 0,
                item.rto_charge || 0,
                item.debit_note_number || "—"
            ].map(v => `"${v}"`).join(",");
        });

        const csvContent = [headers.join(","), ...rows].join("\n");
        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute("download", `FastFare_Returns_RTO_${new Date().getTime()}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleInitiateReversePickup = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedShipment || !pickupAddress || !contactName || !contactPhone) {
            toast({ title: "Validation Error", description: "Please fill all required fields.", variant: "destructive" });
            return;
        }

        try {
            const res = await api.returns.initiateReversePickup({
                shipment_id: selectedShipment._id || selectedShipment.id,
                pickup_address: pickupAddress,
                contact_name: contactName,
                contact_phone: contactPhone,
                package_description: packageDescription
            });

            if (res.success) {
                toast({ title: "Success", description: "Reverse pickup requested successfully." });
                setReversePickupModalOpen(false);
                fetchData(); // Refresh list to show active reverse pickup

                // Reset form
                setPickupAddress("");
                setContactName("");
                setContactPhone("");
                setPackageDescription("");
                setSelectedShipment(null);
            }
        } catch (err: any) {
            toast({ title: "Error", description: err.response?.data?.message || "Failed to initiate reverse pickup.", variant: "destructive" });
        }
    };

    const openReversePickupModal = (shipment: any) => {
        setSelectedShipment(shipment);
        // Pre-fill with delivery details ideally
        if (shipment.delivery) {
            setPickupAddress(`${shipment.delivery.address}, ${shipment.delivery.city}, ${shipment.delivery.state} - ${shipment.delivery.pincode}`);
            setContactName(shipment.delivery.name);
            setContactPhone(shipment.delivery.phone);
        }
        setReversePickupModalOpen(true);
    };

    const filteredList = (rtoList || []).filter(item =>
        item.awb?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.rto_reason?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <DashboardLayout>
            <div className="space-y-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold flex items-center gap-2">
                            <RefreshCw className="h-6 w-6 text-orange-600" />
                            Returns & RTO
                        </h1>
                        <p className="text-muted-foreground">
                            Manage your Return to Origin (RTO) shipments and customer returns
                        </p>
                    </div>
                    <Button disabled={filteredList.length === 0} onClick={handleExportCSV} variant="outline" className="bg-white">
                        <Download className="h-4 w-4 mr-2" />
                        Download RTO Report
                    </Button>
                </div>

                {/* Info Banner */}
                <div className="bg-blue-50 border border-blue-200 text-blue-800 px-4 py-3 rounded-lg flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                    <div>
                        <p className="text-sm font-medium">Notice: RTO charges are generated upon successful return delivery.</p>
                        <p className="text-sm text-blue-700/80">Reverse pickups can be requested for delivered orders. Review your shipping policies for details.</p>
                    </div>
                </div>

                {/* 4 Stat Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <Card className="border-l-4 border-l-red-500 shadow-sm">
                        <CardContent className="p-4 flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground font-medium">Total RTOs</p>
                                <h3 className="text-2xl font-bold text-red-600">{stats.totalRTOs}</h3>
                            </div>
                            <div className="h-10 w-10 bg-red-100 rounded-full flex items-center justify-center text-red-600">
                                <AlertCircle className="h-5 w-5" />
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-l-4 border-l-orange-500 shadow-sm">
                        <CardContent className="p-4 flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground font-medium">RTO Charges Incurred</p>
                                <h3 className="text-2xl font-bold text-orange-600">₹{stats.rtoCharges.toLocaleString()}</h3>
                            </div>
                            <div className="h-10 w-10 bg-orange-100 rounded-full flex items-center justify-center text-orange-600">
                                <RefreshCw className="h-5 w-5" />
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-l-4 border-l-blue-500 shadow-sm">
                        <CardContent className="p-4 flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground font-medium">Active Reverse Pickups</p>
                                <h3 className="text-2xl font-bold text-blue-600">{stats.activeReversePickups}</h3>
                            </div>
                            <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600">
                                <Truck className="h-5 w-5" />
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-l-4 border-l-green-500 shadow-sm">
                        <CardContent className="p-4 flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground font-medium">Delivered Back to Origin</p>
                                <h3 className="text-2xl font-bold text-green-600">{stats.deliveredBack}</h3>
                            </div>
                            <div className="h-10 w-10 bg-green-100 rounded-full flex items-center justify-center text-green-600">
                                <Package className="h-5 w-5" />
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
                        placeholder="Search AWB or RTO Reason..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="border-0 shadow-none focus-visible:ring-0 px-0 h-9"
                    />
                </div>

                {/* RTO Table */}
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
                                        <TableHead>Type</TableHead>
                                        <TableHead>Customer</TableHead>
                                        <TableHead>Delivery City</TableHead>
                                        <TableHead>Payment Mode</TableHead>
                                        <TableHead>Shipping Cost</TableHead>
                                        <TableHead>Delivery Attempts</TableHead>
                                        <TableHead>RTO Reason</TableHead>
                                        <TableHead>Triggered Date</TableHead>
                                        <TableHead>RTO Charge</TableHead>
                                        <TableHead>Return Status</TableHead>
                                        <TableHead className="text-right">Action</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredList.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={8} className="h-32 text-center text-muted-foreground bg-white">
                                                <div className="flex flex-col items-center justify-center space-y-2">
                                                    <Package className="h-8 w-8 text-muted-foreground/40" />
                                                    <p>No RTO or Return shipments found.</p>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        filteredList.map((item) => {
                                            const isRTO = !!item.rto_triggered_at;
                                            return (
                                                <TableRow key={item._id || item.id} className="hover:bg-muted/50 bg-white group">
                                                    <TableCell className="font-mono font-medium">{item.awb}</TableCell>
                                                    <TableCell>
                                                        {isRTO ? (
                                                            <Badge variant="outline" className="text-orange-600 border-orange-200 bg-orange-50">System RTO</Badge>
                                                        ) : (
                                                            <Badge variant="outline" className="text-blue-600 border-blue-200 bg-blue-50">Customer Return</Badge>
                                                        )}
                                                    </TableCell>
                                                    <TableCell>{item.delivery?.name || '—'}</TableCell>
                                                    <TableCell>{item.delivery?.city || '—'}</TableCell>
                                                    <TableCell>
                                                        <Badge variant="secondary" className="uppercase text-[10px]">{item.paymentMode || '—'}</Badge>
                                                    </TableCell>
                                                    <TableCell>₹{item.shippingCost?.toLocaleString() || 0}</TableCell>
                                                    <TableCell>{item.delivery_attempts || 0}</TableCell>
                                                    <TableCell className="text-red-600 font-medium">
                                                        {item.rto_reason || "Customer Request"}
                                                    </TableCell>
                                                    <TableCell>
                                                        {formatDate(item.rto_triggered_at || item.createdAt)}
                                                    </TableCell>
                                                    <TableCell className="font-medium">₹{(item.rto_charge || 0).toLocaleString()}</TableCell>
                                                    <TableCell>
                                                        {['Returning', 'In Transit'].includes(item.return_status) ? (
                                                            <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-200">{item.return_status}</Badge>
                                                        ) : item.return_status === 'Delivered Back' ? (
                                                            <Badge className="bg-green-100 text-green-700 hover:bg-green-200">{item.return_status}</Badge>
                                                        ) : (
                                                            <Badge variant="secondary">{item.status}</Badge>
                                                        )}
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        {/* Suppose we only allow reverse pickup if delivered to customer, but for RTO it's handled automatically. */}
                                                        {!isRTO && item.status === 'delivered' && !item.return_status ? (
                                                            <Button variant="outline" size="sm" onClick={() => openReversePickupModal(item)} className="h-8 text-xs font-medium">
                                                                Reverse Pickup
                                                            </Button>
                                                        ) : (
                                                            <span className="text-xs text-muted-foreground">-</span>
                                                        )}
                                                    </TableCell>
                                                </TableRow>
                                            )
                                        })
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </Card>

                {/* Initiate Reverse Pickup Modal */}
                <Dialog open={reversePickupModalOpen} onOpenChange={setReversePickupModalOpen}>
                    <DialogContent className="sm:max-w-[500px]">
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                                <RefreshCw className="h-5 w-5 text-blue-600" />
                                Initiate Reverse Pickup
                            </DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleInitiateReversePickup} className="space-y-4 pt-4">
                            <div className="space-y-2">
                                <Label>AWB #</Label>
                                <Input value={selectedShipment?.awb || ""} disabled className="bg-muted" />
                            </div>

                            <div className="space-y-2">
                                <Label className="flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5" /> Pickup Address</Label>
                                <Textarea
                                    value={pickupAddress}
                                    onChange={(e) => setPickupAddress(e.target.value)}
                                    placeholder="Full flat, street, city, state, pincode..."
                                    required
                                    rows={3}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label className="flex items-center gap-1.5"><User className="h-3.5 w-3.5" /> Contact Name</Label>
                                    <Input
                                        value={contactName}
                                        onChange={(e) => setContactName(e.target.value)}
                                        placeholder="E.g. John Doe"
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="flex items-center gap-1.5"><Phone className="h-3.5 w-3.5" /> Contact Phone</Label>
                                    <Input
                                        value={contactPhone}
                                        onChange={(e) => setContactPhone(e.target.value)}
                                        placeholder="10 digit number"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label className="flex items-center gap-1.5"><Package className="h-3.5 w-3.5" /> Package Description / Reason</Label>
                                <Input
                                    value={packageDescription}
                                    onChange={(e) => setPackageDescription(e.target.value)}
                                    placeholder="Defective product, wrong size, etc."
                                />
                            </div>

                            <div className="pt-4 flex justify-end gap-2">
                                <Button type="button" variant="outline" onClick={() => setReversePickupModalOpen(false)}>Cancel</Button>
                                <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white">Request Pickup</Button>
                            </div>
                        </form>
                    </DialogContent>
                </Dialog>

            </div>
        </DashboardLayout>
    );
};

export default ReturnsRto;
