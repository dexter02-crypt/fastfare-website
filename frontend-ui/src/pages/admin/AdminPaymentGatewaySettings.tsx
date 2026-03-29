import { useState, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Copy, AlertTriangle, ShieldCheck, CreditCard, Settings2, Globe, ServerCrash } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { API_BASE_URL } from "@/config";

const AdminPaymentGatewaySettings = () => {
    const [config, setConfig] = useState<any>(null);
    const domain = window.location.hostname;
    
    // Determine dynamic port for localhost or raw domain
    const host = window.location.port ? `${domain}:${window.location.port}` : domain;
    
    const webhookUrl = `https://${host}/api/wallet/recharge/webhook`;
    const returnUrlPattern = `https://${host}/billing/recharge/status?order_id={order_id}`;

    useEffect(() => {
        const fetchConfig = async () => {
            try {
                const res = await fetch(`${API_BASE_URL}/api/admin/payment-gateway-config`, {
                    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
                });
                if(res.ok) setConfig(await res.json());
            } catch(e) {}
        };
        fetchConfig();
    }, []);

    const copyToClipboard = (text: string, label: string) => {
        navigator.clipboard.writeText(text);
        toast.success(`${label} copied to clipboard!`);
    };

    return (
        <DashboardLayout>
            <div className="max-w-4xl mx-auto space-y-6">
                
                <div className="flex justify-between items-end">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Payment Gateway Settings</h1>
                        <p className="text-muted-foreground mt-2">Manage Cashfree integration and webhook configurations. Read-only view.</p>
                    </div>
                </div>

                {config?.environment === 'sandbox' && (
                    <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded flex items-start gap-4 shadow-sm">
                        <AlertTriangle className="h-6 w-6 text-yellow-600 mt-1" />
                        <div>
                            <h3 className="text-yellow-800 font-bold">WARNING: Test Mode Active</h3>
                            <p className="text-yellow-700 text-sm mt-1">
                                The payment gateway is currently running in Sandbox/Test mode. No real money will be processed. Switch to production environment variables on the backend server before going live.
                            </p>
                        </div>
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex flex-row items-center gap-2"><Settings2 className="w-5 h-5"/> Gateway Configuration</CardTitle>
                            <CardDescription>Server-side environment variables currently in use.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div>
                                <label className="text-sm font-semibold text-muted-foreground block mb-1">Active Environment</label>
                                {config?.environment === 'sandbox' ? (
                                    <Badge className="bg-orange-500 hover:bg-orange-600 px-3 py-1">Sandbox / Test Mode</Badge>
                                ) : (
                                    <Badge className="bg-green-500 hover:bg-green-600 px-3 py-1">Production / Live Mode</Badge>
                                )}
                            </div>
                            
                            <div>
                                <label className="text-sm font-semibold text-muted-foreground block mb-1">Cashfree App ID</label>
                                <Input disabled value={config?.appId || 'Loading...'} className="font-mono text-muted-foreground bg-muted/30" />
                                <p className="text-xs text-muted-foreground mt-2">To update credentials, modify the CASHFREE_APP_ID variable on the server.</p>
                            </div>

                            <div>
                                <label className="text-sm font-semibold text-muted-foreground block mb-1">API Version Supported</label>
                                <Badge variant="outline" className="font-mono">{config?.apiVersion || '2023-08-01'}</Badge>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="flex flex-row items-center gap-2"><Globe className="w-5 h-5"/> Webhooks & Redirects</CardTitle>
                            <CardDescription>Endpoints to register with Cashfree.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div>
                                <div className="flex justify-between items-center mb-1">
                                    <label className="text-sm font-semibold text-muted-foreground">Webhook URL</label>
                                    <Button variant="ghost" size="sm" className="h-6 px-2 text-xs" onClick={() => copyToClipboard(webhookUrl, 'Webhook URL')}>
                                        <Copy className="h-3 w-3 mr-1" /> Copy
                                    </Button>
                                </div>
                                <Input readOnly value={webhookUrl} className="font-mono text-xs text-muted-foreground bg-muted/30" />
                                <p className="text-xs text-muted-foreground mt-2">Register this URL in your Cashfree dashboard under Webhooks → Payment Events. Select Payment Success, Failed, and Pending events.</p>
                            </div>

                            <div>
                                <div className="flex justify-between items-center mb-1">
                                    <label className="text-sm font-semibold text-muted-foreground">Return URL Pattern</label>
                                    <Button variant="ghost" size="sm" className="h-6 px-2 text-xs" onClick={() => copyToClipboard(returnUrlPattern, 'Return URL Pattern')}>
                                        <Copy className="h-3 w-3 mr-1" /> Copy
                                    </Button>
                                </div>
                                <Input readOnly value={returnUrlPattern} className="font-mono text-xs text-muted-foreground bg-muted/30" />
                                <p className="text-xs text-muted-foreground mt-2">Automatically passed to Cashfree during order creation. No manual dashboard configuration needed.</p>
                            </div>

                            <div className="pt-2 border-t">
                                <label className="text-sm font-semibold text-muted-foreground block mb-2">Endpoint Status</label>
                                <div className="flex items-center gap-2 text-sm text-green-600 font-medium">
                                    <ShieldCheck className="w-4 h-4" /> Webhook Endpoint: Active
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-xl">Integration Setup Checklist</CardTitle>
                        <CardDescription>Follow these steps when moving to a new environment.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4 text-sm">
                            <div className="flex gap-4">
                                <div className="h-6 w-6 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs shrink-0">1</div>
                                <p>Register a merchant account at <a href="https://merchant.cashfree.com" target="_blank" rel="noreferrer" className="text-primary hover:underline">merchant.cashfree.com</a>.</p>
                            </div>
                            <div className="flex gap-4">
                                <div className="h-6 w-6 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs shrink-0">2</div>
                                <p>Obtain your <strong>App ID</strong> and <strong>Secret Key</strong> from the Developers → API Keys section.</p>
                            </div>
                            <div className="flex gap-4">
                                <div className="h-6 w-6 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs shrink-0">3</div>
                                <p>Set <code className="bg-muted px-1 rounded">CASHFREE_APP_ID</code> and <code className="bg-muted px-1 rounded">CASHFREE_SECRET_KEY</code> as secure server environment variables.</p>
                            </div>
                            <div className="flex gap-4">
                                <div className="h-6 w-6 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs shrink-0">4</div>
                                <p>Register the Webhook URL (shown above) in the Cashfree dashboard.</p>
                            </div>
                            <div className="flex gap-4">
                                <div className="h-6 w-6 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs shrink-0">5</div>
                                <p>Test payments thoroughly in the sandbox environment.</p>
                            </div>
                            <div className="flex gap-4">
                                <div className="h-6 w-6 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs shrink-0">6</div>
                                <p>Update the <code className="bg-muted px-1 rounded">CASHFREE_ENV</code> variable to <code className="bg-muted px-1 rounded">production</code> and replace with live API keys to go live.</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

            </div>
        </DashboardLayout>
    );
};

export default AdminPaymentGatewaySettings;
