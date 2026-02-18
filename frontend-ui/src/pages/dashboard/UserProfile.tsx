import { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Switch } from "@/components/ui/switch";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import {
  User, Mail, Phone, Building2, MapPin, Shield, Bell, Key,
  Save, LogOut, Smartphone, Globe, Clock, Landmark
} from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

import { authApi } from "@/lib/api";

const UserProfile = () => {
  const user = authApi.getCurrentUser();

  const [profile, setProfile] = useState({
    firstName: user?.contactPerson?.split(" ")[0] || "User",
    lastName: user?.contactPerson?.split(" ").slice(1).join(" ") || "",
    email: user?.email || "user@example.com",
    phone: user?.phone || "",
    role: user?.role === 'admin' ? "Admin" : user?.role === 'shipment_partner' ? "Partner" : "Business User",
    company: user?.businessName || "FastFare User",
    department: "Operations",
    timezone: "Asia/Kolkata",
  });

  const [notifications, setNotifications] = useState({
    emailShipment: true,
    emailMarketing: false,
    smsDelivery: true,
    smsAlerts: true,
    pushUpdates: true,
    pushPromo: false,
  });

  const [bankDetails, setBankDetails] = useState({
    holderName: "",
    bankName: "",
    accountNumber: "",
    ifscCode: "",
    accountType: "savings",
  });
  const [savingBank, setSavingBank] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Profile Settings</h1>
          <p className="text-muted-foreground">Manage your account and preferences</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Profile Card */}
          <Card className="lg:col-span-1">
            <CardContent className="pt-6">
              <div className="flex flex-col items-center text-center">
                <Avatar className="h-24 w-24">
                  <AvatarFallback className="text-2xl bg-primary/10 text-primary font-semibold">
                    {(profile.firstName?.[0] || "") + (profile.lastName?.[0] || "")}
                  </AvatarFallback>
                </Avatar>
                <h3 className="mt-4 text-xl font-semibold">{profile.firstName} {profile.lastName}</h3>
                <p className="text-sm text-muted-foreground">{profile.email}</p>
                <Badge className={`mt-2 ${profile.role === 'Partner' ? 'bg-blue-600' : profile.role === 'Admin' ? 'bg-purple-600' : 'bg-gray-600'}`}>
                  {profile.role}
                </Badge>

                <div className="w-full mt-6 pt-6 border-t space-y-3 text-left">
                  <div className="flex items-center gap-3 text-sm">
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                    <span>{profile.company}</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span>{profile.department}</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span>IST (UTC+5:30)</span>
                  </div>
                </div>

                <Button variant="outline" className="w-full mt-6 gap-2 text-red-500 hover:text-red-600">
                  <LogOut className="h-4 w-4" />
                  Sign Out
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Settings Tabs */}
          <div className="lg:col-span-3">
            <Tabs defaultValue="personal" className="space-y-6">
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="personal">Personal</TabsTrigger>
                <TabsTrigger value="billing">Billing</TabsTrigger>
                <TabsTrigger value="security">Security</TabsTrigger>
                <TabsTrigger value="notifications">Notifications</TabsTrigger>
                <TabsTrigger value="sessions">Sessions</TabsTrigger>
              </TabsList>

              <TabsContent value="personal">
                <Card>
                  <CardHeader>
                    <CardTitle>Personal Information</CardTitle>
                    <CardDescription>Update your personal details</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">First Name</label>
                        <Input
                          value={profile.firstName}
                          onChange={(e) => setProfile({ ...profile, firstName: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Last Name</label>
                        <Input
                          value={profile.lastName}
                          onChange={(e) => setProfile({ ...profile, lastName: e.target.value })}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Email Address</label>
                      <Input type="email" value={profile.email} disabled />
                      <p className="text-xs text-muted-foreground">Contact support to change your email</p>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Phone Number</label>
                      <Input
                        value={profile.phone}
                        onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                      />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Company</label>
                        <Input value={profile.company} disabled />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Department</label>
                        <Input
                          value={profile.department}
                          onChange={(e) => setProfile({ ...profile, department: e.target.value })}
                        />
                      </div>
                    </div>
                    <Button className="gap-2 gradient-primary">
                      <Save className="h-4 w-4" />
                      Save Changes
                    </Button>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="billing">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Landmark className="h-5 w-5" />
                      Billing Method
                    </CardTitle>
                    <CardDescription>Add your bank account for payouts and billing</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Account Holder Name</label>
                        <Input
                          placeholder="Enter full name as on bank account"
                          value={bankDetails.holderName}
                          onChange={(e) => setBankDetails({ ...bankDetails, holderName: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Bank Name</label>
                        <Input
                          placeholder="e.g. HDFC Bank, SBI, ICICI"
                          value={bankDetails.bankName}
                          onChange={(e) => setBankDetails({ ...bankDetails, bankName: e.target.value })}
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Account Number</label>
                        <Input
                          placeholder="Enter account number"
                          value={bankDetails.accountNumber}
                          onChange={(e) => setBankDetails({ ...bankDetails, accountNumber: e.target.value.replace(/\D/g, '') })}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">IFSC / SWIFT Code</label>
                        <Input
                          placeholder="e.g. HDFC0001234"
                          value={bankDetails.ifscCode}
                          onChange={(e) => setBankDetails({ ...bankDetails, ifscCode: e.target.value.toUpperCase() })}
                        />
                      </div>
                    </div>
                    <div className="space-y-2 max-w-xs">
                      <label className="text-sm font-medium">Account Type</label>
                      <Select
                        value={bankDetails.accountType}
                        onValueChange={(val) => setBankDetails({ ...bankDetails, accountType: val })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="savings">Savings Account</SelectItem>
                          <SelectItem value="current">Current Account</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <Button
                      className="gap-2 gradient-primary"
                      disabled={savingBank}
                      onClick={() => {
                        if (!bankDetails.holderName || !bankDetails.bankName || !bankDetails.accountNumber || !bankDetails.ifscCode) {
                          return;
                        }
                        setSavingBank(true);
                        setTimeout(() => {
                          setSavingBank(false);
                        }, 1000);
                      }}
                    >
                      <Save className="h-4 w-4" />
                      {savingBank ? "Saving..." : "Save Bank Details"}
                    </Button>

                    {/* Security Notice */}
                    <div className="flex items-start gap-3 p-4 rounded-lg bg-green-50 border border-green-200">
                      <Shield className="h-5 w-5 text-green-600 mt-0.5 shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-green-800">Your banking information is secure</p>
                        <p className="text-xs text-green-600 mt-1">
                          All banking details are encrypted using AES-256 encryption and stored securely. We never share your financial information with third parties.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="security">
                <div className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Change Password</CardTitle>
                      <CardDescription>Update your password regularly for security</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Current Password</label>
                        <Input type="password" placeholder="Enter current password" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">New Password</label>
                        <Input type="password" placeholder="Enter new password" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Confirm New Password</label>
                        <Input type="password" placeholder="Confirm new password" />
                      </div>
                      <Button className="gradient-primary">Update Password</Button>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Two-Factor Authentication</CardTitle>
                      <CardDescription>Add an extra layer of security to your account</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between p-4 rounded-lg border">
                        <div className="flex items-center gap-4">
                          <div className="h-12 w-12 rounded-lg bg-green-500/10 flex items-center justify-center">
                            <Shield className="h-6 w-6 text-green-500" />
                          </div>
                          <div>
                            <p className="font-medium">Authenticator App</p>
                            <p className="text-sm text-muted-foreground">Use Google Authenticator or similar</p>
                          </div>
                        </div>
                        <Badge variant="outline" className="text-green-500">Enabled</Badge>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="notifications">
                <Card>
                  <CardHeader>
                    <CardTitle>Notification Preferences</CardTitle>
                    <CardDescription>Manage how you receive updates</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div>
                      <h4 className="font-medium mb-4 flex items-center gap-2">
                        <Mail className="h-4 w-4" />
                        Email Notifications
                      </h4>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium">Shipment Updates</p>
                            <p className="text-xs text-muted-foreground">Receive updates about your shipments</p>
                          </div>
                          <Switch
                            checked={notifications.emailShipment}
                            onCheckedChange={(checked) => setNotifications({ ...notifications, emailShipment: checked })}
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium">Marketing & Promotions</p>
                            <p className="text-xs text-muted-foreground">News, offers, and product updates</p>
                          </div>
                          <Switch
                            checked={notifications.emailMarketing}
                            onCheckedChange={(checked) => setNotifications({ ...notifications, emailMarketing: checked })}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="border-t pt-6">
                      <h4 className="font-medium mb-4 flex items-center gap-2">
                        <Smartphone className="h-4 w-4" />
                        SMS Notifications
                      </h4>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium">Delivery Updates</p>
                            <p className="text-xs text-muted-foreground">SMS alerts for delivery status</p>
                          </div>
                          <Switch
                            checked={notifications.smsDelivery}
                            onCheckedChange={(checked) => setNotifications({ ...notifications, smsDelivery: checked })}
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium">Critical Alerts</p>
                            <p className="text-xs text-muted-foreground">Important account and security alerts</p>
                          </div>
                          <Switch
                            checked={notifications.smsAlerts}
                            onCheckedChange={(checked) => setNotifications({ ...notifications, smsAlerts: checked })}
                          />
                        </div>
                      </div>
                    </div>

                    <Button className="gradient-primary">Save Preferences</Button>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="sessions">
                <Card>
                  <CardHeader>
                    <CardTitle>Active Sessions</CardTitle>
                    <CardDescription>Manage your logged-in devices</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {[
                      { device: "Chrome on Windows", location: "Mumbai, India", current: true, time: "Active now" },
                      { device: "Safari on iPhone", location: "Mumbai, India", current: false, time: "2 hours ago" },
                      { device: "Firefox on MacOS", location: "Delhi, India", current: false, time: "3 days ago" },
                    ].map((session, index) => (
                      <div key={index} className="flex items-center justify-between p-4 rounded-lg border">
                        <div className="flex items-center gap-4">
                          <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
                            <Globe className="h-5 w-5 text-muted-foreground" />
                          </div>
                          <div>
                            <p className="font-medium flex items-center gap-2">
                              {session.device}
                              {session.current && <Badge variant="secondary" className="text-xs">Current</Badge>}
                            </p>
                            <p className="text-sm text-muted-foreground">{session.location} • {session.time}</p>
                          </div>
                        </div>
                        {!session.current && (
                          <Button variant="ghost" size="sm" className="text-red-500">
                            Revoke
                          </Button>
                        )}
                      </div>
                    ))}
                    <Button variant="outline" className="w-full text-red-500">
                      Sign out all other sessions
                    </Button>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default UserProfile;
