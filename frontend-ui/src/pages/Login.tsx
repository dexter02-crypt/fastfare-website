import { API_BASE_URL } from "@/config";

import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { Eye, EyeOff, MessageSquare, User, Truck, Shield, ArrowLeft, Phone, RefreshCw } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import { useWallet } from "@/contexts/WalletContext";
import logo from "@/assets/logo.png";
import authBg from "@/assets/auth-bg.png";

type RoleType = "user" | "shipment_partner" | "admin";
type LoginMode = "password" | "otp";

const roles = [
  { id: "user" as RoleType, label: "User", icon: User, description: "Business Customer" },
  { id: "shipment_partner" as RoleType, label: "Partner", icon: Truck, description: "Delivery Partner" },
  { id: "admin" as RoleType, label: "Admin", icon: Shield, description: "System Admin" },
];

const Login = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { refreshBalance } = useWallet();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedRole, setSelectedRole] = useState<RoleType>("user");
  const [loginMode, setLoginMode] = useState<LoginMode>("password");
  const [otpStep, setOtpStep] = useState<"phone" | "verify">("phone");
  const [otp, setOtp] = useState("");
  const [resendTimer, setResendTimer] = useState(0);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    phone: "",
    remember: false,
  });

  // Timer for OTP resend
  // Timer for OTP resend
  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendTimer]);

  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          role: selectedRole,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Login failed");
      }

      // Store token and user info
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));

      toast({
        title: "Login Successful",
        description: `Welcome back, ${data.user.businessName || data.user.contactPerson}!`,
      });

      await refreshBalance();

      // Route based on role (replace history so back button doesn't go to login)
      if (data.user.role === "admin") {
        navigate("/dashboard", { replace: true });
      } else if (data.user.role === "shipment_partner") {
        navigate("/fleet-tracking", { replace: true });
      } else {
        navigate("/dashboard", { replace: true });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Login failed';
      toast({
        title: "Login Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendOTP = async () => {
    if (!formData.phone || formData.phone.length < 10) {
      toast({
        title: "Invalid Phone Number",
        description: "Please enter a valid 10-digit phone number",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/send-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: formData.phone }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to send OTP");
      }

      setOtpStep("verify");
      setResendTimer(60);

      toast({
        title: "OTP Sent",
        description: data.phone ? `Verification code sent to ${data.phone}` : `Verification code sent to +91 ${formData.phone}`,
      });

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Please try again';
      toast({
        title: "Failed to Send OTP",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };


  const handleVerifyOTP = async () => {
    if (otp.length !== 6) {
      toast({
        title: "Invalid OTP",
        description: "Please enter the 6-digit verification code",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/verify-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: formData.phone,
          otp: otp,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "OTP verification failed");
      }

      // Check if user exists
      if (!data.userExists) {
        toast({
          title: "Phone Verified",
          description: "Please complete registration to continue.",
        });
        navigate("/register");
        return;
      }

      // User exists - login successful
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));

      toast({
        title: "Login Successful",
        description: `Welcome back, ${data.user.businessName || data.user.contactPerson}!`,
      });

      await refreshBalance();

      // Route based on role (replace history so back button doesn't go to login)
      if (data.user.role === "admin") {
        navigate("/dashboard", { replace: true });
      } else if (data.user.role === "shipment_partner") {
        navigate("/fleet-tracking", { replace: true });
      } else {
        navigate("/dashboard", { replace: true });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Verification failed';
      toast({
        title: "Verification Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };


  const handleResendOTP = () => {
    setResendTimer(60);
    setOtp("");
    handleSendOTP();
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const renderPasswordLogin = () => (
    <form onSubmit={handlePasswordLogin} className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="email">Email or Phone Number</Label>
        <Input
          id="email"
          type="text"
          placeholder="Enter your email or phone number"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <div className="relative">
          <Input
            id="password"
            type={showPassword ? "text" : "password"}
            placeholder="Enter your password"
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
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Checkbox
            id="remember"
            checked={formData.remember}
            onCheckedChange={(checked) =>
              setFormData({ ...formData, remember: checked as boolean })
            }
          />
          <Label htmlFor="remember" className="text-sm font-normal">
            Remember me
          </Label>
        </div>
        <Link
          to="/forgot-password"
          className="text-sm text-primary hover:underline"
        >
          Forgot Password?
        </Link>
      </div>

      <Button
        type="submit"
        className="w-full gradient-primary text-primary-foreground hover:opacity-90"
        size="lg"
        disabled={isLoading}
      >
        {isLoading ? "Signing in..." : "Sign In"}
      </Button>
    </form>
  );

  const renderOTPLogin = () => (
    <div className="space-y-5">
      <AnimatePresence mode="wait">
        {otpStep === "phone" ? (
          <motion.div
            key="phone"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="space-y-4"
          >
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <div className="flex gap-2">
                <div className="flex items-center gap-2 px-3 bg-muted rounded-md border border-input min-w-[80px]">
                  <span className="text-lg">🇮🇳</span>
                  <span className="text-sm text-muted-foreground">+91</span>
                </div>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="9876543210"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value.replace(/\D/g, "").slice(0, 10) })}
                  className="flex-1"
                  maxLength={10}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                We'll send a 6-digit verification code to this number
              </p>
            </div>

            <Button
              onClick={handleSendOTP}
              className="w-full gradient-primary text-primary-foreground hover:opacity-90"
              size="lg"
              disabled={isLoading || formData.phone.length < 10}
            >
              {isLoading ? "Sending OTP..." : "Send OTP"}
            </Button>
          </motion.div>
        ) : (
          <motion.div
            key="verify"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-4"
          >
            <Button
              variant="ghost"
              className="gap-2 -ml-2 mb-2"
              onClick={() => {
                setOtpStep("phone");
                setOtp("");
              }}
            >
              <ArrowLeft className="h-4 w-4" />
              Change Number
            </Button>

            <div>
              <h3 className="font-semibold mb-1">Enter Verification Code</h3>
              <p className="text-sm text-muted-foreground">
                Sent to +91 {formData.phone}
              </p>
            </div>

            <div className="flex justify-center py-4">
              <InputOTP
                maxLength={6}
                value={otp}
                onChange={setOtp}
              >
                <InputOTPGroup>
                  <InputOTPSlot index={0} className="h-12 w-12 text-lg" />
                  <InputOTPSlot index={1} className="h-12 w-12 text-lg" />
                  <InputOTPSlot index={2} className="h-12 w-12 text-lg" />
                  <InputOTPSlot index={3} className="h-12 w-12 text-lg" />
                  <InputOTPSlot index={4} className="h-12 w-12 text-lg" />
                  <InputOTPSlot index={5} className="h-12 w-12 text-lg" />
                </InputOTPGroup>
              </InputOTP>
            </div>

            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-2">Didn't receive the code?</p>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleResendOTP}
                disabled={resendTimer > 0}
                className="gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                {resendTimer > 0 ? `Resend in ${formatTime(resendTimer)}` : "Resend Code"}
              </Button>
            </div>

            <Button
              onClick={handleVerifyOTP}
              className="w-full gradient-primary text-primary-foreground hover:opacity-90"
              size="lg"
              disabled={isLoading || otp.length !== 6}
            >
              {isLoading ? "Verifying..." : "Verify & Login"}
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Full Image with Testimonial */}
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

        {/* Testimonial */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="absolute bottom-12 left-8 right-8 z-10"
        >
          <blockquote className="text-white">
            <p className="text-2xl md:text-3xl font-medium mb-4 leading-relaxed">
              "Streamlining our fleet operations with FastFare reduced delivery times by 40% in just two months."
            </p>
            <footer className="text-base text-white/70">
              Alex Chen, Logistics Director at GlobalTrade
            </footer>
          </blockquote>
        </motion.div>
      </div>

      {/* Right Side - Form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-background">
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          {/* Mobile Logo */}
          <div className="lg:hidden mb-8">
            <Link to="/">
              <img src={logo} alt="FastFare" className="h-10 w-auto" />
            </Link>
          </div>

          <h1 className="text-3xl font-bold mb-2">Welcome Back</h1>
          <p className="text-muted-foreground mb-6">
            {loginMode === "password"
              ? "Select your role and log in to continue."
              : "Enter your phone number to receive a verification code."}
          </p>

          {/* Role Selector - Only show for password login */}
          {loginMode === "password" && (
            <div className="grid grid-cols-3 gap-2 mb-6">
              {roles.map((role) => (
                <button
                  key={role.id}
                  type="button"
                  onClick={() => setSelectedRole(role.id)}
                  className={`flex flex-col items-center p-3 rounded-lg border-2 transition-all ${selectedRole === role.id
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border hover:border-primary/50 text-muted-foreground"
                    }`}
                >
                  <role.icon className="h-5 w-5 mb-1" />
                  <span className="text-sm font-medium">{role.label}</span>
                  <span className="text-[10px] opacity-70">{role.description}</span>
                </button>
              ))}
            </div>
          )}

          {/* Login Forms */}
          <AnimatePresence mode="wait">
            {loginMode === "password" ? (
              <motion.div
                key="password"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                {renderPasswordLogin()}
              </motion.div>
            ) : (
              <motion.div
                key="otp"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                {renderOTPLogin()}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Admin hint */}
          {selectedRole === "admin" && loginMode === "password" && (
            <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800">
              <strong>Admin Access:</strong> admin@fastfare.com / Admin@123
            </div>
          )}

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="bg-background px-4 text-muted-foreground">OR</span>
            </div>
          </div>

          {/* Toggle Login Mode */}
          <Button
            variant="outline"
            className="w-full gap-2"
            size="lg"
            onClick={() => {
              setLoginMode(loginMode === "password" ? "otp" : "password");
              setOtpStep("phone");
              setOtp("");
            }}
          >
            {loginMode === "password" ? (
              <>
                <Phone size={20} />
                Log in via OTP
              </>
            ) : (
              <>
                <MessageSquare size={20} />
                Log in with Password
              </>
            )}
          </Button>

          <p className="text-center text-sm text-muted-foreground mt-6">
            New to FastFare?{" "}
            <Link to="/register" className="text-primary font-medium hover:underline">
              Create an account
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default Login;
