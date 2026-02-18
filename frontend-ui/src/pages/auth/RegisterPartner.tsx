import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { API_BASE_URL } from "@/config";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Eye, EyeOff, ArrowLeft, Truck, Mail, Phone, User, Shield, MapPin, CreditCard, Check, X, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import logo from "@/assets/logo.png";
import authBg from "@/assets/auth-bg.png";

const RegisterPartner = () => {
    const navigate = useNavigate();
    const { toast } = useToast();
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [acceptTerms, setAcceptTerms] = useState(false);
    const [gstinVerifying, setGstinVerifying] = useState(false);
    const [gstinVerified, setGstinVerified] = useState(false);
    const [gstinError, setGstinError] = useState("");
    const [gstinData, setGstinData] = useState<any>(null);
    const [formData, setFormData] = useState({
        businessName: "",
        contactPerson: "",
        email: "",
        phone: "",
        password: "",
        confirmPassword: "",
        city: "",
        gstin: "",
    });

    const verifyGstin = async () => {
        if (formData.gstin.length !== 15) {
            setGstinError("GSTIN must be exactly 15 characters");
            return;
        }
        setGstinVerifying(true);
        setGstinError("");
        setGstinVerified(false);
        setGstinData(null);
        try {
            const response = await fetch(`${API_BASE_URL}/api/gstin/verify`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ gstin: formData.gstin }),
            });
            const data = await response.json();
            if (data.success && data.valid) {
                setGstinVerified(true);
                setGstinData(data.data);
                if (data.data.businessName && !formData.businessName) {
                    setFormData(prev => ({ ...prev, businessName: data.data.businessName }));
                }
                toast({ title: "GSTIN Verified ✅", description: `${data.data.legalName || data.data.businessName} — ${data.data.status}` });
            } else {
                setGstinError(data.error || "Invalid GSTIN");
                toast({ title: "GSTIN Verification Failed", description: data.error || "Could not verify this GSTIN", variant: "destructive" });
            }
        } catch (err) {
            setGstinError("Verification service unavailable. Please try again.");
        } finally {
            setGstinVerifying(false);
        }
    };

    const getPasswordStrength = (password: string) => {
        let strength = 0;
        if (password.length >= 8) strength++;
        if (password.length >= 12) strength++;
        if (/[A-Z]/.test(password)) strength++;
        if (/[a-z]/.test(password)) strength++;
        if (/[0-9]/.test(password)) strength++;
        if (/[^A-Za-z0-9]/.test(password)) strength++;
        return strength;
    };

    const passwordStrength = getPasswordStrength(formData.password);
    const passwordRequirements = [
        { label: "At least 8 characters", met: formData.password.length >= 8 },
        { label: "Uppercase letter", met: /[A-Z]/.test(formData.password) },
        { label: "Lowercase letter", met: /[a-z]/.test(formData.password) },
        { label: "Number", met: /[0-9]/.test(formData.password) },
        { label: "Special character", met: /[^A-Za-z0-9]/.test(formData.password) },
    ];

    const getStrengthColor = () => {
        if (passwordStrength <= 2) return "bg-red-500";
        if (passwordStrength <= 4) return "bg-yellow-500";
        return "bg-green-500";
    };

    const getStrengthText = () => {
        if (passwordStrength <= 2) return "Weak";
        if (passwordStrength <= 4) return "Medium";
        return "Strong";
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (formData.phone.length !== 10 || !/^[6-9]\d{9}$/.test(formData.phone)) {
            toast({
                title: "Invalid Phone Number",
                description: "Please enter a valid 10-digit mobile number starting with 6, 7, 8, or 9",
                variant: "destructive",
            });
            return;
        }

        if (formData.password !== formData.confirmPassword) {
            toast({
                title: "Password Mismatch",
                description: "Passwords do not match",
                variant: "destructive",
            });
            return;
        }

        if (passwordStrength < 3) {
            toast({
                title: "Weak Password",
                description: "Please create a stronger password",
                variant: "destructive",
            });
            return;
        }

        if (!acceptTerms) {
            toast({
                title: "Terms Required",
                description: "Please accept the terms and conditions",
                variant: "destructive",
            });
            return;
        }

        // Generate a placeholder GSTIN if not provided
        const gstin = formData.gstin || `99${formData.phone.slice(0, 5)}00000A1Z${Math.floor(Math.random() * 10)}`;

        // ⚠️ TODO: RE-ENABLE email verification once domain email propagation is complete
        // navigate("/verify-email", {
        //     state: {
        //         registrationData: { ... },
        //     },
        // });

        // Direct registration without email verification (temporary)
        setIsLoading(true);
        try {
            const registrationData = {
                businessName: formData.businessName,
                gstin: gstin,
                businessType: "logistics",
                contactPerson: formData.contactPerson,
                email: formData.email,
                phone: formData.phone,
                password: formData.password,
                role: "shipment_partner",
            };

            const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(registrationData),
            });
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Registration failed");
            }

            // Store token and user info
            localStorage.setItem("token", data.token);
            localStorage.setItem("user", JSON.stringify(data.user));
            localStorage.setItem("kycStatus", "pending");
            localStorage.setItem("kycSkippedAt", new Date().toISOString());

            toast({
                title: "Registration Successful! 🎉",
                description: "Welcome to FastFare!",
            });

            navigate("/dashboard", { replace: true });
        } catch (err) {
            const msg = err instanceof Error ? err.message : "Registration failed";
            toast({ title: "Error", description: msg, variant: "destructive" });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex">
            {/* Left Side - Full Image */}
            <div className="hidden lg:flex lg:w-1/2 relative">
                <img
                    src={authBg}
                    alt="Logistics"
                    className="absolute inset-0 w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0a1628]/95 via-[#0a1628]/40 to-[#0a1628]/20" />

                {/* Logo */}
                <div className="absolute top-8 left-8 z-10">
                    <Link to="/" className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center">
                            <svg viewBox="0 0 24 24" className="w-6 h-6 text-primary-foreground" fill="currentColor">
                                <path d="M20 8h-3V4H3c-1.1 0-2 .9-2 2v11h2c0 1.66 1.34 3 3 3s3-1.34 3-3h6c0 1.66 1.34 3 3 3s3-1.34 3-3h2v-5l-3-4zM6 18.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm13.5-9l1.96 2.5H17V9.5h2.5zm-1.5 9c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z" />
                            </svg>
                        </div>
                        <span className="text-xl font-semibold text-white">FastFare</span>
                    </Link>
                </div>

                {/* Feature List */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="absolute bottom-12 left-8 right-8 z-10"
                >
                    <h2 className="text-2xl font-bold text-white mb-4">Become a Delivery Partner</h2>
                    <ul className="space-y-3 text-white/80">
                        <li className="flex items-center gap-2">
                            <Truck className="h-5 w-5 text-green-400" />
                            Flexible working hours
                        </li>
                        <li className="flex items-center gap-2">
                            <CreditCard className="h-5 w-5 text-blue-400" />
                            Weekly payouts with bonuses
                        </li>
                        <li className="flex items-center gap-2">
                            <Shield className="h-5 w-5 text-purple-400" />
                            Insurance & safety coverage
                        </li>
                    </ul>
                </motion.div>
            </div>

            {/* Right Side - Form */}
            <div className="flex-1 flex items-center justify-center p-8 bg-background overflow-y-auto">
                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5 }}
                    className="w-full max-w-md"
                >
                    {/* Back Button */}
                    <Button
                        variant="ghost"
                        className="gap-2 mb-4"
                        onClick={() => navigate("/register")}
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Back
                    </Button>

                    {/* Mobile Logo */}
                    <div className="lg:hidden mb-6">
                        <Link to="/">
                            <img src={logo} alt="FastFare" className="h-10 w-auto" />
                        </Link>
                    </div>

                    <h1 className="text-2xl font-bold mb-2">Become a Delivery Partner</h1>
                    <p className="text-muted-foreground mb-6">
                        Join FastFare's delivery network and start earning
                    </p>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* Business Name */}
                        <div className="space-y-2">
                            <Label htmlFor="businessName">Business / Vehicle Owner Name</Label>
                            <div className="relative">
                                <Truck className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    id="businessName"
                                    placeholder="Enter business or owner name"
                                    value={formData.businessName}
                                    onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                                    className="pl-10"
                                    required
                                />
                            </div>
                        </div>

                        {/* Full Name */}
                        <div className="space-y-2">
                            <Label htmlFor="contactPerson">Contact Person</Label>
                            <div className="relative">
                                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    id="contactPerson"
                                    placeholder="Enter contact person name"
                                    value={formData.contactPerson}
                                    onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                                    className="pl-10"
                                    required
                                />
                            </div>
                        </div>

                        {/* Email & Phone */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="email">Email</Label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        id="email"
                                        type="email"
                                        placeholder="email@example.com"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        className="pl-10"
                                        required
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="phone">Phone</Label>
                                <div className="relative">
                                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        id="phone"
                                        type="tel"
                                        placeholder="9876543210"
                                        value={formData.phone}
                                        onChange={(e) => {
                                            const value = e.target.value.replace(/\D/g, '').slice(0, 10);
                                            setFormData({ ...formData, phone: value });
                                        }}
                                        className="pl-10"
                                        required
                                    />
                                </div>
                                {formData.phone.length > 0 && formData.phone.length !== 10 && (
                                    <p className="text-xs text-red-500">Must be exactly 10 digits</p>
                                )}
                            </div>
                        </div>

                        {/* City */}
                        <div className="space-y-2">
                            <Label htmlFor="city">City</Label>
                            <div className="relative">
                                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    id="city"
                                    placeholder="Enter your city"
                                    value={formData.city}
                                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                                    className="pl-10"
                                    required
                                />
                            </div>
                        </div>

                        {/* GSTIN (Optional) with Verification */}
                        <div className="space-y-2">
                            <Label htmlFor="gstin">GSTIN (Optional)</Label>
                            <div className="flex gap-2">
                                <div className="relative flex-1">
                                    <Input
                                        id="gstin"
                                        placeholder="22AAAAA0000A1Z5"
                                        value={formData.gstin}
                                        onChange={(e) => {
                                            const val = e.target.value.toUpperCase();
                                            setFormData({ ...formData, gstin: val });
                                            if (gstinVerified) { setGstinVerified(false); setGstinData(null); }
                                            setGstinError("");
                                        }}
                                        maxLength={15}
                                        className={`font-mono ${gstinVerified ? 'border-green-500 pr-10' : gstinError ? 'border-red-500' : ''}`}
                                    />
                                    {gstinVerified && <Check className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-green-500" />}
                                </div>
                                <Button
                                    type="button"
                                    variant={gstinVerified ? "outline" : "default"}
                                    onClick={verifyGstin}
                                    disabled={formData.gstin.length !== 15 || gstinVerifying}
                                    className={gstinVerified ? "border-green-500 text-green-600 hover:bg-green-50" : ""}
                                >
                                    {gstinVerifying ? (<><Loader2 className="h-4 w-4 animate-spin mr-1" /> Verifying...</>) : gstinVerified ? (<><Check className="h-4 w-4 mr-1" /> Verified</>) : (<><Shield className="h-4 w-4 mr-1" /> Verify</>)}
                                </Button>
                            </div>
                            {gstinError && <p className="text-xs text-red-500 flex items-center gap-1"><X className="h-3 w-3" /> {gstinError}</p>}
                            {!gstinVerified && !gstinError && <p className="text-xs text-muted-foreground">Required for tax invoicing. Click Verify to validate.</p>}
                            {gstinVerified && gstinData && (
                                <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded-lg space-y-1">
                                    <p className="text-sm font-medium text-green-800 flex items-center gap-1.5"><Check className="h-4 w-4" /> GSTIN Verified</p>
                                    <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-green-700">
                                        <div><span className="text-green-600">Legal Name:</span><p className="font-medium">{gstinData.legalName || '—'}</p></div>
                                        <div><span className="text-green-600">Trade Name:</span><p className="font-medium">{gstinData.businessName || '—'}</p></div>
                                        <div><span className="text-green-600">Status:</span><p className="font-medium">{gstinData.status || '—'}</p></div>
                                        <div><span className="text-green-600">Reg. Date:</span><p className="font-medium">{gstinData.registrationDate || '—'}</p></div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Password */}
                        <div className="space-y-2">
                            <Label htmlFor="password">Password</Label>
                            <div className="relative">
                                <Input
                                    id="password"
                                    type={showPassword ? "text" : "password"}
                                    placeholder="Create a strong password"
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                    className="pr-10"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                >
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                            {formData.password && (
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2">
                                        <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                                            <div className={`h-full transition-all duration-300 ${getStrengthColor()}`} style={{ width: `${(passwordStrength / 6) * 100}%` }} />
                                        </div>
                                        <span className={`text-xs font-medium ${passwordStrength <= 2 ? 'text-red-500' : passwordStrength <= 4 ? 'text-yellow-500' : 'text-green-500'}`}>
                                            {getStrengthText()}
                                        </span>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2">
                                        {passwordRequirements.map((req, idx) => (
                                            <div key={idx} className="flex items-center gap-1.5 text-xs">
                                                {req.met ? <Check className="h-3 w-3 text-green-500" /> : <X className="h-3 w-3 text-gray-400" />}
                                                <span className={req.met ? 'text-green-600' : 'text-muted-foreground'}>{req.label}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Confirm Password */}
                        <div className="space-y-2">
                            <Label htmlFor="confirmPassword">Confirm Password</Label>
                            <Input
                                id="confirmPassword"
                                type="password"
                                placeholder="Confirm your password"
                                value={formData.confirmPassword}
                                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                                required
                            />
                            {formData.confirmPassword && formData.password !== formData.confirmPassword && (
                                <p className="text-xs text-red-500">Passwords do not match</p>
                            )}
                        </div>

                        {/* Terms */}
                        <div className="flex items-start gap-2">
                            <Checkbox
                                id="terms"
                                checked={acceptTerms}
                                onCheckedChange={(checked) => setAcceptTerms(checked as boolean)}
                            />
                            <Label htmlFor="terms" className="text-sm font-normal leading-snug">
                                I agree to the{" "}
                                <Link to="/terms" className="text-primary hover:underline">
                                    Terms of Service
                                </Link>
                                ,{" "}
                                <Link to="/privacy" className="text-primary hover:underline">
                                    Privacy Policy
                                </Link>
                                {" "}and{" "}
                                <Link to="/partner-agreement" className="text-primary hover:underline">
                                    Partner Agreement
                                </Link>
                            </Label>
                        </div>

                        <Button
                            type="submit"
                            className="w-full gradient-primary text-primary-foreground hover:opacity-90"
                            size="lg"
                            disabled={isLoading}
                        >
                            {isLoading ? "Creating Account..." : "Become a Partner"}
                        </Button>
                    </form>

                    <p className="text-center text-sm text-muted-foreground mt-6">
                        Already have an account?{" "}
                        <Link to="/login" className="text-primary font-medium hover:underline">
                            Sign in
                        </Link>
                    </p>
                </motion.div>
            </div>
        </div>
    );
};

export default RegisterPartner;
