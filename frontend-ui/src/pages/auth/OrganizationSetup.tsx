import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Building2, MapPin, Package, CreditCard, Check, ArrowRight, ArrowLeft } from "lucide-react";
import logo from "@/assets/logo.png";

const steps = [
  { id: 1, title: "Business Info", icon: Building2 },
  { id: 2, title: "Address", icon: MapPin },
  { id: 3, title: "Shipping Needs", icon: Package },
  { id: 4, title: "Billing", icon: CreditCard },
];

const OrganizationSetup = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    companyName: "",
    gstin: "",
    industry: "",
    employees: "",
    address: "",
    city: "",
    state: "",
    pincode: "",
    monthlyVolume: "",
    primaryService: "",
    destinations: [] as string[],
    billingEmail: "",
    panNumber: "",
    acceptTerms: false,
  });

  const updateFormData = (field: string, value: string | boolean | string[]) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleNext = () => {
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1);
    } else {
      navigate("/dashboard");
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Company Name *</label>
              <Input
                placeholder="Enter your company name"
                value={formData.companyName}
                onChange={(e) => updateFormData("companyName", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">GSTIN</label>
              <Input
                placeholder="22AAAAA0000A1Z5"
                value={formData.gstin}
                onChange={(e) => updateFormData("gstin", e.target.value.toUpperCase())}
                maxLength={15}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Industry</label>
                <Select
                  value={formData.industry}
                  onValueChange={(value) => updateFormData("industry", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select industry" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ecommerce">E-commerce</SelectItem>
                    <SelectItem value="retail">Retail</SelectItem>
                    <SelectItem value="manufacturing">Manufacturing</SelectItem>
                    <SelectItem value="healthcare">Healthcare</SelectItem>
                    <SelectItem value="fmcg">FMCG</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Team Size</label>
                <Select
                  value={formData.employees}
                  onValueChange={(value) => updateFormData("employees", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select size" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1-10">1-10</SelectItem>
                    <SelectItem value="11-50">11-50</SelectItem>
                    <SelectItem value="51-200">51-200</SelectItem>
                    <SelectItem value="201-500">201-500</SelectItem>
                    <SelectItem value="500+">500+</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        );
      case 2:
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Pickup Address *</label>
              <Input
                placeholder="Street address, building name"
                value={formData.address}
                onChange={(e) => updateFormData("address", e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">City *</label>
                <Input
                  placeholder="City"
                  value={formData.city}
                  onChange={(e) => updateFormData("city", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">State *</label>
                <Select
                  value={formData.state}
                  onValueChange={(value) => updateFormData("state", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select state" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="maharashtra">Maharashtra</SelectItem>
                    <SelectItem value="delhi">Delhi</SelectItem>
                    <SelectItem value="karnataka">Karnataka</SelectItem>
                    <SelectItem value="tamilnadu">Tamil Nadu</SelectItem>
                    <SelectItem value="gujarat">Gujarat</SelectItem>
                    <SelectItem value="westbengal">West Bengal</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">PIN Code *</label>
              <Input
                placeholder="400001"
                value={formData.pincode}
                onChange={(e) => updateFormData("pincode", e.target.value)}
                maxLength={6}
              />
            </div>
          </div>
        );
      case 3:
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Monthly Shipping Volume</label>
              <Select
                value={formData.monthlyVolume}
                onValueChange={(value) => updateFormData("monthlyVolume", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select volume" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0-100">0-100 shipments</SelectItem>
                  <SelectItem value="100-500">100-500 shipments</SelectItem>
                  <SelectItem value="500-1000">500-1,000 shipments</SelectItem>
                  <SelectItem value="1000-5000">1,000-5,000 shipments</SelectItem>
                  <SelectItem value="5000+">5,000+ shipments</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Primary Service</label>
              <Select
                value={formData.primaryService}
                onValueChange={(value) => updateFormData("primaryService", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select service" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="express">Express Delivery</SelectItem>
                  <SelectItem value="standard">Standard Delivery</SelectItem>
                  <SelectItem value="cod">Cash on Delivery</SelectItem>
                  <SelectItem value="reverse">Reverse Logistics</SelectItem>
                  <SelectItem value="fulfillment">Fulfillment</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Delivery Destinations</label>
              <div className="grid grid-cols-2 gap-2">
                {["Domestic - Metro", "Domestic - Tier 2", "Domestic - Rural", "International"].map((dest) => (
                  <label key={dest} className="flex items-center gap-2 p-3 border rounded-lg cursor-pointer hover:bg-muted/50">
                    <Checkbox
                      checked={formData.destinations.includes(dest)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          updateFormData("destinations", [...formData.destinations, dest]);
                        } else {
                          updateFormData("destinations", formData.destinations.filter((d) => d !== dest));
                        }
                      }}
                    />
                    <span className="text-sm">{dest}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        );
      case 4:
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Billing Email *</label>
              <Input
                type="email"
                placeholder="billing@company.com"
                value={formData.billingEmail}
                onChange={(e) => updateFormData("billingEmail", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">PAN Number</label>
              <Input
                placeholder="ABCDE1234F"
                value={formData.panNumber}
                onChange={(e) => updateFormData("panNumber", e.target.value.toUpperCase())}
                maxLength={10}
              />
            </div>
            <div className="p-4 bg-muted/50 rounded-lg space-y-3">
              <h4 className="font-medium">Your Plan: Starter (Free)</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Up to 100 shipments/month</li>
                <li>• Basic tracking</li>
                <li>• Email support</li>
              </ul>
              <Button variant="outline" size="sm">
                Upgrade to Pro
              </Button>
            </div>
            <label className="flex items-start gap-3 p-4 border rounded-lg">
              <Checkbox
                checked={formData.acceptTerms}
                onCheckedChange={(checked) => updateFormData("acceptTerms", checked)}
              />
              <span className="text-sm text-muted-foreground">
                I agree to the{" "}
                <a href="#" className="text-primary hover:underline">Terms of Service</a>
                {" "}and{" "}
                <a href="#" className="text-primary hover:underline">Privacy Policy</a>
              </span>
            </label>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-muted/30 py-8">
      <div className="container max-w-3xl">
        {/* Header */}
        <div className="text-center mb-8">
          <img src={logo} alt="FastFare" className="h-10 mx-auto mb-4" />
          <h1 className="text-2xl font-bold">Set up your organization</h1>
          <p className="text-muted-foreground">Complete these steps to start shipping</p>
        </div>

        {/* Stepper */}
        <div className="flex justify-between mb-8">
          {steps.map((step, index) => (
            <div key={step.id} className="flex items-center">
              <div className="flex flex-col items-center">
                <div
                  className={`h-12 w-12 rounded-full flex items-center justify-center transition-colors ${
                    currentStep > step.id
                      ? "bg-green-500 text-white"
                      : currentStep === step.id
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {currentStep > step.id ? (
                    <Check className="h-6 w-6" />
                  ) : (
                    <step.icon className="h-6 w-6" />
                  )}
                </div>
                <span className={`text-xs mt-2 ${currentStep >= step.id ? "text-foreground" : "text-muted-foreground"}`}>
                  {step.title}
                </span>
              </div>
              {index < steps.length - 1 && (
                <div
                  className={`h-0.5 w-16 mx-2 ${
                    currentStep > step.id ? "bg-green-500" : "bg-muted"
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        {/* Content */}
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>{steps[currentStep - 1].title}</CardTitle>
            <CardDescription>
              {currentStep === 1 && "Tell us about your business"}
              {currentStep === 2 && "Set up your primary pickup location"}
              {currentStep === 3 && "Help us understand your shipping needs"}
              {currentStep === 4 && "Configure billing preferences"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <AnimatePresence mode="wait">
              <motion.div
                key={currentStep}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
              >
                {renderStepContent()}
              </motion.div>
            </AnimatePresence>

            <div className="flex justify-between mt-8 pt-6 border-t">
              <Button
                variant="outline"
                onClick={handleBack}
                disabled={currentStep === 1}
                className="gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </Button>
              <Button
                onClick={handleNext}
                className="gap-2 gradient-primary"
                disabled={currentStep === 4 && !formData.acceptTerms}
              >
                {currentStep === 4 ? "Complete Setup" : "Continue"}
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>

        <p className="text-center text-sm text-muted-foreground mt-6">
          Need help?{" "}
          <a href="#" className="text-primary hover:underline">Contact support</a>
        </p>
      </div>
    </div>
  );
};

export default OrganizationSetup;
