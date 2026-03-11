import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import {
    Tag, Plus, Trash2, Save, RefreshCw, CheckCircle, AlertCircle, Loader2
} from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import { toast } from "sonner";
import { API_BASE_URL } from "@/config";

// ─── Types ────────────────────────────────────────────────────────────────────
interface Service {
    _id?: string;
    name: string;
    type: "standard" | "express" | "same_day";
    basePrice: number | string;
    perKgRate: number | string;
    minWeight: number | string;
    maxWeight: number | string;
    estimatedDays: string;
    codAvailable: boolean;
    codCharge: number | string;
    active: boolean;
}

interface PinRange { from: string; to: string; }
interface Coverage {
    states: string[];
    cities: string;
    pinRanges: PinRange[];
}

const INDIAN_STATES = [
    "All India", "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", "Delhi",
    "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka", "Kerala", "Madhya Pradesh",
    "Maharashtra", "Manipur", "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab", "Rajasthan",
    "Sikkim", "Tamil Nadu", "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal",
];

const DEFAULT_SERVICE = (): Service => ({
    name: "",
    type: "standard",
    basePrice: 80,
    perKgRate: 20,
    minWeight: 0.5,
    maxWeight: 50,
    estimatedDays: "3-5 days",
    codAvailable: true,
    codCharge: 30,
    active: true,
});

