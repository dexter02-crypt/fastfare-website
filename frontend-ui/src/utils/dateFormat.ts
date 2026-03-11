/**
 * Shared date formatting utilities for consistent dates across the app.
 * Bug 19: Replace all toLocaleDateString() with these functions.
 */

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** Format as "09 Mar 2026" */
export function formatDate(dateInput: string | number | Date | undefined | null): string {
    if (!dateInput) return '—';
    const d = new Date(dateInput);
    if (isNaN(d.getTime())) return '—';
    return String(d.getDate()).padStart(2, '0') + ' ' + MONTHS[d.getMonth()] + ' ' + d.getFullYear();
}

/** Format as "09 Mar 2026, 02:30 PM" */
export function formatDateTime(dateInput: string | number | Date | undefined | null): string {
    if (!dateInput) return '—';
    const d = new Date(dateInput);
    if (isNaN(d.getTime())) return '—';
    const time = d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
    return String(d.getDate()).padStart(2, '0') + ' ' + MONTHS[d.getMonth()] + ' ' + d.getFullYear() + ', ' + time;
}
