import { useState, useEffect, useRef } from "react";
import { API_BASE_URL } from "@/config";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  User,
  Plus,
  Upload,
  X,
  CheckCircle,
  Trash2,
  Loader2,
  Phone,
  CreditCard,
  IdCard,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { fleetApi, Driver, DriverFormData } from "@/lib/fleetApi";

const DriversTab = () => {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  const [formData, setFormData] = useState<DriverFormData>({
    fullName: "",
    mobile: "",
    dlNo: "",
    aadhaar: "",
  });

  const [formErrors, setFormErrors] = useState({
    mobile: "",
    aadhaar: "",
  });

  const isAdmin = JSON.parse(localStorage.getItem("user") || "{}")?.role === "admin";

  useEffect(() => {
    fetchDrivers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchDrivers = async () => {
    try {
      setLoading(true);
      const data = await fleetApi.getDrivers();
      setDrivers(data.drivers);
    } catch (error) {
      console.error("Error fetching drivers:", error);
      toast({
        title: "Error",
        description: "Failed to fetch drivers",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!["image/jpeg", "image/jpg", "image/png"].includes(file.type)) {
      toast({
        title: "Invalid file type",
        description: "Only JPG and PNG images are allowed",
        variant: "destructive",
      });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Maximum file size is 5MB",
        variant: "destructive",
      });
      return;
    }

    setSelectedPhoto(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setPhotoPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const validateMobile = (value: string) => {
    if (value && !/^[6-9]\d{9}$/.test(value)) {
      return "Must be a valid 10-digit Indian mobile number";
    }
    return "";
  };

  const validateAadhaar = (value: string) => {
    if (value && !/^\d{12}$/.test(value)) {
      return "Must be exactly 12 digits";
    }
    return "";
  };

  const handleMobileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, "").slice(0, 10);
    setFormData({ ...formData, mobile: value });
    setFormErrors({ ...formErrors, mobile: validateMobile(value) });
  };

  const handleAadhaarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, "").slice(0, 12);
    setFormData({ ...formData, aadhaar: value });
    setFormErrors({ ...formErrors, aadhaar: validateAadhaar(value) });
  };

  const maskAadhaar = (aadhaar: string) => {
    if (!aadhaar || aadhaar.length < 12) return aadhaar;
    return `XXXX-XXXX-${aadhaar.slice(-4)}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate all fields
    const mobileError = validateMobile(formData.mobile);
    const aadhaarError = validateAadhaar(formData.aadhaar);

    if (mobileError || aadhaarError) {
      setFormErrors({ mobile: mobileError, aadhaar: aadhaarError });
      return;
    }

    if (!formData.fullName || !formData.mobile || !formData.dlNo || !formData.aadhaar) {
      toast({
        title: "Missing fields",
        description: "Please fill all required fields",
        variant: "destructive",
      });
      return;
    }

    try {
      setSubmitting(true);
      await fleetApi.addDriver({
        ...formData,
        photo: selectedPhoto || undefined,
      });
      toast({
        title: "Success",
        description: "Driver added successfully",
      });
      setShowForm(false);
      resetForm();
      fetchDrivers();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to add driver";
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({ fullName: "", mobile: "", dlNo: "", aadhaar: "" });
    setSelectedPhoto(null);
    setPhotoPreview(null);
    setFormErrors({ mobile: "", aadhaar: "" });
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this driver?")) return;
    try {
      await fleetApi.deleteDriver(id);
      toast({ title: "Success", description: "Driver deleted" });
      fetchDrivers();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to delete";
      toast({ title: "Error", description: message, variant: "destructive" });
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <User className="h-6 w-6 text-primary" />
            Drivers
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Manage your driver team
          </p>
        </div>
        <Button onClick={() => setShowForm(true)} className="gap-2">
          <Plus className="h-4 w-4" /> Add Driver
        </Button>
      </div>

      {/* Add Driver Form */}
      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>Add New Driver</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="fullName">Full Name *</Label>
                  <Input
                    id="fullName"
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    placeholder="Enter driver's full name"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="mobile">Mobile Number *</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="mobile"
                      value={formData.mobile}
                      onChange={handleMobileChange}
                      placeholder="9876543210"
                      className="pl-10"
                      required
                    />
                  </div>
                  {formErrors.mobile && (
                    <p className="text-xs text-red-500">{formErrors.mobile}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dlNo">DL Number *</Label>
                  <div className="relative">
                    <IdCard className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="dlNo"
                      value={formData.dlNo}
                      onChange={(e) => setFormData({ ...formData, dlNo: e.target.value.toUpperCase() })}
                      placeholder="MH0120190001234"
                      className="pl-10"
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="aadhaar">Aadhaar Number *</Label>
                  <div className="relative">
                    <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="aadhaar"
                      value={formData.aadhaar}
                      onChange={handleAadhaarChange}
                      placeholder="123456789012"
                      className="pl-10"
                      required
                    />
                  </div>
                  {formErrors.aadhaar && (
                    <p className="text-xs text-red-500">{formErrors.aadhaar}</p>
                  )}
                </div>
              </div>

              {/* Photo Upload */}
              <div className="space-y-2">
                <Label>Photo (Optional, JPG/PNG, max 5MB)</Label>
                <div className="flex items-center gap-4">
                  {photoPreview ? (
                    <div className="relative">
                      <Avatar className="h-20 w-20">
                        <AvatarImage src={photoPreview} />
                      </Avatar>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedPhoto(null);
                          setPhotoPreview(null);
                        }}
                        className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-1"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ) : (
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="h-20 w-20 border-2 border-dashed rounded-full flex items-center justify-center cursor-pointer hover:border-primary transition-colors"
                    >
                      <Upload className="h-6 w-6 text-muted-foreground" />
                    </div>
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/jpg,image/png"
                    onChange={handlePhotoChange}
                    className="hidden"
                  />
                  <p className="text-sm text-muted-foreground">
                    Click to upload driver photo
                  </p>
                </div>
              </div>

              <div className="flex gap-2 justify-end">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowForm(false);
                    resetForm();
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={submitting}>
                  {submitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Adding...
                    </>
                  ) : (
                    "Add Driver"
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Drivers List */}
      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : drivers.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <User className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No drivers found</p>
            <Button onClick={() => setShowForm(true)} className="mt-4 gap-2">
              <Plus className="h-4 w-4" /> Add Your First Driver
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {drivers.map((driver) => (
            <Card key={driver._id}>
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  <Avatar className="h-16 w-16">
                    {driver.photo ? (
                      <AvatarImage src={driver.photo.startsWith('http') ? driver.photo : `${API_BASE_URL}/${driver.photo}`} />
                    ) : null}
                    <AvatarFallback className="text-lg">
                      {getInitials(driver.fullName)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold truncate">{driver.fullName}</h3>
                      <Badge variant="secondary" className="bg-green-100 text-green-800">
                        <CheckCircle className="h-3 w-3 mr-1" /> Active
                      </Badge>
                    </div>
                    <div className="space-y-1 text-sm text-muted-foreground">
                      <p className="flex items-center gap-1">
                        <Phone className="h-3 w-3" /> {driver.mobile}
                      </p>
                      <p className="flex items-center gap-1">
                        <IdCard className="h-3 w-3" /> {driver.dlNo}
                      </p>
                      <p className="flex items-center gap-1">
                        <CreditCard className="h-3 w-3" /> {maskAadhaar(driver.aadhaar)}
                      </p>
                    </div>
                  </div>
                  <Button
                      size="icon"
                      variant="ghost"
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      onClick={() => handleDelete(driver._id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default DriversTab;
