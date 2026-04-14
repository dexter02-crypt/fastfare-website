import { useState } from "react";
import {
    Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Wallet, AlertTriangle, XCircle, Loader2, ShieldAlert } from "lucide-react";
import { API_BASE_URL } from "@/config";
import { toast } from "sonner";
import { useWallet } from "@/contexts/WalletContext";

// ─── Types ────────────────────────────────────────────────────────────────────
interface ShipmentForCancel {
    _id: string;
    awb: string;
    status: string;
    paymentMode: string;
    totalPayable?: number;
    amountCharged?: number;
    shippingCost?: number;
}

interface CancelShipmentDialogProps {
    shipment: ShipmentForCancel | null;
    isOpen: boolean;
    onClose: () => void;
    onCancelled: (data: { awb: string; refundAmount: number; newBalance: number | null; status: string }) => void;
}

// ─── Cancellable statuses ─────────────────────────────────────────────────────
const CANCELLABLE_STATUSES = [
    "pending", "pending_acceptance", "pickup_scheduled",
    "payment_received", "partner_assigned", "accepted", "booked"
];

const NON_CANCELLABLE_STATUSES = [
    "picked_up", "in_transit", "out_for_delivery", "delivered",
    "returned", "rto", "settled"
];

const formatStatus = (status: string) =>
    status.split("_").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");

