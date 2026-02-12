import { useState, useEffect, useRef } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Truck, Package, MapPin, User, Radio, Eye, Loader2, AlertCircle
} from "lucide-react";
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { io, Socket } from "socket.io-client";
import { API_BASE_URL, GOOGLE_MAPS_API_KEY } from "@/config";

interface ParcelInfo {
    parcelId: string;
    barcode: string;
    awb: string;
    packageName: string;
    status: string;
    receiver: { name?: string; city?: string };
}

interface DriverFleet {
    driverId: string;
    driverName: string;
    lat: number;
    lng: number;
    online: boolean;
    timestamp: number;
    parcels: ParcelInfo[];
}

const PartnerFleetView = () => {
    const [fleet, setFleet] = useState<DriverFleet[]>([]);
    const [unassigned, setUnassigned] = useState<ParcelInfo[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedDriver, setSelectedDriver] = useState<DriverFleet | null>(null);
    const [stats, setStats] = useState({ totalDrivers: 0, totalParcels: 0 });
    const socketRef = useRef<Socket | null>(null);
    const mapRef = useRef<HTMLDivElement>(null);
    const mapInstanceRef = useRef<any>(null);
    const markersRef = useRef<Map<string, any>>(new Map());
    const infoWindowRef = useRef<any>(null);

    // Fetch fleet data
    useEffect(() => {
        const fetchFleet = async () => {
            try {
                const token = localStorage.getItem("token");
                const res = await fetch(`${API_BASE_URL}/api/parcels/partner/fleet-view`, {
                    headers: token ? { Authorization: `Bearer ${token}` } : {},
                });
                const data = await res.json();
                if (data.success) {
                    setFleet(data.fleet || []);
                    setUnassigned(data.unassignedParcels || []);
                    setStats({ totalDrivers: data.totalDrivers, totalParcels: data.totalParcels });
                }
            } catch (err) {
                console.error("Failed to fetch fleet:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchFleet();
        const interval = setInterval(fetchFleet, 30000); // Refresh every 30s
        return () => clearInterval(interval);
    }, []);

    // Socket.io for real-time updates
    useEffect(() => {
        const socket = io(API_BASE_URL, { transports: ["websocket", "polling"] });
        socketRef.current = socket;

        socket.on("connect", () => {
            socket.emit("join_dashboard");
        });

        socket.on("locationUpdate", (data: any) => {
            setFleet((prev) =>
                prev.map((d) =>
                    d.driverId === data.driverId
                        ? { ...d, lat: data.lat, lng: data.lng, online: true, timestamp: Date.now() }
                        : d
                )
            );
        });

        return () => { socket.disconnect(); };
    }, []);

    // Google Maps
    useEffect(() => {
        if (!mapRef.current || fleet.length === 0) return;

        const initMap = () => {
            if (!window.google?.maps) return;

            if (!mapInstanceRef.current) {
                // Center on India by default
                const center = fleet.length > 0
                    ? { lat: fleet[0].lat, lng: fleet[0].lng }
                    : { lat: 20.5937, lng: 78.9629 };

                mapInstanceRef.current = new window.google.maps.Map(mapRef.current!, {
                    center,
                    zoom: fleet.length === 1 ? 14 : 6,
                    styles: [
                        { featureType: "poi", stylers: [{ visibility: "off" }] },
                        { featureType: "transit", stylers: [{ visibility: "off" }] },
                    ],
                    mapTypeControl: false,
                    streetViewControl: false,
                });
            }

            // Update markers
            fleet.forEach((driver) => {
                const pos = { lat: driver.lat, lng: driver.lng };

                if (markersRef.current.has(driver.driverId)) {
                    markersRef.current.get(driver.driverId).setPosition(pos);
                } else {
                    const marker = new window.google.maps.Marker({
                        position: pos,
                        map: mapInstanceRef.current,
                        title: driver.driverName,
                        icon: {
                            path: window.google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
                            fillColor: driver.parcels.length > 0 ? "#3B82F6" : "#9CA3AF",
                            fillOpacity: 1,
                            strokeWeight: 2,
                            strokeColor: driver.parcels.length > 0 ? "#1E40AF" : "#6B7280",
                            scale: 6,
                        },
                    });

                    marker.addListener("click", () => {
                        setSelectedDriver(driver);

                        if (infoWindowRef.current) infoWindowRef.current.close();
                        const iw = new window.google.maps.InfoWindow({
                            content: `<div style="padding:8px;min-width:150px">
                <strong>${driver.driverName}</strong><br/>
                <span style="color:#666">${driver.parcels.length} parcel(s)</span><br/>
                <span style="color:${driver.online ? '#22C55E' : '#9CA3AF'}">
                  ● ${driver.online ? 'Online' : 'Offline'}
                </span>
              </div>`,
                        });
                        iw.open(mapInstanceRef.current, marker);
                        infoWindowRef.current = iw;
                    });

                    markersRef.current.set(driver.driverId, marker);
                }
            });
        };

        if (window.google?.maps) {
            initMap();
        } else {
            const script = document.createElement("script");
            script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY || ""}`;
            script.async = true;
            script.onload = initMap;
            document.head.appendChild(script);
        }
    }, [fleet]);

    const getStatusColor = (status: string) => {
        switch (status) {
            case "dispatched": return "bg-blue-100 text-blue-800";
            case "in_transit": return "bg-purple-100 text-purple-800";
            case "out_for_delivery": return "bg-orange-100 text-orange-800";
            default: return "bg-gray-100 text-gray-800";
        }
    };

    return (
        <DashboardLayout>
            <div className="space-y-6">
                {/* Header */}
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        <Radio className="h-6 w-6 text-blue-500 animate-pulse" />
                        Fleet View — Live Tracking
                    </h1>
                    <p className="text-muted-foreground">
                        All drivers and their assigned parcels in real-time
                    </p>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card>
                        <CardContent className="pt-6 flex items-center gap-3">
                            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                                <Truck className="h-5 w-5 text-blue-600" />
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Active Drivers</p>
                                <p className="text-2xl font-bold">{stats.totalDrivers}</p>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="pt-6 flex items-center gap-3">
                            <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                                <Package className="h-5 w-5 text-purple-600" />
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Active Parcels</p>
                                <p className="text-2xl font-bold">{stats.totalParcels}</p>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="pt-6 flex items-center gap-3">
                            <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
                                <AlertCircle className="h-5 w-5 text-yellow-600" />
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Unassigned</p>
                                <p className="text-2xl font-bold">{unassigned.length}</p>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {loading && (
                    <div className="flex items-center justify-center py-12">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                )}

                {!loading && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Map — 2/3 width */}
                        <div className="lg:col-span-2">
                            <Card className="overflow-hidden">
                                <div
                                    ref={mapRef}
                                    className="w-full bg-muted"
                                    style={{ height: "500px" }}
                                >
                                    {fleet.length === 0 && (
                                        <div className="flex items-center justify-center h-full">
                                            <div className="text-center text-muted-foreground">
                                                <Truck className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                                <p className="font-medium">No active drivers</p>
                                                <p className="text-sm">Drivers will appear here when they start sharing location</p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </Card>
                        </div>

                        {/* Driver List Sidebar */}
                        <div className="space-y-4">
                            <Card>
                                <CardHeader className="pb-3">
                                    <CardTitle className="text-lg flex items-center gap-2">
                                        <User className="h-5 w-5" /> Drivers
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="p-0">
                                    {fleet.length === 0 ? (
                                        <p className="text-center text-muted-foreground py-8 text-sm">No active drivers</p>
                                    ) : (
                                        <div className="divide-y max-h-[400px] overflow-y-auto">
                                            {fleet.map((driver) => (
                                                <div
                                                    key={driver.driverId}
                                                    className={`p-3 cursor-pointer hover:bg-muted/50 transition-colors ${selectedDriver?.driverId === driver.driverId ? "bg-blue-50" : ""
                                                        }`}
                                                    onClick={() => {
                                                        setSelectedDriver(driver);
                                                        if (mapInstanceRef.current) {
                                                            mapInstanceRef.current.panTo({ lat: driver.lat, lng: driver.lng });
                                                            mapInstanceRef.current.setZoom(15);
                                                        }
                                                    }}
                                                >
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex items-center gap-2">
                                                            <div className={`w-2.5 h-2.5 rounded-full ${driver.online ? "bg-green-500" : "bg-gray-400"}`} />
                                                            <span className="font-medium text-sm">{driver.driverName}</span>
                                                        </div>
                                                        <Badge variant="secondary" className="text-xs">
                                                            {driver.parcels.length} parcels
                                                        </Badge>
                                                    </div>
                                                    {driver.parcels.length > 0 && (
                                                        <div className="mt-2 pl-5 space-y-1">
                                                            {driver.parcels.slice(0, 3).map((p) => (
                                                                <div key={p.parcelId} className="text-xs text-muted-foreground flex items-center gap-1">
                                                                    <Package className="h-3 w-3" />
                                                                    <span>{p.packageName || p.parcelId}</span>
                                                                    <Badge className={`text-[10px] px-1 ${getStatusColor(p.status)}`}>
                                                                        {p.status}
                                                                    </Badge>
                                                                </div>
                                                            ))}
                                                            {driver.parcels.length > 3 && (
                                                                <p className="text-xs text-muted-foreground">+{driver.parcels.length - 3} more</p>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </CardContent>
                            </Card>

                            {/* Unassigned Parcels */}
                            {unassigned.length > 0 && (
                                <Card className="border-yellow-200">
                                    <CardHeader className="pb-3">
                                        <CardTitle className="text-lg flex items-center gap-2 text-yellow-700">
                                            <AlertCircle className="h-5 w-5" /> Unassigned Parcels
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="p-0">
                                        <div className="divide-y max-h-[200px] overflow-y-auto">
                                            {unassigned.map((p) => (
                                                <div key={p.parcelId} className="p-3 text-sm">
                                                    <p className="font-medium">{p.packageName || p.parcelId}</p>
                                                    <p className="text-xs text-muted-foreground">
                                                        {p.barcode} • {p.receiver?.city || "Unknown"}
                                                    </p>
                                                </div>
                                            ))}
                                        </div>
                                    </CardContent>
                                </Card>
                            )}
                        </div>
                    </div>
                )}

                {/* Selected Driver's Parcel Table */}
                {selectedDriver && selectedDriver.parcels.length > 0 && (
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                                <Truck className="h-5 w-5" />
                                {selectedDriver.driverName}'s Parcels
                                <Badge className={selectedDriver.online ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}>
                                    {selectedDriver.online ? "Online" : "Offline"}
                                </Badge>
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Parcel ID</TableHead>
                                        <TableHead>Barcode</TableHead>
                                        <TableHead>Package</TableHead>
                                        <TableHead>Receiver</TableHead>
                                        <TableHead>Status</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {selectedDriver.parcels.map((p) => (
                                        <TableRow key={p.parcelId}>
                                            <TableCell className="font-mono text-sm">{p.parcelId}</TableCell>
                                            <TableCell className="font-mono text-sm">{p.barcode}</TableCell>
                                            <TableCell>{p.packageName || "—"}</TableCell>
                                            <TableCell>{p.receiver?.name || "—"}</TableCell>
                                            <TableCell>
                                                <Badge className={getStatusColor(p.status)}>{p.status}</Badge>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                )}
            </div>
        </DashboardLayout>
    );
};

export default PartnerFleetView;
