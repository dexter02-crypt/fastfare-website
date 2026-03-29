import { API_BASE_URL } from "@/config";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { calculateInvoiceCharges } from "@/utils/invoiceUtils";
import { calculateInvoiceBreakdown } from "@/utils/discountEngine";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  MapPin,
  Package,
  Truck,
  CreditCard,
  Shield,
  Edit2,
  X,
  Loader2,
  CheckCircle2,
  Wallet,
  AlertCircle,
  Ticket
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface AddressData {
  name: string;
  phone: string;
  email: string;
  address: string;
  pincode: string;
  city: string;
  state: string;
  landmark?: string;
  addressType: string;
}

interface PackageItem {
  id: string;
  name: string;
  quantity: number;
  weight: number;
  length: number;
  width: number;
  height: number;
  value: number;
}

interface PackagesData {
  packages: PackageItem[];
  contentType: string;
  paymentMode: string;
  codAmount: number;
}

interface ServiceData {
  carrier: string;
  serviceType: string;
  insurance: boolean;
  fragileHandling: boolean;
  signatureRequired: boolean;
  shippingCost?: number;
}

interface ReviewConfirmProps {
  bookingData: {
    pickup: AddressData;
    delivery: AddressData;
    packages: PackagesData;
    service: ServiceData;
  };
  termsAccepted: boolean;
  onTermsChange: (accepted: boolean) => void;
  onEditStep: (step: number) => void;
  tcError?: boolean;
  onPromoApplied?: (code: string, discount: number) => void;
  onPromoRemoved?: () => void;
  onPaymentModeChange: (mode: string) => void;
  onWalletSufficiencyChange: (isSufficient: boolean) => void;
}

