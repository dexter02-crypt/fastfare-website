import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import { wmsApi } from '../../lib/api';
import { Container, Clock, CheckCircle, Plus, Loader2, X, Package, Truck } from 'lucide-react';

const InboundPage = () => {
    const [shipments, setShipments] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [success, setSuccess] = useState('');
    const [form, setForm] = useState<any>({ items: [{ sku: '', name: '', expectedQty: 1 }] });

    useEffect(() => { fetchData(); }, []);

    const fetchData = async () => {
        setLoading(true);
        try { setShipments(await wmsApi.getInboundShipments()); } catch (err) { console.error(err); }
        setLoading(false);
    };

    const handleCreate = async () => {
        try {
            await wmsApi.createInbound(form);
            setSuccess('ASN created'); setTimeout(() => setSuccess(''), 3000);
            setShowModal(false); setForm({ items: [{ sku: '', name: '', expectedQty: 1 }] });
            fetchData();
        } catch (err: any) { alert(err.message); }
    };

    const handleReceive = async (id: string) => {
        try {
            await wmsApi.updateInboundStatus(id, 'received');
            setSuccess('Shipment received'); setTimeout(() => setSuccess(''), 3000);
            fetchData();
        } catch (err: any) { alert(err.message); }
    };

    const getStatusColor = (status: string) => {
        const colors: any = { expected: 'bg-blue-100 text-blue-800', arrived: 'bg-amber-100 text-amber-800', processing: 'bg-purple-100 text-purple-800', received: 'bg-green-100 text-green-800', cancelled: 'bg-red-100 text-red-800' };
        return colors[status] || 'bg-gray-100 text-gray-800';
    };

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
                        <h1 className="text-2xl font-bold">Inbound Receiving</h1>
                        <p className="text-muted-foreground">{shipments.length} shipments • {shipments.filter(s => s.status === 'expected').length} expected</p>
                    </div>
                    <button onClick={() => setShowModal(true)}
                        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors text-sm">
                        <Plus className="h-4 w-4" /> Create ASN
                    </button>
                </div>

                {loading ? (
                    <div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
                ) : shipments.length === 0 ? (
                    <div className="text-center py-16 text-muted-foreground">
                        <Container className="h-12 w-12 mx-auto mb-3 opacity-40" />
                        <p className="text-lg font-medium">No inbound shipments</p>
                        <p className="text-sm mt-1">Create an ASN to start tracking inbound shipments</p>
                    </div>
                ) : (
                    <div className="grid gap-4">
                        {shipments.map((s) => (
                            <div key={s._id} className="p-4 rounded-xl border bg-card hover:shadow-sm transition-shadow">
                                <div className="flex items-start justify-between">
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2">
                                            <p className="font-medium">{s.shipmentId}</p>
                                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(s.status)}`}>{s.status}</span>
                                        </div>
                                        <p className="text-sm text-muted-foreground">Provider: {s.provider}</p>
                                        <div className="flex items-center gap-4 text-xs text-muted-foreground mt-2">
                                            <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> Expected: {new Date(s.expectedArrival).toLocaleDateString()}</span>
                                            <span className="flex items-center gap-1"><Package className="h-3 w-3" /> {s.items?.length || 0} items</span>
                                            {s.vehicleId?.numberPlate && <span className="flex items-center gap-1"><Truck className="h-3 w-3" /> {s.vehicleId.numberPlate}</span>}
                                        </div>
                                    </div>
                                    {s.status !== 'received' && s.status !== 'cancelled' && (
                                        <button onClick={() => handleReceive(s._id)}
                                            className="px-3 py-1.5 text-sm font-medium bg-green-600 text-white rounded-lg hover:bg-green-700">
                                            Mark Received
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Create ASN Modal */}
                {showModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowModal(false)}>
                        <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 m-4" onClick={(e) => e.stopPropagation()}>
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-lg font-semibold">Create Inbound ASN</h2>
                                <button onClick={() => setShowModal(false)} className="p-2 hover:bg-gray-100 rounded-full"><X className="h-5 w-5" /></button>
                            </div>
                            <div className="space-y-4">
                                <input placeholder="Provider Name *" className="w-full px-4 py-2.5 border rounded-lg text-sm" onChange={(e) => setForm({ ...form, provider: e.target.value })} />
                                <input type="date" className="w-full px-4 py-2.5 border rounded-lg text-sm" onChange={(e) => setForm({ ...form, expectedArrival: e.target.value })} />
                                <textarea placeholder="Notes" className="w-full px-4 py-2.5 border rounded-lg text-sm" rows={2} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
                                <button onClick={handleCreate} className="w-full py-2.5 bg-primary text-white rounded-lg font-medium hover:bg-primary/90">Create ASN</button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
};

export default InboundPage;
