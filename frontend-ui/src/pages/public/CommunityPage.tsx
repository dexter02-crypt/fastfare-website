import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { Users, MessageSquare, Award, BookOpen, ExternalLink, Github } from "lucide-react";

const stats = [
    { value: "15K+", label: "Community Members" },
    { value: "5K+", label: "Forum Posts" },
    { value: "200+", label: "Contributors" },
    { value: "50+", label: "Meetups Hosted" },
];

const channels = [
    {
        icon: MessageSquare,
        title: "Discussion Forum",
        description: "Ask questions, share knowledge, and connect with other FastFare users. Get help from the community and our team.",
        action: "Join Forum",
    },
    {
        icon: Github,
        title: "Open Source",
        description: "Contribute to our open-source SDKs, plugins, and tools. Help us build better logistics infrastructure.",
        action: "View GitHub",
    },
    {
        icon: BookOpen,
        title: "Blog & Tutorials",
        description: "Learn from in-depth articles, case studies, and step-by-step tutorials written by our team and community.",
        action: "Read Blog",
    },
    {
        icon: Users,
        title: "Meetups & Events",
        description: "Join our quarterly meetups in Delhi, Mumbai, and Bangalore. Network with logistics professionals and tech enthusiasts.",
        action: "View Events",
    },
];

const CommunityPage = () => {
    return (
        <div className="min-h-screen bg-background">
            <Header />
            <main>
                <section className="py-20 bg-gradient-to-b from-primary/5 to-background">
                    <div className="container">
                        <div className="max-w-3xl mx-auto text-center">
                            <Badge className="mb-4">Community</Badge>
                            <h1 className="text-4xl md:text-5xl font-bold mb-6">
                                Join the FastFare Community
                            </h1>
                            <p className="text-xl text-muted-foreground">
                                Connect with thousands of businesses, developers, and logistics professionals
                                who are building the future of shipping in India.
                            </p>
                        </div>
                    </div>
                </section>

                <section className="py-12 border-y bg-muted/30">
                    <div className="container">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                            {stats.map((stat, i) => (
                                <motion.div key={stat.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} className="text-center">
                                    <p className="text-4xl font-bold text-primary">{stat.value}</p>
                                    <p className="text-muted-foreground">{stat.label}</p>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </section>

                <section className="py-16 container">
                    <div className="grid md:grid-cols-2 gap-6">
                        {channels.map((channel, i) => (
                            <motion.div key={channel.title} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
                                <Card className="h-full hover:shadow-lg transition-shadow">
                                    <CardContent className="pt-6 flex flex-col h-full">
                                        <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                                            <channel.icon className="h-6 w-6 text-primary" />
                                        </div>
                                        <h3 className="text-lg font-semibold mb-2">{channel.title}</h3>
                                        <p className="text-muted-foreground flex-1 mb-4">{channel.description}</p>
                                        <Button variant="outline" className="self-start gap-2">
                                            {channel.action} <ExternalLink className="h-3 w-3" />
                                        </Button>
                                    </CardContent>
                                </Card>
                            </motion.div>
                        ))}
                    </div>
                </section>

                <section className="py-16 bg-muted/30">
                    <div className="container text-center">
                        <Award className="h-12 w-12 text-primary mx-auto mb-4" />
                        <h2 className="text-2xl font-bold mb-4">FastFare Champions Program</h2>
                        <p className="text-muted-foreground max-w-2xl mx-auto mb-6">
                            Our top community contributors earn exclusive perks: early access to features,
                            priority support, invitations to annual summit, and FastFare merchandise.
                        </p>
                        <Button>Apply to Become a Champion</Button>
                    </div>
                </section>
            </main>
            <Footer />
        </div>
    );
};

export default CommunityPage;
