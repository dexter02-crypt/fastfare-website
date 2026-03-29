import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Rocket, Building2, Package } from "lucide-react";
import Logo from "@/components/Logo";

const BusinessStage = () => {
  const navigate = useNavigate();
  const [selectedStage, setSelectedStage] = useState<string | null>(null);

  const stages = [
    {
      id: "starting",
      title: "I'm just starting my online business",
      description: "New to e-commerce and looking to set up shipping",
      icon: Rocket,
    },
    {
      id: "established",
      title: "I already have an established online business",
      description: "Running an active business with existing order volume",
      icon: Building2,
    },
  ];

  const handleContinue = () => {
    if (selectedStage) {
      navigate("/onboarding/channels");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      {/* Header */}
      <div className="flex items-center justify-between p-4 md:p-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-2 px-4 py-2 bg-muted rounded-full text-sm font-medium">
            <Package className="h-4 w-4 text-primary" />
            SHIPPING & FULFILLMENT IN INDIA
          </div>
        </div>
        <Button variant="outline" onClick={() => navigate("/login")}>
          Logout
        </Button>
      </div>

      {/* Main Content */}
      <div className="container max-w-4xl mx-auto px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <Logo size="lg" variant="full" />
          <h1 className="text-2xl md:text-3xl font-bold mb-2">
            Let's get your shipping journey started!
          </h1>
          <p className="text-muted-foreground">Step 1 of 3</p>
          
          {/* Progress Indicator */}
          <div className="flex items-center justify-center gap-2 mt-4">
            <div className="h-1 w-16 rounded-full bg-primary" />
            <div className="h-1 w-16 rounded-full bg-muted" />
            <div className="h-1 w-16 rounded-full bg-muted" />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="space-y-6"
        >
          <div className="text-center mb-8">
            <h2 className="text-xl font-semibold mb-2">
              What best describes the current stage of your business?
            </h2>
            <p className="text-muted-foreground">
              We'll personalize your journey best suited for your needs
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            {stages.map((stage) => (
              <Card
                key={stage.id}
                className={`cursor-pointer transition-all hover:shadow-lg ${
                  selectedStage === stage.id
                    ? "ring-2 ring-primary border-primary"
                    : "hover:border-primary/50"
                }`}
                onClick={() => setSelectedStage(stage.id)}
              >
                <CardContent className="p-6 flex items-center gap-4">
                  <div className="h-16 w-16 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                    <stage.icon className="h-8 w-8 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold">{stage.title}</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      {stage.description}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="flex justify-end mt-8">
            <Button
              onClick={handleContinue}
              disabled={!selectedStage}
              className="gradient-primary px-8"
            >
              Next
            </Button>
          </div>
        </motion.div>

        {/* Footer Banner */}
        <div className="mt-12 p-4 bg-muted/50 rounded-lg flex items-center gap-3">
          <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center">
            <Package className="h-4 w-4 text-primary" />
          </div>
          <p className="text-sm text-muted-foreground">
            Deliver to 29,000+ Indian pincodes with FastFare
          </p>
        </div>
      </div>
    </div>
  );
};

export default BusinessStage;
