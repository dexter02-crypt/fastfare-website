import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import {
  Search, Package, User, MapPin, FileText, Clock,
  ArrowRight, Filter, X
} from "lucide-react";

const searchResults = {
  shipments: [] as { id: string; status: string; origin: string; destination: string; date: string }[],
  addresses: [] as { id: number; name: string; address: string; type: string }[],
  customers: [] as { id: number; name: string; email: string; orders: number }[],
  invoices: [] as { id: string; amount: string; date: string; status: string }[],
};

const SearchResults = () => {
  const [searchParams] = useSearchParams();
  const query = searchParams.get("q") || "";
  const [searchQuery, setSearchQuery] = useState(query);
  const [activeTab, setActiveTab] = useState("all");

  const totalResults =
    searchResults.shipments.length +
    searchResults.addresses.length +
    searchResults.customers.length +
    searchResults.invoices.length;

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container py-8">
        {/* Search Header */}
        <div className="mb-8">
          <div className="flex gap-4 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                placeholder="Search shipments, addresses, customers..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-12 text-lg"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                >
                  <X className="h-5 w-5 text-muted-foreground hover:text-foreground" />
                </button>
              )}
            </div>
            <Button className="h-12 px-6 gradient-primary">Search</Button>
          </div>
          {query && (
            <p className="text-muted-foreground">
              {totalResults} results for "{query}"
            </p>
          )}
        </div>

        {/* Results Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="all" className="gap-2">
              All <Badge variant="secondary">{totalResults}</Badge>
            </TabsTrigger>
            <TabsTrigger value="shipments" className="gap-2">
              Shipments <Badge variant="secondary">{searchResults.shipments.length}</Badge>
            </TabsTrigger>
            <TabsTrigger value="addresses" className="gap-2">
              Addresses <Badge variant="secondary">{searchResults.addresses.length}</Badge>
            </TabsTrigger>
            <TabsTrigger value="customers" className="gap-2">
              Customers <Badge variant="secondary">{searchResults.customers.length}</Badge>
            </TabsTrigger>
            <TabsTrigger value="invoices" className="gap-2">
              Invoices <Badge variant="secondary">{searchResults.invoices.length}</Badge>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-6">
            {/* Shipments Section */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Package className="h-5 w-5 text-primary" />
                    Shipments
                  </CardTitle>
                  <CardDescription>{searchResults.shipments.length} results</CardDescription>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setActiveTab("shipments")}>
                  View all <ArrowRight className="h-4 w-4 ml-1" />
                </Button>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {searchResults.shipments.map((shipment) => (
                    <Link
                      key={shipment.id}
                      to={`/shipment/${shipment.id}`}
                      className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                          <Package className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium">{shipment.id}</p>
                          <p className="text-sm text-muted-foreground">
                            {shipment.origin} → {shipment.destination}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge variant={shipment.status === "Delivered" ? "default" : "secondary"}>
                          {shipment.status}
                        </Badge>
                        <p className="text-xs text-muted-foreground mt-1">{shipment.date}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Addresses Section */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <MapPin className="h-5 w-5 text-green-500" />
                    Saved Addresses
                  </CardTitle>
                  <CardDescription>{searchResults.addresses.length} results</CardDescription>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setActiveTab("addresses")}>
                  View all <ArrowRight className="h-4 w-4 ml-1" />
                </Button>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {searchResults.addresses.map((address) => (
                    <div
                      key={address.id}
                      className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted/50 transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                          <MapPin className="h-5 w-5 text-green-500" />
                        </div>
                        <div>
                          <p className="font-medium">{address.name}</p>
                          <p className="text-sm text-muted-foreground">{address.address}</p>
                        </div>
                      </div>
                      <Badge variant="outline">{address.type}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Customers Section */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <User className="h-5 w-5 text-purple-500" />
                    Customers
                  </CardTitle>
                  <CardDescription>{searchResults.customers.length} results</CardDescription>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setActiveTab("customers")}>
                  View all <ArrowRight className="h-4 w-4 ml-1" />
                </Button>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {searchResults.customers.map((customer) => (
                    <div
                      key={customer.id}
                      className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted/50 transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
                          <User className="h-5 w-5 text-purple-500" />
                        </div>
                        <div>
                          <p className="font-medium">{customer.name}</p>
                          <p className="text-sm text-muted-foreground">{customer.email}</p>
                        </div>
                      </div>
                      <Badge variant="secondary">{customer.orders} orders</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="shipments">
            <Card>
              <CardHeader>
                <CardTitle>Shipment Results</CardTitle>
                <CardDescription>{searchResults.shipments.length} shipments found</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {searchResults.shipments.map((shipment) => (
                    <Link
                      key={shipment.id}
                      to={`/shipment/${shipment.id}`}
                      className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                          <Package className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium">{shipment.id}</p>
                          <p className="text-sm text-muted-foreground">
                            {shipment.origin} → {shipment.destination}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge variant={shipment.status === "Delivered" ? "default" : "secondary"}>
                          {shipment.status}
                        </Badge>
                        <p className="text-xs text-muted-foreground mt-1">{shipment.date}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="addresses">
            <Card>
              <CardHeader>
                <CardTitle>Address Results</CardTitle>
                <CardDescription>{searchResults.addresses.length} addresses found</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {searchResults.addresses.map((address) => (
                    <div
                      key={address.id}
                      className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted/50 transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                          <MapPin className="h-5 w-5 text-green-500" />
                        </div>
                        <div>
                          <p className="font-medium">{address.name}</p>
                          <p className="text-sm text-muted-foreground">{address.address}</p>
                        </div>
                      </div>
                      <Badge variant="outline">{address.type}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="customers">
            <Card>
              <CardHeader>
                <CardTitle>Customer Results</CardTitle>
                <CardDescription>{searchResults.customers.length} customers found</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {searchResults.customers.map((customer) => (
                    <div
                      key={customer.id}
                      className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted/50 transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
                          <User className="h-5 w-5 text-purple-500" />
                        </div>
                        <div>
                          <p className="font-medium">{customer.name}</p>
                          <p className="text-sm text-muted-foreground">{customer.email}</p>
                        </div>
                      </div>
                      <Badge variant="secondary">{customer.orders} orders</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="invoices">
            <Card>
              <CardHeader>
                <CardTitle>Invoice Results</CardTitle>
                <CardDescription>{searchResults.invoices.length} invoices found</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {searchResults.invoices.map((invoice) => (
                    <div
                      key={invoice.id}
                      className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted/50 transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-lg bg-orange-500/10 flex items-center justify-center">
                          <FileText className="h-5 w-5 text-orange-500" />
                        </div>
                        <div>
                          <p className="font-medium">{invoice.id}</p>
                          <p className="text-sm text-muted-foreground">{invoice.date}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{invoice.amount}</p>
                        <Badge variant={invoice.status === "Paid" ? "default" : "secondary"}>
                          {invoice.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      <Footer />
    </div>
  );
};

export default SearchResults;
