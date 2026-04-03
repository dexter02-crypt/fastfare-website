import { API_BASE_URL } from "@/config";
import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useToast } from "@/hooks/use-toast";
import {
  ArrowLeft, Shield, CheckCircle, AlertCircle, Loader2, ExternalLink, RefreshCw, User
} from "lucide-react";
import { useDigilocker } from "@/contexts/DigilockerContext";

const KYCVerification = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const [kycType, setKycType] = useState<"digilocker">("digilocker");
  const [step, setStep] = useState<"select" | "verify" | "processing" | "complete" | "failed">("select");
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [kycStatus, setKycStatus] = useState<KYCStatus | null>(null);
  const [kycErrorMsg, setKycErrorMsg] = useState<string | null>(null);
  const { digilocker_verified, digilocker_verified_at, kyc_name, markVerified, refetch: refetchDigilocker } = useDigilocker();

  interface KYCStatus {
    status: string;
    verificationType?: string;
    details?: VerificationDetails;
    verifiedAt?: string;
    digilocker?: {
      status: string;
      verifiedAt: string;
      aadhaarLastFour: string;
    };
  }

  interface VerificationDetails {
    gstin?: string;
    panNumber?: string;
    aadhaarNumber?: string;
  }

  // Fetch KYC status on mount
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const kycSuccess = params.get("kyc_success");
    const kycError = params.get("kyc_error");

    if (kycSuccess === "true") {
      toast({ title: "DigiLocker Verified", description: "Successfully verified your identity with DigiLocker.", variant: "default" });
      window.history.replaceState({}, document.title, window.location.pathname);
      markVerified();
      refetchDigilocker();
      setStep("complete");
    } else if (kycError) {
      const errorMap: Record<string, string> = {
        'invalid_state': "Verification failed due to a security check. Please try again.",
        'token_exchange_failed': "Could not connect to DigiLocker. Please try again later.",
        'session_expired': "Your session expired. Please log in again and retry.",
        'no_code_received': "DigiLocker did not return an authorization code.",
        'profile_fetch_failed': "DigiLocker failed to return your profile details."
      };
      const errorMsg = errorMap[kycError] || "DigiLocker verification failed. Please try again.";
      setKycErrorMsg(errorMsg);
      setStep("failed");
      window.history.replaceState({}, document.title, window.location.pathname);
    }

    // If already verified via context, jump straight to complete
    if (digilocker_verified) {
      setStep("complete");
    }

    fetchKycStatus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.search, digilocker_verified]);

  const fetchKycStatus = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        navigate("/login");
        return;
      }

      const response = await fetch(`${API_BASE_URL}/api/kyc/status`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setKycStatus(data.kyc);

        // If already verified, show complete step
        if (data.kyc.status === "verified" || data.kyc?.digilocker?.status === "verified") {
          setStep("complete");
        }
      }
    } catch (error) {
      console.error("Error fetching KYC status:", error);
    }
  };

  const handleStartVerification = async () => {
    if (kycType === "digilocker") {
      setIsLoading(true);
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          navigate("/login");
          return;
        }

        const response = await fetch(`${API_BASE_URL}/api/auth/digilocker/init`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
           const errData = await response.json().catch(()=>({}));
           throw new Error(errData.error || "Failed to initialize verification");
        }

        const data = await response.json();
        if (data.auth_url) {
          setStep("processing");
          window.location.href = data.auth_url;
        } else {
          throw new Error("Invalid DigiLocker endpoint response");
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Verification failed";
        setKycErrorMsg(errorMessage);
        setStep("failed");
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleCheckStatus = async () => {
    setIsLoading(true);
    await fetchKycStatus();
    setIsLoading(false);

    if (kycStatus?.status === "verified" || kycStatus?.digilocker?.status === "verified") {
      setShowSuccessDialog(true);
    }
  };

  const renderSelectStep = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div>
        <h2 className="text-xl font-semibold mb-2">Verified Identity</h2>
        <p className="text-muted-foreground">KYC helps ensure secure and verified operations</p>
      </div>

      <RadioGroup value={kycType} onValueChange={(v) => setKycType(v as any)}>
        <div
          className={`flex items-start gap-4 p-4 rounded-lg border cursor-pointer transition-all border-primary ring-2 ring-primary/20`}
        >
          <RadioGroupItem value="digilocker" id="digilocker" className="mt-1" />
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <Label htmlFor="digilocker" className="font-semibold cursor-pointer">
                Verify with DigiLocker
              </Label>
              <Badge className="bg-green-500 hover:bg-green-600">RECOMMENDED</Badge>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Verify instantly using government-issued identities via OAuth
            </p>
          </div>
        </div>
      </RadioGroup>

      <Button onClick={() => setStep("verify")} className="w-full gradient-primary" disabled={kycType !== 'digilocker'}>
        Proceed
      </Button>
    </motion.div>
  );

  const renderVerifyStep = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <Button variant="ghost" className="gap-2 -ml-2" onClick={() => setStep("select")}>
        <ArrowLeft className="h-4 w-4" />
        Back
      </Button>

      <div className="space-y-4">
        <div>
          <h2 className="text-xl font-semibold mb-2">DigiLocker Verification</h2>
          <p className="text-muted-foreground">
            You will be redirected to DigiLocker to securely share your official identity details.
          </p>
        </div>
        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
          <h4 className="font-semibold text-blue-800 dark:text-blue-300 mb-2 flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Secure Process
          </h4>
          <ul className="list-disc list-inside text-sm text-blue-700 dark:text-blue-400 space-y-1">
            <li>End-to-end encrypted connection to Central Government servers.</li>
            <li>We only receive and parse your verified name, DOB, gender, and masked generic identification keys securely.</li>
          </ul>
        </div>
        <Button onClick={handleStartVerification} disabled={isLoading} className="w-full gradient-primary">
          {isLoading ? (
            <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Redirecting...</>
          ) : "Continue to DigiLocker"}
        </Button>
      </div>
    </motion.div>
  );

  const renderProcessingStep = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6 text-center"
    >
      <div className="mx-auto h-20 w-20 rounded-full bg-amber-100 flex items-center justify-center">
        <AlertCircle className="h-10 w-10 text-amber-500" />
      </div>

      <div>
        <h2 className="text-xl font-semibold mb-2">Verification In Progress</h2>
        <p className="text-muted-foreground">
          Complete the verification process in the popup window. Once done, click the button below to check your status.
        </p>
      </div>

      <div className="space-y-3">
        <Button
          onClick={handleCheckStatus}
          disabled={isLoading}
          className="w-full gradient-primary"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Checking Status...
            </>
          ) : (
            <>
              <RefreshCw className="mr-2 h-4 w-4" />
              Check Verification Status
            </>
          )}
        </Button>
      </div>

      <p className="text-sm text-muted-foreground">
        Verification typically takes 2-5 minutes to complete.
      </p>
    </motion.div>
  );

  const renderCompleteStep = () => {
    // Use real database timestamp from context, fallback to legacy kycStatus
    const verifiedDate = digilocker_verified_at
      || kycStatus?.verifiedAt
      || kycStatus?.digilocker?.verifiedAt
      || null;
    const verifiedName = kyc_name || null;

    return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6 text-center"
    >
      <div className="mx-auto h-20 w-20 rounded-full bg-green-100 flex items-center justify-center">
        <CheckCircle className="h-10 w-10 text-green-500" />
      </div>

      <div>
        <h2 className="text-xl font-semibold mb-2">KYC Verified Successfully!</h2>
        <p className="text-muted-foreground">
          Your identity has been verified. You can now start shipping with FastFare.
        </p>
      </div>

      <div className="bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-lg p-4 space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Verification Status</span>
          <Badge className="bg-green-500">DigiLocker Verified ✓</Badge>
        </div>
        {verifiedDate && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Verified On</span>
            <span>{new Date(verifiedDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
          </div>
        )}
        {verifiedName && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Verification Name</span>
            <span className="font-medium flex items-center gap-1"><User className="h-3.5 w-3.5" /> {verifiedName}</span>
          </div>
        )}
        <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Method</span>
            <span className="font-medium text-green-600 flex items-center gap-1"><Shield className="h-4 w-4"/> DigiLocker</span>
        </div>
      </div>

      <Button
        onClick={() => navigate("/dashboard")}
        className="w-full gradient-primary"
      >
        Go to Dashboard
      </Button>
    </motion.div>
    );
  };

  const renderFailedStep = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6 text-center"
    >
      <div className="mx-auto h-20 w-20 rounded-full bg-red-100 flex items-center justify-center">
        <AlertCircle className="h-10 w-10 text-red-500" />
      </div>

      <div>
        <h2 className="text-xl font-semibold mb-2">Verification Failed</h2>
        <p className="text-muted-foreground">
          We couldn't confirm your identity.
        </p>
      </div>

      <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg p-4">
        <div className="text-sm font-medium text-red-800 dark:text-red-300">
          {kycErrorMsg || "An unknown error occurred. Please try again."}
        </div>
      </div>

      <Button
        onClick={() => {
           setKycErrorMsg(null);
           setStep("select");
        }}
        className="w-full gradient-primary"
      >
        Retry Verification
      </Button>
    </motion.div>
  );

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container max-w-2xl py-8">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
          <button onClick={() => navigate("/settings")} className="hover:text-foreground">
            Settings
          </button>
          <span>/</span>
          <button onClick={() => navigate("/settings")} className="hover:text-foreground">
            Company Setup
          </button>
          <span>/</span>
          <span className="text-foreground">Domestic KYC</span>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Shield className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <CardTitle>Complete Your KYC</CardTitle>
                  <CardDescription>
                    KYC verification is required to start shipping
                  </CardDescription>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={() => {
                if (confirm("Are you sure you want to skip KYC? Some features may be restricted.")) {
                  const user = JSON.parse(localStorage.getItem("user") || "{}");
                  user.kycSkipped = true;
                  localStorage.setItem("user", JSON.stringify(user));

                  navigate("/dashboard");
                }
              }}>
                Skip for now
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <AnimatePresence mode="wait">
              {step === "select" && renderSelectStep()}
              {step === "verify" && renderVerifyStep()}
              {step === "processing" && renderProcessingStep()}
              {step === "complete" && renderCompleteStep()}
              {step === "failed" && renderFailedStep()}
            </AnimatePresence>
          </CardContent>
        </Card>
      </main>

      {/* Success Dialog */}
      <Dialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
        <DialogContent className="text-center">
          <DialogHeader className="items-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="h-20 w-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4"
            >
              <CheckCircle className="h-10 w-10 text-green-500" />
            </motion.div>
            <DialogTitle className="text-xl">Verification Successful</DialogTitle>
            <DialogDescription>
              Your KYC has been successfully verified. You can now start shipping!
            </DialogDescription>
          </DialogHeader>
          <Button
            onClick={() => {
              setShowSuccessDialog(false);
              setStep("complete");
            }}
            className="w-full gradient-primary mt-4"
          >
            Continue
          </Button>
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
};

export default KYCVerification;
