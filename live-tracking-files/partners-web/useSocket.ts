'use client';

import { useEffect, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { API_CONFIG } from './api';

let socket: Socket | null = null;

export const useSocket = () => {
    const [isConnected, setIsConnected] = useState(false);
    const [driverLocations, setDriverLocations] = useState<Map<string, any>>(new Map());

    useEffect(() => {
        // Connect to PC WMS Socket.io server
        if (!socket) {
            socket = io(API_CONFIG.SOCKET_URL, {
                transports: ['websocket', 'polling'],
                reconnection: true,
                reconnectionAttempts: 5,
            });
        }

        socket.on('connect', () => {
            console.log('Connected to PC WMS Socket');
            setIsConnected(true);
        });

        socket.on('disconnect', () => {
            console.log('Disconnected from PC WMS Socket');
            setIsConnected(false);
        });

        // Listen for driver location updates
        socket.on('driver_location_update', (data) => {
            console.log('Driver location update:', data);
            setDriverLocations(prev => {
                const updated = new Map(prev);
                updated.set(data.trackingId || data.driverId, data);
                return updated;
            });
        });

        // Also listen for general location updates
        socket.on('locationUpdate', (data) => {
            console.log('Location update:', data);
            setDriverLocations(prev => {
                const updated = new Map(prev);
                updated.set(data.trackingId || 'unknown', data);
                return updated;
            });
        });

        // Driver status updates
        socket.on('driver_status_update', (data) => {
            console.log('Driver status:', data);
        });

        return () => {
            // Don't disconnect on unmount, keep connection alive
        };
    }, []);

    const joinTracking = useCallback((trackingId: string) => {
        if (socket?.connected) {
            socket.emit('join_tracking', trackingId);
            console.log('Joined tracking:', trackingId);
        }
    }, []);

    const disconnect = useCallback(() => {
        socket?.disconnect();
        socket = null;
        setIsConnected(false);
    }, []);

    return {
        isConnected,
        driverLocations,
        joinTracking,
        disconnect,
    };
};

export default useSocket;
