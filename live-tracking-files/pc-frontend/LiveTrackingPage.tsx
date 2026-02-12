import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Phone, MessageSquare, Navigation, MapPin, Clock, Truck, RefreshCw, Package } from 'lucide-react';

// Animated Truck SVG Component
const TruckIcon = ({ rotation = 0 }: { rotation?: number }) => (
    <div
        className="relative"
        style={{
            transform: `rotate(${rotation}deg)`,
            transition: 'transform 0.5s ease-out'
        }}
    >
        <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center shadow-lg border-4 border-white animate-pulse">
            <Truck size={24} className="text-white" />
        </div>
        {/* Pulse ring effect */}
        <div className="absolute inset-0 rounded-full bg-blue-500 animate-ping opacity-30" />
    </div>
);

// Mock route coordinates (simulating a delivery path)
const routeCoordinates = [
    { lat: 12.9716, lng: 77.5946 },
    { lat: 12.9720, lng: 77.5950 },
    { lat: 12.9730, lng: 77.5960 },
    { lat: 12.9750, lng: 77.5970 },
    { lat: 12.9780, lng: 77.5990 },
    { lat: 12.9800, lng: 77.6010 },
    { lat: 12.9820, lng: 77.6030 },
    { lat: 12.9850, lng: 77.6050 },
];

const destinationCoord = { lat: 12.9850, lng: 77.6050 };

