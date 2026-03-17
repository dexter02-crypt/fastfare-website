import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Package, TrendingUp } from "lucide-react";

interface SummaryData {
  ordersToday: number;
  ordersYesterday: number;
  ordersChange: number;
  revenueToday: number;
  revenueYesterday: number;
  revenueChange: number;
}

interface DashboardSummaryProps {
  data?: SummaryData;
}

const DashboardSummary = ({
  data = {
    ordersToday: 0,
    ordersYesterday: 0,
    ordersChange: 0,
    revenueToday: 0,
    revenueYesterday: 0,
    revenueChange: 0,
  },
}: DashboardSummaryProps) => {
  return (
    <div className="grid md:grid-cols-2 gap-4">
      {/* Orders Summary */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="h-12 w-12 rounded-xl bg-blue-100 flex items-center justify-center shrink-0">
              <Package className="h-6 w-6 text-blue-600" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-lg">Orders</h3>
                {data.ordersChange !== 0 && (
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${data.ordersChange > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {data.ordersChange > 0 ? '↗' : '↘'} {Math.abs(data.ordersChange).toFixed(1)}%
                  </span>
                )}
              </div>
              <div className="mt-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Today</span>
                  <span className="text-xl font-bold">{data.ordersToday}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Yesterday</span>
                  <span className="text-xl font-bold">{data.ordersYesterday}</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Revenue Summary */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="h-12 w-12 rounded-xl bg-green-100 flex items-center justify-center shrink-0">
              <TrendingUp className="h-6 w-6 text-green-600" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-lg">Revenue</h3>
                {data.revenueChange !== 0 && (
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${data.revenueChange > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {data.revenueChange > 0 ? '↗' : '↘'} {Math.abs(data.revenueChange).toFixed(1)}%
                  </span>
                )}
              </div>
              <div className="mt-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Today</span>
                  <span className="text-xl font-bold">₹ {data.revenueToday.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Yesterday</span>
                  <span className="text-xl font-bold">₹ {data.revenueYesterday.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DashboardSummary;
