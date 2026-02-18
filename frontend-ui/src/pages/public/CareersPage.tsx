import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Briefcase, MapPin, Clock, Heart, Zap, Users, ArrowRight } from "lucide-react";

const openPositions = [
    {
        title: "Senior Backend Engineer",
        department: "Engineering",
        location: "Delhi NCR",
        type: "Full-time",
        description: "Build scalable APIs and microservices for our logistics platform. Node.js, MongoDB, Redis experience required.",
    },
    {
        title: "Mobile Developer (Android/iOS)",
        department: "Engineering",
        location: "Delhi NCR / Remote",
        type: "Full-time",
        description: "Develop our Driver and Partner mobile apps using Kotlin and Swift. Experience with maps and real-time tracking preferred.",
    },
    {
        title: "Product Designer",
        department: "Design",
        location: "Delhi NCR",
        type: "Full-time",
        description: "Design intuitive interfaces for our web and mobile platforms. Figma expertise and logistics domain knowledge a plus.",
    },
    {
        title: "Operations Manager",
        department: "Operations",
        location: "Jaipur",
        type: "Full-time",
        description: "Oversee last-mile delivery operations in Rajasthan. Manage driver fleet, optimize routes, and ensure SLA compliance.",
    },
    {
        title: "Data Analyst",
        department: "Analytics",
        location: "Remote",
        type: "Full-time",
        description: "Analyze shipment data to optimize carrier allocation, pricing, and delivery performance. SQL, Python, and Tableau required.",
    },
    {
        title: "Customer Success Manager",
        department: "Support",
        location: "Delhi NCR",
        type: "Full-time",
        description: "Onboard enterprise clients, ensure adoption, and drive customer satisfaction. B2B SaaS experience preferred.",
    },
];

const perks = [
    { icon: Heart, title: "Health Insurance", desc: "Comprehensive medical coverage for you and your family" },
    { icon: Zap, title: "Learning Budget", desc: "₹50,000/year for courses, conferences, and certifications" },
    { icon: Clock, title: "Flexible Hours", desc: "Work when you're most productive with flexible scheduling" },
    { icon: Users, title: "Team Retreats", desc: "Quarterly offsite retreats to recharge and bond" },
];

const CareersPage = () => {
    return (
        <div className="min-h-screen bg-background">
            <Header />
            <main>
                <section className="py-20 bg-gradient-to-b from-primary/5 to-background">
                    <div className="container">
                        <div className="max-w-3xl mx-auto text-center">
                            <Badge className="mb-4">Careers</Badge>
                            <h1 className="text-4xl md:text-5xl font-bold mb-6">
                                Build the future of logistics
                            </h1>
                            <p className="text-xl text-muted-foreground">
                                Join a passionate team on a mission to simplify shipping for every business in India.
                                We're growing fast and looking for talented people.
                            </p>
                        </div>
                    </div>
                </section>

                {/* Perks */}
                <section className="py-12 border-y bg-muted/30">
                    <div className="container">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                            {perks.map((perk, i) => (
                                <motion.div key={perk.title} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} className="text-center">
                                    <perk.icon className="h-8 w-8 text-primary mx-auto mb-2" />
                                    <p className="font-semibold">{perk.title}</p>
                                    <p className="text-xs text-muted-foreground">{perk.desc}</p>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Open Positions */}
                <section className="py-16 container">
                    <h2 className="text-2xl font-bold mb-8">Open Positions</h2>
                    <div className="space-y-4">
                        {openPositions.map((job, i) => (
                            <motion.div key={job.title} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                                <Card className="hover:shadow-md transition-shadow">
                                    <CardContent className="py-5 flex flex-col md:flex-row md:items-center gap-4">
                                        <div className="flex-1">
                                            <h3 className="font-semibold text-lg">{job.title}</h3>
                                            <p className="text-sm text-muted-foreground mb-2">{job.description}</p>
                                            <div className="flex flex-wrap gap-2">
                                                <Badge variant="secondary" className="gap-1"><Briefcase className="h-3 w-3" />{job.department}</Badge>
                                                <Badge variant="secondary" className="gap-1"><MapPin className="h-3 w-3" />{job.location}</Badge>
                                                <Badge variant="secondary" className="gap-1"><Clock className="h-3 w-3" />{job.type}</Badge>
                                            </div>
                                        </div>
                                        <Button className="gap-1 self-start md:self-center" asChild>
                                            <Link to="/contact">Apply <ArrowRight className="h-4 w-4" /></Link>
                                        </Button>
                                    </CardContent>
                                </Card>
                            </motion.div>
                        ))}
                    </div>
                </section>
            </main>
            <Footer />
        </div>
    );
};

export default CareersPage;
