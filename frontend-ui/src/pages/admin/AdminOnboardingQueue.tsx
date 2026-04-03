import { useState, useEffect } from "react";
import { API_BASE_URL } from "@/config";
import DashboardLayout from "@/components/DashboardLayout";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Shield, Clock, AlertTriangle, CheckCircle, Search, RefreshCw, XCircle, History } from "lucide-react";
import VerifiedBadge from "@/components/VerifiedBadge";
import { Textarea } from "@/components/ui/textarea";

export default function AdminOnboardingQueue() {
  const [queue, setQueue] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("pending_review");
  const [search, setSearch] = useState("");
  
  // Dialogs
  const [actionDialog, setActionDialog] = useState<"approve" | "reject" | "needs_more_info" | "suspend" | "reverify" | null>(null);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [actionNote, setActionNote] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  // History Dialog
  const [historyDialog, setHistoryDialog] = useState<any>(null);
  const [historyEvents, setHistoryEvents] = useState<any[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  useEffect(() => {
    fetchQueue();
  }, [statusFilter]);

  const fetchQueue = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE_URL}/api/admin/onboarding?status=${statusFilter}&search=${search}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setQueue(data.users || []);
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to fetch onboarding queue");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchQueue();
  };

  const executeAction = async () => {
    if (!selectedUser || !actionDialog) return;
    
    setActionLoading(true);
    try {
      const token = localStorage.getItem("token");
      let endpoint = '';
      let payload: any = {};
      
      switch (actionDialog) {
        case 'approve':
          endpoint = `/api/admin/onboarding/${selectedUser._id}/approve`;
          break;
        case 'reject':
          endpoint = `/api/admin/onboarding/${selectedUser._id}/reject`;
          payload = { reason: actionNote };
          break;
        case 'needs_more_info':
          endpoint = `/api/admin/onboarding/${selectedUser._id}/needs-more-info`;
          payload = { adminNote: actionNote };
          break;
        case 'suspend':
          endpoint = `/api/admin/onboarding/${selectedUser._id}/suspend`;
          payload = { reason: actionNote };
          break;
        case 'reverify':
          endpoint = `/api/admin/onboarding/${selectedUser._id}/reverify`;
          break;
      }

      const res = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: "PUT",
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}` 
        },
        body: Object.keys(payload).length > 0 ? JSON.stringify(payload) : undefined
      });
      
      if (res.ok) {
        toast.success(`User ${actionDialog} successfully`);
        setActionDialog(null);
        setSelectedUser(null);
        setActionNote("");
        fetchQueue();
      } else {
        const data = await res.json();
        toast.error(data.error || `Failed to ${actionDialog}`);
      }
    } catch (err) {
      console.error(err);
      toast.error(`Action failed`);
    } finally {
      setActionLoading(false);
    }
  };

  const openAction = (user: any, action: typeof actionDialog) => {
    setSelectedUser(user);
    setActionDialog(action);
    setActionNote("");
  };

  const openHistory = async (user: any) => {
    setHistoryDialog(user);
    setHistoryLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE_URL}/api/admin/onboarding/${user._id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setHistoryEvents(data.events || []);
      }
    } catch (err) {
      toast.error("Failed to load audit history");
    } finally {
      setHistoryLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <Breadcrumbs items={[{ label: "Admin" }, { label: "Onboarding Queue" }]} />
        
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold">Onboarding Review Queue</h1>
            <p className="text-muted-foreground">Review and approve partner and user KYC applications</p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
            <form onSubmit={handleSearch} className="flex gap-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search name, GSTIN..."
                  className="pl-9 w-full sm:w-[250px]"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <Button type="submit" variant="secondary">Search</Button>
            </form>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending_review">Pending Review</SelectItem>
                <SelectItem value="digilocker_verified">DL Verified</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="needs_more_info">Needs Info</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
                <SelectItem value="suspended">Suspended</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={fetchQueue}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Queue ({queue.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="py-12 flex justify-center"><RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" /></div>
            ) : queue.length === 0 ? (
              <div className="py-12 text-center text-muted-foreground">No users found in this queue.</div>
            ) : (
              <div className="space-y-4">
                {queue.map((user) => (
                  <div key={user._id} className="p-4 border rounded-lg flex flex-col md:flex-row justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold">{user.businessName || user.name}</h3>
                        <Badge variant="outline">{user.role}</Badge>
                        {user.isVerified ? (
                          <VerifiedBadge status="verified" source="digilocker" />
                        ) : (
                           <Badge variant="secondary">{user.onboardingStatus}</Badge>
                        )}
                        {user.trustFlags?.nameMismatch || user.nameMismatchFlag ? (
                          <Badge variant="destructive" className="bg-red-100 text-red-800 border-red-300 hover:bg-red-200">
                             <AlertTriangle className="h-3 w-3 mr-1" /> Name Mismatch
                          </Badge>
                        ) : null}
                      </div>
                      <div className="text-sm text-muted-foreground grid sm:grid-cols-2 gap-x-8 gap-y-1 mt-2">
                        <p>Email: {user.email}</p>
                        <p>Phone: {user.phone}</p>
                        {user.verifiedIdentity && (
                           <>
                             <p>DL Name: {user.verifiedIdentity.name}</p>
                             <p>DL DOB: {user.verifiedIdentity.dob}</p>
                           </>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-2 mt-2 md:mt-0">
                      {['pending_review', 'digilocker_verified'].includes(user.onboardingStatus) && (
                        <>
                          <Button size="sm" variant="default" className="bg-green-600 hover:bg-green-700" onClick={() => openAction(user, 'approve')}>
                            <CheckCircle className="h-4 w-4 mr-2" /> Approve
                          </Button>
                          <Button size="sm" variant="outline" className="border-amber-500 text-amber-600 hover:bg-amber-50" onClick={() => openAction(user, 'needs_more_info')}>
                            <AlertTriangle className="h-4 w-4 mr-2" /> Needs Info
                          </Button>
                          <Button size="sm" variant="outline" className="border-red-500 text-red-600 hover:bg-red-50" onClick={() => openAction(user, 'reject')}>
                            <XCircle className="h-4 w-4 mr-2" /> Reject
                          </Button>
                        </>
                      )}
                      {['approved', 'suspended', 'rejected'].includes(user.onboardingStatus) && (
                        <Button size="sm" variant="outline" onClick={() => openAction(user, 'reverify')}>
                          Request Re-verify
                        </Button>
                      )}
                      {user.onboardingStatus === 'approved' && (
                         <Button size="sm" variant="destructive" onClick={() => openAction(user, 'suspend')}>
                           Suspend
                         </Button>
                      )}
                      
                      <div className="w-full flex justify-end mt-2 md:mt-0">
                         <Button size="sm" variant="ghost" onClick={() => openHistory(user)}>
                            <History className="h-4 w-4 mr-2" /> View Timeline
                         </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Action Dialog */}
      <Dialog open={!!actionDialog} onOpenChange={(open) => !open && setActionDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionDialog === 'approve' && 'Approve Account'}
              {actionDialog === 'reject' && 'Reject Account'}
              {actionDialog === 'needs_more_info' && 'Request More Info'}
              {actionDialog === 'suspend' && 'Suspend Account'}
              {actionDialog === 'reverify' && 'Request Re-verification'}
            </DialogTitle>
            <DialogDescription>
              {selectedUser?.businessName || selectedUser?.name}
            </DialogDescription>
          </DialogHeader>

          {['reject', 'needs_more_info', 'suspend'].includes(actionDialog || '') && (
            <div className="py-4">
              <label className="text-sm font-medium mb-2 block">
                Reason / Note (Required)
                <span className="text-muted-foreground ml-2 font-normal">will be sent via email</span>
              </label>
              <Textarea 
                value={actionNote} 
                onChange={(e) => setActionNote(e.target.value)} 
                placeholder="Please provide details..."
                className="min-h-[100px]"
              />
            </div>
          )}
          
          {(actionDialog === 'approve' || actionDialog === 'reverify') && (
            <div className="py-4">
              <p className="text-sm">
                Are you sure you want to proceed? An email will be sent automatically.
              </p>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setActionDialog(null)}>Cancel</Button>
            <Button 
                variant={actionDialog === 'approve' ? 'default' : 'destructive'}
                disabled={actionLoading || (['reject', 'needs_more_info', 'suspend'].includes(actionDialog || '') && !actionNote.trim())}
                onClick={executeAction}
            >
              {actionLoading ? <RefreshCw className="h-4 w-4 animate-spin mr-2" /> : null}
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* History Dialog */}
      <Dialog open={!!historyDialog} onOpenChange={(open) => !open && setHistoryDialog(null)}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Audit Timeline</DialogTitle>
            <DialogDescription>
              Onboarding history for {historyDialog?.businessName || historyDialog?.name}
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[60vh] pr-4">
            {historyLoading ? (
              <div className="py-8 flex justify-center"><RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" /></div>
            ) : historyEvents.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground">No events found.</div>
            ) : (
              <div className="space-y-4">
                {historyEvents.map((evt, i) => (
                  <div key={evt._id} className="relative border-l-2 border-muted pl-4 pb-4">
                    <div className="absolute w-3 h-3 bg-primary rounded-full -left-[7px] top-1"></div>
                    <div className="flex items-center justify-between mb-1">
                      <p className="font-semibold text-sm">
                        {evt.eventType.replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase())}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(evt.createdAt).toLocaleString()}
                      </p>
                    </div>
                    <p className="text-xs text-muted-foreground mb-2">
                       Status: <Badge variant="outline" className="text-[10px] scale-90">{evt.previousStatus}</Badge> → <Badge variant="default" className="text-[10px] scale-90">{evt.newStatus}</Badge>
                    </p>
                    {evt.reason && <p className="text-sm border-l-2 border-border pl-2 italic">"{evt.reason}"</p>}
                    {evt.note && <p className="text-sm bg-muted/50 p-2 rounded-md mt-2 whitespace-pre-wrap">{evt.note}</p>}
                    <p className="text-[10px] text-muted-foreground mt-2 uppercase tracking-wider">
                       Actor: {evt.actorRole} {evt.actorId?.businessName ? `(${evt.actorId.businessName})` : ''}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>

    </DashboardLayout>
  );
}
