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
import { paymentApi } from "@/lib/api";
import { useWallet } from "@/contexts/WalletContext";

declare global {
    interface Window {
        Razorpay: new (options: RazorpayOptions) => RazorpayInstance;
    }
}

interface RazorpayResponse {
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
}

interface RazorpayOptions {
    key: string;
    amount: number;
    currency: string;
    name: string;
    description: string;
    order_id: string;
    handler: (response: RazorpayResponse) => void;
    prefill: { name: string; email: string };
    theme: { color: string };
    modal: { ondismiss: () => void };
}

interface RazorpayInstance {
    open: () => void;
}

const quickAmounts = [500, 1000, 2000, 5000, 10000, 25000];

const WalletRecharge = () => {
    const navigate = useNavigate();
    const [amount, setAmount] = useState<number>(1000);
    const [customAmount, setCustomAmount] = useState<string>("");
    const [isProcessing, setIsProcessing] = useState(false);
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
        if (amount < 1) {
            toast.error("Please enter a valid amount");
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
            // Create order
            const orderData = await paymentApi.createOrder(amount);

            // Initialize Razorpay
            const options = {
                key: orderData.keyId,
                amount: orderData.amount,
                currency: orderData.currency,
                name: "FastFare Logistics",
                description: `Wallet Recharge - ₹${amount}`,
                order_id: orderData.orderId,
                handler: async function (response: RazorpayResponse) {
                    try {
                        // Verify payment
                        const result = await paymentApi.verifyPayment({
                            razorpay_order_id: response.razorpay_order_id,
                            razorpay_payment_id: response.razorpay_payment_id,
                            razorpay_signature: response.razorpay_signature,
                        });

                        if (result.success) {
                            toast.success(`₹${amount} added to wallet successfully!`);
                            setSuccessAmount(amount);
                            setShowSuccess(true);
                            await refreshBalance();
                            setIsProcessing(false);
                            setTimeout(() => setShowSuccess(false), 3000);
                            navigate("/billing");
                        } else {
                            toast.error("Payment verification failed");
                            setIsProcessing(false);
                        }
                    } catch (error) {
                        toast.error("Payment verification failed");
                    }
                },
                prefill: {
                    name: localStorage.getItem("userName") || "",
                    email: localStorage.getItem("userEmail") || "",
                },
                theme: {
                    color: "#6366f1", // Primary color
                },
                modal: {
                    ondismiss: function () {
                        setIsProcessing(false);
                        toast.info("Payment cancelled");
                    },
                },
            };

            const razorpay = new window.Razorpay(options);
            razorpay.open();
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to initiate payment';
            console.error("Payment error:", error);
            toast.error(errorMessage);
        } finally {
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
                                <label className="text-sm font-medium mb-2 block">
                                    Or Enter Custom Amount
                                </label>
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
                                        min={1}
                                    />
                                </div>
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

                            {/* Pay Button */}
                            <Button
                                className="w-full h-14 text-lg font-semibold gradient-primary gap-2"
                                onClick={handlePayment}
                                disabled={isProcessing || amount < 1}
                            >
                                {isProcessing ? (
                                    <>Processing...</>
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
