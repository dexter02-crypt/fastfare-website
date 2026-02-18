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

    // Build products from actual packages
    const packages = shipment.packages || [];
    const totalWeight = shipment.totalWeight || packages.reduce((s: number, p: any) => s + (p.weight * (p.quantity || 1)), 0);

    // Calculate dimensions string
    const dims = packages.length > 0
      ? `${packages[0].length || 0}x${packages[0].width || 0}x${packages[0].height || 0} cm`
      : "—";

    // Build product rows HTML
    const productRows = packages.map((pkg: any) => {
      const sku = `SKU-${(pkg._id || pkg.id || "000").toString().slice(-8).toUpperCase()}`;
      const qty = pkg.quantity || 1;
      const price = pkg.value || 0;
      return `
        <tr style="border-bottom:1px solid #000">
          <td style="padding:4px;border-right:1px solid #000;text-align:left">
            <div style="font-weight:bold">${pkg.name || "Package"}</div>
            <div style="font-size:10px;color:#666">SKU: ${sku}</div>
          </td>
          <td style="padding:4px;border-right:1px solid #000">${qty}</td>
          <td style="padding:4px;border-right:1px solid #000">₹${price}</td>
          <td style="padding:4px">₹${qty * price}</td>
        </tr>
      `;
    }).join("");

    const grandTotal = packages.reduce((s: number, p: any) => s + ((p.value || 0) * (p.quantity || 1)), 0);

    // Use JsBarcode CDN for production-grade scannable barcodes
    const labelHTML = `<!DOCTYPE html>
<html><head><title>Shipping Label - ${awbNumber}</title>
<script src="https://cdn.jsdelivr.net/npm/jsbarcode@3.11.6/dist/JsBarcode.all.min.js"><\/script>
<style>
  @media print { body { margin: 0; } @page { margin: 10mm; } }
  body { font-family: Arial, Helvetica, sans-serif; padding: 16px; color: #000; background: #fff; }
  .label { border: 3px solid #000; max-width: 760px; margin: 0 auto; }
  .section { padding: 8px; border-bottom: 2px solid #000; }
  .flex { display: flex; }
  .half { width: 50%; padding: 8px; }
  .half-left { border-right: 2px solid #000; }
  .barcode-container { text-align: center; }
  .barcode-container svg { max-width: 280px; height: auto; }
  table { width: 100%; font-size: 11px; text-align: center; border-collapse: collapse; }
  th { font-weight: bold; padding: 4px; border-bottom: 1px solid #000; }
  .footer { padding: 8px; font-size: 11px; display: flex; justify-content: space-between; align-items: flex-end; }
</style></head>
<body>
<div class="label">
  <!-- Ship To -->
  <div class="section">
    <p style="font-weight:bold;font-size:13px;margin:0 0 4px">Ship To</p>
    <div style="font-size:18px;font-weight:bold">${shipment.delivery?.name || "—"}</div>
    <div style="font-size:13px">${shipment.delivery?.address || ""}</div>
    <div style="font-size:13px">${shipment.delivery?.city || ""}, ${shipment.delivery?.state || ""}</div>
    <div style="font-size:13px;font-weight:bold;margin-top:4px">PIN: ${shipment.delivery?.pincode || "—"}</div>
    <div style="font-size:13px;margin-top:4px">Phone No.: ${shipment.delivery?.phone || "—"}</div>
  </div>

  <!-- Details & AWB Barcode -->
  <div class="flex" style="border-bottom:2px solid #000">
    <div class="half half-left" style="font-size:13px">
      <div style="display:flex;justify-content:space-between;margin-bottom:4px"><span>Dimensions:</span><span>${dims}</span></div>
      <div style="display:flex;justify-content:space-between;font-weight:bold;margin-bottom:4px"><span>Payment:</span><span>${(shipment.paymentMode || "prepaid").toUpperCase()}</span></div>
      <div style="display:flex;justify-content:space-between;margin-bottom:4px"><span>Weight:</span><span>${totalWeight} kg</span></div>
      <div style="display:flex;justify-content:space-between"><span>Service:</span><span>${serviceType}</span></div>
    </div>
    <div class="half" style="text-align:center">
      <div style="font-size:16px;font-weight:bold;margin-bottom:8px">${carrier}</div>
      <div class="barcode-container">
        <svg id="barcode-awb"></svg>
      </div>
    </div>
  </div>

  <!-- Return Address & Order Barcode -->
  <div class="flex" style="border-bottom:2px solid #000">
    <div class="half half-left" style="font-size:13px">
      <p style="font-size:11px;color:#666;margin:0 0 4px">(If undelivered, return to)</p>
      <div style="font-weight:bold;font-style:italic">${shipment.pickup?.name || "—"}</div>
      <div>${shipment.pickup?.address || ""}</div>
      <div>${shipment.pickup?.city || ""}, ${shipment.pickup?.state || ""}</div>
      <div style="font-weight:bold;margin-top:4px">${shipment.pickup?.pincode || "—"}</div>
      <div style="margin-top:4px">Phone No.: ${shipment.pickup?.phone || "—"}</div>
    </div>
    <div class="half" style="text-align:center">
      <div style="font-size:13px;margin-bottom:8px">Order #: ${orderId}</div>
      <div class="barcode-container">
        <svg id="barcode-order"></svg>
      </div>
      <div style="margin-top:8px;font-size:11px">Invoice Date: ${new Date(shipment.createdAt || Date.now()).toLocaleDateString()}</div>
    </div>
  </div>

  <!-- Product Table -->
  <div style="border-bottom:2px solid #000">
    <table>
      <thead>
        <tr>
          <th style="border-right:1px solid #000;text-align:left;width:40%">Product Name & SKU</th>
          <th style="border-right:1px solid #000">Qty</th>
          <th style="border-right:1px solid #000">Unit Price</th>
          <th>Total</th>
        </tr>
      </thead>
      <tbody>
        ${productRows}
        <tr style="font-weight:bold;background:#f5f5f5">
          <td style="padding:4px;border-right:1px solid #000;text-align:right" colspan="3">Grand Total</td>
          <td style="padding:4px">₹${grandTotal}</td>
        </tr>
      </tbody>
    </table>
  </div>

  <!-- Footer -->
  <div class="footer">
    <div style="width:75%">
      All disputes are subject to local jurisdiction only. Goods once sold will only be taken back or exchanged as per the store's exchange/return policy.
      <div style="margin-top:8px;font-weight:bold">THIS IS AN AUTO-GENERATED LABEL AND DOES NOT NEED SIGNATURE.</div>
    </div>
    <div style="text-align:right">
      <div style="font-size:10px;color:#666">Powered By:</div>
      <div style="font-weight:bold;font-size:16px;color:#011E41">FastFare</div>
    </div>
  </div>
</div>

<script>
  // Wait for JsBarcode CDN to load, then generate scannable barcodes
  function renderBarcodes() {
    if (typeof JsBarcode === 'undefined') {
      setTimeout(renderBarcodes, 100);
      return;
    }
    try {
      // AWB Barcode — CODE128, scannable with exact AWB text
      JsBarcode("#barcode-awb", "${awbNumber}", {
        format: "CODE128",
        width: 2,
        height: 50,
        displayValue: true,
        fontSize: 14,
        font: "monospace",
        textMargin: 4,
        margin: 5
      });
      // Order ID Barcode — CODE128, scannable with exact Order ID text
      JsBarcode("#barcode-order", "${orderId}", {
        format: "CODE128",
        width: 2,
        height: 50,
        displayValue: true,
        fontSize: 14,
        font: "monospace",
        textMargin: 4,
        margin: 5
      });
    } catch(e) {
      console.error("Barcode generation error:", e);
    }
    // Print after barcodes render
    setTimeout(function() { window.print(); }, 500);
  }
  // Start rendering once DOM is ready
  if (document.readyState === 'complete') {
    renderBarcodes();
  } else {
    window.onload = renderBarcodes;
  }
<\/script>
</body></html>`;

    printWindow.document.write(labelHTML);
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
