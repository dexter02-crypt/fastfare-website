import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import DashboardLayout from "@/components/DashboardLayout";
import { Wallet, CreditCard, Zap, Shield, ArrowLeft, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useWallet } from "@/contexts/WalletContext";
import { API_BASE_URL } from "@/config";

declare global {
    interface Window {
        Cashfree: any;
    }
}

const loadCashfreeScript = () => {
    return new Promise((resolve, reject) => {
        if (window.Cashfree) {
            resolve(window.Cashfree);
            return;
        }
        const script = document.createElement('script');
        script.src = 'https://sdk.cashfree.com/js/v3/cashfree.js';
        script.async = true;
        script.onload = () => resolve(window.Cashfree);
        script.onerror = reject;
        document.body.appendChild(script);
    });
};

const quickAmounts = [500, 1000, 2000, 5000, 10000, 25000];

const WalletRecharge = () => {
    const navigate = useNavigate();
    const [amount, setAmount] = useState<number>(1000);
    const [customAmount, setCustomAmount] = useState<string>("");
    const [isProcessing, setIsProcessing] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string>("");
    const [showSuccess, setShowSuccess] = useState(false);
    const [successAmount, setSuccessAmount] = useState<number>(0);
    const { refreshBalance } = useWallet();

    const handleAmountSelect = (value: number) => {
        setAmount(value);
        setCustomAmount("");
    };

    const handleCustomAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setCustomAmount(value);
        const parsed = parseInt(value);
        if (!isNaN(parsed) && parsed > 0) {
            setAmount(parsed);
        }
    };

    const handlePayment = async () => {
        setErrorMessage("");
        if (amount < 500) {
            setErrorMessage("Minimum recharge amount is ₹500");
            toast.error("Minimum recharge amount is ₹500");
            return;
        }

        const token = localStorage.getItem("token");
        if (!token) {
            toast.error("Please login to continue");
            navigate("/login");
            return;
        }

        setIsProcessing(true);

        try {
            // 1. Initialize Recharger API Call
            const res = await fetch(`${API_BASE_URL}/api/wallet/recharge/initiate`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ amount })
            });

            const data = await res.json();
            
            console.log("Backend Cashfree Initiate Response:", data);

            if (!res.ok) {
                const errorText = data.message || "Payment initiation failed. Please try again.";
                setErrorMessage(errorText);
                toast.error(errorText);
                setIsProcessing(false);
                return;
            }
            
            if (!data.payment_session_id) {
                setErrorMessage("Payment initiation failed. Please try again.");
                setIsProcessing(false);
                return;
            }

            // 2. Load Cashfree SDK dynamically
            let CashfreeLib: any;
            try {
                CashfreeLib = await loadCashfreeScript();
            } catch (err) {
                setErrorMessage("Unable to load payment gateway. Please check your internet connection and try again.");
                toast.error("Unable to load payment gateway.");
                setIsProcessing(false);
                return;
            }
            
            // Initialization
            const cashfree = CashfreeLib({
                mode: data.cashfree_env === 'production' ? 'production' : 'sandbox'
            });
            
            // 3. Store Order ID Reference properly before redirect
            sessionStorage.setItem('ff_recharge_order_id', data.order_id);
            sessionStorage.setItem('ff_recharge_amount', data.amount.toString());

            // 4. Redirect to Cashfree Hosted Page via SDK
            cashfree.checkout({
                paymentSessionId: data.payment_session_id,
                redirectTarget: "_self"
            });

        } catch (error) {
            console.error("Payment error:", error);
            setErrorMessage("Failed to initiate Cashfree payment. Please try again.");
            toast.error("Failed to initiate Cashfree payment.");
            setIsProcessing(false);
        }
    };

    return (
        <DashboardLayout>
            <div className="max-w-2xl mx-auto">
                <Button
                    variant="ghost"
                    className="mb-6 gap-2"
                    onClick={() => navigate("/billing")}
                >
                    <ArrowLeft className="h-4 w-4" />
                    Back to Billing
                </Button>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                >
                    <Card className="overflow-hidden">
                        <div className="h-2 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />
                        <CardHeader className="text-center">
                            <div className="mx-auto h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                                <Wallet className="h-8 w-8 text-primary" />
                            </div>
                            <CardTitle className="text-2xl">Add Funds to Wallet</CardTitle>
                            <CardDescription>
                                Recharge your wallet to book shipments instantly
                            </CardDescription>
                        </CardHeader>

                        <CardContent className="space-y-6">
                            {/* Quick Amount Selection */}
                            <div>
                                <label className="text-sm font-medium mb-3 block">
                                    Select Amount
                                </label>
                                <div className="grid grid-cols-3 gap-3">
                                    {quickAmounts.map((quickAmount) => (
                                        <Button
                                            key={quickAmount}
                                            variant={amount === quickAmount && !customAmount ? "default" : "outline"}
                                            className={`h-14 text-lg font-semibold ${amount === quickAmount && !customAmount
                                                ? "gradient-primary"
                                                : ""
                                                }`}
                                            onClick={() => handleAmountSelect(quickAmount)}
                                        >
                                            ₹{quickAmount.toLocaleString()}
                                        </Button>
                                    ))}
                                </div>
                            </div>

                            {/* Custom Amount */}
                            <div>
                                <label className="text-sm font-medium mb-1 block">
                                    Or Enter Custom Amount
                                </label>
                                <p className="text-xs text-muted-foreground mb-3">Minimum recharge amount: ₹500</p>
                                <div className="relative">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg font-medium text-muted-foreground">
                                        ₹
                                    </span>
                                    <Input
                                        type="number"
                                        placeholder="Enter amount"
                                        className="pl-8 h-14 text-lg"
                                        value={customAmount}
                                        onChange={handleCustomAmountChange}
                                        min={500}
                                    />
                                </div>
                                {amount > 0 && amount < 500 && (
                                    <p className="text-destructive text-sm mt-2">Minimum recharge amount is ₹500. Please enter ₹500 or more.</p>
                                )}
                            </div>

                            {/* Amount Summary */}
                            <Card className="bg-muted/50">
                                <CardContent className="pt-4">
                                    <div className="flex justify-between items-center">
                                        <span className="text-muted-foreground">Amount to Add</span>
                                        <span className="text-2xl font-bold">
                                            ₹{amount.toLocaleString()}
                                        </span>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Benefits */}
                            <div className="grid grid-cols-3 gap-4 text-center">
                                <div className="space-y-2">
                                    <div className="mx-auto h-10 w-10 rounded-full bg-green-500/10 flex items-center justify-center">
                                        <Zap className="h-5 w-5 text-green-500" />
                                    </div>
                                    <p className="text-xs text-muted-foreground">Instant Credit</p>
                                </div>
                                <div className="space-y-2">
                                    <div className="mx-auto h-10 w-10 rounded-full bg-blue-500/10 flex items-center justify-center">
                                        <Shield className="h-5 w-5 text-blue-500" />
                                    </div>
                                    <p className="text-xs text-muted-foreground">Secure Payment</p>
                                </div>
                                <div className="space-y-2">
                                    <div className="mx-auto h-10 w-10 rounded-full bg-purple-500/10 flex items-center justify-center">
                                        <CreditCard className="h-5 w-5 text-purple-500" />
                                    </div>
                                    <p className="text-xs text-muted-foreground">All Cards Accepted</p>
                                </div>
                            </div>

                            {/* Error Message */}
                            {errorMessage && (
                                <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm flex items-start gap-2">
                                    <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                                    <span>{errorMessage}</span>
                                </div>
                            )}

                            {/* Pay Button */}
                            <Button
                                className="w-full h-14 text-lg font-semibold gradient-primary gap-2 disabled:opacity-50"
                                onClick={handlePayment}
                                disabled={isProcessing || amount < 500}
                            >
                                {isProcessing ? (
                                    <><Loader2 className="w-5 h-5 animate-spin mr-2" /> Initiating Payment...</>
                                ) : amount > 0 && amount < 500 ? (
                                    <>Minimum ₹500 Required</>
                                ) : (
                                    <>
                                        <CreditCard className="h-5 w-5" />
                                        Pay ₹{amount.toLocaleString()}
                                    </>
                                )}
                            </Button>

                            {/* Payment Methods */}
                            <div className="flex items-center justify-center gap-4 pt-4 border-t">
                                <Badge variant="outline" className="gap-1">
                                    <CheckCircle className="h-3 w-3" /> UPI
                                </Badge>
                                <Badge variant="outline" className="gap-1">
                                    <CheckCircle className="h-3 w-3" /> Cards
                                </Badge>
                                <Badge variant="outline" className="gap-1">
                                    <CheckCircle className="h-3 w-3" /> Net Banking
                                </Badge>
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>
            </div>

            {/* Success Feedback Overlay */}
            <AnimatePresence>
                {showSuccess && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
                        onClick={() => setShowSuccess(false)}
                    >
                        <motion.div
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            className="bg-white rounded-2xl p-8 max-w-sm w-full text-center shadow-2xl"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                                className="mx-auto w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mb-4"
                            >
                                <CheckCircle className="h-8 w-8 text-green-600" />
                            </motion.div>
                            <h3 className="text-xl font-bold mb-2">Recharge Successful!</h3>
                            <p className="text-muted-foreground mb-4">
                                ₹{successAmount.toLocaleString()} has been added to your wallet
                            </p>
                            <Button
                                onClick={() => setShowSuccess(false)}
                                className="w-full bg-green-600 hover:bg-green-700"
                            >
                                Done
                            </Button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </DashboardLayout>
    );
};

export default WalletRecharge;