// ─── Main Component ───────────────────────────────────────────────────────────
const PartnerPricingPage = () => {
    const [services, setServices] = useState<Service[]>([DEFAULT_SERVICE()]);
    const [coverage, setCoverage] = useState<Coverage>({ states: [], cities: "", pinRanges: [] });
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const authHeaders = () => {
        const token = localStorage.getItem("token");
        return { "Content-Type": "application/json", Authorization: `Bearer ${token}` };
    };

    // Load existing config
    const loadPricing = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const res = await fetch(`${API_BASE_URL}/api/partner/pricing`, { headers: authHeaders() });
            const data = await res.json();
            if (data.success && data.pricing) {
                if (data.pricing.services?.length > 0) setServices(data.pricing.services);
                if (data.pricing.coverage) {
                    setCoverage({
                        states: data.pricing.coverage.states || [],
                        cities: (data.pricing.coverage.cities || []).join(", "),
                        pinRanges: data.pricing.coverage.pinRanges || [],
                    });
                }
            }
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => { loadPricing(); }, [loadPricing]);

    // Save handler
    const handleSave = async () => {
        setIsSaving(true);
        try {
            const user = JSON.parse(localStorage.getItem("user") || "{}");
            const body = {
                companyName: user.businessName || user.contactPerson || "",
                services: services.map(s => ({
                    ...s,
                    basePrice: parseFloat(String(s.basePrice)) || 0,
                    perKgRate: parseFloat(String(s.perKgRate)) || 0,
                    minWeight: parseFloat(String(s.minWeight)) || 0.5,
                    maxWeight: parseFloat(String(s.maxWeight)) || 50,
                    codCharge: parseFloat(String(s.codCharge)) || 0,
                })),
                coverage: {
                    states: coverage.states,
                    cities: coverage.cities.split(",").map(c => c.trim()).filter(Boolean),
                    pinRanges: coverage.pinRanges,
                },
            };

            const res = await fetch(`${API_BASE_URL}/api/partner/pricing`, {
                method: "POST",
                headers: authHeaders(),
                body: JSON.stringify(body),
            });
            const data = await res.json();
            if (data.success) {
                toast.success("Pricing configuration saved!");
            } else {
                toast.error(data.message || "Save failed");
            }
        } catch (err: any) {
            toast.error("Failed to save: " + err.message);
        } finally {
            setIsSaving(false);
        }
    };

    // Service helpers
    const updateService = (index: number, field: keyof Service, value: any) => {
        setServices(prev => prev.map((s, i) => i === index ? { ...s, [field]: value } : s));
    };
    const addService = () => setServices(prev => [...prev, DEFAULT_SERVICE()]);
    const removeService = (index: number) => setServices(prev => prev.filter((_, i) => i !== index));

    // PIN range helpers
    const addPinRange = () => setCoverage(prev => ({ ...prev, pinRanges: [...prev.pinRanges, { from: "", to: "" }] }));
    const updatePinRange = (i: number, field: "from" | "to", val: string) => {
        setCoverage(prev => ({
            ...prev,
            pinRanges: prev.pinRanges.map((r, idx) => idx === i ? { ...r, [field]: val } : r),
        }));
    };
    const removePinRange = (i: number) => setCoverage(prev => ({ ...prev, pinRanges: prev.pinRanges.filter((_, idx) => idx !== i) }));

    const toggleState = (state: string) => {
        setCoverage(prev => {
            if (state === "All India") return { ...prev, states: ["All India"] };
            const filtered = prev.states.filter(s => s !== "All India");
            return {
                ...prev,
                states: filtered.includes(state) ? filtered.filter(s => s !== state) : [...filtered, state],
            };
        });
    };

    if (isLoading) {
        return (
            <DashboardLayout>
                <div className="flex items-center justify-center h-64">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
            </DashboardLayout>
        );
    }

    if (error) {
        return (
            <DashboardLayout>
                <div className="flex flex-col items-center justify-center h-64 gap-4">
                    <AlertCircle className="h-10 w-10 text-red-500" />
                    <p className="text-muted-foreground">{error}</p>
                    <Button onClick={loadPricing}>
                        <RefreshCw className="h-4 w-4 mr-2" /> Retry
                    </Button>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            <div className="space-y-8">
                {/* Header */}
                <div className="flex items-center justify-between flex-wrap gap-4">
                    <div>
                        <h1 className="text-2xl font-bold flex items-center gap-2">
                            <Tag className="h-6 w-6 text-primary" /> Pricing &amp; Services
                        </h1>
                        <p className="text-muted-foreground text-sm mt-1">
                            Configure your shipping services and rates. These appear in the FastFare Rate Calculator for customers.
                        </p>
                    </div>
                    <Button onClick={handleSave} disabled={isSaving} className="gradient-primary">
                        {isSaving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                        Save All Changes
                    </Button>
                </div>

                {/* ─── Section A: Service Configuration ──────────────── */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle className="text-base">Service Configuration</CardTitle>
                        <Button variant="outline" size="sm" onClick={addService}>
                            <Plus className="h-4 w-4 mr-2" /> Add Service
                        </Button>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {services.map((service, index) => (
                            <div key={index} className="border rounded-xl p-5 space-y-5 relative">
                                {/* Active toggle + delete */}
                                <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-3">
                                        <Switch
                                            checked={service.active}
                                            onCheckedChange={(v) => updateService(index, "active", v)}
                                        />
                                        <span className="text-sm font-medium">
                                            {service.active ? (
                                                <span className="text-green-600 flex items-center gap-1"><CheckCircle className="h-4 w-4" /> Active</span>
                                            ) : (
                                                <span className="text-muted-foreground">Inactive</span>
                                            )}
                                        </span>
                                    </div>
                                    {services.length > 1 && (
                                        <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-600 hover:bg-red-50 h-8 w-8"
                                            onClick={() => removeService(index)}>
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    )}
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {/* Name */}
                                    <div className="space-y-1">
                                        <Label className="text-xs">Service Name</Label>
                                        <Input value={service.name} onChange={e => updateService(index, "name", e.target.value)}
                                            placeholder="e.g. Standard Delivery" />
                                    </div>
                                    {/* Type */}
                                    <div className="space-y-1">
                                        <Label className="text-xs">Service Type</Label>
                                        <Select value={service.type} onValueChange={v => updateService(index, "type", v)}>
                                            <SelectTrigger><SelectValue /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="standard">Standard</SelectItem>
                                                <SelectItem value="express">Express</SelectItem>
                                                <SelectItem value="same_day">Same Day</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    {/* Estimated Days */}
                                    <div className="space-y-1">
                                        <Label className="text-xs">Estimated Days</Label>
                                        <Input value={service.estimatedDays} onChange={e => updateService(index, "estimatedDays", e.target.value)}
                                            placeholder="e.g. 2-3 days" />
                                    </div>
                                    {/* Base Price */}
                                    <div className="space-y-1">
                                        <Label className="text-xs">Base Price (₹)</Label>
                                        <Input type="number" value={service.basePrice} onChange={e => updateService(index, "basePrice", e.target.value)}
                                            placeholder="80" min={0} />
                                    </div>
                                    {/* Per KG Rate */}
                                    <div className="space-y-1">
                                        <Label className="text-xs">Per KG Rate (₹)</Label>
                                        <Input type="number" value={service.perKgRate} onChange={e => updateService(index, "perKgRate", e.target.value)}
                                            placeholder="20" min={0} />
                                    </div>
                                    {/* Min Weight */}
                                    <div className="space-y-1">
                                        <Label className="text-xs">Min Weight (kg)</Label>
                                        <Input type="number" value={service.minWeight} onChange={e => updateService(index, "minWeight", e.target.value)}
                                            placeholder="0.5" min={0} step={0.1} />
                                    </div>
                                    {/* Max Weight */}
                                    <div className="space-y-1">
                                        <Label className="text-xs">Max Weight (kg)</Label>
                                        <Input type="number" value={service.maxWeight} onChange={e => updateService(index, "maxWeight", e.target.value)}
                                            placeholder="50" min={0} />
                                    </div>
                                </div>

                                {/* Rate preview */}
                                <div className="bg-muted/50 rounded-lg px-4 py-2 text-xs text-muted-foreground">
                                    <span className="font-medium">Rate formula preview (1 kg): </span>
                                    ₹{parseFloat(String(service.basePrice)) || 0} base + (
                                    {Math.max(parseFloat(String(service.minWeight)) || 0.5, 1)} kg × ₹{parseFloat(String(service.perKgRate)) || 0})
                                    = <span className="font-semibold text-foreground">
                                        ₹{(parseFloat(String(service.basePrice)) || 0) +
                                            Math.max(parseFloat(String(service.minWeight)) || 0.5, 1) * (parseFloat(String(service.perKgRate)) || 0)}
                                    </span>
                                </div>

                                {/* COD */}
                                <div className="flex items-center gap-6 flex-wrap">
                                    <div className="flex items-center gap-3">
                                        <Switch checked={service.codAvailable} onCheckedChange={v => updateService(index, "codAvailable", v)} />
                                        <Label className="text-sm cursor-pointer">COD Available</Label>
                                    </div>
                                    {service.codAvailable && (
                                        <div className="flex items-center gap-2">
                                            <Label className="text-xs text-muted-foreground">COD Charge (₹)</Label>
                                            <Input type="number" className="w-24 h-8 text-sm"
                                                value={service.codCharge} onChange={e => updateService(index, "codCharge", e.target.value)}
                                                placeholder="30" min={0} />
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </CardContent>
                </Card>

                {/* ─── Section B: Coverage ──────────────────────────── */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Serviceability &amp; Coverage</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {/* States */}
                        <div className="space-y-2">
                            <Label>Serviceable States</Label>
                            <div className="flex flex-wrap gap-2">
                                {INDIAN_STATES.map(state => (
                                    <Badge
                                        key={state}
                                        variant={coverage.states.includes(state) ? "default" : "outline"}
                                        className="cursor-pointer select-none"
                                        onClick={() => toggleState(state)}
                                    >
                                        {state}
                                    </Badge>
                                ))}
                            </div>
                        </div>

                        {/* Cities */}
                        <div className="space-y-2">
                            <Label>Serviceable Cities <span className="text-muted-foreground text-xs">(comma-separated)</span></Label>
                            <Input
                                placeholder="e.g. Gurgaon, Delhi, Jaipur, Faridabad"
                                value={coverage.cities}
                                onChange={e => setCoverage(prev => ({ ...prev, cities: e.target.value }))}
                            />
                        </div>

                        {/* PIN Ranges */}
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <Label>PIN Code Ranges</Label>
                                <Button variant="outline" size="sm" onClick={addPinRange}>
                                    <Plus className="h-4 w-4 mr-1" /> Add Range
                                </Button>
                            </div>
                            {coverage.pinRanges.length === 0 && (
                                <p className="text-xs text-muted-foreground">No PIN ranges defined. You can use states/cities instead.</p>
                            )}
                            {coverage.pinRanges.map((range, i) => (
                                <div key={i} className="flex items-center gap-3">
                                    <Input className="w-32" placeholder="From (e.g. 110001)" value={range.from}
                                        onChange={e => updatePinRange(i, "from", e.target.value)} maxLength={6} />
                                    <span className="text-muted-foreground text-sm">to</span>
                                    <Input className="w-32" placeholder="To (e.g. 110099)" value={range.to}
                                        onChange={e => updatePinRange(i, "to", e.target.value)} maxLength={6} />
                                    <Button variant="ghost" size="icon" className="text-red-500 h-8 w-8" onClick={() => removePinRange(i)}>
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            ))}
                        </div>

                        <Button onClick={handleSave} disabled={isSaving} className="w-full gradient-primary">
                            {isSaving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                            Save Coverage &amp; Pricing
                        </Button>
                    </CardContent>
                </Card>
            </div>
        </DashboardLayout>
    );
};

export default PartnerPricingPage;
