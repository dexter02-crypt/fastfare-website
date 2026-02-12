import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { ArrowRight, Truck, MapPin, Zap } from "lucide-react";

const DelhiJaipurBanner = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="relative overflow-hidden rounded-2xl shadow-2xl"
    >
      {/* Animated gradient background */}
      <div className="absolute inset-0 bg-gradient-to-r from-orange-500 via-pink-500 to-purple-600 animate-gradient bg-[length:200%_200%]">
        <div className="absolute inset-0 bg-black/10" />
      </div>

      {/* Floating icons */}
      <motion.div
        animate={{ y: [0, -10, 0] }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-6 left-8 text-white/20"
      >
        <Truck size={40} />
      </motion.div>
      <motion.div
        animate={{ y: [0, -15, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
        className="absolute bottom-6 right-12 text-white/20"
      >
        <MapPin size={32} />
      </motion.div>
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
        className="absolute top-1/2 right-8 -translate-y-1/2 text-white/10"
      >
        <Zap size={48} />
      </motion.div>

      {/* Content */}
      <div className="relative px-8 py-10 md:px-12 md:py-14">
        <div className="max-w-4xl">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="flex items-center gap-2 mb-4"
          >
            <span className="inline-flex items-center gap-1 px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-white text-sm font-medium">
              <Zap className="h-3 w-3" />
              Limited Time Offer
            </span>
            <span className="text-white/80 text-sm">Valid till Feb 28, 2026</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="text-3xl md:text-5xl font-bold text-white mb-4"
          >
            Delhi to Jaipur Delivery
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.6 }}
            className="text-white/90 text-lg md:text-xl mb-8 max-w-2xl"
          >
            Fast, reliable, and affordable courier services. Ship your packages safely from Delhi to Jaipur with real-time tracking.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.6 }}
            className="flex flex-wrap gap-4"
          >
            <Button
              size="lg"
              className="bg-white text-orange-600 hover:bg-white/90 font-semibold px-8 gap-2"
              asChild
            >
              <Link to="/register">
                Book Now
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="bg-transparent text-white border-white/50 hover:bg-white/10 hover:border-white font-semibold px-8 gap-2"
              asChild
            >
              <Link to="/pricing">
                View Rates
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </motion.div>

          {/* Features */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8, duration: 0.6 }}
            className="flex flex-wrap gap-6 mt-8 pt-8 border-t border-white/20"
          >
            {[
              { icon: Truck, label: "24hr Delivery" },
              { icon: MapPin, label: "Live Tracking" },
              { icon: Zap, label: "Best Rates" },
            ].map((feature, idx) => (
              <div key={idx} className="flex items-center gap-2 text-white">
                <feature.icon className="h-5 w-5" />
                <span className="font-medium">{feature.label}</span>
              </div>
            ))}
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
};

export default DelhiJaipurBanner;
