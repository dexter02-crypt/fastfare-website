import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import {
  ArrowLeft, ArrowRight, Building2, Wallet, CheckCircle, Info, CreditCard, Smartphone, Landmark
} from "lucide-react";

const rechargeOptions = [
  { amount: 2000, bonus: 500, popular: true },
  { amount: 5000, bonus: 0, popular: false },
  { amount: 10000, bonus: 0, popular: false },
];

const paymentMethods = [
  { id: "upi", name: "UPI", icon: Smartphone },
  { id: "card", name: "Card", icon: CreditCard },
  { id: "netbanking", name: "Net Banking", icon: Landmark },
];

const FinancialSetup = () => {
  const navigate = useNavigate();
  const [accountHolder, setAccountHolder] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [ifscCode, setIfscCode] = useState("");
  const [bankVerified, setBankVerified] = useState(false);
  const [selectedRecharge, setSelectedRecharge] = useState(2000);
  const [customAmount, setCustomAmount] = useState("");
  const [selectedPayment, setSelectedPayment] = useState("upi");

  const steps = [
    { id: 1, name: "ACCOUNT", completed: true },
    { id: 2, name: "KYC VERIFIED", completed: true },
    { id: 3, name: "BANK & WALLET", current: true },
    { id: 4, name: "DASHBOARD", completed: false },
  ];

  const handleCompleteSetup = () => {
    navigate("/dashboard");
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />

      <main className="flex-1 container py-8">
        {/* Stepper */}
        <div className="flex items-center justify-center gap-0 mb-8">
          {steps.map((step, index) => (
            <div key={step.id} className="flex items-center">
              <div className="flex flex-col items-center">
                <div
                  className={`h-10 w-10 rounded-full flex items-center justify-center text-sm font-semibold ${step.completed
                      ? "bg-green-500 text-white"
                      : step.current
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground border-2"
                    }`}
                >
                  {step.completed ? <CheckCircle className="h-5 w-5" /> : step.id}
                </div>
                <span
                  className={`text-xs mt-2 font-medium ${step.current ? "text-primary" : step.completed ? "text-green-600" : "text-muted-foreground"
                    }`}
                >
                  {step.name}
                </span>
              </div>
              {index < steps.length - 1 && (
                <div
                  className={`h-0.5 w-20 mx-2 ${step.completed ? "bg-green-500" : "bg-muted"
                    }`}
                />
              )}
            </div>
          ))}
        </div>

        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold">Financial Setup</h1>
          <p className="text-muted-foreground">
            Step 3: Connect your bank for payouts and initialize your wallet for operations.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Bank Account Verification */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Building2 className="h-5 w-5 text-primary" />
                  <CardTitle className="text-lg">Bank Account Verification</CardTitle>
                </div>
                {bankVerified && (
                  <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  </div>
                )}
              </div>
              <CardDescription>
                We'll deposit ₹1 to verify ownership instantly.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert className="bg-blue-50 border-blue-200">
                <Info className="h-4 w-4 text-blue-500" />
                <AlertDescription className="text-blue-700">
                  <strong>Penny Drop Verification</strong>
                  <br />
                  Ensure the name below matches your bank records exactly for successful verification.
                </AlertDescription>
              </Alert>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Account Holder Name</Label>
                  <Input
                    value={accountHolder}
                    onChange={(e) => setAccountHolder(e.target.value)}
                    placeholder="Enter account holder name"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Account Number</Label>
                    <div className="relative">
                      <Input
                        value={accountNumber}
                        onChange={(e) => setAccountNumber(e.target.value)}
                        placeholder="Enter account number"
                        className="pr-10"
                      />
                      {bankVerified && (
                        <CheckCircle className="h-5 w-5 text-green-500 absolute right-3 top-1/2 -translate-y-1/2" />
                      )}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>IFSC Code</Label>
                    <div className="relative">
                      <Input
                        value={ifscCode}
                        onChange={(e) => setIfscCode(e.target.value.toUpperCase())}
                        placeholder="Enter IFSC code"
                        className="pr-16"
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        className="absolute right-1 top-1/2 -translate-y-1/2 text-primary h-7"
                      >
                        Find
                      </Button>
                    </div>
                  </div>
                </div>

                {bankVerified && (
                  <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded bg-blue-600 flex items-center justify-center text-white font-bold text-sm">
                        HDFC
                      </div>
                      <div>
                        <p className="font-medium text-sm">HDFC Bank Ltd.</p>
                        <p className="text-xs text-muted-foreground">
                          Koramangala Branch, Bangalore
                        </p>
                      </div>
                    </div>
                    <Badge className="bg-green-100 text-green-700 hover:bg-green-100">
                      VERIFIED
                    </Badge>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Wallet Setup */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <Wallet className="h-5 w-5 text-primary" />
                <CardTitle className="text-lg">FastFare Wallet Setup</CardTitle>
              </div>
              <CardDescription>
                Prepaid wallet for shipping labels & platform fees.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* First Recharge Offer */}
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                <div className="flex items-start gap-3">
                  <div className="h-10 w-10 rounded-lg bg-amber-100 flex items-center justify-center shrink-0">
                    <Wallet className="h-5 w-5 text-amber-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-amber-800">First Recharge Offer!</h4>
                    <p className="text-sm text-amber-700">
                      Get <strong>₹500 bonus credits</strong> when you recharge for ₹2,000 or more today.
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Initial Recharge Amount</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-lg font-semibold">₹</span>
                  <Input
                    type="text"
                    value={customAmount || selectedRecharge}
                    onChange={(e) => {
                      setCustomAmount(e.target.value);
                      setSelectedRecharge(0);
                    }}
                    className="pl-8 text-2xl font-bold h-14"
                  />
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                {rechargeOptions.map((option) => (
                  <Button
                    key={option.amount}
                    variant={selectedRecharge === option.amount ? "default" : "outline"}
                    size="sm"
                    onClick={() => {
                      setSelectedRecharge(option.amount);
                      setCustomAmount("");
                    }}
                    className={`gap-1 ${selectedRecharge === option.amount
                        ? option.popular
                          ? "bg-amber-500 hover:bg-amber-600"
                          : ""
                        : ""
                      }`}
                  >
                    {option.popular && option.bonus > 0 && (
                      <span className="text-xs">₹{option.amount.toLocaleString()} + ₹{option.bonus} Bonus</span>
                    )}
                    {!option.popular && (
                      <span>₹{option.amount.toLocaleString()}</span>
                    )}
                  </Button>
                ))}
              </div>

              <div className="space-y-2">
                <Label>Payment Method</Label>
                <div className="grid grid-cols-3 gap-3">
                  {paymentMethods.map((method) => (
                    <Button
                      key={method.id}
                      variant={selectedPayment === method.id ? "default" : "outline"}
                      className={`flex flex-col h-auto py-4 ${selectedPayment === method.id ? "" : "hover:border-primary"
                        }`}
                      onClick={() => setSelectedPayment(method.id)}
                    >
                      {selectedPayment === method.id && (
                        <CheckCircle className="h-4 w-4 absolute top-2 right-2" />
                      )}
                      <method.icon className="h-6 w-6 mb-2" />
                      <span className="text-sm">{method.name}</span>
                    </Button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between mt-8 pt-6 border-t">
          <Button variant="ghost" onClick={() => navigate(-1)} className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to KYC
          </Button>
          <div className="flex items-center gap-4">
            {bankVerified && (
              <span className="text-sm text-green-600 flex items-center gap-2">
                <CheckCircle className="h-4 w-4" />
                Bank verification successful
              </span>
            )}
            <Button onClick={handleCompleteSetup} className="gap-2 gradient-primary">
              Complete Setup
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default FinancialSetup;
