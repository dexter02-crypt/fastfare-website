import { API_BASE_URL } from "@/config";
import { generateShippingLabelHTML, generateTaxInvoiceHTML, generateManifestHTML } from "@/utils/documentGenerators";
import { formatDate, formatDateTime } from "@/utils/dateFormat";
import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  ArrowLeft,
  MapPin,
  Package,
  Truck,
  Calendar,
  Clock,
  Phone,
  Copy,
  Download,
  Share2,
  Edit,
  XCircle,
  CheckCircle,
  Loader2,
  RefreshCw,
  FileText,
  Map,
} from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import { toast, useToast } from "@/hooks/use-toast";
import { io, Socket } from "socket.io-client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface ShipmentAddress {
  name: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  phone: string;
}

interface ShipmentPackage {
  name: string;
  quantity: number;
  weight: number;
  length: number;
  width: number;
  height: number;
  value: number;
}

interface TrackingEvent {
  status: string;
  location: string;
  timestamp: string;
  description?: string;
}

interface Shipment {
  id: string;
  _id?: string;
  awb: string;
  orderId?: string;
  status: string;
  carrier: string;
  serviceType: string;
  pickup: ShipmentAddress;
  delivery: ShipmentAddress;
  packages: ShipmentPackage[];
  trackingHistory: TrackingEvent[];
  contentType?: string;
  paymentMode?: string;
  shippingCost?: number;
  createdAt?: string;
  estimatedDelivery?: string;
  scan_pickup?: {
    driver_id: string;
    driver_name: string;
    driver_phone: string;
    scanned_at: string;
    location_lat: number;
    location_lng: number;
  };
  assignedPartner?: {
    _id?: string;
    name?: string;
    businessName?: string;
    phone?: string;
  } | string | null;
  assignedDriverName?: string | null;
  assigned_driver_id?: string | null;
  driver_location_lat?: number | null;
  driver_location_lng?: number | null;
}

const ShipmentDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [shipment, setShipment] = useState<Shipment | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showLiveMap, setShowLiveMap] = useState(false);
  const [driverLocation, setDriverLocation] = useState<{ lat: number, lng: number } | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markerRef = useRef<any>(null);

  useEffect(() => {
    const fetchShipment = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          navigate("/login");
          return;
        }

        let data;
        try {
          const response = await fetch(`${API_BASE_URL}/api/shipments/${id}`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });

          if (response.ok) {
            const result = await response.json();
            if (result.shipment) {
              data = result.shipment;
            }
          }
        } catch (apiErr) {
          // API unavailable
        }

        if (!data) {
          setError("Shipment not found or API unavailable");
          return;
        }

        setShipment(data);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
        console.error("Error fetching shipment:", err);
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    fetchShipment();
  }, [id, navigate]);

  // Socket setup for live tracking
  useEffect(() => {
    if (!shipment?._id) return;

    const socket = io(API_BASE_URL, { transports: ["websocket", "polling"] });
    socketRef.current = socket;

    socket.on("connect", () => {
      // The exact shipment ID tracking room name depends on backend logic,
      // But typically we can just listen globally to the location broadcast
      // or join a specific tracking room if the backend requires it.
      socket.emit("join_tracking", `tracking_${shipment._id}`);
      socket.emit("join_tracking", shipment._id); // Also try raw ID
    });

    socket.on("shipment_status_updated", (data: any) => {
      if (data.shipmentId === shipment._id) {
        setShipment(prev => prev ? { ...prev, status: data.status } : null);
        toast({ title: "Status Updated", description: "Shipment status changed to " + formatStatus(data.status) });
      }
    });

    socket.on("driver_location_broadcast", (data: any) => {
      if (shipment.assigned_driver_id && data.driver_id === shipment.assigned_driver_id) {
        setDriverLocation({ lat: data.lat, lng: data.lng });
      }
    });

    // Handle generic locationUpdate from older implementation
    socket.on("locationUpdate", (data: any) => {
      if (data.driverId === shipment.assigned_driver_id || data.driver_id === shipment.assigned_driver_id) {
        setDriverLocation({ lat: data.lat, lng: data.lng });
      }
    });

    return () => { socket.disconnect(); };
  }, [shipment?._id, shipment?.assigned_driver_id]);

  // Live Map Initializer
  useEffect(() => {
    if (!showLiveMap || !mapRef.current) return;

    const initMap = () => {
      if (!window.google?.maps) return;

      const pos = driverLocation ||
        (shipment?.driver_location_lat ? { lat: shipment.driver_location_lat, lng: shipment.driver_location_lng } : null) ||
        (shipment?.scan_pickup?.location_lat ? { lat: shipment.scan_pickup.location_lat, lng: shipment.scan_pickup.location_lng } : { lat: 20.5937, lng: 78.9629 });

      if (!mapInstanceRef.current) {
        mapInstanceRef.current = new window.google.maps.Map(mapRef.current, {
          center: pos,
          zoom: 15,
          mapTypeControl: false,
          streetViewControl: false,
        });

        markerRef.current = new window.google.maps.Marker({
          position: pos,
          map: mapInstanceRef.current,
          title: "Driver Location",
          icon: {
            path: window.google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
            fillColor: "#3B82F6",
            fillOpacity: 1,
            strokeWeight: 2,
            strokeColor: "#1E40AF",
            scale: 6,
          },
        });
      } else {
        if (driverLocation) {
          markerRef.current.setPosition(driverLocation);
          mapInstanceRef.current.panTo(driverLocation);
        }
      }
    };

    if (window.google?.maps) {
      initMap();
    } else {
      const script = document.createElement("script");
      script.src = `https://maps.googleapis.com/maps/api/js?key=${localStorage.getItem('GOOGLE_MAPS_API_KEY') || ""}`;
      script.async = true;
      script.onload = initMap;
      document.head.appendChild(script);
    }
  }, [showLiveMap, driverLocation, shipment]);

  const handleCopyAwb = () => {
    if (shipment?.awb) {
      navigator.clipboard.writeText(shipment.awb);
      toast({
        title: "Copied!",
        description: "AWB number copied to clipboard",
      });
    }
  };

  const handlePrintLabel = async () => {
    if (!shipment) return;
    try {
      // Generate QR token and get data URL from backend
      const token = localStorage.getItem('token');
      const shipmentId = shipment._id || shipment.id || id;
      const qrRes = await fetch(`${API_BASE_URL}/api/scan/generate-qr/${shipmentId}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      let qrDataURL: string | undefined;
      if (qrRes.ok) {
        const qrData = await qrRes.json();
        qrDataURL = qrData.qrDataURL;
      }

      const labelWindow = window.open('', '_blank', 'width=800,height=600');
      if (labelWindow) {
        labelWindow.document.write(generateShippingLabelHTML(shipment, true, qrDataURL));
        labelWindow.document.close();
        setTimeout(() => labelWindow.print(), 500);
      }
    } catch (err) {
      // Fallback: print without QR
      const labelWindow = window.open('', '_blank', 'width=800,height=600');
      if (labelWindow) {
        labelWindow.document.write(generateShippingLabelHTML(shipment, true));
        labelWindow.document.close();
        setTimeout(() => labelWindow.print(), 500);
      }
    }
  };

  const handleDownloadInvoice = () => {
    if (!shipment) return;
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const invoiceWindow = window.open('', '_blank', 'width=800,height=1000');
    if (invoiceWindow) {
      invoiceWindow.document.write(generateTaxInvoiceHTML(shipment, user));
      invoiceWindow.document.close();
    }
  };

  const handleDownloadManifest = () => {
    if (!shipment) return;
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const manifestWindow = window.open('', '_blank', 'width=900,height=700');
    if (manifestWindow) {
      manifestWindow.document.write(generateManifestHTML([shipment], user.businessName || 'Business Customer', 'FastFare Logistics'));
      manifestWindow.document.close();
    }
  };

  const handleShare = () => {
    const shareUrl = `${window.location.origin}/tracking/${shipment.awb}`;
    navigator.clipboard.writeText(shareUrl);
    toast({
      title: "Link Copied",
      description: "Tracking link copied to clipboard",
    });
  };

  const handleCancelShipment = async () => {
    if (!confirm("Are you sure you want to cancel this shipment?")) return;

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_BASE_URL}/api/shipments/${id}/cancel`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error("Failed to cancel");

      setShipment({ ...shipment, status: 'cancelled' });
      toast({ title: "Shipment Cancelled" });
    } catch (err) {
      toast({ title: "Error", description: "Could not cancel shipment", variant: "destructive" });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !shipment) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background gap-4">
        <p className="text-destructive font-medium">{error || "Shipment not found"}</p>
        <Button onClick={() => navigate("/dashboard")}>Go to Dashboard</Button>
      </div>
    );
  }

  const statusColors: Record<string, string> = {
    "in_transit": "bg-blue-100 text-blue-700",
    "picked_up": "bg-purple-100 text-purple-700",
    "delivered": "bg-green-100 text-green-700",
    "pending": "bg-yellow-100 text-yellow-700",
    "cancelled": "bg-red-100 text-red-700",
    "out_for_delivery": "bg-orange-100 text-orange-700",
    "pickup_scheduled": "bg-cyan-100 text-cyan-700",
    "processing": "bg-gray-100 text-gray-700",
  };

  const formatStatus = (status: string) => {
    if (!status) return "Unknown";
    return status.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };

  const getSafeValue = <T,>(value: T | null | undefined, defaultValue: T): T => {
    return value !== null && value !== undefined && value !== "" ? value : defaultValue;
  };

  const getSafeAddress = (address: ShipmentAddress | null | undefined): ShipmentAddress => {
    if (!address) {
      return { name: "Unknown", address: "No address provided", city: "", state: "", pincode: "", phone: "" };
    }
    return {
      name: getSafeValue(address.name, "Unknown"),
      address: getSafeValue(address.address, "No address provided"),
      city: getSafeValue(address.city, ""),
      state: getSafeValue(address.state, ""),
      pincode: getSafeValue(address.pincode, ""),
      phone: getSafeValue(address.phone, ""),
    };
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 print:bg-white">

        {/* Print specific header for label */}
        <div className="hidden print:block mb-8 border-b pb-4">
          <h1 className="text-3xl font-bold mb-2">Shipment Label</h1>
          <p className="text-lg">AWB: {shipment.awb}</p>
        </div>

        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8 print:hidden">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/dashboard")}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold">Shipment Details</h1>
                <Badge className={statusColors[shipment.status] || "bg-gray-100 text-gray-700"}>
                  {formatStatus(shipment.status)}
                </Badge>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <span className="font-mono">AWB: {shipment.awb}</span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={handleCopyAwb}
                >
                  <Copy className="h-3 w-3" />
                </Button>
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handlePrintLabel}>
              <Download className="h-4 w-4 mr-2" /> Print Label
            </Button>
            <Button variant="outline" size="sm" onClick={handleDownloadInvoice}>
              <Download className="h-4 w-4 mr-2" /> Invoice
            </Button>
            <Button variant="outline" size="sm" onClick={handleDownloadManifest}>
              <FileText className="h-4 w-4 mr-2" /> Manifest
            </Button>
            <Button variant="outline" size="sm" onClick={handleShare}>
              <Share2 className="h-4 w-4 mr-2" /> Share
            </Button>
            <Button variant="outline" size="sm" onClick={() => navigate(`/returns/create?shipmentId=${id}`)}>
              <RefreshCw className="h-4 w-4 mr-2" /> Create Return
            </Button>
            {['pending', 'pickup_scheduled'].includes(shipment.status) && (
              <Button variant="destructive" size="sm" onClick={handleCancelShipment}>
                <XCircle className="h-4 w-4 mr-2" /> Cancel
              </Button>
            )}
            {/* Bug 5: View Live Location button */}
            {shipment.assignedDriverName && ['in_transit', 'out_for_delivery', 'picked_up', 'dispatched'].includes(shipment.status) && (
              <Button
                variant="default"
                size="sm"
                className="bg-green-600 hover:bg-green-700"
                onClick={() => setShowLiveMap(true)}
              >
                <MapPin className="h-4 w-4 mr-2" /> 📍 View Live Location
              </Button>
            )}
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left Column - Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Addresses */}
            <Card className="print:shadow-none print:border-2">
              <CardHeader>
                <CardTitle className="text-base">Shipping Route</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-6">
                  {/* Pickup */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <div className="p-2 bg-green-100 rounded-lg print:hidden">
                        <MapPin className="h-4 w-4 text-green-600" />
                      </div>
                      <span className="font-medium">Pickup (From)</span>
                    </div>
                    <div className="ml-10 space-y-1 text-sm print:ml-2">
                      <p className="font-medium text-base">{getSafeAddress(shipment.pickup).name}</p>
                      <p className="text-muted-foreground print:text-black">
                        {getSafeAddress(shipment.pickup).address}
                      </p>
                      <p className="text-muted-foreground print:text-black">
                        {getSafeAddress(shipment.pickup).city}, {getSafeAddress(shipment.pickup).state} - {getSafeAddress(shipment.pickup).pincode}
                      </p>
                      <div className="flex items-center gap-4 pt-2">
                        <span className="flex items-center gap-1 text-muted-foreground print:text-black">
                          <Phone className="h-3 w-3" />
                          {getSafeAddress(shipment.pickup).phone}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Delivery */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <div className="p-2 bg-red-100 rounded-lg print:hidden">
                        <MapPin className="h-4 w-4 text-red-600" />
                      </div>
                      <span className="font-medium">Delivery (To)</span>
                    </div>
                    <div className="ml-10 space-y-1 text-sm print:ml-2">
                      <p className="font-medium text-base">{getSafeAddress(shipment.delivery).name}</p>
                      <p className="text-muted-foreground print:text-black">
                        {getSafeAddress(shipment.delivery).address}
                      </p>
                      <p className="text-muted-foreground print:text-black">
                        {getSafeAddress(shipment.delivery).city}, {getSafeAddress(shipment.delivery).state} - {getSafeAddress(shipment.delivery).pincode}
                      </p>
                      <div className="flex items-center gap-4 pt-2">
                        <span className="flex items-center gap-1 text-muted-foreground print:text-black">
                          <Phone className="h-3 w-3" />
                          {getSafeAddress(shipment.delivery).phone}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Package Details */}
            <Card className="print:shadow-none print:border-2">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Package className="h-5 w-5 text-primary" />
                  Package Details
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {shipment.packages && shipment.packages.length > 0 ? (
                    shipment.packages.map((pkg: ShipmentPackage, index: number) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 bg-muted rounded-lg print:bg-transparent print:border"
                      >
                        <div>
                          <p className="font-medium">{getSafeValue(pkg.name, "Package")}</p>
                          <p className="text-sm text-muted-foreground print:text-black">
                            Qty: {getSafeValue(pkg.quantity, 1)} | Weight: {getSafeValue(pkg.weight, 0)} kg | Dims: {getSafeValue(pkg.length, 0)}x{getSafeValue(pkg.width, 0)}x{getSafeValue(pkg.height, 0)} cm
                          </p>
                        </div>
                        <p className="font-medium">₹{getSafeValue(pkg.value, 0).toLocaleString()}</p>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-4 text-muted-foreground">No package details available</div>
                  )}
                  <Separator />
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Total Weight</p>
                      <p className="font-medium">
                        {shipment.packages && shipment.packages.length > 0
                          ? shipment.packages.reduce((sum: number, p: ShipmentPackage) => sum + ((p.weight ?? 0) * (p.quantity ?? 1)), 0).toFixed(2)
                          : "0"
                        } kg
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Content Type</p>
                      <p className="font-medium capitalize">{getSafeValue(shipment.contentType, "N/A")}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Payment Mode</p>
                      <p className="font-medium uppercase">{getSafeValue(shipment.paymentMode, "N/A")}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Shipping Cost</p>
                      <p className="font-medium text-primary">
                        ₹{getSafeValue(shipment.shippingCost, 0).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Timeline */}
            <Card className="print:hidden">
              <CardHeader>
                <CardTitle className="text-base">Tracking Timeline</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="relative">
                  {shipment.trackingHistory && shipment.trackingHistory.length > 0 ? (
                    [...shipment.trackingHistory].reverse().map((event: TrackingEvent, index: number) => (
                      <div key={index} className="flex gap-4 pb-8 last:pb-0">
                        <div className="relative flex flex-col items-center">
                          <div
                            className={`w-10 h-10 rounded-full flex items-center justify-center ${event.status === 'picked_up_by_driver'
                              ? 'bg-purple-100 text-purple-600'
                              : index === 0
                                ? 'bg-primary text-primary-foreground'
                                : 'bg-green-100 text-green-600'
                              }`}
                          >
                            {event.status === 'picked_up_by_driver' ? <Truck className="h-5 w-5" /> : index === 0 ? <Truck className="h-5 w-5" /> : <CheckCircle className="h-5 w-5" />}
                          </div>
                          {index < shipment.trackingHistory.length - 1 && (
                            <div className="absolute top-10 w-0.5 h-full bg-green-200" />
                          )}
                        </div>
                        <div className="flex-1 pt-1.5">
                          <div className="flex items-center gap-2">
                            <p className={`font-medium ${index === 0 ? "text-primary" : ""}`}>
                              {formatStatus(getSafeValue(event.status, "unknown"))}
                            </p>
                            {index === 0 && <Badge className="text-xs">Current</Badge>}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {event.timestamp ? new Date(event.timestamp).toLocaleString() : "Date N/A"}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {getSafeValue(event.location, "")} - {getSafeValue(event.description, "")}
                          </p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-muted-foreground text-center py-4">No tracking history available.</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Summary */}
          <div className="space-y-6 print:hidden">
            {/* Quick Info */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Shipment Info</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <Truck className="h-5 w-5 text-primary" />
                  <div>
                    <p className="text-sm text-muted-foreground">Carrier</p>
                    <p className="font-medium">{getSafeValue(shipment.carrier, "Not assigned")}</p>
                  </div>
                </div>
                <Separator />
                <div className="flex items-center gap-3">
                  <Package className="h-5 w-5 text-primary" />
                  <div>
                    <p className="text-sm text-muted-foreground">Service</p>
                    <p className="font-medium max-w-[150px] truncate" title={getSafeValue(shipment.serviceType, "N/A")}>{getSafeValue(shipment.serviceType, "N/A")}</p>
                  </div>
                </div>
                <Separator />
                <div className="flex items-center gap-3">
                  <Calendar className="h-5 w-5 text-primary" />
                  <div>
                    <p className="text-sm text-muted-foreground">Created</p>
                    <p className="font-medium">{shipment.createdAt ? formatDate(shipment.createdAt) : "N/A"}</p>
                  </div>
                </div>
                <Separator />
                <div className="flex items-center gap-3">
                  <Clock className="h-5 w-5 text-primary" />
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Expected Delivery
                    </p>
                    <p className="font-medium">
                      {shipment.estimatedDelivery ? formatDate(shipment.estimatedDelivery) : 'N/A'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Driver Info Card — Bug 37: show when assignedPartner OR scan_pickup exists */}
            {(shipment.scan_pickup?.scanned_at || shipment.assignedPartner || shipment.assignedDriverName) && (
              <Card className="border-purple-200 bg-purple-50/30">
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Truck className="h-5 w-5 text-purple-600" />
                    Driver Info
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">👤</span>
                    <div>
                      <p className="text-sm text-muted-foreground">Driver</p>
                      <p className="font-medium">
                        {shipment.scan_pickup?.driver_name
                          || (typeof shipment.assignedPartner === 'object' ? shipment.assignedPartner?.businessName || shipment.assignedPartner?.name : null)
                          || shipment.assignedDriverName
                          || 'Assigned'}
                      </p>
                    </div>
                  </div>
                  <Separator />
                  <div className="flex items-center gap-3">
                    <Phone className="h-5 w-5 text-primary" />
                    <div>
                      <p className="text-sm text-muted-foreground">Phone</p>
                      <p className="font-medium">
                        {shipment.scan_pickup?.driver_phone
                          || (typeof shipment.assignedPartner === 'object' ? shipment.assignedPartner?.phone : null)
                          || '—'}
                      </p>
                    </div>
                  </div>
                  <Separator />
                  <div className="flex items-center gap-3">
                    <Clock className="h-5 w-5 text-primary" />
                    <div>
                      <p className="text-sm text-muted-foreground">{shipment.scan_pickup?.scanned_at ? 'Picked up' : 'Status'}</p>
                      <p className="font-medium">
                        {shipment.scan_pickup?.scanned_at
                          ? formatDateTime(shipment.scan_pickup.scanned_at)
                          : 'Partner Assigned'}
                      </p>
                    </div>
                  </div>
                  {(shipment.scan_pickup?.location_lat && shipment.scan_pickup?.location_lng) && (
                    <>
                      <Separator />
                      <div className="flex items-center gap-3">
                        <MapPin className="h-5 w-5 text-primary" />
                        <div>
                          <p className="text-sm text-muted-foreground">Scan Location</p>
                          <p className="font-medium text-xs">
                            {shipment.scan_pickup.location_lat.toFixed(4)}, {shipment.scan_pickup.location_lng.toFixed(4)}
                          </p>
                        </div>
                      </div>
                    </>
                  )}

                  <div className="pt-2">
                    <Button
                      className="w-full bg-blue-600 hover:bg-blue-700"
                      onClick={() => setShowLiveMap(true)}
                    >
                      <Map className="h-4 w-4 mr-2" /> View Live Location
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Actions */}
            <Card className="bg-primary/5 border-primary/20">
              <CardHeader>
                <CardTitle className="text-base">Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button variant="outline" className="w-full justify-start" onClick={handlePrintLabel}>
                  <Download className="h-4 w-4 mr-2" /> Print Label
                </Button>
                <Button variant="outline" className="w-full justify-start" onClick={handleDownloadInvoice}>
                  <FileText className="h-4 w-4 mr-2" /> Download Invoice
                </Button>
                <Button variant="outline" className="w-full justify-start" onClick={handleShare}>
                  <Share2 className="h-4 w-4 mr-2" /> Share Tracking
                </Button>
                <Separator />
                <div className="text-center">
                  <p className="text-sm text-muted-foreground mb-3">
                    Need Help?
                  </p>
                  <Button variant="default" className="w-full">
                    <Phone className="h-4 w-4 mr-2" /> Call Support
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Live Map Modal */}
      <Dialog open={showLiveMap} onOpenChange={setShowLiveMap}>
        <DialogContent className="max-w-4xl h-[80vh] flex flex-col p-0 overflow-hidden">
          <DialogHeader className="p-4 border-b bg-muted/50">
            <DialogTitle className="flex items-center gap-2">
              <Map className="h-5 w-5 text-primary" />
              Live Driver Location
            </DialogTitle>
          </DialogHeader>
          <div className="flex-1 w-full bg-gray-100 relative">
            <div ref={mapRef} className="absolute inset-0 w-full h-full" />
            {!driverLocation && !shipment?.driver_location_lat && !shipment?.scan_pickup?.location_lat && (
              <div className="absolute inset-0 flex items-center justify-center bg-white/80 backdrop-blur-sm z-10">
                <div className="text-center">
                  <MapPin className="h-10 w-10 text-muted-foreground mx-auto mb-2 opacity-50" />
                  <p className="font-medium text-gray-700">Waiting for driver location...</p>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default ShipmentDetails;
