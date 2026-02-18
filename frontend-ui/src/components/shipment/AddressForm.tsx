import { useState, useEffect, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, BookmarkPlus, Trash2, Star } from "lucide-react";
import { API_BASE_URL } from "@/config";
import { toast } from "@/hooks/use-toast";

interface AddressData {
  name: string;
  phone: string;
  email: string;
  address: string;
  pincode: string;
  city: string;
  state: string;
  landmark: string;
  addressType: string;
  saveAddress: boolean;
}

interface SavedAddress {
  _id: string;
  name: string;
  phone: string;
  email?: string;
  address: string;
  pincode: string;
  city: string;
  state: string;
  landmark?: string;
  addressType: string;
}

interface AddressFormProps {
  type: "pickup" | "delivery";
  data: AddressData;
  onChange: (data: AddressData) => void;
}

const indianStates = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh",
  "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand",
  "Karnataka", "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur",
  "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab",
  "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura",
  "Uttar Pradesh", "Uttarakhand", "West Bengal",
  "Delhi", "Chandigarh", "Puducherry", "Jammu and Kashmir", "Ladakh",
  "Andaman and Nicobar Islands", "Dadra and Nagar Haveli and Daman and Diu", "Lakshadweep",
];

const AddressForm = ({ type, data, onChange }: AddressFormProps) => {
  const [pincodeLoading, setPincodeLoading] = useState(false);
  const [pincodeError, setPincodeError] = useState("");
  const [savedAddresses, setSavedAddresses] = useState<SavedAddress[]>([]);
  const [loadingAddresses, setLoadingAddresses] = useState(false);
  const [showSavedPanel, setShowSavedPanel] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleChange = (field: keyof AddressData, value: string | boolean) => {
    onChange({ ...data, [field]: value });
  };

  // Fetch saved addresses on mount
  useEffect(() => {
    const fetchSavedAddresses = async () => {
      const token = localStorage.getItem("token");
      if (!token) return;

      setLoadingAddresses(true);
      try {
        const res = await fetch(`${API_BASE_URL}/api/users/addresses`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const json = await res.json();
        if (json.success && json.addresses) {
          setSavedAddresses(json.addresses);
        }
      } catch {
        // Silently fail — not critical
      } finally {
        setLoadingAddresses(false);
      }
    };

    fetchSavedAddresses();
  }, []);

  // Apply a saved address to the form
  const applySavedAddress = (addr: SavedAddress) => {
    onChange({
      name: addr.name || "",
      phone: addr.phone || "",
      email: addr.email || "",
      address: addr.address || "",
      pincode: addr.pincode || "",
      city: addr.city || "",
      state: addr.state || "",
      landmark: addr.landmark || "",
      addressType: addr.addressType || "office",
      saveAddress: false, // Already saved
    });
    setShowSavedPanel(false);
    toast({
      title: "Address applied",
      description: `${addr.name}'s address has been filled in.`,
    });
  };

  // Delete a saved address
  const handleDeleteAddress = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const token = localStorage.getItem("token");
    if (!token) return;

    setDeletingId(id);
    try {
      const res = await fetch(`${API_BASE_URL}/api/users/addresses/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (json.success) {
        setSavedAddresses(json.addresses || savedAddresses.filter(a => a._id !== id));
        toast({ title: "Address deleted", description: "Saved address removed." });
      }
    } catch {
      toast({ title: "Error", description: "Could not delete address.", variant: "destructive" });
    } finally {
      setDeletingId(null);
    }
  };

  // Auto-fill city & state from pincode using India Post API
  const fetchPincodeDetails = useCallback(async (pincode: string) => {
    if (pincode.length !== 6) return;
    setPincodeLoading(true);
    setPincodeError("");
    try {
      const res = await fetch(`https://api.postalpincode.in/pincode/${pincode}`);
      const json = await res.json();
      if (json[0]?.Status === "Success" && json[0]?.PostOffice?.length > 0) {
        const po = json[0].PostOffice[0];
        onChange({
          ...data,
          pincode,
          city: po.District || po.Division || "",
          state: po.State || "",
        });
      } else {
        setPincodeError("Invalid pincode");
      }
    } catch {
      setPincodeError("Could not verify pincode");
    } finally {
      setPincodeLoading(false);
    }
  }, [data, onChange]);

  // Trigger auto-fill when pincode reaches 6 digits
  useEffect(() => {
    if (data.pincode.length === 6) {
      fetchPincodeDetails(data.pincode);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data.pincode]);

  const getAddressTypeIcon = (addrType: string) => {
    switch (addrType) {
      case "warehouse": return "🏭";
      case "office": return "🏢";
      case "home": return "🏠";
      default: return "📍";
    }
  };

  return (
    <div className="space-y-6">
      {/* ── Saved Addresses Selector ── */}
      {savedAddresses.length > 0 && (
        <div className="border rounded-lg overflow-hidden bg-gradient-to-r from-primary/5 to-blue-50/50 dark:from-primary/10 dark:to-blue-900/10">
          <button
            type="button"
            onClick={() => setShowSavedPanel(!showSavedPanel)}
            className="w-full flex items-center justify-between px-4 py-3 hover:bg-primary/5 transition-colors"
          >
            <div className="flex items-center gap-2">
              <BookmarkPlus className="h-4 w-4 text-primary" />
              <span className="font-medium text-sm">
                Saved Addresses ({savedAddresses.length})
              </span>
            </div>
            <Badge variant="secondary" className="text-xs">
              {showSavedPanel ? "Hide" : "Select to autofill"}
            </Badge>
          </button>

          {showSavedPanel && (
            <div className="border-t px-3 py-2 space-y-2 max-h-60 overflow-y-auto">
              {savedAddresses.map((addr) => (
                <button
                  key={addr._id}
                  type="button"
                  onClick={() => applySavedAddress(addr)}
                  className="w-full text-left p-3 rounded-md border bg-background hover:border-primary hover:shadow-sm transition-all group relative"
                >
                  <div className="flex items-start gap-2">
                    <span className="text-lg leading-none mt-0.5">{getAddressTypeIcon(addr.addressType)}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm truncate">{addr.name}</span>
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0 capitalize">
                          {addr.addressType}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground truncate mt-0.5">
                        {addr.address}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {[addr.city, addr.state, addr.pincode].filter(Boolean).join(", ")}
                        {addr.phone && ` • ${addr.phone}`}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive shrink-0"
                      onClick={(e) => handleDeleteAddress(addr._id, e)}
                      disabled={deletingId === addr._id}
                    >
                      {deletingId === addr._id ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Trash2 className="h-3.5 w-3.5" />
                      )}
                    </Button>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {loadingAddresses && savedAddresses.length === 0 && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground p-3 border rounded-lg">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading saved addresses...
        </div>
      )}

      {/* ── Form Fields ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor={`${type}-name`}>Contact Name *</Label>
          <Input
            id={`${type}-name`}
            placeholder="Enter full name"
            value={data.name}
            onChange={(e) => handleChange("name", e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor={`${type}-phone`}>Phone Number *</Label>
          <div className="flex">
            <div className="flex items-center justify-center px-3 border rounded-l-md bg-muted text-muted-foreground border-r-0">
              +91
            </div>
            <Input
              id={`${type}-phone`}
              placeholder="9876543210"
              value={data.phone}
              onChange={(e) => {
                const value = e.target.value.replace(/\D/g, "");
                if (value.length <= 10) {
                  handleChange("phone", value);
                }
              }}
              className="rounded-l-none"
              maxLength={10}
            />
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor={`${type}-email`}>Email Address</Label>
        <Input
          id={`${type}-email`}
          type="email"
          placeholder="email@example.com"
          value={data.email}
          onChange={(e) => handleChange("email", e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor={`${type}-address`}>Complete Address *</Label>
        <Textarea
          id={`${type}-address`}
          placeholder="House/Flat No., Building, Street, Area"
          value={data.address}
          onChange={(e) => handleChange("address", e.target.value)}
          rows={3}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor={`${type}-pincode`}>PIN Code *</Label>
          <div className="relative">
            <Input
              id={`${type}-pincode`}
              placeholder="6-digit PIN"
              value={data.pincode}
              onChange={(e) => {
                const value = e.target.value.replace(/\D/g, "");
                if (value.length <= 6) {
                  handleChange("pincode", value);
                }
              }}
              maxLength={6}
              inputMode="numeric"
            />
            {pincodeLoading && (
              <Loader2 className="absolute right-3 top-2.5 h-4 w-4 animate-spin text-muted-foreground" />
            )}
          </div>
          {pincodeError && (
            <p className="text-xs text-red-500">{pincodeError}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor={`${type}-city`}>City *</Label>
          <Input
            id={`${type}-city`}
            placeholder="Auto-filled from PIN"
            value={data.city}
            onChange={(e) => handleChange("city", e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor={`${type}-state`}>State *</Label>
          <Select
            value={data.state}
            onValueChange={(value) => handleChange("state", value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Auto-filled from PIN" />
            </SelectTrigger>
            <SelectContent>
              {indianStates.map((state) => (
                <SelectItem key={state} value={state}>
                  {state}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor={`${type}-landmark`}>Landmark</Label>
        <Input
          id={`${type}-landmark`}
          placeholder="Nearby landmark (optional)"
          value={data.landmark}
          onChange={(e) => handleChange("landmark", e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <Label>Address Type</Label>
        <Select
          value={data.addressType}
          onValueChange={(value) => handleChange("addressType", value)}
        >
          <SelectTrigger className="w-full md:w-48">
            <SelectValue placeholder="Select type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="home">Home</SelectItem>
            <SelectItem value="office">Office</SelectItem>
            <SelectItem value="warehouse">Warehouse</SelectItem>
            <SelectItem value="other">Other</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center gap-2 p-3 rounded-lg border border-dashed border-primary/30 bg-primary/5">
        <Checkbox
          id={`${type}-save`}
          checked={data.saveAddress}
          onCheckedChange={(checked) => handleChange("saveAddress", checked)}
        />
        <Label htmlFor={`${type}-save`} className="text-sm font-normal flex items-center gap-1.5 cursor-pointer">
          <Star className="h-3.5 w-3.5 text-primary" />
          Save this address for future shipments
        </Label>
      </div>
    </div>
  );
};

export default AddressForm;