// ─── Component ────────────────────────────────────────────────────────────────
const CancelShipmentDialog = ({ shipment, isOpen, onClose, onCancelled }: CancelShipmentDialogProps) => {
    const [isCancelling, setIsCancelling] = useState(false);
    const { balance: walletBalance, refreshBalance } = useWallet();

    if (!shipment) return null;

    const isAlreadyCancelled = shipment.status === "cancelled";
    const isCancellable = CANCELLABLE_STATUSES.includes(shipment.status);
    const isWalletPaid = shipment.paymentMode === "wallet";
    const refundAmount = isWalletPaid ? (shipment.amountCharged || shipment.totalPayable || 0) : 0;
    const newBalance = walletBalance + refundAmount;

    // ─── Handle cancel ────────────────────────────────────────────────────────
    const handleConfirmCancel = async () => {
        if (!shipment || isCancelling) return;
        setIsCancelling(true);

        try {
            const token = localStorage.getItem("token");
            const response = await fetch(`${API_BASE_URL}/api/shipments/${shipment._id}/cancel`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ reason: "User requested cancellation" }),
            });

            const data = await response.json();

            if (!response.ok || !data.success) {
                toast.error(data.message || "Failed to cancel order. Please try again.");
                return;
            }

            // Refresh wallet balance
            await refreshBalance();

            // Show success toast
            if (data.refund_amount > 0) {
                toast.success(
                    `Order Cancelled & Refund Processed — ₹${data.refund_amount.toLocaleString("en-IN")} has been added to your FastFare Wallet. New Balance: ₹${data.new_wallet_balance?.toLocaleString("en-IN") ?? "N/A"}`,
                    { duration: 6000 }
                );
            } else {
                toast.success("Order cancelled successfully.", { duration: 4000 });
            }

            onCancelled({
                awb: data.awb || shipment.awb,
                refundAmount: data.refund_amount || 0,
                newBalance: data.new_wallet_balance,
                status: "cancelled",
            });

            onClose();
        } catch (err) {
            console.error("Cancel error:", err);
            toast.error("Cancellation failed. No changes were made. Please try again.");
        } finally {
            setIsCancelling(false);
        }
    };

    // ═══════════════════════════════════════════════════════════════════════════
    // VARIANT 1: Already Cancelled
    // ═══════════════════════════════════════════════════════════════════════════
    if (isAlreadyCancelled) {
        return (
            <Dialog open={isOpen} onOpenChange={onClose}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader className="items-center text-center">
                        <div className="mx-auto h-14 w-14 rounded-full bg-red-100 flex items-center justify-center mb-2">
                            <XCircle className="h-7 w-7 text-red-500" />
                        </div>
                        <DialogTitle>Already Cancelled</DialogTitle>
                        <DialogDescription className="text-center">
                            This order has already been cancelled.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="text-center space-y-2 text-sm text-muted-foreground">
                        <p>AWB #: <span className="font-mono font-medium text-foreground">{shipment.awb}</span></p>
                    </div>
                    <DialogFooter className="sm:justify-center">
                        <Button onClick={onClose}>Close</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        );
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // VARIANT 2: Not Cancellable (picked up, in transit, delivered, etc.)
    // ═══════════════════════════════════════════════════════════════════════════
    if (!isCancellable) {
        return (
            <Dialog open={isOpen} onOpenChange={onClose}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader className="items-center text-center">
                        <div className="mx-auto h-14 w-14 rounded-full bg-amber-100 flex items-center justify-center mb-2">
                            <ShieldAlert className="h-7 w-7 text-amber-600" />
                        </div>
                        <DialogTitle>Cannot Cancel Order</DialogTitle>
                        <DialogDescription className="text-center">
                            This order cannot be cancelled.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-3 text-sm text-center">
                        <p className="text-muted-foreground">
                            AWB #: <span className="font-mono font-medium text-foreground">{shipment.awb}</span>
                        </p>
                        <p className="text-muted-foreground">
                            Current Status: <Badge variant="secondary">{formatStatus(shipment.status)}</Badge>
                        </p>
                        <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg p-3 text-left">
                            <p className="text-amber-800 dark:text-amber-300 text-xs">
                                Orders cannot be cancelled once they have been picked up by the delivery partner. Please contact support if you need further assistance.
                            </p>
                        </div>
                    </div>
                    <DialogFooter className="sm:justify-center">
                        <Button onClick={onClose}>Close</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        );
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // VARIANT 3a: PREPAID / Wallet — Refund Eligible
    // ═══════════════════════════════════════════════════════════════════════════
    if (isWalletPaid && refundAmount > 0) {
        return (
            <Dialog open={isOpen} onOpenChange={isCancelling ? undefined : onClose}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader className="items-center text-center">
                        <div className="mx-auto h-14 w-14 rounded-full bg-green-100 flex items-center justify-center mb-2">
                            <Wallet className="h-7 w-7 text-green-600" />
                        </div>
                        <DialogTitle>Cancel Order & Refund</DialogTitle>
                        <DialogDescription className="text-center">
                            Are you sure you want to cancel this order?
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4">
                        <p className="text-sm text-center text-muted-foreground">
                            AWB #: <span className="font-mono font-medium text-foreground">{shipment.awb}</span>
                        </p>

                        <p className="text-sm text-center text-muted-foreground">
                            The following amount will be refunded to your FastFare Wallet:
                        </p>

                        {/* Refund amount card */}
                        <div className="bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-xl p-4 text-center">
                            <div className="flex items-center justify-center gap-2 mb-1">
                                <span className="text-lg">💰</span>
                                <span className="text-2xl font-bold text-green-700 dark:text-green-400">
                                    ₹{refundAmount.toLocaleString("en-IN")}
                                </span>
                            </div>
                            <p className="text-xs text-green-600 dark:text-green-500">Refund to Wallet</p>
                        </div>

                        {/* Balance breakdown */}
                        <div className="bg-muted/50 rounded-lg p-3 space-y-1.5 text-sm">
                            <p className="text-muted-foreground">Your wallet balance after refund:</p>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Current Balance:</span>
                                <span className="font-medium">₹{walletBalance.toLocaleString("en-IN")}</span>
                            </div>
                            <div className="flex justify-between text-green-600">
                                <span>+ Refund:</span>
                                <span className="font-medium">₹{refundAmount.toLocaleString("en-IN")}</span>
                            </div>
                            <Separator className="my-1" />
                            <div className="flex justify-between font-semibold">
                                <span>New Balance:</span>
                                <span className="text-green-700 dark:text-green-400">₹{newBalance.toLocaleString("en-IN")}</span>
                            </div>
                        </div>

                        {/* Warning */}
                        <div className="flex items-start gap-2 text-xs text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg p-2.5">
                            <AlertTriangle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                            <p>Refunds are processed instantly to your FastFare Wallet. Once cancelled, this action cannot be undone.</p>
                        </div>
                    </div>

                    <DialogFooter className="gap-2 sm:gap-0">
                        <Button variant="ghost" onClick={onClose} disabled={isCancelling}>
                            Go Back
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleConfirmCancel}
                            disabled={isCancelling}
                            className="gap-2"
                        >
                            {isCancelling ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <Wallet className="h-4 w-4" />
                            )}
                            {isCancelling ? "Processing..." : "Yes, Cancel & Refund"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        );
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // VARIANT 3b: COD / No Wallet Refund
    // ═══════════════════════════════════════════════════════════════════════════
    return (
        <Dialog open={isOpen} onOpenChange={isCancelling ? undefined : onClose}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader className="items-center text-center">
                    <div className="mx-auto h-14 w-14 rounded-full bg-red-100 flex items-center justify-center mb-2">
                        <XCircle className="h-7 w-7 text-red-500" />
                    </div>
                    <DialogTitle>Cancel Order</DialogTitle>
                    <DialogDescription className="text-center">
                        Are you sure you want to cancel this order?
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-3">
                    <p className="text-sm text-center text-muted-foreground">
                        AWB #: <span className="font-mono font-medium text-foreground">{shipment.awb}</span>
                    </p>

                    <div className="bg-muted/50 border rounded-lg p-3 space-y-1 text-sm text-center">
                        <p className="text-muted-foreground">
                            Payment Mode: <span className="font-medium text-foreground capitalize">{shipment.paymentMode === "cod" ? "Cash on Delivery (COD)" : shipment.paymentMode}</span>
                        </p>
                        <p className="text-muted-foreground">No wallet deduction was made for this order.</p>
                        <p className="text-muted-foreground">No refund will be processed.</p>
                    </div>

                    <div className="flex items-start gap-2 text-xs text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg p-2.5">
                        <AlertTriangle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                        <p>Once cancelled, this action cannot be undone.</p>
                    </div>
                </div>

                <DialogFooter className="gap-2 sm:gap-0">
                    <Button variant="ghost" onClick={onClose} disabled={isCancelling}>
                        Go Back
                    </Button>
                    <Button
                        variant="destructive"
                        onClick={handleConfirmCancel}
                        disabled={isCancelling}
                        className="gap-2"
                    >
                        {isCancelling ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            <XCircle className="h-4 w-4" />
                        )}
                        {isCancelling ? "Processing..." : "Yes, Cancel Order"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export { CancelShipmentDialog, CANCELLABLE_STATUSES };
export type { ShipmentForCancel };
