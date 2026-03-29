import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { Loader2, ArrowLeft, ShieldCheck, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { API_BASE_URL } from "@/config";
import { toast } from "sonner";
import { authApi } from "@/lib/api";

export default function OtpVerification() {
    const navigate = useNavigate();
    const location = useLocation();
    
    // Target Info from Step 2
    const targetInfo = location.state as any;

    const [otp, setOtp] = useState(["", "", "", "", "", ""]);
    const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
    
    const [timeLeft, setTimeLeft] = useState(600); // 10 minutes
    const [lockoutTime, setLockoutTime] = useState(0); // 5 minutes if locked out
    
    const [verifying, setVerifying] = useState(false);
    const [executing, setExecuting] = useState(false);
    
    useEffect(() => {
        if (!targetInfo) {
            navigate('/settings');
            return;
        }

        const timer = setInterval(() => {
            setTimeLeft((prev) => {
                if (prev <= 1) {
                    clearInterval(timer);
                    toast.error("OTP has expired. Please request a new one.");
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [targetInfo, navigate]);

    useEffect(() => {
        if (lockoutTime > 0) {
            const timer = setInterval(() => {
                setLockoutTime((prev) => prev - 1);
            }, 1000);
            return () => clearInterval(timer);
        }
    }, [lockoutTime]);

    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}:${s.toString().padStart(2, '0')}`;
    };

    const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Backspace" && !otp[index] && index > 0) {
            // Move to previous
            inputRefs.current[index - 1]?.focus();
        }
    };

    const handleChange = (index: number, value: string) => {
        if (value.length > 1) {
            // Handle paste
            const pastedData = value.replace(/\D/g, '').slice(0, 6).split('');
            const newOtp = [...otp];
            pastedData.forEach((char, i) => {
                if (i < 6) newOtp[i] = char;
            });
            setOtp(newOtp);
            // Focus the last filled input or the next empty one
            const nextIndex = Math.min(pastedData.length, 5);
            inputRefs.current[nextIndex]?.focus();
            return;
        }

        // Handle single character
        const char = value.replace(/\D/g, '');
        const newOtp = [...otp];
        newOtp[index] = char;
        setOtp(newOtp);

        if (char && index < 5) {
            inputRefs.current[index + 1]?.focus();
        }
    };

    const handleVerify = async () => {
        const otpString = otp.join('');
        if (otpString.length !== 6) return;
        
        setVerifying(true);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_BASE_URL}/api/account/delete/verify-otp`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ otp: otpString, userId: targetInfo.userId })
            });
            const data = await res.json();

            if (data.success) {
                // Verification successful, execute immediately
                await executeDeletion();
            } else {
                if (res.status === 429) {
                    setLockoutTime(300); // 5 minutes
                    toast.error(data.message);
                } else {
                    toast.error(data.message || "Invalid OTP.");
                    setOtp(["", "", "", "", "", ""]);
                    inputRefs.current[0]?.focus();
                }
            }
        } catch (err) {
            console.error("Verification error:", err);
            toast.error("Network error during verification.");
        } finally {
            setVerifying(false);
        }
    };

    const executeDeletion = async () => {
        setExecuting(true);
        toast.loading("Permanently deleting account data...", { id: "delete-toast" });
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_BASE_URL}/api/account/delete/execute`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ userId: targetInfo.userId })
            });
            const data = await res.json();
            
            if (data.success) {
                toast.success("Account successfully deleted", { id: "delete-toast" });
                
                // If it's a self deletion, clear auth
                if (targetInfo.isSelf) {
                    authApi.logout();
                }
                
                navigate('/account/deleted', { state: { email: targetInfo.email } });
            } else {
                toast.error(data.message || "Failed to execute deletion.", { id: "delete-toast" });
            }
        } catch (err) {
            console.error("Execution error:", err);
            toast.error("Critical error during deletion execution.", { id: "delete-toast" });
        } finally {
            setExecuting(false);
        }
    };

    if (!targetInfo) return null;

    const isLockedOut = lockoutTime > 0;
    const isReady = otp.join('').length === 6 && !isLockedOut && timeLeft > 0;

    return (
        <div className="min-h-screen bg-[#F8F9FA] flex flex-col items-center justify-center p-4">
            <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="max-w-md w-full bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100"
            >
                <div className="p-8 text-center">
                    <div className="mx-auto bg-gray-100 w-16 h-16 rounded-full flex items-center justify-center mb-6">
                        <ShieldCheck className="h-8 w-8 text-[#1A1A2E]" />
                    </div>
                    <h1 className="text-2xl font-bold text-[#1A1A2E] mb-2">Verify Deletion</h1>
                    <p className="text-gray-500 text-sm mb-8">
                        Enter the 6-digit confirmation code sent to <br/>
                        <span className="font-semibold text-gray-900">{targetInfo.maskedEmail || targetInfo.email}</span>
                    </p>

                    {isLockedOut ? (
                        <div className="bg-red-50 border border-red-100 rounded-lg p-4 mb-8 text-red-800">
                            <AlertCircle className="h-6 w-6 mx-auto mb-2 text-red-500" />
                            <p className="font-medium">Too many failed attempts</p>
                            <p className="text-sm mt-1">Try again in {formatTime(lockoutTime)}</p>
                        </div>
                    ) : (
                        <div className="flex justify-between gap-2 mb-8" onPaste={(e) => handleChange(0, e.clipboardData.getData('text'))}>
                            {otp.map((digit, i) => (
                                <Input
                                    key={i}
                                    ref={el => inputRefs.current[i] = el}
                                    type="text"
                                    inputMode="numeric"
                                    maxLength={6} // allow paste full string
                                    value={digit}
                                    onChange={(e) => handleChange(i, e.target.value)}
                                    onKeyDown={(e) => handleKeyDown(i, e)}
                                    className={`w-12 h-14 text-center text-2xl font-semibold rounded-lg ${
                                        timeLeft === 0 ? 'bg-gray-100 opacity-50 cursor-not-allowed' : ''
                                    }`}
                                    disabled={timeLeft === 0 || verifying || executing}
                                />
                            ))}
                        </div>
                    )}

                    {!isLockedOut && (
                        <div className="flex items-center justify-center gap-2 text-sm mb-8">
                            {timeLeft > 0 ? (
                                <p className="text-gray-500 font-medium">
                                    Code expires in <span className="text-[#EF4444] font-bold">{formatTime(timeLeft)}</span>
                                </p>
                            ) : (
                                <p className="text-[#EF4444] font-medium">OTP Expired</p>
                            )}
                        </div>
                    )}

                    <div className="space-y-3">
                        <Button 
                            className="w-full bg-[#1A1A2E] hover:bg-gray-800 text-white h-12 text-base font-semibold transition-all relative overflow-hidden"
                            disabled={!isReady || verifying || executing}
                            onClick={handleVerify}
                        >
                            {executing ? (
                                <>
                                    <div className="absolute inset-0 bg-[#EF4444] mix-blend-overlay animate-pulse opactiy-50"></div>
                                    <Loader2 className="h-5 w-5 animate-spin mr-2 z-10" />
                                    <span className="z-10">Deleting Account...</span>
                                </>
                            ) : verifying ? (
                                <>
                                    <Loader2 className="h-5 w-5 animate-spin mr-2" />
                                    Verifying Code...
                                </>
                            ) : (
                                "Confirm & Delete Permanently"
                            )}
                        </Button>
                        <Button 
                            variant="ghost" 
                            className="w-full text-gray-500 hover:text-gray-900 h-12"
                            onClick={() => navigate(-1)}
                            disabled={verifying || executing}
                        >
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Return to Safety
                        </Button>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
