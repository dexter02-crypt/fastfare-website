/**
 * FastFare Invoice Utilities
 * Single source of truth for all invoice calculations, data, and formatting.
 */

// ─── Indian State Code Lookup ───
export const STATE_CODE_MAP: Record<string, string> = {
  'Andhra Pradesh': '37', 'Arunachal Pradesh': '12', 'Assam': '18',
  'Bihar': '10', 'Chhattisgarh': '22', 'Goa': '30',
  'Gujarat': '24', 'Haryana': '06', 'Himachal Pradesh': '02',
  'Jharkhand': '20', 'Karnataka': '29', 'Kerala': '32',
  'Madhya Pradesh': '23', 'Maharashtra': '27', 'Manipur': '14',
  'Meghalaya': '17', 'Mizoram': '15', 'Nagaland': '13',
  'Odisha': '21', 'Punjab': '03', 'Rajasthan': '08',
  'Sikkim': '11', 'Tamil Nadu': '33', 'Telangana': '36',
  'Tripura': '16', 'Uttar Pradesh': '09', 'Uttarakhand': '05',
  'West Bengal': '19', 'Delhi': '07', 'New Delhi': '07',
  'Jammu and Kashmir': '01', 'Ladakh': '38',
  'Andaman and Nicobar Islands': '35', 'Chandigarh': '04',
  'Dadra and Nagar Haveli and Daman and Diu': '26',
  'Lakshadweep': '31', 'Puducherry': '34',
};

const STATE_NAME_FROM_CODE: Record<string, string> = Object.fromEntries(
  Object.entries(STATE_CODE_MAP).map(([name, code]) => [code, name])
);

// ─── FastFare Company Registration Details ───
// TODO: Replace with FastFare's actual registered PAN and GSTIN before going live
export const FASTFARE_COMPANY_CONFIG = {
  companyName: 'FastFare Logistics Pvt Ltd',
  companyAddress: 'Plot No. 123, Sector 44, Gurugram',
  companyCity: 'Gurugram',
  companyState: 'Haryana',
  companyStateCode: '06',
  companyPIN: '122003',
  // TODO: Replace with FastFare's actual registered PAN before going live
  companyPAN: 'AABCF1234A',
  // TODO: Replace with FastFare's actual registered GSTIN before going live
  companyGSTIN: '06AABCF1234A1Z5',
  companyPhone: '+91 1800-XXX-XXXX',
  companyEmail: 'support@fastfare.in',
  companySACCode: '996812',
  bankAccountName: 'FastFare Logistics Pvt Ltd',
  // Bank details — update when ready
  bankAccountNumber: '',
  bankIFSC: '',
  bankName: '',
  bankContactNote: 'Available on request — contact billing@fastfare.in',
};

// ─── Customer Profile Interface ───
export interface CustomerProfile {
  businessName?: string;
  contactPerson?: string;
  email?: string;
  phone?: string;
  gstin?: string;
  pan?: string;
  address?: string;
  city?: string;
  state?: string;
  stateCode?: string;
  pinCode?: string;
}

// ─── Invoice Shipment Interface ───
export interface InvoiceShipment {
  awb?: string;
  _id?: string;
  shippingCost?: number;
  shippingFee?: number;
  totalValue?: number;
  codAmount?: number;
  paymentMode?: string;
  serviceType?: string;
  carrier?: string;
  codFee?: number;
  rto_charge?: number;
  totalTax?: number;
  totalAmount?: number;
  invoiceNumber?: string;
  packages?: Array<{ name?: string; weight?: number; quantity?: number; value?: number }>;
  pickup?: { city?: string; state?: string; pincode?: string; address?: string };
  delivery?: { city?: string; state?: string; pincode?: string; name?: string };
  createdAt?: string;
  status?: string;
  platformFee?: number;
  promoCode?: string;
  discountApplied?: number;
}

// ─── Invoice Charges Result ───
export interface InvoiceCharges {
  forwardCharge: number;
  rtoCharge: number;
  codFee: number;
  totalTaxableAmount: number;
  igstRate: number;
  igstAmount: number;
  finalAmount: number;
  amountInWords: string;
}

// ─── Invoice Line Item ───
export interface InvoiceLineItem {
  description: string;
  subDescription: string;
  hsnSac: string;
  qty: number;
  amount: number;
}

// ═══════════════════════════════════════════
// CORE CALCULATION FUNCTION — single source of truth
// ═══════════════════════════════════════════
export function calculateInvoiceCharges(shipment: InvoiceShipment): InvoiceCharges {
  const forwardCharge = shipment.shippingFee || shipment.shippingCost || 0;
  const rtoCharge = shipment.rto_charge || 0;
  const isCOD = (shipment.paymentMode || '').toLowerCase() === 'cod';
  const codFee = isCOD ? (shipment.codFee || 50) : 0;

  const totalTaxableAmount = forwardCharge + rtoCharge + codFee;
  const igstRate = 18;
  const igstAmount = Math.round(totalTaxableAmount * 0.18 * 100) / 100;
  const finalAmount = Math.round((totalTaxableAmount + igstAmount) * 100) / 100;
  const amountInWords = amountToWordsINR(finalAmount);

  return {
    forwardCharge,
    rtoCharge,
    codFee,
    totalTaxableAmount,
    igstRate,
    igstAmount,
    finalAmount,
    amountInWords,
  };
}

