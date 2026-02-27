import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle2,
  Package,
  MapPin,
  Truck,
  Copy,
  Download,
  Share2,
  Home,
  Plus,
  Loader2,
} from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { toast } from "@/hooks/use-toast";
import SchedulePickupModal from "@/components/shipment/SchedulePickupModal";
import { API_BASE_URL } from "@/config";
import { generateShippingLabelHTML } from "@/utils/documentGenerators";

const ShipmentSuccess = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [shipment, setShipment] = useState<any>(null);

  // Load shipment data from router state or fetch from API
  useEffect(() => {
    const stateShipment = location.state?.shipment;
    if (stateShipment) {
      setShipment(stateShipment);
      setLoading(false);
      // Auto-show schedule modal after a short delay
      const timer = setTimeout(() => setShowScheduleModal(true), 1200);
      return () => clearTimeout(timer);
    } else {
      // No state — redirect to dashboard
      navigate("/dashboard");
    }
  }, [location.state, navigate]);

  if (loading || !shipment) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </main>
        <Footer />
      </div>
    );
  }

  // Derive display values from real shipment data
  const orderId = shipment.awb || shipment._id || "";
  const awbNumber = shipment.awb || "";
  const pickupName = shipment.pickup?.name || "—";
  const pickupAddress = [
    shipment.pickup?.address,
    shipment.pickup?.city,
    shipment.pickup?.state,
    shipment.pickup?.pincode ? `- ${shipment.pickup.pincode}` : ""
  ].filter(Boolean).join(", ");
  const deliveryName = shipment.delivery?.name || "—";
  const deliveryAddress = [
    shipment.delivery?.address,
    shipment.delivery?.city,
    shipment.delivery?.state,
    shipment.delivery?.pincode ? `- ${shipment.delivery.pincode}` : ""
  ].filter(Boolean).join(", ");
  const carrier = shipment.carrier || "FastFare";
  const serviceType = shipment.serviceType === "express" ? "Express Delivery"
    : shipment.serviceType === "overnight" ? "Overnight"
      : shipment.serviceType === "economy" ? "Economy"
        : "Standard";
  const estimatedDelivery = shipment.estimatedDelivery
    ? new Date(shipment.estimatedDelivery).toLocaleDateString()
    : "—";
  const totalAmount = shipment.shippingCost || 0;

  const handleCopyAwb = () => {
    navigator.clipboard.writeText(awbNumber);
    toast({
      title: "Copied!",
      description: "AWB number copied to clipboard",
    });
  };

  const handleShareTracking = () => {
    const trackingUrl = `${window.location.origin}/track/${awbNumber}`;
    if (navigator.share) {
      navigator.share({
        title: `Track shipment ${awbNumber}`,
        text: `Track your FastFare shipment: ${awbNumber}`,
        url: trackingUrl,
      }).catch(() => { });
    } else {
      navigator.clipboard.writeText(trackingUrl);
      toast({
        title: "Link Copied!",
        description: "Tracking link copied to clipboard",
      });
    }
  };

  const handleDownloadLabel = () => {
    const printWindow = window.open("", "", "width=850,height=700");
    if (!printWindow) return;
    printWindow.document.write(generateShippingLabelHTML(shipment, true));
    printWindow.document.close();
  };


  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      <main className="flex-1 py-8">
        <div className="container max-w-2xl mx-auto px-4">
          {/* Success Animation */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 15 }}
            className="text-center mb-8"
          >
            <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-green-100 mb-4">
              <CheckCircle2 className="h-12 w-12 text-green-600" />
            </div>
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-3xl font-bold text-foreground mb-2"
            >
              Shipment Booked Successfully!
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-muted-foreground"
            >
              Your shipment has been confirmed and is ready for pickup.
            </motion.p>
          </motion.div>

          {/* Order Details Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card className="mb-6">
              <CardContent className="pt-6">
                {/* Order ID and AWB */}
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-6 border-b">
                  <div>
                    <p className="text-sm text-muted-foreground">Order ID</p>
                    <p className="text-lg font-semibold">{orderId}</p>
                  </div>
                  <div className="text-left md:text-right">
                    <p className="text-sm text-muted-foreground">AWB Number</p>
                    <div className="flex items-center gap-2">
                      <p className="text-lg font-semibold font-mono">
                        {awbNumber}
                      </p>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={handleCopyAwb}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Addresses */}
                <div className="grid md:grid-cols-2 gap-6 py-6 border-b">
                  <div className="flex gap-3">
                    <div className="p-2 bg-green-100 rounded-lg h-fit">
                      <MapPin className="h-4 w-4 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Pickup From</p>
                      <p className="font-medium">{pickupName}</p>
                      <p className="text-sm text-muted-foreground">
                        {pickupAddress}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <div className="p-2 bg-red-100 rounded-lg h-fit">
                      <MapPin className="h-4 w-4 text-red-600" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Deliver To</p>
                      <p className="font-medium">{deliveryName}</p>
                      <p className="text-sm text-muted-foreground">
                        {deliveryAddress}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Shipping Details */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 py-6">
                  <div>
                    <p className="text-sm text-muted-foreground">Carrier</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Truck className="h-4 w-4 text-primary" />
                      <span className="font-medium">{carrier}</span>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Service</p>
                    <Badge variant="secondary" className="mt-1">
                      {serviceType}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Est. Delivery</p>
                    <p className="font-medium mt-1">
                      {estimatedDelivery}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Amount Paid</p>
                    <p className="font-semibold text-primary mt-1">
                      ₹{totalAmount}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Action Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8"
          >
            <Button
              variant="outline"
              className="flex-col h-auto py-4 gap-2"
              onClick={handleDownloadLabel}
            >
              <Download className="h-5 w-5" />
              <span className="text-xs">Download Label</span>
            </Button>
            <Button
              variant="outline"
              className="flex-col h-auto py-4 gap-2"
              onClick={() => navigate(`/shipment/${shipment._id}`)}
            >
              <Package className="h-5 w-5" />
              <span className="text-xs">View Details</span>
            </Button>
            <Button
              variant="outline"
              className="flex-col h-auto py-4 gap-2"
              onClick={handleShareTracking}
            >
              <Share2 className="h-5 w-5" />
              <span className="text-xs">Share Tracking</span>
            </Button>
            <Button
              variant="outline"
              className="flex-col h-auto py-4 gap-2"
              onClick={() => navigate(`/track/${awbNumber}`)}
            >
              <MapPin className="h-5 w-5" />
              <span className="text-xs">Track Shipment</span>
            </Button>
          </motion.div>

          {/* Navigation Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="flex flex-col sm:flex-row gap-3"
          >
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => navigate("/dashboard")}
            >
              <Home className="h-4 w-4 mr-2" /> Go to Dashboard
            </Button>
            <Button
              className="flex-1 gradient-primary"
              onClick={() => navigate("/shipment/new")}
            >
              <Plus className="h-4 w-4 mr-2" /> Create Another Shipment
            </Button>
          </motion.div>
        </div>
      </main>

      <Footer />

      <SchedulePickupModal
        open={showScheduleModal}
        onOpenChange={setShowScheduleModal}
        awb={awbNumber}
      />
    </div>
  );
};

export default ShipmentSuccess;