const ReviewConfirm = ({
  bookingData,
  termsAccepted,
  onTermsChange,
  onEditStep,
  tcError,
  onPromoApplied,
  onPromoRemoved,
  onPaymentModeChange,
  onWalletSufficiencyChange,
}: ReviewConfirmProps) => {
  const { pickup, delivery, packages, service } = bookingData;

  const [localPaymentMode, setLocalPaymentMode] = useState(packages.paymentMode);

  // Update parent when local mode changes
  useEffect(() => {
    onPaymentModeChange(localPaymentMode);
  }, [localPaymentMode]);

  // Promo states
  const [promoInput, setPromoInput] = useState("");
  const [promoLoading, setPromoLoading] = useState(false);
  const [promoError, setPromoError] = useState("");
  const [appliedPromo, setAppliedPromo] = useState<{ code: string; discount: number } | null>(null);

  // Wallet states
  const [walletBalance, setWalletBalance] = useState<number | null>(null);
  const [isWalletLoading, setIsWalletLoading] = useState(true);

  const navigate = useNavigate();
  
  // Fetch wallet balance
  useEffect(() => {
    const fetchWallet = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/payment/wallet`, {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
        });
        const data = await response.json();
        if (response.ok) {
          setWalletBalance(data.balance);
        }
      } catch (error) {
        console.error("Failed to fetch wallet", error);
      } finally {
        setIsWalletLoading(false);
      }
    };
    fetchWallet();
  }, []);

  const shippingCost = service.shippingCost || 0;
  const isCOD = localPaymentMode === "cod";
  
  // Use official invoice util for exactly matching final amount math
  const invoiceMath = calculateInvoiceCharges({
    shippingCost: shippingCost,
    paymentMode: localPaymentMode
  });
  
  const discountAmount = appliedPromo?.discount || 0;
  const finalPayable = Math.max(0, invoiceMath.finalAmount - discountAmount);

  // Check wallet sufficiency
  const isWalletSufficient = localPaymentMode === 'wallet' && walletBalance !== null && walletBalance >= finalPayable;
  
  useEffect(() => {
    onWalletSufficiencyChange(isWalletSufficient || localPaymentMode !== 'wallet');
  }, [localPaymentMode, walletBalance, finalPayable]);

  const handleRechargeRedirect = () => {
    // Save form state to session storage to restore later if needed
    // The parent manages state, but simple reload preservation could be added.
    // For now proceed to recharge page.
    navigate("/billing/recharge");
  };

  const carrierNames: Record<string, string> = {
    bluedart: "BlueDart",
    delhivery: "Delhivery",
    fedex: "FedEx",
    dtdc: "DTDC",
  };

  const serviceNames: Record<string, string> = {
    standard: "Standard Delivery",
    express: "Express Delivery",
    "same-day": "Same Day Delivery",
  };

  const totalWeight = packages.packages?.reduce(
    (sum: number, p: PackageItem) => sum + p.weight * p.quantity,
    0
  ) || 0;

  const handleApplyPromo = async () => {
    if (!promoInput.trim()) return;
    setPromoLoading(true);
    setPromoError("");

    try {
      const breakdown = calculateInvoiceBreakdown(shippingCost);
      const response = await fetch(`${API_BASE_URL}/api/promo/validate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          promoCode: promoInput.trim(),
          amount: breakdown.totalPayable
        })
      });

      const data = await response.json();

      if (!response.ok) {
        setPromoError(data.message || 'Invalid promo code');
        return;
      }

      setAppliedPromo({ code: data.promo_code, discount: data.discount_amount });
      onPromoApplied?.(data.promo_code, data.discount_amount);
    } catch (error) {
      setPromoError('Failed to validate promo code');
    } finally {
      setPromoLoading(false);
    }
  };

  const handleRemovePromo = () => {
    setAppliedPromo(null);
    setPromoInput("");
    setPromoError("");
    onPromoRemoved?.();
  };

  return (
    <div className="space-y-6">
      {/* Pickup Address */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <MapPin className="h-5 w-5 text-green-500" />
              Pickup Address
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onEditStep(1)}
              className="text-primary"
            >
              <Edit2 className="h-4 w-4 mr-1" /> Edit
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-sm space-y-1">
            <p className="font-medium">{pickup.name}</p>
            <p className="text-muted-foreground">{pickup.phone}</p>
            <p className="text-muted-foreground">
              {pickup.address}, {pickup.landmark && `near ${pickup.landmark},`}{" "}
              {pickup.city}, {pickup.state} - {pickup.pincode}
            </p>
            <Badge variant="secondary" className="mt-2">
              {pickup.addressType}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Delivery Address */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <MapPin className="h-5 w-5 text-red-500" />
              Delivery Address
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onEditStep(2)}
              className="text-primary"
            >
              <Edit2 className="h-4 w-4 mr-1" /> Edit
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-sm space-y-1">
            <p className="font-medium">{delivery.name}</p>
            <p className="text-muted-foreground">{delivery.phone}</p>
            <p className="text-muted-foreground">
              {delivery.address},{" "}
              {delivery.landmark && `near ${delivery.landmark},`} {delivery.city},{" "}
              {delivery.state} - {delivery.pincode}
            </p>
            <Badge variant="secondary" className="mt-2">
              {delivery.addressType}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Package Details */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Package className="h-5 w-5 text-primary" />
              Package Details
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onEditStep(3)}
              className="text-primary"
            >
              <Edit2 className="h-4 w-4 mr-1" /> Edit
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {packages.packages?.map((pkg: PackageItem, index: number) => (
              <div
                key={pkg.id}
                className="flex items-center justify-between text-sm p-2 bg-muted rounded"
              >
                <div>
                  <span className="font-medium">
                    {pkg.name || `Package ${index + 1}`}
                  </span>
                  <span className="text-muted-foreground ml-2">
                    x{pkg.quantity}
                  </span>
                </div>
                <div className="text-muted-foreground">
                  {pkg.weight}kg | {pkg.length}x{pkg.width}x{pkg.height}cm
                </div>
              </div>
            ))}
            <Separator />
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Content Type</span>
              <span className="font-medium capitalize">{packages.contentType}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Total Weight</span>
              <span className="font-medium">{totalWeight.toFixed(2)} kg</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Payment Mode</span>
              <span className="font-medium capitalize">
                {localPaymentMode === "cod"
                  ? `COD (₹${packages.codAmount})`
                  : localPaymentMode}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Service Details */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Truck className="h-5 w-5 text-primary" />
              Service Details
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onEditStep(4)}
              className="text-primary"
            >
              <Edit2 className="h-4 w-4 mr-1" /> Edit
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Carrier</span>
              <span className="font-medium">
                {carrierNames[service.carrier] || service.carrier}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Service Type</span>
              <span className="font-medium">
                {serviceNames[service.serviceType] || service.serviceType}
              </span>
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              {service.insurance && (
                <Badge variant="outline" className="gap-1">
                  <Shield className="h-3 w-3" /> Insured
                </Badge>
              )}
              {service.fragileHandling && (
                <Badge variant="outline">Fragile Handling</Badge>
              )}
              {service.signatureRequired && (
                <Badge variant="outline">Signature Required</Badge>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payment Selection & Summary */}
      <Card className="bg-primary/5 border-primary/20">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-primary" />
            Payment Method & Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 mb-6">
            <div className="grid grid-cols-2 gap-4">
              <div 
                onClick={() => setLocalPaymentMode("cod")}
                className={`flex flex-col p-4 rounded-xl border-2 cursor-pointer transition-all ${localPaymentMode === 'cod' ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/50'}`}
              >
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center gap-2 font-medium">
                    <span className="text-xl">💵</span> Cash on Delivery
                  </div>
                  <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${localPaymentMode === 'cod' ? 'border-primary bg-primary' : 'border-muted-foreground'}`}>
                    {localPaymentMode === 'cod' && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                  </div>
                </div>
                <p className="text-xs text-muted-foreground font-medium">Standard ₹50 COD handling fee applies</p>
              </div>

              <div 
                onClick={() => setLocalPaymentMode("wallet")}
                className={`flex flex-col p-4 rounded-xl border-2 cursor-pointer transition-all ${localPaymentMode === 'wallet' ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/50'}`}
              >
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center gap-2 font-medium">
                    <Wallet className="w-5 h-5 text-purple-600" /> Wallet Auto-deduct
                  </div>
                  <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${localPaymentMode === 'wallet' ? 'border-primary bg-primary' : 'border-muted-foreground'}`}>
                    {localPaymentMode === 'wallet' && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                  </div>
                </div>
                {isWalletLoading ? (
                  <p className="text-xs text-muted-foreground flex items-center gap-1"><Loader2 className="w-3 h-3 animate-spin"/> Loading balance...</p>
                ) : (
                  <p className="text-xs font-medium text-purple-700">Available Balance: ₹{walletBalance?.toFixed(2) || "0.00"}</p>
                )}
              </div>
            </div>

            {/* Wallet Sufficiency Alert */}
            {localPaymentMode === 'wallet' && !isWalletLoading && walletBalance !== null && (
              <div className={`p-3 rounded-lg border ${isWalletSufficient ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                <div className="flex gap-2 items-start">
                  {isWalletSufficient ? (
                     <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                  ) : (
                     <AlertCircle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
                  )}
                  <div className="flex-1">
                    {isWalletSufficient ? (
                      <p className="text-sm text-green-800">Your wallet balance is sufficient. <span className="font-semibold">₹{finalPayable.toFixed(2)}</span> will be deducted upon order confirmation.</p>
                    ) : (
                      <div>
                        <p className="text-sm text-red-800 mb-2">Insufficient wallet balance. Your balance is <span className="font-bold">₹{walletBalance.toFixed(2)}</span> but <span className="font-bold">₹{finalPayable.toFixed(2)}</span> is required.</p>
                        <Button 
                          onClick={handleRechargeRedirect} 
                          size="sm" 
                          variant="outline" 
                          className="w-full bg-white text-red-700 hover:bg-red-50 border-red-200 hover:border-red-300 pointer-events-auto"
                        >
                          <Wallet className="w-4 h-4 mr-2" /> Recharge Wallet to Continue
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          <Separator className="mb-4" />

          <div className="space-y-2.5 text-sm">
            <div className="flex justify-between items-center text-muted-foreground">
              <span>Total Chargeable Price</span>
              <span className="font-medium text-foreground">₹{invoiceMath.forwardCharge.toFixed(2)}</span>
            </div>
            {isCOD && (
              <div className="flex justify-between items-center text-muted-foreground">
                <span>COD Handling Fee</span>
                <span className="font-medium text-foreground">₹{invoiceMath.codFee.toFixed(2)}</span>
              </div>
            )}
            {!isCOD && (
              <div className="flex justify-between items-center text-muted-foreground text-xs">
                <span>COD Handling Fee</span>
                <span className="text-green-600 font-medium">Not Applicable (Wallet Payment)</span>
              </div>
            )}
            <div className="flex justify-between items-center text-muted-foreground">
              <span>Taxes (GST @18%)</span>
              <span className="font-medium text-foreground">₹{invoiceMath.igstAmount.toFixed(2)}</span>
            </div>

            {/* Promo Discount Row */}
            {appliedPromo && (
              <div className="flex justify-between items-center text-green-600 font-medium animate-in slide-in-from-top-2 duration-300">
                <span className="flex items-center gap-1.5">
                  <Ticket className="w-4 h-4" />
                  Promo Discount ({appliedPromo.code})
                </span>
                <span>-₹{appliedPromo.discount.toFixed(2)}</span>
              </div>
            )}

            <Separator />
            <div className="flex justify-between items-center font-bold text-lg bg-primary/10 rounded-lg px-3 py-2 -mx-1">
              <span className="flex items-center gap-2">
                TOTAL PAYABLE
                {appliedPromo && (
                  <Badge className="bg-green-500 hover:bg-green-600 text-xs font-medium">Promo Applied ✓</Badge>
                )}
              </span>
              <span className={`text-xl ${appliedPromo ? 'text-green-600' : 'text-primary'}`}>
                ₹{finalPayable.toFixed(2)}
              </span>
            </div>

            {/* Promo Code Input Section */}
            <div className="pt-3 mt-3 border-t">
              <Label className="text-muted-foreground text-xs font-medium flex items-center gap-1.5 mb-2">
                <Ticket className="w-3.5 h-3.5" />
                Have a Promo Code?
              </Label>
              {appliedPromo ? (
                <div className="flex items-center gap-2 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md px-3 py-2">
                  <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" />
                  <span className="text-sm text-green-700 dark:text-green-400 flex-1">
                    <span className="font-bold font-mono">{appliedPromo.code}</span> applied — You save ₹{appliedPromo.discount}
                  </span>
                  <button onClick={handleRemovePromo} className="text-red-400 hover:text-red-600 transition-colors">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <Input
                    placeholder="Enter code e.g. SAVE50"
                    value={promoInput}
                    onChange={(e) => { setPromoInput(e.target.value.toUpperCase()); setPromoError(""); }}
                    className="font-mono uppercase flex-1"
                    disabled={promoLoading}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleApplyPromo}
                    disabled={promoLoading || !promoInput.trim()}
                    className="min-w-[80px]"
                  >
                    {promoLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Apply"}
                  </Button>
                </div>
              )}
              {promoError && (
                <p className="text-red-500 text-xs mt-1.5">{promoError}</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Terms and Conditions */}
      <div
        id="tc-checkbox-wrapper"
        style={{
          border: tcError ? '2px solid #ef4444' : '2px solid transparent',
          borderRadius: '6px',
          padding: '4px'
        }}
      >
        <div className="flex items-start gap-3 p-4 border rounded-lg">
          <Checkbox
            id="terms"
            checked={termsAccepted}
            onCheckedChange={(checked) => onTermsChange(checked as boolean)}
          />
          <Label htmlFor="terms" className="text-sm leading-relaxed cursor-pointer">
            I agree to the{" "}
            <a href="#" className="text-primary hover:underline">
              Terms and Conditions
            </a>{" "}
            and{" "}
            <a href="#" className="text-primary hover:underline">
              Shipping Policy
            </a>
            . I confirm that the package contents comply with the carrier's shipping
            guidelines.
          </Label>
        </div>
      </div>
      {tcError && (
        <p style={{ color: '#ef4444', fontSize: '13px', marginTop: '4px', marginLeft: '4px' }}>
          ⚠ Please accept the Terms and Conditions to proceed.
        </p>
      )}
    </div>
  );
};

export default ReviewConfirm;
