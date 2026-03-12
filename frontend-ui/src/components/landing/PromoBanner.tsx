import { useState, useEffect } from "react";
import { MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";

const ROUTES = [
  { from: "Delhi", to: "Jaipur", price: 49 },
  { from: "Mumbai", to: "Pune", price: 39 },
  { from: "Bangalore", to: "Chennai", price: 55 },
  { from: "Hyderabad", to: "Vizag", price: 45 },
];

const PromoBanner = () => {
  const [isMobile, setIsMobile] = useState(false);
  const [currentRouteIndex, setCurrentRouteIndex] = useState(0);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth <= 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Auto-cycle routes on mobile every 3 seconds
  useEffect(() => {
    if (!isMobile) return;
    const interval = setInterval(() => {
      setCurrentRouteIndex((prev) => (prev + 1) % ROUTES.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [isMobile]);

  const currentRoute = ROUTES[currentRouteIndex];

  return (
    <div
      style={{
        background: "linear-gradient(to right, #f97316, #ec4899)",
        width: "100%",
        overflow: "hidden",
        boxSizing: "border-box",
      }}
    >
      {isMobile ? (
        /* ===== MOBILE VERSION — static, one route at a time ===== */
        <div
          style={{
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "10px 16px",
            width: "100%",
            boxSizing: "border-box",
            gap: "12px",
            minHeight: "48px",
          }}
        >
          {/* Left: route info */}
          <div
            style={{
              display: "flex",
              flexDirection: "row",
              alignItems: "center",
              gap: "6px",
              flex: 1,
              minWidth: 0,
              overflow: "hidden",
            }}
          >
            <MapPin
              size={15}
              color="white"
              style={{ flexShrink: 0 }}
            />
            <span
              style={{
                color: "white",
                fontWeight: "700",
                fontSize: "14px",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {currentRoute.from} → {currentRoute.to}
            </span>
            <span
              style={{
                color: "rgba(255,255,255,0.9)",
                fontSize: "13px",
                fontWeight: "600",
                whiteSpace: "nowrap",
                flexShrink: 0,
              }}
            >
              ₹{currentRoute.price}/kg
            </span>
          </div>

          {/* Right: Ship Now button */}
          <Link
            to="/register"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: "white",
              color: "#f97316",
              fontWeight: "700",
              fontSize: "13px",
              padding: "8px 14px",
              borderRadius: "8px",
              border: "none",
              whiteSpace: "nowrap",
              flexShrink: 0,
              textDecoration: "none",
              minHeight: "36px",
              cursor: "pointer",
              WebkitTapHighlightColor: "transparent",
            }}
          >
            Ship Now
          </Link>
        </div>
      ) : (
        /* ===== DESKTOP VERSION — keep existing layout ===== */
        <div className="container flex flex-wrap items-center justify-center gap-2 sm:gap-4 text-sm text-center" style={{ padding: "10px 16px" }}>
          <div className="flex items-center gap-1.5 shrink-0">
            <MapPin className="h-4 w-4 shrink-0 text-white" />
            <span className="font-semibold whitespace-nowrap text-white">Delhi ↔ Jaipur</span>
          </div>
          <Badge variant="secondary" className="bg-white/20 hover:bg-white/30 text-white border-0 shrink-0">Special Rates</Badge>
          <span className="whitespace-nowrap text-white">Starting ₹49/kg</span>
          <Link to="/shipment/new">
            <Button size="sm" variant="secondary" className="h-8 text-xs bg-white text-orange-600 hover:bg-white/90 border-0">
              Ship Now
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
};

export default PromoBanner;
