import { Link } from "react-router-dom";
import logo from "@/assets/logo.png";
import { Twitter, Linkedin, Globe } from "lucide-react";

const Footer = () => {
  const footerLinks = {
    product: [
      { label: "Features", href: "/features" },
      { label: "Integrations", href: "/integrations" },
      { label: "API Reference", href: "/api-reference" },
      { label: "Changelog", href: "/changelog" },
    ],
    resources: [
      { label: "Documentation", href: "/documentation" },
      { label: "Help Center", href: "/help-center" },
      { label: "Logistics Guide", href: "/logistics-guide" },
      { label: "Community", href: "/community" },
    ],
    company: [
      { label: "About Us", href: "/about" },
      { label: "Careers", href: "/careers" },
      { label: "Press", href: "/press" },
      { label: "Contact", href: "/contact" },
    ],
    legal: [
      { label: "Privacy Policy", href: "/privacy" },
      { label: "Terms of Service", href: "/terms" },
      { label: "Cookie Policy", href: "/cookie-policy" },
    ],
  };

  return (
    <footer className="border-t border-border bg-muted/30">
      <div className="container py-12 md:py-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-6 gap-8">
          {/* Brand */}
          <div className="col-span-2">
            <Link to="/" className="flex items-center gap-2 mb-4">
              <img src={logo} alt="FastFare" className="h-8 w-auto" />
            </Link>
            <p className="text-sm text-muted-foreground mb-4 max-w-xs">
              Modern B2B logistics infrastructure for global businesses. Scale your operations with speed and precision.
            </p>
            <div className="flex items-center gap-3">
              <a
                href="#"
                className="p-2 rounded-full bg-muted hover:bg-muted/80 transition-colors"
              >
                <Twitter size={18} className="text-muted-foreground" />
              </a>
              <a
                href="#"
                className="p-2 rounded-full bg-muted hover:bg-muted/80 transition-colors"
              >
                <Linkedin size={18} className="text-muted-foreground" />
              </a>
              <a
                href="#"
                className="p-2 rounded-full bg-muted hover:bg-muted/80 transition-colors"
              >
                <Globe size={18} className="text-muted-foreground" />
              </a>
            </div>
          </div>

          {/* Links */}
          {Object.entries(footerLinks).map(([category, links]) => (
            <div key={category}>
              <h4 className="font-semibold text-sm mb-4 capitalize">{category}</h4>
              <ul className="space-y-3">
                {links.map((link) => (
                  <li key={link.label}>
                    <Link
                      to={link.href}
                      className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="border-t border-border mt-12 pt-8 flex flex-col items-center gap-4 text-center md:flex-row md:justify-between md:text-left">
          <p className="text-sm text-muted-foreground">
            © 2024 FastFare Technologies Inc. All rights reserved.
          </p>
          <div className="flex items-center gap-6">
            <Link to="/privacy" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Privacy Policy
            </Link>
            <Link to="/terms" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Terms of Service
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

