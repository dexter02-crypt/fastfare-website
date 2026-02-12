import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import {
  HelpCircle, MessageSquare, Phone, Mail, Search, Plus,
  Clock, CheckCircle, AlertCircle, FileText, Video, BookOpen,
  Send, X, Headphones
} from "lucide-react";
import { toast } from "sonner";

const tickets = [
  { id: "TKT-001", subject: "Shipment delayed for 3 days", status: "Open", priority: "High", created: "2 hours ago" },
  { id: "TKT-002", subject: "Invoice discrepancy", status: "In Progress", priority: "Medium", created: "1 day ago" },
  { id: "TKT-003", subject: "API integration help needed", status: "Resolved", priority: "Low", created: "3 days ago" },
];

const faqs = [
  { question: "How do I track my shipment?", category: "Tracking" },
  { question: "What are the shipping rates?", category: "Pricing" },
  { question: "How to schedule a pickup?", category: "Shipping" },
  { question: "How do I add funds to my wallet?", category: "Billing" },
  { question: "Can I change the delivery address?", category: "Shipping" },
];

// Mock chat messages
const initialMessages = [
  { id: 1, sender: "bot", text: "Hello! Welcome to FastFare Support. How can I help you today?", time: "Just now" }
];

// Documentation articles
const documentationItems = [
  { title: "Getting Started Guide", description: "Learn the basics of FastFare platform", url: "#", category: "Basics" },
  { title: "API Reference", description: "Complete API documentation for developers", url: "#", category: "API" },
  { title: "Integration Guide", description: "Setup webhooks and integrations", url: "#", category: "API" },
  { title: "Shipment Management", description: "Creating and managing shipments", url: "#", category: "Shipping" },
  { title: "Rate Calculator Usage", description: "Understanding shipping rates", url: "#", category: "Pricing" },
  { title: "Bulk Upload Documentation", description: "Processing bulk shipments", url: "#", category: "Shipping" },
];

// Video tutorials
const videoTutorials = [
  { title: "FastFare Platform Overview", duration: "5:30", thumbnail: "📹", views: "1.2K" },
  { title: "Creating Your First Shipment", duration: "8:45", thumbnail: "📦", views: "890" },
  { title: "Tracking Shipments in Real-Time", duration: "6:15", thumbnail: "🗺️", views: "756" },
  { title: "Managing Fleet & Drivers", duration: "12:00", thumbnail: "🚚", views: "543" },
  { title: "Wallet Recharge & Billing", duration: "4:20", thumbnail: "💳", views: "432" },
  { title: "Generating Reports & Analytics", duration: "7:30", thumbnail: "📊", views: "321" },
];

// Knowledge base articles
const knowledgeBaseArticles = [
  { title: "Why is my shipment delayed?", category: "Troubleshooting", helpful: 145 },
  { title: "How to change delivery address", category: "Shipping", helpful: 98 },
  { title: "Understanding shipping charges", category: "Billing", helpful: 87 },
  { title: "How to cancel a shipment", category: "Shipping", helpful: 76 },
  { title: "Wallet recharge not reflecting", category: "Troubleshooting", helpful: 65 },
  { title: "Setting up 2FA authentication", category: "Security", helpful: 54 },
  { title: "Download shipping labels", category: "Shipping", helpful: 43 },
  { title: "Invoice and GST queries", category: "Billing", helpful: 32 },
];

