import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import DashboardLayout from "@/components/DashboardLayout";
import Footer from "@/components/Footer";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Search, MoreHorizontal, Mail, Shield, User as UserIcon, Trash2, Loader2, Wallet } from "lucide-react";
import { toast } from "sonner";
import { API_BASE_URL } from "@/config";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const UserManagement = () => {
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState("");

    // Users data - populated from API
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchUsers = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_BASE_URL}/api/admin/users`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setUsers(data);
            }
        } catch (err) {
            toast.error("Failed to fetch users");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState<any>(null);
    const [deleteConfirmChecked, setDeleteConfirmChecked] = useState(false);
    const [deleteLoading, setDeleteLoading] = useState(false);

    // Wallet Adjustment State
    const [walletDialogOpen, setWalletDialogOpen] = useState(false);
    const [walletTarget, setWalletTarget] = useState<any>(null);
    const [walletAmount, setWalletAmount] = useState("");
    const [walletAction, setWalletAction] = useState<"credit" | "debit">("credit");
    const [walletReason, setWalletReason] = useState("");
    const [walletLoading, setWalletLoading] = useState(false);

    const handleAdjustWallet = async () => {
        if (!walletTarget || !walletAmount || !walletReason) {
            toast.error("Amount and reason are required");
            return;
        }
        setWalletLoading(true);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_BASE_URL}/api/admin/users/${walletTarget._id}/wallet`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}` 
                },
                body: JSON.stringify({ amount: walletAmount, action: walletAction, reason: walletReason })
            });
            const data = await res.json();
            if (res.ok && data.success) {
                toast.success(`Wallet balance updated: ₹${data.walletBalance}`);
                setWalletDialogOpen(false);
                fetchUsers(); // refresh data
            } else {
                toast.error(data.message || "Failed to adjust wallet");
            }
        } catch (err) {
            toast.error("Failed to adjust wallet");
        } finally {
            setWalletLoading(false);
        }
    };

    const handleDeleteUser = async () => {
        if (!deleteTarget || !deleteConfirmChecked) return;
        setDeleteLoading(true);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_BASE_URL}/api/admin/delete-account`, {
                method: 'DELETE',
                headers: { 
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}` 
                },
                body: JSON.stringify({ userId: deleteTarget.id || deleteTarget._id, accountType: 'user' })
            });
            const data = await res.json();
            if (res.ok && data.success) {
                // Optimistic UI
                setUsers(prev => prev.filter(u => u.id !== deleteTarget.id));
                toast.success(`${deleteTarget.name}'s account has been permanently deleted`);
                setDeleteDialogOpen(false);
            } else {
                toast.error(data.message || "Failed to delete account. Try again.");
            }
        } catch (err) {
            toast.error("Failed to delete account. Try again.");
        } finally {
            setDeleteLoading(false);
        }
    };

    const filteredUsers = users.filter(user =>
        (user.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (user.email || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (user.businessName || "").toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <DashboardLayout>
            <div className="space-y-6">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h1 className="text-3xl font-bold">User Management</h1>
                        <p className="text-muted-foreground">Manage your team members and their access levels</p>
                    </div>
                    <Button className="gap-2 gradient-primary">
                        <Plus className="h-4 w-4" />
                        Add New User
                    </Button>
                </div>

                <div className="bg-card border rounded-lg shadow-sm">
                    <div className="p-4 border-b flex items-center gap-4">
                        <div className="relative flex-1 max-w-sm">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search users..."
                                className="pl-9"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <div className="flex gap-2 ml-auto">
                            {/* Filter buttons could go here */}
                        </div>
                    </div>

                    <div className="relative w-full overflow-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-[250px]">User</TableHead>
                                    <TableHead>Role</TableHead>
                                    <TableHead>Wallet</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="text-center py-6 text-muted-foreground"><Loader2 className="mx-auto h-6 w-6 animate-spin" /></TableCell>
                                    </TableRow>
                                ) : filteredUsers.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="text-center py-6 text-muted-foreground">No users found.</TableCell>
                                    </TableRow>
                                ) : filteredUsers.map((user) => (
                                    <TableRow key={user._id}>
                                        <TableCell>
                                            <div className="flex items-center gap-3">
                                                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold">
                                                    {(user.name || user.businessName || "U").slice(0, 2).toUpperCase()}
                                                </div>
                                                <div>
                                                    <div className="font-medium">{user.name || user.businessName}</div>
                                                    <div className="text-sm text-muted-foreground">{user.email}</div>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className="flex w-fit items-center gap-1">
                                                <Shield className="h-3 w-3" />
                                                {user.role}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <span className="font-semibold tabular-nums">₹{(user.walletBalance || 0).toLocaleString()}</span>
                                            <Button 
                                                variant="ghost" 
                                                size="sm" 
                                                className="ml-2 h-7 w-7 p-0 rounded-full"
                                                onClick={() => {
                                                    setWalletTarget(user);
                                                    setWalletAmount("");
                                                    setWalletReason("");
                                                    setWalletAction("credit");
                                                    setWalletDialogOpen(true);
                                                }}
                                            >
                                                <Wallet className="h-4 w-4 text-primary" />
                                            </Button>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={user.isActive !== false ? 'default' : 'secondary'} className={user.isActive !== false ? 'bg-green-500 hover:bg-green-600' : ''}>
                                                {user.isActive !== false ? 'Active' : 'Inactive'}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <Button 
                                                    variant="ghost" 
                                                    size="icon" 
                                                    className="h-8 w-8 text-red-500 hover:bg-red-50 hover:text-red-600 rounded-md transition-colors"
                                                    title="Delete User"
                                                    onClick={() => navigate('/account/delete/acknowledge', { state: { targetUserId: user._id, targetName: user.name || user.businessName, targetEmail: user.email, accountType: 'user' } })}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="icon" className="h-8 w-8">
                                                            <MoreHorizontal className="h-4 w-4" />
                                                        </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                    <DropdownMenuItem>Edit Details</DropdownMenuItem>
                                                    <DropdownMenuItem>Change Role</DropdownMenuItem>
                                                    <DropdownMenuSeparator />
                                                    <DropdownMenuItem className="text-red-500">Deactivate User</DropdownMenuItem>
                                                </DropdownMenuContent>
                                                </DropdownMenu>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>

                </div>

                {/* Admin Delete Modal */}
                <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                    <DialogContent className="max-w-[460px] rounded-xl p-0 overflow-hidden border-0 shadow-[0_20px_60px_rgba(0,0,0,0.15)]">
                        <div className="p-6">
                            <div className="mx-auto w-14 h-14 bg-red-500 rounded-full flex items-center justify-center mb-5">
                                <Trash2 className="h-6 w-6 text-white" />
                            </div>
                            
                            <DialogTitle className="text-center text-[20px] font-bold text-slate-900 mb-4">
                                Delete User Account?
                            </DialogTitle>
                            
                            <div className="text-slate-600 text-[14px] mb-6">
                                <p className="mb-4">You are about to permanently delete the account for:</p>
                                
                                <div className="bg-slate-50 border border-slate-100 rounded-lg p-4 mb-4 font-medium text-slate-900 space-y-1">
                                    <div className="flex gap-2"><span className="text-slate-500 w-12">Name:</span> {deleteTarget?.name || '—'}</div>
                                    <div className="flex gap-2"><span className="text-slate-500 w-12">Email:</span> {deleteTarget?.email || '—'}</div>
                                    <div className="flex gap-2"><span className="text-slate-500 w-12">Role:</span> {deleteTarget?.role || 'User'}</div>
                                </div>
                                
                                <p className="mb-4">This will remove them completely from the FastFare platform including all their shipment history, balance records, and login credentials. Their email will be freed for re-registration.</p>
                                
                                <p className="font-semibold text-red-600">This action CANNOT be undone.</p>
                            </div>

                            <label className="flex items-start gap-3 p-3 border rounded-lg bg-red-50/50 mb-6 cursor-pointer hover:bg-red-50 transition-colors">
                                <input 
                                    type="checkbox" 
                                    className="mt-1 flex-shrink-0 h-4 w-4 rounded border-gray-300 text-red-600 focus:ring-red-500"
                                    checked={deleteConfirmChecked}
                                    onChange={(e) => setDeleteConfirmChecked(e.target.checked)}
                                />
                                <span className="text-sm font-medium text-red-900 leading-snug">
                                    I understand this action is permanent and irreversible
                                </span>
                            </label>

                            <div className="flex gap-3">
                                <Button 
                                    variant="outline" 
                                    className="flex-1 bg-white border-slate-200 text-slate-600 rounded-lg h-11"
                                    onClick={() => setDeleteDialogOpen(false)}
                                    disabled={deleteLoading}
                                >
                                    Cancel
                                </Button>
                                <Button 
                                    className={`flex-1 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-lg h-11 transition-opacity ${!deleteConfirmChecked ? "opacity-50 cursor-not-allowed" : "opacity-100 cursor-pointer"}`}
                                    disabled={!deleteConfirmChecked || deleteLoading}
                                    onClick={handleDeleteUser}
                                >
                                    {deleteLoading ? <Loader2 className="h-4 w-4 animate-spin mx-auto" /> : "Delete Account"}
                                </Button>
                            </div>
                        </div>
                    </DialogContent>
                </Dialog>

                {/* Wallet Adjustment Modal */}
                <Dialog open={walletDialogOpen} onOpenChange={setWalletDialogOpen}>
                    <DialogContent className="max-w-[400px]">
                        <DialogHeader>
                            <DialogTitle>Adjust Wallet Balance</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 pt-4">
                            <div className="bg-muted p-3 rounded-lg flex justify-between items-center text-sm">
                                <div>
                                    <p className="font-medium text-muted-foreground">Target User</p>
                                    <p className="font-semibold">{walletTarget?.name || walletTarget?.businessName}</p>
                                </div>
                                <div className="text-right">
                                    <p className="font-medium text-muted-foreground">Current Balance</p>
                                    <p className="font-bold text-primary">₹{(walletTarget?.walletBalance || 0).toLocaleString()}</p>
                                </div>
                            </div>
                            
                            <div className="grid gap-2">
                                <label className="text-sm font-medium">Action</label>
                                <div className="flex gap-2">
                                    <Button 
                                        type="button" 
                                        variant={walletAction === 'credit' ? 'default' : 'outline'}
                                        className={walletAction === 'credit' ? 'bg-green-600 hover:bg-green-700 flex-1' : 'flex-1'}
                                        onClick={() => setWalletAction('credit')}
                                    >Credit (+)</Button>
                                    <Button 
                                        type="button" 
                                        variant={walletAction === 'debit' ? 'default' : 'outline'}
                                        className={walletAction === 'debit' ? 'bg-red-600 hover:bg-red-700 flex-1' : 'flex-1'}
                                        onClick={() => setWalletAction('debit')}
                                    >Debit (-)</Button>
                                </div>
                            </div>

                            <div className="grid gap-2">
                                <label className="text-sm font-medium">Amount (₹)</label>
                                <Input 
                                    type="number" 
                                    min="1" 
                                    placeholder="e.g. 500" 
                                    value={walletAmount}
                                    onChange={(e) => setWalletAmount(e.target.value)}
                                />
                            </div>

                            <div className="grid gap-2">
                                <label className="text-sm font-medium">Reason / Note</label>
                                <Input 
                                    placeholder="e.g. Promotional Credit" 
                                    value={walletReason}
                                    onChange={(e) => setWalletReason(e.target.value)}
                                />
                            </div>
                            
                            <Button 
                                className="w-full mt-2" 
                                onClick={handleAdjustWallet}
                                disabled={walletLoading || !walletAmount || !walletReason}
                            >
                                {walletLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Wallet className="h-4 w-4 mr-2" />}
                                Confirm {walletAction === 'credit' ? 'Credit' : 'Debit'}
                            </Button>
                        </div>
                    </DialogContent>
                </Dialog>

                <Footer />
            </div>
        </DashboardLayout>
    );
};

export default UserManagement;
