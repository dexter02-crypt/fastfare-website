import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { 
    Sheet, 
    SheetContent, 
    SheetDescription, 
    SheetHeader, 
    SheetTitle 
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { API_BASE_URL } from '@/config';
import { toast } from 'sonner';
import { Package, MapPin, Weight, DollarSign, User, Clock } from 'lucide-react';

interface PartnerOrderSheetProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    orderData: {
        orderId: string;
        pickup?: any;
        delivery?: any;
        weight?: number;
        orderValue?: number;
        orderType?: string;
        customer?: { name?: string };
    } | null;
    onAccepted?: () => void;
}

export function PartnerOrderSheet({ open, onOpenChange, orderData, onAccepted }: PartnerOrderSheetProps) {
    const [showInTransit, setShowInTransit] = useState(false);

    const acceptMutation = useMutation({
        mutationFn: async () => {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_BASE_URL}/api/orders/${orderData?.orderId}/accept`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }
            });
            if (!res.ok) throw new Error('Failed to accept');
            return res.json();
        },
        onSuccess: () => {
            toast.success('Order accepted');
            setShowInTransit(true);
            onAccepted?.();
        },
        onError: () => {
            toast.error('Failed to accept order');
        }
    });

    const declineMutation = useMutation({
        mutationFn: async () => {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_BASE_URL}/api/orders/${orderData?.orderId}/decline`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }
            });
            if (!res.ok) throw new Error('Failed to decline');
            return res.json();
        },
        onSuccess: () => {
            toast.info('Order declined');
            onOpenChange(false);
        },
        onError: () => {
            toast.error('Failed to decline order');
        }
    });

    const inTransitMutation = useMutation({
        mutationFn: async () => {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_BASE_URL}/api/orders/${orderData?.orderId}/intransit`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }
            });
            if (!res.ok) throw new Error('Failed');
            return res.json();
        },
        onSuccess: () => {
            toast.success('Order marked as In Transit');
            onOpenChange(false);
        },
        onError: () => {
            toast.error('Failed to update status');
        }
    });

    if (!orderData) return null;

    const customerFirstName = orderData.customer?.name?.split(' ')[0] || 'Customer';

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent className="w-[400px] sm:w-[540px]">
                <SheetHeader>
                    <SheetTitle>New Order Assignment</SheetTitle>
                    <SheetDescription>
                        Review and accept or decline this order
                    </SheetDescription>
                </SheetHeader>

                <div className="space-y-6 mt-6">
                    <div className="flex items-center gap-2">
                        <User className="h-5 w-5 text-muted-foreground" />
                        <span className="font-medium">{customerFirstName}</span>
                        <Badge variant={orderData.orderType === 'cod' ? 'destructive' : 'secondary'}>
                            {orderData.orderType === 'cod' ? 'COD' : 'Prepaid'}
                        </Badge>
                    </div>

                    <Separator />

                    <div className="space-y-4">
                        <div>
                            <p className="text-sm text-muted-foreground mb-1">Pickup Address</p>
                            <div className="flex items-start gap-2">
                                <MapPin className="h-4 w-4 text-green-600 mt-1" />
                                <p className="text-sm">{orderData.pickup?.address || orderData.pickup}</p>
                            </div>
                            <p className="text-sm text-muted-foreground ml-6">{orderData.pickup?.city}</p>
                        </div>

                        <div>
                            <p className="text-sm text-muted-foreground mb-1">Delivery Address</p>
                            <div className="flex items-start gap-2">
                                <MapPin className="h-4 w-4 text-red-600 mt-1" />
                                <p className="text-sm">{orderData.delivery?.address || orderData.delivery}</p>
                            </div>
                            <p className="text-sm text-muted-foreground ml-6">{orderData.delivery?.city}</p>
                        </div>
                    </div>

                    <Separator />

                    <div className="flex items-center gap-6">
                        <div className="flex items-center gap-2">
                            <Weight className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">{orderData.weight || 1} kg</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <DollarSign className="h-4 w-4 text-green-600" />
                            <span className="font-semibold">₹{(orderData.orderValue || 0).toLocaleString()}</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 text-yellow-600">
                        <Clock className="h-4 w-4" />
                        <span className="text-sm">You have 5 minutes to respond</span>
                    </div>

                    <Separator />

                    {showInTransit ? (
                        <Button 
                            className="w-full bg-orange-600 hover:bg-orange-700"
                            onClick={() => inTransitMutation.mutate()}
                            disabled={inTransitMutation.isPending}
                        >
                            {inTransitMutation.isPending ? 'Updating...' : 'Mark as In Transit'}
                        </Button>
                    ) : (
                        <div className="flex gap-3">
                            <Button 
                                variant="destructive"
                                className="flex-1"
                                onClick={() => declineMutation.mutate()}
                                disabled={declineMutation.isPending}
                            >
                                {declineMutation.isPending ? 'Declining...' : 'Decline Order'}
                            </Button>
                            <Button 
                                className="flex-1 bg-green-600 hover:bg-green-700"
                                onClick={() => acceptMutation.mutate()}
                                disabled={acceptMutation.isPending}
                            >
                                {acceptMutation.isPending ? 'Accepting...' : 'Accept Order'}
                            </Button>
                        </div>
                    )}
                </div>
            </SheetContent>
        </Sheet>
    );
}