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
import { MapPin, User, Package, Check, X, Loader2 } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { API_BASE_URL } from '@/config';
import { useToast } from '@/hooks/use-toast';

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
  
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const acceptMutation = useMutation({
    mutationFn: async () => {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE_URL}/api/orders/${order._id}/accept`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to accept order');
      return res.json();
    },
    onSuccess: () => {
      toast({ title: 'Order Accepted', description: 'You have accepted this order' });
      queryClient.invalidateQueries({ queryKey: ['orders-by-stage'] });
    },
    onError: (err: any) => {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    }
  });

  const declineMutation = useMutation({
    mutationFn: async () => {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE_URL}/api/orders/${order._id}/decline`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to decline order');
      return res.json();
    },
    onSuccess: () => {
      toast({ title: 'Order Declined', description: 'Order returned to queue' });
      queryClient.invalidateQueries({ queryKey: ['orders-by-stage'] });
    },
    onError: (err: any) => {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    }
  });

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

        {userRole === 'partner' && currentStage === 'direct_shipment' && (order.orderStatus === 'New' || order.orderStatus === 'pending_acceptance' || order.status === 'pending_acceptance') && (
          <div className="flex flex-col sm:flex-row gap-2 mt-4">
            <Button 
              size="sm" 
              className="flex-1 bg-green-600 hover:bg-green-700"
              onClick={() => acceptMutation.mutate()}
              disabled={acceptMutation.isPending || declineMutation.isPending}
            >
              {acceptMutation.isPending ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Check className="h-4 w-4 mr-1" />}
              Accept
            </Button>
            <Button 
              size="sm" 
              variant="destructive"
              className="flex-1"
              onClick={() => declineMutation.mutate()}
              disabled={acceptMutation.isPending || declineMutation.isPending}
            >
              {declineMutation.isPending ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <X className="h-4 w-4 mr-1" />}
              Decline
            </Button>
          </div>
        )}

        {userRole === 'partner' && currentStage === 'direct_shipment' && order.orderStatus === 'Confirmed' && (
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