// ═══════════════════════════════════════════
// INVOICE NUMBER — deterministic from AWB
// ═══════════════════════════════════════════
export function getInvoiceNumber(shipment: InvoiceShipment): string {
  return `FF-INV-${shipment.awb || shipment._id || 'UNKNOWN'}`;
}

// ═══════════════════════════════════════════
// LINE ITEMS — build from shipment data
// ═══════════════════════════════════════════
export function getInvoiceLineItems(shipment: InvoiceShipment, charges: InvoiceCharges): InvoiceLineItem[] {
  const items: InvoiceLineItem[] = [];
  const serviceLabel = shipment.serviceType
    ? shipment.serviceType.charAt(0).toUpperCase() + shipment.serviceType.slice(1)
    : 'Express';

  // Row 1 — Delivery Fare (always present)
  items.push({
    description: `Delivery Fare — ${serviceLabel} Delivery`,
    subDescription: `Carrier: ${shipment.carrier || 'FastFare'} | AWB: ${shipment.awb || '—'}`,
    hsnSac: '996812',
    qty: 1,
    amount: charges.forwardCharge,
  });

  // Row 2 — COD Fee (only if applicable)
  if (charges.codFee > 0) {
    items.push({
      description: 'COD Handling Fee',
      subDescription: 'Cash on Delivery collection charge',
      hsnSac: '996812',
      qty: 1,
      amount: charges.codFee,
    });
  }

  // Row 3 — RTO Charge (only if applicable)
  if (charges.rtoCharge > 0) {
    items.push({
      description: 'RTO Charge',
      subDescription: 'Return to Origin processing fee',
      hsnSac: '996812',
      qty: 1,
      amount: charges.rtoCharge,
    });
  }

  return items;
}

// ═══════════════════════════════════════════
// PLACE OF SUPPLY — from stateCode or delivery state
// ═══════════════════════════════════════════
export function getPlaceOfSupply(customer: CustomerProfile, shipment: InvoiceShipment): string {
  // Prefer customer's stateCode from Organization Settings
  if (customer.stateCode) {
    const stateName = STATE_NAME_FROM_CODE[customer.stateCode] || customer.state || '';
    return `${customer.stateCode} — ${stateName}`;
  }
  // Derive from delivery address state name
  const stateName = shipment.delivery?.state || shipment.pickup?.state || '';
  if (stateName) {
    const code = STATE_CODE_MAP[stateName];
    if (code) return `${code} — ${stateName}`;
    return stateName;
  }
  return 'N/A';
}

// ═══════════════════════════════════════════
// PROFILE COMPLETENESS CHECK
// ═══════════════════════════════════════════
export function getProfileWarning(customer: CustomerProfile): string | null {
  const missing: string[] = [];
  if (!customer.gstin) missing.push('GSTIN');
  if (!customer.pan) missing.push('PAN');
  if (missing.length === 0) return null;
  return `⚠️ Your organization profile is incomplete. Please update your ${missing.join(' and ')} in Settings → Organization to ensure this invoice is valid for GST filing.`;
}

// ═══════════════════════════════════════════
// AMOUNT TO WORDS — Indian currency (Rupees and Paise)
// ═══════════════════════════════════════════
function numberToWordsIndian(num: number): string {
  if (num === 0) return 'Zero';
  const ones = [
    '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten',
    'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen',
  ];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  if (num < 20) return ones[num];
  if (num < 100) return tens[Math.floor(num / 10)] + (num % 10 ? ' ' + ones[num % 10] : '');
  if (num < 1000) return ones[Math.floor(num / 100)] + ' Hundred' + (num % 100 ? ' and ' + numberToWordsIndian(num % 100) : '');
  if (num < 100000) return numberToWordsIndian(Math.floor(num / 1000)) + ' Thousand' + (num % 1000 ? ' ' + numberToWordsIndian(num % 1000) : '');
  if (num < 10000000) return numberToWordsIndian(Math.floor(num / 100000)) + ' Lakh' + (num % 100000 ? ' ' + numberToWordsIndian(num % 100000) : '');
  return numberToWordsIndian(Math.floor(num / 10000000)) + ' Crore' + (num % 10000000 ? ' ' + numberToWordsIndian(num % 10000000) : '');
}

export function amountToWordsINR(amount: number): string {
  const rupees = Math.floor(amount);
  const paise = Math.round((amount - rupees) * 100);

  let result = 'INR ' + numberToWordsIndian(rupees) + ' Rupees';
  if (paise > 0) {
    result += ' and ' + numberToWordsIndian(paise) + ' Paise';
  }
  result += ' Only';
  return result;
}
