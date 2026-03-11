import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { toast } from "sonner";
import { MapPin, Truck, Loader2 } from "lucide-react";
import { API_BASE_URL } from "@/config";

const DriverLogin = () => {
    const navigate = useNavigate();
    const [driverId, setDriverId] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!driverId || !password) {
            toast.error("Please enter both Driver ID and Password");
            return;
        }

        setLoading(true);
        try {
            const res = await fetch(`${API_BASE_URL}/api/driver/login`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ driver_id: driverId, password }),
            });

            const data = await res.json();

            if (res.ok && data.success) {
                // Backend returns flat fields: driver_id, driver_name, phone
                // Normalize into a driver_info object for DriverDashboard compatibility
                const driverInfo = data.driver || {
                    driver_id: data.driver_id,
                    name: data.driver_name || data.name,
                    phone: data.phone,
                    partner_id: data.partner_id
                };
                // Store auth data before navigating
                localStorage.setItem("driver_token", data.token);
                localStorage.setItem("driver_info", JSON.stringify(driverInfo));
                // Store driver_id explicitly for easy socket usage
                if (driverInfo?.driver_id) {
                    localStorage.setItem("driver_id", driverInfo.driver_id);
                }
                toast.success("Login successful! Redirecting...");
                // Small delay ensures localStorage is committed and toast fires
                // before React Router navigates away
                setTimeout(() => {
                    navigate("/driver-app/dashboard", { replace: true });
                }, 300);
            } else {
                toast.error(data.message || "Invalid credentials. Check your Driver ID and password.");
            }
        } catch (error) {
            console.error("Driver login error:", error);
            toast.error("Network error. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center p-4">
            <div className="w-full max-w-md space-y-8">
                <div className="flex flex-col items-center mb-8">
                    <div className="w-16 h-16 bg-blue-600 rounded-[1.5rem] flex items-center justify-center text-white mb-4 shadow-lg shadow-blue-500/30">
                        <Truck className="h-8 w-8" />
                    </div>
                    <h1 className="text-3xl font-bold tracking-tight text-gray-900">FastFare Driver </h1>
                    <p className="text-muted-foreground mt-2">Sign in to start your deliveries</p>
                </div>

                <Card className="border-0 shadow-xl rounded-2xl overflow-hidden">
                    <div className="h-2 bg-blue-600 w-full" />
                    <form onSubmit={handleLogin}>
                        <CardHeader className="space-y-1 pb-4">
                            <CardTitle className="text-xl">Welcome Back</CardTitle>
                            <CardDescription>
                                Enter your assigned Driver ID and password
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="driverId">Driver ID <span className="text-red-500">*</span></Label>
                                <Input
                                    id="driverId"
                                    placeholder="e.g. DRV-001"
                                    value={driverId}
                                    onChange={(e) => setDriverId(e.target.value)}
                                    className="h-12 bg-gray-50 border-gray-200"
                                    disabled={loading}
                                />
                            </div>
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <Label htmlFor="password">Password <span className="text-red-500">*</span></Label>
                                </div>
                                <Input
                                    id="password"
                                    type="password"
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="h-12 bg-gray-50 border-gray-200"
                                    disabled={loading}
                                />
                            </div>
                        </CardContent>
                        <CardFooter className="flex flex-col space-y-4 pb-6 mt-2">
                            <Button
                                type="submit"
                                className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-base"
                                disabled={loading}
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                        Signing in...
                                    </>
                                ) : (
                                    "Sign In"
                                )}
                            </Button>
                            <p className="text-sm text-center text-muted-foreground">
                                <MapPin className="inline-block h-3 w-3 mr-1 mb-0.5" />
                                This app tracks your location during active shifts.
                            </p>
                        </CardFooter>
                    </form>
                </Card>
            </div>
        </div>
    );
};

export default DriverLogin;
