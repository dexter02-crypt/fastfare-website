import { useState, useEffect } from "react";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Truck, Zap, Shield, Package, Loader2, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { API_BASE_URL } from "@/config";

interface ServiceFormData {
  serviceType: string;
  carrier: string;
  carrierId: string;
  insurance: boolean;
  fragileHandling: boolean;
  signatureRequired: boolean;
  scheduledPickup: boolean;
  pickupDate: string;
  pickupSlot: string;
}

interface ServiceSelectionProps {
  data: ServiceFormData;
  onChange: (data: ServiceFormData) => void;
  pickupPincode?: string;
  deliveryPincode?: string;
}

interface CarrierOption {
  _id: string;
  businessName: string;
  rating: number;
  baseFare: number;
  perKgRate: number;
  eta: string;
  features: string[];
  supportedTypes: string[];
}

const serviceTypes = [
  { id: "express", name: "Express Delivery", description: "Guaranteed within 12 hours", icon: Zap, multiplier: 1.5 },
  { id: "standard", name: "Standard Delivery", description: "Regular delivery within 3-5 business days", icon: Truck, multiplier: 1 },
];

const logoColors = ["🔵", "🔴", "🟣", "🟠", "🟢", "🟤", "⚫"];

const ServiceSelection = ({ data, onChange, pickupPincode, deliveryPincode }: ServiceSelectionProps) => {
  const [carriers, setCarriers] = useState<CarrierOption[]>([]);
  const [loadingCarriers, setLoadingCarriers] = useState(true);

  useEffect(() => {
    const fetchCarriers = async () => {
      setLoadingCarriers(true);
      try {
        // Use serviceability endpoint when pincodes are available
        let url = `${API_BASE_URL}/api/carriers/active`;
        if (pickupPincode && deliveryPincode) {
          const params = new URLSearchParams({
            pickup: pickupPincode,
            delivery: deliveryPincode,
          });
          if (data.serviceType) {
            params.set('serviceType', data.serviceType);
          }
          url = `${API_BASE_URL}/api/carriers/check-serviceability?${params}`;
        }
        const res = await fetch(url);
        const result = await res.json();
        if (result.success && result.carriers.length > 0) {
          setCarriers(result.carriers);
        } else {
          setCarriers([]);
        }
      } catch (err) {
        console.error("Failed to fetch carriers:", err);
      } finally {
        setLoadingCarriers(false);
      }
    };
    fetchCarriers();
  }, [pickupPincode, deliveryPincode, data.serviceType]);

  const handleChange = <K extends keyof ServiceFormData>(field: K, value: ServiceFormData[K]) => {
    onChange({ ...data, [field]: value });
  };

  const handleCarrierSelect = (carrierId: string) => {
    const carrier = carriers.find((c) => c._id === carrierId);
    onChange({
      ...data,
      carrier: carrier?.businessName || "",
      carrierId: carrierId,
    });
  };

  const selectedCarrier = carriers.find((c) => c._id === data.carrierId);
  const selectedService = serviceTypes.find((s) => s.id === data.serviceType);
  const basePrice = selectedCarrier?.baseFare || 0;
  const finalPrice = Math.round(basePrice * (selectedService?.multiplier || 1));

  return (
    <div className="space-y-8">
      {/* Service Type */}
      <div className="space-y-4">
        <Label className="text-base font-semibold">Service Type</Label>
        <RadioGroup
          value={data.serviceType}
          onValueChange={(value) => handleChange("serviceType", value)}
          className="grid grid-cols-1 md:grid-cols-3 gap-4"
        >
          {serviceTypes.map((service) => (
            <div
              key={service.id}
              className={cn(
                "relative border rounded-lg p-4 cursor-pointer transition-all",
                data.serviceType === service.id
                  ? "border-primary bg-primary/5 ring-1 ring-primary"
                  : "hover:border-primary/50"
              )}
            >
              <RadioGroupItem value={service.id} id={service.id} className="absolute right-4 top-4" />
              <Label htmlFor={service.id} className="cursor-pointer">
                <service.icon className="h-8 w-8 text-primary mb-2" />
                <span className="font-medium block">{service.name}</span>
                <span className="text-sm text-muted-foreground">{service.description}</span>
              </Label>
            </div>
          ))}
        </RadioGroup>
      </div>

      {/* Carrier Selection */}
      <div className="space-y-4">
        <Label className="text-base font-semibold">Select Carrier</Label>

        {loadingCarriers ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-primary mr-2" />
            <span className="text-sm text-muted-foreground">Loading available carriers...</span>
          </div>
        ) : carriers.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="p-6 text-center">
              <AlertCircle className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">
                No carriers available at the moment. Please try again later.
              </p>
            </CardContent>
          </Card>
        ) : (
          <RadioGroup
            value={data.carrierId || ""}
            onValueChange={handleCarrierSelect}
            className="space-y-3"
          >
            {carriers.map((carrier, idx) => (
              <Card
                key={carrier._id}
                className={cn(
                  "cursor-pointer transition-all",
                  data.carrierId === carrier._id
                    ? "border-primary ring-1 ring-primary"
                    : "hover:border-primary/50"
                )}
              >
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <RadioGroupItem value={carrier._id} id={`carrier-${carrier._id}`} />
                    <div className="text-2xl">{logoColors[idx % logoColors.length]}</div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <Label htmlFor={`carrier-${carrier._id}`} className="font-semibold cursor-pointer">
                          {carrier.businessName}
                        </Label>
                        <Badge variant="secondary" className="text-xs">
                          ⭐ {carrier.rating}
                        </Badge>
                      </div>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {carrier.features?.map((feature) => (
                          <span key={feature} className="text-xs text-muted-foreground">• {feature}</span>
                        ))}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-primary">
                        ₹{Math.round(carrier.baseFare * (selectedService?.multiplier || 1))}
                      </div>
                      <div className="text-sm text-muted-foreground">ETA: {carrier.eta}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </RadioGroup>
        )}
      </div>

      {/* Additional Services */}
      <div className="space-y-4">
        <Label className="text-base font-semibold">Additional Services</Label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card
            className={cn("cursor-pointer transition-all", data.insurance && "border-primary bg-primary/5")}
            onClick={() => handleChange("insurance", !data.insurance)}
          >
            <CardContent className="p-4 flex items-center gap-3">
              <Checkbox checked={data.insurance} />
              <Shield className="h-5 w-5 text-primary" />
              <div>
                <span className="font-medium">Shipment Insurance</span>
                <span className="text-sm text-muted-foreground block">Protect your package (+₹29)</span>
              </div>
            </CardContent>
          </Card>
          <Card
            className={cn("cursor-pointer transition-all", data.fragileHandling && "border-primary bg-primary/5")}
            onClick={() => handleChange("fragileHandling", !data.fragileHandling)}
          >
            <CardContent className="p-4 flex items-center gap-3">
              <Checkbox checked={data.fragileHandling} />
              <Package className="h-5 w-5 text-primary" />
              <div>
                <span className="font-medium">Fragile Handling</span>
                <span className="text-sm text-muted-foreground block">Special care for delicate items (+₹49)</span>
              </div>
            </CardContent>
          </Card>
          <Card
            className={cn("cursor-pointer transition-all", data.signatureRequired && "border-primary bg-primary/5")}
            onClick={() => handleChange("signatureRequired", !data.signatureRequired)}
          >
            <CardContent className="p-4 flex items-center gap-3">
              <Checkbox checked={data.signatureRequired} />
              <div className="h-5 w-5 text-primary font-bold text-center">✍️</div>
              <div>
                <span className="font-medium">Signature Required</span>
                <span className="text-sm text-muted-foreground block">Confirm delivery with signature (+₹19)</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Price Summary */}
      {data.carrierId && selectedCarrier && (
        <Card className="bg-primary/5 border-primary/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Estimated Cost</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Base Shipping ({selectedCarrier.businessName})</span>
                <span>₹{basePrice}</span>
              </div>
              {selectedService?.multiplier !== 1 && (
                <div className="flex justify-between text-sm">
                  <span>{selectedService?.name} Surcharge</span>
                  <span>+₹{Math.round(basePrice * (selectedService!.multiplier - 1))}</span>
                </div>
              )}
              {data.insurance && (
                <div className="flex justify-between text-sm"><span>Insurance</span><span>+₹29</span></div>
              )}
              {data.fragileHandling && (
                <div className="flex justify-between text-sm"><span>Fragile Handling</span><span>+₹49</span></div>
              )}
              {data.signatureRequired && (
                <div className="flex justify-between text-sm"><span>Signature Required</span><span>+₹19</span></div>
              )}
              <div className="border-t pt-2 mt-2 flex justify-between font-semibold">
                <span>Total</span>
                <span className="text-primary">
                  ₹{finalPrice + (data.insurance ? 29 : 0) + (data.fragileHandling ? 49 : 0) + (data.signatureRequired ? 19 : 0)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ServiceSelection;
