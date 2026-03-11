/**
 * Shared status formatting utilities.
 * Bug 22: Replace raw status strings like "partner_assigned" with human-readable labels.
 */

const STATUS_MAP: Record<string, string> = {
    'pending': 'Pending',
    'pending_acceptance': 'Pending Acceptance',
    'partner_assigned': 'Partner Assigned',
    'payment_received': 'Payment Received',
    'in_transit': 'In Transit',
    'out_for_delivery': 'Out for Delivery',
    'picked_up': 'Picked Up',
    'picked_up_by_driver': 'Picked Up',
    'delivered': 'Delivered',
    'returned': 'Returned',
    'cancelled': 'Cancelled',
    'label_generated': 'Label Generated',
};

export function formatStatus(status: string): string {
    if (!status) return '—';
    return STATUS_MAP[status] || status.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

const STATUS_STYLES: Record<string, { background: string; color: string }> = {
    'pending': { background: '#f3f4f6', color: '#6b7280' },
    'pending_acceptance': { background: '#fef3c7', color: '#d97706' },
    'partner_assigned': { background: '#dbeafe', color: '#1d4ed8' },
    'payment_received': { background: '#d1fae5', color: '#065f46' },
    'in_transit': { background: '#e0f2fe', color: '#0369a1' },
    'out_for_delivery': { background: '#d1fae5', color: '#065f46' },
    'picked_up': { background: '#d1fae5', color: '#065f46' },
    'picked_up_by_driver': { background: '#d1fae5', color: '#065f46' },
    'delivered': { background: '#dcfce7', color: '#16a34a' },
    'returned': { background: '#fee2e2', color: '#dc2626' },
    'cancelled': { background: '#f3f4f6', color: '#6b7280' },
    'label_generated': { background: '#f5f3ff', color: '#7c3aed' },
};

export function getStatusStyle(status: string): { background: string; color: string } {
    return STATUS_STYLES[status] || { background: '#f3f4f6', color: '#374151' };
}
