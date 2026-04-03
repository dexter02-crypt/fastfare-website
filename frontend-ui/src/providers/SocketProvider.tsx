import React, { createContext, useContext, useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useQueryClient } from '@tanstack/react-query';
import { API_BASE_URL } from '@/config';
import { toast } from 'sonner';
import { authApi } from '@/lib/api';

interface SocketContextType {
    socket: Socket | null;
}

const SocketContext = createContext<SocketContextType>({ socket: null });

export const useSocket = () => useContext(SocketContext);

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const socketRef = useRef<Socket | null>(null);
    const queryClient = useQueryClient();

    useEffect(() => {
        const socket = io(API_BASE_URL, {
            transports: ['websocket', 'polling'],
        });

        socketRef.current = socket;

        socket.on('connect', () => {
            console.log('Global socket connected');
            socket.emit('join_dashboard');
            
            // Join specific role rooms
            const user = authApi.getCurrentUser();
            if (user) {
                socket.emit('join_user', { userId: user._id || user.id });
                if (user.role === 'shipment_partner') {
                    socket.emit('join_partner', { partnerId: user._id || user.id });
                }
            }
        });

        // Handle global real-time cache invalidation and toasts
        socket.on('shipment_update', (data) => {
            queryClient.invalidateQueries({ queryKey: ['shipments'] });
            queryClient.invalidateQueries({ queryKey: ['dashboard_stats'] });
            queryClient.invalidateQueries({ queryKey: ['wms_reports'] });
            queryClient.invalidateQueries({ queryKey: ['user-metrics'] });
        });

        socket.on('new_shipment', (data) => {
            queryClient.invalidateQueries({ queryKey: ['shipments'] });
            queryClient.invalidateQueries({ queryKey: ['dashboard_stats'] });
        });

        socket.on('shipment_status_updated', (data) => {
            queryClient.invalidateQueries({ queryKey: ['shipments'] });
            toast.info(`Shipment status updated`);
        });

        socket.on('shipment_accepted', (data) => {
            queryClient.invalidateQueries({ queryKey: ['shipments'] });
            toast.success(`Shipment ${data.awb} has been accepted!`);
        });

        socket.on('shipment_in_transit', (data) => {
            queryClient.invalidateQueries({ queryKey: ['shipments'] });
            toast.info(`Shipment ${data.awb} is now in transit.`);
        });

        socket.on('notification_received', (data) => {
            queryClient.invalidateQueries({ queryKey: ['notifications'] });
            toast.success(data.message || 'New notification received');
        });

        socket.on('settlement_update', (data) => {
            queryClient.invalidateQueries({ queryKey: ['settlements'] });
            queryClient.invalidateQueries({ queryKey: ['reports'] });
        });

        socket.on('wms_update', (data) => {
            queryClient.invalidateQueries({ queryKey: ['wms_inventory'] });
            queryClient.invalidateQueries({ queryKey: ['wms_inbound'] });
            queryClient.invalidateQueries({ queryKey: ['wms_returns'] });
            queryClient.invalidateQueries({ queryKey: ['wms_reports'] });
        });

        return () => {
            socket.disconnect();
        };
    }, [queryClient]);

    return (
        <SocketContext.Provider value={{ socket: socketRef.current }}>
            {children}
        </SocketContext.Provider>
    );
};
