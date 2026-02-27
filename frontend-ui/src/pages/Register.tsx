import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { User, Truck, ArrowRight, Shield, Building2, CheckCircle } from "lucide-react";
import logo from "@/assets/logo.png";
import heroImage from "@/assets/hero-illustration.png";

const Register = () => {
  const navigate = useNavigate();

  const roleOptions = [
    {
      id: "user",
      title: "Business Customer",
      description: "Register your business to ship products with FastFare",
      icon: Building2,
      features: ["Multi-carrier shipping", "Real-time tracking", "Bulk orders"],
      gradient: "from-blue-500 to-indigo-600",
      path: "/register/user",
    },
    {
      id: "partner",
      title: "Delivery Partner",
      description: "Join our delivery network and start earning",
      icon: Truck,
      features: ["Flexible hours", "Weekly payouts", "Insurance coverage"],
      gradient: "from-green-500 to-emerald-600",
      path: "/register/partner",
    },
  ];

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Blue Gradient with Illustration */}
      <div className="hidden lg:flex lg:w-[45%] gradient-hero relative overflow-hidden flex-col">
        {/* Logo */}
        <div className="absolute top-8 left-8 z-10">
          <Link to="/" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-white/20 backdrop-blur flex items-center justify-center">
              <svg viewBox="0 0 24 24" className="w-6 h-6 text-white" fill="currentColor">
                <path d="M20 8h-3V4H3c-1.1 0-2 .9-2 2v11h2c0 1.66 1.34 3 3 3s3-1.34 3-3h6c0 1.66 1.34 3 3 3s3-1.34 3-3h2v-5l-3-4zM6 18.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm13.5-9l1.96 2.5H17V9.5h2.5zm-1.5 9c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z" />
              </svg>
            </div>
            <span className="text-xl font-semibold text-white">FastFare</span>
          </Link>
        </div>

        {/* Center Illustration */}
        <div className="flex-1 flex items-center justify-center px-8">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="relative"
          >
            <div className="rounded-2xl overflow-hidden shadow-2xl border-4 border-white/10">
              <img
                src={heroImage}
                alt="FastFare Logistics"
                className="w-full max-w-sm h-auto"
              />
            </div>
            {/* Floating Delivered badge */}
            <motion.div
              initial={{ opacity: 0, x: 20, y: 10 }}
              animate={{ opacity: 1, x: 0, y: 0 }}
              transition={{ delay: 0.6 }}
              className="absolute -bottom-3 -right-3 bg-white rounded-full px-4 py-2 shadow-lg flex items-center gap-2"
            >
              <CheckCircle className="text-success" size={18} />
              <span className="text-sm font-medium text-foreground">Delivered</span>
            </motion.div>
          </motion.div>
        </div>

        {/* Bottom Text */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="px-8 pb-10 text-white"
        >
          <h2 className="text-2xl md:text-3xl font-bold mb-3">
            Streamline your supply chain with FastFare
          </h2>
          <p className="text-white/80 text-base leading-relaxed">
            Join thousands of logistics businesses managing shipments, tracking fleets, and optimizing routes in one premium dashboard.
          </p>
        </motion.div>
      </div>

      {/* Right Side - Role Selection */}
      <div className="flex-1 flex items-center justify-center p-6 md:p-8 bg-background">
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-lg"
        >
          {/* Mobile Logo */}
          <div className="lg:hidden mb-6">
            <Link to="/">
              <img src={logo} alt="FastFare" className="h-10 w-auto" />
            </Link>
          </div>

          <h1 className="text-2xl md:text-3xl font-bold mb-2">Create an Account</h1>
          <p className="text-muted-foreground mb-8">
            Choose how you want to use FastFare
          </p>

          <div className="space-y-4">
            {roleOptions.map((role, index) => (
              <motion.div
                key={role.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * (index + 1) }}
              >
                <button
                  onClick={() => navigate(role.path)}
                  className="w-full p-6 rounded-xl border-2 border-border hover:border-primary/50 bg-card hover:bg-accent/50 transition-all duration-200 text-left group"
                >
                  <div className="flex items-start gap-4">
                    <div className={`p-3 rounded-lg bg-gradient-to-br ${role.gradient} text-white`}>
                      <role.icon className="h-6 w-6" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold">{role.title}</h3>
                        <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {role.description}
                      </p>
                      <div className="flex flex-wrap gap-2 mt-3">
                        {role.features.map((feature) => (
                          <span
                            key={feature}
                            className="text-xs px-2 py-1 rounded-full bg-muted text-muted-foreground"
                          >
                            {feature}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </button>
              </motion.div>
            ))}
          </div>




          <p className="text-center text-sm text-muted-foreground mt-8">
            Already have an account?{" "}
            <Link to="/login" className="text-primary font-medium hover:underline">
              Log in
            </Link>
          </p>

          <p className="text-center text-xs text-muted-foreground mt-4">
            By registering, you agree to our{" "}
            <a href="#" className="text-primary hover:underline">Terms of Service</a>
            {" "}and{" "}
            <a href="#" className="text-primary hover:underline">Privacy Policy</a>.
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default Register;
