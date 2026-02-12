
import { useState, useCallback } from "react";
import { GoogleMap, useJsApiLoader, Marker, InfoWindow } from "@react-google-maps/api";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
    MapPin, Truck, Search, Plus, Minus, Maximize,
    Info, Star, MoreVertical, Fuel, Gauge, Phone, Clock, Navigation, Calendar, User, MapPinned
} from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useFleetData, Driver } from "../../hooks/useFleetData";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";

// Map Styles
const containerStyle = {
    width: '100%',
    height: '100%'
};

const center = {
    lat: 40.7128,
    lng: -74.0060
};

const FleetTracking = () => {
    const { drivers } = useFleetData();
    const [selectedDriverId, setSelectedDriverId] = useState<string | null>(null);
    const [filter, setFilter] = useState("All");
    const [searchQuery, setSearchQuery] = useState("");
    const [map, setMap] = useState<google.maps.Map | null>(null);
    const [detailsOpen, setDetailsOpen] = useState(false);
    const [detailDriver, setDetailDriver] = useState<Driver | null>(null);

    const { isLoaded, loadError } = useJsApiLoader({
        id: 'google-map-script',
        googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || ''
    });

    const onLoad = useCallback(function callback(map: google.maps.Map) {
        setMap(map);
    }, []);

    const onUnmount = useCallback(function callback(map: google.maps.Map) {
        setMap(null);
    }, []);

    const selectedDriver = drivers.find(d => d.id === selectedDriverId);
    
    // ... existing filter logic ...
    const filteredDrivers = drivers.filter(d => {
        const matchesStatus = filter === "All" || d.status === filter;
        const matchesSearch = d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            d.vehicle.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesStatus && matchesSearch;
    });

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'Online': return 'bg-green-100 text-green-700';
            case 'On Trip': return 'bg-blue-100 text-blue-700';
            case 'Idle': return 'bg-orange-100 text-orange-700';
            default: return 'bg-gray-100 text-gray-400';
        }
    };

    const handleDriverClick = (driver: Driver) => {
        setSelectedDriverId(driver.id);
        if (map) {
            map.panTo({ lat: driver.lat, lng: driver.lng });
            map.setZoom(14);
        }
    };
    
    if (loadError) {
        return <div>Map cannot be loaded</div>
    }

    return (
        <DashboardLayout>
            <div className="flex flex-col lg:flex-row h-[calc(100vh-80px)] -m-4 lg:-m-6">
                {/* Sidebar Driver List */}
                <div className="w-full lg:w-80 h-1/3 lg:h-full border-b lg:border-b-0 lg:border-r bg-white flex flex-col z-10 order-2 lg:order-1">
                    <div className="p-4 border-b">
                        <h2 className="font-bold text-lg mb-4">Drivers</h2>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <Input
                                placeholder="Search drivers..."
                                className="pl-9 bg-gray-50"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>

                        <div className="flex gap-2 mt-4 text-sm overflow-x-auto pb-2 lg:pb-0">
                            {['All', 'Online', 'On Trip'].map(f => (
                                <button
                                    key={f}
                                    onClick={() => setFilter(f)}
                                    className={`px-3 py-1 rounded-full text-xs font-medium transition-colors whitespace-nowrap ${filter === f ? 'bg-gray-900 text-white' : 'text-gray-500 hover:bg-gray-100'}`}
                                >
                                    {f}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto">
                        {filteredDrivers.map(driver => (
                            <div
                                key={driver.id}
                                onClick={() => handleDriverClick(driver)}
                                className={`p-4 border-b cursor-pointer hover:bg-gray-50 transition-colors ${selectedDriverId === driver.id ? 'bg-blue-50/50 border-l-4 border-l-blue-600' : ''}`}
                            >
                                <div className="flex items-center gap-3">
                                    <Avatar className="h-10 w-10">
                                        <AvatarImage src={`https://i.pravatar.cc/150?u=${driver.id}`} />
                                        <AvatarFallback>{driver.name.charAt(0)}</AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-start">
                                            <h3 className="font-semibold text-sm truncate">{driver.name}</h3>
                                            <Badge variant="secondary" className={`text-[10px] px-1.5 py-0 ${getStatusColor(driver.status)}`}>
                                                {driver.status.toUpperCase()}
                                            </Badge>
                                        </div>
                                        <p className="text-xs text-gray-500 mt-0.5">{driver.vehicle}</p>
                                        
                                        {/* New Metadata in List */}
                                        <div className="flex items-center gap-3 mt-1.5">
                                            <div className="flex items-center text-[10px] text-gray-500 gap-1">
                                                <Gauge className="h-3 w-3" />
                                                <span>{driver.speed}</span>
                                            </div>
                                            <div className="flex items-center text-[10px] text-gray-500 gap-1">
                                                <Fuel className="h-3 w-3" />
                                                <span>{driver.fuelLevel.toFixed(0)}%</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Map Area */}
                <div className="flex-1 h-2/3 lg:h-full relative bg-gray-100 order-1 lg:order-2">
                    {/* Map Stats Overlay */}
                    <div className="absolute top-4 left-4 z-10 bg-white/95 backdrop-blur rounded-xl shadow-sm border p-3 lg:p-4 flex gap-3 lg:gap-6 overflow-x-auto max-w-[calc(100%-32px)]">
                        <div>
                            <p className="text-[10px] lg:text-xs text-gray-500 uppercase font-bold tracking-wider">Total</p>
                            <p className="text-lg lg:text-2xl font-bold">{drivers.length}</p>
                        </div>
                        <div>
                            <p className="text-[10px] lg:text-xs text-green-600 uppercase font-bold tracking-wider">Active</p>
                            <p className="text-lg lg:text-2xl font-bold text-green-600">{drivers.filter(d => d.status === 'Online').length}</p>
                        </div>
                        <div>
                            <p className="text-[10px] lg:text-xs text-orange-500 uppercase font-bold tracking-wider">Idle</p>
                            <p className="text-lg lg:text-2xl font-bold text-orange-500">{drivers.filter(d => d.status === 'Idle').length}</p>
                        </div>
                    </div>

                    {/* Google Map */}
                    <div className="w-full h-full relative">
                        {isLoaded ? (
                            <GoogleMap
                                mapContainerStyle={containerStyle}
                                center={center}
                                zoom={10}
                                onLoad={onLoad}
                                onUnmount={onUnmount}
                                options={{
                                    fullscreenControl: false,
                                    streetViewControl: false,
                                    mapTypeControl: false
                                }}
                            >
                                {drivers.filter(d => d.status !== 'Offline').map(driver => (
                                    <Marker
                                        key={driver.id}
                                        position={{ lat: driver.lat, lng: driver.lng }}
                                        onClick={() => setSelectedDriverId(driver.id)}
                                        icon={{
                                            path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
                                            scale: 6,
                                            fillColor: driver.status === 'Online' ? '#22c55e' : driver.status === 'On Trip' ? '#3b82f6' : '#f97316',
                                            fillOpacity: 1,
                                            strokeWeight: 1,
                                            rotation: driver.heading
                                        }}
                                    />
                                ))}

                                {selectedDriver && (
                                    <InfoWindow
                                        position={{ lat: selectedDriver.lat, lng: selectedDriver.lng }}
                                        onCloseClick={() => setSelectedDriverId(null)}
                                    >
                                        <div className="p-2 min-w-[200px]">
                                            <h3 className="font-bold text-sm mb-1">{selectedDriver.name}</h3>
                                            <p className="text-xs text-gray-500 mb-2">{selectedDriver.vehicle}</p>
                                            
                                            <div className="grid grid-cols-2 gap-2 text-xs">
                                                <div className="flex items-center gap-1">
                                                    <Gauge className="h-3 w-3 text-gray-400" />
                                                    <span>{selectedDriver.speed}</span>
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <Fuel className="h-3 w-3 text-gray-400" />
                                                    <span>{selectedDriver.fuelLevel.toFixed(0)}%</span>
                                                </div>
                                                <div className="col-span-2 text-gray-400">
                                                    Heading: {selectedDriver.heading.toFixed(0)}°
                                                </div>
                                            </div>
                                            
                                            <div className="mt-2 pt-2 border-t flex justify-end">
                                                <Button 
                                                    size="sm" 
                                                    className="h-6 text-xs" 
                                                    variant="outline"
                                                    onClick={() => {
                                                        setDetailDriver(selectedDriver);
                                                        setDetailsOpen(true);
                                                    }}
                                                >
                                                    View Details
                                                </Button>
                                            </div>
                                        </div>
                                    </InfoWindow>
                                )}
                            </GoogleMap>
                        ) : (
                            <div className="w-full h-full flex items-center justify-center bg-gray-100 text-gray-400">
                                Loading Map...
                            </div>
                        )}
                    </div>

                    {/* Bottom Panel - Driver Performance (Desktop Only) */}
                    <div className="hidden lg:block absolute bottom-0 left-0 right-0 bg-white border-t p-4 z-10 max-h-64 overflow-auto">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="font-bold text-gray-900">Driver Performance</h3>
                            <Button variant="ghost" className="text-blue-600 text-sm h-8">View Full Report</Button>
                        </div>
                        <table className="w-full text-sm">
                            <thead className="text-xs text-gray-500 bg-gray-50 uppercase tracking-wider">
                                <tr>
                                    <th className="px-4 py-2 text-left font-medium">Driver Name</th>
                                    <th className="px-4 py-2 text-left font-medium">Vehicle ID</th>
                                    <th className="px-4 py-2 text-left font-medium">Speed</th> {/* New Column */}
                                    <th className="px-4 py-2 text-left font-medium">Fuel</th> {/* New Column */}
                                    <th className="px-4 py-2 text-left font-medium">Status</th>
                                    <th className="px-4 py-2 text-left font-medium">Last Updated</th> {/* Updated Column */}
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {filteredDrivers.map(driver => (
                                    <tr 
                                        key={driver.id} 
                                        className={`hover:bg-gray-50/50 cursor-pointer ${selectedDriverId === driver.id ? 'bg-blue-50/50' : ''}`}
                                        onClick={() => handleDriverClick(driver)}
                                    >
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-2">
                                                <Avatar className="h-6 w-6">
                                                    <AvatarImage src={`https://i.pravatar.cc/150?u=${driver.id}`} />
                                                    <AvatarFallback>{driver.name.charAt(0)}</AvatarFallback>
                                                </Avatar>
                                                <span className="font-medium text-gray-900">{driver.name}</span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-gray-600">
                                            {driver.vehicle}
                                        </td>
                                        {/* New Columns Data */}
                                        <td className="px-4 py-3 font-mono text-xs">{driver.speed}</td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-2">
                                                <div className="w-16 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                                                    <div 
                                                        className={`h-full ${driver.fuelLevel > 20 ? 'bg-green-500' : 'bg-red-500'}`} 
                                                        style={{ width: `${driver.fuelLevel}%` }}
                                                    />
                                                </div>
                                                <span className="text-xs text-gray-500">{driver.fuelLevel.toFixed(0)}%</span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(driver.status)}`}>
                                                ● {driver.status}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-gray-500 text-xs">
                                            {new Date(driver.lastUpdated).toLocaleTimeString()}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
            
            {/* Driver Details Dialog */}
            <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-3">
                            <Avatar className="h-12 w-12">
                                <AvatarImage src={`https://i.pravatar.cc/150?u=${detailDriver?.id}`} />
                                <AvatarFallback>{detailDriver?.name.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <div>
                                <span className="text-lg">{detailDriver?.name}</span>
                                <Badge variant="secondary" className={`ml-2 text-xs ${getStatusColor(detailDriver?.status || '')}`}>
                                    {detailDriver?.status?.toUpperCase()}
                                </Badge>
                            </div>
                        </DialogTitle>
                        <DialogDescription>Driver ID: {detailDriver?.id}</DialogDescription>
                    </DialogHeader>
                    
                    <div className="mt-4 space-y-4">
                        {/* Vehicle Info */}
                        <div className="bg-gray-50 rounded-lg p-4">
                            <h4 className="font-semibold text-sm mb-3 flex items-center gap-2">
                                <Truck className="h-4 w-4 text-primary" /> Vehicle Information
                            </h4>
                            <div className="grid grid-cols-2 gap-3 text-sm">
                                <div>
                                    <p className="text-gray-500 text-xs">Vehicle</p>
                                    <p className="font-medium">{detailDriver?.vehicle}</p>
                                </div>
                                <div>
                                    <p className="text-gray-500 text-xs">Location</p>
                                    <p className="font-medium">{detailDriver?.location}</p>
                                </div>
                            </div>
                        </div>
                        
                        <Separator />
                        
                        {/* Live Stats */}
                        <div>
                            <h4 className="font-semibold text-sm mb-3 flex items-center gap-2">
                                <Gauge className="h-4 w-4 text-primary" /> Live Stats
                            </h4>
                            <div className="grid grid-cols-3 gap-4">
                                <div className="text-center p-3 bg-blue-50 rounded-lg">
                                    <Gauge className="h-5 w-5 mx-auto text-blue-600 mb-1" />
                                    <p className="text-lg font-bold text-blue-600">{detailDriver?.speed}</p>
                                    <p className="text-xs text-gray-500">Speed</p>
                                </div>
                                <div className="text-center p-3 bg-green-50 rounded-lg">
                                    <Fuel className="h-5 w-5 mx-auto text-green-600 mb-1" />
                                    <p className="text-lg font-bold text-green-600">{detailDriver?.fuelLevel.toFixed(0)}%</p>
                                    <p className="text-xs text-gray-500">Fuel</p>
                                </div>
                                <div className="text-center p-3 bg-purple-50 rounded-lg">
                                    <Navigation className="h-5 w-5 mx-auto text-purple-600 mb-1" />
                                    <p className="text-lg font-bold text-purple-600">{detailDriver?.heading.toFixed(0)}°</p>
                                    <p className="text-xs text-gray-500">Heading</p>
                                </div>
                            </div>
                        </div>
                        
                        <Separator />
                        
                        {/* Contact & Location */}
                        <div>
                            <h4 className="font-semibold text-sm mb-3 flex items-center gap-2">
                                <User className="h-4 w-4 text-primary" /> Contact & Location
                            </h4>
                            <div className="space-y-2 text-sm">
                                <div className="flex items-center gap-3 p-2 bg-gray-50 rounded">
                                    <Phone className="h-4 w-4 text-gray-400" />
                                    <span>{detailDriver?.phone}</span>
                                </div>
                                <div className="flex items-center gap-3 p-2 bg-gray-50 rounded">
                                    <MapPinned className="h-4 w-4 text-gray-400" />
                                    <span>Lat: {detailDriver?.lat.toFixed(4)}, Lng: {detailDriver?.lng.toFixed(4)}</span>
                                </div>
                                <div className="flex items-center gap-3 p-2 bg-gray-50 rounded">
                                    <Clock className="h-4 w-4 text-gray-400" />
                                    <span>Last Updated: {detailDriver ? new Date(detailDriver.lastUpdated).toLocaleString() : 'N/A'}</span>
                                </div>
                            </div>
                        </div>
                        
                        {/* ETA Info */}
                        <div className="flex items-center justify-between p-3 bg-primary/5 rounded-lg border border-primary/20">
                            <div className="flex items-center gap-2">
                                <Calendar className="h-4 w-4 text-primary" />
                                <span className="text-sm font-medium">ETA</span>
                            </div>
                            <span className="font-bold text-primary">{detailDriver?.eta}</span>
                        </div>
                        
                        {/* Action Buttons */}
                        <div className="flex gap-2 pt-2">
                            <Button className="flex-1" variant="outline" onClick={() => window.open(`tel:${detailDriver?.phone}`)}>
                                <Phone className="h-4 w-4 mr-2" /> Call Driver
                            </Button>
                            <Button className="flex-1" onClick={() => {
                                if (detailDriver && map) {
                                    map.panTo({ lat: detailDriver.lat, lng: detailDriver.lng });
                                    map.setZoom(16);
                                    setDetailsOpen(false);
                                }
                            }}>
                                <MapPin className="h-4 w-4 mr-2" /> Track on Map
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </DashboardLayout>
    );
};

export default FleetTracking;
