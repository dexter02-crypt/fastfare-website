import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowLeft, Package, Globe, ShoppingCart, Share2 } from "lucide-react";
import Logo from "@/components/Logo";

const SellingChannels = () => {
  const navigate = useNavigate();
  const [selectedChannels, setSelectedChannels] = useState<string[]>([]);

  const channels = [
    {
      id: "website",
      title: "Website/Online Store",
      description: "Online sites hosted by Shopify, WooCommerce or any other website hosting platform",
      icon: Globe,
    },
    {
      id: "ecommerce",
      title: "E-Commerce Platforms",
      description: "Like Amazon, Flipkart, Myntra, etc.",
      icon: ShoppingCart,
    },
    {
      id: "social",
      title: "Social Media",
      description: "Like Instagram, Facebook, WhatsApp, etc.",
      icon: Share2,
    },
  ];

  const toggleChannel = (channelId: string) => {
    setSelectedChannels((prev) =>
      prev.includes(channelId)
        ? prev.filter((id) => id !== channelId)
        : [...prev, channelId]
    );
  };

  const handleContinue = () => {
    navigate("/onboarding/kyc");
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
          <p className="text-muted-foreground">Step 2 of 3</p>
          
          {/* Progress Indicator */}
          <div className="flex items-center justify-center gap-2 mt-4">
            <div className="h-1 w-16 rounded-full bg-primary" />
            <div className="h-1 w-16 rounded-full bg-primary" />
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
              Where do you sell online?
            </h2>
            <p className="text-muted-foreground">
              Tell us where you sell your products to understand your buyers better
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            {channels.map((channel) => (
              <Card
                key={channel.id}
                className={`cursor-pointer transition-all hover:shadow-lg ${
                  selectedChannels.includes(channel.id)
                    ? "ring-2 ring-primary border-primary"
                    : "hover:border-primary/50"
                }`}
                onClick={() => toggleChannel(channel.id)}
              >
                <CardContent className="p-6 text-center relative">
                  <div className="absolute top-4 left-4">
                    <Checkbox
                      checked={selectedChannels.includes(channel.id)}
                      onCheckedChange={() => toggleChannel(channel.id)}
                    />
                  </div>
                  <div className="h-16 w-16 mx-auto rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                    <channel.icon className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="font-semibold mb-2">{channel.title}</h3>
                  <p className="text-sm text-muted-foreground">
                    {channel.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="flex justify-end mt-8">
            <Button
              onClick={handleContinue}
              disabled={selectedChannels.length === 0}
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

export default SellingChannels;
