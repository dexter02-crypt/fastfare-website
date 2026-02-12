import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Menu, Truck, User, X } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import TrucksTab from "./TrucksTab";
import DriversTab from "./DriversTab";

const FleetManagement = () => {
  const [activeTab, setActiveTab] = useState("trucks");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth >= 768) {
        setSidebarOpen(true);
      }
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    if (isMobile) {
      setSidebarOpen(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="flex h-full relative">
        {/* Mobile hamburger button */}
        {isMobile && (
          <Button
            variant="ghost"
            size="icon"
            className="fixed top-20 left-4 z-50 md:hidden"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        )}

        {/* Sidebar overlay for mobile */}
        {isMobile && sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-40 md:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Sidebar */}
        <aside
          className={`
            ${isMobile ? "fixed left-0 top-16 h-[calc(100vh-4rem)] z-50" : "relative"}
            ${sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
            w-64 bg-card border-r transition-transform duration-200 ease-in-out
            flex flex-col
          `}
        >
          <div className="p-4 border-b">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Truck className="h-5 w-5 text-primary" />
              Fleet Management
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              Manage trucks and drivers
            </p>
          </div>

          <nav className="flex-1 p-4">
            <Tabs
              value={activeTab}
              onValueChange={handleTabChange}
              orientation="vertical"
              className="w-full"
            >
              <TabsList className="flex flex-col w-full h-auto space-y-1 bg-transparent">
                <TabsTrigger
                  value="trucks"
                  className="w-full justify-start gap-2 px-4 py-3 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                >
                  <Truck className="h-4 w-4" />
                  Trucks
                </TabsTrigger>
                <TabsTrigger
                  value="drivers"
                  className="w-full justify-start gap-2 px-4 py-3 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                >
                  <User className="h-4 w-4" />
                  Drivers
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </nav>
        </aside>

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
