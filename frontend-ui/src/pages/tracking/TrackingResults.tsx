import { useState, useEffect } from "react";
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
  CheckCircle,
  Clock,
  Phone,
  Share2,
  Map,
  Calendar,
  AlertTriangle,
  Loader2,
  Copy,
} from "lucide-react";
import { toast } from "sonner";
import logo from "@/assets/logo.png";
import { API_BASE_URL } from "@/config";

interface TrackingData {
  awb: string;
  orderId?: string;
  status: string;
  carrier?: string;
  estimatedDelivery?: string;
  deliveryTime?: string;
  pickup?: { city: string; address: string; date?: string };
  delivery?: { city: string; address: string; name?: string };
  currentLocation?: string;
  timeline?: Array<{
    status: string;
    description: string;
    time: string;
    location: string;
    completed: boolean;
    current?: boolean;
  }>;
}

const TrackingResults = () => {
  const { awb } = useParams();
  const navigate = useNavigate();
  const [trackingData, setTrackingData] = useState<TrackingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    toast.success(`${field} copied to clipboard`);
    setTimeout(() => setCopiedField(null), 2000);
  };

  useEffect(() => {
    const fetchTracking = async () => {
      try {
        setLoading(true);
        setError(null);

        // Try shipment tracking endpoint first (the main tracking API)
        const res = await fetch(`${API_BASE_URL}/api/tracking/${awb}`);
        const data = await res.json();

        if (res.ok && data.success && data.tracking) {
          const t = data.tracking;

          // Build timeline from trackingHistory
          const statusOrder = ['pending', 'pickup_scheduled', 'picked_up', 'in_transit', 'out_for_delivery', 'delivered'];
          const statusLabels: Record<string, string> = {
            pending: 'Order Created',
            pickup_scheduled: 'Pickup Scheduled',
            picked_up: 'Picked Up',
            in_transit: 'In Transit',
            out_for_delivery: 'Out for Delivery',
            delivered: 'Delivered',
          };
          const statusDescriptions: Record<string, string> = {
            pending: 'Shipment has been booked and is awaiting pickup',
            pickup_scheduled: 'Pickup has been scheduled by the carrier',
            picked_up: 'Package picked up from sender',
            in_transit: 'Package is in transit to destination',
            out_for_delivery: 'Package is out for delivery',
            delivered: 'Package delivered successfully',
          };

          const currentIdx = statusOrder.indexOf(t.status);
          const timeline = statusOrder.map((s, i) => {
            // Find matching history entry
            const historyEntry = t.history?.find((h: any) => h.status === s);
            return {
              status: statusLabels[s] || s,
              description: historyEntry?.description || statusDescriptions[s] || '',
              time: historyEntry ? new Date(historyEntry.timestamp).toLocaleString() : (i <= currentIdx ? 'Completed' : 'Pending'),
              location: historyEntry?.location || (i <= currentIdx ? t.origin || '—' : '—'),
              completed: i <= currentIdx,
              current: i === currentIdx,
            };
          });

          setTrackingData({
            awb: t.awb || awb || "",
            orderId: t.awb,
            status: t.status || "pending",
            carrier: t.carrier || "FastFare",
            estimatedDelivery: t.estimatedDelivery
              ? new Date(t.estimatedDelivery).toLocaleDateString()
              : "—",
            deliveryTime: "",
            pickup: t.pickup ? {
              city: t.pickup.city || t.origin || "Origin",
              address: [t.pickup.address, t.pickup.city, t.pickup.state, t.pickup.pincode].filter(Boolean).join(", "),
              date: t.createdAt ? new Date(t.createdAt).toLocaleDateString() : undefined,
            } : { city: t.origin || "Origin", address: "" },
            delivery: t.delivery ? {
              city: t.delivery.city || t.destination || "Destination",
              address: [t.delivery.address, t.delivery.city, t.delivery.state, t.delivery.pincode].filter(Boolean).join(", "),
              name: t.delivery.name || t.recipientName || "",
            } : { city: t.destination || "Destination", address: "", name: t.recipientName || "" },
            currentLocation: t.status?.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase()) || "Pending",
            timeline,
          });
          return;
        }

        // Fallback: try parcel tracking
        const parcelRes = await fetch(`${API_BASE_URL}/api/parcels/track/${awb}`);
        const parcelData = await parcelRes.json();

        if (parcelRes.ok && parcelData.success && parcelData.parcel) {
          const parcel = parcelData.parcel;
          setTrackingData({
            awb: parcel.awb || awb || "",
            orderId: parcel.orderId,
            status: parcel.status || "unknown",
            carrier: "FastFare",
            estimatedDelivery: parcel.estimatedDelivery || "—",
            deliveryTime: "",
            pickup: parcel.sender ? {
              city: parcel.sender.city || "Origin",
              address: parcel.sender.address || "",
            } : undefined,
            delivery: parcel.receiver ? {
              city: parcel.receiver.city || "Destination",
              address: parcel.receiver.address || "",
              name: parcel.receiver.name,
            } : undefined,
            currentLocation: parcel.currentLocation || parcel.status,
            timeline: [
              {
                status: "Scanned",
                description: "Package scanned at origin",
                time: parcel.scannedAt ? new Date(parcel.scannedAt).toLocaleString() : "—",
                location: parcel.sender?.city || "Origin",
                completed: true,
                current: parcel.status === "scanned",
              },
              {
                status: "Dispatched",
                description: "Package dispatched for delivery",
                time: ["dispatched", "in-transit", "delivered"].includes(parcel.status) ? "Completed" : "Pending",
                location: "—",
                completed: ["dispatched", "in-transit", "delivered"].includes(parcel.status),
                current: parcel.status === "dispatched",
              },
              {
                status: "In Transit",
                description: "Package in transit to destination",
                time: ["in-transit", "delivered"].includes(parcel.status) ? "Completed" : "Pending",
                location: "—",
                completed: ["in-transit", "delivered"].includes(parcel.status),
                current: parcel.status === "in-transit",
              },
              {
                status: "Delivered",
                description: "Package delivered successfully",
                time: parcel.deliveredAt ? new Date(parcel.deliveredAt).toLocaleString() : "Pending",
                location: parcel.receiver?.city || "Destination",
                completed: parcel.status === "delivered",
                current: parcel.status === "delivered",
              },
            ],
          });
          return;
        }

        // Both failed
        setError(data.error || data.message || "Shipment not found");
      } catch (err) {
        setError("Failed to fetch tracking information");
      } finally {
        setLoading(false);
      }
    };

    if (awb) fetchTracking();
  }, [awb]);

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      "in-transit": "bg-blue-100 text-blue-700",
      delivered: "bg-green-100 text-green-700",
      dispatched: "bg-orange-100 text-orange-700",
      scanned: "bg-yellow-100 text-yellow-700",
    };
    return colors[status] || "bg-gray-100 text-gray-700";
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Tracking shipment...</p>
        </div>
      </div>
    );
  }

  // Error / not found state
  if (error || !trackingData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
        <header className="border-b bg-background/80 backdrop-blur-sm sticky top-0 z-10">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={() => navigate("/track")}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <a href="/" className="flex items-center gap-2">
                <img src={logo} alt="FastFare" className="h-8 w-auto" />
              </a>
            </div>
          </div>
        </header>
        <main className="container mx-auto px-4 py-16 text-center">
          <AlertTriangle className="h-16 w-16 text-yellow-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Shipment Not Found</h2>
          <p className="text-muted-foreground mb-6">{error || "No tracking data available for this AWB number."}</p>
          <Button onClick={() => navigate("/track")} className="gradient-primary">
            Track Another Shipment
          </Button>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      {/* Header */}
      <header className="border-b bg-background/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate("/track")}
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <a href="/" className="flex items-center gap-2">
                <img src={logo} alt="FastFare" className="h-8 w-auto" />
              </a>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm">
                <Share2 className="h-4 w-4 mr-2" /> Share
              </Button>
              <Button variant="outline" size="sm" onClick={() => navigate("/login")}>
                Login
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto">
          {/* Status Card */}
          <Card className="mb-6 overflow-hidden">
            <div className="bg-primary/5 px-6 py-4 border-b">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">
                    Tracking Number
                  </p>
                  <div className="flex items-center gap-2">
                    <p className="text-xl font-bold font-mono">{trackingData.awb}</p>
                    <button
                      onClick={() => copyToClipboard(trackingData.awb, 'Tracking Number')}
                      className="h-7 w-7 rounded-md hover:bg-muted transition-colors inline-flex items-center justify-center"
                      title="Copy Tracking Number"
                    >
                      {copiedField === 'Tracking Number' ? (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      ) : (
                        <Copy className="h-4 w-4 text-muted-foreground" />
                      )}
                    </button>
                  </div>
                  {trackingData.orderId && trackingData.orderId !== trackingData.awb && (
                    <div className="flex items-center gap-2 mt-1">
                      <p className="text-xs text-muted-foreground">Order ID: <span className="font-mono">{trackingData.orderId}</span></p>
                      <button
                        onClick={() => copyToClipboard(trackingData.orderId!, 'Order ID')}
                        className="h-5 w-5 rounded hover:bg-muted transition-colors inline-flex items-center justify-center"
                        title="Copy Order ID"
                      >
                        {copiedField === 'Order ID' ? (
                          <CheckCircle className="h-3 w-3 text-green-500" />
                        ) : (
                          <Copy className="h-3 w-3 text-muted-foreground" />
                        )}
                      </button>
                    </div>
                  )}
                </div>
                <Badge className={`${getStatusColor(trackingData.status)} text-sm px-4 py-1`}>
                  <Truck className="h-4 w-4 mr-2" />
                  {trackingData.status.replace(/-/g, " ").replace(/\b\w/g, l => l.toUpperCase())}
                </Badge>
              </div>
            </div>
            <CardContent className="pt-6">
              <div className="grid md:grid-cols-2 gap-6">
                {/* Estimated Delivery */}
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <Calendar className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Estimated Delivery
                    </p>
                    <p className="font-semibold">
                      {trackingData.estimatedDelivery}
                    </p>
                    {trackingData.deliveryTime && (
                      <p className="text-sm text-muted-foreground">
                        {trackingData.deliveryTime}
                      </p>
                    )}
                  </div>
                </div>

                {/* Current Location */}
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <MapPin className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Current Status
                    </p>
                    <p className="font-semibold">
                      {trackingData.currentLocation}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Carrier: {trackingData.carrier}
                    </p>
                  </div>
                </div>
              </div>

              {trackingData.pickup && trackingData.delivery && (
                <>
                  <Separator className="my-6" />

                  {/* Route */}
                  <div className="flex items-center gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <div className="w-3 h-3 rounded-full bg-green-500" />
                        <span className="text-sm text-muted-foreground">From</span>
                      </div>
                      <p className="font-medium">{trackingData.pickup.city}</p>
                      <p className="text-sm text-muted-foreground truncate">
                        {trackingData.pickup.address}
                      </p>
                    </div>
                    <div className="flex-shrink-0">
                      <div className="w-16 h-0.5 bg-primary relative">
                        <Truck className="absolute -top-2 left-1/2 -translate-x-1/2 h-5 w-5 text-primary bg-background" />
                      </div>
                    </div>
                    <div className="flex-1 text-right">
                      <div className="flex items-center justify-end gap-2 mb-1">
                        <span className="text-sm text-muted-foreground">To</span>
                        <div className="w-3 h-3 rounded-full bg-red-500" />
                      </div>
                      <p className="font-medium">{trackingData.delivery.city}</p>
                      <p className="text-sm text-muted-foreground truncate">
                        {trackingData.delivery.name}
                      </p>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Timeline */}
          {trackingData.timeline && trackingData.timeline.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Package className="h-5 w-5 text-primary" />
                  Shipment Timeline
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="relative">
                  {trackingData.timeline.map((event, index) => (
                    <div key={index} className="flex gap-4 pb-8 last:pb-0">
                      <div className="relative flex flex-col items-center">
                        <div
                          className={`w-10 h-10 rounded-full flex items-center justify-center ${event.completed
                            ? event.current
                              ? "bg-primary text-primary-foreground"
                              : "bg-green-100 text-green-600"
                            : "bg-muted text-muted-foreground"
                            }`}
                        >
                          {event.completed ? (
                            event.current ? (
                              <Truck className="h-5 w-5" />
                            ) : (
                              <CheckCircle className="h-5 w-5" />
                            )
                          ) : (
                            <Clock className="h-5 w-5" />
                          )}
                        </div>
                        {index < trackingData.timeline!.length - 1 && (
                          <div
                            className={`absolute top-10 w-0.5 h-full ${event.completed ? "bg-green-200" : "bg-muted"
                              }`}
                          />
                        )}
                      </div>
                      <div className="flex-1 pt-1.5">
                        <div className="flex items-center gap-2">
                          <p
                            className={`font-medium ${event.current ? "text-primary" : ""
                              }`}
                          >
                            {event.status}
                          </p>
                          {event.current && (
                            <Badge className="text-xs">Current</Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {event.description}
                        </p>
                        <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                          <span>{event.time}</span>
                          <span>•</span>
                          <span>{event.location}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3 mt-6">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => navigate(`/tracking/${awb}/live`)}
            >
              <Map className="h-4 w-4 mr-2" /> View Live Map
            </Button>
            <Button variant="outline" className="flex-1">
              <Phone className="h-4 w-4 mr-2" /> Contact Support
            </Button>
            <Button
              className="flex-1 gradient-primary"
              onClick={() => navigate("/track")}
            >
              Track Another Shipment
            </Button>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t py-8 mt-16">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>© 2024 FastFare. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default TrackingResults;
