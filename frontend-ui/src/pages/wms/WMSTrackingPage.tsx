import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import { wmsApi } from '../../lib/api';
import { MapPin, Loader2, RefreshCw, Navigation, Clock, Truck } from 'lucide-react';

const WMSTrackingPage = () => {
    const [sessions, setSessions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selected, setSelected] = useState<any>(null);

    useEffect(() => { fetchSessions(); }, []);

    const fetchSessions = async () => {
        setLoading(true);
        try {
            const data = await wmsApi.getTrackingSessions();
            setSessions(data.sessions || []);
        } catch (err) { console.error(err); }
        setLoading(false);
    };

    return (
        <DashboardLayout>
            <div className="space-y-6 flex-1 h-full p-2">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold">Live Tracking</h1>
                        <p className="text-muted-foreground">{sessions.length} active tracking sessions</p>
                    </div>
                    <button onClick={fetchSessions} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border font-medium hover:bg-muted transition-colors text-sm">
                        <RefreshCw className="h-4 w-4" /> Refresh
                    </button>
                </div>

                {loading ? (
                    <div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
                ) : sessions.length === 0 ? (
                    <div className="text-center py-16 text-muted-foreground">
                        <MapPin className="h-12 w-12 mx-auto mb-3 opacity-40" />
                        <p className="text-lg font-medium">No active tracking sessions</p>
                        <p className="text-sm mt-1">Driver locations will appear here when they share their location</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Tracking list */}
                        <div className="lg:col-span-1 space-y-3">
                            {sessions.map((session, i) => (
                                <button key={i} onClick={() => setSelected(session)}
                                    className={`w-full text-left p-4 rounded-xl border transition-all hover:shadow-sm ${selected?.trackingId === session.trackingId ? 'border-primary bg-primary/5 shadow-sm' : 'bg-card'}`}>
                                    <div className="flex items-center gap-3">
                                        <div className="h-10 w-10 rounded-lg bg-cyan-50 flex items-center justify-center">
                                            <Navigation className="h-5 w-5 text-cyan-600" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-medium truncate">{session.trackingId}</p>
                                            <p className="text-xs text-muted-foreground">Driver: {session.driverId || 'Unknown'}</p>
                                        </div>
                                        <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                                    </div>
                                </button>
                            ))}
                        </div>

                        {/* Map placeholder / Details */}
                        <div className="lg:col-span-2">
                            {selected ? (
                                <div className="rounded-xl border bg-card p-6">
                                    <h3 className="font-semibold text-lg mb-4">Tracking: {selected.trackingId}</h3>
                                    <div className="grid grid-cols-2 gap-4 mb-6">
                                        <div className="p-3 rounded-lg bg-muted/50">
                                            <p className="text-xs text-muted-foreground">Latitude</p>
                                            <p className="font-mono font-medium">{selected.lat?.toFixed(6)}</p>
                                        </div>
                                        <div className="p-3 rounded-lg bg-muted/50">
                                            <p className="text-xs text-muted-foreground">Longitude</p>
                                            <p className="font-mono font-medium">{selected.lng?.toFixed(6)}</p>
                                        </div>
                                        <div className="p-3 rounded-lg bg-muted/50">
                                            <p className="text-xs text-muted-foreground flex items-center gap-1"><Truck className="h-3 w-3" /> Speed</p>
                                            <p className="font-medium">{selected.speed || 0} km/h</p>
                                        </div>
                                        <div className="p-3 rounded-lg bg-muted/50">
                                            <p className="text-xs text-muted-foreground flex items-center gap-1"><Clock className="h-3 w-3" /> Last Update</p>
                                            <p className="font-medium text-sm">{selected.timestamp ? new Date(selected.timestamp).toLocaleTimeString() : 'N/A'}</p>
                                        </div>
                                    </div>
                                    {/* Map embed */}
                                    <div className="rounded-lg overflow-hidden border aspect-video bg-gradient-to-br from-blue-50 to-cyan-50 flex items-center justify-center">
                                        <div className="text-center">
                                            <MapPin className="h-10 w-10 mx-auto mb-2 text-primary animate-bounce" />
                                            <p className="text-sm text-muted-foreground">Live location: {selected.lat?.toFixed(4)}, {selected.lng?.toFixed(4)}</p>
                                            <a href={`https://www.google.com/maps?q=${selected.lat},${selected.lng}`} target="_blank" rel="noopener noreferrer"
                                                className="inline-block mt-3 px-4 py-2 bg-primary text-white text-sm rounded-lg hover:bg-primary/90">
                                                Open in Google Maps
                                            </a>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="rounded-xl border bg-card p-6 flex items-center justify-center aspect-video text-muted-foreground">
                                    <div className="text-center">
                                        <Navigation className="h-10 w-10 mx-auto mb-3 opacity-40" />
                                        <p>Select a tracking session to view details</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
};

export default WMSTrackingPage;
