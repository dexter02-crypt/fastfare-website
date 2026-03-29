import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  ToggleLeft, 
  ToggleRight,
  Eye,
  Ticket,
  AlertTriangle
} from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";

export default function PromoCodesManagement() {
  const { toast } = useToast();
  
  // Data States
  const [promos, setPromos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filter States
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPromo, setEditingPromo] = useState<any>(null);
  
  // Details Sheet
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [selectedPromoDetails, setSelectedPromoDetails] = useState<any>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    code: "",
    discount_amount: "",
    max_uses: "",
    per_user_limit: "1",
    minimum_order_value: "0",
    expires_at: "",
    description: "",
    is_active: true
  });

  const fetchPromos = async () => {
    try {
      const response = await fetch('/api/promo/admin', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (response.ok) {
        const data = await response.json();
        setPromos(data);
      }
    } catch (error) {
      console.error(error);
      toast({ title: "Error", description: "Failed to load promo codes", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPromos();
  }, []);

  const handleGenerateCode = () => {
    const randomCode = Math.random().toString(36).substring(2, 10).toUpperCase();
    setFormData({ ...formData, code: randomCode });
  };

  const handleOpenModal = (promo = null) => {
    if (promo) {
      setEditingPromo(promo);
      setFormData({
        code: promo.code,
        discount_amount: promo.discount_amount.toString(),
        max_uses: promo.max_uses ? promo.max_uses.toString() : "",
        per_user_limit: promo.per_user_limit.toString(),
        minimum_order_value: promo.minimum_order_value.toString(),
        expires_at: promo.expires_at ? new Date(promo.expires_at).toISOString().split('T')[0] : "",
        description: promo.description || "",
        is_active: promo.is_active
      });
    } else {
      setEditingPromo(null);
      setFormData({
        code: "",
        discount_amount: "",
        max_uses: "",
        per_user_limit: "1",
        minimum_order_value: "0",
        expires_at: "",
        description: "",
        is_active: true
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (Number(formData.discount_amount) > 5000) {
      if (!window.confirm(`Warning: You are creating a discount of ₹${formData.discount_amount}. Are you sure you want to proceed?`)) {
        return;
      }
    }

    try {
      const url = editingPromo 
        ? `/api/promo/admin/${editingPromo._id}`
        : `/api/promo/admin`;
      
      const method = editingPromo ? 'PUT' : 'POST';
      
      const payload = { ...formData };
      if (!payload.expires_at) delete payload.expires_at;

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.message);
      }

      toast({ title: "Success", description: `Promo code ${editingPromo ? 'updated' : 'created'}!` });
      setIsModalOpen(false);
      fetchPromos();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const handleToggleActive = async (id: string, currentStatus: boolean) => {
    try {
      await fetch(`/api/promo/admin/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ is_active: !currentStatus })
      });
      fetchPromos();
    } catch (error) {
      toast({ title: "Error", description: "Failed to toggle status", variant: "destructive" });
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this promo code? Usage history will be preserved.")) return;
    
    try {
      const response = await fetch(`/api/promo/admin/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (response.ok) {
        toast({ title: "Success", description: "Promo code deleted" });
        fetchPromos();
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to delete", variant: "destructive" });
    }
  };

  const handleViewDetails = async (id: string) => {
    setDetailsOpen(true);
    setDetailsLoading(true);
    try {
      const response = await fetch(`/api/promo/admin/${id}/analytics`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await response.json();
      setSelectedPromoDetails(data);
    } catch (error) {
      toast({ title: "Error", description: "Failed to load details", variant: "destructive" });
    } finally {
      setDetailsLoading(false);
    }
  };

  const getStatusBadge = (promo: any) => {
    if (promo.expires_at && new Date() > new Date(promo.expires_at)) {
      return <Badge variant="destructive" className="bg-orange-500">Expired</Badge>;
    }
    if (!promo.is_active) {
      return <Badge variant="destructive">Inactive</Badge>;
    }
    return <Badge className="bg-green-500 hover:bg-green-600">Active</Badge>;
  };

  const filteredPromos = promos.filter(p => {
    if (statusFilter === 'active') return p.is_active && (!p.expires_at || new Date(p.expires_at) >= new Date());
    if (statusFilter === 'inactive') return !p.is_active;
    if (statusFilter === 'expired') return p.expires_at && new Date(p.expires_at) < new Date();
    return true;
  }).filter(p => p.code.toLowerCase().includes(search.toLowerCase()));

  return (
    <DashboardLayout>
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Promo Codes</h1>
            <p className="text-muted-foreground mt-1">Manage discounts and promotional campaigns.</p>
          </div>
          <Button onClick={() => handleOpenModal()} className="gap-2">
            <Plus className="w-4 h-4" /> Create Promo Code
          </Button>
        </div>

        <div className="bg-card border rounded-lg overflow-hidden flex flex-col">
          <div className="p-4 border-b flex gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search promo codes..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border rounded-md bg-transparent"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="expired">Expired</option>
            </select>
          </div>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Discount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Uses</TableHead>
                  <TableHead>Min. Order</TableHead>
                  <TableHead>Expires At</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow><TableCell colSpan={7} className="text-center py-6">Loading codes...</TableCell></TableRow>
                ) : filteredPromos.length === 0 ? (
                  <TableRow><TableCell colSpan={7} className="text-center py-6">No promo codes found.</TableCell></TableRow>
                ) : (
                  filteredPromos.map(promo => {
                    const usageWarning = promo.max_uses && (promo.used_count / promo.max_uses) >= 0.9;
                    return (
                      <TableRow key={promo._id}>
                        <TableCell className="font-bold font-mono text-primary flex items-center gap-2">
                          <Ticket className="w-4 h-4 text-muted-foreground" />
                          {promo.code}
                        </TableCell>
                        <TableCell>₹{promo.discount_amount}</TableCell>
                        <TableCell>{getStatusBadge(promo)}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {promo.used_count} / {promo.max_uses || "∞"}
                            {usageWarning && <AlertTriangle className="w-4 h-4 text-yellow-500" title="Approaching limit" />}
                          </div>
                        </TableCell>
                        <TableCell>₹{promo.minimum_order_value}</TableCell>
                        <TableCell>{promo.expires_at ? new Date(promo.expires_at).toLocaleDateString() : 'Never'}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button variant="ghost" size="icon" onClick={() => handleViewDetails(promo._id)} title="View Analytics">
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => handleToggleActive(promo._id, promo.is_active)} title={promo.is_active ? 'Deactivate' : 'Activate'}>
                              {promo.is_active ? <ToggleRight className="w-4 h-4 text-green-500" /> : <ToggleLeft className="w-4 h-4 text-muted-foreground" />}
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => handleOpenModal(promo)} title="Edit">
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => handleDelete(promo._id)} title="Delete">
                              <Trash2 className="w-4 h-4 text-red-500" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>

      {/* Editor Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingPromo ? 'Edit Promo Code' : 'Create Promo Code'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label>Promo Code</Label>
              <div className="flex gap-2">
                <Input 
                  required
                  placeholder="e.g. SAVE50"
                  value={formData.code}
                  onChange={e => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  disabled={!!editingPromo}
                  className="font-mono uppercase"
                />
                {!editingPromo && (
                  <Button type="button" variant="outline" onClick={handleGenerateCode}>Generate</Button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Discount Amount (₹)</Label>
                <Input 
                  type="number" required min="1"
                  value={formData.discount_amount}
                  onChange={e => setFormData({ ...formData, discount_amount: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Min. Order Value (₹)</Label>
                <Input 
                  type="number" min="0"
                  value={formData.minimum_order_value}
                  onChange={e => setFormData({ ...formData, minimum_order_value: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Max Uses (Total)</Label>
                <Input 
                  type="number" min="1" placeholder="Unlimited"
                  value={formData.max_uses}
                  onChange={e => setFormData({ ...formData, max_uses: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Per User Limit</Label>
                <Input 
                  type="number" required min="1"
                  value={formData.per_user_limit}
                  onChange={e => setFormData({ ...formData, per_user_limit: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Expiry Date (Optional)</Label>
              <Input 
                type="date"
                value={formData.expires_at}
                onChange={e => setFormData({ ...formData, expires_at: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label>Internal Note / Description</Label>
              <Textarea 
                placeholder="Optional description"
                value={formData.description}
                onChange={e => setFormData({ ...formData, description: e.target.value })}
              />
            </div>

            <div className="flex items-center justify-between p-3 border rounded-md">
              <Label className="cursor-pointer">Active Status</Label>
              <Switch 
                checked={formData.is_active}
                onCheckedChange={c => setFormData({...formData, is_active: c})}
              />
            </div>

            <DialogFooter className="pt-4">
              <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>Cancel</Button>
              <Button type="submit">{editingPromo ? 'Save Changes' : 'Create Code'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Analytics Sheet */}
      <Sheet open={detailsOpen} onOpenChange={setDetailsOpen}>
        <SheetContent className="w-[400px] sm:w-[540px] overflow-y-auto">
          <SheetHeader className="mb-6">
            <SheetTitle className="flex items-center gap-2 font-mono">
              <Ticket className="w-5 h-5 text-primary" />
              {selectedPromoDetails?.promo?.code} Analytics
            </SheetTitle>
            <SheetDescription>
              Performance metrics and usage history for this code.
            </SheetDescription>
          </SheetHeader>

          {detailsLoading ? (
            <div className="flex justify-center p-8">Loading...</div>
          ) : selectedPromoDetails ? (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-muted p-4 rounded-lg">
                  <div className="text-sm text-muted-foreground mb-1">Total Uses</div>
                  <div className="text-2xl font-bold">{selectedPromoDetails.totalUsages}</div>
                </div>
                <div className="bg-muted p-4 rounded-lg">
                  <div className="text-sm text-muted-foreground mb-1">Total Savings Given</div>
                  <div className="text-2xl font-bold text-green-600">₹{selectedPromoDetails.totalDiscountGiven}</div>
                </div>
              </div>

              <div>
                <h3 className="font-semibold mb-3">Usage History</h3>
                {selectedPromoDetails.usageHistory?.length === 0 ? (
                  <div className="text-muted-foreground text-sm border p-4 rounded-md text-center">
                    No users have redeemed this code yet.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {selectedPromoDetails.usageHistory.map((usage: any) => (
                      <div key={usage._id} className="border p-3 rounded-md text-sm flex flex-col gap-1">
                        <div className="flex justify-between items-start">
                          <span className="font-medium">{usage.user_id?.name || 'Unknown User'}</span>
                          <span className="text-green-600 font-semibold">-₹{usage.discount_applied}</span>
                        </div>
                        <div className="text-xs text-muted-foreground flex justify-between">
                          <span>{usage.user_id?.email}</span>
                          <span>{new Date(usage.used_at).toLocaleDateString()}</span>
                        </div>
                        <div className="text-xs mt-1">
                          Shipment: <Link to={`/shipment/${usage.shipment_id?.awb}`} className="text-primary hover:underline">{usage.shipment_id?.awb}</Link> 
                          {' '}(Order total: ₹{usage.shipment_id?.totalPayable})
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : null}
        </SheetContent>
      </Sheet>

    </DashboardLayout>
  );
}
