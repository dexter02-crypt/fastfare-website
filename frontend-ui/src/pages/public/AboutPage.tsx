import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Link } from "react-router-dom";
import {
  Target, Users, TrendingUp, Heart,
  MapPin, Package, Truck, CheckCircle,
  Code, Handshake, IndianRupee, Rocket,
  Calendar, Flag, Globe, Zap
} from "lucide-react";

// ─── Data ─────────────────────────────────────────────────────────────────────

const stats = [
  { icon: Calendar, value: "2025", label: "Year Founded", color: "text-blue-600" },
  { icon: Rocket, value: "2026", label: "Year of Launch", color: "text-green-600" },
  { icon: Globe, value: "Pan-India", label: "Coverage Goal", color: "text-orange-600" },
  { icon: Zap, value: "100%", label: "Built From Scratch", color: "text-purple-600" },
];

const values = [
  {
    icon: Target,
    title: "Customer First",
    description: "We build every feature by asking: does this actually solve a real problem for our users? Their frustration is our fuel.",
  },
  {
    icon: TrendingUp,
    title: "Speed & Simplicity",
    description: "Logistics is time-critical. We move fast, ship often, and cut complexity wherever we find it.",
  },
  {
    icon: Users,
    title: "Collaboration",
    description: "We work hand-in-hand with our delivery partners, carriers, and business customers. The whole system only works when everyone wins.",
  },
  {
    icon: Heart,
    title: "Integrity",
    description: "We are honest about what we can and cannot do. We are a new company and we are transparent about that — and we back it up with action every day.",
  },
];

const milestones = [
  {
    period: "2025 — Q1",
    title: "The Idea",
    description: "Identified the gap in affordable, tech-driven logistics for Indian SMEs. Started research and planning.",
  },
  {
    period: "2025 — Q2",
    title: "Started Building",
    description: "Assembled the founding team. Began full-stack development of the FastFare platform — user portal, partner dashboard, and driver app.",
  },
  {
    period: "2025 — Q3",
    title: "Core Platform Ready",
    description: "Completed shipment booking, label/barcode generation, carrier management, and billing systems. Internal testing began.",
  },
  {
    period: "2025 — Q4",
    title: "Beta & Partner Onboarding",
    description: "Onboarded first delivery partners and ran closed beta with select businesses. Refined the platform based on feedback.",
  },
  {
    period: "2026 — Q1",
    title: "Official Launch 🚀",
    description: "FastFare goes live. Open to businesses across India. Real-time driver tracking, barcode scanning, and end-to-end shipment management — all in one platform.",
  },
  {
    period: "2026 — Present",
    title: "Growing Every Day",
    description: "Expanding city coverage, adding new carrier integrations, and improving the platform daily based on user feedback. The journey has just begun.",
  },
];

const whyUs = [
  {
    icon: Code,
    title: "Modern Tech Stack",
    description: "FastFare is built with modern technology — real-time tracking with Socket.io, barcode-linked shipments, and a clean API-first architecture.",
    color: "bg-blue-500/10 text-blue-600",
  },
  {
    icon: Handshake,
    title: "Partner-First Model",
    description: "We treat delivery partners as business owners, not gig workers — transparent settlements, fair pricing, and tools that respect their time.",
    color: "bg-green-500/10 text-green-600",
  },
  {
    icon: IndianRupee,
    title: "Transparent Pricing",
    description: "No hidden fees, no confusing rate tables. What you see on the rate calculator is what you pay — always.",
    color: "bg-purple-500/10 text-purple-600",
  },
];

// ─── Component ────────────────────────────────────────────────────────────────

