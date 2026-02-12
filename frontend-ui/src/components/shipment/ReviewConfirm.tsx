import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  MapPin,
  Package,
  Truck,
  CreditCard,
  Shield,
  Edit2,
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
}

const ReviewConfirm = ({
  bookingData,
  termsAccepted,
  onTermsChange,
  onEditStep,
}: ReviewConfirmProps) => {
  const { pickup, delivery, packages, service } = bookingData;

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

  const getServiceMultiplier = (type: string) => {
    const multipliers: Record<string, number> = {
      standard: 1,
      express: 1.5,
      "same-day": 2.5,
    };
    return multipliers[type] || 1;
  };

  const getCarrierPrice = (carrier: string) => {
    const prices: Record<string, number> = {
      bluedart: 149,
      delhivery: 129,
      fedex: 199,
      dtdc: 99,
    };
    return prices[carrier] || 99;
  };

  const basePrice = getCarrierPrice(service.carrier);
  const serviceMultiplier = getServiceMultiplier(service.serviceType);
  const shippingCost = Math.round(basePrice * serviceMultiplier);
  const insuranceCost = service.insurance ? 29 : 0;
  const fragileCost = service.fragileHandling ? 49 : 0;
  const signatureCost = service.signatureRequired ? 19 : 0;
  const totalCost = shippingCost + insuranceCost + fragileCost + signatureCost;

  const totalWeight = packages.packages?.reduce(
    (sum: number, p: PackageItem) => sum + p.weight * p.quantity,
    0
  ) || 0;

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
                {packages.paymentMode === "cod"
                  ? `COD (₹${packages.codAmount})`
                  : packages.paymentMode}
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

      {/* Price Summary */}
      <Card className="bg-primary/5 border-primary/20">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-primary" />
            Payment Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>Shipping Charges</span>
              <span>₹{shippingCost}</span>
            </div>
            {insuranceCost > 0 && (
              <div className="flex justify-between">
                <span>Insurance</span>
                <span>₹{insuranceCost}</span>
              </div>
            )}
            {fragileCost > 0 && (
              <div className="flex justify-between">
                <span>Fragile Handling</span>
                <span>₹{fragileCost}</span>
              </div>
            )}
            {signatureCost > 0 && (
              <div className="flex justify-between">
                <span>Signature Required</span>
                <span>₹{signatureCost}</span>
              </div>
            )}
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>GST (18%)</span>
              <span>₹{Math.round(totalCost * 0.18)}</span>
            </div>
            <Separator />
            <div className="flex justify-between font-semibold text-base">
              <span>Total Amount</span>
              <span className="text-primary">
                ₹{Math.round(totalCost * 1.18)}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Terms and Conditions */}
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
  );
};

export default ReviewConfirm;
