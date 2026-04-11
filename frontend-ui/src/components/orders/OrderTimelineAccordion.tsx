import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { 
  Package, 
  Warehouse, 
  Truck, 
  MapPin, 
  CheckCircle, 
  XCircle, 
  RotateCcw,
  Circle
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface OrderTimelineAccordionProps {
  history: Array<{
    stage: string;
    timestamp: Date | string;
    changedBy?: string;
    note?: string;
  }>;
}

const stageIcons: Record<string, React.ElementType> = {
  direct_shipment: Package,
  warehouse_scans: Warehouse,
  in_transit: Truck,
  out_for_delivery: MapPin,
  delivered: CheckCircle,
  failed_delivery: XCircle,
  returned: RotateCcw,
  cancelled: Circle
};

const stageColors: Record<string, string> = {
  direct_shipment: 'bg-blue-500',
  warehouse_scans: 'bg-yellow-500',
  in_transit: 'bg-orange-500',
  out_for_delivery: 'bg-purple-500',
  delivered: 'bg-green-500',
  failed_delivery: 'bg-red-500',
  returned: 'bg-gray-500',
  cancelled: 'bg-slate-500'
};

export function OrderTimelineAccordion({ history }: OrderTimelineAccordionProps) {
  const formatDate = (date: Date | string) => {
    const d = new Date(date);
    return d.toLocaleDateString('en-IN', { 
      day: 'numeric', 
      month: 'short', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="space-y-0">
      {history.map((item, index) => {
        const Icon = stageIcons[item.stage] || Circle;
        const colorClass = stageColors[item.stage] || 'bg-gray-500';
        
        return (
          <motion.div
            key={index}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className="flex gap-3"
          >
            <div className="flex flex-col items-center">
              <div className={cn("w-8 h-8 rounded-full flex items-center justify-center", colorClass)}>
                <Icon className="w-4 h-4 text-white" />
              </div>
              {index < history.length - 1 && (
                <div className="w-0.5 h-8 bg-gray-200" />
              )}
            </div>
            <div className="pb-4 flex-1">
              <div className="flex items-center gap-2">
                <span className="font-medium capitalize">{item.stage.replace(/_/g, ' ')}</span>
                <Badge variant="outline" className="text-xs">{formatDate(item.timestamp)}</Badge>
              </div>
              {item.note && (
                <p className="text-sm text-muted-foreground mt-1">{item.note}</p>
              )}
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}