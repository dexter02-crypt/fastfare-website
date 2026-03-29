import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { Loader2, AlertTriangle, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { API_BASE_URL } from "@/config";
import { toast } from "sonner";
import { authApi } from "@/lib/api";

export default function DeletionAcknowledgement() {
    const navigate = useNavigate();
    const location = useLocation();
    const [loading, setLoading] = useState(false);
    const [checks, setChecks] = useState({
        dataLoss: false,
        noRecovery: false,
        finality: false
    });

    const [targetInfo, setTargetInfo] = useState<{
        userId: string;
        name: string;
        email: string;
        accountType: string;
        isSelf: boolean;
    } | null>(null);

    useEffect(() => {
        // If state is passed from User/Partner management, use it.
        // Otherwise assume self-deletion and get from context/local.
        const state = location.state as any;
        if (state && state.targetUserId) {
            setTargetInfo({
                userId: state.targetUserId,
                name: state.targetName || "User",
                email: state.targetEmail || "",
                accountType: state.accountType || "user",
                isSelf: false
            });
        } else {
            // Self deletion (or fallback)
            const currentUser = authApi.getCurrentUser();
            if (currentUser) {
                setTargetInfo({
                    userId: currentUser.id || (currentUser as any)._id,
                    name: currentUser.name || (currentUser as any).businessName || "User",
                    email: currentUser.email,
                    accountType: currentUser.role === 'shipment_partner' ? 'partner' : 'user',
                    isSelf: true
                });
            } else {
                navigate('/');
            }
        }
    }, [location, navigate]);

    const allChecked = checks.dataLoss && checks.noRecovery && checks.finality;

    const handleSendOtp = async () => {
        if (!allChecked || !targetInfo) return;
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_BASE_URL}/api/account/delete/send-otp`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ userId: targetInfo.userId })
            });
            const data = await res.json();
            
            if (data.success) {
                toast.success(`OTP sent successfully to ${data.maskedEmail}`);
                // Move to step 3
                navigate('/account/delete/verify-otp', {
                    state: { ...targetInfo, maskedEmail: data.maskedEmail }
                });
            } else {
                toast.error(data.message || "Failed to send OTP. Please try again.");
            }
        } catch (err) {
            console.error("OTP Request failed:", err);
            toast.error("Network error while requesting OTP.");
        } finally {
            setLoading(false);
        }
    };

    if (!targetInfo) return null;

    return (
        <div className="min-h-screen bg-[#F8F9FA] flex flex-col items-center justify-center p-4">
            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="max-w-md w-full bg-white rounded-2xl shadow-xl overflow-hidden border border-red-100"
            >
                <div className="bg-[#EF4444] p-6 text-center">
                    <div className="mx-auto bg-white/20 w-16 h-16 rounded-full flex items-center justify-center mb-4">
                        <AlertTriangle className="h-8 w-8 text-white" />
                    </div>
                    <h1 className="text-2xl font-bold text-white">Danger Zone</h1>
                    <p className="text-red-100 text-sm mt-1">
                        {targetInfo.isSelf ? "You are about to delete your account." : `You are deleting ${targetInfo.name}'s account.`}
                    </p>
                </div>

                <div className="p-6">
                    <div className="bg-red-50 border border-red-100 rounded-lg p-4 mb-6 text-sm text-red-900">
                        <p className="font-semibold mb-1">Target Account:</p>
                        <p><strong>Name:</strong> {targetInfo.name}</p>
                        <p><strong>Email:</strong> {targetInfo.email}</p>
                        <p><strong>Type:</strong> {targetInfo.accountType === 'partner' ? 'Partner' : 'User'}</p>
                    </div>

                    <div className="space-y-4 mb-8">
                        <h3 className="font-semibold text-gray-900 border-b pb-2">Please acknowledge the following:</h3>
                        
                        <div className="flex items-start space-x-3">
                            <Checkbox 
                                id="chk-dataloss" 
                                checked={checks.dataLoss} 
                                onCheckedChange={(c) => setChecks({ ...checks, dataLoss: !!c })}
                                className="mt-1 border-gray-300 data-[state=checked]:bg-[#EF4444] data-[state=checked]:border-[#EF4444]"
                            />
                            <label htmlFor="chk-dataloss" className="text-sm text-gray-700 leading-snug cursor-pointer">
                                I understand that all shipments, invoices, API keys, and notification history will be permanently erased.
                            </label>
                        </div>

                        <div className="flex items-start space-x-3">
                            <Checkbox 
                                id="chk-norecovery" 
                                checked={checks.noRecovery} 
                                onCheckedChange={(c) => setChecks({ ...checks, noRecovery: !!c })}
                                className="mt-1 border-gray-300 data-[state=checked]:bg-[#EF4444] data-[state=checked]:border-[#EF4444]"
                            />
                            <label htmlFor="chk-norecovery" className="text-sm text-gray-700 leading-snug cursor-pointer">
                                I acknowledge that FastFare cannot recover any data once this deletion is executed.
                            </label>
                        </div>

                        <div className="flex items-start space-x-3">
                            <Checkbox 
                                id="chk-finality" 
                                checked={checks.finality} 
                                onCheckedChange={(c) => setChecks({ ...checks, finality: !!c })}
                                className="mt-1 border-gray-300 data-[state=checked]:bg-[#EF4444] data-[state=checked]:border-[#EF4444]"
                            />
                            <label htmlFor="chk-finality" className="text-sm text-gray-700 leading-snug cursor-pointer">
                                I agree that the wallet balance (if any) will be irrevocably forfeited.
                            </label>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <Button 
                            variant="outline" 
                            className="w-full"
                            onClick={() => navigate(-1)}
                            disabled={loading}
                        >
                            Cancel
                        </Button>
                        <Button 
                            className="w-full bg-[#EF4444] hover:bg-red-600 text-white"
                            disabled={!allChecked || loading}
                            onClick={handleSendOtp}
                        >
                            {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <ShieldAlert className="h-4 w-4 mr-2" />}
                            Send OTP
                        </Button>
                    </div>
                </div>
            </motion.div>
            
            <p className="mt-8 text-sm text-gray-500">
                Secured by FastFare Security Protocols
            </p>
        </div>
    );
}
