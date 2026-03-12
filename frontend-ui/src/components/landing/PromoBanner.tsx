import { MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";

const PromoBanner = () => {
  return (
    <div className="bg-gradient-to-r from-orange-500 to-pink-500 text-white py-2 px-4">
      <div className="container flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-4 text-sm">
        <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4" /> 
            <span className="font-semibold">Delhi ↔ Jaipur</span>
        </div>
        <Badge variant="secondary" className="bg-white/20 hover:bg-white/30 text-white border-0">Special Rates</Badge>
        <span>Starting ₹49/kg</span>
        <Link to="/shipment/new">
            <Button size="sm" variant="secondary" className="h-7 text-xs bg-white text-orange-600 hover:bg-white/90 border-0">
            Ship Now
            </Button>
        </Link>
      </div>
    </div>
  );
};

export default PromoBanner;
