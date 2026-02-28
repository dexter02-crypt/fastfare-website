import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Package, Plus, Trash2 } from "lucide-react";

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

interface PackageFormData {
  packages: PackageItem[];
  contentType: string;
  description: string;
  paymentMode: string;
  codAmount: number;
  insurance: boolean;
}

interface PackageFormProps {
  data: PackageFormData;
  onChange: (data: PackageFormData) => void;
}

const PackageForm = ({ data, onChange }: PackageFormProps) => {
  const handleChange = <K extends keyof PackageFormData>(field: K, value: PackageFormData[K]) => {
    onChange({ ...data, [field]: value });
  };

  const addPackage = () => {
    const newPackage: PackageItem = {
      id: Date.now().toString(),
      name: "",
      quantity: 1,
      weight: 0.5,
      length: 10,
      width: 10,
      height: 10,
      value: 0,
    };
    handleChange("packages", [...data.packages, newPackage]);
  };

  const removePackage = (id: string) => {
    handleChange(
      "packages",
      data.packages.filter((p) => p.id !== id)
    );
  };

  const updatePackage = <K extends keyof PackageItem>(id: string, field: K, value: PackageItem[K]) => {
    handleChange(
      "packages",
      data.packages.map((p) =>
        p.id === id ? { ...p, [field]: value } : p
      )
    );
  };

  // Calculate Volumetric Weight: (L * W * H) / 5000
  const getVolumetricWeight = (p: PackageItem) => {
    return (p.length * p.width * p.height) / 5000;
  };

  const totalVolumetricWeight = data.packages.reduce((sum, p) => sum + getVolumetricWeight(p) * p.quantity, 0);
  const totalActualWeight = data.packages.reduce((sum, p) => sum + p.weight * p.quantity, 0);
  const totalValue = data.packages.reduce((sum, p) => sum + p.value * p.quantity, 0);
  const chargeableWeight = Math.max(totalActualWeight, totalVolumetricWeight);

  return (
    <div className="space-y-6">
      {/* Package Items */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label className="text-base font-semibold">Package Items</Label>
          <Button type="button" variant="outline" size="sm" onClick={addPackage}>
            <Plus className="h-4 w-4 mr-1" /> Add Item
          </Button>
        </div>

        {data.packages.map((pkg, index) => {
          const volumetric = getVolumetricWeight(pkg);
          const isVolumetricHigher = volumetric > pkg.weight;

          return (
            <Card key={pkg.id} className="relative">
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Package className="h-6 w-6 text-primary" />
                  </div>
                  <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>Item Name</Label>
                      <Input
                        placeholder="e.g., Electronics"
                        value={pkg.name}
                        onChange={(e) => updatePackage(pkg.id, "name", e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Quantity</Label>
                      <Input
                        type="number"
                        min={1}
                        value={pkg.quantity}
                        onChange={(e) => updatePackage(pkg.id, "quantity", parseInt(e.target.value) || 1)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Actual Weight (kg)</Label>
                      <Input
                        type="number"
                        min={0.1}
                        step={0.1}
                        value={pkg.weight}
                        onChange={(e) => updatePackage(pkg.id, "weight", parseFloat(e.target.value) || 0.1)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Length (cm)</Label>
                      <Input
                        type="number"
                        min={1}
                        value={pkg.length}
                        onChange={(e) => updatePackage(pkg.id, "length", parseInt(e.target.value) || 1)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Width (cm)</Label>
                      <Input
                        type="number"
                        min={1}
                        value={pkg.width}
                        onChange={(e) => updatePackage(pkg.id, "width", parseInt(e.target.value) || 1)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Height (cm)</Label>
                      <Input
                        type="number"
                        min={1}
                        value={pkg.height}
                        onChange={(e) => updatePackage(pkg.id, "height", parseInt(e.target.value) || 1)}
                      />
                    </div>
                    <div className="space-y-2 md:col-span-3">
                      <Label>Declared Value (₹)</Label>
                      <Input
                        type="number"
                        min={0}
                        value={pkg.value}
                        onChange={(e) => updatePackage(pkg.id, "value", parseInt(e.target.value) || 0)}
                      />
                    </div>

                    {/* Volumetric Weight Indicator */}
                    <div className="md:col-span-3 bg-muted/50 p-2 rounded text-xs flex justify-between items-center">
                      <span>Volumetric Weight: <strong>{volumetric.toFixed(2)} kg</strong></span>
                      {isVolumetricHigher && <span className="text-orange-600 font-medium">Chargeable Weight: {volumetric.toFixed(2)} kg</span>}
                      {!isVolumetricHigher && <span className="text-green-600 font-medium">Chargeable Weight: {pkg.weight} kg</span>}
                    </div>

                  </div>
                  {data.packages.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="text-destructive hover:text-destructive"
                      onClick={() => removePackage(pkg.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}

        <div className="flex gap-4 p-4 bg-muted rounded-lg flex-wrap">
          <div className="text-sm">
            <span className="text-muted-foreground">Total Actual Weight:</span>{" "}
            <span className="font-semibold">{totalActualWeight.toFixed(2)} kg</span>
          </div>
          <div className="text-sm">
            <span className="text-muted-foreground">Total Volumetric Weight:</span>{" "}
            <span className="font-semibold">{totalVolumetricWeight.toFixed(2)} kg</span>
          </div>
          <div className="text-sm border-l pl-4 border-gray-300">
            <span className="text-muted-foreground">Chargeable Weight:</span>{" "}
            <span className="font-bold text-primary text-lg">{chargeableWeight.toFixed(2)} kg</span>
          </div>
          <div className="text-sm ml-auto">
            <span className="text-muted-foreground">Total Value:</span>{" "}
            <span className="font-semibold">₹{totalValue.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Content Type */}
      <div className="space-y-2">
        <Label>Content Type *</Label>
        <Select
          value={data.contentType}
          onValueChange={(value) => handleChange("contentType", value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select content type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="documents">Documents</SelectItem>
            <SelectItem value="electronics">Electronics</SelectItem>
            <SelectItem value="clothing">Clothing & Apparel</SelectItem>
            <SelectItem value="food">Food Items</SelectItem>
            <SelectItem value="fragile">Fragile Items</SelectItem>
            <SelectItem value="medicine">Medicine</SelectItem>
            <SelectItem value="other">Other</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Description */}
      <div className="space-y-2">
        <Label>Package Description</Label>
        <Textarea
          placeholder="Brief description of package contents"
          value={data.description}
          onChange={(e) => handleChange("description", e.target.value)}
          rows={2}
        />
      </div>

      {/* Payment Mode - TEMPORARILY HIDDEN (Only COD active) 
      <div className="space-y-3">
        <Label className="text-base font-semibold">Payment Mode</Label>
        <RadioGroup
          value={data.paymentMode}
          onValueChange={(value) => handleChange("paymentMode", value)}
          className="grid grid-cols-1 gap-4"
        >
          {/* TEMPORARILY HIDDEN 
          <div className={`flex items-center space-x-3 border rounded-lg p-4 cursor-pointer transition-colors ${data.paymentMode === 'razorpay' ? 'border-primary bg-primary/5' : 'hover:border-primary'}`}>
            <RadioGroupItem value="razorpay" id="razorpay" />
            <Label htmlFor="razorpay" className="cursor-pointer">
              <span className="font-medium">Pay Online (Razorpay)</span>
              <span className="text-sm text-muted-foreground block">
                Pay securely via UPI, Credit/Debit Card, or Netbanking
              </span>
            </Label>
          </div>

          <div className={`flex items-center space-x-3 border rounded-lg p-4 cursor-pointer transition-colors ${data.paymentMode === 'wallet' ? 'border-primary bg-primary/5' : 'hover:border-primary'}`}>
            <RadioGroupItem value="wallet" id="wallet" />
            <Label htmlFor="wallet" className="cursor-pointer">
              <span className="font-medium">FastFare Wallet</span>
              <span className="text-sm text-muted-foreground block">
                Deduct the amount directly from your wallet balance
              </span>
            </Label>
          </div>
          * /}

          <div className={`flex items-center space-x-3 border rounded-lg p-4 cursor-pointer transition-colors ${data.paymentMode === 'cod' ? 'border-primary bg-primary/5' : 'hover:border-primary'}`}>
            <RadioGroupItem value="cod" id="cod" />
            <Label htmlFor="cod" className="cursor-pointer w-full">
              <div className="flex justify-between items-center w-full">
                <div>
                  <span className="font-medium">Cash on Delivery (COD)</span>
                  <span className="text-sm text-muted-foreground block">
                    Collect payment from customer upon delivery
                  </span>
                </div>
              </div>
            </Label>
          </div>
        </RadioGroup>
      */}

      {/* Show COD Amount Input immediately if COD is the default (which it is) */}
      <div className="space-y-3">

        {data.paymentMode === 'cod' && (
          <div className="mt-4 p-4 border rounded-lg bg-orange-50 border-orange-200">
            <Label htmlFor="codAmount" className="text-orange-800">COD Amount to Collect (₹)</Label>
            <Input
              id="codAmount"
              type="number"
              min={1}
              className="mt-2"
              value={data.codAmount || ""}
              onChange={(e) => handleChange("codAmount", parseInt(e.target.value) || 0)}
              placeholder="e.g. 500"
            />
            <div className="flex items-center gap-2 mt-2">
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-green-100 text-green-700 text-xs font-medium">
                ✅ No extra charges for COD
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PackageForm;
