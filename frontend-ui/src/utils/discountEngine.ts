/**
 * FastFare Auto Promo Discount Engine
 * 
 * RULE: Every order automatically receives a promotional discount
 * such that the final payable amount is always exactly ₹500.
 * No promo code required — 100% automatic.
 * 
 * Formula:
 *   D = T − 500   (discount)
 *   F = 500        (final payable, always fixed)
 * 
 * Edge cases:
 *   T <= 500 → No discount, final = T
 *   T >  500 → Discount = T − 500, final = 500
 */

export interface DiscountResult {
    grossTotal: number;
    discount: number;
    finalPayable: number;
    promoType: 'AUTO_APPLIED' | 'NONE';
}

export function calculateAutoDiscount(grossTotal: number): DiscountResult {
    if (grossTotal <= 500) {
        return {
            grossTotal,
            discount: 0,
            finalPayable: grossTotal,
            promoType: 'NONE',
        };
    }
    const discount = Math.round((grossTotal - 500) * 100) / 100;
    return {
        grossTotal,
        discount,
        finalPayable: 500,
        promoType: 'AUTO_APPLIED',
    };
}

/**
 * Calculate the full invoice breakdown from a base fare.
 */
export interface InvoiceBreakdown {
    baseFare: number;
    platformFee: number;      // 20% of base fare
    commission: number;        // 16% of base fare
    fixedFee: number;          // ₹120 always
    grossTotal: number;        // sum of above
    discount: number;          // auto promo discount
    finalPayable: number;      // always ₹500 when grossTotal > 500
    promoType: 'AUTO_APPLIED' | 'NONE';
}

export function calculateInvoiceBreakdown(baseFare: number): InvoiceBreakdown {
    const platformFee = Math.round(baseFare * 0.20 * 100) / 100;
    const commission = Math.round(baseFare * 0.16 * 100) / 100;
    const fixedFee = 120;
    const grossTotal = Math.round((baseFare + platformFee + commission + fixedFee) * 100) / 100;

    const { discount, finalPayable, promoType } = calculateAutoDiscount(grossTotal);

    return {
        baseFare,
        platformFee,
        commission,
        fixedFee,
        grossTotal,
        discount,
        finalPayable,
        promoType,
    };
}