const AboutPage = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main>
        {/* ─── S1: Hero ──────────────────────────────────────────── */}
        <section className="py-20 bg-gradient-to-b from-primary/5 to-background">
          <div className="container">
            <div className="max-w-3xl mx-auto text-center">
              <Badge className="mb-4">About FastFare</Badge>
              <h1 className="text-4xl md:text-5xl font-bold mb-6">
                Built to make logistics smarter for Indian businesses
              </h1>
              <p className="text-xl text-muted-foreground">
                We are a young, passionate team of builders who saw how broken logistics was
                for small and medium businesses in India — and decided to fix it from the ground up.
              </p>
            </div>
          </div>
        </section>

        {/* ─── S2: Stats Bar ─────────────────────────────────────── */}
        <section className="py-12 border-y bg-muted/30">
          <div className="container">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {stats.map((stat, index) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="text-center"
                >
                  <div className={`mx-auto mb-2 w-10 h-10 rounded-full flex items-center justify-center bg-muted ${stat.color}`}>
                    <stat.icon className="h-5 w-5" />
                  </div>
                  <p className={`text-3xl font-bold ${stat.color}`}>{stat.value}</p>
                  <p className="text-muted-foreground text-sm mt-1">{stat.label}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ─── S3: Our Story ─────────────────────────────────────── */}
        <section className="py-20 container">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <Badge className="mb-4">Our Story</Badge>
              <h2 className="text-3xl font-bold mb-6">
                From an idea in 2025 to a live platform in 2026
              </h2>
              <div className="space-y-4 text-muted-foreground">
                <p>
                  FastFare was born in 2025 out of a simple frustration — managing shipments across
                  multiple carriers was unnecessarily complex, expensive, and opaque for growing Indian
                  businesses. We knew there had to be a better way.
                </p>
                <p>
                  Over the course of 2025, we designed, built, and tested an end-to-end logistics
                  platform from scratch — covering everything from shipment booking and label generation
                  to real-time driver tracking and partner management. Every line of code was written
                  with one goal: make logistics as simple as booking a cab.
                </p>
                <p>
                  In 2026, FastFare went live. We are currently onboarding our first businesses and
                  delivery partners, expanding our network city by city, and improving the platform
                  daily based on real feedback. This is just the beginning.
                </p>
              </div>
            </div>
            <div className="relative">
              <div className="aspect-square rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                <div className="grid grid-cols-2 gap-4 p-8">
                  <div className="h-24 w-24 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Package className="h-12 w-12 text-primary" />
                  </div>
                  <div className="h-24 w-24 rounded-xl bg-green-500/10 flex items-center justify-center">
                    <Truck className="h-12 w-12 text-green-500" />
                  </div>
                  <div className="h-24 w-24 rounded-xl bg-orange-500/10 flex items-center justify-center">
                    <MapPin className="h-12 w-12 text-orange-500" />
                  </div>
                  <div className="h-24 w-24 rounded-xl bg-purple-500/10 flex items-center justify-center">
                    <CheckCircle className="h-12 w-12 text-purple-500" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ─── S4: Values ────────────────────────────────────────── */}
        <section className="py-20 bg-muted/30">
          <div className="container">
            <div className="text-center mb-12">
              <Badge className="mb-4">Our Values</Badge>
              <h2 className="text-3xl font-bold">What drives us every day</h2>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {values.map((value, index) => (
                <motion.div
                  key={value.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className="h-full">
                    <CardContent className="pt-6">
                      <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                        <value.icon className="h-6 w-6 text-primary" />
                      </div>
                      <h3 className="font-semibold mb-2">{value.title}</h3>
                      <p className="text-sm text-muted-foreground">{value.description}</p>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ─── S5: Timeline ──────────────────────────────────────── */}
        <section className="py-20 container">
          <div className="text-center mb-12">
            <Badge className="mb-4">Our Journey</Badge>
            <h2 className="text-3xl font-bold">Milestones that define us</h2>
          </div>
          <div className="max-w-3xl mx-auto">
            <div className="relative">
              <div className="absolute left-1/2 -translate-x-1/2 h-full w-0.5 bg-border" />
              {milestones.map((milestone, index) => (
                <motion.div
                  key={milestone.period}
                  initial={{ opacity: 0, x: index % 2 === 0 ? -20 : 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={`relative flex items-center gap-8 mb-8 ${index % 2 === 0 ? "flex-row" : "flex-row-reverse"
                    }`}
                >
                  <div className={`flex-1 ${index % 2 === 0 ? "text-right" : "text-left"}`}>
                    <Card>
                      <CardContent className="pt-4 pb-4">
                        <p className="text-sm font-bold text-primary mb-1">{milestone.period}</p>
                        <p className="font-semibold">{milestone.title}</p>
                        <p className="text-sm text-muted-foreground">{milestone.description}</p>
                      </CardContent>
                    </Card>
                  </div>
                  <div className="relative z-10 h-4 w-4 rounded-full bg-primary flex-shrink-0" />
                  <div className="flex-1" />
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ─── S6: Team ──────────────────────────────────────────── */}
        <section className="py-20 bg-muted/30">
          <div className="container">
            <div className="text-center mb-12">
              <Badge className="mb-4">Our Team</Badge>
              <h2 className="text-3xl font-bold">The builders behind FastFare</h2>
            </div>
            <div className="max-w-xl mx-auto">
              <Card className="text-center">
                <CardContent className="pt-10 pb-10 px-8">
                  <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-5">
                    <Users className="h-7 w-7 text-primary" />
                  </div>
                  <h3 className="text-xl font-bold mb-3">A small team with a big mission</h3>
                  <p className="text-muted-foreground mb-6">
                    FastFare is built by a lean, dedicated team of engineers, designers, and logistics
                    enthusiasts based in India. We prefer to let the product speak for itself — and
                    we're always looking for passionate people to join us.
                  </p>
                  <Button asChild>
                    <Link to="/careers">View Open Roles →</Link>
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* ─── S7: Why FastFare ──────────────────────────────────── */}
        <section className="py-20 container">
          <div className="text-center mb-12">
            <Badge className="mb-4">Why Choose Us</Badge>
            <h2 className="text-3xl font-bold">Built different from day one</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {whyUs.map((item, index) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="h-full">
                  <CardContent className="pt-6">
                    <div className={`h-12 w-12 rounded-lg flex items-center justify-center mb-4 ${item.color}`}>
                      <item.icon className="h-6 w-6" />
                    </div>
                    <h3 className="font-semibold mb-2">{item.title}</h3>
                    <p className="text-sm text-muted-foreground">{item.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </section>

        {/* ─── S8: CTA ───────────────────────────────────────────── */}
        <section className="py-20 bg-primary text-primary-foreground">
          <div className="container text-center">
            <h2 className="text-3xl font-bold mb-4">Ready to simplify your shipments?</h2>
            <p className="text-primary-foreground/80 mb-8 max-w-xl mx-auto">
              Join businesses already shipping smarter with FastFare. Get started in minutes — no contracts, no setup fees.
            </p>
            <Button size="lg" variant="secondary" asChild>
              <Link to="/register">Create Free Account</Link>
            </Button>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default AboutPage;
