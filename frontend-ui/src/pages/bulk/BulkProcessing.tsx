import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  Loader2,
  CheckCircle,
  Package,
  Truck,
  Clock,
} from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";

const BulkProcessing = () => {
  const navigate = useNavigate();
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState(0);
  const [processedCount, setProcessedCount] = useState(0);
  const totalOrders = 42;

  const steps = [
    { name: "Validating orders", icon: Clock },
    { name: "Generating AWB numbers", icon: Package },
    { name: "Assigning carriers", icon: Truck },
    { name: "Creating shipments", icon: CheckCircle },
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(() => {
            navigate("/bulk/success");
          }, 500);
          return 100;
        }
        return prev + 2;
      });
    }, 100);

    return () => clearInterval(interval);
  }, [navigate]);

  useEffect(() => {
    const stepInterval = Math.floor(progress / 25);
    const stepsLength = 4; // Hardcoded to avoid dependency issues
    setCurrentStep(Math.min(stepInterval, stepsLength - 1));
    setProcessedCount(Math.floor((progress / 100) * totalOrders));
  }, [progress, totalOrders]);

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto space-y-6">
          {/* Processing Animation */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-8"
          >
            <div className="relative inline-flex items-center justify-center w-24 h-24 mb-6">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                className="absolute inset-0"
              >
                <div className="w-full h-full rounded-full border-4 border-primary/20 border-t-primary" />
              </motion.div>
              <Package className="h-10 w-10 text-primary" />
            </div>
            <h1 className="text-2xl font-bold mb-2">Processing Your Orders</h1>
            <p className="text-muted-foreground">
              Please wait while we create your shipments
            </p>
          </motion.div>

          {/* Progress Card */}
          <Card className="mb-6">
            <CardContent className="pt-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">Overall Progress</span>
                  <span className="text-primary font-semibold">{progress}%</span>
                </div>
                <Progress value={progress} className="h-3" />
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <span>
                    {processedCount} of {totalOrders} orders processed
                  </span>
                  <span>
                    Est. time: {Math.max(0, Math.ceil((100 - progress) / 10))}s
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Steps */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Processing Steps</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {steps.map((step, index) => {
                  const StepIcon = step.icon;
                  const isComplete = index < currentStep;
                  const isCurrent = index === currentStep;

                  return (
                    <motion.div
                      key={step.name}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className={`flex items-center gap-4 p-3 rounded-lg transition-colors ${
                        isCurrent
                          ? "bg-primary/10"
                          : isComplete
                          ? "bg-green-50"
                          : "bg-muted/50"
                      }`}
                    >
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          isComplete
                            ? "bg-green-100 text-green-600"
                            : isCurrent
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {isComplete ? (
                          <CheckCircle className="h-5 w-5" />
                        ) : isCurrent ? (
                          <Loader2 className="h-5 w-5 animate-spin" />
                        ) : (
                          <StepIcon className="h-5 w-5" />
                        )}
                      </div>
                      <div className="flex-1">
                        <p
                          className={`font-medium ${
                            isCurrent ? "text-primary" : ""
                          }`}
                        >
                          {step.name}
                        </p>
                      </div>
                      {isComplete && (
                        <Badge
                          variant="outline"
                          className="text-green-600 border-green-200"
                        >
                          Complete
                        </Badge>
                      )}
                      {isCurrent && (
                        <Badge className="bg-primary">In Progress</Badge>
                      )}
                    </motion.div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Warning */}
          <p className="text-center text-sm text-muted-foreground mt-6">
            Please do not close this page while processing is in progress
          </p>
      </div>
    </DashboardLayout>
  );
};

export default BulkProcessing;
