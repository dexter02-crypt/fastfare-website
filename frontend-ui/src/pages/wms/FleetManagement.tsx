import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import DashboardLayout from '../../components/DashboardLayout';
import { wmsApi } from '../../lib/api';
import { Truck, Users, Map, Plus, Search, Loader2, Trash2, Edit2, X, CheckCircle, Navigation } from 'lucide-react';

const FleetManagement = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const activeTab = searchParams.get('tab') || 'vehicles';
    const [vehicles, setVehicles] = useState<any[]>([]);
    const [drivers, setDrivers] = useState<any[]>([]);
    const [trips, setTrips] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [showModal, setShowModal] = useState<string | null>(null);
    const [success, setSuccess] = useState('');
    const [form, setForm] = useState<any>({});

    const fetchAll = async () => {
        setLoading(true);
        try {
            const [v, d, t] = await Promise.all([wmsApi.getVehicles(), wmsApi.getDrivers(), wmsApi.getTrips()]);
            setVehicles(v); setDrivers(d); setTrips(t);
        } catch (err) { console.error(err); }
        setLoading(false);
    };

    useEffect(() => { fetchAll(); }, []);

    const showSuccessMsg = (msg: string) => { setSuccess(msg); setTimeout(() => setSuccess(''), 3000); };

    const handleAddVehicle = async () => {
        try {
            await wmsApi.addVehicle(form);
            showSuccessMsg('Vehicle added'); setShowModal(null); setForm({}); fetchAll();
        } catch (err: any) { alert(err.message); }
    };

    const handleAddDriver = async () => {
        try {
            await wmsApi.addDriver(form);
            showSuccessMsg('Driver added'); setShowModal(null); setForm({}); fetchAll();
        } catch (err: any) { alert(err.message); }
    };

    const handleDispatch = async () => {
        try {
            await wmsApi.createTrip(form);
            showSuccessMsg('Trip dispatched'); setShowModal(null); setForm({}); fetchAll();
        } catch (err: any) { alert(err.message); }
    };

    const getStatusColor = (status: string) => {
        const colors: any = { active: 'bg-green-100 text-green-800', maintenance: 'bg-yellow-100 text-yellow-800', retired: 'bg-gray-100 text-gray-800', on_trip: 'bg-blue-100 text-blue-800', on_leave: 'bg-orange-100 text-orange-800', scheduled: 'bg-purple-100 text-purple-800', in_transit: 'bg-cyan-100 text-cyan-800', completed: 'bg-green-100 text-green-800' };
        return colors[status] || 'bg-gray-100 text-gray-800';
    };

    const tabs = [
        { id: 'vehicles', label: 'Vehicles', icon: Truck, count: vehicles.length },
        { id: 'drivers', label: 'Drivers', icon: Users, count: drivers.length },
        { id: 'trips', label: 'Trips', icon: Map, count: trips.length },
    ];

    return (
        <DashboardLayout>
            <div className="space-y-6 flex-1 h-full p-2">
                {success && (
                    <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg flex items-center gap-2">
                        <CheckCircle className="h-4 w-4" /> {success}
                    </div>
                )}

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold">Fleet Management</h1>
                        <p className="text-muted-foreground">Manage vehicles, drivers, and dispatch trips</p>
                    </div>
                    <button onClick={() => setShowModal(activeTab === 'trips' ? 'dispatch' : activeTab === 'drivers' ? 'driver' : 'vehicle')}
                        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors">
                        <Plus className="h-4 w-4" /> Add {activeTab === 'trips' ? 'Trip' : activeTab === 'drivers' ? 'Driver' : 'Vehicle'}
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex gap-1 p-1 bg-muted rounded-lg w-fit">
                    {tabs.map((tab) => (
                        <button key={tab.id} onClick={() => setSearchParams({ tab: tab.id })}
                            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === tab.id ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}>
                            <tab.icon className="h-4 w-4" /> {tab.label}
                            <span className="text-xs bg-muted-foreground/10 px-1.5 py-0.5 rounded-full">{tab.count}</span>
                        </button>
                    ))}
                </div>

                {/* Search */}
                <div className="relative max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <input type="text" placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
                </div>

                {loading ? (
                    <div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
                ) : (
                    <div className="grid gap-4">
                        {activeTab === 'vehicles' && vehicles.filter(v => !search || v.numberPlate?.toLowerCase().includes(search.toLowerCase())).map((v) => (
                            <div key={v._id} className="flex items-center justify-between p-4 rounded-xl border bg-card hover:shadow-sm transition-shadow">
                                <div className="flex items-center gap-4">
                                    <div className="h-10 w-10 rounded-lg bg-blue-50 flex items-center justify-center"><Truck className="h-5 w-5 text-blue-600" /></div>
                                    <div>
                                        <p className="font-medium">{v.numberPlate}</p>
                                        <p className="text-sm text-muted-foreground">{v.type} • {v.chassisNumber}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${getStatusColor(v.status)}`}>{v.status}</span>
                                    <button onClick={() => wmsApi.deleteVehicle(v._id).then(fetchAll)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg"><Trash2 className="h-4 w-4" /></button>
                                </div>
                            </div>
                        ))}

                        {activeTab === 'drivers' && drivers.filter(d => !search || d.name?.toLowerCase().includes(search.toLowerCase())).map((d) => (
                            <div key={d._id} className="flex items-center justify-between p-4 rounded-xl border bg-card hover:shadow-sm transition-shadow">
                                <div className="flex items-center gap-4">
                                    <div className="h-10 w-10 rounded-full bg-emerald-50 flex items-center justify-center"><Users className="h-5 w-5 text-emerald-600" /></div>
                                    <div>
                                        <p className="font-medium">{d.name}</p>
                                        <p className="text-sm text-muted-foreground">{d.driverId} • {d.phone}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${getStatusColor(d.status)}`}>{d.status}</span>
                                    <button onClick={() => wmsApi.deleteDriver(d._id).then(fetchAll)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg"><Trash2 className="h-4 w-4" /></button>
                                </div>
                            </div>
                        ))}

                        {activeTab === 'trips' && trips.filter(t => !search || t.tripId?.toLowerCase().includes(search.toLowerCase())).map((t) => (
                            <div key={t._id} className="flex items-center justify-between p-4 rounded-xl border bg-card hover:shadow-sm transition-shadow">
                                <div className="flex items-center gap-4">
                                    <div className="h-10 w-10 rounded-lg bg-purple-50 flex items-center justify-center"><Navigation className="h-5 w-5 text-purple-600" /></div>
                                    <div>
                                        <p className="font-medium">{t.tripId}</p>
                                        <p className="text-sm text-muted-foreground">{t.route?.origin} → {t.route?.destination}</p>
                                        <p className="text-xs text-muted-foreground">{t.vehicleId?.numberPlate} • {t.driverId?.name}</p>
                                    </div>
                                </div>
                                <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${getStatusColor(t.status)}`}>{t.status}</span>
                            </div>
                        ))}

                        {((activeTab === 'vehicles' && vehicles.length === 0) || (activeTab === 'drivers' && drivers.length === 0) || (activeTab === 'trips' && trips.length === 0)) && (
                            <div className="text-center py-16 text-muted-foreground">
                                <p className="text-lg font-medium">No {activeTab} found</p>
                                <p className="text-sm mt-1">Add your first {activeTab.slice(0, -1)} to get started</p>
                            </div>
                        )}
                    </div>
                )}

                {/* Modals */}
                {showModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowModal(null)}>
                        <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 m-4" onClick={(e) => e.stopPropagation()}>
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-lg font-semibold">
                                    {showModal === 'vehicle' ? 'Add Vehicle' : showModal === 'driver' ? 'Add Driver' : 'Dispatch Trip'}
                                </h2>
                                <button onClick={() => setShowModal(null)} className="p-2 hover:bg-gray-100 rounded-full"><X className="h-5 w-5" /></button>
                            </div>

                            {showModal === 'vehicle' && (
                                <div className="space-y-4">
                                    <input placeholder="Number Plate *" className="w-full px-4 py-2.5 border rounded-lg text-sm" onChange={(e) => setForm({ ...form, numberPlate: e.target.value })} />
                                    <input placeholder="Chassis Number *" className="w-full px-4 py-2.5 border rounded-lg text-sm" onChange={(e) => setForm({ ...form, chassisNumber: e.target.value })} />
                                    <select className="w-full px-4 py-2.5 border rounded-lg text-sm" onChange={(e) => setForm({ ...form, type: e.target.value })}>
                                        <option value="">Select Type *</option>
                                        <option value="truck">Truck</option><option value="van">Van</option>
                                        <option value="bike">Bike</option><option value="tempo">Tempo</option>
                                    </select>
                                    <input placeholder="Capacity (kg)" type="number" className="w-full px-4 py-2.5 border rounded-lg text-sm" onChange={(e) => setForm({ ...form, capacity: e.target.value })} />
                                    <button onClick={handleAddVehicle} className="w-full py-2.5 bg-primary text-white rounded-lg font-medium hover:bg-primary/90">Add Vehicle</button>
                                </div>
                            )}

                            {showModal === 'driver' && (
                                <div className="space-y-4">
                                    <input placeholder="Full Name *" className="w-full px-4 py-2.5 border rounded-lg text-sm" onChange={(e) => setForm({ ...form, name: e.target.value })} />
                                    <input placeholder="Phone *" className="w-full px-4 py-2.5 border rounded-lg text-sm" onChange={(e) => setForm({ ...form, phone: e.target.value })} />
                                    <input placeholder="Email *" className="w-full px-4 py-2.5 border rounded-lg text-sm" onChange={(e) => setForm({ ...form, email: e.target.value })} />
                                    <input placeholder="Password" type="password" className="w-full px-4 py-2.5 border rounded-lg text-sm" onChange={(e) => setForm({ ...form, password: e.target.value })} />
                                    <input placeholder="License Number *" className="w-full px-4 py-2.5 border rounded-lg text-sm" onChange={(e) => setForm({ ...form, licenseNumber: e.target.value })} />
                                    <input placeholder="License Expiry" type="date" className="w-full px-4 py-2.5 border rounded-lg text-sm" onChange={(e) => setForm({ ...form, licenseExpiry: e.target.value })} />
                                    <button onClick={handleAddDriver} className="w-full py-2.5 bg-primary text-white rounded-lg font-medium hover:bg-primary/90">Add Driver</button>
                                </div>
                            )}

                            {showModal === 'dispatch' && (
                                <div className="space-y-4">
                                    <select className="w-full px-4 py-2.5 border rounded-lg text-sm" onChange={(e) => setForm({ ...form, vehicleId: e.target.value })}>
                                        <option value="">Select Vehicle *</option>
                                        {vehicles.filter(v => v.status === 'active').map(v => <option key={v._id} value={v._id}>{v.numberPlate} ({v.type})</option>)}
                                    </select>
                                    <select className="w-full px-4 py-2.5 border rounded-lg text-sm" onChange={(e) => setForm({ ...form, driverId: e.target.value })}>
                                        <option value="">Select Driver *</option>
                                        {drivers.filter(d => d.status === 'active').map(d => <option key={d._id} value={d._id}>{d.name} ({d.driverId})</option>)}
                                    </select>
                                    <input placeholder="Origin *" className="w-full px-4 py-2.5 border rounded-lg text-sm" onChange={(e) => setForm({ ...form, origin: e.target.value })} />
                                    <input placeholder="Destination *" className="w-full px-4 py-2.5 border rounded-lg text-sm" onChange={(e) => setForm({ ...form, destination: e.target.value })} />
                                    <button onClick={handleDispatch} className="w-full py-2.5 bg-primary text-white rounded-lg font-medium hover:bg-primary/90">Dispatch Trip</button>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
};

export default FleetManagement;
