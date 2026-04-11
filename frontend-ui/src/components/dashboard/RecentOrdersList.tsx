import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import { OrderTimelineAccordion } from '@/components/orders/OrderTimelineAccordion';
import { ChevronDown, ChevronUp, MapPin, User, ExternalLink, Loader2 } from 'lucide-react';

interface RecentOrdersListProps {
  orders: any[];
  isLoading?: boolean;
}

const statusColors: Record<string, string> = {
  New: 'bg-blue-100 text-blue-700',
  Pending: 'bg-yellow-100 text-yellow-700',
  Confirmed: 'bg-purple-100 text-purple-700',
  Processing: 'bg-orange-100 text-orange-700',
  Shipped: 'bg-indigo-100 text-indigo-700',
  Delivered: 'bg-green-100 text-green-700',
  Cancelled: 'bg-red-100 text-red-700'
};

export function RecentOrdersList({ orders, isLoading }: RecentOrdersListProps) {
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <Loader2 className="h-8 w-8 animate-spin mx-auto" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Orders</CardTitle>
      </CardHeader>
      <CardContent>
        {orders.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">No orders yet</p>
        ) : (
          <div className="space-y-2">
            {orders.map((order: any) => (
              <motion.div
                key={order._id}
                className="border rounded-lg overflow-hidden"
              >
                <div 
                  className="flex items-center justify-between p-3 cursor-pointer hover:bg-muted/50"
                  onClick={() => setExpandedOrder(expandedOrder === order._id ? null : order._id)}
                >
                  <div className="flex items-center gap-3">
                    <div>
                      <p className="font-mono text-sm font-semibold">{order.orderId}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <MapPin className="h-3 w-3" />
                        <span>{order.address?.city}, {order.address?.state}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge className={statusColors[order.orderStatus] || 'bg-gray-100'}>
                      {order.orderStatus}
                    </Badge>
                    <span className="font-semibold">₹{order.orderValue?.toLocaleString()}</span>
                    {expandedOrder === order._id ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </div>
                </div>

                <AnimatePresence>
                  {expandedOrder === order._id && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="border-t bg-muted/30 p-3"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">{order.customer?.name}</span>
                        </div>
                        <Button size="sm" variant="outline" onClick={() => window.open(`/track?order=${order.orderId}`, '_blank')}>
                          Track <ExternalLink className="ml-1 h-3 w-3" />
                        </Button>
                      </div>
                      {order.orderHistory && order.orderHistory.length > 0 && (
                        <OrderTimelineAccordion history={order.orderHistory} />
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}