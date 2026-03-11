import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
    LogOut, MapPin, Truck, CheckCircle, Package,
    Navigation, Loader2, AlertCircle, ScanLine, X, QrCode
} from "lucide-react";
import { API_BASE_URL } from "@/config";
import { io, Socket } from "socket.io-client";

interface ShipmentData {
    _id: string;
    awb: string;
    status: string;
    pickup: { name: string; address: string; city: string; pincode: string };
    delivery: { name: string; address: string; city: string; pincode: string };
    shippingCost: number;
}

const DriverDashboard = () => {
    const navigate = useNavigate();
    const [driver, setDriver] = useState<any>(null);
    const [shipments, setShipments] = useState<ShipmentData[]>([]);
    const [loading, setLoading] = useState(true);
    const [isSharingLocation, setIsSharingLocation] = useState(false);
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    // Bug 7: scanner state
    const [scannerOpen, setScannerOpen] = useState(false);
    const [scanLoading, setScanLoading] = useState(false);
    const [scannedShipment, setScannedShipment] = useState<ShipmentData | null>(null);
    const scannerRef = useRef<any>(null);
    const scannerContainerRef = useRef<HTMLDivElement>(null);

    const socketRef = useRef<Socket | null>(null);
    const locationIntervalRef = useRef<any>(null);

    useEffect(() => {
        const token = localStorage.getItem("driver_token");
        const driverInfoStr = localStorage.getItem("driver_info");

        if (!token || !driverInfoStr) {
            navigate("/driver-app/login");
            return;
        }

        try {
            const driverObj = JSON.parse(driverInfoStr);
            setDriver(driverObj);
        } catch {
            navigate("/driver-app/login");
            return;
        }

        fetchShipments();

        // Setup Socket — emit fleet:go-online so fleet-tracking page can see driver
        const socket = io(API_BASE_URL, { transports: ["websocket", "polling"] });
        socketRef.current = socket;

        socket.on("connect", () => {
            // Read driver_id from storage (driverObj scoped inside try above)
            const dId = localStorage.getItem("driver_id") || JSON.parse(localStorage.getItem("driver_info") || "{}").driver_id;
            // Join driver room for receiving assignments
            socket.emit("join_driver", { driver_id: dId });
            // Join fleet room so the partner fleet-tracking page can see this driver
            socket.emit("join_tracking", "fleet-room");
        });

        socket.on("driver_assigned", () => {
            toast.info("A new shipment has been assigned to you.");
            fetchShipments();
        });

        return () => {
            stopLocationSharing();
            if (socketRef.current) socketRef.current.disconnect();
        };
    }, [navigate]);

    const fetchShipments = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem("driver_token");
            const res = await fetch(`${API_BASE_URL}/api/driver/shipments`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = await res.json();
            if (data.success) {
                setShipments(data.shipments || []);
            } else {
                toast.error("Failed to load shipments");
            }
        } catch (err) {
            toast.error("Network error");
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateStatus = async (shipmentId: string, newStatus: string) => {
        setActionLoading(shipmentId);
        try {
            const token = localStorage.getItem("driver_token");
            const res = await fetch(`${API_BASE_URL}/api/shipments/${shipmentId}/status`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ status: newStatus })
            });
            const data = await res.json();
            if (data.success) {
                toast.success(`Marked as ${newStatus.replace(/_/g, ' ')}`);
                fetchShipments(); // refresh local list
            } else {
                toast.error(data.message || "Failed to update");
            }
        } catch (err) {
            toast.error("Failed to update status");
        } finally {
            setActionLoading(null);
        }
    };

    const updateDriverCloudStatus = async (online: boolean, lat?: number, lng?: number) => {
        try {
            const token = localStorage.getItem("driver_token");
            const body: any = { is_online: online };
            if (lat && lng) {
                body.current_location_lat = lat;
                body.current_location_lng = lng;
            }
            await fetch(`${API_BASE_URL}/api/driver/status`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify(body)
            });
        } catch (err) {
            console.error("Failed to sync driver status to DB", err);
        }
    };

    const startLocationSharing = () => {
        if (!navigator.geolocation) {
            toast.error("Geolocation is not supported by your browser");
            return;
        }

        navigator.permissions.query({ name: 'geolocation' }).then((result) => {
            if (result.state === 'denied') {
                toast.error("Please allow location access to start tracking");
            }
        });

        setIsSharingLocation(true);
        toast.success("Location tracking started");

        const track = () => {
            navigator.geolocation.getCurrentPosition(
                (pos) => {
                    const lat = pos.coords.latitude;
                    const lng = pos.coords.longitude;

                    if (socketRef.current && driver) {
                        const dId = driver.driver_id;
                        // Existing event for shipment detail page
                        socketRef.current.emit("driver_location_update", {
                            driver_id: dId,
                            driverName: driver.name,
                            lat,
                            lng,
                            status: 'on_duty'
                        });
                        // Bug 6: fleet-room events for /fleet-tracking page
                        socketRef.current.emit("driver:go-online", {
                            driverId: dId,
                            driverName: driver.name,
                            lat, lng,
                            timestamp: Date.now()
                        });
                        socketRef.current.emit("driver:location", {
                            driverId: dId,
                            driverName: driver.name,
                            lat, lng,
                            online: true,
                            timestamp: Date.now()
                        });
                    }

                    // Sync to DB
                    updateDriverCloudStatus(true, lat, lng);
                },
                (err) => {
                    console.error("Error getting location", err);
                    if (err.code === 1) {
                        toast.error("Location permission denied. Cannot share location.");
                        stopLocationSharing();
                    }
                },
                { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
            );
        };

        track(); // Run immediately
        locationIntervalRef.current = setInterval(track, 10000); // And then every 10 seconds
    };

    const stopLocationSharing = () => {
        setIsSharingLocation(false);
        if (locationIntervalRef.current) {
            clearInterval(locationIntervalRef.current);
            locationIntervalRef.current = null;
        }

        if (socketRef.current && driver) {
            socketRef.current.emit("driver_went_offline", { driver_id: driver.driver_id });
            // Bug 6: also emit fleet-room offline event
            socketRef.current.emit("driver:went-offline", { driverId: driver.driver_id });
        }

        updateDriverCloudStatus(false);
        toast.info("Location tracking stopped");
    };

    const toggleLocation = () => {
        if (isSharingLocation) {
            stopLocationSharing();
        } else {
            startLocationSharing();
        }
    };

    const handleLogout = () => {
        stopLocationSharing();
        localStorage.removeItem("driver_token");
        localStorage.removeItem("driver_info");
        navigate("/driver-app/login");
    };

    const getStatusBadge = (status: string) => {
        const map: Record<string, { label: string; color: string }> = {
            pending_acceptance: { label: "New", color: "bg-orange-100 text-orange-800" },
            pickup_scheduled: { label: "Pickup Sched.", color: "bg-cyan-100 text-cyan-800" },
            picked_up: { label: "Picked Up", color: "bg-purple-100 text-purple-800" },
            in_transit: { label: "In Transit", color: "bg-blue-100 text-blue-800" },
            out_for_delivery: { label: "Out target", color: "bg-blue-100 text-blue-800" },
            delivered: { label: "Delivered", color: "bg-green-100 text-green-800" }
        };
        const s = map[status] || { label: status, color: "bg-gray-100 text-gray-800" };
        return <Badge className={s.color}>{s.label}</Badge>;
    };

    if (!driver) return null;

    // Bug 7: handle QR scan
    const openScanner = async () => {
        setScannerOpen(true);
        setScannedShipment(null);
        // Dynamically import html5-qrcode to avoid SSR issues
        setTimeout(async () => {
            if (!scannerContainerRef.current) return;
            try {
                // @ts-ignore -- html5-qrcode loaded dynamically
                const { Html5Qrcode } = await import('html5-qrcode');
                const html5QrCode = new Html5Qrcode("qr-reader");
                scannerRef.current = html5QrCode;
                await html5QrCode.start(
                    { facingMode: "environment" },
                    { fps: 10, qrbox: { width: 250, height: 250 } },
                    async (decodedText: string) => {
                        // Expected format: FF-AWB-{awbNumber}
                        const awbMatch = decodedText.match(/FF-AWB-(.+)/) || decodedText.match(/([A-Z0-9\-]+)$/);
                        const awb = awbMatch ? awbMatch[1] : decodedText;

                        await html5QrCode.stop();
                        scannerRef.current = null;

                        setScanLoading(true);
                        try {
                            const token = localStorage.getItem("driver_token");
                            const res = await fetch(`${API_BASE_URL}/api/driver/shipments/scan/${encodeURIComponent(awb)}`, {
                                headers: { Authorization: `Bearer ${token}` }
                            });
                            const data = await res.json();
                            if (data.success) {
                                setScannedShipment(data.shipment);
                                toast.success(`Shipment found: ${data.shipment.awb}`);
                            } else {
                                toast.error(data.message || "Shipment not found or not assigned to you");
                                setScannerOpen(false);
                            }
                        } catch (err) {
                            toast.error("Network error during scan");
                            setScannerOpen(false);
                        } finally {
                            setScanLoading(false);
                        }
                    },
                    undefined
                );
            } catch (err: any) {
                toast.error("Camera access denied. Please allow camera permission.");
                setScannerOpen(false);
            }
        }, 300);
    };

    const closeScanner = async () => {
        if (scannerRef.current) {
            try { await scannerRef.current.stop(); } catch { }
            scannerRef.current = null;
        }
        setScannerOpen(false);
        setScannedShipment(null);
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col max-w-md mx-auto relative shadow-2xl border-x">
            {/* Top Bar */}
            <div className="bg-blue-600 text-white p-4 sticky top-0 z-20 shadow-md">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="bg-white/20 p-2 rounded-full">
                            <Truck className="h-5 w-5" />
                        </div>
                        <div>
                            <h1 className="font-bold">{driver.name}</h1>
                            <p className="text-xs text-blue-100 font-mono">{driver.driver_id}</p>
                        </div>
                    </div>
                    <Button variant="ghost" size="icon" className="text-white hover:bg-white/20 hover:text-white" onClick={handleLogout}>
                        <LogOut className="h-5 w-5" />
                    </Button>
                </div>
            </div>

            {/* Location Sharing Toggle */}
            <div className={`p-4 text-white flex items-center justify-between transition-colors ${isSharingLocation ? "bg-green-500" : "bg-gray-800"
                }`}>
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <MapPin className="h-6 w-6" />
                        {isSharingLocation && (
                            <span className="absolute -top-1 -right-1 flex h-3 w-3">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-3 w-3 bg-white"></span>
                            </span>
                        )}
                    </div>
                    <div>
                        <p className="font-semibold">{isSharingLocation ? "On Duty" : "Off Duty"}</p>
                        <p className="text-xs opacity-90">
                            {isSharingLocation ? "Location is being shared live" : "Location tracking is paused"}
                        </p>
                    </div>
                </div>

                {/* Simple iOS-style toggle */}
                <button
                    onClick={toggleLocation}
                    className={`w-14 h-8 rounded-full p-1 transition-colors duration-300 focus:outline-none flex ${isSharingLocation ? 'bg-green-700 justify-end' : 'bg-gray-600 justify-start'}`}
                >
                    <div className="bg-white w-6 h-6 rounded-full shadow-md" />
                </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {/* Stats */}
                <div className="grid grid-cols-2 gap-3 mb-6">
                    <Card className="border-0 shadow-sm bg-white">
                        <CardContent className="p-4 text-center">
                            <p className="text-2xl font-bold text-blue-600">{shipments.length}</p>
                            <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Total Assigned</p>
                        </CardContent>
                    </Card>
                    <Card className="border-0 shadow-sm bg-white">
                        <CardContent className="p-4 text-center">
                            <p className="text-2xl font-bold text-orange-600">
                                {shipments.filter(s => ['pending_acceptance', 'pickup_scheduled'].includes(s.status)).length}
                            </p>
                            <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Pending Pickup</p>
                        </CardContent>
                    </Card>
                </div>

                <div className="font-bold text-gray-900 pb-2 border-b flex items-center justify-between gap-2">
                    <span className="flex items-center gap-2">
                        <Package className="h-5 w-5 text-gray-500" />
                        My Shipments
                    </span>
                    {/* Bug 7: Barcode scanner button */}
                    <Button
                        size="sm"
                        className="bg-indigo-600 hover:bg-indigo-700 text-white"
                        onClick={openScanner}
                    >
                        <QrCode className="h-4 w-4 mr-1" /> Scan Label
                    </Button>
                </div>

                {loading ? (
                    <div className="flex justify-center py-10">
                        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                    </div>
                ) : shipments.length === 0 ? (
                    <div className="text-center py-12 bg-white rounded-xl shadow-sm border border-dashed border-gray-300">
                        <Navigation className="h-10 w-10 mx-auto text-gray-300 mb-3" />
                        <p className="text-gray-500 font-medium">No active deliveries</p>
                        <p className="text-xs text-gray-400 mt-1">You will be notified when assigned.</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {shipments.map(shipment => (
                            <Card key={shipment._id} className="border-0 shadow-md bg-white overflow-hidden">
                                <div className="p-4">
                                    <div className="flex justify-between items-start mb-3">
                                        <div>
                                            <code className="text-sm font-bold tracking-tight bg-gray-100 px-2 py-0.5 rounded text-gray-800">
                                                {shipment.awb}
                                            </code>
                                        </div>
                                        {getStatusBadge(shipment.status)}
                                    </div>

                                    <div className="space-y-3 relative mb-4">
                                        <div className="absolute left-2.5 top-2.5 bottom-2.5 w-[2px] bg-gray-200" />

                                        <div className="flex items-start gap-3 relative z-10">
                                            <div className="bg-green-100 p-1.5 rounded-full mt-0.5 ring-4 ring-white">
                                                <MapPin className="h-3 w-3 text-green-600" />
                                            </div>
                                            <div>
                                                <p className="text-xs font-semibold text-gray-500 uppercase">Pickup</p>
                                                <p className="text-sm font-medium text-gray-900 leading-snug">{shipment.pickup?.name}</p>
                                                <p className="text-xs text-gray-500 truncate max-w-[200px]">{shipment.pickup?.address}, {shipment.pickup?.city}</p>
                                            </div>
                                        </div>

                                        <div className="flex items-start gap-3 relative z-10">
                                            <div className="bg-red-100 p-1.5 rounded-full mt-0.5 ring-4 ring-white">
                                                <MapPin className="h-3 w-3 text-red-600" />
                                            </div>
                                            <div>
                                                <p className="text-xs font-semibold text-gray-500 uppercase">Delivery</p>
                                                <p className="text-sm font-medium text-gray-900 leading-snug">{shipment.delivery?.name}</p>
                                                <p className="text-xs text-gray-500 truncate max-w-[200px]">{shipment.delivery?.address}, {shipment.delivery?.city}</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Action Buttons */}
                                    {['pending_acceptance', 'pickup_scheduled'].includes(shipment.status) && (
                                        <Button
                                            className="w-full bg-blue-600 hover:bg-blue-700 font-medium h-12"
                                            onClick={() => handleUpdateStatus(shipment._id, "picked_up")}
                                            disabled={actionLoading === shipment._id}
                                        >
                                            {actionLoading === shipment._id ? <Loader2 className="h-5 w-5 animate-spin" /> : "Mark as Picked Up"}
                                        </Button>
                                    )}

                                    {shipment.status === 'picked_up' && (
                                        <Button
                                            className="w-full bg-purple-600 hover:bg-purple-700 font-medium h-12"
                                            onClick={() => handleUpdateStatus(shipment._id, "in_transit")}
                                            disabled={actionLoading === shipment._id}
                                        >
                                            {actionLoading === shipment._id ? <Loader2 className="h-5 w-5 animate-spin" /> : "Start Journey (In Transit)"}
                                        </Button>
                                    )}

                                    {['in_transit', 'out_for_delivery'].includes(shipment.status) && (
                                        <Button
                                            className="w-full bg-green-600 hover:bg-green-700 font-medium h-12"
                                            onClick={() => handleUpdateStatus(shipment._id, "delivered")}
                                            disabled={actionLoading === shipment._id}
                                        >
                                            {actionLoading === shipment._id ? <Loader2 className="h-5 w-5 animate-spin" /> : "Mark as Delivered"}
                                        </Button>
                                    )}
                                </div>
                            </Card>
                        ))}
                    </div>
                )}
            </div>

            {/* Bug 7: QR Scanner Modal */}
            {scannerOpen && (
                <div className="fixed inset-0 z-50 bg-black flex flex-col">
                    <div className="flex items-center justify-between p-4 bg-gray-900">
                        <h3 className="text-white font-semibold flex items-center gap-2">
                            <QrCode className="h-5 w-5" /> Scan Shipment Label
                        </h3>
                        <button onClick={closeScanner} className="text-white">
                            <X className="h-6 w-6" />
                        </button>
                    </div>

                    {scanLoading ? (
                        <div className="flex-1 flex items-center justify-center">
                            <Loader2 className="h-10 w-10 text-white animate-spin" />
                            <p className="text-white ml-3">Verifying shipment...</p>
                        </div>
                    ) : scannedShipment ? (
                        <div className="flex-1 bg-white p-6 overflow-auto">
                            <h4 className="text-lg font-bold mb-4 flex items-center gap-2">
                                <CheckCircle className="h-5 w-5 text-green-600" />
                                Shipment Found
                            </h4>
                            <div className="bg-gray-50 rounded-xl p-4 space-y-2 mb-6">
                                <div className="flex justify-between">
                                    <span className="text-sm text-gray-500">AWB</span>
                                    <code className="font-mono font-bold">{scannedShipment.awb}</code>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-sm text-gray-500">Pickup</span>
                                    <span className="text-sm font-medium">{scannedShipment.pickup?.name}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-sm text-gray-500">Delivery</span>
                                    <span className="text-sm font-medium">{scannedShipment.delivery?.name}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-sm text-gray-500">Status</span>
                                    {getStatusBadge(scannedShipment.status)}
                                </div>
                            </div>
                            <div className="space-y-3">
                                {['pending_acceptance', 'pickup_scheduled'].includes(scannedShipment.status) && (
                                    <Button
                                        className="w-full bg-blue-600 hover:bg-blue-700 h-12"
                                        onClick={() => { handleUpdateStatus(scannedShipment._id, 'picked_up'); closeScanner(); }}
                                    >
                                        Confirm Pickup
                                    </Button>
                                )}
                                {['picked_up', 'in_transit', 'out_for_delivery'].includes(scannedShipment.status) && (
                                    <Button
                                        className="w-full bg-green-600 hover:bg-green-700 h-12"
                                        onClick={() => { handleUpdateStatus(scannedShipment._id, 'delivered'); closeScanner(); }}
                                    >
                                        <CheckCircle className="mr-2 h-5 w-5" /> Mark Delivered
                                    </Button>
                                )}
                                <Button variant="outline" className="w-full" onClick={closeScanner}>Cancel</Button>
                            </div>
                        </div>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center" ref={scannerContainerRef}>
                            <p className="text-white text-sm mb-4 opacity-70">Point camera at the QR code on the shipping label</p>
                            <div id="qr-reader" className="w-72 h-72 overflow-hidden rounded-2xl" />
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default DriverDashboard;
