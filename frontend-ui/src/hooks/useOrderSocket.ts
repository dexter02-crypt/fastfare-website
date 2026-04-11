import { useEffect, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { io, Socket } from 'socket.io-client';
import { API_BASE_URL } from '@/config';
import { toast } from 'sonner';

interface OrderSocketPayload {
  orderId: string;
  partnerName?: string;
  timestamp?: Date;
  status?: string;
  orderStage?: string;
  userId?: string;
  partnerId?: string;
}

export function useOrderSocket(userId: string, role: 'user' | 'partner' | 'admin') {
  const queryClient = useQueryClient();

  const handleOrderAccepted = useCallback((data: OrderSocketPayload) => {
    toast.success(`Your order #${data.orderId} has been accepted by ${data.partnerName}`);
    queryClient.invalidateQueries({ queryKey: ['orders'] });
    queryClient.invalidateQueries({ queryKey: ['orders-summary'] });
    queryClient.invalidateQueries({ queryKey: ['orders-recent'] });
  }, [queryClient]);

  const handleOrderDeclined = useCallback((data: OrderSocketPayload) => {
    toast.info(`Your order #${data.orderId} was declined. You can reassign it.`);
    queryClient.invalidateQueries({ queryKey: ['orders'] });
    queryClient.invalidateQueries({ queryKey: ['orders-summary'] });
    queryClient.invalidateQueries({ queryKey: ['orders-recent'] });
  }, [queryClient]);

  const handleOrderAutoDeclined = useCallback((data: OrderSocketPayload) => {
    toast.warning(`No response received. Order #${data.orderId} auto-declined.`);
    queryClient.invalidateQueries({ queryKey: ['orders'] });
    queryClient.invalidateQueries({ queryKey: ['orders-summary'] });
    queryClient.invalidateQueries({ queryKey: ['orders-recent'] });
  }, [queryClient]);

  const handleOrderInTransit = useCallback((data: OrderSocketPayload) => {
    toast.info(`Your order #${data.orderId} is now In Transit`);
    queryClient.invalidateQueries({ queryKey: ['orders'] });
    queryClient.invalidateQueries({ queryKey: ['orders-summary'] });
    queryClient.invalidateQueries({ queryKey: ['orders-recent'] });
  }, [queryClient]);

  const handleStageUpdated = useCallback((data: OrderSocketPayload) => {
    toast.info(`Order #${data.orderId} status updated to ${data.orderStage}`);
    queryClient.invalidateQueries({ queryKey: ['orders'] });
    queryClient.invalidateQueries({ queryKey: ['orders-summary'] });
    queryClient.invalidateQueries({ queryKey: ['orders-recent'] });
  }, [queryClient]);

  const handleNewAssignment = useCallback((data: OrderSocketPayload) => {
    toast.success(`New order assignment received for order #${data.orderId}`);
    queryClient.invalidateQueries({ queryKey: ['partner-orders'] });
  }, [queryClient]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;

    const socket: Socket = io(API_BASE_URL, {
      auth: { token },
      transports: ['websocket'],
      autoConnect: true
    });

    socket.on('connect', () => {
      console.log('Socket connected');
      if (role === 'user') {
        socket.emit('join', `user:${userId}`);
      } else if (role === 'partner') {
        socket.emit('join', `partner:${userId}`);
      } else if (role === 'admin') {
        socket.emit('join', `admin:${userId}`);
      }
    });

    socket.on('order:accepted', handleOrderAccepted);
    socket.on('order:declined', handleOrderDeclined);
    socket.on('order:auto_declined', handleOrderAutoDeclined);
    socket.on('order:in_transit', handleOrderInTransit);
    socket.on('order:stage_updated', handleStageUpdated);
    socket.on('order:new_assignment', handleNewAssignment);

    socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
    });

    return () => {
      socket.disconnect();
    };
  }, [userId, role, handleOrderAccepted, handleOrderDeclined, handleOrderAutoDeclined, handleOrderInTransit, handleStageUpdated, handleNewAssignment]);
}