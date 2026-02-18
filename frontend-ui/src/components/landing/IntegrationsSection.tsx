import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight, ShoppingBag, Store, Code2 } from "lucide-react";

const integrations = [
  {
    name: "Shopify",
    description: "1-click install app",
    icon: ShoppingBag,
    color: "text-green-600",
  },
  {
    name: "WooCommerce",
    description: "Plugin for WordPress",
    icon: Store,
    color: "text-purple-600",
  },
  {
    name: "Magento",
    description: "Enterprise extension",
    icon: Code2,
    color: "text-orange-600",
  },
];

const codeSnippet = `const fastfare = require('fastfare-sdk');

// Initialize client
const client = new fastfare.Client({
  apiKey: 'pk_live_8302...'
});

// Create a shipment
const shipment = await client.shipments.create({
  to_address: {
    name: 'Jane Doe',
    street: '123 Market St',
    city: 'San Francisco'
  },
  parcel: {
    length: 10, width: 6, weight: 2.5
  }
});

console.log(shipment.label_url);`;

const IntegrationsSection = () => {
  return (
    <section className="py-20 md:py-28 bg-foreground text-background">
      <div className="container">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left - Text Content */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Seamless Integration
            </h2>
            <p className="text-background/70 text-lg mb-8">
              Connect your store in seconds. Whether you use Shopify, WooCommerce, Magento, or build a custom stack, FastFare Pro fits right in.
            </p>

            <div className="space-y-4">
              {integrations.map((integration, index) => (
                <motion.div
                  key={integration.name}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className="bg-background/5 border-background/10 hover:bg-background/10 transition-colors cursor-pointer">
                    <CardContent className="p-4 flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className={`h-10 w-10 rounded-lg bg-background/10 flex items-center justify-center ${integration.color}`}>
                          <integration.icon className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="font-semibold text-background">{integration.name}</p>
                          <p className="text-sm text-background/60">{integration.description}</p>
                        </div>
                      </div>
                      <ArrowRight className="h-5 w-5 text-background/40" />
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Right - Code Preview */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="relative"
          >
            <div className="rounded-xl overflow-hidden bg-[#1e1e1e] shadow-2xl">
              {/* Code Window Header */}
              <div className="flex items-center gap-2 px-4 py-3 bg-[#2d2d2d] border-b border-white/10">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-500" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500" />
                  <div className="w-3 h-3 rounded-full bg-green-500" />
                </div>
                <span className="text-xs text-white/50 ml-2">API Quick Start</span>
              </div>

              {/* Code Content */}
              <div className="p-4 overflow-x-auto max-w-[calc(100vw-4rem)]">
                <pre className="text-xs sm:text-sm text-white/90 font-mono leading-relaxed">
                  <code>{codeSnippet}</code>
                </pre>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default IntegrationsSection;
