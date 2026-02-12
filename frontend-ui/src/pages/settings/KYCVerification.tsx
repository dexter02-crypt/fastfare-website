import { API_BASE_URL } from "@/config";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
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
  ArrowLeft, Shield, CheckCircle, AlertCircle, Loader2, ExternalLink, RefreshCw
} from "lucide-react";

const KYCVerification = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [kycType, setKycType] = useState<"aadhaar" | "pan" | "gst">("aadhaar");
  const [step, setStep] = useState<"select" | "verify" | "otp" | "processing" | "complete">("select");
  const [gstin, setGstin] = useState("");
  const [panNumber, setPanNumber] = useState("");
  const [aadhaarNumber, setAadhaarNumber] = useState("");
  const [otp, setOtp] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [kycStatus, setKycStatus] = useState<KYCStatus | null>(null);
  const [sessionUrl, setSessionUrl] = useState<string | null>(null);
  const [verificationDetails, setVerificationDetails] = useState<VerificationDetails | null>(null);

  interface KYCStatus {
    status: string;
    verificationType?: string;
    details?: VerificationDetails;
    verifiedAt?: string;
  }

  interface VerificationDetails {
    gstin?: string;
    panNumber?: string;
    aadhaarNumber?: string;
  }

  // Fetch KYC status on mount
  useEffect(() => {
    fetchKycStatus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
        setVerificationDetails(data.kyc.details);

        // If already verified, show complete step
        if (data.kyc.status === "verified") {
          setStep("complete");
        } else if (data.kyc.status === "in_progress" && data.kyc.sessionUrl) {
          setSessionUrl(data.kyc.sessionUrl);
          setStep("processing");
        }
      }
    } catch (error) {
      console.error("Error fetching KYC status:", error);
    }
  };

  const mockAadhaarVerification = async () => {
    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 2000));

    const mockResponse = {
      success: true,
      details: {
        aadhaarNumber: "XXXXXXXX" + aadhaarNumber.slice(-4),
        name: "Demo User",
        dob: "1990-01-01",
        gender: "M",
        address: "123 Demo Street, Demo City - 110001"
      }
    };

    setVerificationDetails(mockResponse.details);
    setStep("otp");
    setIsLoading(false);
    toast({
      title: "OTP Sent",
      description: "OTP sent to your Aadhaar-linked mobile number",
    });
  };

  const mockPanVerification = async () => {
    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 2000));

    const panRegex = /[A-Z]{5}[0-9]{4}[A-Z]{1}/;
    if (!panRegex.test(panNumber)) {
      setIsLoading(false);
      toast({
        title: "Invalid PAN",
        description: "Please enter a valid PAN number (e.g., ABCDE1234F)",
        variant: "destructive",
      });
      return;
    }

    const mockResponse = {
      success: true,
      details: {
        panNumber: panNumber.toUpperCase(),
        name: "Demo User",
        status: "Active",
        category: "Individual"
      }
    };

    setVerificationDetails(mockResponse.details);
    await mockCompleteVerification(mockResponse.details, "pan");
  };

  const mockOtpVerification = async () => {
    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 1500));

    if (otp !== "123456") {
      setIsLoading(false);
      toast({
        title: "Invalid OTP",
        description: "For demo, use OTP: 123456",
        variant: "destructive",
      });
      return;
    }

    await mockCompleteVerification(verificationDetails, "aadhaar");
  };

    const mockCompleteVerification = async (details: VerificationDetails | null, type: string) => {
    setStep("processing");

    await new Promise(resolve => setTimeout(resolve, 3000));

    const mockResponse = {
      success: true,
      kyc: {
        status: "verified",
        verificationType: type,
        details: details,
        verifiedAt: new Date().toISOString()
      }
    };

    setKycStatus(mockResponse.kyc);
    localStorage.setItem("kycStatus", "verified");
    localStorage.removeItem("kycSkippedAt");
    setIsLoading(false);
    setShowSuccessDialog(true);
    setStep("complete");

    toast({
      title: "KYC Verified",
      description: "Your KYC has been successfully verified",
    });
  };

  const handleProceedToVerify = () => {
    setStep("verify");
  };

  const handleStartVerification = async () => {
    if (kycType === "aadhaar") {
      if (aadhaarNumber.length !== 12 || !/^\d{12}$/.test(aadhaarNumber)) {
        toast({
          title: "Invalid Aadhaar",
          description: "Please enter a valid 12-digit Aadhaar number",
          variant: "destructive",
        });
        return;
      }
      await mockAadhaarVerification();
    } else if (kycType === "pan") {
      await mockPanVerification();
    } else if (kycType === "gst") {
      if (gstin.length !== 15) {
        toast({
          title: "Invalid Input",
          description: "Please enter a valid 15-character GSTIN",
          variant: "destructive",
        });
        return;
      }

      setIsLoading(true);

      try {
        const token = localStorage.getItem("token");
        if (!token) {
          navigate("/login");
          return;
        }

        // Create verification session with Didit
        const response = await fetch(`${API_BASE_URL}/api/kyc/create-session`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            verificationType: kycType,
            verificationId: gstin,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Failed to create verification session");
        }

        // Store session URL and move to processing step
        setSessionUrl(data.verificationUrl);
        setStep("processing");

        toast({
          title: "Verification Started",
          description: "Complete the verification in the new window.",
        });

        // Open verification URL in new window
        if (data.verificationUrl) {
          window.open(data.verificationUrl, "_blank", "width=600,height=700");
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
    }
  };

  const handleCheckStatus = async () => {
    setIsLoading(true);
    await fetchKycStatus();
    setIsLoading(false);

    if (kycStatus?.status === "verified") {
      setShowSuccessDialog(true);
    }
  };

  const handleOpenVerificationUrl = () => {
    if (sessionUrl) {
      window.open(sessionUrl, "_blank", "width=600,height=700");
    }
  };

  const renderSelectStep = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div>
        <h2 className="text-xl font-semibold mb-2">Choose Verification Method</h2>
        <p className="text-muted-foreground">KYC helps ensure secure and verified deliveries</p>
      </div>

      <RadioGroup value={kycType} onValueChange={(v) => setKycType(v as "aadhaar" | "pan" | "gst")}>
        <div
          className={`flex items-start gap-4 p-4 rounded-lg border cursor-pointer transition-all ${kycType === "aadhaar" ? "border-primary ring-2 ring-primary/20" : "hover:border-primary/50"
            }`}
          onClick={() => setKycType("aadhaar")}
        >
          <RadioGroupItem value="aadhaar" id="aadhaar" className="mt-1" />
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <Label htmlFor="aadhaar" className="font-semibold cursor-pointer">
                Verify with Aadhaar
              </Label>
              <Badge className="bg-green-500 hover:bg-green-600">RECOMMENDED</Badge>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Verify instantly using UIDAI Aadhaar verification with OTP
            </p>
          </div>
        </div>

        <div
          className={`flex items-start gap-4 p-4 rounded-lg border cursor-pointer transition-all ${kycType === "pan" ? "border-primary ring-2 ring-primary/20" : "hover:border-primary/50"
            }`}
          onClick={() => setKycType("pan")}
        >
          <RadioGroupItem value="pan" id="pan" className="mt-1" />
          <div className="flex-1">
            <Label htmlFor="pan" className="font-semibold cursor-pointer">
              Verify with PAN
            </Label>
            <p className="text-sm text-muted-foreground mt-1">
              Verify using your PAN card number
            </p>
          </div>
        </div>

        <div
          className={`flex items-start gap-4 p-4 rounded-lg border cursor-pointer transition-all ${kycType === "gst" ? "border-primary ring-2 ring-primary/20" : "hover:border-primary/50"
            }`}
          onClick={() => setKycType("gst")}
        >
          <RadioGroupItem value="gst" id="gst" className="mt-1" />
          <div className="flex-1">
            <Label htmlFor="gst" className="font-semibold cursor-pointer">
              Verify with GST Number
            </Label>
            <p className="text-sm text-muted-foreground mt-1">
              For registered businesses with valid GSTIN
            </p>
          </div>
        </div>
      </RadioGroup>

      <Button onClick={handleProceedToVerify} className="w-full gradient-primary">
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

      {kycType === "aadhaar" ? (
        <div className="space-y-4">
          <div>
            <h2 className="text-xl font-semibold mb-2">Secure Aadhaar Verification</h2>
            <p className="text-muted-foreground">
              Enter your 12-digit Aadhaar number to receive OTP verification
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="aadhaar">Aadhaar Number</Label>
            <Input
              id="aadhaar"
              type="text"
              placeholder="1234 5678 9012"
              value={aadhaarNumber.replace(/(\d{4})(?=\d)/g, '$1 ')}
              onChange={(e) => setAadhaarNumber(e.target.value.replace(/\D/g, '').slice(0, 12))}
              maxLength={14}
              className="font-mono text-lg"
            />
            <p className="text-xs text-muted-foreground">
              12-digit Aadhaar number
            </p>
          </div>

          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
            <h4 className="font-semibold text-blue-800 dark:text-blue-300 mb-2 flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Secure Process
            </h4>
            <ul className="list-disc list-inside text-sm text-blue-700 dark:text-blue-400 space-y-1">
              <li>Official UIDAI verification</li>
              <li>OTP sent to Aadhaar-linked mobile</li>
              <li>For demo use OTP: 123456</li>
            </ul>
          </div>

          <Button
            onClick={handleStartVerification}
            disabled={aadhaarNumber.length !== 12 || isLoading}
            className="w-full gradient-primary"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Sending OTP...
              </>
            ) : (
              "Send OTP"
            )}
          </Button>
        </div>
      ) : kycType === "pan" ? (
        <div className="space-y-4">
          <div>
            <h2 className="text-xl font-semibold mb-2">Enter Your PAN</h2>
            <p className="text-muted-foreground">We'll verify your identity using PAN records</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="pan">PAN Number</Label>
            <Input
              id="pan"
              placeholder="ABCDE1234F"
              value={panNumber.toUpperCase()}
              onChange={(e) => setPanNumber(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 10))}
              maxLength={10}
              className="font-mono text-lg uppercase"
            />
            <p className="text-xs text-muted-foreground">
              10-character PAN (e.g., ABCDE1234F)
            </p>
          </div>

          <Button
            onClick={handleStartVerification}
            disabled={panNumber.length !== 10 || isLoading}
            className="w-full gradient-primary"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Verifying...
              </>
            ) : (
              "Verify PAN"
            )}
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          <div>
            <h2 className="text-xl font-semibold mb-2">Enter Your GSTIN</h2>
            <p className="text-muted-foreground">We'll verify your business using GST records</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="gstin">GSTIN Number</Label>
            <Input
              id="gstin"
              placeholder="22AAAAA0000A1Z5"
              value={gstin}
              onChange={(e) => setGstin(e.target.value.toUpperCase())}
              maxLength={15}
              className="font-mono text-lg"
            />
            <p className="text-xs text-muted-foreground">
              15-character alphanumeric GSTIN
            </p>
          </div>

          <Button
            onClick={handleStartVerification}
            disabled={gstin.length !== 15 || isLoading}
            className="w-full gradient-primary"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Starting Verification...
              </>
            ) : (
              "Verify GSTIN"
            )}
          </Button>
        </div>
      )}
    </motion.div>
  );

  const renderOtpStep = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <Button variant="ghost" className="gap-2 -ml-2" onClick={() => setStep("verify")}>
        <ArrowLeft className="h-4 w-4" />
        Back
      </Button>

      <div>
        <h2 className="text-xl font-semibold mb-2">Enter OTP</h2>
        <p className="text-muted-foreground">
          Enter the 6-digit OTP sent to your Aadhaar-linked mobile number
        </p>
      </div>

      {verificationDetails && (
        <div className="bg-gray-50 dark:bg-gray-900/30 p-4 rounded-lg border">
          <p className="text-sm font-medium mb-1">Aadhaar Number</p>
          <p className="font-mono">{verificationDetails.aadhaarNumber}</p>
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="otp">OTP</Label>
        <Input
          id="otp"
          type="text"
          placeholder="123456"
          value={otp}
          onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
          maxLength={6}
          className="font-mono text-2xl text-center tracking-widest"
        />
        <p className="text-xs text-center text-muted-foreground">
          For demo, use OTP: 123456
        </p>
      </div>

      <Button
        onClick={mockOtpVerification}
        disabled={otp.length !== 6 || isLoading}
        className="w-full gradient-primary"
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Verifying...
          </>
        ) : (
          "Verify OTP"
        )}
      </Button>
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
        {sessionUrl && (
          <Button
            variant="outline"
            onClick={handleOpenVerificationUrl}
            className="w-full gap-2"
          >
            <ExternalLink className="h-4 w-4" />
            Open Verification Page
          </Button>
        )}

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

  const renderCompleteStep = () => (
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

      <div className="bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-lg p-4">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Verification Status</span>
          <Badge className="bg-green-500">Verified</Badge>
        </div>
        {kycStatus?.verifiedAt && (
          <div className="flex items-center justify-between text-sm mt-2">
            <span className="text-muted-foreground">Verified On</span>
            <span>{new Date(kycStatus.verifiedAt).toLocaleDateString()}</span>
          </div>
        )}
      </div>

      <Button
        onClick={() => navigate("/dashboard")}
        className="w-full gradient-primary"
      >
        Go to Dashboard
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
                    
                    // Set keys for Dashboard reminder
                    localStorage.setItem("kycStatus", "pending");
                    localStorage.setItem("kycSkippedAt", new Date().toISOString());
                    
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
              {step === "otp" && renderOtpStep()}
              {step === "processing" && renderProcessingStep()}
              {step === "complete" && renderCompleteStep()}
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
