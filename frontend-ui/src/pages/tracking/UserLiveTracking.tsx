import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
    ArrowLeft, Truck, MapPin, Phone, User, Package, Clock, CheckCircle,
    Navigation, Radio
} from "lucide-react";
import { io, Socket } from "socket.io-client";
import { API_BASE_URL } from "@/config";

interface TrackingData {
    parcel: any;
    shipment: any;
    driverLocation: {
        driverId: string;
        driverName: string;
        lat: number;
        lng: number;
        online: boolean;
        timestamp: number;
    } | null;
}

const UserLiveTracking = () => {
    const { awb } = useParams();
    const navigate = useNavigate();
    const [tracking, setTracking] = useState<TrackingData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [driverPos, setDriverPos] = useState<{ lat: number; lng: number } | null>(null);
    const socketRef = useRef<Socket | null>(null);
    const mapRef = useRef<HTMLDivElement>(null);
    const mapInstanceRef = useRef<any>(null);
    const markerRef = useRef<any>(null);

    // Fetch tracking data
    useEffect(() => {
        if (!awb) return;
        const token = localStorage.getItem("token");

        fetch(`${API_BASE_URL}/api/parcels/track/${awb}`, {
            headers: token ? { Authorization: `Bearer ${token}` } : {},
        })
            .then((r) => r.json())
            .then((data) => {
                if (data.success) {
                    setTracking(data);
                    if (data.driverLocation) {
                        setDriverPos({ lat: data.driverLocation.lat, lng: data.driverLocation.lng });
                    }
                } else {
                    setError(data.message || "Tracking data not found");
                }
                setLoading(false);
            })
            .catch(() => {
                setError("Failed to load tracking data");
                setLoading(false);
            });
    }, [awb]);

    // Socket.io for real-time driver updates
    useEffect(() => {
        if (!awb) return;

        const socket = io(API_BASE_URL, { transports: ["websocket", "polling"] });
        socketRef.current = socket;

        socket.on("connect", () => {
            // Join dashboard room to receive driver_location_update events
            socket.emit("join_dashboard");
            // Also join AWB-specific tracking room for locationUpdate events
            socket.emit("join_tracking", awb);
        });

        const handleLocationUpdate = (data: any) => {
            if (!data?.lat || !data?.lng) return;

            // If we know the driverId, only accept updates from that driver
            // Otherwise, accept any update (the backend sends all to dashboard)
            const expectedDriverId = tracking?.driverLocation?.driverId;
            if (expectedDriverId && data.driverId && data.driverId !== expectedDriverId) return;

            setDriverPos({ lat: data.lat, lng: data.lng });

            // Update driver info if we have a name
            if (data.driverName && !tracking?.driverLocation) {
                setTracking(prev => prev ? {
                    ...prev,
                    driverLocation: {
                        driverId: data.driverId || 'unknown',
                        driverName: data.driverName || 'Driver',
                        lat: data.lat,
                        lng: data.lng,
                        online: true,
                        timestamp: data.timestamp || Date.now()
                    }
                } : prev);
            }
        };

        // Listen for both event names
        socket.on("locationUpdate", handleLocationUpdate);
        socket.on("driver_location_update", handleLocationUpdate);

        return () => {
            socket.emit("leave_tracking", awb);
            socket.disconnect();
        };
    }, [awb, tracking?.driverLocation?.driverId]);

    // Google Maps initialization
    useEffect(() => {
        if (!driverPos || !mapRef.current) return;

        const initMap = () => {
            if (!window.google?.maps) return;

            if (!mapInstanceRef.current) {
                mapInstanceRef.current = new window.google.maps.Map(mapRef.current!, {
                    center: { lat: driverPos.lat, lng: driverPos.lng },
                    zoom: 15,
                    styles: [
                        { featureType: "poi", stylers: [{ visibility: "off" }] },
                        { featureType: "transit", stylers: [{ visibility: "off" }] },
                    ],
                    mapTypeControl: false,
                    streetViewControl: false,
                    fullscreenControl: false,
                });
            }

            // Update or create marker
            if (markerRef.current) {
                markerRef.current.setPosition({ lat: driverPos.lat, lng: driverPos.lng });
            } else {
                markerRef.current = new window.google.maps.Marker({
                    position: { lat: driverPos.lat, lng: driverPos.lng },
                    map: mapInstanceRef.current,
                    title: tracking?.driverLocation?.driverName || "Driver",
                    icon: {
                        path: window.google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
                        fillColor: "#3B82F6",
                        fillOpacity: 1,
                        strokeWeight: 2,
                        strokeColor: "#1E40AF",
                        scale: 6,
                        rotation: 0,
                    },
                });
            }

            // Pan to new position smoothly
            mapInstanceRef.current.panTo({ lat: driverPos.lat, lng: driverPos.lng });
        };

        if (window.google?.maps) {
            initMap();
        } else {
            // Load Google Maps if not present
            const script = document.createElement("script");
            script.src = `https://maps.googleapis.com/maps/api/js?key=${import.meta.env.VITE_GOOGLE_MAPS_API_KEY || ""}`;
            script.async = true;
            script.onload = initMap;
            document.head.appendChild(script);
        }
    }, [driverPos]);

    const shipment = tracking?.shipment;
    const driverInfo = tracking?.driverLocation;

    const getStatusBadge = (status: string) => {
        const map: Record<string, { label: string; color: string; icon: any }> = {
            pending: { label: "Pending", color: "bg-yellow-100 text-yellow-800", icon: Clock },
            pickup_scheduled: { label: "Pickup Scheduled", color: "bg-blue-100 text-blue-800", icon: Clock },
            picked_up: { label: "Picked Up", color: "bg-indigo-100 text-indigo-800", icon: Package },
            in_transit: { label: "In Transit", color: "bg-purple-100 text-purple-800", icon: Truck },
            out_for_delivery: { label: "Out for Delivery", color: "bg-orange-100 text-orange-800", icon: Navigation },
            delivered: { label: "Delivered", color: "bg-green-100 text-green-800", icon: CheckCircle },
        };
        const s = map[status] || { label: status, color: "bg-gray-100 text-gray-800", icon: Package };
        const Icon = s.icon;
        return (
            <Badge className={s.color}>
                <Icon className="h-3 w-3 mr-1" /> {s.label}
            </Badge>
        );
    };

    return (
        <DashboardLayout>
            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold flex items-center gap-2">
                            <Radio className="h-6 w-6 text-blue-500 animate-pulse" />
                            Live Tracking
                        </h1>
                        <p className="text-muted-foreground">
                            AWB: <span className="font-mono font-medium">{awb}</span>
                        </p>
                    </div>
                </div>

                {loading && (
                    <div className="flex items-center justify-center py-20">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
                    </div>
                )}

                {error && (
                    <Card>
                        <CardContent className="pt-6 text-center text-muted-foreground">
                            <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                            <p className="text-lg font-medium">{error}</p>
                            <p className="text-sm mt-2">Make sure the AWB number is correct</p>
                        </CardContent>
                    </Card>
                )}

                {tracking && !error && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Map — 2/3 width */}
                        <div className="lg:col-span-2">
                            <Card className="overflow-hidden">
                                <div
                                    ref={mapRef}
                                    className="w-full bg-muted"
                                    style={{ height: "500px" }}
                                >
                                    {!driverPos && (
                                        <div className="flex items-center justify-center h-full">
                                            <div className="text-center text-muted-foreground">
                                                <MapPin className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                                <p className="font-medium">Driver location not available</p>
                                                <p className="text-sm">The driver hasn't started sharing their location yet</p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                                {driverInfo && (
                                    <CardContent className="py-3 bg-blue-50 border-t flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <div className={`w-3 h-3 rounded-full ${driverInfo.online ? "bg-green-500 animate-pulse" : "bg-gray-400"}`} />
                                            <span className="font-medium">{driverInfo.driverName}</span>
                                            <span className="text-sm text-muted-foreground">
                                                {driverInfo.online ? "Online" : "Offline"}
                                            </span>
                                        </div>
                                        <span className="text-xs text-muted-foreground font-mono">
                                            {driverPos ? `${driverPos.lat.toFixed(4)}, ${driverPos.lng.toFixed(4)}` : "—"}
                                        </span>
                                    </CardContent>
                                )}
                            </Card>
                        </div>

                        {/* Sidebar — shipment details */}
                        <div className="space-y-4">
                            {/* Status */}
                            {shipment && (
                                <Card>
                                    <CardContent className="pt-6 space-y-4">
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm text-muted-foreground">Status</span>
                                            {getStatusBadge(shipment.status)}
                                        </div>
                                        {shipment.estimatedDelivery && (
                                            <div className="flex items-center justify-between">
                                                <span className="text-sm text-muted-foreground">ETA</span>
                                                <span className="font-medium text-sm">
                                                    {new Date(shipment.estimatedDelivery).toLocaleDateString()}
                                                </span>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            )}

                            {/* Driver Info */}
                            {driverInfo && (
                                <Card>
                                    <CardContent className="pt-6">
                                        <p className="text-sm text-muted-foreground mb-3 flex items-center gap-1">
                                            <User className="h-4 w-4" /> Assigned Driver
                                        </p>
                                        <p className="font-bold text-lg">{driverInfo.driverName}</p>
                                        <div className="flex items-center gap-1 mt-1">
                                            <div className={`w-2 h-2 rounded-full ${driverInfo.online ? "bg-green-500" : "bg-gray-400"}`} />
                                            <span className="text-sm text-muted-foreground">
                                                {driverInfo.online ? "Currently Online" : "Last seen recently"}
                                            </span>
                                        </div>
                                    </CardContent>
                                </Card>
                            )}

                            {/* Route */}
                            {shipment && (
                                <Card>
                                    <CardContent className="pt-6 space-y-3">
                                        <div>
                                            <p className="text-sm text-muted-foreground flex items-center gap-1">
                                                <MapPin className="h-3 w-3 text-green-600" /> From
                                            </p>
                                            <p className="font-medium">{shipment.pickup?.address}</p>
                                            <p className="text-sm text-muted-foreground">
                                                {shipment.pickup?.city} - {shipment.pickup?.pincode}
                                            </p>
                                        </div>
                                        <hr />
                                        <div>
                                            <p className="text-sm text-muted-foreground flex items-center gap-1">
                                                <Navigation className="h-3 w-3 text-red-600" /> To
                                            </p>
                                            <p className="font-medium">{shipment.delivery?.address}</p>
                                            <p className="text-sm text-muted-foreground">
                                                {shipment.delivery?.city} - {shipment.delivery?.pincode}
                                            </p>
                                        </div>
                                    </CardContent>
                                </Card>
                            )}

                            {/* Tracking Timeline */}
                            {shipment?.trackingHistory && shipment.trackingHistory.length > 0 && (
                                <Card>
                                    <CardContent className="pt-6">
                                        <p className="font-medium mb-3">Tracking History</p>
                                        <div className="space-y-3">
                                            {[...shipment.trackingHistory].reverse().map((event: any, i: number) => (
                                                <div key={i} className="flex items-start gap-3">
                                                    <div className={`w-2.5 h-2.5 rounded-full mt-1.5 ${i === 0 ? "bg-primary" : "bg-gray-300"}`} />
                                                    <div className="flex-1">
                                                        <p className="text-sm font-medium">{event.description || event.status}</p>
                                                        <p className="text-xs text-muted-foreground">
                                                            {event.location && `${event.location} • `}
                                                            {new Date(event.timestamp).toLocaleString()}
                                                        </p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </CardContent>
                                </Card>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
};

export default UserLiveTracking;
