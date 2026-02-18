import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { ArrowRight, Truck, MapPin, Zap } from "lucide-react";

const DelhiJaipurBanner = () => {
  return (
    <div className="container px-4 sm:px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative overflow-hidden rounded-2xl shadow-2xl"
      >
        {/* Light blue gradient background */}
        <div className="absolute inset-0 bg-gradient-to-r from-blue-50 via-blue-100/80 to-blue-200/60" />

        {/* Content + Photo layout */}
        <div className="relative flex flex-col md:flex-row items-center">
          {/* Left: Text content */}
          <div className="flex-1 px-5 py-8 sm:px-8 sm:py-10 md:px-12 md:py-14 z-10">
            <div className="max-w-xl">
              <motion.div
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3, duration: 0.6 }}
                className="flex items-center gap-2 mb-4"
              >
                <Truck className="h-7 w-7 sm:h-8 sm:w-8 text-blue-700 mb-1" />
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.35, duration: 0.6 }}
                className="flex flex-wrap items-center gap-2 mb-4"
              >
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-500 rounded-full text-white text-xs font-semibold">
                  <Zap className="h-3 w-3" />
                  Limited Time Offer
                </span>
                <span className="text-slate-500 text-xs sm:text-sm">Valid till Feb 28, 2026</span>
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.6 }}
                className="text-2xl sm:text-3xl md:text-5xl font-bold text-slate-900 mb-3 sm:mb-4"
              >
                Delhi to Jaipur Delivery
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5, duration: 0.6 }}
                className="text-slate-600 text-sm sm:text-lg md:text-xl mb-6 sm:mb-8 max-w-lg"
              >
                Fast, reliable, and affordable courier services. Ship your packages safely from Delhi to Jaipur with real-time tracking.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6, duration: 0.6 }}
                className="flex flex-col sm:flex-row gap-3 sm:gap-4"
              >
                <Button
                  size="lg"
                  className="bg-white text-slate-800 hover:bg-slate-50 font-semibold px-6 sm:px-8 gap-2 shadow-md border border-slate-200 w-full sm:w-auto"
                  asChild
                >
                  <Link to="/register">
                    Book Now
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
                <Button
                  size="lg"
                  className="bg-blue-800 text-white hover:bg-blue-900 font-semibold px-6 sm:px-8 gap-2 shadow-md w-full sm:w-auto"
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
                className="flex flex-wrap gap-4 sm:gap-6 mt-6 sm:mt-8 pt-6 sm:pt-8 border-t border-slate-200"
              >
                {[
                  { icon: Truck, label: "24hr Delivery" },
                  { icon: MapPin, label: "Live Tracking" },
                  { icon: Zap, label: "Best Rates" },
                ].map((feature, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-slate-700">
                    <feature.icon className="h-4 w-4 sm:h-5 sm:w-5" />
                    <span className="font-medium text-sm sm:text-base">{feature.label}</span>
                  </div>
                ))}
              </motion.div>
            </div>
          </div>

          {/* Right: Business photo — hidden on mobile */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4, duration: 0.7 }}
            className="hidden md:block flex-shrink-0 w-[45%] relative"
          >
            <div className="relative h-full">
              <img
                src="/banner-business.png"
                alt="FastFare Business Partners"
                className="w-full h-full object-cover object-center min-h-[400px]"
                style={{ maskImage: 'linear-gradient(to right, transparent 0%, black 15%)', WebkitMaskImage: 'linear-gradient(to right, transparent 0%, black 15%)' }}
              />
              {/* Floating logistics icons overlay */}
              <div className="absolute top-8 right-8 flex flex-col gap-4">
                <motion.div
                  animate={{ y: [0, -8, 0] }}
                  transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                  className="w-12 h-12 bg-white/80 backdrop-blur-sm rounded-xl shadow-lg flex items-center justify-center"
                >
                  <svg viewBox="0 0 24 24" className="w-6 h-6 text-blue-700" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" /></svg>
                </motion.div>
                <motion.div
                  animate={{ y: [0, -10, 0] }}
                  transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
                  className="w-12 h-12 bg-white/80 backdrop-blur-sm rounded-xl shadow-lg flex items-center justify-center"
                >
                  <svg viewBox="0 0 24 24" className="w-6 h-6 text-blue-700" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>
                </motion.div>
                <motion.div
                  animate={{ y: [0, -6, 0] }}
                  transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                  className="w-12 h-12 bg-white/80 backdrop-blur-sm rounded-xl shadow-lg flex items-center justify-center"
                >
                  <svg viewBox="0 0 24 24" className="w-6 h-6 text-blue-700" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
                </motion.div>
              </div>
            </div>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
};

export default DelhiJaipurBanner;
