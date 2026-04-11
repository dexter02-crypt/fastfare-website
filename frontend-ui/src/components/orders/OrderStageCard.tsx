import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { ConfirmStageDialog } from './ConfirmStageDialog';
import { useState } from 'react';
import { MapPin, User, Package } from 'lucide-react';

interface OrderStageCardProps {
  order: any;
  userRole: 'user' | 'partner' | 'admin';
  onStageUpdate: (orderId: string, newStage: string) => void;
  stageConfig: Record<string, any>;
}

export function OrderStageCard({ order, userRole, onStageUpdate, stageConfig }: OrderStageCardProps) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [selectedStage, setSelectedStage] = useState<string | null>(null);
  
  const currentStage = order.orderStage || 'direct_shipment';
  const currentConfig = stageConfig[currentStage];

  const handleConfirmStage = (newStage: string) => {
    setSelectedStage(newStage);
    setConfirmOpen(true);
  };

  const handleStageUpdate = () => {
    if (selectedStage) {
      onStageUpdate(order._id, selectedStage);
      setConfirmOpen(false);
    }
  };

  return (
    <>
      <div className="bg-white border rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow">
        <div className="flex items-start justify-between mb-2">
          <div>
            <h4 className="font-mono text-sm font-semibold">{order.orderId}</h4>
            <Badge className={currentConfig?.color}>{currentConfig?.label}</Badge>
          </div>
          <span className="text-lg font-bold text-green-600">₹{order.orderValue?.toLocaleString()}</span>
        </div>

        <div className="space-y-1 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <MapPin className="h-3 w-3" />
            <span>{order.address?.city}, {order.address?.state}</span>
          </div>
          <div className="flex items-center gap-2">
            <User className="h-3 w-3" />
            <span>{order.customer?.name}</span>
          </div>
          <div className="flex items-center gap-2">
            <Package className="h-3 w-3" />
            <span>{order.items?.length || 0} items</span>
          </div>
        </div>

        {userRole === 'partner' && currentStage === 'direct_shipment' && (
          <Button 
            size="sm" 
            className="w-full mt-3 bg-blue-600 hover:bg-blue-700"
            onClick={() => onStageUpdate(order._id, 'warehouse_scans')}
          >
            Mark as Scanned
          </Button>
        )}

        {userRole === 'admin' && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="sm" variant="outline" className="w-full mt-3">
                Move Stage
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              {Object.entries(stageConfig).map(([stage, config]: [string, any]) => (
                <DropdownMenuItem 
                  key={stage}
                  onClick={() => handleConfirmStage(stage)}
                >
                  {config.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      <ConfirmStageDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        orderId={order.orderId}
        currentStage={currentStage}
        newStage={selectedStage || ''}
        onConfirm={handleStageUpdate}
      />
    </>
  );
}