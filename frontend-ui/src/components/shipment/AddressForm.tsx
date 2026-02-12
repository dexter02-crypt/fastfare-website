import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";

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

interface AddressFormProps {
  type: "pickup" | "delivery";
  data: AddressData;
  onChange: (data: AddressData) => void;
}

const AddressForm = ({ type, data, onChange }: AddressFormProps) => {
  const handleChange = (field: keyof AddressData, value: string | boolean) => {
    onChange({ ...data, [field]: value });
  };

  return (
    <div className="space-y-6">
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
          <Input
            id={`${type}-pincode`}
            placeholder="6-digit PIN"
            value={data.pincode}
            onChange={(e) => handleChange("pincode", e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor={`${type}-city`}>City *</Label>
          <Input
            id={`${type}-city`}
            placeholder="City name"
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
              <SelectValue placeholder="Select state" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="maharashtra">Maharashtra</SelectItem>
              <SelectItem value="delhi">Delhi</SelectItem>
              <SelectItem value="karnataka">Karnataka</SelectItem>
              <SelectItem value="tamil-nadu">Tamil Nadu</SelectItem>
              <SelectItem value="gujarat">Gujarat</SelectItem>
              <SelectItem value="rajasthan">Rajasthan</SelectItem>
              <SelectItem value="west-bengal">West Bengal</SelectItem>
              <SelectItem value="telangana">Telangana</SelectItem>
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

      <div className="flex items-center gap-2">
        <Checkbox
          id={`${type}-save`}
          checked={data.saveAddress}
          onCheckedChange={(checked) => handleChange("saveAddress", checked)}
        />
        <Label htmlFor={`${type}-save`} className="text-sm font-normal">
          Save this address for future shipments
        </Label>
      </div>
    </div>
  );
};

export default AddressForm;
