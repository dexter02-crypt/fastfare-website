/**
 * FastFare Invoice Engine
 * 
 * Calculates delivery invoice with GST @18%.
 * 
 * Formula:
 *   gst_amount   = delivery_fare × 0.18
 *   total_payable = delivery_fare + gst_amount
 */

export interface InvoiceBreakdown {
    deliveryFare: number;      // base shipping cost
    gstRate: number;           // 0.18 (18%)
    gstAmount: number;         // deliveryFare × 0.18
    totalPayable: number;      // deliveryFare + gstAmount
}

export function calculateInvoiceBreakdown(deliveryFare: number): InvoiceBreakdown {
    const gstRate = 0.18;
    const gstAmount = Math.round(deliveryFare * gstRate * 100) / 100;
    const totalPayable = Math.round((deliveryFare + gstAmount) * 100) / 100;

    return {
        deliveryFare,
        gstRate,
        gstAmount,
        totalPayable,
    };
}
