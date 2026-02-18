import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { API_BASE_URL } from "@/config";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff, ArrowLeft, Mail, Loader2, Truck } from "lucide-react";
import { motion } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import logo from "@/assets/logo.png";
import authBg from "@/assets/auth-bg.png";

const CarrierLogin = () => {
    const navigate = useNavigate();
    const { toast } = useToast();
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState({ email: "", password: "" });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.email || !formData.password) return;
        setIsLoading(true);

        try {
            const res = await fetch(`${API_BASE_URL}/api/carrier-auth/login`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            });
            const data = await res.json();

            if (!res.ok) throw new Error(data.message);

            localStorage.setItem("carrierToken", data.token);
            localStorage.setItem("carrierData", JSON.stringify(data.carrier));
            toast({ title: "Welcome back!", description: `Logged in as ${data.carrier.businessName}` });
            navigate("/carrier/dashboard");
        } catch (error: any) {
            toast({ title: "Login Failed", description: error.message, variant: "destructive" });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex" style={{ backgroundImage: `url(${authBg})`, backgroundSize: "cover" }}>
            <div className="flex-1 flex items-center justify-center p-4">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white/95 backdrop-blur-lg rounded-2xl shadow-2xl p-8 w-full max-w-md"
                >
                    <div className="flex items-center gap-3 mb-6">
                        <Link to="/"><Button variant="ghost" size="icon" className="rounded-full"><ArrowLeft className="h-5 w-5" /></Button></Link>
                        <img src={logo} alt="FastFare" className="h-8" />
                        <div>
                            <h1 className="text-xl font-bold">Carrier Login</h1>
                            <p className="text-sm text-muted-foreground">Access your carrier dashboard</p>
                        </div>
                    </div>

                    <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Truck className="h-8 w-8 text-blue-600" />
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <Label>Email or Phone</Label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    className="pl-10"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    placeholder="carrier@example.com"
                                />
                            </div>
                        </div>
                        <div>
                            <Label>Password</Label>
                            <div className="relative">
                                <Input
                                    type={showPassword ? "text" : "password"}
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                    placeholder="Enter password"
                                />
                                <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2" onClick={() => setShowPassword(!showPassword)}>
                                    {showPassword ? <EyeOff className="h-4 w-4 text-muted-foreground" /> : <Eye className="h-4 w-4 text-muted-foreground" />}
                                </button>
                            </div>
                        </div>
                        <Button type="submit" className="w-full" disabled={isLoading}>
                            {isLoading ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Logging in...</> : "Login"}
                        </Button>
                    </form>

                    <p className="text-center text-sm text-muted-foreground mt-4">
                        Not registered yet?{" "}
                        <Link to="/register/carrier" className="text-primary font-medium">Register as Carrier</Link>
                    </p>
                </motion.div>
            </div>
        </div>
    );
};

export default CarrierLogin;
