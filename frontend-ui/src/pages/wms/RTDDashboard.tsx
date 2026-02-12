import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import { wmsApi } from '../../lib/api';
import { RotateCcw, CheckCircle, Loader2, AlertTriangle, X, Package, RefreshCw } from 'lucide-react';

const RTDDashboard = () => {
    const [reports, setReports] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [success, setSuccess] = useState('');
    const [resolving, setResolving] = useState<any>(null);

    useEffect(() => { fetchReports(); }, []);

    const fetchReports = async () => {
        setLoading(true);
        try { setReports(await wmsApi.getRTDReports()); } catch (err) { console.error(err); }
        setLoading(false);
    };

    const handleResolve = async (action: string) => {
        if (!resolving) return;
        try {
            await wmsApi.resolveRTD(resolving._id, { action });
            setSuccess('Report resolved'); setTimeout(() => setSuccess(''), 3000);
            setResolving(null); fetchReports();
        } catch (err: any) { alert(err.message); }
    };

    const getReasonColor = (reason: string) => {
        const colors: any = { CUSTOMER_NA: 'bg-amber-100 text-amber-800', DAMAGED: 'bg-red-100 text-red-800', REFUSED: 'bg-orange-100 text-orange-800', ADDRESS_ISSUE: 'bg-blue-100 text-blue-800' };
        return colors[reason] || 'bg-gray-100 text-gray-800';
    };

    const getStatusColor = (status: string) => {
        const colors: any = { reported: 'bg-yellow-100 text-yellow-800', resolved: 'bg-green-100 text-green-800', received_at_depot: 'bg-blue-100 text-blue-800' };
        return colors[status] || 'bg-gray-100 text-gray-800';
    };

    const pendingCount = reports.filter(r => r.status === 'reported').length;

    return (
        <DashboardLayout>
            <div className="space-y-6 flex-1 h-full p-2">
                {success && (
                    <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg flex items-center gap-2">
                        <CheckCircle className="h-4 w-4" /> {success}
                    </div>
                )}

                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold">Returns (RTD)</h1>
                        <p className="text-muted-foreground">{reports.length} total • {pendingCount} pending resolution</p>
                    </div>
                    <button onClick={fetchReports} className="p-2.5 border rounded-lg hover:bg-muted"><RefreshCw className="h-4 w-4" /></button>
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 rounded-xl border bg-card">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-lg bg-yellow-50 flex items-center justify-center"><AlertTriangle className="h-5 w-5 text-yellow-600" /></div>
                            <div><p className="text-2xl font-bold">{pendingCount}</p><p className="text-sm text-muted-foreground">Pending</p></div>
                        </div>
                    </div>
                    <div className="p-4 rounded-xl border bg-card">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-lg bg-green-50 flex items-center justify-center"><CheckCircle className="h-5 w-5 text-green-600" /></div>
                            <div><p className="text-2xl font-bold">{reports.filter(r => r.status === 'resolved').length}</p><p className="text-sm text-muted-foreground">Resolved</p></div>
                        </div>
                    </div>
                    <div className="p-4 rounded-xl border bg-card">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-lg bg-blue-50 flex items-center justify-center"><RotateCcw className="h-5 w-5 text-blue-600" /></div>
                            <div><p className="text-2xl font-bold">{reports.length}</p><p className="text-sm text-muted-foreground">Total Reports</p></div>
                        </div>
                    </div>
                </div>

                {loading ? (
                    <div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
                ) : reports.length === 0 ? (
                    <div className="text-center py-16 text-muted-foreground">
                        <Package className="h-12 w-12 mx-auto mb-3 opacity-40" />
                        <p className="text-lg font-medium">No return reports</p>
                    </div>
                ) : (
                    <div className="grid gap-4">
                        {reports.map((r) => (
                            <div key={r._id} className="p-4 rounded-xl border bg-card hover:shadow-sm transition-shadow">
                                <div className="flex items-start justify-between">
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2">
                                            <p className="font-medium">{r.rtdId}</p>
                                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(r.status)}`}>{r.status}</span>
                                        </div>
                                        <p className="text-sm text-muted-foreground">Shipment: {r.shipmentId}</p>
                                        <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${getReasonColor(r.reasonCode)}`}>{r.reasonCode?.replace(/_/g, ' ')}</span>
                                        {r.description && <p className="text-sm text-muted-foreground mt-1">{r.description}</p>}
                                        <div className="flex items-center gap-4 text-xs text-muted-foreground mt-2">
                                            {r.driverId?.name && <span>Driver: {r.driverId.name}</span>}
                                            {r.vehicleId?.numberPlate && <span>Vehicle: {r.vehicleId.numberPlate}</span>}
                                            <span>{new Date(r.createdAt).toLocaleDateString()}</span>
                                        </div>
                                    </div>
                                    {r.status === 'reported' && (
                                        <button onClick={() => setResolving(r)} className="px-3 py-1.5 text-sm font-medium bg-primary text-white rounded-lg hover:bg-primary/90">
                                            Resolve
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Resolve Modal */}
                {resolving && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setResolving(null)}>
                        <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 m-4" onClick={(e) => e.stopPropagation()}>
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-lg font-semibold">Resolve {resolving.rtdId}</h2>
                                <button onClick={() => setResolving(null)} className="p-2 hover:bg-gray-100 rounded-full"><X className="h-5 w-5" /></button>
                            </div>
                            <p className="text-sm text-muted-foreground mb-4">Choose resolution action:</p>
                            <div className="space-y-2">
                                <button onClick={() => handleResolve('restock')} className="w-full py-2.5 border rounded-lg text-sm font-medium hover:bg-green-50 hover:border-green-200 transition-colors">
                                    ♻️ Restock to Inventory
                                </button>
                                <button onClick={() => handleResolve('return_to_seller')} className="w-full py-2.5 border rounded-lg text-sm font-medium hover:bg-blue-50 hover:border-blue-200 transition-colors">
                                    📦 Return to Seller
                                </button>
                                <button onClick={() => handleResolve('discard')} className="w-full py-2.5 border rounded-lg text-sm font-medium hover:bg-red-50 hover:border-red-200 transition-colors">
                                    🗑️ Discard
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
};

export default RTDDashboard;
