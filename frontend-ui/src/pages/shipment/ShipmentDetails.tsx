import { API_BASE_URL } from "@/config";
import { generateShippingLabelHTML, generateTaxInvoiceHTML, generateManifestHTML } from "@/utils/documentGenerators";
import { calculateInvoiceCharges } from "@/utils/invoiceUtils";
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
  Scale,
  Receipt,
  FileSpreadsheet,
  Info,
  Printer
} from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import { toast, useToast } from "@/hooks/use-toast";
import { io, Socket } from "socket.io-client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { BackButton } from "@/components/BackButton";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import LiveLocationModal from "./LiveLocationModal";

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
  codAmount?: number;
  shippingCost?: number;
  shippingFee?: number;
  codFee?: number;
  totalTax?: number;
  rto_charge?: number;
  totalAmount?: number;
  promoCode?: string;
  discountApplied?: number;
  invoiceNumber?: string;
  ewayBillNumber?: string;
  createdAt?: string;
  estimatedDelivery?: string;
  actualDelivery?: string;
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
  assignedDriver?: {
    name: string;
    driverId: string;
    vehicleNumber: string;
    phone: string;
    status: string;
  } | null;
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
  const [showInvoicePreview, setShowInvoicePreview] = useState(false);
  const [invoiceHtml, setInvoiceHtml] = useState<string>("");
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
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

  const handleDownloadInvoice = async () => {
    if (!shipment) return;
    
    try {
      toast({ title: "Generating Invoice", description: "Fetching organization details..." });
      
      let customerProfile = JSON.parse(localStorage.getItem('user') || '{}');
      const token = localStorage.getItem('token');
      
      try {
        const response = await fetch(`${API_BASE_URL}/api/settings/organization`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (response.ok) {
          const orgData = await response.json();
          customerProfile = { ...customerProfile, ...orgData };
        }
      } catch (fetchErr) {
        console.warn("Could not fetch organization details, proceeding with local profile.", fetchErr);
      }
      
      toast({ title: "Processing PDF", description: "Please wait..." });
      const htmlString = generateTaxInvoiceHTML(shipment, customerProfile, false);
      
      const container = document.createElement('div');
      container.style.position = 'fixed';
      container.style.left = '-9999px';
      container.style.opacity = '0';
      container.innerHTML = htmlString;
      document.body.appendChild(container);
      
      const invoiceNode = (container.querySelector('.container') || container) as HTMLElement;
      const html2pdf = (await import('html2pdf.js')).default;
      
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const opt = {
        margin: 10,
        filename: `Invoice_${shipment.awb || shipment._id}.pdf`,
        image: { type: 'jpeg' as const, quality: 1 },
        html2canvas: { scale: 4, useCORS: true },
        jsPDF: { unit: 'mm' as const, format: 'a4' as const, orientation: 'portrait' as const }
      };
      
      await html2pdf().set(opt).from(invoiceNode).save();
      document.body.removeChild(container);
      
      toast({ title: "Success", description: "Invoice downloaded successfully" });
    } catch (err) {
      console.error("Failed to generate invoice", err);
      toast({ title: "Error", description: "Failed to generate invoice", variant: "destructive" });
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const handleOpenInvoicePreview = async () => {
    if (!shipment) return;
    try {
      toast({ title: "Loading Invoice", description: "Fetching details..." });
      let customerProfile = JSON.parse(localStorage.getItem('user') || '{}');
      const token = localStorage.getItem('token');
      try {
        const response = await fetch(`${API_BASE_URL}/api/settings/organization`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (response.ok) {
          const orgData = await response.json();
          customerProfile = { ...customerProfile, ...orgData };
        }
      } catch(fetchErr) {
        console.warn("Could not fetch organization details, proceeding with local profile.", fetchErr);
      }
      setInvoiceHtml(generateTaxInvoiceHTML(shipment, customerProfile, false));
      setShowInvoicePreview(true);
    } catch (err) {
      toast({ title: "Error", description: "Failed to load invoice preview", variant: "destructive" });
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
        <div className="mb-8 print:hidden">
          <Breadcrumbs
            items={[
              { label: "Shipments", href: "/shipments" },
              { label: "Details" }
            ]}
            className="mb-4"
          />
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-4">
              <BackButton fallback="/shipments" />
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
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handlePrintLabel}>
              <Download className="h-4 w-4 mr-2" /> Print Label
            </Button>
            <Button variant="outline" size="sm" onClick={handleOpenInvoicePreview}>
              <Receipt className="h-4 w-4 mr-2" /> Invoice
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
            {shipment.assignedDriver && ['partner_assigned', 'driver_assigned', 'in_transit', 'out_for_delivery', 'picked_up', 'dispatched'].includes(shipment.status) && (
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
                </div>
              </CardContent>
            </Card>

            {/* NEW: Weight & Zone Details */}
            <Card className="print:shadow-none print:border-2">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Scale className="h-5 w-5 text-primary" />
                  Weight & Zone Details
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  {(() => {
                    const pkg = shipment.packages?.[0] || { quantity: 1, weight: 0, length: 0, width: 0, height: 0 };
                    const decWt = pkg.weight * pkg.quantity;
                    const volWt = ((pkg.length * pkg.width * pkg.height) / 5000) * pkg.quantity;
                    const appliedWt = Math.max(decWt, volWt);
                    return (
                      <>
                        <div>
                          <p className="text-muted-foreground">Declared Weight</p>
                          <p className="font-medium">{decWt.toFixed(2)} kg</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Dimensions</p>
                          <p className="font-medium">{pkg.length}x{pkg.width}x{pkg.height} cm</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Volumetric Wgt</p>
                          <p className="font-medium">{volWt.toFixed(2)} kg</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Applied Weight</p>
                          <p className="font-medium text-primary">{appliedWt.toFixed(2)} kg</p>
                        </div>
                      </>
                    );
                  })()}
                </div>
              </CardContent>
            </Card>

            {/* NEW: Charges Breakup */}
            <Card className="overflow-hidden print:shadow-none print:border-2">
              <CardHeader className="bg-muted/30">
                <CardTitle className="text-base flex items-center gap-2">
                  <Receipt className="h-5 w-5 text-primary" />
                  Charges Breakup
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="space-y-3 text-sm">
                  {(() => {
                    const charges = calculateInvoiceCharges(shipment);

                    return (
                      <>
                        <div className="flex justify-between items-center mb-2 pb-2 border-b border-dashed">
                          <span className="text-muted-foreground font-medium">Payment Mode</span>
                          {shipment.paymentMode === 'wallet' ? (
                            <Badge className="bg-purple-100 text-purple-700 hover:bg-purple-200 border-none">Wallet Paid</Badge>
                          ) : shipment.paymentMode === 'cod' ? (
                            <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-200 border-none">Cash on Delivery</Badge>
                          ) : (
                            <Badge className="bg-green-100 text-green-700 hover:bg-green-200 border-none capitalize">{shipment.paymentMode || 'Prepaid'}</Badge>
                          )}
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Forward Charge</span>
                          <span className="font-medium">₹{charges.forwardCharge.toFixed(2)}</span>
                        </div>
                        {charges.rtoCharge > 0 && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">RTO Charge</span>
                            <span className="font-medium text-red-600">₹{charges.rtoCharge.toFixed(2)}</span>
                          </div>
                        )}
                        {charges.codFee > 0 && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">COD Fee</span>
                            <span className="font-medium">₹{charges.codFee.toFixed(2)}</span>
                          </div>
                        )}
                        <Separator className="my-2" />
                        <div className="flex justify-between font-medium">
                          <span>Total Taxable Amount</span>
                          <span>₹{charges.totalTaxableAmount.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">IGST (18%)</span>
                          <span className="font-medium">₹{charges.igstAmount.toFixed(2)}</span>
                        </div>
                        {shipment.discountApplied > 0 && (
                          <>
                            <Separator className="my-2" />
                            <div className="flex justify-between text-green-600">
                              <span className="flex items-center gap-1">
                                Promo Discount
                                {shipment.promoCode && (
                                  <Badge variant="outline" className="ml-1 text-[10px] px-1.5 py-0 border-green-300 text-green-700 bg-green-50">{shipment.promoCode}</Badge>
                                )}
                              </span>
                              <span className="font-semibold">-₹{shipment.discountApplied.toFixed(2)}</span>
                            </div>
                          </>
                        )}
                        <Separator className="my-2" />
                        <div className="flex justify-between text-base font-bold text-primary">
                          <span>Final Amount</span>
                          <span>₹{Math.max(0, charges.finalAmount - (shipment.discountApplied || 0)).toFixed(2)}</span>
                        </div>
                      </>
                    );
                  })()}
                </div>
              </CardContent>
              <div className="bg-blue-50 border-t border-blue-100 p-3 text-xs text-blue-800 flex items-start gap-2">
                <Info className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
                <p>Info: FastFare applies 18% IGST on all shipping charges inline with Indian logistics regulations.</p>
              </div>
            </Card>

            {/* NEW: Invoice Details */}
            <Card className="print:shadow-none print:border-2">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <FileSpreadsheet className="h-5 w-5 text-primary" />
                  Invoice Details
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm">
                    <div>
                      <p className="text-muted-foreground">Invoice Number</p>
                      <p className="font-medium">{shipment.invoiceNumber || `INV-${shipment.awb}`}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Invoice Date</p>
                      <p className="font-medium">{shipment.createdAt ? formatDate(shipment.createdAt) : "N/A"}</p>
                    </div>
                    {shipment.ewayBillNumber && (
                      <div className="col-span-2 mt-2">
                        <p className="text-muted-foreground">E-Way Bill Number</p>
                        <p className="font-medium">{shipment.ewayBillNumber}</p>
                      </div>
                    )}
                  </div>
                  <Button variant="outline" size="sm" onClick={handleDownloadInvoice} className="shrink-0 bg-primary/5 hover:bg-primary/10 border-primary/20 text-primary">
                    <Download className="h-4 w-4 mr-2" /> Download PDF Invoice
                  </Button>
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
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Created</p>
                    <p className="font-medium">{shipment.createdAt ? formatDate(shipment.createdAt) : "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Expected</p>
                    <p className="font-medium">{shipment.estimatedDelivery ? formatDate(shipment.estimatedDelivery) : 'N/A'}</p>
                  </div>
                </div>
                <Separator />
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground flex items-center gap-1"><Receipt className="h-3.5 w-3.5" /> Payment Mode</p>
                    <p className="font-medium uppercase mt-1">
                      <Badge variant="outline" className={shipment.paymentMode === 'cod' ? "bg-amber-50 text-amber-700" : "bg-green-50 text-green-700"}>
                        {getSafeValue(shipment.paymentMode, "prepaid")}
                      </Badge>
                    </p>
                  </div>
                  {shipment.paymentMode === 'cod' && (
                    <div>
                      <p className="text-sm text-muted-foreground">COD Amount</p>
                      <p className="font-medium text-amber-700 mt-1">₹{getSafeValue(shipment.codAmount, 0).toLocaleString()}</p>
                    </div>
                  )}
                </div>
                <Separator />
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <div>
                    <p className="text-sm text-muted-foreground">Delivery Date</p>
                    <p className="font-medium">
                      {(shipment.status === 'delivered' && shipment.actualDelivery)
                        ? formatDate(shipment.actualDelivery)
                        : (shipment.status === 'delivered' ? 'Delivered' : 'Pending')}
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
                {shipment?.assignedDriver && ['partner_assigned', 'driver_assigned', 'in_transit', 'out_for_delivery', 'picked_up', 'dispatched'].includes(shipment?.status) && (
                  <>
                    <button
                      onClick={() => setShowLiveMap(true)}
                      className="action-btn live-location-btn"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        width: '100%',
                        padding: '12px 16px',
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px',
                        background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
                        color: 'white',
                        fontWeight: '600',
                        cursor: 'pointer',
                      }}
                    >
                      <span style={{ fontSize: '16px' }}>📍</span>
                      <span>View Live Location</span>
                      <span style={{ marginLeft: 'auto', fontSize: '11px', opacity: 0.8 }}>
                        {shipment.assignedDriver.name}
                      </span>
                    </button>

                    <div className="driver-info-card" style={{
                      marginTop: '12px',
                      padding: '12px',
                      background: '#f0f9ff',
                      borderRadius: '8px',
                      border: '1px solid #bae6fd',
                    }}>
                      <p style={{ fontWeight: '600', marginBottom: '6px', color: '#1e40af' }}>🚗 Assigned Driver</p>
                      <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '4px 12px', fontSize: '13px', color: '#374151' }}>
                        <span style={{ color: '#6b7280' }}>Name:</span>
                        <span style={{ fontWeight: '500' }}>{shipment.assignedDriver.name}</span>
                        <span style={{ color: '#6b7280' }}>ID:</span>
                        <span style={{ fontWeight: '500' }}>{shipment.assignedDriver.driverId}</span>
                        <span style={{ color: '#6b7280' }}>Vehicle:</span>
                        <span style={{ fontWeight: '500' }}>{shipment.assignedDriver.vehicleNumber || 'N/A'}</span>
                        <span style={{ color: '#6b7280' }}>Phone:</span>
                        <span style={{ fontWeight: '500' }}>{shipment.assignedDriver.phone || 'N/A'}</span>
                      </div>
                    </div>
                  </>
                )}
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
      {
        showLiveMap && (
          <LiveLocationModal
            shipmentId={shipment._id || shipment.id}
            driverId={shipment.assignedDriver?.driverId || shipment.assigned_driver_id}
            driverName={shipment.assignedDriver?.name || shipment.assignedDriverName}
            onClose={() => setShowLiveMap(false)}
          />
        )
      }

      {/* Full Screen Invoice Modal with Fixed Action Bar */}
      <Dialog open={showInvoicePreview} onOpenChange={setShowInvoicePreview}>
        <DialogContent className="max-w-[100vw] w-screen h-screen m-0 p-0 flex flex-col rounded-none overflow-hidden bg-gray-100">
          {/* Fixed Action Bar */}
          <div className="h-16 shrink-0 bg-white border-b flex items-center justify-between px-6 sticky top-0 z-50 shadow-sm">
            <DialogTitle className="text-lg font-bold flex items-center gap-2">
              <Receipt className="h-5 w-5 text-primary" />
              Tax Invoice — {shipment?.awb}
            </DialogTitle>
            <div className="flex items-center gap-3">
              <Button variant="outline" onClick={() => setShowInvoicePreview(false)}>
                Close
              </Button>
              <Button 
                variant="outline" 
                onClick={() => {
                  const printWin = window.open('', '_blank');
                  if (printWin) {
                    printWin.document.write(invoiceHtml);
                    printWin.document.close();
                    setTimeout(() => printWin.print(), 500);
                  }
                }}
              >
                <Printer className="h-4 w-4 mr-2" />
                Print
              </Button>
              <Button onClick={handleDownloadInvoice} disabled={isGeneratingPdf} className="min-w-[140px]">
                {isGeneratingPdf ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Download className="h-4 w-4 mr-2" />
                )}
                {isGeneratingPdf ? "Generating..." : "Download PDF"}
              </Button>
            </div>
          </div>
          
          {/* Full Screen Iframe View */}
          <div className="flex-1 w-full h-full overflow-hidden flex justify-center py-6">
            <iframe 
              srcDoc={invoiceHtml} 
              className="w-full max-w-[850px] h-full bg-white shadow-xl border border-gray-200 rounded-lg"
              title="Invoice Preview"
            />
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout >
  );
};

export default ShipmentDetails;
