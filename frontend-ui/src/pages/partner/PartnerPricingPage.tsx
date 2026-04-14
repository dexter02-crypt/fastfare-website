import { useState, useEffect, useCallback, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import {
    AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
    AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
    Tag, Plus, Trash2, Save, RefreshCw, CheckCircle, AlertCircle,
    Loader2, Package, X, Info
} from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import { toast } from "sonner";
import { API_BASE_URL } from "@/config";

// ─── Types ────────────────────────────────────────────────────────────────────
interface Service {
    _id?: string;
    name: string;
    type: string;
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
    cities: string[];
    pinRanges: PinRange[];
}

interface FieldErrors {
    [key: string]: string;
}

const SERVICE_TYPES: { value: string; label: string }[] = [
    { value: "same_day", label: "Same Day" },
    { value: "next_day", label: "Next Day" },
    { value: "2_day_express", label: "2-Day Express" },
    { value: "standard", label: "Standard" },
    { value: "economy", label: "Economy" },
    { value: "hyperlocal", label: "Hyperlocal" },
];

const INDIAN_STATES = [
    "All India", "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", "Delhi",
    "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka", "Kerala", "Madhya Pradesh",
    "Maharashtra", "Manipur", "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab", "Rajasthan",
    "Sikkim", "Tamil Nadu", "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal",
];

const DEFAULT_SERVICE = (): Service => ({
    name: "",
    type: "standard",
    basePrice: 0,
    perKgRate: 0,
    minWeight: 0.5,
    maxWeight: 50,
    estimatedDays: "",
    codAvailable: true,
    codCharge: 0,
    active: true,
});

// ─── Main Component ───────────────────────────────────────────────────────────
const PartnerPricingPage = () => {
    const [services, setServices] = useState<Service[]>([]);
    const [coverage, setCoverage] = useState<Coverage>({ states: [], cities: [], pinRanges: [] });
    const [cityInput, setCityInput] = useState("");
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [isSavingCoverage, setIsSavingCoverage] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
    const [showOnboardingBanner, setShowOnboardingBanner] = useState(false);
    const [isDirty, setIsDirty] = useState(false);
    const initialDataRef = useRef<string>("");

    const authHeaders = () => {
        const token = localStorage.getItem("token");
        return { "Content-Type": "application/json", Authorization: `Bearer ${token}` };
    };

    // Unsaved changes guard
    useEffect(() => {
        const handler = (e: BeforeUnloadEvent) => {
            if (isDirty) {
                e.preventDefault();
                e.returnValue = "You have unsaved changes. Are you sure you want to leave?";
            }
        };
        window.addEventListener("beforeunload", handler);
        return () => window.removeEventListener("beforeunload", handler);
    }, [isDirty]);

    // Track dirty state
    useEffect(() => {
        if (!isLoading && initialDataRef.current) {
            const current = JSON.stringify({ services, coverage });
            setIsDirty(current !== initialDataRef.current);
        }
    }, [services, coverage, isLoading]);

    // ─── Data Loading ─────────────────────────────────────────────────────────
    const loadPricing = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const res = await fetch(`${API_BASE_URL}/api/partner/pricing`, { headers: authHeaders() });
            const data = await res.json();
            if (data.success && data.pricing) {
                const loadedServices = data.pricing.services?.length > 0 ? data.pricing.services : [];
                const loadedCoverage = {
                    states: data.pricing.coverage?.states || [],
                    cities: data.pricing.coverage?.cities || [],
                    pinRanges: data.pricing.coverage?.pinRanges || [],
                };
                setServices(loadedServices);
                setCoverage(loadedCoverage);
                initialDataRef.current = JSON.stringify({ services: loadedServices, coverage: loadedCoverage });

                // Show onboarding banner if not dismissed
                if (data.pricingOnboarded === false) {
                    setShowOnboardingBanner(true);
                }
            }
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : "Failed to load";
            setError(message);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => { loadPricing(); }, [loadPricing]);

    // ─── Validation ───────────────────────────────────────────────────────────
    const validateField = (key: string, value: unknown, context?: Record<string, unknown>): string => {
        switch (key) {
            case "name":
                if (!value || String(value).trim().length === 0) return "Service name is required";
                if (String(value).length > 60) return "Service name must be 60 characters or less";
                return "";
            case "basePrice":
                if (value == null || value === "" || parseFloat(String(value)) < 0) return "Base price must be 0 or greater";
                return "";
            case "perKgRate":
                if (value == null || value === "" || parseFloat(String(value)) < 0) return "Per KG rate must be 0 or greater";
                return "";
            case "minWeight":
                if (value == null || value === "" || parseFloat(String(value)) <= 0) return "Minimum weight must be greater than 0";
                return "";
            case "maxWeight": {
                const minW = context?.minWeight != null ? parseFloat(String(context.minWeight)) : 0;
                if (value == null || value === "" || parseFloat(String(value)) <= minW) return "Maximum weight must be greater than minimum weight";
                return "";
            }
            case "codCharge":
                if (context?.codAvailable && (value == null || value === "" || parseFloat(String(value)) < 0)) return "COD charge is required when COD is enabled";
                return "";
            case "pinFrom":
                if (value && !/^\d{6}$/.test(String(value))) return "PIN code must be exactly 6 digits";
                return "";
            case "pinTo": {
                if (value && !/^\d{6}$/.test(String(value))) return "'To' PIN must be 6 digits and ≥ 'From' PIN";
                const fromVal = context?.from ? parseInt(String(context.from)) : 0;
                const toVal = value ? parseInt(String(value)) : 0;
                if (value && context?.from && toVal < fromVal) return "'To' PIN must be 6 digits and ≥ 'From' PIN";
                return "";
            }
            default:
                return "";
        }
    };

    const validateAll = (): boolean => {
        const errors: FieldErrors = {};
        let valid = true;

        services.forEach((s, i) => {
            const nameErr = validateField("name", s.name);
            if (nameErr) { errors[`service_${i}_name`] = nameErr; valid = false; }

            const bpErr = validateField("basePrice", s.basePrice);
            if (bpErr) { errors[`service_${i}_basePrice`] = bpErr; valid = false; }

            const pkErr = validateField("perKgRate", s.perKgRate);
            if (pkErr) { errors[`service_${i}_perKgRate`] = pkErr; valid = false; }

            const minErr = validateField("minWeight", s.minWeight);
            if (minErr) { errors[`service_${i}_minWeight`] = minErr; valid = false; }

            const maxErr = validateField("maxWeight", s.maxWeight, { minWeight: s.minWeight });
            if (maxErr) { errors[`service_${i}_maxWeight`] = maxErr; valid = false; }

            if (s.codAvailable) {
                const codErr = validateField("codCharge", s.codCharge, { codAvailable: true });
                if (codErr) { errors[`service_${i}_codCharge`] = codErr; valid = false; }
            }
        });

        if (coverage.states.length === 0) {
            errors["coverage_states"] = "Please select at least one serviceable state";
            valid = false;
        }

        coverage.pinRanges.forEach((r, i) => {
            const fromErr = validateField("pinFrom", r.from);
            if (fromErr) { errors[`pin_${i}_from`] = fromErr; valid = false; }

            const toErr = validateField("pinTo", r.to, { from: r.from });
            if (toErr) { errors[`pin_${i}_to`] = toErr; valid = false; }
        });

        setFieldErrors(errors);
        return valid;
    };

    const handleBlur = (key: string, value: unknown, context?: Record<string, unknown>) => {
        const err = validateField(key, value, context);
        setFieldErrors(prev => {
            const next = { ...prev };
            if (err) next[key] = err;
            else delete next[key];
            return next;
        });
    };

    // ─── Save Handlers ────────────────────────────────────────────────────────
    const handleSaveAll = async () => {
        if (!validateAll()) {
            toast.error("Failed to save. Please check your inputs and try again.");
            return;
        }
        setIsSaving(true);
        try {
            const body = {
                services: services.map(s => ({
                    ...(s._id ? { _id: s._id } : {}),
                    name: s.name.trim(),
                    type: s.type,
                    basePrice: parseFloat(String(s.basePrice)) || 0,
                    perKgRate: parseFloat(String(s.perKgRate)) || 0,
                    minWeight: parseFloat(String(s.minWeight)) || 0.5,
                    maxWeight: parseFloat(String(s.maxWeight)) || 50,
                    estimatedDays: s.estimatedDays,
                    codAvailable: s.codAvailable,
                    codCharge: s.codAvailable ? (parseFloat(String(s.codCharge)) || 0) : null,
                    active: s.active,
                })),
                coverage: {
                    states: coverage.states,
                    cities: coverage.cities,
                    pinRanges: coverage.pinRanges,
                },
            };

            const res = await fetch(`${API_BASE_URL}/api/partner/pricing/save-all`, {
                method: "POST",
                headers: authHeaders(),
                body: JSON.stringify(body),
            });
            const data = await res.json();
            if (data.success) {
                toast.success("Pricing & Services saved successfully.");
                initialDataRef.current = JSON.stringify({ services, coverage });
                setIsDirty(false);
                // Reload to get persisted _id values
                await loadPricing();
            } else {
                toast.error(data.message || "Failed to save. Please check your inputs and try again.");
            }
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : "Failed to save";
            toast.error("Failed to save: " + message);
        } finally {
            setIsSaving(false);
        }
    };

    const handleSaveCoverage = async () => {
        // Validate coverage only
        const errors: FieldErrors = {};
        let valid = true;
        if (coverage.states.length === 0) {
            errors["coverage_states"] = "Please select at least one serviceable state";
            valid = false;
        }
        coverage.pinRanges.forEach((r, i) => {
            const fromErr = validateField("pinFrom", r.from);
            if (fromErr) { errors[`pin_${i}_from`] = fromErr; valid = false; }
            const toErr = validateField("pinTo", r.to, { from: r.from });
            if (toErr) { errors[`pin_${i}_to`] = toErr; valid = false; }
        });
        if (!valid) {
            setFieldErrors(prev => ({ ...prev, ...errors }));
            toast.error("Failed to save. Please check your inputs and try again.");
            return;
        }

        setIsSavingCoverage(true);
        try {
            const res = await fetch(`${API_BASE_URL}/api/partner/pricing/coverage`, {
                method: "PUT",
                headers: authHeaders(),
                body: JSON.stringify({
                    serviceable_states: coverage.states,
                    serviceable_cities: coverage.cities,
                    pin_code_ranges: coverage.pinRanges,
                }),
            });
            const data = await res.json();
            if (data.success) {
                toast.success("Coverage saved successfully!");
                initialDataRef.current = JSON.stringify({ services, coverage });
                setIsDirty(false);
            } else {
                toast.error(data.message || "Failed to save coverage.");
            }
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : "Failed to save";
            toast.error("Failed to save: " + message);
        } finally {
            setIsSavingCoverage(false);
        }
    };

    // ─── Dismiss onboarding banner ────────────────────────────────────────────
    const dismissOnboarding = async () => {
        setShowOnboardingBanner(false);
        try {
            await fetch(`${API_BASE_URL}/api/partner/pricing/dismiss-onboarding`, {
                method: "POST",
                headers: authHeaders(),
            });
        } catch {
            // Silent fail — banner already hidden
        }
    };

    // ─── Service helpers ──────────────────────────────────────────────────────
    const updateService = (index: number, field: keyof Service, value: unknown) => {
        setServices(prev => prev.map((s, i) => i === index ? { ...s, [field]: value } : s));
    };
    const addService = () => setServices(prev => [...prev, DEFAULT_SERVICE()]);
    const removeService = (index: number) => {
        setServices(prev => prev.filter((_, i) => i !== index));
        // Clear errors for this service
        setFieldErrors(prev => {
            const next = { ...prev };
            Object.keys(next).filter(k => k.startsWith(`service_${index}_`)).forEach(k => delete next[k]);
            return next;
        });
    };

    // ─── Coverage helpers ─────────────────────────────────────────────────────
    const toggleState = (state: string) => {
        setCoverage(prev => {
            if (state === "All India") {
                // If All India is already selected, deselect it
                if (prev.states.includes("All India")) {
                    return { ...prev, states: [] };
                }
                return { ...prev, states: ["All India"] };
            }
            const filtered = prev.states.filter(s => s !== "All India");
            return {
                ...prev,
                states: filtered.includes(state) ? filtered.filter(s => s !== state) : [...filtered, state],
            };
        });
    };

    const isAllIndia = coverage.states.includes("All India");

    const addCity = (city: string) => {
        const trimmed = city.trim();
        if (trimmed && !coverage.cities.includes(trimmed)) {
            setCoverage(prev => ({ ...prev, cities: [...prev.cities, trimmed] }));
        }
    };

    const removeCity = (city: string) => {
        setCoverage(prev => ({ ...prev, cities: prev.cities.filter(c => c !== city) }));
    };

    const handleCityKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter" || e.key === ",") {
            e.preventDefault();
            const parts = cityInput.split(",").map(c => c.trim()).filter(Boolean);
            parts.forEach(addCity);
            setCityInput("");
        }
    };

    const handleCityBlur = () => {
        if (cityInput.trim()) {
            const parts = cityInput.split(",").map(c => c.trim()).filter(Boolean);
            parts.forEach(addCity);
            setCityInput("");
        }
    };

    const addPinRange = () => setCoverage(prev => ({ ...prev, pinRanges: [...prev.pinRanges, { from: "", to: "" }] }));
    const updatePinRange = (i: number, field: "from" | "to", val: string) => {
        // Only allow digits, max 6
        const cleaned = val.replace(/\D/g, "").slice(0, 6);
        setCoverage(prev => ({
            ...prev,
            pinRanges: prev.pinRanges.map((r, idx) => idx === i ? { ...r, [field]: cleaned } : r),
        }));
    };
    const removePinRange = (i: number) => {
        setCoverage(prev => ({ ...prev, pinRanges: prev.pinRanges.filter((_, idx) => idx !== i) }));
        setFieldErrors(prev => {
            const next = { ...prev };
            delete next[`pin_${i}_from`];
            delete next[`pin_${i}_to`];
            return next;
        });
    };

    // ─── Error helper ─────────────────────────────────────────────────────────
    const FieldError = ({ errorKey }: { errorKey: string }) => {
        const msg = fieldErrors[errorKey];
        if (!msg) return null;
        return <p className="text-xs text-red-500 mt-1">{msg}</p>;
    };

    const hasError = (key: string) => !!fieldErrors[key];

    // ─── Skeleton State ───────────────────────────────────────────────────────
    if (isLoading) {
        return (
            <DashboardLayout>
                <div className="space-y-8">
                    <div className="flex items-center justify-between">
                        <div>
                            <Skeleton className="h-8 w-64 mb-2" />
                            <Skeleton className="h-4 w-96" />
                        </div>
                        <Skeleton className="h-10 w-40" />
                    </div>
                    {/* Service card skeletons */}
                    {[1, 2].map(n => (
                        <Card key={n}>
                            <CardHeader>
                                <Skeleton className="h-5 w-48" />
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="border rounded-xl p-5 space-y-4">
                                    <div className="flex items-center justify-between">
                                        <Skeleton className="h-6 w-20" />
                                        <Skeleton className="h-8 w-8 rounded" />
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                        {[1, 2, 3, 4].map(f => (
                                            <div key={f} className="space-y-2">
                                                <Skeleton className="h-4 w-24" />
                                                <Skeleton className="h-10 w-full" />
                                            </div>
                                        ))}
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Skeleton className="h-4 w-24" />
                                            <Skeleton className="h-10 w-full" />
                                        </div>
                                        <div className="space-y-2">
                                            <Skeleton className="h-4 w-24" />
                                            <Skeleton className="h-10 w-full" />
                                        </div>
                                    </div>
                                    <Skeleton className="h-10 w-full rounded-lg" />
                                    <Skeleton className="h-6 w-32" />
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                    {/* Coverage skeleton */}
                    <Card>
                        <CardHeader>
                            <Skeleton className="h-5 w-56" />
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <Skeleton className="h-4 w-32" />
                            <div className="flex flex-wrap gap-2">
                                {Array.from({ length: 10 }).map((_, i) => (
                                    <Skeleton key={i} className="h-7 w-24 rounded-full" />
                                ))}
                            </div>
                            <Skeleton className="h-10 w-full" />
                            <Skeleton className="h-10 w-full" />
                        </CardContent>
                    </Card>
                </div>
            </DashboardLayout>
        );
    }

    // ─── Error State ──────────────────────────────────────────────────────────
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

    const saving = isSaving || isSavingCoverage;

    return (
        <DashboardLayout>
            <div className="space-y-8">
                {/* Onboarding Banner */}
                {showOnboardingBanner && (
                    <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-xl p-4 flex items-start gap-3">
                        <Info className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                        <div className="flex-1">
                            <p className="text-sm text-blue-800 dark:text-blue-300">
                                Welcome! Set up your shipping services and rates to start accepting orders. This information is shown to customers in the FastFare Rate Calculator.
                            </p>
                        </div>
                        <Button
                            variant="ghost"
                            size="sm"
                            className="text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900 flex-shrink-0"
                            onClick={dismissOnboarding}
                        >
                            Got it
                        </Button>
                    </div>
                )}

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
                    <Button
                        id="save-all-btn"
                        onClick={handleSaveAll}
                        disabled={saving}
                        className="gradient-primary"
                    >
                        {isSaving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                        Save All Changes
                    </Button>
                </div>

                {/* ─── Section 1: Service Configuration ──────────────── */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle className="text-base">Service Configuration</CardTitle>
                        <Button variant="outline" size="sm" onClick={addService} disabled={saving}>
                            <Plus className="h-4 w-4 mr-2" /> Add Service
                        </Button>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {services.length === 0 ? (
                            /* Empty state */
                            <div className="flex flex-col items-center justify-center py-12 text-center">
                                <div className="h-16 w-16 rounded-full bg-muted/50 flex items-center justify-center mb-4">
                                    <Package className="h-8 w-8 text-muted-foreground" />
                                </div>
                                <h3 className="text-lg font-semibold mb-1">No services configured yet</h3>
                                <p className="text-muted-foreground text-sm max-w-md mb-4">
                                    Add your first shipping service to start accepting orders through FastFare.
                                </p>
                                <Button onClick={addService} disabled={saving}>
                                    <Plus className="h-4 w-4 mr-2" /> Add Your First Service
                                </Button>
                            </div>
                        ) : (
                            services.map((service, index) => (
                                <div key={service._id || index} className="border rounded-xl p-5 space-y-5 relative transition-all duration-200 hover:shadow-sm">
                                    {/* Card Top Row */}
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-3">
                                            <Switch
                                                id={`service-active-${index}`}
                                                checked={service.active}
                                                onCheckedChange={(v) => updateService(index, "active", v)}
                                                disabled={saving}
                                            />
                                            <span className="text-sm font-medium">
                                                {service.active ? (
                                                    <span className="text-green-600 flex items-center gap-1"><CheckCircle className="h-4 w-4" /> Active</span>
                                                ) : (
                                                    <span className="text-muted-foreground">Inactive</span>
                                                )}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <div className="space-y-1 flex-1 min-w-[200px]">
                                                <Input
                                                    id={`service-name-${index}`}
                                                    value={service.name}
                                                    onChange={e => updateService(index, "name", e.target.value)}
                                                    onBlur={() => handleBlur(`service_${index}_name`, service.name)}
                                                    placeholder="e.g. Standard Delivery"
                                                    maxLength={60}
                                                    disabled={saving}
                                                    className={hasError(`service_${index}_name`) ? "border-red-500" : ""}
                                                />
                                                <FieldError errorKey={`service_${index}_name`} />
                                            </div>
                                            <AlertDialog>
                                                <AlertDialogTrigger asChild>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="text-red-500 hover:text-red-600 hover:bg-red-50 h-8 w-8 flex-shrink-0"
                                                        disabled={saving}
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </AlertDialogTrigger>
                                                <AlertDialogContent>
                                                    <AlertDialogHeader>
                                                        <AlertDialogTitle>Remove this service?</AlertDialogTitle>
                                                        <AlertDialogDescription>
                                                            This action cannot be undone.
                                                        </AlertDialogDescription>
                                                    </AlertDialogHeader>
                                                    <AlertDialogFooter>
                                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                        <AlertDialogAction
                                                            onClick={() => removeService(index)}
                                                            className="bg-red-600 hover:bg-red-700"
                                                        >
                                                            Confirm
                                                        </AlertDialogAction>
                                                    </AlertDialogFooter>
                                                </AlertDialogContent>
                                            </AlertDialog>
                                        </div>
                                    </div>

                                    {/* Row 1: Type, Days, Base Price, Per KG Rate */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                        <div className="space-y-1">
                                            <Label className="text-xs">Service Type</Label>
                                            <Select
                                                value={service.type}
                                                onValueChange={v => updateService(index, "type", v)}
                                                disabled={saving}
                                            >
                                                <SelectTrigger id={`service-type-${index}`}>
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {SERVICE_TYPES.map(t => (
                                                        <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-1">
                                            <Label className="text-xs">Estimated Days</Label>
                                            <Input
                                                id={`service-days-${index}`}
                                                value={service.estimatedDays}
                                                onChange={e => updateService(index, "estimatedDays", e.target.value)}
                                                placeholder="e.g. 2-3 days"
                                                disabled={saving}
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <Label className="text-xs">Base Price (₹)</Label>
                                            <Input
                                                id={`service-base-price-${index}`}
                                                type="number"
                                                value={service.basePrice}
                                                onChange={e => updateService(index, "basePrice", e.target.value)}
                                                onBlur={() => handleBlur(`service_${index}_basePrice`, service.basePrice)}
                                                placeholder="0"
                                                min={0}
                                                disabled={saving}
                                                className={hasError(`service_${index}_basePrice`) ? "border-red-500" : ""}
                                            />
                                            <FieldError errorKey={`service_${index}_basePrice`} />
                                        </div>
                                        <div className="space-y-1">
                                            <Label className="text-xs">Per KG Rate (₹)</Label>
                                            <Input
                                                id={`service-per-kg-${index}`}
                                                type="number"
                                                value={service.perKgRate}
                                                onChange={e => updateService(index, "perKgRate", e.target.value)}
                                                onBlur={() => handleBlur(`service_${index}_perKgRate`, service.perKgRate)}
                                                placeholder="0"
                                                min={0}
                                                disabled={saving}
                                                className={hasError(`service_${index}_perKgRate`) ? "border-red-500" : ""}
                                            />
                                            <FieldError errorKey={`service_${index}_perKgRate`} />
                                        </div>
                                    </div>

                                    {/* Row 2: Min/Max Weight */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-1">
                                            <Label className="text-xs">Min Weight (kg)</Label>
                                            <Input
                                                id={`service-min-weight-${index}`}
                                                type="number"
                                                value={service.minWeight}
                                                onChange={e => updateService(index, "minWeight", e.target.value)}
                                                onBlur={() => handleBlur(`service_${index}_minWeight`, service.minWeight)}
                                                placeholder="0.5"
                                                min={0.01}
                                                step={0.1}
                                                disabled={saving}
                                                className={hasError(`service_${index}_minWeight`) ? "border-red-500" : ""}
                                            />
                                            <FieldError errorKey={`service_${index}_minWeight`} />
                                        </div>
                                        <div className="space-y-1">
                                            <Label className="text-xs">Max Weight (kg)</Label>
                                            <Input
                                                id={`service-max-weight-${index}`}
                                                type="number"
                                                value={service.maxWeight}
                                                onChange={e => updateService(index, "maxWeight", e.target.value)}
                                                onBlur={() => handleBlur(`service_${index}_maxWeight`, service.maxWeight, { minWeight: service.minWeight })}
                                                placeholder="50"
                                                min={0}
                                                disabled={saving}
                                                className={hasError(`service_${index}_maxWeight`) ? "border-red-500" : ""}
                                            />
                                            <FieldError errorKey={`service_${index}_maxWeight`} />
                                        </div>
                                    </div>

                                    {/* Rate preview */}
                                    <div className="bg-muted/50 rounded-lg px-4 py-3 text-sm text-muted-foreground border border-dashed">
                                        <span className="font-medium">Rate formula preview (1 kg): </span>
                                        ₹{parseFloat(String(service.basePrice)) || 0} base + (1 kg × ₹{parseFloat(String(service.perKgRate)) || 0})
                                        = <span className="font-semibold text-foreground">
                                            ₹{((parseFloat(String(service.basePrice)) || 0) + (parseFloat(String(service.perKgRate)) || 0)).toFixed(2)}
                                        </span>
                                    </div>

                                    {/* COD */}
                                    <div className="flex items-center gap-6 flex-wrap">
                                        <div className="flex items-center gap-3">
                                            <Switch
                                                id={`service-cod-${index}`}
                                                checked={service.codAvailable}
                                                onCheckedChange={v => updateService(index, "codAvailable", v)}
                                                disabled={saving}
                                            />
                                            <Label className="text-sm cursor-pointer">COD Available</Label>
                                        </div>
                                        {service.codAvailable && (
                                            <div className="space-y-1">
                                                <div className="flex items-center gap-2">
                                                    <Label className="text-xs text-muted-foreground">COD Charge (₹)</Label>
                                                    <Input
                                                        id={`service-cod-charge-${index}`}
                                                        type="number"
                                                        className={`w-24 h-8 text-sm ${hasError(`service_${index}_codCharge`) ? "border-red-500" : ""}`}
                                                        value={service.codCharge}
                                                        onChange={e => updateService(index, "codCharge", e.target.value)}
                                                        onBlur={() => handleBlur(`service_${index}_codCharge`, service.codCharge, { codAvailable: true })}
                                                        placeholder="e.g. 30"
                                                        min={0}
                                                        disabled={saving}
                                                    />
                                                </div>
                                                <FieldError errorKey={`service_${index}_codCharge`} />
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))
                        )}
                    </CardContent>
                </Card>

                <Separator />

                {/* ─── Section 2: Serviceability & Coverage ──────────── */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Serviceability &amp; Coverage</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {/* States */}
                        <div className="space-y-2">
                            <Label>Serviceable States</Label>
                            {hasError("coverage_states") && (
                                <p className="text-xs text-red-500">{fieldErrors["coverage_states"]}</p>
                            )}
                            <div className="flex flex-wrap gap-2">
                                {INDIAN_STATES.map(state => {
                                    const selected = coverage.states.includes(state);
                                    const disabled = saving || (isAllIndia && state !== "All India");
                                    return (
                                        <Badge
                                            key={state}
                                            id={`state-${state.replace(/\s/g, "-").toLowerCase()}`}
                                            variant={selected ? "default" : "outline"}
                                            className={`cursor-pointer select-none transition-all duration-150 ${disabled ? "opacity-50 pointer-events-none" : "hover:scale-105"} ${selected ? "shadow-sm" : ""}`}
                                            onClick={() => !disabled && toggleState(state)}
                                        >
                                            {state}
                                        </Badge>
                                    );
                                })}
                            </div>
                            {/* Selected states chips */}
                            {coverage.states.length > 0 && (
                                <div className="flex flex-wrap gap-1.5 mt-2">
                                    {coverage.states.map(s => (
                                        <Badge key={s} variant="secondary" className="text-xs gap-1">
                                            {s}
                                            <button
                                                type="button"
                                                onClick={() => toggleState(s)}
                                                className="ml-0.5 hover:text-red-500"
                                                disabled={saving}
                                            >
                                                <X className="h-3 w-3" />
                                            </button>
                                        </Badge>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Cities */}
                        <div className="space-y-2">
                            <Label>Serviceable Cities</Label>
                            <p className="text-xs text-muted-foreground">Enter city names separated by commas</p>
                            <Input
                                id="city-input"
                                placeholder="e.g. Gurgaon, Delhi, Jaipur, Faridabad"
                                value={cityInput}
                                onChange={e => setCityInput(e.target.value)}
                                onKeyDown={handleCityKeyDown}
                                onBlur={handleCityBlur}
                                disabled={saving}
                            />
                            {coverage.cities.length > 0 && (
                                <div className="flex flex-wrap gap-1.5">
                                    {coverage.cities.map(city => (
                                        <Badge key={city} variant="secondary" className="text-xs gap-1">
                                            {city}
                                            <button
                                                type="button"
                                                onClick={() => removeCity(city)}
                                                className="ml-0.5 hover:text-red-500"
                                                disabled={saving}
                                            >
                                                <X className="h-3 w-3" />
                                            </button>
                                        </Badge>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* PIN Ranges */}
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <Label>PIN Code Ranges</Label>
                                <Button variant="outline" size="sm" onClick={addPinRange} disabled={saving}>
                                    <Plus className="h-4 w-4 mr-1" /> Add Range
                                </Button>
                            </div>
                            {coverage.pinRanges.length === 0 && (
                                <p className="text-xs text-muted-foreground">No PIN ranges defined. You can use states/cities instead.</p>
                            )}
                            {coverage.pinRanges.map((range, i) => (
                                <div key={i}>
                                    <div className="flex items-center gap-2 sm:gap-3">
                                        <div className="flex-1 flex items-center gap-2">
                                            <div className="flex-1">
                                                <Input
                                                    id={`pin-from-${i}`}
                                                    className={`w-full sm:w-32 ${hasError(`pin_${i}_from`) ? "border-red-500" : ""}`}
                                                    placeholder="From (e.g. 110001)"
                                                    value={range.from}
                                                    onChange={e => updatePinRange(i, "from", e.target.value)}
                                                    onBlur={() => handleBlur(`pin_${i}_from`, range.from)}
                                                    maxLength={6}
                                                    disabled={saving}
                                                />
                                                <FieldError errorKey={`pin_${i}_from`} />
                                            </div>
                                            <span className="text-muted-foreground text-sm">to</span>
                                            <div className="flex-1">
                                                <Input
                                                    id={`pin-to-${i}`}
                                                    className={`w-full sm:w-32 ${hasError(`pin_${i}_to`) ? "border-red-500" : ""}`}
                                                    placeholder="To (e.g. 110099)"
                                                    value={range.to}
                                                    onChange={e => updatePinRange(i, "to", e.target.value)}
                                                    onBlur={() => handleBlur(`pin_${i}_to`, range.to, { from: range.from })}
                                                    maxLength={6}
                                                    disabled={saving}
                                                />
                                                <FieldError errorKey={`pin_${i}_to`} />
                                            </div>
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="shrink-0 text-red-500 h-8 w-8"
                                            onClick={() => removePinRange(i)}
                                            disabled={saving}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <Button
                            id="save-coverage-btn"
                            onClick={handleSaveCoverage}
                            disabled={saving}
                            className="w-full"
                            variant="secondary"
                        >
                            {isSavingCoverage ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                            Save Coverage &amp; Pricing
                        </Button>
                    </CardContent>
                </Card>
            </div>
        </DashboardLayout>
    );
};

export default PartnerPricingPage;
