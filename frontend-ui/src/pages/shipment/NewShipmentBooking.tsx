import { API_BASE_URL } from "@/config";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, ArrowRight, Package } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ShipmentStepper from "@/components/shipment/ShipmentStepper";
import AddressForm from "@/components/shipment/AddressForm";
import PackageForm from "@/components/shipment/PackageForm";
import ServiceSelection from "@/components/shipment/ServiceSelection";
import ReviewConfirm from "@/components/shipment/ReviewConfirm";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { paymentApi } from "@/lib/api";

declare global {
  interface Window {
    Razorpay: any;
  }
}

const steps = [
  { id: 1, name: "Pickup Details", description: "Enter pickup address" },
  { id: 2, name: "Delivery Details", description: "Enter delivery address" },
  { id: 3, name: "Package Info", description: "Add package details" },
  { id: 4, name: "Review & Confirm", description: "Confirm your booking" },
];

const initialAddressData = {
  name: "",
  phone: "",
  email: "",
  address: "",
  pincode: "",
  city: "",
  state: "",
  landmark: "",
  addressType: "office",
  saveAddress: false,
};

const initialPackageData = {
  packages: [
    {
      id: "1",
      name: "",
      quantity: 1,
      weight: 0.5,
      length: 50,
      width: 50,
      height: 50,
      value: 0,
    },
  ],
  contentType: "",
  description: "",
  paymentMode: "cod",
  codAmount: 0,
  insurance: false,
};

const initialServiceData = {
  serviceType: "express",
  carrier: "",
  carrierId: "",
  insurance: false,
  fragileHandling: false,
  signatureRequired: false,
  scheduledPickup: false,
  pickupDate: "",
  pickupSlot: "",
};

