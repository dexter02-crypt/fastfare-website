import { useState, useEffect, useRef } from "react";
import { io, Socket } from "socket.io-client";
import { API_BASE_URL } from "@/config";

export interface Driver {
  id: string;
  name: string;
  vehicle: string;
  location: string;
  status: "Online" | "On Trip" | "Idle" | "Offline";
  eta: string;
  lat: number;
  lng: number;
  speed: string;
  heading: number;
  lastUpdated: string;
  phone: string;
  fuelLevel: number;
  isLive?: boolean; // true = real device, false = demo
}

// No demo data — only real connected drivers are shown

export const useFleetData = () => {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const socketRef = useRef<Socket | null>(null);
  const liveDriversRef = useRef<Map<string, Driver>>(new Map());

  // ─── Socket.io integration for REAL driver locations ───
  useEffect(() => {
    const socket = io(API_BASE_URL, {
      transports: ['websocket', 'polling'],
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      socket.emit('join_dashboard');
    });

    // Receive all current positions on join
    socket.on('all_driver_positions', (positions: any[]) => {
      if (!positions || positions.length === 0) return;
      positions.forEach(pos => addOrUpdateLiveDriver(pos));
      mergeDrivers();
    });

    // Receive real-time location updates
    socket.on('locationUpdate', (data: any) => {
      if (data && data.driverId && data.lat != null && data.lng != null) {
        addOrUpdateLiveDriver(data);
        mergeDrivers();
      }
    });

    socket.on('driver_location_update', (data: any) => {
      if (data && data.driverId && data.lat != null && data.lng != null) {
        addOrUpdateLiveDriver(data);
        mergeDrivers();
      }
    });

    // Driver stopped tracking — remove from map
    socket.on('driver_went_offline', (data: any) => {
      if (data && data.driverId) {
        liveDriversRef.current.delete(data.driverId);
        mergeDrivers();
      }
    });

    // Also fetch initial positions via REST
    fetch(`${API_BASE_URL}/api/driver-locations`)
      .then(res => res.json())
      .then(data => {
        if (data.drivers && data.drivers.length > 0) {
          data.drivers.forEach((pos: any) => addOrUpdateLiveDriver(pos));
          mergeDrivers();
        }
      })
      .catch(() => { /* Initial fetch failed — will rely on socket */ });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, []);

  const addOrUpdateLiveDriver = (data: any) => {
    const prev = liveDriversRef.current.get(data.driverId);
    const prevLat = prev?.lat ?? data.lat;
    const prevLng = prev?.lng ?? data.lng;

    // Calculate heading from movement
    const heading = Math.atan2(
      data.lng - prevLng,
      data.lat - prevLat
    ) * (180 / Math.PI);

    const liveDriver: Driver = {
      id: data.driverId,
      name: data.driverName || data.driverId,
      vehicle: prev?.vehicle || "FastFare Driver",
      location: `${data.lat.toFixed(4)}°, ${data.lng.toFixed(4)}°`,
      status: "Online",
      eta: "Live Tracking",
      lat: data.lat,
      lng: data.lng,
      speed: prev ? `${Math.round(
        Math.sqrt(Math.pow(data.lat - prevLat, 2) + Math.pow(data.lng - prevLng, 2)) * 111000 / 10
      )} km/h` : "0 km/h",
      heading: (data.lat !== prevLat || data.lng !== prevLng) ? (heading + 360) % 360 : (prev?.heading ?? 0),
      lastUpdated: new Date(data.timestamp || Date.now()).toISOString(),
      phone: prev?.phone || "N/A",
      fuelLevel: prev?.fuelLevel ?? 100,
      isLive: true,
    };

    liveDriversRef.current.set(data.driverId, liveDriver);
  };

  const mergeDrivers = () => {
    setDrivers(Array.from(liveDriversRef.current.values()));
  };



  return { drivers };
};
