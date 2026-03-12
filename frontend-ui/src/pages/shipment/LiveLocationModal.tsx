import React, { useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const BACKEND_URL = import.meta.env.VITE_SOCKET_URL || import.meta.env.VITE_API_URL || 'http://localhost:3000';

interface LiveLocationModalProps {
    shipmentId: string;
    driverId: string;
    driverName: string;
    onClose: () => void;
}

const LiveLocationModal: React.FC<LiveLocationModalProps> = ({ shipmentId, driverId, driverName, onClose }) => {
    const [driverLocation, setDriverLocation] = useState<{ lat: number, lng: number, speed: number } | null>(null);
    const [isOnline, setIsOnline] = useState(false);
    const [lastUpdated, setLastUpdated] = useState<string>('');
    const socketRef = useRef<any>(null);
    const markerRef = useRef<any>(null);
    const mapRef = useRef<any>(null);

    useEffect(() => {
        const token = localStorage.getItem('token');
        socketRef.current = io(BACKEND_URL, {
            auth: { token },
            transports: ['websocket', 'polling'],
        });

        socketRef.current.on('connect', () => {
            socketRef.current.emit('join:fleet-room');
            socketRef.current.emit('join:shipment-room', { shipmentId });
            // Request current stored location of this driver immediately
            socketRef.current.emit('get:driver-location', { driverId });
        });

        socketRef.current.on('driver:current-location', (data: any) => {
            if (data.driverId === driverId && data.lat) {
                setDriverLocation({ lat: data.lat, lng: data.lng, speed: data.speed || 0 });
                setIsOnline(true);
                setLastUpdated(new Date().toLocaleTimeString('en-IN'));
            }
        });

        socketRef.current.on('driver:location', (data: any) => {
            if (data.driverId === driverId) {
                setDriverLocation({ lat: data.lat, lng: data.lng, speed: data.speed || 0 });
                setIsOnline(true);
                setLastUpdated(new Date().toLocaleTimeString('en-IN'));
                // Smoothly pan map to new position
                if (mapRef.current) {
                    mapRef.current.panTo([data.lat, data.lng]);
                }
                // Update marker position
                if (markerRef.current) {
                    markerRef.current.setLatLng([data.lat, data.lng]);
                }
            }
        });

        return () => socketRef.current?.disconnect();
    }, [driverId, shipmentId]);

    return (
        <div style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)',
            zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '16px'
        }}>
            <div style={{
                background: 'white', borderRadius: '16px',
                width: '100%', maxWidth: '680px',
                boxShadow: '0 25px 50px rgba(0,0,0,0.3)', overflow: 'hidden'
            }}>
                {/* Header */}
                <div style={{
                    padding: '16px 20px', borderBottom: '1px solid #e5e7eb',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    background: '#1e40af', color: 'white'
                }}>
                    <div>
                        <h3 style={{ margin: 0, fontWeight: 700, fontSize: '16px' }}>
                            📍 Live Location — {driverName}
                        </h3>
                        <p style={{ margin: '4px 0 0', fontSize: '12px', opacity: 0.85 }}>
                            AWB: {shipmentId} &nbsp;•&nbsp;
                            <span style={{ color: isOnline ? '#86efac' : '#fca5a5' }}>
                                {isOnline ? '● Online' : '○ Waiting for signal...'}
                            </span>
                            {lastUpdated && ` • Updated: ${lastUpdated}`}
                        </p>
                    </div>
                    <button onClick={onClose} style={{
                        background: 'rgba(255,255,255,0.2)', border: 'none',
                        color: 'white', width: '32px', height: '32px',
                        borderRadius: '50%', fontSize: '18px', cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}>×</button>
                </div>

                {/* Map */}
                <div style={{ height: '400px', position: 'relative' }}>
                    {driverLocation ? (
                        <MapContainer
                            center={[driverLocation.lat, driverLocation.lng]}
                            zoom={14}
                            style={{ height: '100%', width: '100%' }}
                            ref={mapRef}
                        >
                            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                            <Marker
                                position={[driverLocation.lat, driverLocation.lng]}
                                ref={markerRef}
                                icon={L.divIcon({
                                    html: `<div style="background:#2563eb;color:white;padding:6px 12px;border-radius:20px;font-size:12px;font-weight:700;white-space:nowrap;box-shadow:0 2px 8px rgba(0,0,0,0.3)">🚚 ${driverName}</div>`,
                                    className: '',
                                    iconAnchor: [40, 20],
                                })}
                            >
                                <Popup>
                                    <b>{driverName}</b><br />
                                    Speed: {driverLocation.speed} km/h<br />
                                    Last updated: {lastUpdated}
                                </Popup>
                            </Marker>
                        </MapContainer>
                    ) : (
                        <div style={{
                            height: '100%', display: 'flex', flexDirection: 'column',
                            alignItems: 'center', justifyContent: 'center',
                            background: '#f8fafc', color: '#6b7280'
                        }}>
                            <div style={{ fontSize: '40px', marginBottom: '12px' }}>📡</div>
                            <p style={{ fontWeight: 600, margin: 0 }}>Waiting for driver location...</p>
                            <p style={{ fontSize: '13px', marginTop: '6px' }}>
                                The driver must be On Duty in their app to share location.
                            </p>
                        </div>
                    )}
                </div>

                {/* Footer with live stats */}
                {driverLocation && (
                    <div style={{
                        padding: '12px 20px', background: '#f8fafc',
                        borderTop: '1px solid #e5e7eb',
                        display: 'flex', gap: '24px', alignItems: 'center'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{ fontSize: '18px' }}>⚡</span>
                            <div>
                                <p style={{ margin: 0, fontSize: '11px', color: '#6b7280' }}>Speed</p>
                                <p style={{ margin: 0, fontWeight: 700, fontSize: '14px' }}>
                                    {driverLocation.speed || 0} km/h
                                </p>
                            </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{ fontSize: '18px' }}>🕐</span>
                            <div>
                                <p style={{ margin: 0, fontSize: '11px', color: '#6b7280' }}>Last Updated</p>
                                <p style={{ margin: 0, fontWeight: 700, fontSize: '14px' }}>{lastUpdated}</p>
                            </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{ fontSize: '18px' }}>👤</span>
                            <div>
                                <p style={{ margin: 0, fontSize: '11px', color: '#6b7280' }}>Driver</p>
                                <p style={{ margin: 0, fontWeight: 700, fontSize: '14px' }}>{driverName}</p>
                            </div>
                        </div>
                        <button
                            onClick={() => socketRef.current?.emit('get:driver-location', { driverId })}
                            style={{
                                marginLeft: 'auto', padding: '8px 14px',
                                background: '#2563eb', color: 'white',
                                border: 'none', borderRadius: '8px',
                                fontSize: '12px', fontWeight: 600, cursor: 'pointer'
                            }}
                        >
                            🔄 Refresh
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default LiveLocationModal;
