import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Calculator, MapPin, Package, Truck, Zap, Star, AlertCircle, RefreshCw, BadgeCheck,
} from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { API_BASE_URL } from "@/config";

// ─── Types ────────────────────────────────────────────────────────────────────
interface PartnerService {
  serviceId: string;
  type: string;
  name: string;
  price: number;
  estimatedDays: string;
  codAvailable: boolean;
  features: string[];
}

interface PartnerResult {
  partnerId: string;
  companyName: string;
  rating: number | null;
  totalRatings: number;
  services: PartnerService[];
  bestRate?: boolean;
}

// ─── Skeleton Loader ─────────────────────────────────────────────────────────
const CarrierSkeleton = () => (
  <Card className="overflow-hidden">
    <CardContent className="p-6">
      <div className="flex flex-col md:flex-row gap-6">
        <div className="md:w-48 space-y-2">
          <div className="h-10 bg-gray-200 rounded animate-pulse w-32" />
          <div className="h-4 bg-gray-200 rounded animate-pulse w-20" />
        </div>
        <div className="flex-1 grid md:grid-cols-2 gap-4">
          {[1, 2].map(i => (
            <div key={i} className="border rounded-lg p-4 space-y-2">
              <div className="h-4 bg-gray-200 rounded animate-pulse w-24" />
              <div className="h-8 bg-gray-200 rounded animate-pulse w-16" />
              <div className="h-4 bg-gray-200 rounded animate-pulse w-20" />
            </div>
          ))}
        </div>
      </div>
    </CardContent>
  </Card>
);

