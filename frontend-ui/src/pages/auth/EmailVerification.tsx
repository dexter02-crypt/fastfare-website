import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { Mail, CheckCircle, RefreshCw, ArrowLeft, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { API_BASE_URL } from "@/config";
import logo from "@/assets/logo.png";
import authBg from "@/assets/auth-bg.png";

const EmailVerification = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();

  // Get registration data passed via navigation state
  const registrationData = location.state?.registrationData;
  const userEmail = registrationData?.email || "";
  const maskedEmail = userEmail.replace(/(.{2})(.*)(@.*)/, "$1***$3");

  const [otp, setOtp] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [resendTimer, setResendTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const [error, setError] = useState("");

  // Redirect if no registration data
  useEffect(() => {
    if (!registrationData) {
      navigate("/register", { replace: true });
    }
  }, [registrationData, navigate]);

  // Countdown timer
  useEffect(() => {
    if (resendTimer > 0 && !canResend) {
      const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
      return () => clearTimeout(timer);
    } else if (resendTimer === 0) {
      setCanResend(true);
    }
  }, [resendTimer, canResend]);

  // Auto-send OTP on page load
  useEffect(() => {
    if (userEmail && !otpSent) {
      sendOtp();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userEmail]);

  const sendOtp = async () => {
    setIsSendingOtp(true);
    setError("");
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/send-registration-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: userEmail }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to send verification code");
      }
      setOtpSent(true);
      setCanResend(false);
      setResendTimer(60);
      toast({
        title: "Verification Code Sent ✉️",
        description: `A 6-digit code has been sent to ${maskedEmail}`,
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to send code";
      setError(msg);
      toast({ title: "Error", description: msg, variant: "destructive" });
    } finally {
      setIsSendingOtp(false);
    }
  };

  const handleVerify = async () => {
    if (otp.length !== 6) return;

    setIsVerifying(true);
    setError("");

    try {
      // Step 1: Verify the OTP code
      const verifyResponse = await fetch(`${API_BASE_URL}/api/auth/verify-registration-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: userEmail, code: otp }),
      });
      const verifyData = await verifyResponse.json();
      if (!verifyResponse.ok) {
        throw new Error(verifyData.error || "Invalid verification code");
      }

      setIsVerified(true);
      toast({
        title: "Email Verified ✅",
        description: "Creating your account...",
      });

      // Step 2: Register the user
      setIsRegistering(true);
      const registerResponse = await fetch(`${API_BASE_URL}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(registrationData),
      });
      const registerData = await registerResponse.json();
      if (!registerResponse.ok) {
        throw new Error(registerData.error || "Registration failed");
      }

      // Store token and user info
      localStorage.setItem("token", registerData.token);
      localStorage.setItem("user", JSON.stringify(registerData.user));
      localStorage.setItem("kycStatus", "pending");
      localStorage.setItem("kycSkippedAt", new Date().toISOString());

      toast({
        title: "Registration Successful! 🎉",
        description: "Welcome to FastFare!",
      });

      // Navigate to dashboard after a brief success animation
      setTimeout(() => navigate("/dashboard", { replace: true }), 1500);

    } catch (err) {
      const msg = err instanceof Error ? err.message : "Verification failed";
      setError(msg);
      setIsVerified(false);
      setIsRegistering(false);
      toast({ title: "Error", description: msg, variant: "destructive" });
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResend = () => {
    setOtp("");
    setError("");
    sendOtp();
  };

  if (!registrationData) return null;

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
          <img src={logo} alt="FastFare" className="h-12 w-auto brightness-0 invert" />
          <div className="space-y-6">
            <h1 className="text-4xl font-bold">
              One last step to secure your account
            </h1>
            <p className="text-xl text-white/80">
              Verify your email to unlock all FastFare features and start shipping today.
            </p>
          </div>
          <div className="text-sm text-white/60">
            © {new Date().getFullYear()} FastFare. Verified businesses only.
          </div>
        </div>
      </div>

      {/* Right Side - Verification */}
      <div className="flex-1 flex items-center justify-center p-8 bg-background">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
        >
          {/* Back button */}
          <Button
            variant="ghost"
            className="gap-2 mb-4"
            onClick={() => navigate(-1)}
            disabled={isVerified || isRegistering}
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>

          <Card className="border-0 shadow-lg">
            <CardHeader className="text-center">
              <motion.div
                animate={isVerified ? { scale: [1, 1.2, 1] } : {}}
                className="mx-auto mb-4 h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center"
              >
                {isVerified ? (
                  <CheckCircle className="h-10 w-10 text-green-500" />
                ) : isSendingOtp ? (
                  <Loader2 className="h-10 w-10 text-primary animate-spin" />
                ) : (
                  <Mail className="h-10 w-10 text-primary" />
                )}
              </motion.div>
              <CardTitle className="text-2xl">
                {isVerified
                  ? isRegistering
                    ? "Creating Your Account..."
                    : "Email Verified!"
                  : "Verify your email"}
              </CardTitle>
              <CardDescription>
                {isVerified
                  ? isRegistering
                    ? "Setting up your FastFare account..."
                    : "Redirecting to your dashboard..."
                  : isSendingOtp
                    ? `Sending verification code to ${maskedEmail}...`
                    : `We've sent a 6-digit code to ${maskedEmail}`}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {!isVerified && (
                <>
                  <div className="flex justify-center">
                    <InputOTP
                      maxLength={6}
                      value={otp}
                      onChange={(val) => {
                        setOtp(val);
                        setError("");
                      }}
                      disabled={isVerifying || isSendingOtp}
                    >
                      <InputOTPGroup>
                        <InputOTPSlot index={0} />
                        <InputOTPSlot index={1} />
                        <InputOTPSlot index={2} />
                        <InputOTPSlot index={3} />
                        <InputOTPSlot index={4} />
                        <InputOTPSlot index={5} />
                      </InputOTPGroup>
                    </InputOTP>
                  </div>

                  {error && (
                    <p className="text-sm text-red-500 text-center">{error}</p>
                  )}

                  <Button
                    onClick={handleVerify}
                    className="w-full gradient-primary"
                    disabled={otp.length !== 6 || isVerifying || isSendingOtp}
                  >
                    {isVerifying ? (
                      <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Verifying...</>
                    ) : (
                      "Verify & Create Account"
                    )}
                  </Button>

                  <div className="text-center space-y-2">
                    <p className="text-sm text-muted-foreground">
                      Didn't receive the code?
                    </p>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleResend}
                      disabled={!canResend || isSendingOtp}
                      className="gap-2"
                    >
                      <RefreshCw className={`h-4 w-4 ${isSendingOtp ? 'animate-spin' : ''}`} />
                      {isSendingOtp
                        ? "Sending..."
                        : canResend
                          ? "Resend code"
                          : `Resend in ${resendTimer}s`}
                    </Button>
                  </div>
                </>
              )}

              {isVerified && (
                <div className="flex justify-center">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                    className="h-6 w-6 border-2 border-primary border-t-transparent rounded-full"
                  />
                </div>
              )}
            </CardContent>
          </Card>

          <p className="text-center text-sm text-muted-foreground mt-6">
            Wrong email?{" "}
            <button
              onClick={() => navigate(-1)}
              className="text-primary hover:underline"
              disabled={isVerified}
            >
              Go back and change it
            </button>
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default EmailVerification;
