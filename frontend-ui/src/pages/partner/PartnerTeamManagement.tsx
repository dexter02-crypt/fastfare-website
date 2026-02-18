import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { API_BASE_URL } from "@/config";
import DashboardLayout from "@/components/DashboardLayout";
import {
    Users, Scan, Plus, Copy, Check, Eye, EyeOff,
    UserPlus, Trash2, RefreshCw, Shield, Truck, ArrowLeft
} from "lucide-react";
import { Link } from "react-router-dom";

interface DriverItem {
    _id: string;
    driverId: string;
    name: string;
    phone: string;
    status: string;
    createdAt: string;
}

interface ScanPartnerItem {
    _id: string;
    scanPartnerId: string;
    name: string;
    phone: string;
    status: string;
    createdAt: string;
}

interface Credentials {
    id: string;
    password: string;
}

interface TeamStats {
    totalDrivers: number;
    activeDrivers: number;
    totalScanPartners: number;
    activeScanPartners: number;
}

// ─── Credential Card (shown once after creation) ───
const CredentialCard = ({ credentials, type, onClose }: {
    credentials: Credentials;
    type: "Driver" | "Scan Partner";
    onClose: () => void;
}) => {
    const [copiedId, setCopiedId] = useState(false);
    const [copiedPw, setCopiedPw] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const copyToClipboard = (text: string, which: "id" | "pw") => {
        navigator.clipboard.writeText(text);
        if (which === "id") { setCopiedId(true); setTimeout(() => setCopiedId(false), 2000); }
        else { setCopiedPw(true); setTimeout(() => setCopiedPw(false), 2000); }
    };

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
        >
            <Card className="w-full max-w-md border-2 border-green-500/50 shadow-2xl">
                <CardHeader className="text-center pb-2">
                    <div className="mx-auto mb-3 h-14 w-14 rounded-full bg-green-100 flex items-center justify-center">
                        <Check className="h-7 w-7 text-green-600" />
                    </div>
                    <CardTitle className="text-xl">{type} Created!</CardTitle>
                    <CardDescription>
                        Save these credentials — the password won't be shown again.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="rounded-lg bg-muted p-4 space-y-3">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs text-muted-foreground font-medium">{type} ID</p>
                                <p className="text-lg font-mono font-bold">{credentials.id}</p>
                            </div>
                            <Button size="sm" variant="outline" onClick={() => copyToClipboard(credentials.id, "id")}>
                                {copiedId ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                            </Button>
                        </div>
                        <div className="border-t pt-3 flex items-center justify-between">
                            <div>
                                <p className="text-xs text-muted-foreground font-medium">Password</p>
                                <p className="text-lg font-mono font-bold">
                                    {showPassword ? credentials.password : "••••••••"}
                                </p>
                            </div>
                            <div className="flex gap-1">
                                <Button size="sm" variant="outline" onClick={() => setShowPassword(!showPassword)}>
                                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </Button>
                                <Button size="sm" variant="outline" onClick={() => copyToClipboard(credentials.password, "pw")}>
                                    {copiedPw ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                                </Button>
                            </div>
                        </div>
                    </div>

                    <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg p-3">
                        <p className="text-sm text-amber-800 dark:text-amber-200">
                            <strong>Important:</strong> Share these credentials with your {type.toLowerCase()}.
                            They'll use the <strong>ID</strong> and <strong>Password</strong> to log in to the mobile app.
                        </p>
                    </div>

                    <Button onClick={onClose} className="w-full gradient-primary">
                        Done
                    </Button>
                </CardContent>
            </Card>
        </motion.div>
    );
};

// ─── Main Page ───
const PartnerTeamManagement = () => {
    const { toast } = useToast();
    const [drivers, setDrivers] = useState<DriverItem[]>([]);
    const [scanPartners, setScanPartners] = useState<ScanPartnerItem[]>([]);
    const [stats, setStats] = useState<TeamStats | null>(null);
    const [loading, setLoading] = useState(true);

    // Create form state
    const [showCreateDriver, setShowCreateDriver] = useState(false);
    const [showCreateScan, setShowCreateScan] = useState(false);
    const [newDriverName, setNewDriverName] = useState("");
    const [newDriverPhone, setNewDriverPhone] = useState("");
    const [newScanName, setNewScanName] = useState("");
    const [newScanPhone, setNewScanPhone] = useState("");
    const [creating, setCreating] = useState(false);

    // Credentials modal
    const [showCredentials, setShowCredentials] = useState<{ credentials: Credentials; type: "Driver" | "Scan Partner" } | null>(null);

    const getToken = () => localStorage.getItem("token");

    const headers = useCallback(() => ({
        "Content-Type": "application/json",
        Authorization: `Bearer ${getToken()}`
    }), []);

    const fetchAll = useCallback(async () => {
        setLoading(true);
        try {
            const [driversRes, scanRes, statsRes] = await Promise.all([
                fetch(`${API_BASE_URL}/api/partner-team/drivers`, { headers: headers() }),
                fetch(`${API_BASE_URL}/api/partner-team/scan-partners`, { headers: headers() }),
                fetch(`${API_BASE_URL}/api/partner-team/stats`, { headers: headers() })
            ]);

            const driversData = await driversRes.json();
            const scanData = await scanRes.json();
            const statsData = await statsRes.json();

            if (driversData.success) setDrivers(driversData.drivers);
            if (scanData.success) setScanPartners(scanData.scanPartners);
            if (statsData.success) setStats(statsData.stats);
        } catch {
            toast({ title: "Error", description: "Failed to load team data", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    }, [headers, toast]);

    useEffect(() => { fetchAll(); }, [fetchAll]);

    // ─── Create Driver ───
    const handleCreateDriver = async () => {
        if (!newDriverName.trim()) {
            toast({ title: "Name Required", description: "Enter driver name", variant: "destructive" });
            return;
        }
        setCreating(true);
        try {
            const res = await fetch(`${API_BASE_URL}/api/partner-team/drivers`, {
                method: "POST",
                headers: headers(),
                body: JSON.stringify({ name: newDriverName, phone: newDriverPhone })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message);

            setShowCredentials({ credentials: data.credentials, type: "Driver" });
            setShowCreateDriver(false);
            setNewDriverName(""); setNewDriverPhone("");
            fetchAll();
        } catch (error) {
            const msg = error instanceof Error ? error.message : "Failed to create driver";
            toast({ title: "Error", description: msg, variant: "destructive" });
        } finally {
            setCreating(false);
        }
    };

    // ─── Create Scan Partner ───
    const handleCreateScan = async () => {
        if (!newScanName.trim()) {
            toast({ title: "Name Required", description: "Enter scan partner name", variant: "destructive" });
            return;
        }
        setCreating(true);
        try {
            const res = await fetch(`${API_BASE_URL}/api/partner-team/scan-partners`, {
                method: "POST",
                headers: headers(),
                body: JSON.stringify({ name: newScanName, phone: newScanPhone })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message);

            setShowCredentials({ credentials: data.credentials, type: "Scan Partner" });
            setShowCreateScan(false);
            setNewScanName(""); setNewScanPhone("");
            fetchAll();
        } catch (error) {
            const msg = error instanceof Error ? error.message : "Failed to create scan partner";
            toast({ title: "Error", description: msg, variant: "destructive" });
        } finally {
            setCreating(false);
        }
    };

    // ─── Deactivate / Reactivate ───
    const toggleStatus = async (type: "drivers" | "scan-partners", id: string, currentStatus: string) => {
        try {
            const isActive = currentStatus === "active";
            const url = isActive
                ? `${API_BASE_URL}/api/partner-team/${type}/${id}`
                : `${API_BASE_URL}/api/partner-team/${type}/${id}/reactivate`;
            const method = isActive ? "DELETE" : "PUT";

            const res = await fetch(url, { method, headers: headers() });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message);

            toast({ title: "Success", description: data.message });
            fetchAll();
        } catch (error) {
            const msg = error instanceof Error ? error.message : "Failed";
            toast({ title: "Error", description: msg, variant: "destructive" });
        }
    };

    // ─── View Credentials ───
    const viewCredentials = async (scanPartnerId: string) => {
        try {
            const res = await fetch(`${API_BASE_URL}/api/partner-team/scan-partners/${scanPartnerId}/credentials`, {
                headers: headers()
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message);
            setShowCredentials({ credentials: data.credentials, type: "Scan Partner" });
        } catch (error) {
            const msg = error instanceof Error ? error.message : "Failed to load credentials";
            toast({ title: "Error", description: msg, variant: "destructive" });
        }
    };

    const statCards = [
        { label: "Total Drivers", value: stats?.totalDrivers ?? 0, icon: Truck, color: "text-blue-600", bg: "bg-blue-100" },
        { label: "Active Drivers", value: stats?.activeDrivers ?? 0, icon: Users, color: "text-green-600", bg: "bg-green-100" },
        { label: "Total Scan Partners", value: stats?.totalScanPartners ?? 0, icon: Scan, color: "text-purple-600", bg: "bg-purple-100" },
        { label: "Active Scan Partners", value: stats?.activeScanPartners ?? 0, icon: Shield, color: "text-emerald-600", bg: "bg-emerald-100" }
    ];

    return (
        <DashboardLayout>
            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Link to="/dashboard" className="text-muted-foreground hover:text-foreground">
                            <ArrowLeft className="h-5 w-5" />
                        </Link>
                        <div>
                            <h1 className="text-2xl font-bold">Team Management</h1>
                            <p className="text-muted-foreground">Create and manage drivers & scan partners</p>
                        </div>
                    </div>
                    <Button variant="outline" size="sm" onClick={fetchAll} disabled={loading}>
                        <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
                        Refresh
                    </Button>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {statCards.map((s) => (
                        <Card key={s.label} className="border-0 shadow-sm">
                            <CardContent className="p-4 flex items-center gap-3">
                                <div className={`h-10 w-10 rounded-lg ${s.bg} flex items-center justify-center`}>
                                    <s.icon className={`h-5 w-5 ${s.color}`} />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold">{s.value}</p>
                                    <p className="text-xs text-muted-foreground">{s.label}</p>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {/* Tabs */}
                <Tabs defaultValue="drivers">
                    <TabsList className="w-full grid grid-cols-2">
                        <TabsTrigger value="drivers" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                            <Truck className="h-4 w-4 mr-2" /> Drivers
                        </TabsTrigger>
                        <TabsTrigger value="scan-partners" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                            <Scan className="h-4 w-4 mr-2" /> Scan Partners
                        </TabsTrigger>
                    </TabsList>

                    {/* ═══ DRIVERS TAB ═══ */}
                    <TabsContent value="drivers" className="space-y-4">
                        <div className="flex justify-between items-center">
                            <p className="text-sm text-muted-foreground">{drivers.length} driver(s)</p>
                            <Button size="sm" onClick={() => setShowCreateDriver(!showCreateDriver)}>
                                <UserPlus className="h-4 w-4 mr-2" /> Add Driver
                            </Button>
                        </div>

                        <AnimatePresence>
                            {showCreateDriver && (
                                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}>
                                    <Card className="border-dashed border-2 border-primary/30">
                                        <CardContent className="p-4 space-y-3">
                                            <p className="font-medium">New Driver</p>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                <Input placeholder="Driver Name *" value={newDriverName} onChange={(e) => setNewDriverName(e.target.value)} />
                                                <Input placeholder="Phone Number" value={newDriverPhone} onChange={(e) => setNewDriverPhone(e.target.value)} />
                                            </div>
                                            <div className="flex gap-2 justify-end">
                                                <Button variant="outline" size="sm" onClick={() => setShowCreateDriver(false)}>Cancel</Button>
                                                <Button size="sm" onClick={handleCreateDriver} disabled={creating}>
                                                    {creating ? "Creating..." : "Create & Generate ID"}
                                                </Button>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <div className="space-y-2">
                            {drivers.map((d) => (
                                <Card key={d._id} className="border-0 shadow-sm">
                                    <CardContent className="p-4 flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                                                <Truck className="h-5 w-5 text-blue-600" />
                                            </div>
                                            <div>
                                                <p className="font-medium">{d.name}</p>
                                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                    <span className="font-mono font-semibold text-primary">{d.driverId}</span>
                                                    {d.phone && <span>• {d.phone}</span>}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Badge variant={d.status === "active" ? "default" : "secondary"}>
                                                {d.status}
                                            </Badge>
                                            <Button
                                                size="sm"
                                                variant={d.status === "active" ? "destructive" : "outline"}
                                                onClick={() => toggleStatus("drivers", d._id, d.status)}
                                            >
                                                {d.status === "active" ? <Trash2 className="h-3 w-3" /> : <RefreshCw className="h-3 w-3" />}
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                            {!loading && drivers.length === 0 && (
                                <p className="text-center text-muted-foreground py-8">No drivers yet. Create your first one!</p>
                            )}
                        </div>
                    </TabsContent>

                    {/* ═══ SCAN PARTNERS TAB ═══ */}
                    <TabsContent value="scan-partners" className="space-y-4">
                        <div className="flex justify-between items-center">
                            <p className="text-sm text-muted-foreground">{scanPartners.length} scan partner(s)</p>
                            <Button size="sm" onClick={() => setShowCreateScan(!showCreateScan)}>
                                <UserPlus className="h-4 w-4 mr-2" /> Add Scan Partner
                            </Button>
                        </div>

                        <AnimatePresence>
                            {showCreateScan && (
                                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}>
                                    <Card className="border-dashed border-2 border-primary/30">
                                        <CardContent className="p-4 space-y-3">
                                            <p className="font-medium">New Scan Partner</p>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                <Input placeholder="Name *" value={newScanName} onChange={(e) => setNewScanName(e.target.value)} />
                                                <Input placeholder="Phone Number" value={newScanPhone} onChange={(e) => setNewScanPhone(e.target.value)} />
                                            </div>
                                            <div className="flex gap-2 justify-end">
                                                <Button variant="outline" size="sm" onClick={() => setShowCreateScan(false)}>Cancel</Button>
                                                <Button size="sm" onClick={handleCreateScan} disabled={creating}>
                                                    {creating ? "Creating..." : "Create & Generate ID"}
                                                </Button>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <div className="space-y-2">
                            {scanPartners.map((s) => (
                                <Card key={s._id} className="border-0 shadow-sm">
                                    <CardContent className="p-4 flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center">
                                                <Scan className="h-5 w-5 text-purple-600" />
                                            </div>
                                            <div>
                                                <p className="font-medium">{s.name}</p>
                                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                    <span className="font-mono font-semibold text-primary">{s.scanPartnerId}</span>
                                                    {s.phone && <span>• {s.phone}</span>}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Badge variant={s.status === "active" ? "default" : "secondary"}>
                                                {s.status}
                                            </Badge>
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => viewCredentials(s._id)}
                                            >
                                                <Eye className="h-3 w-3 mr-1" /> Credentials
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant={s.status === "active" ? "destructive" : "outline"}
                                                onClick={() => toggleStatus("scan-partners", s._id, s.status)}
                                            >
                                                {s.status === "active" ? <Trash2 className="h-3 w-3" /> : <RefreshCw className="h-3 w-3" />}
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                            {!loading && scanPartners.length === 0 && (
                                <p className="text-center text-muted-foreground py-8">No scan partners yet. Create your first one!</p>
                            )}
                        </div>
                    </TabsContent>
                </Tabs>
            </div>

            {/* Credentials Modal */}
            {showCredentials && (
                <CredentialCard
                    credentials={showCredentials.credentials}
                    type={showCredentials.type}
                    onClose={() => setShowCredentials(null)}
                />
            )}
        </DashboardLayout>
    );
};

export default PartnerTeamManagement;
