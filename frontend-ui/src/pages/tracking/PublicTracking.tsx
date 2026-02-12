import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Search, Package, Truck, MapPin } from "lucide-react";
import Header from "@/components/Header";

const PublicTracking = () => {
  const navigate = useNavigate();
  const [trackingId, setTrackingId] = useState("");
  const [error, setError] = useState("");

  const handleTrack = (e: React.FormEvent) => {
    e.preventDefault();
    if (!trackingId.trim()) {
      setError("Please enter a tracking number");
      return;
    }
    setError("");
    navigate(`/track/${trackingId.trim()}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      {/* Header — auth-aware: shows profile for logged-in users, Login for guests */}
      <Header />

      {/* Main Content */}
      <main className="container mx-auto px-4 py-16">
        <div className="max-w-2xl mx-auto">
          {/* Hero Section */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary/10 mb-6">
              <Package className="h-10 w-10 text-primary" />
            </div>
            <h1 className="text-4xl font-bold mb-4">Track Your Shipment</h1>
            <p className="text-lg text-muted-foreground">
              Enter your AWB number or Order ID to track your package in real-time
            </p>
          </div>

          {/* Search Card */}
          <Card className="shadow-lg">
            <CardContent className="pt-6">
              <form onSubmit={handleTrack} className="space-y-4">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder="Enter AWB number or Order ID (e.g., AWB1234567890)"
                    value={trackingId}
                    onChange={(e) => {
                      setTrackingId(e.target.value);
                      setError("");
                    }}
                    className="pl-12 h-14 text-lg"
                  />
                </div>
                {error && <p className="text-sm text-destructive">{error}</p>}
                <Button type="submit" className="w-full h-12 gradient-primary text-lg">
                  Track Shipment
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Tips */}
          <div className="mt-8 text-center text-sm text-muted-foreground">
            <p>You can find your tracking number in:</p>
            <ul className="mt-2 space-y-1">
              <li>• Order confirmation email</li>
              <li>• SMS notification from carrier</li>
              <li>• Shipping label on your package</li>
            </ul>
          </div>

          {/* Features */}
          <div className="grid md:grid-cols-3 gap-6 mt-16">
            <Card>
              <CardContent className="pt-6 text-center">
                <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-4">
                  <Package className="h-6 w-6 text-blue-600" />
                </div>
                <h3 className="font-semibold mb-2">Real-Time Updates</h3>
                <p className="text-sm text-muted-foreground">
                  Get instant updates on your package location
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 text-center">
                <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                  <MapPin className="h-6 w-6 text-green-600" />
                </div>
                <h3 className="font-semibold mb-2">Live Map View</h3>
                <p className="text-sm text-muted-foreground">
                  See your package on the map in real-time
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 text-center">
                <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center mx-auto mb-4">
                  <Truck className="h-6 w-6 text-purple-600" />
                </div>
                <h3 className="font-semibold mb-2">Delivery ETA</h3>
                <p className="text-sm text-muted-foreground">
                  Know exactly when to expect your delivery
                </p>
              </CardContent>
            </Card>
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

export default PublicTracking;