// ─── Main Component ───────────────────────────────────────────────────────────
const RateCalculator = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [formData, setFormData] = useState({
    pickupPincode: "",
    deliveryPincode: "",
    weight: "",
    length: "",
    width: "",
    height: "",
    paymentMode: "prepaid",
    codAmount: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [results, setResults] = useState<PartnerResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState("price-low");

  // Pre-fill from URL params (e.g. from homepage mini-calculator)
  useEffect(() => {
    const from = searchParams.get("from");
    const to = searchParams.get("to");
    const w = searchParams.get("weight");
    if (from || to || w) {
      setFormData(prev => ({
        ...prev,
        pickupPincode: from || prev.pickupPincode,
        deliveryPincode: to || prev.deliveryPincode,
        weight: w || prev.weight,
      }));
    }
  }, []);

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setErrors(prev => ({ ...prev, [field]: "" }));
    setHasSearched(false);
  };

  // Validate before fetching
  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!/^\d{6}$/.test(formData.pickupPincode)) newErrors.pickupPincode = "Enter a valid 6-digit PIN code";
    if (!/^\d{6}$/.test(formData.deliveryPincode)) newErrors.deliveryPincode = "Enter a valid 6-digit PIN code";
    const w = parseFloat(formData.weight);
    if (!formData.weight || isNaN(w) || w <= 0) newErrors.weight = "Enter a valid weight greater than 0";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const fetchRates = async () => {
    if (!validate()) return;

    setIsLoading(true);
    setFetchError(null);
    setHasSearched(true);
    setResults([]);

    const qs = new URLSearchParams({
      pickupPin: formData.pickupPincode,
      deliveryPin: formData.deliveryPincode,
      weight: formData.weight,
      paymentMode: formData.paymentMode,
      ...(formData.length && { length: formData.length }),
      ...(formData.width && { width: formData.width }),
      ...(formData.height && { height: formData.height }),
    });

    try {
      const res = await fetch(`${API_BASE_URL}/api/rates/calculate?${qs}`);
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `Server error ${res.status}`);
      }
      const data: PartnerResult[] = await res.json();
      setResults(Array.isArray(data) ? data : []);
    } catch (err: any) {
      setFetchError(err.message || "Network error");
    } finally {
      setIsLoading(false);
    }
  };

  // Sort results
  const sortedResults = [...results].sort((a, b) => {
    const aStd = a.services.find(s => s.type === "standard")?.price ?? a.services[0]?.price ?? 9999;
    const bStd = b.services.find(s => s.type === "standard")?.price ?? b.services[0]?.price ?? 9999;
    if (sortBy === "price-low") return aStd - bStd;
    if (sortBy === "price-high") return bStd - aStd;
    if (sortBy === "rating") return (b.rating ?? 0) - (a.rating ?? 0);
    return aStd - bStd;
  });

  const handleSelectService = (partner: PartnerResult, service: PartnerService) => {
    localStorage.setItem("ratesPreselectedCarrier", JSON.stringify({
      name: partner.companyName,
      _id: partner.partnerId,
      price: service.price,
      service: service.type,
      estimatedDays: service.estimatedDays,
    }));
    navigate(`/shipment/new?carrier=${partner.partnerId}&service=${service.type}`);
    window.scrollTo(0, 0);
  };

  const getServiceIcon = (type: string) => {
    if (type === "express" || type === "same_day") return <Zap className="h-4 w-4 text-orange-500" />;
    return <Truck className="h-4 w-4 text-muted-foreground" />;
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      <main className="flex-1 py-8">
        <div className="container mx-auto px-4">
          {/* Page Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
              <Calculator className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-3xl font-bold mb-2">Shipping Rate Calculator</h1>
            <p className="text-muted-foreground">
              Compare real rates from our registered delivery partners
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* ─── Calculator Form ─────────────────────────── */}
            <div className="lg:col-span-1">
              <Card className="sticky top-4">
                <CardHeader>
                  <CardTitle className="text-base">Shipment Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Pickup PIN */}
                  <div className="space-y-1">
                    <Label className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-green-500" /> Pickup PIN Code
                    </Label>
                    <Input
                      placeholder="e.g., 122001"
                      maxLength={6}
                      value={formData.pickupPincode}
                      onChange={e => handleChange("pickupPincode", e.target.value.replace(/\D/g, ""))}
                      className={errors.pickupPincode ? "border-red-400" : ""}
                    />
                    {errors.pickupPincode && <p className="text-xs text-red-500">{errors.pickupPincode}</p>}
                  </div>

                  {/* Delivery PIN */}
                  <div className="space-y-1">
                    <Label className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-red-500" /> Delivery PIN Code
                    </Label>
                    <Input
                      placeholder="e.g., 110001"
                      maxLength={6}
                      value={formData.deliveryPincode}
                      onChange={e => handleChange("deliveryPincode", e.target.value.replace(/\D/g, ""))}
                      className={errors.deliveryPincode ? "border-red-400" : ""}
                    />
                    {errors.deliveryPincode && <p className="text-xs text-red-500">{errors.deliveryPincode}</p>}
                  </div>

                  {/* Weight */}
                  <div className="space-y-1">
                    <Label className="flex items-center gap-2">
                      <Package className="h-4 w-4 text-primary" /> Weight (kg)
                    </Label>
                    <Input
                      type="number"
                      placeholder="e.g., 2.5"
                      value={formData.weight}
                      onChange={e => handleChange("weight", e.target.value)}
                      className={errors.weight ? "border-red-400" : ""}
                      min={0}
                      step={0.1}
                    />
                    {errors.weight && <p className="text-xs text-red-500">{errors.weight}</p>}
                  </div>

                  {/* Dimensions */}
                  <div className="space-y-1">
                    <Label>Dimensions (cm) <span className="text-muted-foreground text-xs">— optional, for volumetric</span></Label>
                    <div className="grid grid-cols-3 gap-2">
                      <Input type="number" placeholder="L" value={formData.length}
                        onChange={e => handleChange("length", e.target.value)} min={0} />
                      <Input type="number" placeholder="W" value={formData.width}
                        onChange={e => handleChange("width", e.target.value)} min={0} />
                      <Input type="number" placeholder="H" value={formData.height}
                        onChange={e => handleChange("height", e.target.value)} min={0} />
                    </div>
                  </div>

                  {/* Payment Mode */}
                  <div className="space-y-2">
                    <Label>Payment Mode</Label>
                    <RadioGroup
                      value={formData.paymentMode}
                      onValueChange={v => handleChange("paymentMode", v)}
                      className="flex gap-4"
                    >
                      <div className="flex items-center gap-2">
                        <RadioGroupItem value="prepaid" id="prepaid" />
                        <Label htmlFor="prepaid" className="cursor-pointer">Prepaid</Label>
                      </div>
                      <div className="flex items-center gap-2">
                        <RadioGroupItem value="cod" id="cod" />
                        <Label htmlFor="cod" className="cursor-pointer">COD</Label>
                      </div>
                    </RadioGroup>
                  </div>

                  {formData.paymentMode === "cod" && (
                    <div className="space-y-1">
                      <Label>COD Amount (₹)</Label>
                      <Input type="number" placeholder="Amount to collect"
                        value={formData.codAmount} onChange={e => handleChange("codAmount", e.target.value)} min={0} />
                    </div>
                  )}

                  <Button className="w-full gradient-primary" onClick={fetchRates} disabled={isLoading}>
                    <Calculator className="h-4 w-4 mr-2" />
                    {isLoading ? "Fetching Rates..." : "Calculate Rates"}
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* ─── Results ─────────────────────────────────── */}
            <div className="lg:col-span-2">
              {/* Initial state */}
              {!hasSearched && !isLoading && (
                <div className="text-center py-16">
                  <Package className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-30" />
                  <h3 className="text-lg font-medium mb-2">Enter shipment details</h3>
                  <p className="text-muted-foreground">Fill in the form to see available carriers and rates</p>
                </div>
              )}

              {/* Loading skeleton */}
              {isLoading && (
                <div className="space-y-4">
                  <div className="h-6 bg-gray-200 rounded animate-pulse w-40" />
                  {[1, 2, 3].map(i => <CarrierSkeleton key={i} />)}
                </div>
              )}

              {/* Error */}
              {!isLoading && fetchError && (
                <div className="flex flex-col items-center justify-center py-16 gap-4">
                  <AlertCircle className="h-12 w-12 text-red-400" />
                  <div className="text-center">
                    <h3 className="font-semibold">Unable to fetch rates</h3>
                    <p className="text-sm text-muted-foreground mt-1">Please check your connection and try again.</p>
                  </div>
                  <Button variant="outline" onClick={fetchRates}>
                    <RefreshCw className="h-4 w-4 mr-2" /> Retry
                  </Button>
                </div>
              )}

              {/* Empty state */}
              {!isLoading && !fetchError && hasSearched && sortedResults.length === 0 && (
                <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
                  <Truck className="h-14 w-14 text-muted-foreground opacity-30" />
                  <h3 className="font-semibold text-lg">No carriers available for this route</h3>
                  <p className="text-sm text-muted-foreground max-w-sm">
                    We are currently expanding our partner network. Try a different PIN code or check back soon.
                  </p>
                </div>
              )}

              {/* Results list */}
              {!isLoading && !fetchError && sortedResults.length > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold">
                      {sortedResults.length} Carrier{sortedResults.length !== 1 ? "s" : ""} Available
                    </h2>
                    <Select value={sortBy} onValueChange={setSortBy}>
                      <SelectTrigger className="w-48">
                        <SelectValue placeholder="Sort by" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="price-low">Price: Low to High</SelectItem>
                        <SelectItem value="price-high">Price: High to Low</SelectItem>
                        <SelectItem value="rating">Highest Rated</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {sortedResults.map((partner) => (
                    <Card
                      key={partner.partnerId}
                      className={`overflow-hidden ${partner.bestRate ? "ring-2 ring-primary" : ""}`}
                    >
                      {partner.bestRate && (
                        <div className="bg-primary text-primary-foreground text-xs font-medium px-4 py-1">
                          ⭐ Best Rate
                        </div>
                      )}
                      <CardContent className="p-6">
                        <div className="flex flex-col md:flex-row md:items-start gap-6">
                          {/* Partner Info */}
                          <div className="md:w-48 flex-shrink-0">
                            <div className="flex items-center gap-3 mb-2">
                              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                                <Truck className="h-5 w-5 text-primary" />
                              </div>
                              <div>
                                <h3 className="font-semibold text-sm leading-tight">{partner.companyName}</h3>
                                {partner.rating != null ? (
                                  <div className="flex items-center gap-1 text-xs mt-0.5">
                                    <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                                    <span>{partner.rating.toFixed(1)}</span>
                                    {partner.totalRatings > 0 && (
                                      <span className="text-muted-foreground">({partner.totalRatings})</span>
                                    )}
                                  </div>
                                ) : (
                                  <Badge variant="secondary" className="text-xs mt-0.5">New Partner</Badge>
                                )}
                              </div>
                            </div>
                            {/* Feature tags */}
                            <div className="flex flex-wrap gap-1 mt-2">
                              {partner.services.some(s => s.codAvailable) && (
                                <Badge variant="outline" className="text-xs">COD</Badge>
                              )}
                              {partner.services.some(s => s.type === "express" || s.type === "same_day") && (
                                <Badge variant="outline" className="text-xs text-orange-600 border-orange-300">Express</Badge>
                              )}
                            </div>
                          </div>

                          {/* Services Grid */}
                          <div className="flex-1 grid sm:grid-cols-2 gap-3">
                            {partner.services.map((service) => (
                              <div
                                key={service.serviceId}
                                className="p-4 border rounded-lg hover:border-primary transition-colors"
                              >
                                <div className="flex items-center gap-2 mb-2">
                                  {getServiceIcon(service.type)}
                                  <span className="font-medium text-sm">{service.name}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                  <div>
                                    <p className="text-2xl font-bold">₹{service.price}</p>
                                    <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                                      <BadgeCheck className="h-3 w-3" />
                                      {service.estimatedDays}
                                    </div>
                                  </div>
                                  <Button
                                    size="sm"
                                    variant={service.type === "express" || service.type === "same_day" ? "default" : "outline"}
                                    onClick={() => handleSelectService(partner, service)}
                                  >
                                    Select
                                  </Button>
                                </div>
                                {service.features.length > 0 && (
                                  <div className="flex flex-wrap gap-1 mt-2 pt-2 border-t">
                                    {service.features.map(f => (
                                      <Badge key={f} variant="secondary" className="text-xs">{f}</Badge>
                                    ))}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default RateCalculator;
