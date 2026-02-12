import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Truck, Zap, Clock, Shield, Package, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";

interface ServiceFormData {
  serviceType: string;
  carrier: string;
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
}

const carriers = [
  {
    id: "bluedart",
    name: "BlueDart",
    logo: "🔵",
    rating: 4.5,
    price: 149,
    eta: "2-3 days",
    features: ["Real-time tracking", "Insurance available"],
  },
  {
    id: "delhivery",
    name: "Delhivery",
    logo: "🔴",
    rating: 4.3,
    price: 129,
    eta: "3-4 days",
    features: ["Wide coverage", "COD available"],
  },
  {
    id: "fedex",
    name: "FedEx",
    logo: "🟣",
    rating: 4.7,
    price: 199,
    eta: "1-2 days",
    features: ["Priority handling", "Global network"],
  },
  {
    id: "dtdc",
    name: "DTDC",
    logo: "🟠",
    rating: 4.2,
    price: 99,
    eta: "4-5 days",
    features: ["Budget friendly", "Good for bulk"],
  },
];

const serviceTypes = [
  {
    id: "standard",
    name: "Standard Delivery",
    description: "Regular delivery within 3-5 business days",
    icon: Truck,
    multiplier: 1,
  },
  {
    id: "express",
    name: "Express Delivery",
    description: "Guaranteed within 12 hours",
    icon: Zap,
    multiplier: 1.5,
  },
  {
    id: "same-day",
    name: "Same Day Delivery",
    description: "Within 24 hours (select cities)",
    icon: Clock,
    multiplier: 2.5,
  },
];

const ServiceSelection = ({ data, onChange }: ServiceSelectionProps) => {
  const handleChange = <K extends keyof ServiceFormData>(field: K, value: ServiceFormData[K]) => {
    onChange({ ...data, [field]: value });
  };

  const selectedCarrier = carriers.find((c) => c.id === data.carrier);
  const selectedService = serviceTypes.find((s) => s.id === data.serviceType);
  const basePrice = selectedCarrier?.price || 0;
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
              <RadioGroupItem
                value={service.id}
                id={service.id}
                className="absolute right-4 top-4"
              />
              <Label htmlFor={service.id} className="cursor-pointer">
                <service.icon className="h-8 w-8 text-primary mb-2" />
                <span className="font-medium block">{service.name}</span>
                <span className="text-sm text-muted-foreground">
                  {service.description}
                </span>
              </Label>
            </div>
          ))}
        </RadioGroup>
      </div>

      {/* Carrier Selection */}
      <div className="space-y-4">
        <Label className="text-base font-semibold">Select Carrier</Label>
        <RadioGroup
          value={data.carrier}
          onValueChange={(value) => handleChange("carrier", value)}
          className="space-y-3"
        >
          {carriers.map((carrier) => (
            <Card
              key={carrier.id}
              className={cn(
                "cursor-pointer transition-all",
                data.carrier === carrier.id
                  ? "border-primary ring-1 ring-primary"
                  : "hover:border-primary/50"
              )}
            >
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <RadioGroupItem value={carrier.id} id={carrier.id} />
                  <div className="text-2xl">{carrier.logo}</div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Label
                        htmlFor={carrier.id}
                        className="font-semibold cursor-pointer"
                      >
                        {carrier.name}
                      </Label>
                      <Badge variant="secondary" className="text-xs">
                        ⭐ {carrier.rating}
                      </Badge>
                    </div>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {carrier.features.map((feature) => (
                        <span
                          key={feature}
                          className="text-xs text-muted-foreground"
                        >
                          • {feature}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-primary">
                      ₹
                      {Math.round(
                        carrier.price * (selectedService?.multiplier || 1)
                      )}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      ETA: {carrier.eta}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </RadioGroup>
      </div>

      {/* Additional Services */}
      <div className="space-y-4">
        <Label className="text-base font-semibold">Additional Services</Label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card
            className={cn(
              "cursor-pointer transition-all",
              data.insurance && "border-primary bg-primary/5"
            )}
            onClick={() => handleChange("insurance", !data.insurance)}
          >
            <CardContent className="p-4 flex items-center gap-3">
              <Checkbox checked={data.insurance} />
              <Shield className="h-5 w-5 text-primary" />
              <div>
                <span className="font-medium">Shipment Insurance</span>
                <span className="text-sm text-muted-foreground block">
                  Protect your package (+₹29)
                </span>
              </div>
            </CardContent>
          </Card>

          <Card
            className={cn(
              "cursor-pointer transition-all",
              data.fragileHandling && "border-primary bg-primary/5"
            )}
            onClick={() => handleChange("fragileHandling", !data.fragileHandling)}
          >
            <CardContent className="p-4 flex items-center gap-3">
              <Checkbox checked={data.fragileHandling} />
              <Package className="h-5 w-5 text-primary" />
              <div>
                <span className="font-medium">Fragile Handling</span>
                <span className="text-sm text-muted-foreground block">
                  Special care for delicate items (+₹49)
                </span>
              </div>
            </CardContent>
          </Card>

          <Card
            className={cn(
              "cursor-pointer transition-all",
              data.signatureRequired && "border-primary bg-primary/5"
            )}
            onClick={() =>
              handleChange("signatureRequired", !data.signatureRequired)
            }
          >
            <CardContent className="p-4 flex items-center gap-3">
              <Checkbox checked={data.signatureRequired} />
              <div className="h-5 w-5 text-primary font-bold text-center">✍️</div>
              <div>
                <span className="font-medium">Signature Required</span>
                <span className="text-sm text-muted-foreground block">
                  Confirm delivery with signature (+₹19)
                </span>
              </div>
            </CardContent>
          </Card>

          <Card
            className={cn(
              "cursor-pointer transition-all",
              data.scheduledPickup && "border-primary bg-primary/5"
            )}
            onClick={() => handleChange("scheduledPickup", !data.scheduledPickup)}
          >
            <CardContent className="p-4 flex items-center gap-3">
              <Checkbox checked={data.scheduledPickup} />
              <Calendar className="h-5 w-5 text-primary" />
              <div>
                <span className="font-medium">Schedule Pickup</span>
                <span className="text-sm text-muted-foreground block">
                  Choose your preferred pickup time
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Price Summary */}
      {data.carrier && (
        <Card className="bg-primary/5 border-primary/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Estimated Cost</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Base Shipping ({selectedCarrier?.name})</span>
                <span>₹{basePrice}</span>
              </div>
              {selectedService?.multiplier !== 1 && (
                <div className="flex justify-between text-sm">
                  <span>{selectedService?.name} Surcharge</span>
                  <span>+₹{Math.round(basePrice * (selectedService!.multiplier - 1))}</span>
                </div>
              )}
              {data.insurance && (
                <div className="flex justify-between text-sm">
                  <span>Insurance</span>
                  <span>+₹29</span>
                </div>
              )}
              {data.fragileHandling && (
                <div className="flex justify-between text-sm">
                  <span>Fragile Handling</span>
                  <span>+₹49</span>
                </div>
              )}
              {data.signatureRequired && (
                <div className="flex justify-between text-sm">
                  <span>Signature Required</span>
                  <span>+₹19</span>
                </div>
              )}
              <div className="border-t pt-2 mt-2 flex justify-between font-semibold">
                <span>Total</span>
                <span className="text-primary">
                  ₹
                  {finalPrice +
                    (data.insurance ? 29 : 0) +
                    (data.fragileHandling ? 49 : 0) +
                    (data.signatureRequired ? 19 : 0)}
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
