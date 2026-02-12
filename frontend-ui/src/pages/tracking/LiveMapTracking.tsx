import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  Phone,
  MessageSquare,
  MapPin,
  RefreshCw,
  Package,
  Clock,
} from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";

import { trackingApi } from "@/lib/api";

interface TrackingLocation {
  name: string;
  address: string;
  city: string;
  pincode: string;
}

interface TrackingDriver {
  name: string;
  phone: string;
  vehicle: string;
}

interface TrackingPackage {
  id: number;
  description: string;
  weight: string;
  quantity: number;
}

interface TrackingTimelineEvent {
  status: string;
  location: string;
  time: string;
  date: string;
}

interface TrackingData {
  awb: string;
  status: string;
  currentLocation: string;
  estimatedDelivery: string;
  eta: string;
  driver: TrackingDriver;
  pickup: TrackingLocation;
  delivery: TrackingLocation;
  packages: TrackingPackage[];
  timeline: TrackingTimelineEvent[];
}

const LiveMapTracking = () => {
  const { awb } = useParams();
  const navigate = useNavigate();
  const [progress, setProgress] = useState(35);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [trackingData, setTrackingData] = useState<TrackingData | null>(null);

  // Fetch tracking data
  useEffect(() => {
    const fetchTrackingData = async () => {
      try {
        setLoading(true);
        let dataFetched = false;

        if (awb) {
            try {
                const data = await trackingApi.track(awb);
                if (data.tracking) {
                    setTrackingData(data.tracking);
                    
                    // Set progress based on status
                    const statusProgressMap: Record<string, number> = {
                      pending: 0,
                      pickup_scheduled: 10,
                      picked_up: 25,
                      in_transit: 50,
                      out_for_delivery: 75,
                      delivered: 100,
                    };
                    setProgress(statusProgressMap[data.tracking.status] || 0);
                    dataFetched = true;
                }
            } catch (err) {
                console.log("API failed, falling back to mock");
            }
        }
        
        if (!dataFetched) {
            // Fallback to mock data
            const mockData = {
                awb: awb || "AWB1234567890",
                status: "in_transit",
                currentLocation: "Mumbai, Maharashtra",
                estimatedDelivery: "Tomorrow by 6 PM",
                eta: "45",
                driver: {
                  name: "Rajesh Kumar",
                  phone: "+91 98765 43210",
                  vehicle: "MH 01 AB 1234",
                },
                pickup: {
                  name: "FastFare Hub",
                  address: "Logistics Park, Andheri East",
                  city: "Mumbai",
                  pincode: "400069",
                },
                delivery: {
                  name: "Rohan Gupta",
                  address: "123 Business Street",
                  city: "Pune",
                  pincode: "411001",
                },
                packages: [
                  { id: 1, description: "Electronics", weight: "2.5 kg", quantity: 1 },
                ],
                timeline: [
                  { status: "picked_up", location: "Mumbai Hub", time: "10:30 AM", date: "Today" },
                  { status: "in_transit", location: "En route to Pune", time: "12:15 PM", date: "Today" },
                ],
            };
            setTrackingData(mockData);
            setProgress(50);
        }

      } catch (error) {
        console.error("Error fetching tracking data:", error);
        toast.error("Failed to fetch tracking data");
      } finally {
        setLoading(false);
      }
    };

    fetchTrackingData();
  }, [awb]);

  // Auto-refresh tracking
  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 95) return prev;
        return prev + 0.5;
      });
    }, 500);

    return () => clearInterval(interval);
  }, []);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    setProgress(Math.min(progress + 5, 95));
    setIsRefreshing(false);
    toast.success("Tracking data refreshed");
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      in_transit: "bg-blue-500",
      picked_up: "bg-purple-500",
      delivered: "bg-green-500",
      pending: "bg-yellow-500",
      out_for_delivery: "bg-orange-500",
      pickup_scheduled: "bg-cyan-500",
    };
    return colors[status] || "bg-gray-500";
  };

  const formatStatus = (status: string) => {
    return status.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin text-primary mx-auto mb-2" />
          <p className="text-muted-foreground">Loading tracking data...</p>
        </div>
      </div>
    );
  }

  if (!trackingData) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 gap-4">
        <p className="text-destructive font-medium">Tracking data not found</p>
        <Button onClick={() => navigate(-1)}>Go Back</Button>
      </div>
    );
  }

  // Calculate truck position on the curved path
  // Path goes from bottom-right (pickup) to top-left (dropoff)
  const getPathPosition = (t: number) => {
    const p0 = { x: 75, y: 70 };
    const p1 = { x: 60, y: 55 };
    const p2 = { x: 40, y: 45 };
    const p3 = { x: 25, y: 25 };

    const u = t / 100;
    const u2 = u * u;
    const u3 = u2 * u;
    const t1 = 1 - u;
    const t2 = t1 * t1;
    const t3 = t2 * t1;

    return {
      x: t3 * p0.x + 3 * t2 * u * p1.x + 3 * t1 * u2 * p2.x + u3 * p3.x,
      y: t3 * p0.y + 3 * t2 * u * p1.y + 3 * t1 * u2 * p2.y + u3 * p3.y,
    };
  };

  const truckPos = getPathPosition(progress);

  // Calculate rotation angle based on path direction
  const getRotation = () => {
    const nextPos = getPathPosition(Math.min(progress + 5, 100));
    const angle = Math.atan2(nextPos.y - truckPos.y, nextPos.x - truckPos.x) * (180 / Math.PI);
    return angle + 180;
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-100">
      {/* Dark Header */}
      <div className="bg-gray-900 text-white px-4 py-4 flex items-center gap-4 z-20">
        <Button
          variant="ghost"
          size="icon"
          className="text-white hover:bg-gray-800"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1 text-center">
          <h1 className="text-lg font-semibold">Shipment Tracking</h1>
          {trackingData && (
            <p className="text-xs text-gray-400 mt-1">
              AWB: {trackingData.awb}
            </p>
          )}
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="text-white hover:bg-gray-800"
          onClick={handleRefresh}
          disabled={isRefreshing}
        >
          <RefreshCw className={`h-5 w-5 ${isRefreshing ? "animate-spin" : ""}`} />
        </Button>
      </div>

      {/* Map Area */}
      <div className="flex-1 relative overflow-hidden">
        {/* Simulated Map Background */}
        <div className="absolute inset-0 bg-[#e8e4dc]">
          {/* Water feature */}
          <div className="absolute top-0 right-0 w-1/3 h-full bg-[#aad3df] opacity-60"
            style={{ clipPath: "polygon(30% 0, 100% 0, 100% 100%, 0% 100%)" }} />

          {/* Grid streets */}
          <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none">
            {/* Horizontal streets */}
            {[15, 25, 35, 45, 55, 65, 75, 85].map((y) => (
              <line key={`h-${y}`} x1="0%" y1={`${y}%`} x2="100%" y2={`${y}%`}
                stroke="#fff" strokeWidth="3" />
            ))}
            {/* Vertical streets */}
            {[15, 25, 35, 45, 55, 65, 75, 85].map((x) => (
              <line key={`v-${x}`} x1={`${x}%`} y1="0%" x2={`${x}%`} y2="100%"
                stroke="#fff" strokeWidth="3" />
            ))}

            {/* Main roads */}
            <line x1="0%" y1="50%" x2="100%" y2="50%" stroke="#fff" strokeWidth="8" />
            <line x1="50%" y1="0%" x2="50%" y2="100%" stroke="#fff" strokeWidth="8" />
          </svg>

          {/* Parks/Green areas */}
          <div className="absolute top-[15%] left-[10%] w-16 h-16 bg-[#c8e6c9] rounded-lg opacity-80" />
          <div className="absolute top-[60%] left-[25%] w-20 h-12 bg-[#c8e6c9] rounded-lg opacity-80" />

          {/* Street labels */}
          <div className="absolute top-[22%] left-[30%] text-gray-500 text-[10px] font-medium transform -rotate-45">
            Union St
          </div>
          <div className="absolute top-[40%] left-[55%] text-gray-500 text-[10px] font-medium transform -rotate-45">
            Broadway
          </div>
          <div className="absolute top-[55%] left-[35%] text-gray-500 text-[10px] font-medium transform rotate-90">
            Montgomery St
          </div>
        </div>

        {/* Route Line */}
        <svg className="absolute inset-0 w-full h-full" style={{ pointerEvents: "none" }}>
          {/* Shadow line */}
          <path
            d="M 75% 70% Q 60% 55%, 40% 45% T 25% 25%"
            fill="none"
            stroke="rgba(0,0,0,0.1)"
            strokeWidth="8"
            strokeLinecap="round"
          />
          {/* Main route line */}
          <path
            d="M 75% 70% Q 60% 55%, 40% 45% T 25% 25%"
            fill="none"
            stroke="#1a1a1a"
            strokeWidth="5"
            strokeLinecap="round"
          />
        </svg>

        {/* Dropoff Marker */}
        <div className="absolute" style={{ left: "25%", top: "25%", transform: "translate(-50%, -100%)" }}>
          <div className="flex flex-col items-center">
            <div className="bg-white px-3 py-1.5 rounded-lg shadow-lg border border-gray-200 mb-1">
              <p className="text-sm font-semibold">Dropoff</p>
              <p className="text-lg font-bold">{trackingData.eta} min</p>
            </div>
            <div className="w-6 h-6 bg-black rounded flex items-center justify-center shadow-lg">
              <div className="w-2 h-2 bg-white rounded-sm" />
            </div>
            <div className="w-0.5 h-3 bg-black" />
          </div>
        </div>

        {/* Pickup Marker */}
        <div className="absolute" style={{ left: "75%", top: "70%", transform: "translate(-50%, -100%)" }}>
          <div className="flex flex-col items-center">
            <div className="bg-white px-3 py-1.5 rounded-lg shadow-lg border border-gray-200 mb-1">
              <p className="text-sm font-medium text-gray-600">Pickup</p>
            </div>
            <div className="w-6 h-6 bg-white rounded-full border-2 border-black flex items-center justify-center shadow-lg">
              <div className="w-2 h-2 bg-black rounded-full" />
            </div>
          </div>
        </div>

        {/* Animated Truck */}
        <motion.div
          className="absolute z-10"
          style={{
            left: `${truckPos.x}%`,
            top: `${truckPos.y}%`,
            transform: "translate(-50%, -50%)"
          }}
          animate={{
            left: `${truckPos.x}%`,
            top: `${truckPos.y}%`,
          }}
          transition={{ duration: 0.1, ease: "linear" }}
        >
          <div
            className="relative"
            style={{ transform: `rotate(${getRotation()}deg)` }}
          >
            {/* Truck SVG */}
            <svg width="48" height="48" viewBox="0 0 48 48" className="drop-shadow-lg">
              {/* Truck body */}
              <rect x="8" y="16" width="24" height="16" rx="2" fill="#1a1a1a" />
              {/* Truck cabin */}
              <path d="M32 20 L40 24 L40 32 L32 32 Z" fill="#1a1a1a" />
              {/* Windows */}
              <rect x="34" y="22" width="4" height="6" rx="1" fill="#87CEEB" />
              {/* Wheels */}
              <circle cx="16" cy="32" r="4" fill="#333" stroke="#666" strokeWidth="1" />
              <circle cx="36" cy="32" r="4" fill="#333" stroke="#666" strokeWidth="1" />
              {/* Wheel centers */}
              <circle cx="16" cy="32" r="1.5" fill="#888" />
              <circle cx="36" cy="32" r="1.5" fill="#888" />
            </svg>
          </div>
        </motion.div>
      </div>

      {/* Bottom Panel */}
      <div className="bg-white border-t border-gray-200 z-20">
        {/* Status Bar */}
        <div className="bg-gradient-to-r from-blue-500 to-purple-500 px-4 py-2 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${getStatusColor(trackingData.status)} animate-pulse`} />
              <span className="text-sm font-medium">{formatStatus(trackingData.status)}</span>
            </div>
            <div className="flex items-center gap-1 text-sm">
              <Clock className="h-4 w-4" />
              <span>ETA: {trackingData.eta} min</span>
            </div>
          </div>
        </div>

        {/* Driver info */}
        <div className="p-4 flex items-center justify-between border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center text-xl font-bold text-gray-600">
              {trackingData.driver.name.charAt(0)}
            </div>
            <div>
              <h3 className="font-semibold text-lg">{trackingData.driver.name} is on the way</h3>
              {trackingData.driver.vehicle && (
                <p className="text-xs text-muted-foreground">{trackingData.driver.vehicle}</p>
              )}
            </div>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" size="icon" className="rounded-full h-11 w-11">
              <Phone className="h-5 w-5" />
            </Button>
            <Button variant="outline" size="icon" className="rounded-full h-11 w-11">
              <MessageSquare className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Package Info & Current location */}
        <div className="p-4 flex items-center gap-3 border-b border-gray-100">
          <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
            <Package className="h-5 w-5 text-blue-600" />
          </div>
          <div className="flex-1">
            <p className="font-medium text-sm">
              {trackingData.packages?.[0]?.description || "Package"} ({trackingData.packages?.[0]?.weight || "N/A"})
            </p>
            <p className="text-xs text-muted-foreground">Delivery: {trackingData.delivery?.city || "N/A"} - {trackingData.delivery?.pincode || "N/A"}</p>
          </div>
        </div>

        {/* Current location */}
        <div className="p-4 flex items-center gap-3">
          <div className="w-3 h-3 bg-black rounded-full" />
          <div className="flex-1">
            <p className="font-medium">{trackingData.currentLocation || "In transit"}</p>
            <p className="text-xs text-muted-foreground">Estimated delivery: {trackingData.estimatedDelivery || "N/A"}</p>
          </div>
          <Button variant="default" className="bg-black text-white hover:bg-gray-800">
            Navigate
          </Button>
        </div>
      </div>
    </div>
  );
};

export default LiveMapTracking;