const LiveTrackingPage = () => {
    const navigate = useNavigate();
    const [truckPosition, setTruckPosition] = useState(routeCoordinates[0]);
    const [currentStep, setCurrentStep] = useState(0);
    const [eta, setEta] = useState('8 mins');
    const [distance, setDistance] = useState('2.4 km');
    const [isLive, setIsLive] = useState(true);
    const [rotation, setRotation] = useState(45);
    const mapRef = useRef<HTMLDivElement>(null);

    // Simulate real-time truck movement
    useEffect(() => {
        if (!isLive) return;

        const interval = setInterval(() => {
            setCurrentStep(prev => {
                const next = (prev + 1) % routeCoordinates.length;
                const newPos = routeCoordinates[next];
                const oldPos = routeCoordinates[prev];

                // Calculate rotation angle
                const angle = Math.atan2(
                    newPos.lng - oldPos.lng,
                    newPos.lat - oldPos.lat
                ) * (180 / Math.PI);

                setRotation(90 - angle);
                setTruckPosition(newPos);

                // Update ETA and distance
                const remaining = routeCoordinates.length - next;
                setEta(`${remaining} mins`);
                setDistance(`${(remaining * 0.3).toFixed(1)} km`);

                return next;
            });
        }, 2000);

        return () => clearInterval(interval);
    }, [isLive]);

    // Calculate truck position on the visual map
    const getTruckMapPosition = () => {
        const progress = currentStep / (routeCoordinates.length - 1);
        return {
            left: `${15 + progress * 70}%`,
            top: `${70 - progress * 50}%`
        };
    };

    return (
        <div className="h-full flex flex-col bg-gray-100 rounded-xl overflow-hidden">
            {/* Header */}
            <div className="bg-white border-b border-gray-200 p-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate(-1)}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        <ArrowLeft size={20} className="text-gray-600" />
                    </button>
                    <div>
                        <h1 className="text-xl font-bold text-gray-800">Live Tracking</h1>
                        <p className="text-sm text-gray-500">Trip #TRP-20260130-001</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full ${isLive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                        <span className={`w-2 h-2 rounded-full ${isLive ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`} />
                        <span className="text-sm font-medium">{isLive ? 'LIVE' : 'PAUSED'}</span>
                    </div>
                    <button
                        onClick={() => setIsLive(!isLive)}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        <RefreshCw size={18} className={`text-gray-600 ${isLive ? 'animate-spin' : ''}`} style={{ animationDuration: '3s' }} />
                    </button>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex">
                {/* Map Area */}
                <div className="flex-1 relative" ref={mapRef}>
                    {/* Simulated Map Background */}
                    <div className="absolute inset-0 bg-gradient-to-br from-green-50 via-gray-100 to-blue-50">
                        {/* Grid pattern for map feel */}
                        <div className="absolute inset-0" style={{
                            backgroundImage: `
                                linear-gradient(rgba(0,0,0,0.03) 1px, transparent 1px),
                                linear-gradient(90deg, rgba(0,0,0,0.03) 1px, transparent 1px)
                            `,
                            backgroundSize: '40px 40px'
                        }} />

                        {/* Roads simulation */}
                        <svg className="absolute inset-0 w-full h-full">
                            {/* Main road */}
                            <path
                                d="M 100 400 Q 200 350 300 280 Q 400 200 500 150 Q 600 100 700 80"
                                fill="none"
                                stroke="#d1d5db"
                                strokeWidth="20"
                                strokeLinecap="round"
                            />
                            {/* Route path (dark) */}
                            <path
                                d="M 100 400 Q 200 350 300 280 Q 400 200 500 150 Q 600 100 700 80"
                                fill="none"
                                stroke="#1f2937"
                                strokeWidth="4"
                                strokeLinecap="round"
                                strokeDasharray="10,5"
                                className="animate-dash"
                            />
                        </svg>

                        {/* Origin Marker */}
                        <div className="absolute left-[10%] bottom-[20%] transform -translate-x-1/2">
                            <div className="relative">
                                <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center shadow-lg border-4 border-white">
                                    <Package size={18} className="text-white" />
                                </div>
                                <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap bg-white px-2 py-1 rounded shadow text-xs font-medium">
                                    Warehouse
                                </div>
                            </div>
                        </div>

                        {/* Destination Marker */}
                        <div className="absolute right-[15%] top-[15%] transform -translate-x-1/2">
                            <div className="relative">
                                <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center shadow-lg border-4 border-white">
                                    <MapPin size={18} className="text-white" />
                                </div>
                                <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap bg-white px-2 py-1 rounded shadow text-xs font-medium">
                                    Delivery Point
                                </div>
                                {/* Pulse effect for destination */}
                                <div className="absolute inset-0 rounded-full bg-green-400 animate-ping opacity-30" />
                            </div>
                        </div>

                        {/* Animated Truck */}
                        <div
                            className="absolute transform -translate-x-1/2 -translate-y-1/2 transition-all duration-1000 ease-linear z-10"
                            style={getTruckMapPosition()}
                        >
                            <TruckIcon rotation={rotation} />
                            {/* Distance label */}
                            <div className="absolute -top-12 left-1/2 -translate-x-1/2 whitespace-nowrap bg-gray-900 text-white px-3 py-1.5 rounded-lg shadow-lg text-sm font-bold">
                                {distance} away
                                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 w-2 h-2 bg-gray-900 rotate-45" />
                            </div>
                        </div>
                    </div>

                    {/* Map Controls */}
                    <div className="absolute right-4 top-4 flex flex-col gap-2">
                        <button className="w-10 h-10 bg-white rounded-lg shadow-md flex items-center justify-center hover:bg-gray-50 transition-colors">
                            <Navigation size={18} className="text-blue-600" />
                        </button>
                    </div>
                </div>

                {/* Info Panel */}
                <div className="w-80 bg-white border-l border-gray-200 flex flex-col">
                    {/* Driver Info */}
                    <div className="p-4 border-b border-gray-100">
                        <div className="flex items-center gap-3">
                            <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white text-xl font-bold">
                                RS
                            </div>
                            <div className="flex-1">
                                <h3 className="font-bold text-gray-800">Rajesh Sharma</h3>
                                <p className="text-sm text-gray-500">Vehicle: KA-01-HH-1234</p>
                                <div className="flex items-center gap-1 mt-1">
                                    <span className="text-yellow-500">★★★★★</span>
                                    <span className="text-xs text-gray-400">4.9</span>
                                </div>
                            </div>
                        </div>
                        <div className="flex gap-2 mt-4">
                            <button className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors font-medium">
                                <Phone size={16} />
                                Call
                            </button>
                            <button className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-gray-50 text-gray-600 rounded-lg hover:bg-gray-100 transition-colors font-medium">
                                <MessageSquare size={16} />
                                Message
                            </button>
                        </div>
                    </div>

                    {/* Trip Details */}
                    <div className="p-4 border-b border-gray-100">
                        <h4 className="font-semibold text-gray-800 mb-3">Trip Details</h4>
                        <div className="space-y-3">
                            <div className="flex items-start gap-3">
                                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                    <Package size={16} className="text-blue-600" />
                                </div>
                                <div>
                                    <p className="text-xs text-gray-400">PICKUP</p>
                                    <p className="text-sm font-medium text-gray-700">FastFare Warehouse, HSR Layout</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                    <MapPin size={16} className="text-green-600" />
                                </div>
                                <div>
                                    <p className="text-xs text-gray-400">DELIVERY</p>
                                    <p className="text-sm font-medium text-gray-700">123 MG Road, Bangalore</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* ETA Card */}
                    <div className="p-4 bg-gradient-to-r from-blue-500 to-blue-600 m-4 rounded-xl text-white">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-blue-100 text-sm">Estimated Arrival</p>
                                <p className="text-3xl font-bold">{eta}</p>
                            </div>
                            <div className="w-14 h-14 bg-white/20 rounded-full flex items-center justify-center">
                                <Clock size={28} className="text-white" />
                            </div>
                        </div>
                        <div className="mt-3 pt-3 border-t border-white/20 flex justify-between text-sm">
                            <span className="text-blue-100">Distance Remaining</span>
                            <span className="font-semibold">{distance}</span>
                        </div>
                    </div>

                    {/* Status Timeline */}
                    <div className="p-4 flex-1 overflow-auto">
                        <h4 className="font-semibold text-gray-800 mb-3">Status Updates</h4>
                        <div className="space-y-4">
                            {[
                                { time: '10:30 AM', status: 'Package picked up', done: true },
                                { time: '10:35 AM', status: 'Left warehouse', done: true },
                                { time: '10:45 AM', status: 'In transit', done: true, current: true },
                                { time: '10:55 AM', status: 'Arriving soon', done: false },
                                { time: '11:00 AM', status: 'Delivered', done: false },
                            ].map((item, idx) => (
                                <div key={idx} className="flex gap-3">
                                    <div className="flex flex-col items-center">
                                        <div className={`w-3 h-3 rounded-full ${item.done ? 'bg-green-500' : 'bg-gray-300'} ${item.current ? 'ring-4 ring-green-100' : ''}`} />
                                        {idx < 4 && <div className={`w-0.5 h-6 ${item.done ? 'bg-green-500' : 'bg-gray-200'}`} />}
                                    </div>
                                    <div className="flex-1 -mt-0.5">
                                        <p className={`text-sm font-medium ${item.current ? 'text-green-600' : item.done ? 'text-gray-700' : 'text-gray-400'}`}>
                                            {item.status}
                                        </p>
                                        <p className="text-xs text-gray-400">{item.time}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* CSS for animations */}
            <style>{`
                @keyframes dash {
                    to {
                        stroke-dashoffset: -30;
                    }
                }
                .animate-dash {
                    animation: dash 1s linear infinite;
                }
            `}</style>
        </div>
    );
};

export default LiveTrackingPage;
