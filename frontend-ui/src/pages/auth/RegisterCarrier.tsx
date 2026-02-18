import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { API_BASE_URL } from "@/config";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
    Eye, EyeOff, ArrowLeft, Truck, Mail, Phone, User, Shield,
    MapPin, Building2, Package, Zap, CheckCircle, Loader2, Globe, Plus, X
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import logo from "@/assets/logo.png";
import authBg from "@/assets/auth-bg.png";

const steps = [
    { id: 1, title: "Business Info", icon: Building2 },
    { id: 2, title: "Fleet & Zones", icon: Truck },
    { id: 3, title: "Pricing & API", icon: Zap },
    { id: 4, title: "Credentials", icon: Shield },
];

const vehicleTypeOptions = [
    { id: "bike", label: "Bike" },
    { id: "auto", label: "Auto" },
    { id: "mini_truck", label: "Mini Truck" },
    { id: "truck", label: "Truck" },
    { id: "large_truck", label: "Large Truck" },
    { id: "tempo", label: "Tempo" },
];

const shipmentTypeOptions = [
    { id: "standard", label: "Standard" },
    { id: "express", label: "Express" },
    { id: "overnight", label: "Overnight" },
    { id: "economy", label: "Economy" },
    { id: "fragile", label: "Fragile" },
];

