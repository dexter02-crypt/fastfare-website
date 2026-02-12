import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import { wmsApi } from '../../lib/api';
import { Package, Search, Plus, Loader2, AlertTriangle, X, CheckCircle, Download, Box } from 'lucide-react';

const InventoryPage = () => {
    const [items, setItems] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [success, setSuccess] = useState('');
    const [form, setForm] = useState<any>({});
    const [filter, setFilter] = useState('all');

    useEffect(() => {
        fetchInventory();
    }, []);

    const fetchInventory = async () => {
        setLoading(true);
        try { setItems(await wmsApi.getInventory()); } catch (err) { console.error(err); }
        setLoading(false);
    };

    const handleAdd = async () => {
        try {
            await wmsApi.addInventoryItem(form);
            setSuccess('Item added'); setTimeout(() => setSuccess(''), 3000);
            setShowModal(false); setForm({}); fetchInventory();
        } catch (err: any) { alert(err.message); }
    };

    const handleExport = () => {
        const csv = ['SKU,Name,Category,Stock,Price', ...items.map(i => `${i.sku},${i.name},${i.category || ''},${i.stock?.available || 0},${i.price || 0}`)].join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a'); a.href = url; a.download = 'inventory.csv'; a.click();
    };

    const filtered = items
        .filter(i => !search || i.name?.toLowerCase().includes(search.toLowerCase()) || i.sku?.toLowerCase().includes(search.toLowerCase()))
        .filter(i => filter === 'all' || (filter === 'low' && (i.stock?.available || 0) < (i.reorderLevel || 10)));

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
                        <h1 className="text-2xl font-bold">Inventory</h1>
                        <p className="text-muted-foreground">{items.length} items • {items.filter(i => (i.stock?.available || 0) < (i.reorderLevel || 10)).length} low stock</p>
                    </div>
                    <div className="flex gap-2">
                        <button onClick={handleExport} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border font-medium hover:bg-muted transition-colors text-sm">
                            <Download className="h-4 w-4" /> Export CSV
                        </button>
                        <button onClick={() => setShowModal(true)} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors text-sm">
                            <Plus className="h-4 w-4" /> Add Item
                        </button>
                    </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                    <div className="relative flex-1 max-w-sm">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <input type="text" placeholder="Search by name or SKU..." value={search} onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
                    </div>
                    <div className="flex gap-1 p-1 bg-muted rounded-lg w-fit">
                        <button onClick={() => setFilter('all')} className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${filter === 'all' ? 'bg-background shadow-sm' : 'text-muted-foreground'}`}>All</button>
                        <button onClick={() => setFilter('low')} className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all flex items-center gap-1.5 ${filter === 'low' ? 'bg-background shadow-sm text-amber-600' : 'text-muted-foreground'}`}>
                            <AlertTriangle className="h-3.5 w-3.5" /> Low Stock
                        </button>
                    </div>
                </div>

                {loading ? (
                    <div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
                ) : filtered.length === 0 ? (
                    <div className="text-center py-16 text-muted-foreground">
                        <Box className="h-12 w-12 mx-auto mb-3 opacity-40" />
                        <p className="text-lg font-medium">No items found</p>
                        <p className="text-sm mt-1">Add inventory items to get started</p>
                    </div>
                ) : (
                    <div className="border rounded-xl overflow-hidden">
                        <table className="w-full">
                            <thead className="bg-muted/50">
                                <tr>
                                    <th className="text-left p-3 text-sm font-medium text-muted-foreground">SKU</th>
                                    <th className="text-left p-3 text-sm font-medium text-muted-foreground">Name</th>
                                    <th className="text-left p-3 text-sm font-medium text-muted-foreground">Category</th>
                                    <th className="text-right p-3 text-sm font-medium text-muted-foreground">Stock</th>
                                    <th className="text-left p-3 text-sm font-medium text-muted-foreground">Location</th>
                                    <th className="text-right p-3 text-sm font-medium text-muted-foreground">Price</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {filtered.map((item) => (
                                    <tr key={item._id} className="hover:bg-muted/30 transition-colors">
                                        <td className="p-3 text-sm font-mono">{item.sku}</td>
                                        <td className="p-3 text-sm font-medium">{item.name}</td>
                                        <td className="p-3 text-sm text-muted-foreground">{item.category || '—'}</td>
                                        <td className="p-3 text-right">
                                            <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium ${(item.stock?.available || 0) < (item.reorderLevel || 10) ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                                                {(item.stock?.available || 0) < (item.reorderLevel || 10) && <AlertTriangle className="h-3 w-3" />}
                                                {item.stock?.available || 0}
                                            </span>
                                        </td>
                                        <td className="p-3 text-sm text-muted-foreground">{item.location?.zone || '—'}</td>
                                        <td className="p-3 text-sm text-right font-medium">₹{item.price?.toLocaleString() || '0'}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Add Modal */}
                {showModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowModal(false)}>
                        <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 m-4" onClick={(e) => e.stopPropagation()}>
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-lg font-semibold">Add Inventory Item</h2>
                                <button onClick={() => setShowModal(false)} className="p-2 hover:bg-gray-100 rounded-full"><X className="h-5 w-5" /></button>
                            </div>
                            <div className="space-y-4">
                                <input placeholder="SKU *" className="w-full px-4 py-2.5 border rounded-lg text-sm" onChange={(e) => setForm({ ...form, sku: e.target.value })} />
                                <input placeholder="Name *" className="w-full px-4 py-2.5 border rounded-lg text-sm" onChange={(e) => setForm({ ...form, name: e.target.value })} />
                                <select className="w-full px-4 py-2.5 border rounded-lg text-sm" onChange={(e) => setForm({ ...form, category: e.target.value })}>
                                    <option value="">Category</option>
                                    <option>Electronics</option><option>Audio</option><option>Wearables</option><option>Accessories</option><option>Office</option>
                                </select>
                                <input placeholder="Price (₹)" type="number" className="w-full px-4 py-2.5 border rounded-lg text-sm" onChange={(e) => setForm({ ...form, price: Number(e.target.value) })} />
                                <input placeholder="Stock Quantity" type="number" className="w-full px-4 py-2.5 border rounded-lg text-sm" onChange={(e) => setForm({ ...form, stock: Number(e.target.value) })} />
                                <button onClick={handleAdd} className="w-full py-2.5 bg-primary text-white rounded-lg font-medium hover:bg-primary/90">Add Item</button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
};

export default InventoryPage;
