import { MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";

const PromoBanner = () => {
  return (
    <div className="bg-gradient-to-r from-orange-500 to-pink-500 text-white py-2.5 px-4 w-full overflow-hidden">
      <div className="container flex flex-wrap items-center justify-center gap-2 sm:gap-4 text-sm text-center">
        <div className="flex items-center gap-1.5 shrink-0">
          <MapPin className="h-4 w-4 shrink-0" />
          <span className="font-semibold whitespace-nowrap">Delhi ↔ Jaipur</span>
        </div>
        <Badge variant="secondary" className="bg-white/20 hover:bg-white/30 text-white border-0 shrink-0">Special Rates</Badge>
        <span className="whitespace-nowrap">Starting ₹49/kg</span>
        <Link to="/shipment/new">
          <Button size="sm" variant="secondary" className="h-8 text-xs bg-white text-orange-600 hover:bg-white/90 border-0 min-h-[44px] sm:min-h-0 sm:h-7 px-4 touch-action-manipulation">
            Ship Now
          </Button>
        </Link>
      </div>
    </div>
  );
};

export default PromoBanner;
