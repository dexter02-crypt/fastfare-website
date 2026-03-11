import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { toast } from "sonner";
import { Truck, Loader2, ArrowLeft, Shield } from "lucide-react";
import { authApi } from "@/lib/api";

const PartnerLogin = () => {
    const navigate = useNavigate();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);

    // If already logged in as a partner, redirect to dashboard
    useEffect(() => {
        const user = authApi.getCurrentUser();
        if (user && authApi.isAuthenticated()) {
            navigate("/dashboard");
        }
    }, [navigate]);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email || !password) {
            toast.error("Please enter both email and password");
            return;
        }

        setLoading(true);
        try {
            const result = await authApi.login(email, password);
            if (result.success) {
                toast.success("Welcome back, Partner!");
                navigate("/dashboard");
            } else {
                toast.error(result.error || "Invalid credentials. Try partner@fastfare.com / Partner@123");
            }
        } catch (error) {
            console.error("Partner login error:", error);
            toast.error("Network error. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 to-blue-950 flex flex-col justify-center items-center p-4">
            <Link
                to="/"
                className="absolute top-6 left-6 flex items-center gap-2 text-white/70 hover:text-white transition-colors text-sm"
            >
                <ArrowLeft className="h-4 w-4" /> Back to Home
            </Link>

            <div className="w-full max-w-md space-y-8">
                <div className="flex flex-col items-center mb-8">
                    <div className="w-20 h-20 bg-blue-600 rounded-[2rem] flex items-center justify-center text-white mb-4 shadow-2xl shadow-blue-500/40 border-4 border-blue-400/20">
                        <Truck className="h-10 w-10" />
                    </div>
                    <h1 className="text-3xl font-bold tracking-tight text-white">FastFare Partner</h1>
                    <p className="text-blue-200/70 mt-2">Logistics Partner Portal</p>
                </div>

                <Card className="border-0 shadow-2xl rounded-2xl overflow-hidden bg-white">
                    <div className="h-1.5 bg-gradient-to-r from-blue-500 to-indigo-600 w-full" />
                    <form onSubmit={handleLogin}>
                        <CardHeader className="space-y-1 pb-4">
                            <CardTitle className="text-xl flex items-center gap-2">
                                <Shield className="h-5 w-5 text-blue-600" />
                                Partner Sign In
                            </CardTitle>
                            <CardDescription>
                                Access your partner dashboard and manage operations
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="email">Email Address</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="partner@fastfare.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="h-12 bg-gray-50 border-gray-200"
                                    disabled={loading}
                                    autoComplete="email"
                                />
                            </div>
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <Label htmlFor="password">Password</Label>
                                    <Link
                                        to="/forgot-password"
                                        className="text-xs text-blue-600 hover:underline"
                                    >
                                        Forgot password?
                                    </Link>
                                </div>
                                <Input
                                    id="password"
                                    type="password"
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="h-12 bg-gray-50 border-gray-200"
                                    disabled={loading}
                                    autoComplete="current-password"
                                />
                            </div>
                        </CardContent>
                        <CardFooter className="flex flex-col space-y-3 pb-6 mt-2">
                            <Button
                                type="submit"
                                className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-base font-semibold"
                                disabled={loading}
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                        Signing in...
                                    </>
                                ) : (
                                    "Sign In to Partner Portal"
                                )}
                            </Button>
                            <p className="text-xs text-center text-muted-foreground">
                                Not a partner?{" "}
                                <Link to="/login" className="text-blue-600 hover:underline font-medium">
                                    User Login
                                </Link>
                                {" "}·{" "}
                                <Link to="/register/partner" className="text-blue-600 hover:underline font-medium">
                                    Apply as Partner
                                </Link>
                            </p>
                        </CardFooter>
                    </form>
                </Card>
            </div>
        </div>
    );
};

export default PartnerLogin;