const NewShipmentBooking = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [termsAccepted, setTermsAccepted] = useState(false);

  const [pickupData, setPickupData] = useState(initialAddressData);
  const [deliveryData, setDeliveryData] = useState(initialAddressData);
  const [packageData, setPackageData] = useState(initialPackageData);
  const [serviceData, setServiceData] = useState(initialServiceData);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleNext = async () => {
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1);
    } else {
      // Submit booking
      setIsSubmitting(true);
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          navigate("/login");
          return;
        }

        const submitBooking = async () => {
          const bookingPayload = {
            pickup: pickupData,
            delivery: deliveryData,
            packages: packageData.packages,

            // Package Details (Flattened)
            contentType: packageData.contentType,
            description: packageData.description,
            paymentMode: packageData.paymentMode,
            codAmount: packageData.codAmount,

            // Service Details (Flattened)
            serviceType: serviceData.serviceType,
            carrier: serviceData.carrier,
            carrierId: serviceData.carrierId || undefined,
            insurance: serviceData.insurance,
            fragileHandling: serviceData.fragileHandling,
            signatureRequired: serviceData.signatureRequired,
            scheduledPickup: serviceData.scheduledPickup,
            pickupDate: serviceData.pickupDate,
            pickupSlot: serviceData.pickupSlot,
          };

          const response = await fetch(`${API_BASE_URL}/api/shipments/create`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(bookingPayload),
          });

          const data = await response.json();

          if (!response.ok) {
            throw new Error(data.error || "Failed to create shipment");
          }

          // Save addresses if user checked "Save this address"
          const addressHeaders = {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          };

          if (pickupData.saveAddress) {
            const { saveAddress, ...addrToSave } = pickupData;
            fetch(`${API_BASE_URL}/api/users/addresses`, {
              method: "POST",
              headers: addressHeaders,
              body: JSON.stringify(addrToSave),
            }).catch(() => { }); // Fire-and-forget
          }

          if (deliveryData.saveAddress) {
            const { saveAddress, ...addrToSave } = deliveryData;
            fetch(`${API_BASE_URL}/api/users/addresses`, {
              method: "POST",
              headers: addressHeaders,
              body: JSON.stringify(addrToSave),
            }).catch(() => { }); // Fire-and-forget
          }

          toast({
            title: "Shipment Created Successfully",
            description: `AWB: ${data.shipment?.awb || data.shipment?._id}`,
          });

          navigate("/shipment/success", { state: { shipment: data.shipment } });
        }; // end of submitBooking

        // Payment Processing Logic
        if (packageData.paymentMode === 'razorpay') {
          // Calculate total cost (same calculation as ReviewConfirm)
          const getCarrierPrice = (carrier: string) => {
            const prices: Record<string, number> = { bluedart: 149, delhivery: 129, fedex: 199, dtdc: 99 };
            return prices[carrier] || 99;
          };
          const getServiceMultiplier = (type: string) => {
            const multipliers: Record<string, number> = { standard: 1, express: 1.5, "same-day": 2.5 };
            return multipliers[type] || 1;
          };

          const basePrice = getCarrierPrice(serviceData.carrier);
          const serviceMultiplier = getServiceMultiplier(serviceData.serviceType);
          const shippingCost = Math.round(basePrice * serviceMultiplier);
          const insuranceCost = serviceData.insurance ? 29 : 0;
          const fragileCost = serviceData.fragileHandling ? 49 : 0;
          const signatureCost = serviceData.signatureRequired ? 19 : 0;
          const totalCost = Math.round((shippingCost + insuranceCost + fragileCost + signatureCost) * 1.18);

          // Get Razorpay Order
          const orderData = await paymentApi.createOrder(totalCost);

          const options = {
            key: orderData.keyId,
            amount: orderData.amount,
            currency: orderData.currency,
            name: "FastFare Logistics",
            description: `Shipment Booking`,
            order_id: orderData.orderId,
            handler: async function (response: any) {
              // If Razorpay succeeds, create the shipment
              await submitBooking();
              setIsSubmitting(false);
            },
            prefill: {
              name: localStorage.getItem("userName") || "",
              email: localStorage.getItem("userEmail") || "",
            },
            theme: { color: "#6366f1" },
            modal: {
              ondismiss: function () {
                setIsSubmitting(false);
                toast({ title: "Payment Cancelled", variant: "destructive" });
              }
            }
          };

          const razorpay = new window.Razorpay(options);
          razorpay.open();
        } else {
          // For COD and Wallet, submit directly
          await submitBooking();
        }

      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Could not book shipment. Please try again.';
        toast({
          title: "Booking Failed",
          description: errorMessage,
          variant: "destructive",
        });
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleEditStep = (step: number) => {
    setCurrentStep(step);
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return pickupData.name && pickupData.phone && pickupData.address && pickupData.pincode;
      case 2:
        return deliveryData.name && deliveryData.phone && deliveryData.address && deliveryData.pincode;
      case 3:
        return packageData.contentType && packageData.packages.length > 0;
      case 4:
        return termsAccepted && serviceData.carrier;
      default:
        return false;
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <AddressForm
            type="pickup"
            data={pickupData}
            onChange={setPickupData}
          />
        );
      case 2:
        return (
          <AddressForm
            type="delivery"
            data={deliveryData}
            onChange={setDeliveryData}
          />
        );
      case 3:
        return <PackageForm data={packageData} onChange={setPackageData} />;
      case 4:
        return (
          <>
            <ServiceSelection
              data={serviceData}
              onChange={setServiceData}
              pickupPincode={pickupData.pincode}
              deliveryPincode={deliveryData.pincode}
            />
            <div className="mt-8">
              <ReviewConfirm
                bookingData={{
                  pickup: pickupData,
                  delivery: deliveryData,
                  packages: packageData,
                  service: serviceData,
                }}
                termsAccepted={termsAccepted}
                onTermsChange={setTermsAccepted}
                onEditStep={handleEditStep}
              />
            </div>
          </>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      <main className="flex-1 py-8">
        <div className="container max-w-4xl mx-auto px-4">
          {/* Page Header */}
          <div className="flex items-center gap-4 mb-8">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/dashboard")}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold">New Shipment</h1>
              <p className="text-muted-foreground">
                Create a new shipment booking
              </p>
            </div>
          </div>

          {/* Stepper */}
          <ShipmentStepper steps={steps} currentStep={currentStep} />

          {/* Step Content */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5 text-primary" />
                {steps[currentStep - 1].name}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentStep}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                >
                  {renderStepContent()}
                </motion.div>
              </AnimatePresence>
            </CardContent>
          </Card>

          {/* Navigation Buttons */}
          <div className="flex justify-between mt-6">
            <Button
              variant="outline"
              onClick={() => {
                if (currentStep > 1) {
                  handleBack();
                } else {
                  navigate("/dashboard");
                }
              }}
            >
              <ArrowLeft className="h-4 w-4 mr-2" /> Back
            </Button>
            <Button
              onClick={handleNext}
              disabled={!canProceed() || isSubmitting}
              className="gradient-primary"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Booking...
                </>
              ) : (
                <>
                  {currentStep === 4 ? "Confirm Booking" : "Continue"}
                  <ArrowRight className="h-4 w-4 ml-2" />
                </>
              )}
            </Button>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default NewShipmentBooking;
