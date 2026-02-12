import { API_BASE_URL } from "@/config";
import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import {
  Truck,
  Plus,
  Upload,
  X,
  CheckCircle,
  XCircle,
  Clock,
  Trash2,
  Image,
  Loader2,
  Search,
  Eye,
  Edit,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { fleetApi, Truck as TruckType, TruckFormData } from "@/lib/fleetApi";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const TrucksTab = () => {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [trucks, setTrucks] = useState<TruckType[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [selectedPhotos, setSelectedPhotos] = useState<File[]>([]);
  const [photoPreview, setPhotoPreview] = useState<string[]>([]);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [rejectDialog, setRejectDialog] = useState<{ open: boolean; truckId: string }>({
    open: false,
    truckId: "",
  });
  const [rejectReason, setRejectReason] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [merchantFilter, setMerchantFilter] = useState("all");
  const [uniqueMerchants, setUniqueMerchants] = useState<string[]>([]);

  const [formData, setFormData] = useState<TruckFormData>({
    name: "",
    chassisNo: "",
    rcNo: "",
    dlNo: "",
    vehicleType: "light_truck",
    capacity: "",
    manufacturer: "",
    model: "",
    year: "",
    color: "",
    insuranceNo: "",
    insuranceExpiry: "",
    permitNo: "",
    permitExpiry: "",
    fitnessExpiry: "",
    photos: [],
  });

  const isAdmin = JSON.parse(localStorage.getItem("user") || "{}")?.role === "admin";

  useEffect(() => {
    fetchTrucks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, merchantFilter]);

  useEffect(() => {
    if (trucks.length > 0 && isAdmin) {
      // Extract unique merchants (business names)
      const merchants = Array.from(new Set(trucks.map(t => t.createdBy?.businessName || "Unknown Merchant")));
      setUniqueMerchants(merchants);
    }
  }, [trucks, isAdmin]);

  const fetchTrucks = async () => {
    try {
      setLoading(true);
      const data = await fleetApi.getTrucks(statusFilter);
      let filteredTrucks = data.trucks;

      if (isAdmin && merchantFilter !== "all") {
        filteredTrucks = filteredTrucks.filter((t) => (t.createdBy?.businessName || "Unknown Merchant") === merchantFilter);
      }

      setTrucks(filteredTrucks);
    } catch (error) {
      console.error("Error fetching trucks:", error);
      toast({
        title: "Error",
        description: "Failed to fetch trucks",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePhotosChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const validFiles = files.filter((file) => {
      if (!["image/jpeg", "image/jpg", "image/png"].includes(file.type)) {
        toast({
          title: "Invalid file type",
          description: "Only JPG and PNG images are allowed",
          variant: "destructive",
        });
        return false;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Maximum file size is 5MB",
          variant: "destructive",
        });
        return false;
      }
      return true;
    });

    const totalPhotos = selectedPhotos.length + validFiles.length;
    if (totalPhotos > 5) {
      toast({
        title: "Too many photos",
        description: "Maximum 5 photos allowed",
        variant: "destructive",
      });
      return;
    }

    const newPhotos = [...selectedPhotos, ...validFiles];
    setSelectedPhotos(newPhotos);

    // Generate previews
    validFiles.forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview((prev) => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removePhoto = (index: number) => {
    setSelectedPhotos((prev) => prev.filter((_, i) => i !== index));
    setPhotoPreview((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.chassisNo || !formData.rcNo || !formData.dlNo) {
      toast({
        title: "Missing fields",
        description: "Please fill all required fields",
        variant: "destructive",
      });
      return;
    }

    try {
      setSubmitting(true);
      await fleetApi.addTruck({ ...formData, photos: selectedPhotos });
      toast({
        title: "Success",
        description: "Truck submitted for approval",
      });
      setShowForm(false);
      resetForm();
      fetchTrucks();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to add truck";
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
    setFormData({ 
      name: "", 
      chassisNo: "", 
      rcNo: "", 
      dlNo: "", 
      vehicleType: "light_truck",
      capacity: "",
      manufacturer: "",
      model: "",
      year: "",
      color: "",
      insuranceNo: "",
      insuranceExpiry: "",
      permitNo: "",
      permitExpiry: "",
      fitnessExpiry: "",
      photos: [] 
    });
    setSelectedPhotos([]);
    setPhotoPreview([]);
  };

  const handleApprove = async (id: string) => {
    try {
      await fleetApi.approveTruck(id);
      toast({ title: "Success", description: "Truck approved" });
      fetchTrucks();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to approve";
      toast({ title: "Error", description: message, variant: "destructive" });
    }
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) {
      toast({
        title: "Error",
        description: "Please provide a rejection reason",
        variant: "destructive",
      });
      return;
    }
    try {
      await fleetApi.rejectTruck(rejectDialog.truckId, rejectReason);
      toast({ title: "Success", description: "Truck rejected" });
      setRejectDialog({ open: false, truckId: "" });
      setRejectReason("");
      fetchTrucks();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to reject";
      toast({ title: "Error", description: message, variant: "destructive" });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this truck?")) return;
    try {
      await fleetApi.deleteTruck(id);
      toast({ title: "Success", description: "Truck deleted" });
      fetchTrucks();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to delete";
      toast({ title: "Error", description: message, variant: "destructive" });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800"><Clock className="h-3 w-3 mr-1" /> Pending</Badge>;
      case "approved":
        return <Badge variant="secondary" className="bg-green-100 text-green-800"><CheckCircle className="h-3 w-3 mr-1" /> Approved</Badge>;
      case "rejected":
        return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" /> Rejected</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Truck className="h-6 w-6 text-primary" />
            Trucks
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Manage your truck fleet
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border rounded-md text-sm"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
          <Button onClick={() => setShowForm(true)} className="gap-2">
            <Plus className="h-4 w-4" /> Add Truck
          </Button>
        </div>
      </div>

      {/* Add Truck Form */}
      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>Add New Truck</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Truck Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., Tata 407 - Fleet #1"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="chassisNo">Chassis Number *</Label>
                  <Input
                    id="chassisNo"
                    value={formData.chassisNo}
                    onChange={(e) => setFormData({ ...formData, chassisNo: e.target.value.toUpperCase() })}
                    placeholder="e.g., MAT123456789"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="rcNo">RC Number *</Label>
                  <Input
                    id="rcNo"
                    value={formData.rcNo}
                    onChange={(e) => setFormData({ ...formData, rcNo: e.target.value.toUpperCase() })}
                    placeholder="e.g., MH01AB1234"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dlNo">DL Number *</Label>
                  <Input
                    id="dlNo"
                    value={formData.dlNo}
                    onChange={(e) => setFormData({ ...formData, dlNo: e.target.value.toUpperCase() })}
                    placeholder="e.g., MH0120190001234"
                    required
                  />
                </div>
              </div>

              {/* Vehicle Details */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="vehicleType">Vehicle Type</Label>
                  <select
                    id="vehicleType"
                    value={formData.vehicleType}
                    onChange={(e) => setFormData({ ...formData, vehicleType: e.target.value })}
                    className="w-full px-3 py-2 border rounded-md"
                  >
                    <option value="mini_truck">Mini Truck</option>
                    <option value="pickup">Pickup</option>
                    <option value="light_truck">Light Truck</option>
                    <option value="medium_truck">Medium Truck</option>
                    <option value="heavy_truck">Heavy Truck</option>
                    <option value="trailer">Trailer</option>
                    <option value="container">Container</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="capacity">Capacity</Label>
                  <Input
                    id="capacity"
                    value={formData.capacity}
                    onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                    placeholder="e.g., 5 Ton"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="color">Color</Label>
                  <Input
                    id="color"
                    value={formData.color}
                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                    placeholder="e.g., White"
                  />
                </div>
              </div>

              {/* Manufacturer Details */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="manufacturer">Manufacturer</Label>
                  <Input
                    id="manufacturer"
                    value={formData.manufacturer}
                    onChange={(e) => setFormData({ ...formData, manufacturer: e.target.value })}
                    placeholder="e.g., Tata, Mahindra"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="model">Model</Label>
                  <Input
                    id="model"
                    value={formData.model}
                    onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                    placeholder="e.g., 407, Bolero"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="year">Year</Label>
                  <Input
                    id="year"
                    type="number"
                    value={formData.year}
                    onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                    placeholder="e.g., 2022"
                    min="1990"
                    max={new Date().getFullYear() + 1}
                  />
                </div>
              </div>

              {/* Insurance & Permit */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="insuranceNo">Insurance Number</Label>
                  <Input
                    id="insuranceNo"
                    value={formData.insuranceNo}
                    onChange={(e) => setFormData({ ...formData, insuranceNo: e.target.value.toUpperCase() })}
                    placeholder="Insurance policy number"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="insuranceExpiry">Insurance Expiry</Label>
                  <Input
                    id="insuranceExpiry"
                    type="date"
                    value={formData.insuranceExpiry}
                    onChange={(e) => setFormData({ ...formData, insuranceExpiry: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="permitNo">Permit Number</Label>
                  <Input
                    id="permitNo"
                    value={formData.permitNo}
                    onChange={(e) => setFormData({ ...formData, permitNo: e.target.value.toUpperCase() })}
                    placeholder="Permit number"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="permitExpiry">Permit Expiry</Label>
                  <Input
                    id="permitExpiry"
                    type="date"
                    value={formData.permitExpiry}
                    onChange={(e) => setFormData({ ...formData, permitExpiry: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fitnessExpiry">Fitness Expiry</Label>
                  <Input
                    id="fitnessExpiry"
                    type="date"
                    value={formData.fitnessExpiry}
                    onChange={(e) => setFormData({ ...formData, fitnessExpiry: e.target.value })}
                  />
                </div>
              </div>

              {/* Photo Upload */}
              <div className="space-y-2">
                <Label>Photos (Max 5, JPG/PNG, 5MB each)</Label>
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:border-primary transition-colors"
                >
                  <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">
                    Click to upload photos ({selectedPhotos.length}/5)
                  </p>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/jpg,image/png"
                  multiple
                  onChange={handlePhotosChange}
                  className="hidden"
                />

                {/* Photo Preview Grid */}
                {photoPreview.length > 0 && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-4">
                    {photoPreview.map((src, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={src}
                          alt={`Preview ${index + 1}`}
                          className="w-full h-24 object-cover rounded-lg"
                        />
                        <button
                          type="button"
                          onClick={() => removePhoto(index)}
                          className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
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
                      Submitting...
                    </>
                  ) : (
                    "Submit for Approval"
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Trucks List */}
      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : trucks.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Truck className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No trucks found</p>
            <Button onClick={() => setShowForm(true)} className="mt-4 gap-2">
              <Plus className="h-4 w-4" /> Add Your First Truck
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {trucks.map((truck) => (
            <Card key={truck._id}>
              <CardContent className="p-4">
                <div className="flex flex-col lg:flex-row gap-4">
                  {/* Photo Gallery */}
                  <div className="w-full lg:w-48 flex-shrink-0">
                    {truck.photos.length > 0 ? (
                      <div className="grid grid-cols-3 lg:grid-cols-2 gap-1">
                        {truck.photos.slice(0, 6).map((photo, index) => {
                          const photoUrl = photo.startsWith('http') ? photo : `${API_BASE_URL}/${photo}`;
                          return (
                            <img
                              key={index}
                              src={photoUrl}
                              alt={`Truck ${index + 1}`}
                              className="w-full h-16 object-cover rounded cursor-pointer hover:opacity-80"
                              onClick={() => setPreviewImage(photoUrl)}
                            />
                          );
                        })}
                      </div>
                    ) : (
                      <div className="h-24 bg-muted rounded-lg flex items-center justify-center">
                        <Image className="h-8 w-8 text-muted-foreground" />
                      </div>
                    )}
                  </div>

                  {/* Truck Details */}
                  <div className="flex-1 space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-semibold text-lg">{truck.name}</h3>
                      {getStatusBadge(truck.status)}
                      {isAdmin && truck.createdBy && (
                          <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                              <span className="font-normal text-xs text-muted-foreground mr-1">Merchant:</span>
                              {truck.createdBy.businessName}
                          </Badge>
                      )}
                      {truck.vehicleType && (
                        <Badge variant="outline" className="capitalize">
                          {truck.vehicleType.replace('_', ' ')}
                        </Badge>
                      )}
                      {truck.capacity && (
                        <Badge variant="outline" className="bg-blue-50 text-blue-700">
                          {truck.capacity}
                        </Badge>
                      )}
                    </div>
                    {/* Primary Info */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 text-sm">
                      <div>
                        <span className="text-muted-foreground">Chassis:</span>{" "}
                        <span className="font-mono">{truck.chassisNo}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">RC:</span>{" "}
                        <span className="font-mono">{truck.rcNo}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">DL:</span>{" "}
                        <span className="font-mono">{truck.dlNo}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Added:</span>{" "}
                        {new Date(truck.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                    {/* Extended Info */}
                    {(truck.manufacturer || truck.model || truck.year || truck.color) && (
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-sm border-t pt-2 mt-2">
                        {truck.manufacturer && (
                          <div>
                            <span className="text-muted-foreground">Make:</span>{" "}
                            <span>{truck.manufacturer}</span>
                          </div>
                        )}
                        {truck.model && (
                          <div>
                            <span className="text-muted-foreground">Model:</span>{" "}
                            <span>{truck.model}</span>
                          </div>
                        )}
                        {truck.year && (
                          <div>
                            <span className="text-muted-foreground">Year:</span>{" "}
                            <span>{truck.year}</span>
                          </div>
                        )}
                      </div>
                    )}
                    {/* Insurance & Permit Info */}
                    {(truck.insuranceNo || truck.permitNo || truck.fitnessExpiry) && (
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-sm border-t pt-2 mt-2">
                        {truck.insuranceNo && (
                          <div>
                            <span className="text-muted-foreground">Insurance:</span>{" "}
                            <span className="font-mono text-xs">{truck.insuranceNo}</span>
                            {truck.insuranceExpiry && (
                              <span className={`ml-1 text-xs ${new Date(truck.insuranceExpiry) < new Date() ? 'text-red-500' : 'text-green-600'}`}>
                                (Exp: {new Date(truck.insuranceExpiry).toLocaleDateString()})
                              </span>
                            )}
                          </div>
                        )}
                        {truck.permitNo && (
                          <div>
                            <span className="text-muted-foreground">Permit:</span>{" "}
                            <span className="font-mono text-xs">{truck.permitNo}</span>
                            {truck.permitExpiry && (
                              <span className={`ml-1 text-xs ${new Date(truck.permitExpiry) < new Date() ? 'text-red-500' : 'text-green-600'}`}>
                                (Exp: {new Date(truck.permitExpiry).toLocaleDateString()})
                              </span>
                            )}
                          </div>
                        )}
                        {truck.fitnessExpiry && (
                          <div>
                            <span className="text-muted-foreground">Fitness:</span>{" "}
                            <span className={`text-xs ${new Date(truck.fitnessExpiry) < new Date() ? 'text-red-500' : 'text-green-600'}`}>
                              {new Date(truck.fitnessExpiry).toLocaleDateString()}
                            </span>
                          </div>
                        )}
                      </div>
                    )}
                    {truck.status === "rejected" && truck.rejectionReason && (
                      <p className="text-sm text-red-600 bg-red-50 p-2 rounded">
                        <strong>Rejection Reason:</strong> {truck.rejectionReason}
                      </p>
                    )}
                  </div>

                  {/* Admin Actions */}
                  {isAdmin && (
                    <div className="flex gap-2 flex-wrap lg:flex-col">
                      {truck.status === "pending" && (
                        <>
                          <Button
                            size="sm"
                            className="gap-1 bg-green-600 hover:bg-green-700"
                            onClick={() => handleApprove(truck._id)}
                          >
                            <CheckCircle className="h-4 w-4" /> Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            className="gap-1"
                            onClick={() => setRejectDialog({ open: true, truckId: truck._id })}
                          >
                            <XCircle className="h-4 w-4" /> Reject
                          </Button>
                        </>
                      )}
                      <Button
                        size="sm"
                        variant="outline"
                        className="gap-1 text-red-600 hover:text-red-700"
                        onClick={() => handleDelete(truck._id)}
                      >
                        <Trash2 className="h-4 w-4" /> Delete
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Reject Dialog */}
      <Dialog open={rejectDialog.open} onOpenChange={(open) => setRejectDialog({ ...rejectDialog, open })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Truck</DialogTitle>
            <DialogDescription>
              Please provide a reason for rejection. This will be visible to the user.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            placeholder="Enter rejection reason..."
            rows={4}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectDialog({ open: false, truckId: "" })}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleReject}>
              Reject Truck
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Image Preview Dialog */}
      <Dialog open={!!previewImage} onOpenChange={() => setPreviewImage(null)}>
        <DialogContent className="max-w-3xl">
          {previewImage && (
            <img src={previewImage} alt="Preview" className="w-full h-auto rounded-lg" />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TrucksTab;
