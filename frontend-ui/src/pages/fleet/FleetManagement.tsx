import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Menu, Truck, User, X } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import TrucksTab from "./TrucksTab";
import DriversTab from "./DriversTab";

const FleetManagement = () => {
  const [activeTab, setActiveTab] = useState("trucks");

  return (
    <DashboardLayout>
      <div className="flex flex-col md:flex-row h-full">
        {/* Sidebar (Desktop) / Horizontal Nav (Mobile) */}
        <div className="w-full md:w-64 bg-card border-b md:border-b-0 md:border-r shrink-0">
          <div className="p-4 border-b hidden md:block">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Truck className="h-5 w-5 text-primary" />
              Fleet Management
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              Manage trucks and drivers
            </p>
          </div>

          <nav className="p-3 md:p-4">
            <Tabs
              value={activeTab}
              onValueChange={setActiveTab}
              className="w-full"
            >
              <TabsList className="flex w-full md:flex-col h-auto bg-muted md:bg-transparent rounded-lg md:rounded-none p-1 md:p-0 md:space-y-1">
                <TabsTrigger
                  value="trucks"
                  className="flex-1 md:w-full justify-center md:justify-start gap-2 px-4 py-2.5 md:py-3 rounded-md md:rounded-md data-[state=active]:bg-primary data-[state=active]:text-primary-foreground md:data-[state=active]:bg-primary"
                >
                  <Truck className="h-4 w-4" />
                  Trucks
                </TabsTrigger>
                <TabsTrigger
                  value="drivers"
                  className="flex-1 md:w-full justify-center md:justify-start gap-2 px-4 py-2.5 md:py-3 rounded-md md:rounded-md data-[state=active]:bg-primary data-[state=active]:text-primary-foreground md:data-[state=active]:bg-primary"
                >
                  <User className="h-4 w-4" />
                  Drivers
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </nav>
        </div>

        {/* Main content */}
        <main className="flex-1 p-4 md:p-6 overflow-auto">
          <Tabs value={activeTab} className="w-full">
            <TabsContent value="trucks" className="mt-0">
              <TrucksTab />
            </TabsContent>
            <TabsContent value="drivers" className="mt-0">
              <DriversTab />
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </DashboardLayout>
  );
};

export default FleetManagement;
