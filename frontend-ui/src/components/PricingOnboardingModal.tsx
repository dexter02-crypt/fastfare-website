import { useState, useEffect } from "react";
import { API_BASE_URL } from "@/config";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, Package, Tag, Clock } from "lucide-react";

export function PricingOnboardingModal() {
    const [isOpen, setIsOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    
    // Initial fields
    const [basePrice, setBasePrice] = useState("99");
    const [perKgRate, setPerKgRate] = useState("10");
    const [estimatedDays, setEstimatedDays] = useState("3-5 days");

    const authHeaders = () => {
        const token = localStorage.getItem("token");
        return { "Content-Type": "application/json", Authorization: `Bearer ${token}` };
    };

    useEffect(() => {
        const checkOnboarding = async () => {
            try {
                const res = await fetch(`${API_BASE_URL}/api/partner/pricing`, { headers: authHeaders() });
                const data = await res.json();
                if (data.success && data.pricingOnboarded === false) {
                    setIsOpen(true);
                }
            } catch (error) {
                console.error("Failed to fetch pricing config", error);
            } finally {
                setIsLoading(false);
            }
        };
        checkOnboarding();
    }, []);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        
        const bPrice = parseFloat(basePrice);
        const pRate = parseFloat(perKgRate);

        if (isNaN(bPrice) || bPrice < 0) {
            toast.error("Base price must be a valid number >= 0");
            return;
        }
        if (isNaN(pRate) || pRate < 0) {
            toast.error("Per KG Rate must be a valid number >= 0");
            return;
        }
        if (!estimatedDays.trim()) {
            toast.error("Estimated Days is required");
            return;
        }

        setIsSaving(true);
        try {
            // Build absolute default coverage (All India) since we are onboarding from a popup
            const body = {
                services: [
                    {
                        name: "Standard Delivery",
                        type: "standard",
                        basePrice: bPrice,
                        perKgRate: pRate,
                        minWeight: 0.5,
                        maxWeight: 50,
                        estimatedDays: estimatedDays.trim(),
                        codAvailable: true,
                        codCharge: 30, // Default COD logic, editable later in PartnerPricingPage
                        active: true
                    }
                ],
                coverage: {
                    states: ["All India"],
                    cities: [],
                    pinRanges: []
                }
            };

            const res = await fetch(`${API_BASE_URL}/api/partner/pricing/save-all`, {
                method: "POST",
                headers: authHeaders(),
                body: JSON.stringify(body)
            });
            const data = await res.json();
            
            if (data.success) {
                // Must explicitly mark the banner as dismissed right after a save-all is confirmed
                await fetch(`${API_BASE_URL}/api/partner/pricing/dismiss-onboarding`, {
                    method: "POST",
                    headers: authHeaders()
                });

                toast.success("Pricing configuration initialized!");
                setIsOpen(false);
            } else {
                toast.error(data.message || "Failed to initialize pricing config");
            }
        } catch (error: any) {
            toast.error(`Error: ${error.message}`);
        } finally {
            setIsSaving(false);
        }
    };

    // Do not render anything until loading is complete to prevent flickering
    if (isLoading) return null;

    return (
        <Dialog open={isOpen} onOpenChange={(open) => {
            // We do not allow them to close it without passing state (prevent unmounting).
            // They MUST complete this.
        }}>
            <DialogContent className="sm:max-w-md [&>button]:hidden">
                <DialogHeader>
                    <DialogTitle className="text-xl flex items-center gap-2">
                        <Tag className="h-5 w-5 text-primary" /> Setup Initial Pricing
                    </DialogTitle>
                    <DialogDescription>
                        Welcome! Before continuing, please establish your default service rates. These can be extensively modified later in the Pricing & Services tab.
                    </DialogDescription>
                </DialogHeader>
                
                <form onSubmit={handleSave} className="space-y-4 mt-4">
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="basePrice" className="text-sm">Base Price (₹) *</Label>
                                <div className="relative">
                                    <Tag className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input 
                                        id="basePrice"
                                        type="number"
                                        value={basePrice}
                                        onChange={e => setBasePrice(e.target.value)}
                                        className="pl-9"
                                        required
                                        min="0"
                                        step="0.01"
                                    />
                                </div>
                            </div>
                            
                            <div className="space-y-2">
                                <Label htmlFor="perKgRate" className="text-sm">Per KG Rate (₹) *</Label>
                                <div className="relative">
                                    <Package className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input 
                                        id="perKgRate"
                                        type="number"
                                        value={perKgRate}
                                        onChange={e => setPerKgRate(e.target.value)}
                                        className="pl-9"
                                        required
                                        min="0"
                                        step="0.01"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="estimatedDays" className="text-sm">Default ETA *</Label>
                            <div className="relative">
                                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input 
                                    id="estimatedDays"
                                    value={estimatedDays}
                                    onChange={e => setEstimatedDays(e.target.value)}
                                    placeholder="e.g. 3-5 days"
                                    className="pl-9"
                                    required
                                />
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                                This will provision a "Standard Delivery" service covering All India. You can refine specific regions and weight slabs in your settings afterwards.
                            </p>
                        </div>
                    </div>
                    
                    <div className="pt-4 flex justify-end">
                        <Button type="submit" disabled={isSaving} className="w-full">
                            {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                            Save & Continue
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
