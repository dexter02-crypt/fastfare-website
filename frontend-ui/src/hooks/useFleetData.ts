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

// Demo data for the map when no real drivers are connected
const demoDrivers: Driver[] = [
  {
    id: "402",
    name: "Rajesh Kumar",
    vehicle: "Tata Ace Gold",
    location: "Andheri West, Mumbai",
    status: "Online",
    eta: "4 mins away",
    lat: 19.1364,
    lng: 72.8296,
    speed: "45 km/h",
    heading: 90,
    lastUpdated: new Date().toISOString(),
    phone: "+91 98765 43210",
    fuelLevel: 85,
  },
  {
    id: "110",
    name: "Suresh Patel",
    vehicle: "Mahindra Bolero Pickup",
    location: "NH-48, Gurugram",
    status: "On Trip",
    eta: "Delhi → Jaipur",
    lat: 28.4595,
    lng: 77.0266,
    speed: "80 km/h",
    heading: 180,
    lastUpdated: new Date().toISOString(),
    phone: "+91 87654 32109",
    fuelLevel: 60,
  },
  {
    id: "205",
    name: "Amit Singh",
    vehicle: "Ashok Leyland Dost+",
    location: "Whitefield Hub, Bangalore",
    status: "Idle",
    eta: "At Warehouse",
    lat: 12.9698,
    lng: 77.7500,
    speed: "0 km/h",
    heading: 0,
    lastUpdated: new Date().toISOString(),
    phone: "+91 76543 21098",
    fuelLevel: 92,
  },
  {
    id: "301",
    name: "Vijay Sharma",
    vehicle: "Eicher Pro 1049",
    location: "Offline",
    status: "Offline",
    eta: "Last seen 2h ago",
    lat: 13.0827,
    lng: 80.2707,
    speed: "0 km/h",
    heading: 0,
    lastUpdated: new Date(Date.now() - 7200000).toISOString(),
    phone: "+91 65432 10987",
    fuelLevel: 45,
  },
  {
    id: "502",
    name: "Pradeep Yadav",
    vehicle: "Tata 407 LPT",
    location: "Ring Road, Hyderabad",
    status: "On Trip",
    eta: "Hyderabad → Vijayawada",
    lat: 17.3850,
    lng: 78.4867,
    speed: "72 km/h",
    heading: 120,
    lastUpdated: new Date().toISOString(),
    phone: "+91 54321 09876",
    fuelLevel: 55,
  },
  {
    id: "603",
    name: "Mohammad Irfan",
    vehicle: "BharatBenz 1617",
    location: "JNPT Port, Navi Mumbai",
    status: "Online",
    eta: "Loading at Port",
    lat: 18.9500,
    lng: 72.9500,
    speed: "0 km/h",
    heading: 45,
    lastUpdated: new Date().toISOString(),
    phone: "+91 43210 98765",
    fuelLevel: 78,
  },
  {
    id: "704",
    name: "Ravi Verma",
    vehicle: "Force Traveller Van",
    location: "Sector 62, Noida",
    status: "On Trip",
    eta: "Noida → Lucknow",
    lat: 28.6270,
    lng: 77.3654,
    speed: "65 km/h",
    heading: 90,
    lastUpdated: new Date().toISOString(),
    phone: "+91 32109 87654",
    fuelLevel: 42,
  },
  {
    id: "805",
    name: "Karthik Reddy",
    vehicle: "Tata Prima 4025",
    location: "Pune-Mumbai Expressway",
    status: "On Trip",
    eta: "Pune → Mumbai",
    lat: 18.7962,
    lng: 73.4094,
    speed: "85 km/h",
    heading: 270,
    lastUpdated: new Date().toISOString(),
    phone: "+91 21098 76543",
    fuelLevel: 68,
  },
  {
    id: "906",
    name: "Sanjay Gupta",
    vehicle: "Mahindra Blazo",
    location: "GT Karnal Road, Delhi",
    status: "Idle",
    eta: "Waiting for Load",
    lat: 28.7529,
    lng: 77.1174,
    speed: "0 km/h",
    heading: 0,
    lastUpdated: new Date().toISOString(),
    phone: "+91 10987 65432",
    fuelLevel: 95,
  },
  {
    id: "107",
    name: "Arun Nair",
    vehicle: "Volvo FH16",
    location: "Cochin Port",
    status: "Online",
    eta: "Container Loading",
    lat: 9.9312,
    lng: 76.2673,
    speed: "0 km/h",
    heading: 180,
    lastUpdated: new Date().toISOString(),
    phone: "+91 09876 54321",
    fuelLevel: 82,
  },
];

export const useFleetData = () => {
  const [drivers, setDrivers] = useState<Driver[]>(demoDrivers);
  const socketRef = useRef<Socket | null>(null);
  const liveDriversRef = useRef<Map<string, Driver>>(new Map());

  // ─── Socket.io integration for REAL driver locations ───
  useEffect(() => {
    const socket = io(API_BASE_URL, {
      transports: ['websocket', 'polling'],
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('🔌 Fleet tracking connected to backend');
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

    // Also fetch initial positions via REST
    fetch(`${API_BASE_URL}/api/driver-locations`)
      .then(res => res.json())
      .then(data => {
        if (data.drivers && data.drivers.length > 0) {
          data.drivers.forEach((pos: any) => addOrUpdateLiveDriver(pos));
          mergeDrivers();
        }
      })
      .catch(err => console.log('Could not fetch initial driver positions:', err));

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
    setDrivers(prev => {
      // Start with live drivers at the top, then demo drivers
      const liveDriverList = Array.from(liveDriversRef.current.values());

      // Filter out demo drivers whose IDs match a live driver (unlikely but safe)
      const filteredDemo = demoDrivers.filter(
        d => !liveDriversRef.current.has(d.id)
      );

      return [...liveDriverList, ...filteredDemo];
    });
  };

  // Demo simulation — only animate demo drivers, not live ones
  useEffect(() => {
    const interval = setInterval(() => {
      setDrivers((currentDrivers) =>
        currentDrivers.map((driver) => {
          // Skip live drivers and non-moving drivers
          if (driver.isLive || driver.status === "Offline" || driver.status === "Idle")
            return driver;

          const latChange = (Math.random() - 0.5) * 0.001;
          const lngChange = (Math.random() - 0.5) * 0.001;
          const heading = Math.atan2(lngChange, latChange) * (180 / Math.PI);
          const currentSpeed = parseInt(driver.speed);
          const newSpeed = Math.max(0, Math.min(120, currentSpeed + (Math.random() - 0.5) * 10));

          return {
            ...driver,
            lat: driver.lat + latChange,
            lng: driver.lng + lngChange,
            heading: (heading + 360) % 360,
            speed: `${Math.round(newSpeed)} km/h`,
            lastUpdated: new Date().toISOString(),
            fuelLevel: Math.max(0, driver.fuelLevel - 0.05),
          };
        }),
      );
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  return { drivers };
};
