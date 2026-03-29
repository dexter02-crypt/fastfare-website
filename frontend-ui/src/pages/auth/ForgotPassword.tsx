import { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Mail, Lock, EyeOff, Eye } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { API_BASE_URL } from "@/config";
import Logo from "@/components/Logo";
import authBg from "@/assets/auth-bg.png";

type Step = 1 | 2 | 3;

const ForgotPassword = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const [step, setStep] = useState<Step>(1);
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // OTP State
  const [otp, setOtp] = useState<string[]>(Array(6).fill(""));
  const [countdown, setCountdown] = useState(30);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const [resetToken, setResetToken] = useState("");

  // Password State
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Timer for Resend
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (step === 2 && countdown > 0) {
      timer = setInterval(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [step, countdown]);

  const handleSendCode = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMsg("");
    setIsLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || data.error || "Failed to send reset email");

      setStep(2);
      setCountdown(30);
      setOtp(Array(6).fill(""));
      if (inputRefs.current[0]) inputRefs.current[0].focus();
    } catch (error) {
      setErrorMsg(error instanceof Error ? error.message : "Please try again");
    } finally {
      setIsLoading(false);
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    
    // Allow pasting a full 6 digit code
    if (value.length === 6) {
        const chars = value.split("");
        setOtp(chars);
        if (inputRefs.current[5]) inputRefs.current[5].focus();
        return;
    }

    const newOtp = [...otp];
    newOtp[index] = value.substring(value.length - 1); // take last char if they type fast
    setOtp(newOtp);

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = otp.join("");
    if (code.length !== 6) return;
    
    setErrorMsg("");
    setIsLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/verify-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp: code }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || data.error || "Invalid or expired code.");

      // Fix B: Persist token in sessionStorage immediately after OTP verification
      sessionStorage.setItem('ff_reset_token', data.resetToken);
      setResetToken(data.resetToken);
      setStep(3);
    } catch (error) {
      setErrorMsg(error instanceof Error ? error.message : "Invalid or expired code. Please try again.");
      setOtp(Array(6).fill(""));
      inputRefs.current[0]?.focus();
    } finally {
      setIsLoading(false);
    }
  };

  const validatePassword = (password: string): string | null => {
    if (!password || password.length < 8) return "Password must be at least 8 characters.";
    if (!/[A-Z]/.test(password)) return "Password must contain an uppercase letter.";
    if (!/[a-z]/.test(password)) return "Password must contain a lowercase letter.";
    if (!/[0-9]/.test(password)) return "Password must contain a number.";
    if (!/[^A-Za-z0-9]/.test(password)) return "Password must contain a special character.";
    return null;
  };

  useEffect(() => {
    if (step === 3 && !sessionStorage.getItem('ff_reset_token')) {
        setStep(1);
        toast({
            title: "Session Expired",
            description: "Your session has expired. Please start the password reset process again.",
            variant: "destructive"
        });
    }
  }, [step, toast]);

  const checkPasswordStrength = (pass: string) => {
    if (!pass) return { label: "", color: "bg-gray-200" };
    let strength = 0;
    if (pass.length >= 8) strength += 1;
    if (/[A-Z]/.test(pass)) strength += 1;
    if (/[0-9]/.test(pass)) strength += 1;
    if (/[^a-zA-Z0-9]/.test(pass)) strength += 1;

    if (strength <= 2) return { label: "Weak", color: "bg-red-500" };
    if (strength === 3) return { label: "Fair", color: "bg-orange-500" };
    return { label: "Strong", color: "bg-green-500" };
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const resetToken = sessionStorage.getItem('ff_reset_token');
    console.log('Submitting reset. Token:', resetToken, 'Password:', newPassword);

    if (!resetToken || resetToken.trim() === "") {
        toast({ title: "Session Expired", description: "Session expired. Please start over.", variant: "destructive" });
        setStep(1);
        return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMsg("Passwords do not match");
      return;
    }

    const validationError = validatePassword(newPassword);
    if (validationError !== null) {
        setErrorMsg(validationError);
        return;
    }

    setErrorMsg("");
    setIsLoading(true);

    const requestBody = { resetToken: resetToken, newPassword: newPassword };
    console.log('Request body being sent:', requestBody);

    try {
      const response = await fetch(`http://localhost:3000/api/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();
      console.log('Response status:', response.status, 'Response body:', data);

      if (response.ok) {
        sessionStorage.removeItem('ff_reset_token');
        toast({
          title: "Success",
          description: "Password updated successfully!",
        });
        setTimeout(() => {
          navigate("/login");
        }, 2000);
      } else {
        setErrorMsg(data.message || "Failed to reset password");
      }
    } catch (error) {
      setErrorMsg(error instanceof Error ? error.message : "Failed to reset password");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${authBg})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-br from-primary/90 via-primary/70 to-primary/90" />
        <div className="relative z-10 flex flex-col justify-between p-12 text-white">
          <Logo size="lg" variant="full" />
          <div className="space-y-6">
            <h1 className="text-4xl font-bold">
              Don't worry, it happens to the best of us
            </h1>
            <p className="text-xl text-white/80">
              We'll help you reset your password and get back to shipping in no time.
            </p>
          </div>
          <div className="text-sm text-white/60">
            © {new Date().getFullYear()} FastFare. Secure password recovery.
          </div>
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-background">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
        >
          {step === 1 && (
            <>
              <Card className="border-0 shadow-lg">
                <CardHeader className="text-center">
                  <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                    <Mail className="h-8 w-8 text-primary" />
                  </div>
                  <CardTitle className="text-2xl">Reset Your Password</CardTitle>
                  <CardDescription>
                    Enter your registered email address and we'll send you a 6-digit reset code.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSendCode} className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Email Address</label>
                      <Input
                        type="email"
                        placeholder="Enter your registered email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                      />
                    </div>
                    {errorMsg && <p className="text-sm text-red-500">{errorMsg}</p>}
                    <Button type="submit" className="w-full gradient-primary" disabled={isLoading}>
                      {isLoading ? "Sending..." : "Send Reset Code"}
                    </Button>
                  </form>
                </CardContent>
              </Card>
              <div className="mt-8 text-center">
                <Link to="/login" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
                  <ArrowLeft className="h-4 w-4" /> Back to Login
                </Link>
              </div>
            </>
          )}

          {step === 2 && (
            <Card className="border-0 shadow-lg">
              <CardHeader className="text-center">
                 <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                    <Mail className="h-8 w-8 text-primary" />
                 </div>
                <CardTitle className="text-2xl">Check Your Email</CardTitle>
                <CardDescription>
                  We've sent a 6-digit code to <span className="font-medium text-foreground">{email}</span>. Enter it below. The code expires in 10 minutes.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleVerifyOtp} className="space-y-6">
                  <div className="flex justify-between gap-2">
                    {otp.map((digit, index) => (
                      <Input
                        key={index}
                        ref={(el) => (inputRefs.current[index] = el)}
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handleOtpChange(index, e.target.value)}
                        onKeyDown={(e) => handleOtpKeyDown(index, e)}
                        className="w-12 h-14 text-center text-lg font-bold"
                        required
                      />
                    ))}
                  </div>
                  {errorMsg && <p className="text-sm text-red-500 text-center">{errorMsg}</p>}
                  <Button type="submit" className="w-full gradient-primary" disabled={isLoading || otp.join("").length !== 6}>
                    {isLoading ? "Verifying..." : "Verify Code"}
                  </Button>
                  
                  <div className="text-center mt-4">
                    {countdown > 0 ? (
                      <span className="text-sm text-muted-foreground">Resend in {countdown}s</span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleSendCode()}
                        className="text-sm text-primary hover:underline font-medium"
                      >
                        Resend Code
                      </button>
                    )}
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          {step === 3 && (
            <Card className="border-0 shadow-lg">
              <CardHeader className="text-center">
                <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                    <Lock className="h-8 w-8 text-primary" />
                 </div>
                <CardTitle className="text-2xl">Set New Password</CardTitle>
                <CardDescription>
                  Choose a strong new password for your FastFare account.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleUpdatePassword} className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">New Password</label>
                    <div className="relative">
                      <Input
                        type={showNewPassword ? "text" : "password"}
                        placeholder="Enter new password"
                        value={newPassword}
                        onChange={(e) => {
                            setNewPassword(e.target.value);
                            setErrorMsg("");
                        }}
                        onBlur={() => {
                            if (newPassword) {
                                const err = validatePassword(newPassword);
                                if (err) setErrorMsg(err);
                            }
                        }}
                        required
                        className="pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                    {/* Password Strength Indicator */}
                    {newPassword && (
                        <div className="mt-2 space-y-1">
                            <div className="h-1 w-full bg-gray-200 rounded-full overflow-hidden">
                                <div 
                                    className={`h-full transition-all duration-300 ${checkPasswordStrength(newPassword).color}`} 
                                    style={{ width: checkPasswordStrength(newPassword).label === "Weak" ? "33%" : checkPasswordStrength(newPassword).label === "Fair" ? "66%" : "100%" }}
                                />
                            </div>
                            <p className="text-xs text-right text-muted-foreground">Strength: {checkPasswordStrength(newPassword).label}</p>
                        </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Confirm New Password</label>
                     <div className="relative">
                        <Input
                            type={showConfirmPassword ? "text" : "password"}
                            placeholder="Confirm new password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            required
                            className="pr-10"
                        />
                         <button
                            type="button"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        >
                            {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                    </div>
                  </div>
                  
                  {errorMsg && <p className="text-sm text-red-500">{errorMsg}</p>}
                  
                  <Button type="submit" className="w-full gradient-primary mt-2" disabled={isLoading}>
                    {isLoading ? "Updating..." : "Update Password"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          )}

        </motion.div>
      </div>
    </div>
  );
};

export default ForgotPassword;
