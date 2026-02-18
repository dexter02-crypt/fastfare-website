import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Wallet, Package, Plus, ArrowRight, Gift
} from "lucide-react";

interface ActionItem {
  id: string;
  title: string;
  description: string;
  buttonText: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  variant?: "default" | "highlight";
  badge?: string;
  completed?: boolean;
}

interface GettingStartedProps {
  showWelcomeOffer?: boolean;
  walletRecharged?: boolean;
  firstOrderPlaced?: boolean;
}

const GettingStarted = ({
  showWelcomeOffer = true,
  walletRecharged = false,
  firstOrderPlaced = false,
}: GettingStartedProps) => {
  const actions: ActionItem[] = [
    {
      id: "recharge",
      title: "100% cashback on min recharge of Rs 2000",
      description: "Kickstart Your Shipping Journey with Our Special Offers!",
      buttonText: "Recharge",
      href: "/billing",
      icon: Wallet,
      variant: "highlight",
      badge: "+4 More Offers",
      completed: walletRecharged,
    },
    {
      id: "order",
      title: "Add Your 1st Order",
      description: "Add your first order to start your shipping journey",
      buttonText: "Add Order",
      href: "/shipment/new",
      icon: Package,
      completed: firstOrderPlaced,
    },
  ];

  const activeActions = actions.filter((action) => !action.completed);

  if (activeActions.length === 0) return null;

  return (
    <div className="space-y-4">
      {/* Welcome Banner */}
      {showWelcomeOffer && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="overflow-hidden">
            <CardContent className="p-0">
              <div className="flex items-center justify-between bg-gradient-to-r from-primary/10 via-primary/5 to-background p-4 md:p-6">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-xl bg-primary flex items-center justify-center shrink-0">
                    <Gift className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg md:text-xl font-bold gradient-text">
                      Shipping Rates Only For You
                    </h3>
                    <p className="text-sm text-muted-foreground hidden md:block">
                      Exclusive rates for new businesses
                    </p>
                  </div>
                </div>
                <Link to="/rates">
                  <Button className="gradient-primary gap-2">
                    Check Now
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Getting Started Section */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Getting Started</h2>
        <div className="grid md:grid-cols-2 gap-4">
          {activeActions.map((action, index) => (
            <motion.div
              key={action.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card
                className={`h-full transition-shadow hover:shadow-md ${action.variant === "highlight"
                  ? "border-amber-200 bg-gradient-to-br from-amber-50/50 to-background"
                  : ""
                  }`}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <div
                        className={`h-12 w-12 rounded-xl flex items-center justify-center shrink-0 ${action.variant === "highlight"
                          ? "bg-amber-100"
                          : "bg-primary/10"
                          }`}
                      >
                        <action.icon
                          className={`h-6 w-6 ${action.variant === "highlight"
                            ? "text-amber-600"
                            : "text-primary"
                            }`}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        {action.badge && (
                          <Badge
                            variant="secondary"
                            className="mb-2 bg-green-100 text-green-700 hover:bg-green-100"
                          >
                            {action.badge}
                          </Badge>
                        )}
                        <h3
                          className={`font-semibold text-sm leading-tight ${action.variant === "highlight"
                            ? "text-amber-800"
                            : ""
                            }`}
                        >
                          {action.title}
                        </h3>
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                          {action.description}
                        </p>
                      </div>
                    </div>
                    <Link to={action.href} className="shrink-0">
                      <Button
                        size="sm"
                        className={
                          action.variant === "highlight"
                            ? "bg-amber-500 hover:bg-amber-600"
                            : "gradient-primary"
                        }
                      >
                        {action.buttonText}
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default GettingStarted;
