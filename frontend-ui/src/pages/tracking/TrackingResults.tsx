import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  ArrowLeft,
  MapPin,
  Package,
  Truck,
  CheckCircle,
  Clock,
  Phone,
  Share2,
  Map,
  Calendar,
} from "lucide-react";
import logo from "@/assets/logo.png";

const mockTrackingData = {
  awb: "AWB1234567890",
  orderId: "FF12345678",
  status: "in-transit",
  carrier: "BlueDart",
  estimatedDelivery: "January 18, 2024",
  deliveryTime: "By 6:00 PM",
  pickup: {
    city: "Mumbai",
    address: "123 Industrial Area, Andheri East, Mumbai - 400093",
    date: "Jan 15, 2024",
  },
  delivery: {
    city: "Delhi",
    address: "456 Green Park, Sector 21, Delhi - 110022",
    name: "John Doe",
  },
  currentLocation: "Nagpur Hub",
  timeline: [
    {
      status: "Order Placed",
      description: "Shipment booked successfully",
      time: "Jan 15, 2024 10:30 AM",
      location: "Mumbai",
      completed: true,
    },
    {
      status: "Picked Up",
      description: "Package picked up from sender",
      time: "Jan 15, 2024 02:30 PM",
      location: "Mumbai Hub",
      completed: true,
    },
    {
      status: "In Transit",
      description: "Package in transit to destination city",
      time: "Jan 16, 2024 06:00 AM",
      location: "Nagpur Hub",
      completed: true,
      current: true,
    },
    {
      status: "Arrived at Destination City",
      description: "Package arrived at Delhi hub",
      time: "Expected: Jan 17, 2024",
      location: "Delhi Hub",
      completed: false,
    },
    {
      status: "Out for Delivery",
      description: "Package out for delivery",
      time: "Expected: Jan 18, 2024",
      location: "Delhi",
      completed: false,
    },
    {
      status: "Delivered",
      description: "Package delivered successfully",
      time: "Expected: Jan 18, 2024",
      location: "Delhi",
      completed: false,
    },
  ],
};

const TrackingResults = () => {
  const { awb } = useParams();
  const navigate = useNavigate();

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      "in-transit": "bg-blue-100 text-blue-700",
      delivered: "bg-green-100 text-green-700",
      "out-for-delivery": "bg-orange-100 text-orange-700",
      pending: "bg-yellow-100 text-yellow-700",
    };
    return colors[status] || colors.pending;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      {/* Header */}
      <header className="border-b bg-background/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate("/track")}
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <a href="/" className="flex items-center gap-2">
                <img src={logo} alt="FastFare" className="h-8 w-auto" />
              </a>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm">
                <Share2 className="h-4 w-4 mr-2" /> Share
              </Button>
              <Button variant="outline" size="sm" onClick={() => navigate("/login")}>
                Login
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto">
          {/* Status Card */}
          <Card className="mb-6 overflow-hidden">
            <div className="bg-primary/5 px-6 py-4 border-b">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">
                    Tracking Number
                  </p>
                  <p className="text-xl font-bold font-mono">{awb}</p>
                </div>
                <Badge className={`${getStatusColor(mockTrackingData.status)} text-sm px-4 py-1`}>
                  <Truck className="h-4 w-4 mr-2" />
                  In Transit
                </Badge>
              </div>
            </div>
            <CardContent className="pt-6">
              <div className="grid md:grid-cols-2 gap-6">
                {/* Estimated Delivery */}
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <Calendar className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Estimated Delivery
                    </p>
                    <p className="font-semibold">
                      {mockTrackingData.estimatedDelivery}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {mockTrackingData.deliveryTime}
                    </p>
                  </div>
                </div>

                {/* Current Location */}
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <MapPin className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Current Location
                    </p>
                    <p className="font-semibold">
                      {mockTrackingData.currentLocation}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Carrier: {mockTrackingData.carrier}
                    </p>
                  </div>
                </div>
              </div>

              <Separator className="my-6" />

              {/* Route */}
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-3 h-3 rounded-full bg-green-500" />
                    <span className="text-sm text-muted-foreground">From</span>
                  </div>
                  <p className="font-medium">{mockTrackingData.pickup.city}</p>
                  <p className="text-sm text-muted-foreground truncate">
                    {mockTrackingData.pickup.address}
                  </p>
                </div>
                <div className="flex-shrink-0">
                  <div className="w-16 h-0.5 bg-primary relative">
                    <Truck className="absolute -top-2 left-1/2 -translate-x-1/2 h-5 w-5 text-primary bg-background" />
                  </div>
                </div>
                <div className="flex-1 text-right">
                  <div className="flex items-center justify-end gap-2 mb-1">
                    <span className="text-sm text-muted-foreground">To</span>
                    <div className="w-3 h-3 rounded-full bg-red-500" />
                  </div>
                  <p className="font-medium">{mockTrackingData.delivery.city}</p>
                  <p className="text-sm text-muted-foreground truncate">
                    {mockTrackingData.delivery.name}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Timeline */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Package className="h-5 w-5 text-primary" />
                Shipment Timeline
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative">
                {mockTrackingData.timeline.map((event, index) => (
                  <div key={index} className="flex gap-4 pb-8 last:pb-0">
                    <div className="relative flex flex-col items-center">
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          event.completed
                            ? event.current
                              ? "bg-primary text-primary-foreground"
                              : "bg-green-100 text-green-600"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {event.completed ? (
                          event.current ? (
                            <Truck className="h-5 w-5" />
                          ) : (
                            <CheckCircle className="h-5 w-5" />
                          )
                        ) : (
                          <Clock className="h-5 w-5" />
                        )}
                      </div>
                      {index < mockTrackingData.timeline.length - 1 && (
                        <div
                          className={`absolute top-10 w-0.5 h-full ${
                            event.completed ? "bg-green-200" : "bg-muted"
                          }`}
                        />
                      )}
                    </div>
                    <div className="flex-1 pt-1.5">
                      <div className="flex items-center gap-2">
                        <p
                          className={`font-medium ${
                            event.current ? "text-primary" : ""
                          }`}
                        >
                          {event.status}
                        </p>
                        {event.current && (
                          <Badge className="text-xs">Current</Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {event.description}
                      </p>
                      <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                        <span>{event.time}</span>
                        <span>•</span>
                        <span>{event.location}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3 mt-6">
            <Button 
              variant="outline" 
              className="flex-1"
              onClick={() => navigate(`/tracking/${awb}/live`)}
            >
              <Map className="h-4 w-4 mr-2" /> View Live Map
            </Button>
            <Button variant="outline" className="flex-1">
              <Phone className="h-4 w-4 mr-2" /> Contact Support
            </Button>
            <Button
              className="flex-1 gradient-primary"
              onClick={() => navigate("/track")}
            >
              Track Another Shipment
            </Button>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t py-8 mt-16">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>© 2024 FastFare. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default TrackingResults;
