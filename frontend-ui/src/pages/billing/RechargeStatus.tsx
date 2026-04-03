import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { API_BASE_URL } from "@/config";
import DashboardLayout from "@/components/DashboardLayout";
import Footer from "@/components/Footer";
import { Loader2, CheckCircle2, XCircle, Clock, RotateCw, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

const RechargeStatus = () => {
    const [searchParams] = useSearchParams();
    const orderId = searchParams.get('order_id');
    const navigate = useNavigate();

    const [status, setStatus] = useState<'loading' | 'paid' | 'pending' | 'failed' | 'network_error'>('loading');
    const [details, setDetails] = useState<any>(null);
    const [retries, setRetries] = useState(0);

    const checkStatus = async () => {
        if (!orderId) {
            navigate('/billing/recharge');
            return;
        }

        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_BASE_URL}/api/wallet/recharge/status?order_id=${orderId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (!res.ok) {
                if (res.status === 401) {
                    // Session expired mapping
                    sessionStorage.setItem('pending_recharge_order', orderId);
                    navigate(`/login?redirect=/billing/recharge/status&order_id=${orderId}`);
                    return;
                }
                throw new Error('Network response was not ok');
            }

            const data = await res.json();
            
            if (data.status === 'paid') {
                setStatus('paid');
                setDetails(data);
                sessionStorage.removeItem('recharge_order_id');
                // The Global Header (if polling) or a global context will update automatically
            } else if (data.status === 'failed' || data.status === 'cancelled') {
                setStatus('failed');
                setDetails(data);
            } else if (data.status === 'pending') {
                if (retries < 8) {
                    setTimeout(() => {
                        setRetries(r => r + 1);
                    }, 3000); // Wait 3s before next retry
                } else {
                    setStatus('pending'); // Stay in pending state visually
                }
            } else {
                 setStatus('failed');
            }

        } catch (error) {
            setStatus('network_error');
        }
    };

    useEffect(() => {
        if (status === 'loading' || (status === 'pending' && retries > 0 && retries <= 8)) {
            checkStatus();
        }
    }, [retries, status]);

    const verifyManualStatus = async () => {
        if (!orderId) return;
        setStatus('loading');
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_BASE_URL}/api/wallet/recharge/verify`, {
                method: 'POST',
                headers: { 
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ order_id: orderId })
            });

            if (!res.ok) {
                if (res.status === 401) {
                    sessionStorage.setItem('pending_recharge_order', orderId);
                    navigate(`/login?redirect=/billing/recharge/status&order_id=${orderId}`);
                    return;
                }
                throw new Error('Network response was not ok');
            }

            const data = await res.json();
            
            if (data.status === 'paid') {
                setStatus('paid');
                setDetails(data);
                sessionStorage.removeItem('recharge_order_id');
            } else if (data.status === 'failed' || data.status === 'cancelled') {
                setStatus('failed');
                setDetails(data);
            } else if (data.status === 'pending') {
                setStatus('pending'); // User sees it's still pending
            } else {
                 setStatus('failed');
            }

        } catch (error) {
            setStatus('network_error');
        }
    };

    const handleRetry = () => {
        verifyManualStatus();
    };

    return (
        <DashboardLayout>
            <div className="flex flex-col min-h-[80vh]">
                <div className="flex-1 flex items-center justify-center p-4">
                    <div className="bg-card border rounded-xl shadow-sm p-8 max-w-md w-full text-center space-y-6">
                        
                        {status === 'loading' && (
                            <div className="py-8">
                                <Loader2 className="h-16 w-16 text-primary animate-spin mx-auto mb-6" />
                                <h2 className="text-2xl font-bold mb-2">Verifying Payment</h2>
                                <p className="text-muted-foreground">Please wait... Do not close or refresh this page.</p>
                            </div>
                        )}

                        {status === 'paid' && (
                            <div className="py-4">
                                <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto mb-6" />
                                <h2 className="text-2xl font-bold mb-2">Payment Successful!</h2>
                                <p className="text-muted-foreground mb-4">
                                    ₹{details?.amount?.toLocaleString()} has been added to your FastFare wallet.
                                </p>
                                <div className="bg-green-50 p-4 rounded-lg mb-6">
                                    <p className="text-sm font-medium text-green-800">New Wallet Balance</p>
                                    <p className="text-3xl font-bold text-green-600">₹{details?.new_balance?.toLocaleString()}</p>
                                </div>
                                <p className="text-xs text-muted-foreground mb-6">Order ID: {orderId}</p>
                                <div className="grid grid-cols-2 gap-3">
                                    <Button variant="outline" onClick={() => navigate('/billing/recharge')}>Recharge More</Button>
                                    <Button onClick={() => navigate('/dashboard')}>Go to Dashboard</Button>
                                </div>
                            </div>
                        )}

                        {status === 'pending' && retries >= 8 && (
                            <div className="py-4">
                                <Clock className="h-16 w-16 text-yellow-500 mx-auto mb-6" />
                                <h2 className="text-2xl font-bold mb-2">Verification Pending</h2>
                                <p className="text-muted-foreground mb-6">
                                    Your payment is being processed. If the amount was deducted from your account, it will be credited to your wallet within a few minutes. If not credited within 15 minutes, please contact support.
                                </p>
                                <p className="text-xs text-muted-foreground mb-6">Order ID: {orderId}</p>
                                <div className="grid grid-cols-2 gap-3">
                                    <Button variant="outline" onClick={handleRetry}><RotateCw className="w-4 h-4 mr-2" /> Check Again</Button>
                                    <Button onClick={() => navigate('/billing')}>Go to Billing</Button>
                                </div>
                            </div>
                        )}

                        {status === 'failed' && (
                            <div className="py-4">
                                <XCircle className="h-16 w-16 text-red-500 mx-auto mb-6" />
                                <h2 className="text-2xl font-bold mb-2">Payment Failed</h2>
                                <p className="text-muted-foreground mb-6">
                                    Your payment could not be completed. No amount has been deducted. Please try again.
                                </p>
                                <p className="text-xs text-muted-foreground mb-6 text-red-400">Reason: {details?.reason || 'Payment cancelled or expired'}</p>
                                <div className="grid grid-cols-2 gap-3">
                                    <Button variant="outline" className="border-red-200 text-red-600 hover:bg-red-50" onClick={() => navigate('/billing/recharge')}>Try Again</Button>
                                    <Button onClick={() => navigate('/billing')}>Go to Billing</Button>
                                </div>
                            </div>
                        )}

                        {status === 'network_error' && (
                            <div className="py-4">
                                <AlertTriangle className="h-16 w-16 text-orange-500 mx-auto mb-6" />
                                <h2 className="text-2xl font-bold mb-2">Unable to Verify</h2>
                                <p className="text-muted-foreground mb-6">
                                    We could not verify your payment status due to a network error. If your payment was successful, your wallet will be credited automatically. Please check your wallet balance in a few minutes.
                                </p>
                                <p className="text-xs text-muted-foreground mb-6">Order ID: {orderId}</p>
                                <div className="grid grid-cols-2 gap-3">
                                    <Button variant="outline" onClick={handleRetry}><RotateCw className="w-4 h-4 mr-2"/> Refresh Page</Button>
                                    <Button onClick={() => window.location.href = 'mailto:support@fastfare.in'}>Contact Support</Button>
                                </div>
                            </div>
                        )}

                    </div>
                </div>
                <Footer />
            </div>
        </DashboardLayout>
    );
};

export default RechargeStatus;
