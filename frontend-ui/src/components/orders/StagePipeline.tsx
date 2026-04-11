import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { OrderStageCard } from './OrderStageCard';
import { 
  Package, 
  Warehouse, 
  Truck, 
  MapPin, 
  CheckCircle, 
  XCircle, 
  RotateCcw,
  X
} from 'lucide-react';

interface StagePipelineProps {
  orders: any[];
  userRole: 'user' | 'partner' | 'admin';
  onStageUpdate: (orderId: string, newStage: string) => void;
}

const stageConfig = {
  direct_shipment: {
    label: 'Direct Shipment',
    icon: Package,
    color: 'bg-blue-100 text-blue-700 border-blue-200',
    nextStage: 'warehouse_scans'
  },
  warehouse_scans: {
    label: 'Warehouse Scans',
    icon: Warehouse,
    color: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    nextStage: 'in_transit'
  },
  in_transit: {
    label: 'In Transit',
    icon: Truck,
    color: 'bg-orange-100 text-orange-700 border-orange-200',
    nextStage: 'out_for_delivery'
  },
  out_for_delivery: {
    label: 'Out for Delivery',
    icon: MapPin,
    color: 'bg-purple-100 text-purple-700 border-purple-200',
    nextStage: 'delivered'
  },
  delivered: {
    label: 'Delivered',
    icon: CheckCircle,
    color: 'bg-green-100 text-green-700 border-green-200',
    nextStage: null
  },
  failed_delivery: {
    label: 'Failed Delivery',
    icon: XCircle,
    color: 'bg-red-100 text-red-700 border-red-200',
    nextStage: null
  },
  returned: {
    label: 'Returned',
    icon: RotateCcw,
    color: 'bg-gray-100 text-gray-700 border-gray-200',
    nextStage: null
  },
  cancelled: {
    label: 'Cancelled',
    icon: X,
    color: 'bg-slate-100 text-slate-700 border-slate-200',
    nextStage: null
  }
};

export function StagePipeline({ orders, userRole, onStageUpdate }: StagePipelineProps) {
  const directShipmentOrders = orders.filter(o => o.orderStage === 'direct_shipment' || !o.orderStage);
  const warehouseScanOrders = orders.filter(o => o.orderStage === 'warehouse_scans');

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="space-y-4">
        <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg">
          <Package className="h-5 w-5 text-blue-600" />
          <h3 className="font-semibold text-blue-800">Direct Shipment</h3>
          <Badge variant="secondary" className="ml-auto bg-blue-100 text-blue-700">
            {directShipmentOrders.length}
          </Badge>
        </div>
        <div className="space-y-3 min-h-[200px] p-4 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
          <AnimatePresence>
            {directShipmentOrders.map(order => (
              <motion.div
                key={order._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -100 }}
                transition={{ duration: 0.3 }}
              >
                <OrderStageCard 
                  order={order} 
                  userRole={userRole}
                  onStageUpdate={onStageUpdate}
                  stageConfig={stageConfig}
                />
              </motion.div>
            ))}
          </AnimatePresence>
          {directShipmentOrders.length === 0 && (
            <p className="text-center text-muted-foreground py-8">No orders in this stage</p>
          )}
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center gap-2 p-3 bg-yellow-50 rounded-lg">
          <Warehouse className="h-5 w-5 text-yellow-600" />
          <h3 className="font-semibold text-yellow-800">Warehouse Scans</h3>
          <Badge variant="secondary" className="ml-auto bg-yellow-100 text-yellow-700">
            {warehouseScanOrders.length}
          </Badge>
        </div>
        <div className="space-y-3 min-h-[200px] p-4 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
          <AnimatePresence>
            {warehouseScanOrders.map(order => (
              <motion.div
                key={order._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: 100 }}
                transition={{ duration: 0.3 }}
              >
                <OrderStageCard 
                  order={order} 
                  userRole={userRole}
                  onStageUpdate={onStageUpdate}
                  stageConfig={stageConfig}
                />
              </motion.div>
            ))}
          </AnimatePresence>
          {warehouseScanOrders.length === 0 && (
            <p className="text-center text-muted-foreground py-8">No orders in this stage</p>
          )}
        </div>
      </div>
    </div>
  );
}