const SupportCenter = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [chatOpen, setChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState(initialMessages);
  const [newMessage, setNewMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [docsDialog, setDocsDialog] = useState(false);
  const [videosDialog, setVideosDialog] = useState(false);
  const [kbDialog, setKbDialog] = useState(false);

  const phoneNumber = "+91 1800-123-4567";
  const emailAddress = "support@fastfare.in";

  const handleStartChat = () => {
    setChatOpen(true);
  };

  const handleCallNow = () => {
    // Format phone number for tel: link (remove spaces and special chars)
    const formattedPhone = phoneNumber.replace(/\s+/g, '').replace(/-/g, '');
    window.location.href = `tel:${formattedPhone}`;
    toast.info("Opening phone dialer...");
  };

  const handleSendEmail = () => {
    const subject = encodeURIComponent("Support Request - FastFare");
    const body = encodeURIComponent("Hello FastFare Support,\n\nI need help with:\n\n[Please describe your issue here]\n\nOrder/AWB ID (if applicable):\n\nThank you!");
    window.location.href = `mailto:${emailAddress}?subject=${subject}&body=${body}`;
    toast.info("Opening email client...");
  };

  const handleSendMessage = () => {
    if (!newMessage.trim()) return;

    // Add user message
    const userMessage = {
      id: chatMessages.length + 1,
      sender: "user",
      text: newMessage,
      time: "Just now"
    };
    setChatMessages(prev => [...prev, userMessage]);
    setNewMessage("");
    setIsTyping(true);

    // Simulate bot response after delay
    setTimeout(() => {
      setIsTyping(false);
      const botResponses = [
        "Thank you for reaching out! Let me look into that for you.",
        "I understand your concern. Our team will assist you shortly.",
        "I've noted your query. Could you please share your Order ID or AWB number?",
        "Thank you for your patience. A support agent will join this chat soon.",
        "I can help you with that! Let me check our records."
      ];
      const randomResponse = botResponses[Math.floor(Math.random() * botResponses.length)];
      
      const botMessage = {
        id: chatMessages.length + 2,
        sender: "bot",
        text: randomResponse,
        time: "Just now"
      };
      setChatMessages(prev => [...prev, botMessage]);
    }, 1500);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const contactOptions = [
    { 
      icon: MessageSquare, 
      title: "Live Chat", 
      description: "Chat with our support team", 
      action: "Start Chat", 
      color: "bg-blue-500",
      onClick: handleStartChat
    },
    { 
      icon: Phone, 
      title: "Call Us", 
      description: phoneNumber, 
      action: "Call Now", 
      color: "bg-green-500",
      onClick: handleCallNow
    },
    { 
      icon: Mail, 
      title: "Email Support", 
      description: emailAddress, 
      action: "Send Email", 
      color: "bg-purple-500",
      onClick: handleSendEmail
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container py-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold">Help & Support</h1>
            <p className="text-muted-foreground">Get help with your shipments and account</p>
          </div>
        </div>

        {/* Search */}
        <Card className="mb-8">
          <CardContent className="pt-6">
            <div className="max-w-2xl mx-auto text-center">
              <h2 className="text-xl font-semibold mb-4">How can we help you?</h2>
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  placeholder="Search for help articles, FAQs..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-12 h-12 text-lg"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Contact Options */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {contactOptions.map((option) => (
            <Card key={option.title} className="hover:border-primary transition-colors">
              <CardContent className="pt-6">
                <div className={`h-12 w-12 rounded-lg ${option.color} flex items-center justify-center mb-4`}>
                  <option.icon className="h-6 w-6 text-white" />
                </div>
                <h3 className="font-semibold mb-1">{option.title}</h3>
                <p className="text-sm text-muted-foreground mb-4">{option.description}</p>
                <Button variant="outline" className="w-full" onClick={option.onClick}>
                  {option.action}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        <Tabs defaultValue="tickets" className="space-y-6">
          <TabsList>
            <TabsTrigger value="tickets">My Tickets</TabsTrigger>
            <TabsTrigger value="new">New Ticket</TabsTrigger>
            <TabsTrigger value="faq">FAQ</TabsTrigger>
            <TabsTrigger value="resources">Resources</TabsTrigger>
          </TabsList>

          <TabsContent value="tickets">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Support Tickets</CardTitle>
                  <CardDescription>Your recent support requests</CardDescription>
                </div>
                <Button className="gap-2 gradient-primary">
                  <Plus className="h-4 w-4" />
                  New Ticket
                </Button>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {tickets.map((ticket) => (
                    <div key={ticket.id} className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted/50 transition-colors cursor-pointer">
                      <div className="flex items-center gap-4">
                        <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${
                          ticket.status === "Open" ? "bg-blue-500/10" :
                          ticket.status === "In Progress" ? "bg-yellow-500/10" : "bg-green-500/10"
                        }`}>
                          {ticket.status === "Open" ? <AlertCircle className="h-5 w-5 text-blue-500" /> :
                           ticket.status === "In Progress" ? <Clock className="h-5 w-5 text-yellow-500" /> :
                           <CheckCircle className="h-5 w-5 text-green-500" />}
                        </div>
                        <div>
                          <p className="font-medium">{ticket.subject}</p>
                          <p className="text-sm text-muted-foreground">{ticket.id} • {ticket.created}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={ticket.priority === "High" ? "destructive" : ticket.priority === "Medium" ? "secondary" : "outline"}>
                          {ticket.priority}
                        </Badge>
                        <Badge variant={ticket.status === "Resolved" ? "default" : "outline"}>
                          {ticket.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="new">
            <Card>
              <CardHeader>
                <CardTitle>Create New Ticket</CardTitle>
                <CardDescription>Describe your issue and we'll help you resolve it</CardDescription>
              </CardHeader>
              <CardContent>
                <form className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Category</label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="shipment">Shipment Issue</SelectItem>
                          <SelectItem value="billing">Billing</SelectItem>
                          <SelectItem value="technical">Technical Support</SelectItem>
                          <SelectItem value="account">Account</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Priority</label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Select priority" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="low">Low</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="high">High</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Subject</label>
                    <Input placeholder="Brief description of your issue" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">AWB/Order ID (Optional)</label>
                    <Input placeholder="Enter AWB or Order ID if applicable" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Description</label>
                    <Textarea placeholder="Please provide detailed information about your issue..." rows={5} />
                  </div>
                  <Button className="gradient-primary">Submit Ticket</Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="faq">
            <Card>
              <CardHeader>
                <CardTitle>Frequently Asked Questions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {faqs.map((faq, index) => (
                    <div key={index} className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted/50 transition-colors cursor-pointer">
                      <div className="flex items-center gap-3">
                        <HelpCircle className="h-5 w-5 text-primary" />
                        <span>{faq.question}</span>
                      </div>
                      <Badge variant="outline">{faq.category}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="resources">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardContent className="pt-6">
                  <BookOpen className="h-12 w-12 text-primary mb-4" />
                  <h3 className="font-semibold mb-2">Documentation</h3>
                  <p className="text-sm text-muted-foreground mb-4">Comprehensive guides and API documentation</p>
                  <Button variant="outline" className="w-full" onClick={() => setDocsDialog(true)}>Browse Docs</Button>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <Video className="h-12 w-12 text-primary mb-4" />
                  <h3 className="font-semibold mb-2">Video Tutorials</h3>
                  <p className="text-sm text-muted-foreground mb-4">Step-by-step video guides</p>
                  <Button variant="outline" className="w-full" onClick={() => setVideosDialog(true)}>Watch Videos</Button>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <FileText className="h-12 w-12 text-primary mb-4" />
                  <h3 className="font-semibold mb-2">Knowledge Base</h3>
                  <p className="text-sm text-muted-foreground mb-4">Articles and troubleshooting guides</p>
                  <Button variant="outline" className="w-full" onClick={() => setKbDialog(true)}>Read Articles</Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </main>

      <Footer />

      {/* Live Chat Dialog */}
      <Dialog open={chatOpen} onOpenChange={setChatOpen}>
        <DialogContent className="max-w-md h-[600px] flex flex-col p-0">
          {/* Chat Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b bg-primary text-primary-foreground rounded-t-lg">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-white/20 flex items-center justify-center">
                <Headphones className="h-5 w-5" />
              </div>
              <div>
                <p className="font-semibold">FastFare Support</p>
                <p className="text-xs opacity-80">Usually responds in a few minutes</p>
              </div>
            </div>
            <Button 
              variant="ghost" 
              size="icon" 
              className="text-white hover:bg-white/20"
              onClick={() => setChatOpen(false)}
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Chat Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {chatMessages.map((msg) => (
              <div 
                key={msg.id} 
                className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div 
                  className={`max-w-[80%] rounded-lg px-4 py-2 ${
                    msg.sender === 'user' 
                      ? 'bg-primary text-primary-foreground' 
                      : 'bg-muted'
                  }`}
                >
                  <p className="text-sm">{msg.text}</p>
                  <p className={`text-xs mt-1 ${msg.sender === 'user' ? 'opacity-70' : 'text-muted-foreground'}`}>
                    {msg.time}
                  </p>
                </div>
              </div>
            ))}
            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-muted rounded-lg px-4 py-2">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Chat Input */}
          <div className="p-4 border-t">
            <div className="flex gap-2">
              <Input
                placeholder="Type your message..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyDown={handleKeyPress}
                className="flex-1"
              />
              <Button onClick={handleSendMessage} size="icon">
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Documentation Dialog */}
      <Dialog open={docsDialog} onOpenChange={setDocsDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-primary" />
              Documentation
            </DialogTitle>
            <DialogDescription>
              Comprehensive guides and API documentation for FastFare
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 mt-4">
            {documentationItems.map((doc, index) => (
              <div 
                key={index} 
                className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted/50 transition-colors cursor-pointer"
                onClick={() => toast.info(`Opening ${doc.title}...`)}
              >
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <BookOpen className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">{doc.title}</p>
                    <p className="text-sm text-muted-foreground">{doc.description}</p>
                  </div>
                </div>
                <Badge variant="outline">{doc.category}</Badge>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Video Tutorials Dialog */}
      <Dialog open={videosDialog} onOpenChange={setVideosDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Video className="h-5 w-5 text-primary" />
              Video Tutorials
            </DialogTitle>
            <DialogDescription>
              Step-by-step video guides to help you get the most out of FastFare
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            {videoTutorials.map((video, index) => (
              <div 
                key={index} 
                className="rounded-lg border hover:border-primary transition-colors cursor-pointer overflow-hidden"
                onClick={() => toast.info(`Playing: ${video.title}`)}
              >
                <div className="h-24 bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                  <span className="text-4xl">{video.thumbnail}</span>
                </div>
                <div className="p-3">
                  <p className="font-medium text-sm line-clamp-2">{video.title}</p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                    <span>{video.duration}</span>
                    <span>•</span>
                    <span>{video.views} views</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Knowledge Base Dialog */}
      <Dialog open={kbDialog} onOpenChange={setKbDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              Knowledge Base
            </DialogTitle>
            <DialogDescription>
              Browse articles and troubleshooting guides
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 mt-4">
            {knowledgeBaseArticles.map((article, index) => (
              <div 
                key={index} 
                className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted/50 transition-colors cursor-pointer"
                onClick={() => toast.info(`Reading: ${article.title}`)}
              >
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center">
                    <FileText className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium">{article.title}</p>
                    <p className="text-xs text-muted-foreground">{article.helpful} people found this helpful</p>
                  </div>
                </div>
                <Badge variant="secondary">{article.category}</Badge>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SupportCenter;

