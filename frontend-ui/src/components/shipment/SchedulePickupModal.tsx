import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CheckCircle2, MapPin, Calendar, Loader2, Navigation } from "lucide-react";
import { API_BASE_URL } from "@/config";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";

interface PickupAddress {
    name?: string;
    address?: string;
    city?: string;
    state?: string;
    pincode?: string;
    phone?: string;
}

interface SchedulePickupModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    awb: string;
    shipmentId: string;
    pickupAddress?: PickupAddress;
}

// Bug 12 — consistent "DD Mon YYYY" format
function formatPickupChip(date: Date, label?: string): string {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const str = String(date.getDate()).padStart(2, '0') + ' ' + months[date.getMonth()] + ' ' + date.getFullYear();
    return label ? label + ' (' + str + ')' : str;
}

const SchedulePickupModal = ({ open, onOpenChange, awb, shipmentId, pickupAddress }: SchedulePickupModalProps) => {
    const { toast } = useToast();
    const [selectedDate, setSelectedDate] = useState<string>("today");
    const [isConfirming, setIsConfirming] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    // Auto Location & Address Update States  (Bug 6)
    const [isEditingAddress, setIsEditingAddress] = useState(false);
    const [isLocating, setIsLocating] = useState(false);
    const [addressForm, setAddressForm] = useState<PickupAddress>(pickupAddress || {
        name: '', address: '', city: '', state: '', pincode: '', phone: ''
    });

    const today = new Date();
    const tomorrow = new Date(); tomorrow.setDate(today.getDate() + 1);
    const day3 = new Date(); day3.setDate(today.getDate() + 2);
    const day4 = new Date(); day4.setDate(today.getDate() + 3);
    const day5 = new Date(); day5.setDate(today.getDate() + 4);

    const dates = [
        { id: "today", label: formatPickupChip(today, 'Today'), value: today.toISOString() },
        { id: "tomorrow", label: formatPickupChip(tomorrow, 'Tomorrow'), value: tomorrow.toISOString() },
        { id: "date3", label: formatPickupChip(day3), value: day3.toISOString() },
        { id: "date4", label: formatPickupChip(day4), value: day4.toISOString() },
        { id: "date5", label: formatPickupChip(day5), value: day5.toISOString() },
    ];

    const handleAutoLocation = () => {
        setIsLocating(true);
        if ("geolocation" in navigator) {
            navigator.geolocation.getCurrentPosition(
                async (position) => {
                    try {
                        const { latitude, longitude } = position.coords;
                        // Reverse geocoding using Nominatim (OpenStreetMap)
                        const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`);
                        const data = await response.json();
                        if (data && data.address) {
                            setAddressForm(prev => ({
                                ...prev,
                                address: data.display_name || prev.address,
                                city: data.address.city || data.address.town || data.address.village || prev.city,
                                state: data.address.state || prev.state,
                                pincode: data.address.postcode || prev.pincode
                            }));
                            toast({ title: "Location updated successfully from GPS" });
                        }
                    } catch (error) {
                        toast({ title: "Failed to fetch address from location", variant: "destructive" });
                    } finally {
                        setIsLocating(false);
                    }
                },
                () => {
                    setIsLocating(false);
                    toast({ title: "Location access denied or unavailable", variant: "destructive" });
                }
            );
        } else {
            setIsLocating(false);
            toast({ title: "Geolocation not supported by your browser", variant: "destructive" });
        }
    };

    const handleGoToConfirmation = () => {
        setIsConfirming(true);
    };

    const handleConfirmSchedule = async () => {
        setIsLoading(true);
        try {
            const token = localStorage.getItem("token");
            const selectedDateValue = dates.find(d => d.id === selectedDate)?.value;

            const response = await fetch(`${API_BASE_URL}/api/shipments/${shipmentId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    scheduledPickup: true,
                    pickupDate: selectedDateValue,
                    pickupSlot: "09:00-18:00",
                    pickup: addressForm
                })
            });

            if (!response.ok) throw new Error("Failed to schedule pickup");

            toast({ title: "Pickup Scheduled Successfully", description: "The carrier has been notified." });
            onOpenChange(false);
        } catch (error) {
            toast({ title: "Error scheduling pickup", variant: "destructive" });
        } finally {
            setIsLoading(false);
        }
    };

    const addressName = addressForm.name || 'Pickup Address';
    const addressLine = addressForm.address || '';
    const addressCityState = [addressForm.city, addressForm.state].filter(Boolean).join(', ');
    const addressPin = addressForm.pincode || '';

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                    <DialogTitle>{isConfirming ? "Confirm Pickup Schedule" : "Schedule Your Pick Up"}</DialogTitle>
                </DialogHeader>

                {!isConfirming ? (
                    <div className="space-y-6 py-4">
                        <div className="bg-green-50 p-4 rounded-lg flex gap-3 items-start border border-green-100">
                            <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
                            <p className="text-sm">
                                Your package has been assigned to <span className="font-semibold">Delhivery Surface</span> successfully.
                                The AWB number of the same is <span className="text-primary font-medium">{awb}</span>.
                            </p>
                        </div>

                        {/* Pick Up Address with Edit & Auto Location */}
                        <div className="bg-muted/50 p-4 rounded-lg">
                            <div className="flex justify-between items-start mb-2">
                                <div className="flex gap-2 items-center">
                                    <MapPin className="h-5 w-5 text-muted-foreground" />
                                    <p className="font-medium text-sm">Pick Up Address</p>
                                </div>
                                <Button variant="ghost" size="sm" onClick={() => setIsEditingAddress(!isEditingAddress)} className="h-8 text-xs">
                                    {isEditingAddress ? "Cancel" : "Edit Address"}
                                </Button>
                            </div>

                            {isEditingAddress ? (
                                <div className="space-y-3 mt-3 bg-white p-3 rounded border">
                                    <div className="flex justify-between items-center mb-1">
                                        <p className="text-xs text-muted-foreground font-medium">Update Pickup Location</p>
                                        <Button variant="outline" size="sm" onClick={handleAutoLocation} disabled={isLocating} className="h-8 text-xs bg-blue-50 text-blue-700 hover:bg-blue-100 hover:text-blue-800 border-blue-200">
                                            {isLocating ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <Navigation className="h-3 w-3 mr-1" />}
                                            Auto Detect Location
                                        </Button>
                                    </div>
                                    <Input placeholder="Name" value={addressForm.name || ''} onChange={(e) => setAddressForm({ ...addressForm, name: e.target.value })} className="h-8 text-sm" />
                                    <Input placeholder="Address" value={addressForm.address || ''} onChange={(e) => setAddressForm({ ...addressForm, address: e.target.value })} className="h-8 text-sm" />
                                    <div className="grid grid-cols-2 gap-2">
                                        <Input placeholder="City" value={addressForm.city || ''} onChange={(e) => setAddressForm({ ...addressForm, city: e.target.value })} className="h-8 text-sm" />
                                        <Input placeholder="Pincode" value={addressForm.pincode || ''} onChange={(e) => setAddressForm({ ...addressForm, pincode: e.target.value })} className="h-8 text-sm" />
                                    </div>
                                </div>
                            ) : (
                                <div className="ml-7">
                                    <p style={{ fontWeight: '600', fontSize: '15px' }}>{addressName}</p>
                                    {addressLine && (
                                        <p style={{ color: '#4b5563', fontSize: '14px', marginTop: '4px' }}>{addressLine}</p>
                                    )}
                                    {(addressCityState || addressPin) && (
                                        <p style={{ color: '#4b5563', fontSize: '14px' }}>
                                            {addressCityState}{addressPin ? ` - ${addressPin}` : ''}
                                        </p>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Date Selection */}
                        <div className="space-y-3">
                            <div className="flex items-center gap-2">
                                <Calendar className="h-5 w-5 text-muted-foreground" />
                                <p className="font-medium text-sm">Please select a suitable date for your order to be picked up</p>
                            </div>

                            <div className="flex flex-wrap gap-2">
                                {dates.map((date) => (
                                    <button
                                        key={date.id}
                                        onClick={() => setSelectedDate(date.id)}
                                        className={`px-4 py-2 rounded-full text-sm font-medium border transition-colors ${selectedDate === date.id
                                            ? "bg-primary/10 border-primary text-primary"
                                            : "bg-background border-input hover:bg-accent hover:text-accent-foreground"
                                            }`}
                                    >
                                        {date.label}
                                    </button>
                                ))}
                            </div>

                            {selectedDate === "today" && (
                                <p className="text-xs text-blue-600">
                                    In case you schedule the pick up for Today, You will not be able to reschedule this pick up.
                                </p>
                            )}
                        </div>

                        <p className="text-xs text-muted-foreground pt-2 border-t">
                            <span className="font-semibold text-foreground">Note:</span> Please ensure that your invoice is in the package, and your label is visible on the package to be delivered.
                        </p>
                    </div>
                ) : (
                    /* Confirmation Screen (Bug 5) */
                    <div className="space-y-6 py-6">
                        <div className="text-center space-y-2">
                            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Calendar className="h-8 w-8 text-blue-600" />
                            </div>
                            <h3 className="text-xl font-semibold">Final Booking Confirmation</h3>
                            <p className="text-muted-foreground text-sm max-w-sm mx-auto">
                                Please confirm your pickup schedule. Once confirmed, a delivery agent will be assigned to your location.
                            </p>
                        </div>

                        <div className="bg-muted p-4 rounded-lg space-y-3">
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">AWB Number</span>
                                <span className="font-medium font-mono">{awb}</span>
                            </div>
                            <div className="flex justify-between text-sm border-t pt-3">
                                <span className="text-muted-foreground">Selected Date</span>
                                <span className="font-medium">{dates.find(d => d.id === selectedDate)?.label}</span>
                            </div>
                            <div className="flex justify-between text-sm border-t pt-3">
                                <span className="text-muted-foreground">Pickup Location</span>
                                <span className="font-medium text-right max-w-[200px] truncate">{addressForm.address || addressForm.city}</span>
                            </div>
                        </div>
                    </div>
                )}

                <DialogFooter className="flex items-center sm:justify-between w-full gap-4">
                    {!isConfirming ? (
                        <>
                            <Button variant="ghost" className="text-primary hover:text-primary/90 hover:bg-transparent" onClick={() => onOpenChange(false)}>
                                I'll do it later
                            </Button>
                            <Button className="gradient-primary" onClick={handleGoToConfirmation}>
                                Schedule Pick Up
                            </Button>
                        </>
                    ) : (
                        <>
                            <Button variant="ghost" onClick={() => setIsConfirming(false)} disabled={isLoading}>
                                Back
                            </Button>
                            <Button className="gradient-primary" onClick={handleConfirmSchedule} disabled={isLoading}>
                                {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                                Confirm Booking
                            </Button>
                        </>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default SchedulePickupModal;
