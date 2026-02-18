import { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import DashboardLayout from "@/components/DashboardLayout";
import {
  Settings, Bell, Shield, Key, Globe, Building2, Users,
  CreditCard, Package, Truck, Save, RefreshCw, Smartphone,
  Lock, Monitor, Laptop, AlertTriangle, CheckCircle, X, Loader2
} from "lucide-react";
import { toast } from "sonner";

// Mock active sessions data
const mockSessions = [
  {
    id: "1",
    device: "Chrome on Windows",
    icon: Monitor,
    location: "Mumbai, India",
    ip: "192.168.1.100",
    lastActive: "Active now",
    isCurrent: true
  },
  {
    id: "2",
    device: "Safari on MacBook",
    icon: Laptop,
    location: "Delhi, India",
    ip: "192.168.2.55",
    lastActive: "2 hours ago",
    isCurrent: false
  },
  {
    id: "3",
    device: "FastFare Mobile App",
    icon: Smartphone,
    location: "Pune, India",
    ip: "192.168.3.200",
    lastActive: "Yesterday",
    isCurrent: false
  }
];

const SettingsPage = () => {
  const [notifications, setNotifications] = useState({
    emailShipment: true,
    emailBilling: true,
    smsDelivery: true,
    smsAlerts: false,
    whatsappUpdates: true,
  });

  const [shippingSettings, setShippingSettings] = useState({
    defaultCarrier: "auto",
    defaultPackage: "box",
    insurance: true
  });

  const [keys, setKeys] = useState({
    production: "ff_prod_" + Math.random().toString(36).substring(7),
    test: "ff_test_" + Math.random().toString(36).substring(7)
  });

  // Security state
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [twoFactorDialog, setTwoFactorDialog] = useState(false);
  const [twoFactorStep, setTwoFactorStep] = useState(1);
  const [otpCode, setOtpCode] = useState("");
  const [twoFactorLoading, setTwoFactorLoading] = useState(false);

  const [passwordDialog, setPasswordDialog] = useState(false);
  const [passwordData, setPasswordData] = useState({
    current: "",
    new: "",
    confirm: ""
  });

  const [sessionsDialog, setSessionsDialog] = useState(false);
  const [sessions, setSessions] = useState(mockSessions);

  const handleSave = () => {
    toast.success("Settings saved successfully");
  };

  const regenerateKey = (type: 'production' | 'test') => {
    const newKey = `ff_${type === 'production' ? 'prod' : 'test'}_${Math.random().toString(36).substring(7)}${Math.random().toString(36).substring(7)}`;
    setKeys(prev => ({ ...prev, [type]: newKey }));
    toast.info(`New ${type} API key generated`);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  };

  // 2FA Handlers
  const handleEnable2FA = () => {
    setTwoFactorStep(1);
    setOtpCode("");
    setTwoFactorDialog(true);
  };

  const handleVerify2FA = async () => {
    if (otpCode.length !== 6) {
      toast.error("Please enter a valid 6-digit code");
      return;
    }
    setTwoFactorLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      setTwoFactorEnabled(true);
      setTwoFactorDialog(false);
      toast.success("Two-Factor Authentication enabled successfully!");
    } catch {
      toast.error("Failed to enable 2FA. Please try again.");
    } finally {
      setTwoFactorLoading(false);
    }
  };

  const handleDisable2FA = async () => {
    setTwoFactorLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 800));
      setTwoFactorEnabled(false);
      toast.success("Two-Factor Authentication disabled");
    } catch {
      toast.error("Failed to disable 2FA. Please try again.");
    } finally {
      setTwoFactorLoading(false);
    }
  };

  // Password Change Handler
  const handleChangePassword = () => {
    if (!passwordData.current) {
      toast.error("Please enter your current password");
      return;
    }
    if (passwordData.new.length < 8) {
      toast.error("New password must be at least 8 characters");
      return;
    }
    if (passwordData.new !== passwordData.confirm) {
      toast.error("New passwords do not match");
      return;
    }

    // Simulate API call
    toast.success("Password changed successfully!");
    setPasswordDialog(false);
    setPasswordData({ current: "", new: "", confirm: "" });
  };

  // Session Management
  const handleTerminateSession = (sessionId: string) => {
    setSessions(prev => prev.filter(s => s.id !== sessionId));
    toast.success("Session terminated successfully");
  };

  const handleTerminateAllOther = () => {
    setSessions(prev => prev.filter(s => s.isCurrent));
    toast.success("All other sessions terminated");
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Settings</h1>
          <p className="text-muted-foreground">Manage your account and organization preferences</p>
        </div>

        <Tabs defaultValue="general" className="space-y-6">
          <TabsList className="flex-wrap h-auto gap-2 bg-muted/60 p-1">
            <TabsTrigger value="general" className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm">
              <Settings className="h-4 w-4" />
              General
            </TabsTrigger>
            <TabsTrigger value="organization" className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm">
              <Building2 className="h-4 w-4" />
              Organization
            </TabsTrigger>
            <TabsTrigger value="notifications" className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm">
              <Bell className="h-4 w-4" />
              Notifications
            </TabsTrigger>
            <TabsTrigger value="shipping" className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm">
              <Package className="h-4 w-4" />
              Shipping
            </TabsTrigger>
            <TabsTrigger value="security" className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm">
              <Shield className="h-4 w-4" />
              Security
            </TabsTrigger>
            <TabsTrigger value="api" className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm">
              <Key className="h-4 w-4" />
              API
            </TabsTrigger>
          </TabsList>

          <TabsContent value="general">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>General Settings</CardTitle>
                  <CardDescription>Basic account preferences</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Language</label>
                      <Select defaultValue="en">
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="en">English</SelectItem>
                          <SelectItem value="hi">Hindi</SelectItem>
                          <SelectItem value="ta">Tamil</SelectItem>
                          <SelectItem value="te">Telugu</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Timezone</label>
                      <Select defaultValue="ist">
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ist">IST (UTC+5:30)</SelectItem>
                          <SelectItem value="utc">UTC</SelectItem>
                          <SelectItem value="pst">PST (UTC-8)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Date Format</label>
                      <Select defaultValue="dd-mm-yyyy">
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="dd-mm-yyyy">DD-MM-YYYY</SelectItem>
                          <SelectItem value="mm-dd-yyyy">MM-DD-YYYY</SelectItem>
                          <SelectItem value="yyyy-mm-dd">YYYY-MM-DD</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Currency</label>
                      <Select defaultValue="inr">
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="inr">INR (₹)</SelectItem>
                          <SelectItem value="usd">USD ($)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <Button className="gap-2 gradient-primary" onClick={handleSave}>
                    <Save className="h-4 w-4" />
                    Save Changes
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="organization">
            <Card>
              <CardHeader>
                <CardTitle>Organization Details</CardTitle>
                <CardDescription>Your company information</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Company Name</label>
                    <Input defaultValue="Acme Corp" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">GSTIN</label>
                    <Input defaultValue="22AAAAA0000A1Z5" />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Address</label>
                  <Input defaultValue="123 Business Park, Mumbai 400001" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">City</label>
                    <Input defaultValue="Mumbai" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">State</label>
                    <Input defaultValue="Maharashtra" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">PIN Code</label>
                    <Input defaultValue="400001" />
                  </div>
                </div>
                <Button className="gap-2 gradient-primary" onClick={handleSave}>
                  <Save className="h-4 w-4" />
                  Update Organization
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="notifications">
            <Card>
              <CardHeader>
                <CardTitle>Notification Preferences</CardTitle>
                <CardDescription>Choose how you want to be notified</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <h4 className="font-medium">Email Notifications</h4>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Shipment Updates</p>
                        <p className="text-sm text-muted-foreground">Receive email updates for shipments</p>
                      </div>
                      <Switch checked={notifications.emailShipment} onCheckedChange={(checked) => setNotifications({ ...notifications, emailShipment: checked })} />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Billing Notifications</p>
                        <p className="text-sm text-muted-foreground">Invoices and payment reminders</p>
                      </div>
                      <Switch checked={notifications.emailBilling} onCheckedChange={(checked) => setNotifications({ ...notifications, emailBilling: checked })} />
                    </div>
                  </div>
                </div>
                <div className="space-y-4 border-t pt-6">
                  <h4 className="font-medium">SMS Notifications</h4>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Delivery Updates</p>
                        <p className="text-sm text-muted-foreground">SMS for delivery status</p>
                      </div>
                      <Switch checked={notifications.smsDelivery} onCheckedChange={(checked) => setNotifications({ ...notifications, smsDelivery: checked })} />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Critical Alerts</p>
                        <p className="text-sm text-muted-foreground">Important account alerts</p>
                      </div>
                      <Switch checked={notifications.smsAlerts} onCheckedChange={(checked) => setNotifications({ ...notifications, smsAlerts: checked })} />
                    </div>
                  </div>
                </div>
                <div className="space-y-4 border-t pt-6">
                  <h4 className="font-medium">WhatsApp Notifications</h4>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Shipment Updates</p>
                      <p className="text-sm text-muted-foreground">Receive updates via WhatsApp</p>
                    </div>
                    <Switch checked={notifications.whatsappUpdates} onCheckedChange={(checked) => setNotifications({ ...notifications, whatsappUpdates: checked })} />
                  </div>
                </div>
                <Button className="gap-2 gradient-primary" onClick={handleSave}>
                  <Save className="h-4 w-4" />
                  Save Preferences
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="shipping">
            <Card>
              <CardHeader>
                <CardTitle>Shipping Preferences</CardTitle>
                <CardDescription>Default shipping settings</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Default Carrier</label>
                    <Select
                      value={shippingSettings.defaultCarrier}
                      onValueChange={(val) => setShippingSettings({ ...shippingSettings, defaultCarrier: val })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="auto">Auto Select (Best Rate)</SelectItem>
                        <SelectItem value="bluedart">BlueDart</SelectItem>
                        <SelectItem value="delhivery">Delhivery</SelectItem>
                        <SelectItem value="dtdc">DTDC</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Default Package Type</label>
                    <Select
                      value={shippingSettings.defaultPackage}
                      onValueChange={(val) => setShippingSettings({ ...shippingSettings, defaultPackage: val })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="box">Box</SelectItem>
                        <SelectItem value="envelope">Envelope</SelectItem>
                        <SelectItem value="custom">Custom</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="flex items-center justify-between p-4 rounded-lg border">
                  <div>
                    <p className="font-medium">Enable Shipment Insurance</p>
                    <p className="text-sm text-muted-foreground">Auto-insure shipments over ₹5,000</p>
                  </div>
                  <Switch
                    checked={shippingSettings.insurance}
                    onCheckedChange={(checked) => setShippingSettings({ ...shippingSettings, insurance: checked })}
                  />
                </div>
                <Button className="gap-2 gradient-primary" onClick={handleSave}>
                  <Save className="h-4 w-4" />
                  Save Settings
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="security">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Security Settings</CardTitle>
                  <CardDescription>Manage your account security</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Two-Factor Authentication */}
                  <div className="flex items-center justify-between p-4 rounded-lg border">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-full ${twoFactorEnabled ? 'bg-green-100' : 'bg-gray-100'}`}>
                        <Smartphone className={`h-5 w-5 ${twoFactorEnabled ? 'text-green-600' : 'text-gray-600'}`} />
                      </div>
                      <div>
                        <p className="font-medium">Two-Factor Authentication</p>
                        <p className="text-sm text-muted-foreground">
                          {twoFactorEnabled ? 'Your account is protected with 2FA' : 'Add extra security to your account'}
                        </p>
                      </div>
                    </div>
                    {twoFactorEnabled ? (
                      <div className="flex items-center gap-2">
                        <Badge className="bg-green-100 text-green-800">Enabled</Badge>
                        <Button variant="outline" size="sm" onClick={handleDisable2FA} disabled={twoFactorLoading}>
                          {twoFactorLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Disable"}
                        </Button>
                      </div>
                    ) : (
                      <Button variant="outline" onClick={handleEnable2FA} disabled={twoFactorLoading}>
                        {twoFactorLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                        Enable 2FA
                      </Button>
                    )}
                  </div>

                  {/* Change Password */}
                  <div className="flex items-center justify-between p-4 rounded-lg border">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-full bg-blue-100">
                        <Lock className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-medium">Change Password</p>
                        <p className="text-sm text-muted-foreground">Update your password regularly</p>
                      </div>
                    </div>
                    <Button variant="outline" onClick={() => setPasswordDialog(true)}>Change</Button>
                  </div>

                  {/* Active Sessions */}
                  <div className="flex items-center justify-between p-4 rounded-lg border">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-full bg-purple-100">
                        <Monitor className="h-5 w-5 text-purple-600" />
                      </div>
                      <div>
                        <p className="font-medium">Active Sessions</p>
                        <p className="text-sm text-muted-foreground">{sessions.length} active session(s)</p>
                      </div>
                    </div>
                    <Button variant="outline" onClick={() => setSessionsDialog(true)}>Manage</Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="api">
            <Card>
              <CardHeader>
                <CardTitle>API Keys</CardTitle>
                <CardDescription>Manage your API access</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 rounded-lg border">
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-medium">Production API Key</p>
                    <Badge>Active</Badge>
                  </div>
                  <div className="flex gap-2">
                    <Input value={keys.production} readOnly className="font-mono bg-muted" />
                    <Button variant="outline" onClick={() => copyToClipboard(keys.production)}>Copy</Button>
                    <Button variant="outline" onClick={() => regenerateKey('production')} className="gap-2">
                      <RefreshCw className="h-4 w-4" />
                      Regenerate
                    </Button>
                  </div>
                </div>
                <div className="p-4 rounded-lg border">
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-medium">Test API Key</p>
                    <Badge variant="secondary">Sandbox</Badge>
                  </div>
                  <div className="flex gap-2">
                    <Input value={keys.test} readOnly className="font-mono bg-muted" />
                    <Button variant="outline" onClick={() => copyToClipboard(keys.test)}>Copy</Button>
                    <Button variant="outline" onClick={() => regenerateKey('test')} className="gap-2">
                      <RefreshCw className="h-4 w-4" />
                      Regenerate
                    </Button>
                  </div>
                </div>
                <Button className="gap-2">
                  <Key className="h-4 w-4" />
                  Generate New Key
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* 2FA Setup Dialog */}
      <Dialog open={twoFactorDialog} onOpenChange={setTwoFactorDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Enable Two-Factor Authentication</DialogTitle>
            <DialogDescription>
              Add an extra layer of security to your account
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {twoFactorStep === 1 && (
              <>
                <div className="text-center space-y-4">
                  <div className="mx-auto w-48 h-48 bg-gray-100 rounded-lg flex items-center justify-center">
                    <div className="text-center">
                      <Smartphone className="h-12 w-12 mx-auto text-gray-400 mb-2" />
                      <p className="text-sm text-muted-foreground">QR Code</p>
                      <p className="text-xs text-muted-foreground">(Scan with authenticator app)</p>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Scan this QR code with your authenticator app (Google Authenticator, Authy, etc.)
                  </p>
                  <div className="p-3 bg-muted rounded-lg">
                    <p className="text-xs text-muted-foreground mb-1">Or enter this code manually:</p>
                    <code className="font-mono text-sm">JBSW Y3DP EHPK 3PXP</code>
                  </div>
                </div>
                <Button className="w-full" onClick={() => setTwoFactorStep(2)}>
                  Continue
                </Button>
              </>
            )}

            {twoFactorStep === 2 && (
              <>
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground text-center">
                    Enter the 6-digit code from your authenticator app
                  </p>
                  <Input
                    placeholder="000000"
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    className="text-center text-2xl font-mono tracking-widest"
                    maxLength={6}
                  />
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" className="flex-1" onClick={() => setTwoFactorStep(1)} disabled={twoFactorLoading}>
                    Back
                  </Button>
                  <Button className="flex-1" onClick={handleVerify2FA} disabled={twoFactorLoading}>
                    {twoFactorLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                    Verify & Enable
                  </Button>
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Change Password Dialog */}
      <Dialog open={passwordDialog} onOpenChange={setPasswordDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Change Password</DialogTitle>
            <DialogDescription>
              Enter your current password and choose a new one
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Current Password</label>
              <Input
                type="password"
                placeholder="Enter current password"
                value={passwordData.current}
                onChange={(e) => setPasswordData({ ...passwordData, current: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">New Password</label>
              <Input
                type="password"
                placeholder="Enter new password"
                value={passwordData.new}
                onChange={(e) => setPasswordData({ ...passwordData, new: e.target.value })}
              />
              <p className="text-xs text-muted-foreground">Minimum 8 characters</p>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Confirm New Password</label>
              <Input
                type="password"
                placeholder="Confirm new password"
                value={passwordData.confirm}
                onChange={(e) => setPasswordData({ ...passwordData, confirm: e.target.value })}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setPasswordDialog(false)}>Cancel</Button>
            <Button onClick={handleChangePassword}>Change Password</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Active Sessions Dialog */}
      <Dialog open={sessionsDialog} onOpenChange={setSessionsDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Active Sessions</DialogTitle>
            <DialogDescription>
              Manage devices where you're currently logged in
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            {sessions.map((session) => (
              <div key={session.id} className="flex items-center justify-between p-3 rounded-lg border">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-full ${session.isCurrent ? 'bg-green-100' : 'bg-gray-100'}`}>
                    <session.icon className={`h-5 w-5 ${session.isCurrent ? 'text-green-600' : 'text-gray-600'}`} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{session.device}</p>
                      {session.isCurrent && <Badge className="text-xs bg-green-100 text-green-800">Current</Badge>}
                    </div>
                    <p className="text-sm text-muted-foreground">{session.location} • {session.ip}</p>
                    <p className="text-xs text-muted-foreground">{session.lastActive}</p>
                  </div>
                </div>
                {!session.isCurrent && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    onClick={() => handleTerminateSession(session.id)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
          </div>

          <DialogFooter>
            {sessions.length > 1 && (
              <Button variant="outline" className="text-red-600" onClick={handleTerminateAllOther}>
                <AlertTriangle className="h-4 w-4 mr-2" />
                Terminate All Other Sessions
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default SettingsPage;