const RegisterCarrier = () => {
    const navigate = useNavigate();
    const { toast } = useToast();
    const [step, setStep] = useState(1);
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [acceptTerms, setAcceptTerms] = useState(false);
    const [submitted, setSubmitted] = useState(false);

    const [formData, setFormData] = useState({
        businessName: "",
        contactPerson: "",
        gstin: "",
        panNumber: "",
        totalVehicles: "",
        vehicleTypes: [] as string[],
        serviceStates: "",
        servicePincodes: "",
        supportedTypes: ["standard"] as string[],
        baseFare: "99",
        perKgRate: "10",
        eta: "3-5 days",
        webhookUrl: "",
        features: [] as string[],
        featureInput: "",
        email: "",
        phone: "",
        password: "",
        confirmPassword: "",
    });

    const handleChange = (field: string, value: any) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
    };

    const toggleArrayField = (field: string, value: string) => {
        setFormData((prev) => {
            const arr = (prev as any)[field] as string[];
            return {
                ...prev,
                [field]: arr.includes(value)
                    ? arr.filter((v) => v !== value)
                    : [...arr, value],
            };
        });
    };

    const addFeature = () => {
        if (formData.featureInput.trim()) {
            handleChange("features", [...formData.features, formData.featureInput.trim()]);
            handleChange("featureInput", "");
        }
    };

    const removeFeature = (index: number) => {
        handleChange("features", formData.features.filter((_, i) => i !== index));
    };

    const canProceed = () => {
        switch (step) {
            case 1:
                return formData.businessName && formData.contactPerson;
            case 2:
                return formData.supportedTypes.length > 0;
            case 3:
                return true;
            case 4:
                return (
                    formData.email &&
                    formData.phone &&
                    formData.password &&
                    formData.password === formData.confirmPassword &&
                    formData.password.length >= 6 &&
                    acceptTerms
                );
            default:
                return false;
        }
    };

    const handleSubmit = async () => {
        if (!canProceed()) return;
        setIsLoading(true);

        try {
            const body = {
                businessName: formData.businessName,
                contactPerson: formData.contactPerson,
                email: formData.email,
                phone: formData.phone,
                password: formData.password,
                gstin: formData.gstin || undefined,
                panNumber: formData.panNumber || undefined,
                fleetDetails: {
                    totalVehicles: parseInt(formData.totalVehicles) || 0,
                    vehicleTypes: formData.vehicleTypes,
                },
                serviceZones: formData.serviceStates
                    ? formData.serviceStates.split(",").map((s) => ({
                        state: s.trim(),
                        pincodes: formData.servicePincodes
                            ? formData.servicePincodes.split(",").map((p) => p.trim())
                            : [],
                    }))
                    : [],
                supportedTypes: formData.supportedTypes,
                baseFare: parseFloat(formData.baseFare) || 99,
                perKgRate: parseFloat(formData.perKgRate) || 10,
                webhookUrl: formData.webhookUrl || undefined,
                features: formData.features,
            };

            const res = await fetch(`${API_BASE_URL}/api/carrier-auth/register`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.message || "Registration failed");
            }

            setSubmitted(true);
            toast({ title: "Registration Submitted!", description: data.message });
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message,
                variant: "destructive",
            });
        } finally {
            setIsLoading(false);
        }
    };

    if (submitted) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-indigo-50">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center"
                >
                    <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <CheckCircle className="h-10 w-10 text-green-600" />
                    </div>
                    <h2 className="text-2xl font-bold mb-2">Registration Submitted!</h2>
                    <p className="text-muted-foreground mb-6">
                        Your carrier registration is under review. Our team will review your
                        application and notify you once approved. This typically takes 1-2
                        business days.
                    </p>
                    <div className="space-y-3">
                        <Button onClick={() => navigate("/carrier/login")} className="w-full">
                            Go to Login
                        </Button>
                        <Button variant="outline" onClick={() => navigate("/")} className="w-full">
                            Back to Home
                        </Button>
                    </div>
                </motion.div>
            </div>
        );
    }

    return (
        <div
            className="min-h-screen flex"
            style={{
                backgroundImage: `url(${authBg})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
            }}
        >
            <div className="flex-1 flex items-center justify-center p-4">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white/95 backdrop-blur-lg rounded-2xl shadow-2xl p-8 w-full max-w-lg"
                >
                    {/* Header */}
                    <div className="flex items-center gap-3 mb-6">
                        <Link to="/">
                            <Button variant="ghost" size="icon" className="rounded-full">
                                <ArrowLeft className="h-5 w-5" />
                            </Button>
                        </Link>
                        <img src={logo} alt="FastFare" className="h-8" />
                        <div>
                            <h1 className="text-xl font-bold">Carrier Registration</h1>
                            <p className="text-sm text-muted-foreground">
                                Join FastFare as a logistics carrier
                            </p>
                        </div>
                    </div>

                    {/* Step Indicators */}
                    <div className="flex items-center gap-2 mb-8">
                        {steps.map((s, i) => (
                            <div key={s.id} className="flex-1 flex items-center gap-1">
                                <div
                                    className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${step > s.id
                                            ? "bg-green-500 text-white"
                                            : step === s.id
                                                ? "bg-primary text-white"
                                                : "bg-gray-200 text-gray-500"
                                        }`}
                                >
                                    {step > s.id ? <CheckCircle className="h-4 w-4" /> : s.id}
                                </div>
                                {i < steps.length - 1 && (
                                    <div
                                        className={`flex-1 h-0.5 ${step > s.id ? "bg-green-500" : "bg-gray-200"
                                            }`}
                                    />
                                )}
                            </div>
                        ))}
                    </div>

                    <AnimatePresence mode="wait">
                        <motion.div
                            key={step}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="space-y-4"
                        >
                            {/* Step 1: Business Info */}
                            {step === 1 && (
                                <>
                                    <h2 className="text-lg font-semibold flex items-center gap-2">
                                        <Building2 className="h-5 w-5 text-primary" />
                                        Business Information
                                    </h2>
                                    <div className="space-y-3">
                                        <div>
                                            <Label>Business Name *</Label>
                                            <Input
                                                value={formData.businessName}
                                                onChange={(e) => handleChange("businessName", e.target.value)}
                                                placeholder="e.g. Balaji Logistics"
                                            />
                                        </div>
                                        <div>
                                            <Label>Contact Person *</Label>
                                            <Input
                                                value={formData.contactPerson}
                                                onChange={(e) => handleChange("contactPerson", e.target.value)}
                                                placeholder="Full name"
                                            />
                                        </div>
                                        <div>
                                            <Label>GSTIN (Optional)</Label>
                                            <Input
                                                value={formData.gstin}
                                                onChange={(e) => handleChange("gstin", e.target.value.toUpperCase())}
                                                placeholder="22AAAAA0000A1Z5"
                                                maxLength={15}
                                            />
                                        </div>
                                        <div>
                                            <Label>PAN Number (Optional)</Label>
                                            <Input
                                                value={formData.panNumber}
                                                onChange={(e) => handleChange("panNumber", e.target.value.toUpperCase())}
                                                placeholder="ABCDE1234F"
                                                maxLength={10}
                                            />
                                        </div>
                                    </div>
                                </>
                            )}

                            {/* Step 2: Fleet & Service Zones */}
                            {step === 2 && (
                                <>
                                    <h2 className="text-lg font-semibold flex items-center gap-2">
                                        <Truck className="h-5 w-5 text-primary" />
                                        Fleet & Service Zones
                                    </h2>
                                    <div className="space-y-4">
                                        <div>
                                            <Label>Total Vehicles</Label>
                                            <Input
                                                type="number"
                                                value={formData.totalVehicles}
                                                onChange={(e) => handleChange("totalVehicles", e.target.value)}
                                                placeholder="e.g. 15"
                                            />
                                        </div>
                                        <div>
                                            <Label className="mb-2 block">Vehicle Types</Label>
                                            <div className="flex flex-wrap gap-2">
                                                {vehicleTypeOptions.map((v) => (
                                                    <button
                                                        key={v.id}
                                                        type="button"
                                                        onClick={() => toggleArrayField("vehicleTypes", v.id)}
                                                        className={`px-3 py-1.5 rounded-full text-sm border transition-all ${formData.vehicleTypes.includes(v.id)
                                                                ? "bg-primary text-white border-primary"
                                                                : "bg-white text-gray-600 border-gray-300 hover:border-primary"
                                                            }`}
                                                    >
                                                        {v.label}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                        <div>
                                            <Label>Service States (comma-separated)</Label>
                                            <Input
                                                value={formData.serviceStates}
                                                onChange={(e) => handleChange("serviceStates", e.target.value)}
                                                placeholder="e.g. Maharashtra, Gujarat, Rajasthan"
                                            />
                                        </div>
                                        <div>
                                            <Label>Service Pincodes (comma-separated, optional)</Label>
                                            <Input
                                                value={formData.servicePincodes}
                                                onChange={(e) => handleChange("servicePincodes", e.target.value)}
                                                placeholder="e.g. 400001, 400002, 110001-110099"
                                            />
                                        </div>
                                        <div>
                                            <Label className="mb-2 block">Supported Shipment Types *</Label>
                                            <div className="flex flex-wrap gap-2">
                                                {shipmentTypeOptions.map((s) => (
                                                    <button
                                                        key={s.id}
                                                        type="button"
                                                        onClick={() => toggleArrayField("supportedTypes", s.id)}
                                                        className={`px-3 py-1.5 rounded-full text-sm border transition-all ${formData.supportedTypes.includes(s.id)
                                                                ? "bg-primary text-white border-primary"
                                                                : "bg-white text-gray-600 border-gray-300 hover:border-primary"
                                                            }`}
                                                    >
                                                        {s.label}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </>
                            )}

                            {/* Step 3: Pricing & API */}
                            {step === 3 && (
                                <>
                                    <h2 className="text-lg font-semibold flex items-center gap-2">
                                        <Zap className="h-5 w-5 text-primary" />
                                        Pricing & Integration
                                    </h2>
                                    <div className="space-y-4">
                                        <div className="grid grid-cols-2 gap-3">
                                            <div>
                                                <Label>Base Fare (₹)</Label>
                                                <Input
                                                    type="number"
                                                    value={formData.baseFare}
                                                    onChange={(e) => handleChange("baseFare", e.target.value)}
                                                    placeholder="99"
                                                />
                                            </div>
                                            <div>
                                                <Label>Per KG Rate (₹)</Label>
                                                <Input
                                                    type="number"
                                                    value={formData.perKgRate}
                                                    onChange={(e) => handleChange("perKgRate", e.target.value)}
                                                    placeholder="10"
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <Label>Estimated Delivery Time</Label>
                                            <Input
                                                value={formData.eta}
                                                onChange={(e) => handleChange("eta", e.target.value)}
                                                placeholder="e.g. 3-5 days"
                                            />
                                        </div>
                                        <div>
                                            <Label>Webhook URL (Optional)</Label>
                                            <div className="flex items-center gap-2">
                                                <Globe className="h-4 w-4 text-muted-foreground" />
                                                <Input
                                                    value={formData.webhookUrl}
                                                    onChange={(e) => handleChange("webhookUrl", e.target.value)}
                                                    placeholder="https://your-api.com/webhook"
                                                />
                                            </div>
                                            <p className="text-xs text-muted-foreground mt-1">
                                                We'll send shipment events to this URL in real-time
                                            </p>
                                        </div>
                                        <div>
                                            <Label>Features / Highlights</Label>
                                            <div className="flex gap-2">
                                                <Input
                                                    value={formData.featureInput}
                                                    onChange={(e) => handleChange("featureInput", e.target.value)}
                                                    placeholder="e.g. Real-time tracking"
                                                    onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addFeature())}
                                                />
                                                <Button type="button" size="icon" variant="outline" onClick={addFeature}>
                                                    <Plus className="h-4 w-4" />
                                                </Button>
                                            </div>
                                            {formData.features.length > 0 && (
                                                <div className="flex flex-wrap gap-2 mt-2">
                                                    {formData.features.map((f, i) => (
                                                        <span
                                                            key={i}
                                                            className="bg-primary/10 text-primary text-xs px-2 py-1 rounded-full flex items-center gap-1"
                                                        >
                                                            {f}
                                                            <button onClick={() => removeFeature(i)}>
                                                                <X className="h-3 w-3" />
                                                            </button>
                                                        </span>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </>
                            )}

                            {/* Step 4: Credentials */}
                            {step === 4 && (
                                <>
                                    <h2 className="text-lg font-semibold flex items-center gap-2">
                                        <Shield className="h-5 w-5 text-primary" />
                                        Login Credentials
                                    </h2>
                                    <div className="space-y-3">
                                        <div>
                                            <Label>Email *</Label>
                                            <div className="relative">
                                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                                <Input
                                                    type="email"
                                                    className="pl-10"
                                                    value={formData.email}
                                                    onChange={(e) => handleChange("email", e.target.value)}
                                                    placeholder="carrier@example.com"
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <Label>Phone *</Label>
                                            <div className="relative">
                                                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                                <Input
                                                    className="pl-10"
                                                    value={formData.phone}
                                                    onChange={(e) => handleChange("phone", e.target.value)}
                                                    placeholder="9876543210"
                                                    maxLength={10}
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <Label>Password *</Label>
                                            <div className="relative">
                                                <Input
                                                    type={showPassword ? "text" : "password"}
                                                    value={formData.password}
                                                    onChange={(e) => handleChange("password", e.target.value)}
                                                    placeholder="Min 6 characters"
                                                />
                                                <button
                                                    type="button"
                                                    className="absolute right-3 top-1/2 -translate-y-1/2"
                                                    onClick={() => setShowPassword(!showPassword)}
                                                >
                                                    {showPassword ? (
                                                        <EyeOff className="h-4 w-4 text-muted-foreground" />
                                                    ) : (
                                                        <Eye className="h-4 w-4 text-muted-foreground" />
                                                    )}
                                                </button>
                                            </div>
                                        </div>
                                        <div>
                                            <Label>Confirm Password *</Label>
                                            <Input
                                                type="password"
                                                value={formData.confirmPassword}
                                                onChange={(e) => handleChange("confirmPassword", e.target.value)}
                                                placeholder="Re-enter password"
                                            />
                                            {formData.confirmPassword && formData.password !== formData.confirmPassword && (
                                                <p className="text-xs text-red-500 mt-1">Passwords don't match</p>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-2 pt-2">
                                            <Checkbox
                                                id="terms"
                                                checked={acceptTerms}
                                                onCheckedChange={(v) => setAcceptTerms(v as boolean)}
                                            />
                                            <label htmlFor="terms" className="text-sm text-muted-foreground">
                                                I agree to the{" "}
                                                <Link to="/terms" className="text-primary underline">
                                                    Terms of Service
                                                </Link>{" "}
                                                and{" "}
                                                <Link to="/privacy" className="text-primary underline">
                                                    Privacy Policy
                                                </Link>
                                            </label>
                                        </div>
                                    </div>
                                </>
                            )}
                        </motion.div>
                    </AnimatePresence>

                    {/* Navigation Buttons */}
                    <div className="flex items-center justify-between mt-8">
                        {step > 1 ? (
                            <Button variant="outline" onClick={() => setStep(step - 1)}>
                                Back
                            </Button>
                        ) : (
                            <div />
                        )}
                        {step < 4 ? (
                            <Button onClick={() => setStep(step + 1)} disabled={!canProceed()}>
                                Next
                            </Button>
                        ) : (
                            <Button onClick={handleSubmit} disabled={!canProceed() || isLoading}>
                                {isLoading ? (
                                    <>
                                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                        Submitting...
                                    </>
                                ) : (
                                    "Submit Registration"
                                )}
                            </Button>
                        )}
                    </div>

                    {/* Login Link */}
                    <p className="text-center text-sm text-muted-foreground mt-4">
                        Already registered?{" "}
                        <Link to="/carrier/login" className="text-primary font-medium">
                            Login here
                        </Link>
                    </p>
                </motion.div>
            </div>
        </div>
    );
};

export default RegisterCarrier;
