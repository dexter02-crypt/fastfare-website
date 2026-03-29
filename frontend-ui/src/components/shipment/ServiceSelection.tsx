import { useState, useEffect } from "react";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Truck, Zap, Shield, Package, Loader2, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { API_BASE_URL } from "@/config";

interface ServiceFormData {
  serviceType: string;
  carrier: string;
  carrierId: string;
  shippingCost: number;
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
  chargeableWeight?: number;
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

const logoColors = ['🟢', '🟤', '⚫'];

// Bug 14 — real carrier logos
const CARRIER_LOGOS: Record<string, string> = {
  'BlueDart': 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/81/Blue_dart_logo.svg/200px-Blue_dart_logo.svg.png',
  'Delhivery': 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/44/Delhivery_Logo.svg/200px-Delhivery_Logo.svg.png',
  'FedEx': 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b9/FedEx_Corporation_-_2016_Logo.svg/200px-FedEx_Corporation_-_2016_Logo.svg.png',
  'DTDC': 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/31/DTDC_Logo.svg/200px-DTDC_Logo.svg.png',
};

const ServiceSelection = ({ data, onChange, pickupPincode, deliveryPincode, chargeableWeight = 0.5 }: ServiceSelectionProps) => {
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
  }, [pickupPincode, deliveryPincode]);

  const handleChange = <K extends keyof ServiceFormData>(field: K, value: ServiceFormData[K]) => {
    onChange({ ...data, [field]: value });
  };

  // Calculate carrier price: perKgRate × chargeableWeight
  const getCarrierShippingCost = (carrier: CarrierOption) => {
    const rate = carrier.perKgRate || 0;
    return Math.round(rate * chargeableWeight);
  };

  const handleCarrierSelect = (carrierId: string) => {
    const carrier = carriers.find((c) => c._id === carrierId);
    const price = carrier ? getCarrierShippingCost(carrier) : 0;
    onChange({
      ...data,
      carrier: carrier?.businessName || "",
      carrierId: carrierId,
      shippingCost: price,
    });
  };

  const selectedCarrier = carriers.find((c) => c._id === data.carrierId);
  const shippingCost = selectedCarrier ? getCarrierShippingCost(selectedCarrier) : 0;
  const gstAmount = Math.round(shippingCost * 0.18 * 100) / 100;
  const totalPayable = Math.round((shippingCost + gstAmount) * 100) / 100;

  return (
    <div className="space-y-8">
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
                    {CARRIER_LOGOS[carrier.businessName] ? (
                      <img
                        src={CARRIER_LOGOS[carrier.businessName]}
                        alt={carrier.businessName}
                        style={{
                          width: '48px', height: '48px', objectFit: 'contain',
                          background: 'white', padding: '4px', borderRadius: '6px',
                          border: '1px solid #e5e7eb'
                        }}
                        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                      />
                    ) : (
                      <div className="text-2xl">{logoColors[idx % logoColors.length]}</div>
                    )}
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
                        ₹{getCarrierShippingCost(carrier)}
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

      {/* Estimated Cost — simplified to Total + GST only */}
      {data.carrierId && selectedCarrier && (
        <Card className="bg-primary/5 border-primary/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Estimated Cost</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Total Chargeable Price</span>
                <span>₹{shippingCost}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>GST @18%</span>
                <span>₹{gstAmount.toFixed(2)}</span>
              </div>
              <Separator />
              <div className="flex justify-between font-semibold text-base">
                <span>Total Payable</span>
                <span className="text-primary">₹{totalPayable.toFixed(2)}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ServiceSelection;
