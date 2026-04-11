import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { API_BASE_URL } from '@/config';
import { toast } from 'sonner';

interface OrderStatusSelectorProps {
  orderId: string;
  currentStatus: string;
  onStatusUpdated?: (newStatus: string) => void;
  disabled?: boolean;
}

const STATUS_OPTIONS = [
  { value: 'Accepted', label: 'Accepted', color: 'bg-blue-100 text-blue-700' },
  { value: 'in_transit', label: 'In Transit', color: 'bg-orange-100 text-orange-700' },
  { value: 'shipped', label: 'Shipped', color: 'bg-purple-100 text-purple-700' },
  { value: 'out_for_delivery', label: 'Out for Delivery', color: 'bg-indigo-100 text-indigo-700' },
  { value: 'delivered', label: 'Delivered', color: 'bg-green-100 text-green-700' },
  { value: 'failed_delivery', label: 'Failed Delivery', color: 'bg-red-100 text-red-700' },
  { value: 'returned', label: 'Returned', color: 'bg-gray-100 text-gray-700' }
];

export function OrderStatusSelector({ orderId, currentStatus, onStatusUpdated, disabled }: OrderStatusSelectorProps) {
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState('');

  const statusMutation = useMutation({
    mutationFn: async (newStatus: string) => {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE_URL}/api/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });
      if (!res.ok) {
        throw new Error('Failed to update status');
      }
      return res.json();
    },
    onSuccess: () => {
      toast.success('Status updated and customer notified via email');
      setIsConfirmOpen(false);
      onStatusUpdated?.(selectedStatus);
    },
    onError: () => {
      toast.error('Status update failed. Please try again.');
    }
  });

  const handleStatusChange = (value: string) => {
    if (value === currentStatus) return;
    setSelectedStatus(value);
    setIsConfirmOpen(true);
  };

  const handleConfirm = () => {
    statusMutation.mutate(selectedStatus);
  };

  const handleCancel = () => {
    setIsConfirmOpen(false);
    setSelectedStatus('');
  };

  return (
    <>
      <Select value={currentStatus} onValueChange={handleStatusChange} disabled={disabled || statusMutation.isPending}>
        <SelectTrigger className="w-[160px]">
          <SelectValue placeholder="Update status" />
        </SelectTrigger>
        <SelectContent>
          {STATUS_OPTIONS.map((status) => (
            <SelectItem key={status.value} value={status.value}>
              <span className={`px-2 py-1 rounded ${status.color}`}>{status.label}</span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Dialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Status Update</DialogTitle>
            <DialogDescription>
              Update order #{orderId} status to {selectedStatus}? An email notification will be sent to the customer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={handleCancel}>
              Cancel
            </Button>
            <Button onClick={handleConfirm} disabled={statusMutation.isPending}>
                {statusMutation.isPending ? 'Updating...' : 'Confirm'}
              </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}