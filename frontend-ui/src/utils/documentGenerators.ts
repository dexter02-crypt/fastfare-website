/**
 * FastFare Document Generators
 * Centralized utility for generating Manifest, Tax Invoice, and Shipping Label HTML.
 * Matches the Shiprocket template style with FastFare branding.
 */

// ─── Masking Helpers ───
export const maskPhone = (phone: string): string => {
  if (!phone || phone.length < 4) return phone || '—';
  return phone[0] + 'x'.repeat(phone.length - 2) + phone[phone.length - 1];
};

export const maskAmount = (amount: number): string => {
  const str = amount.toLocaleString('en-IN');
  if (str.length <= 2) return '₹' + str;
  return '₹' + str[0] + 'x'.repeat(str.length - 2) + str[str.length - 1];
};

export const maskName = (name: string): string => {
  if (!name || name.length <= 3) return name || '—';
  return name.substring(0, 3) + '...';
};

// ─── Shared Styles ───
const BRAND_COLOR = '#011E41';
const ACCENT_COLOR = '#0066FF';
const FASTFARE_LOGO_SVG = `<svg viewBox="0 0 24 24" width="28" height="28" style="display:inline-block;vertical-align:middle;margin-right:8px;"><path d="M20 8h-3V4H3c-1.1 0-2 .9-2 2v11h2c0 1.66 1.34 3 3 3s3-1.34 3-3h6c0 1.66 1.34 3 3 3s3-1.34 3-3h2v-5l-3-4zM6 18.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm13.5-9l1.96 2.5H17V9.5h2.5zm-1.5 9c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z" fill="${BRAND_COLOR}"/></svg>`;

// ──────────────────────────────────────────────
// MANIFEST GENERATOR
// ──────────────────────────────────────────────
interface ManifestShipment {
  awb?: string;
  orderId?: string;
  _id?: string;
  contentType?: string;
  description?: string;
  delivery?: { name?: string; pincode?: string; city?: string };
  packages?: Array<{ name?: string }>;
}

export const generateManifestHTML = (
  shipments: ManifestShipment[],
  sellerName: string,
  courierName: string = 'FastFare Logistics'
): string => {
  const manifestId = `MFT-${String(Date.now()).slice(-6)}`;
  const now = new Date();
  const dateStr = now.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  const timeStr = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });

  const rows = shipments.map((s, i) => `
    <tr>
      <td style="padding:8px;border:1px solid #ccc;text-align:center">${i + 1}</td>
      <td style="padding:8px;border:1px solid #ccc">${s.orderId || s._id || '—'}</td>
      <td style="padding:8px;border:1px solid #ccc;font-weight:600">${s.awb || '—'}</td>
      <td style="padding:8px;border:1px solid #ccc;text-align:center"><input type="checkbox" /></td>
      <td style="padding:8px;border:1px solid #ccc">${s.description || s.contentType || s.packages?.map(p => p.name).join(', ') || '—'}</td>
      <td style="padding:8px;border:1px solid #ccc;text-align:center">
        <svg id="barcode-${i}"></svg>
      </td>
    </tr>
  `).join('');

  return `<!DOCTYPE html>
<html><head><title>FastFare Manifest - ${manifestId}</title>
<script src="https://cdn.jsdelivr.net/npm/jsbarcode@3.11.6/dist/JsBarcode.all.min.js"><\/script>
<style>
  @media print { body { margin: 0; } @page { margin: 10mm; } }
  * { box-sizing: border-box; }
  body { font-family: 'Segoe UI', Arial, sans-serif; padding: 20px; color: #333; background: #fff; }
  .container { max-width: 900px; margin: 0 auto; }
</style>
</head>
<body>
<div class="container">
  <!-- Header -->
  <div style="display:flex;justify-content:space-between;align-items:flex-start;border-bottom:3px solid ${BRAND_COLOR};padding-bottom:16px;margin-bottom:16px">
    <div>
      <div style="font-size:24px;font-weight:bold;color:${BRAND_COLOR}">${FASTFARE_LOGO_SVG}FastFare</div>
      <div style="font-size:20px;font-weight:600;color:#333;margin-top:4px">Manifest</div>
      <div style="font-size:12px;color:#888;margin-top:4px">Generated on ${dateStr} at ${timeStr}</div>
    </div>
    <div style="text-align:right">
      <div style="font-size:13px"><strong>Manifest ID:</strong> ${manifestId}</div>
      <div style="font-size:13px;margin-top:4px"><strong>Total Shipments:</strong> ${shipments.length}</div>
    </div>
  </div>

  <!-- Seller / Courier Info -->
  <div style="background:#f8f9fa;padding:10px 16px;border-radius:6px;margin-bottom:16px;font-size:13px;display:flex;justify-content:space-between">
    <div><strong>Seller:</strong> ${sellerName}</div>
    <div><strong>Courier:</strong> ${courierName}</div>
  </div>

  <!-- Shipments Table -->
  <table style="width:100%;border-collapse:collapse;font-size:12px">
    <thead>
      <tr style="background:${BRAND_COLOR};color:#fff">
        <th style="padding:10px;border:1px solid #ccc;width:40px">S.No</th>
        <th style="padding:10px;border:1px solid #ccc">Order No</th>
        <th style="padding:10px;border:1px solid #ccc">AWB No</th>
        <th style="padding:10px;border:1px solid #ccc;width:30px">☑</th>
        <th style="padding:10px;border:1px solid #ccc">Contents</th>
        <th style="padding:10px;border:1px solid #ccc;width:160px">Barcode</th>
      </tr>
    </thead>
    <tbody>${rows}</tbody>
  </table>

  <!-- Execution Section -->
  <div style="margin-top:24px;border:2px solid #333;padding:16px">
    <div style="font-weight:bold;font-size:14px;margin-bottom:12px;color:${BRAND_COLOR}">To Be Filled By ${courierName} Executive</div>
    <div style="display:flex;gap:40px">
      <div style="flex:1">
        <div style="margin-bottom:16px;border-bottom:1px dotted #999;padding-bottom:8px">Pick up time: ______________</div>
        <div style="margin-bottom:16px;border-bottom:1px dotted #999;padding-bottom:8px">FE Name: ______________</div>
        <div style="margin-bottom:16px;border-bottom:1px dotted #999;padding-bottom:8px">FE Signature: ______________</div>
        <div style="border-bottom:1px dotted #999;padding-bottom:8px">FE Phone: ______________</div>
      </div>
      <div style="flex:1">
        <div style="margin-bottom:16px;border-bottom:1px dotted #999;padding-bottom:8px">Total items picked: ______________</div>
        <div style="margin-bottom:16px;border-bottom:1px dotted #999;padding-bottom:8px">Seller Name: ${sellerName}</div>
        <div style="border-bottom:1px dotted #999;padding-bottom:8px">Seller Signature: ______________</div>
      </div>
    </div>
  </div>

  <!-- Footer -->
  <div style="margin-top:20px;text-align:center;font-size:10px;color:#999">
    <p>FastFare Logistics Pvt Ltd | support@fastfare.in | +91 1800-XXX-XXXX</p>
    <p>This is a system-generated document.</p>
  </div>
</div>

<script>
  document.addEventListener('DOMContentLoaded', () => {
    ${shipments.map((s, i) => `
      try { JsBarcode('#barcode-${i}', '${s.awb || s._id || 'N/A'}', { width: 1.5, height: 35, fontSize: 10, margin: 2 }); } catch(e) {}
    `).join('')}
  });
<\/script>
</body></html>`;
};


// ──────────────────────────────────────────────
// TAX INVOICE GENERATOR
// ──────────────────────────────────────────────
interface InvoiceUser {
  businessName?: string;
  email?: string;
  phone?: string;
  gstin?: string;
  contactPerson?: string;
}

interface InvoiceShipment {
  awb?: string;
  _id?: string;
  shippingCost?: number;
  totalValue?: number;
  codAmount?: number;
  paymentMode?: string;
  serviceType?: string;
  carrier?: string;
  packages?: Array<{ name?: string; weight?: number; quantity?: number; value?: number }>;
  pickup?: { city?: string; state?: string; pincode?: string; address?: string };
  delivery?: { city?: string; state?: string; pincode?: string; name?: string };
  createdAt?: string;
  status?: string;
  platformFee?: number;
}

function numberToWords(num: number): string {
  if (num === 0) return 'Zero';
  const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten',
    'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
  if (num < 20) return ones[num];
  if (num < 100) return tens[Math.floor(num / 10)] + (num % 10 ? ' ' + ones[num % 10] : '');
  if (num < 1000) return ones[Math.floor(num / 100)] + ' Hundred' + (num % 100 ? ' and ' + numberToWords(num % 100) : '');
  if (num < 100000) return numberToWords(Math.floor(num / 1000)) + ' Thousand' + (num % 1000 ? ' ' + numberToWords(num % 1000) : '');
  if (num < 10000000) return numberToWords(Math.floor(num / 100000)) + ' Lakh' + (num % 100000 ? ' ' + numberToWords(num % 100000) : '');
  return numberToWords(Math.floor(num / 10000000)) + ' Crore' + (num % 10000000 ? ' ' + numberToWords(num % 10000000) : '');
}

export const generateTaxInvoiceHTML = (shipment: InvoiceShipment, user: InvoiceUser): string => {
  const invoiceNo = `FF-INV-${String(Date.now()).slice(-8)}`;
  const invoiceDate = new Date(shipment.createdAt || Date.now()).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  const dueDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

  const deliveryFare = shipment.shippingCost || 0;
  const gstRate = 0.18;
  const gstAmount = Math.round(deliveryFare * gstRate * 100) / 100;
  const totalPayable = Math.round((deliveryFare + gstAmount) * 100) / 100;

  // Bug 35 — fix COD invoice status
  const isCOD = shipment.paymentMode === 'cod';
  const isPaid = !isCOD && (shipment.status === 'delivered' || shipment.paymentMode === 'prepaid' || shipment.paymentMode === 'razorpay');
  const invoiceStatus = isCOD ? 'COD' : isPaid ? 'PAID' : 'PENDING';

  const placeOfSupply = shipment.delivery?.state || shipment.pickup?.state || 'Haryana';

  return `<!DOCTYPE html>
<html><head><title>Tax Invoice - ${invoiceNo}</title>
<style>
  @media print { body { margin: 0; } @page { margin: 15mm; } }
  * { box-sizing: border-box; }
  body { font-family: 'Segoe UI', Arial, sans-serif; padding: 24px; color: #333; background: #fff; font-size: 13px; }
  .container { max-width: 800px; margin: 0 auto; border: 1px solid #ddd; }
  .header { display: flex; justify-content: space-between; align-items: flex-start; padding: 20px 24px; border-bottom: 2px solid ${BRAND_COLOR}; }
  .details-grid { display: grid; grid-template-columns: 1fr 1fr; border-bottom: 1px solid #ddd; }
  .details-grid > div { padding: 16px 24px; }
  .details-grid > div:first-child { border-right: 1px solid #ddd; }
  table { width: 100%; border-collapse: collapse; }
  th { background: #f8f9fa; padding: 10px 12px; text-align: left; font-weight: 600; border: 1px solid #ddd; font-size: 11px; }
  td { padding: 10px 12px; border: 1px solid #ddd; font-size: 12px; }
  .total-row td { font-weight: 700; background: #f0f4ff; }
  .footer { padding: 16px 24px; border-top: 1px solid #ddd; }
  .badge { display: inline-block; padding: 4px 16px; border-radius: 4px; font-weight: 700; font-size: 14px; }
  .badge-paid { background: #dcfce7; color: #166534; }
  .badge-unpaid { background: #fef3c7; color: #92400e; }
</style>
</head>
<body>
<div class="container">
  <!-- Header -->
  <div class="header">
    <div>
      <div style="font-size:22px;font-weight:bold;color:${BRAND_COLOR}">${FASTFARE_LOGO_SVG}FastFare</div>
      <div style="margin-top:8px;font-size:11px;color:#666">
        FastFare Logistics Pvt Ltd<br>
        Plot No. 123, Sector 44, Gurugram<br>
        Haryana — 122003, India<br>
        <strong>PAN:</strong> ${user.gstin ? user.gstin.substring(2, 12) : 'N/A'} &nbsp; <strong>GSTIN:</strong> ${user.gstin || 'Not Provided'}
      </div>
    </div>
    <div style="text-align:right">
      <div style="font-size:20px;font-weight:bold;color:${BRAND_COLOR};margin-bottom:8px">TAX INVOICE</div>
      <span class="badge ${invoiceStatus === 'PAID' ? 'badge-paid' : invoiceStatus === 'COD' ? 'badge-paid' : 'badge-unpaid'}" style="${invoiceStatus === 'COD' ? 'background:#dbeafe;color:#1d4ed8' : ''}">${invoiceStatus}</span>
    </div>
  </div>

  <!-- Invoice To / Metadata -->
  <div class="details-grid">
    <div>
      <div style="font-weight:600;margin-bottom:8px;color:${BRAND_COLOR}">Invoice To</div>
      <div style="font-weight:600;font-size:14px">${user.businessName || user.contactPerson || '—'}</div>
      <div style="color:#666;margin-top:4px">
        ${user.email || ''}<br>
        Phone: ${user.phone || '—'}<br>
        ${user.gstin ? `GSTIN: ${user.gstin}` : ''}
      </div>
    </div>
    <div>
      <div style="font-weight:600;margin-bottom:8px;color:${BRAND_COLOR}">Invoice Details</div>
      <table style="border:0;font-size:12px">
        <tr><td style="border:0;padding:2px 8px 2px 0;font-weight:600">Invoice No:</td><td style="border:0;padding:2px 0">${invoiceNo}</td></tr>
        <tr><td style="border:0;padding:2px 8px 2px 0;font-weight:600">Date:</td><td style="border:0;padding:2px 0">${invoiceDate}</td></tr>
        <tr><td style="border:0;padding:2px 8px 2px 0;font-weight:600">Due Date:</td><td style="border:0;padding:2px 0">${dueDate}</td></tr>
        <tr><td style="border:0;padding:2px 8px 2px 0;font-weight:600">AWB:</td><td style="border:0;padding:2px 0">${shipment.awb || '—'}</td></tr>
        <tr><td style="border:0;padding:2px 8px 2px 0;font-weight:600">Place of Supply:</td><td style="border:0;padding:2px 0">${placeOfSupply}</td></tr>
        <tr><td style="border:0;padding:2px 8px 2px 0;font-weight:600">Reverse Charge:</td><td style="border:0;padding:2px 0">No</td></tr>
      </table>
    </div>
  </div>

  <!-- Items Table -->
  <div style="padding:0 24px 16px">
    <table style="margin-top:16px; width: 100%; border-collapse: collapse; font-size: 11px;">
      <thead>
        <tr style="background:#f8f9fa;">
          <th style="width:30px; text-align:center;">#</th>
          <th style="text-align:left;">Description</th>
          <th style="width:40px; text-align:center;">Qty</th>
          <th style="width:70px; text-align:center;">HSN/SAC</th>
          <th style="width:100px; text-align:right;">Amount (₹)</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td style="text-align:center;">1</td>
          <td>
            <strong>Delivery Fare — ${shipment.serviceType ? shipment.serviceType.charAt(0).toUpperCase() + shipment.serviceType.slice(1) : 'Express'} Delivery</strong><br>
            <span style="color:#888;font-size:10px">Carrier: ${shipment.carrier || 'FastFare'} | AWB: ${shipment.awb || '—'}</span>
          </td>
          <td style="text-align:center;">1</td>
          <td style="text-align:center;">996812</td>
          <td style="text-align:right;">${deliveryFare.toFixed(2)}</td>
        </tr>
      </tbody>
    </table>

    <div style="display:flex; justify-content: flex-end; margin-top:24px;">
      <div style="width: 380px; border: 1px solid #ddd; border-radius: 6px; overflow: hidden;">
        <div style="background: ${BRAND_COLOR}; color: white; padding: 10px 16px; font-weight: bold; font-size: 13px;">
          💰 Invoice Summary
        </div>
        <table style="border:0; width: 100%; font-size: 12px; margin:0;">
          <tr>
            <td style="padding:8px 16px; border:0; border-bottom:1px solid #eee;">Delivery Fare</td>
            <td style="padding:8px 16px; text-align:right; border:0; border-bottom:1px solid #eee;">₹${deliveryFare.toFixed(2)}</td>
          </tr>
          <tr>
            <td style="padding:8px 16px; border:0; border-bottom:1px solid #eee;">Taxes (GST @18%)</td>
            <td style="padding:8px 16px; text-align:right; border:0; border-bottom:1px solid #eee;">₹${gstAmount.toFixed(2)}</td>
          </tr>
          <tr style="background: #f0f4ff;">
            <td style="padding:12px 16px; border:0; font-weight:bold; color: ${BRAND_COLOR}; font-size: 14px;">TOTAL PAYABLE</td>
            <td style="padding:12px 16px; text-align:right; border:0; font-weight:bold; color: ${BRAND_COLOR}; font-size: 14px;">₹${totalPayable.toFixed(2)}</td>
          </tr>
        </table>
      </div>
    </div>

    <div style="margin-top:12px; text-align:right; font-size:11px; color:#888;">
      INR ${numberToWords(Math.round(totalPayable))} Only
    </div>

    <div style="margin-top:16px; font-size:11px; color:#666;">
      <p style="margin:2px 0;"><strong>Note:</strong></p>
      <p style="margin:2px 0;">GST @18% charged on delivery fare as per applicable tax regulations.</p>
      <p style="margin:2px 0;">GSTIN: ${user.gstin || 'Not Provided'} | SAC: 996812</p>
      ${isCOD ? '<p style="margin:2px 0;">Payment mode: Cash on Delivery — Amount collected at delivery.</p>' : ''}
    </div>

    <!-- Amount Due -->
    <div style="margin-top:20px;padding:12px 16px;background:#f8f9fa;border-left:4px solid ${invoiceStatus === 'PAID' ? '#10b981' : invoiceStatus === 'COD' ? '#3b82f6' : '#f59e0b'};border-radius:4px;display:flex;justify-content:space-between;align-items:center">
      <div style="font-weight:600; font-size: 14px; display: flex; align-items: center; gap: 8px;">
        ${isCOD ? 'Payment Mode' : 'Amount Due'}
        <span class="badge ${invoiceStatus === 'PAID' ? 'badge-paid' : invoiceStatus === 'COD' ? 'badge-paid' : 'badge-unpaid'}" style="font-size: 11px; padding: 2px 8px; ${invoiceStatus === 'COD' ? 'background:#dbeafe;color:#1d4ed8' : ''}">${invoiceStatus}</span>
      </div>
      <div style="font-size:${isCOD ? '13' : '18'}px;font-weight:bold;color:${invoiceStatus === 'PAID' ? '#166534' : invoiceStatus === 'COD' ? '#1d4ed8' : '#92400e'}">${isCOD ? 'Cash on Delivery — Collected at delivery' : isPaid ? '₹0.00' : '₹' + totalPayable.toFixed(2)}</div>
    </div>
  </div>

  <!-- Bank Details -->
  <div class="footer">
    <div style="font-weight:600;margin-bottom:8px;color:${BRAND_COLOR}">Bank & Commercial Details</div>
    <table style="font-size:12px;border:0;width:auto">
      <tr><td style="border:0;padding:2px 16px 2px 0;color:#666">Account Name:</td><td style="border:0;padding:2px 0">FastFare Logistics Pvt Ltd</td></tr>
      <tr><td style="border:0;padding:2px 16px 2px 0;color:#666">Account No:</td><td style="border:0;padding:2px 0">Contact billing@fastfare.in</td></tr>
      <tr><td style="border:0;padding:2px 16px 2px 0;color:#666">IFSC Code:</td><td style="border:0;padding:2px 0">Contact billing@fastfare.in</td></tr>
      <tr><td style="border:0;padding:2px 16px 2px 0;color:#666">Bank Name:</td><td style="border:0;padding:2px 0">Contact billing@fastfare.in</td></tr>
    </table>
    <div style="margin-top:24px;text-align:right">
      <div style="font-size:11px;color:#888">For FastFare Logistics Pvt Ltd</div>
      <div style="margin-top:32px;font-weight:600;font-size:12px">Authorized Signatory</div>
    </div>
    <div style="margin-top:16px;text-align:center;font-size:10px;color:#aaa;border-top:1px solid #eee;padding-top:12px">
      This is a computer-generated invoice and does not require a physical signature.
    </div>
  </div>
</div>
</body></html>`;
};


// ──────────────────────────────────────────────
// SHIPPING LABEL GENERATOR (with masking)
// ──────────────────────────────────────────────
interface LabelShipment {
  awb?: string;
  _id?: string;
  orderId?: string;
  paymentMode?: string;
  serviceType?: string;
  carrier?: string;
  codAmount?: number;
  totalWeight?: number;
  shippingCost?: number;
  delivery?: { name?: string; address?: string; city?: string; state?: string; pincode?: string; phone?: string };
  pickup?: { name?: string; address?: string; city?: string; state?: string; pincode?: string; phone?: string };
  packages?: Array<{ name?: string; weight?: number; quantity?: number; value?: number; length?: number; width?: number; height?: number; _id?: string; id?: string }>;
  createdAt?: string;
}

export const generateShippingLabelHTML = (shipment: LabelShipment, masked: boolean = true, qrDataURL?: string): string => {
  const awb = shipment.awb || shipment._id || 'N/A';
  const packages = shipment.packages || [];
  const totalWeight = shipment.totalWeight || packages.reduce((s, p) => s + ((p.weight || 0) * (p.quantity || 1)), 0);
  const dims = packages.length > 0
    ? `${packages[0].length || 0}×${packages[0].width || 0}×${packages[0].height || 0} cm`
    : '—';

  // Bug 4 — Show full phone numbers (no masking on label)
  const deliveryPhone = shipment.delivery?.phone || '—';
  const pickupPhone = shipment.pickup?.phone || '—';

  // Bug 5 — Date helper: "09 Mar 2026"
  const formatLabelDate = (dateInput: string | number | Date) => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const d = new Date(dateInput);
    return String(d.getDate()).padStart(2, '0') + ' ' + months[d.getMonth()] + ' ' + d.getFullYear();
  };

  // Bug 2 — Show real prices, not XXXXX
  let grandTotal = 0;
  const productRows = packages.map((pkg) => {
    const sku = `SKU-${(pkg._id || pkg.id || '000').toString().slice(-8).toUpperCase()}`;
    const qty = pkg.quantity || 1;
    const displayName = pkg.name || 'Package';  // Bug 3 — full name, no truncation
    const unitPrice = pkg.value || 0;
    const lineTotal = unitPrice * qty;
    grandTotal += lineTotal;
    return `
      <tr style="border-bottom:1px solid #000">
        <td style="padding:4px;border-right:1px solid #000;text-align:left;white-space:normal;word-wrap:break-word;word-break:break-word;overflow:visible;max-width:200px">
          <div style="font-weight:bold">${displayName}</div>
          <div style="font-size:10px;color:#666">SKU: ${sku}</div>
        </td>
        <td style="padding:4px;border-right:1px solid #000">${qty}</td>
        <td style="padding:4px;border-right:1px solid #000">₹${unitPrice}</td>
        <td style="padding:4px">₹${lineTotal}</td>
      </tr>
    `;
  }).join('');

  const invoiceDate = formatLabelDate(shipment.createdAt || Date.now());
  const serviceType = (shipment.serviceType || 'standard').charAt(0).toUpperCase() + (shipment.serviceType || 'standard').slice(1);
  const carrier = shipment.carrier || 'FastFare';

  // Bug 2 — COD / Prepaid footer
  const codFooter = (shipment.paymentMode || '').toLowerCase() === 'cod'
    ? `<strong style="color:red;font-size:12px">COD: ₹${shipment.codAmount || 0}</strong>`
    : `<strong style="color:green;font-size:12px">PREPAID</strong>`;

  // Bug 1 — QR code section (embedded as img from backend data URL)
  const qrSection = qrDataURL ? `
    <div style="text-align:center; margin-top:6px;">
      <img src="${qrDataURL}" style="width:100px; height:100px;" />
      <p style="font-size:9px; margin:3px 0 0; color:#333;">Scan to confirm pickup</p>
    </div>
  ` : '';

  return `<!DOCTYPE html>
<html><head><title>Shipping Label - ${awb}</title>
<script src="https://cdn.jsdelivr.net/npm/jsbarcode@3.11.6/dist/JsBarcode.all.min.js"><\/script>
<style>
@media print { body { margin: 0; } @page { margin: 10mm; } }
body { font-family: Arial, Helvetica, sans-serif; padding: 16px; color: #000; background: #fff; }
.label { border: 3px solid #000; max-width: 760px; margin: 0 auto; }
.section { padding: 8px; border-bottom: 2px solid #000; }
.flex { display: flex; }
.half { width: 50%; padding: 8px; }
.half-left { border-right: 2px solid #000; }
.barcode-container { text-align: center; }
.barcode-container svg { max-width: 280px; height: auto; }
table { width: 100%; font-size: 11px; text-align: center; border-collapse: collapse; }
th { font-weight: bold; padding: 4px; border-bottom: 1px solid #000; }
.footer { padding: 8px; font-size: 11px; display: flex; justify-content: space-between; align-items: flex-end; }
</style>
</head>
<body>
<div class="label">
<!-- FastFare Header -->
<div style="padding:6px 12px;background:${BRAND_COLOR};color:#fff;display:flex;justify-content:space-between;align-items:center">
  <div style="font-size:16px;font-weight:bold">
    <svg viewBox="0 0 24 24" width="18" height="18" style="display:inline-block;vertical-align:middle;margin-right:6px"><path d="M20 8h-3V4H3c-1.1 0-2 .9-2 2v11h2c0 1.66 1.34 3 3 3s3-1.34 3-3h6c0 1.66 1.34 3 3 3s3-1.34 3-3h2v-5l-3-4zM6 18.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm13.5-9l1.96 2.5H17V9.5h2.5zm-1.5 9c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z" fill="#fff"/></svg>
    FastFare
  </div>
  <div style="font-size:11px">${invoiceDate}</div>
</div>

<!-- Ship To -->
<div class="section">
  <p style="font-weight:bold;font-size:13px;margin:0 0 4px">Ship To</p>
  <div style="font-size:18px;font-weight:bold">${shipment.delivery?.name || '—'}</div>
  <div style="font-size:13px">${shipment.delivery?.address || ''}</div>
  <div style="font-size:13px">${shipment.delivery?.city || ''}, ${shipment.delivery?.state || ''}</div>
  <div style="font-size:13px;font-weight:bold;margin-top:4px">PIN: ${shipment.delivery?.pincode || '—'}</div>
  <div style="font-size:13px;margin-top:4px">Phone No.: ${deliveryPhone}</div>
</div>

<!-- Details & AWB Barcode + QR -->
<div class="flex" style="border-bottom:2px solid #000">
  <div class="half half-left" style="font-size:13px">
    <div style="display:flex;justify-content:space-between;margin-bottom:4px"><span>Dimensions:</span><span>${dims}</span></div>
    <div style="display:flex;justify-content:space-between;font-weight:bold;margin-bottom:4px"><span>Payment:</span><span>${(shipment.paymentMode || 'prepaid').toUpperCase()}</span></div>
    <div style="display:flex;justify-content:space-between;margin-bottom:4px"><span>Weight:</span><span>${totalWeight} kg</span></div>
    <div style="display:flex;justify-content:space-between"><span>Service:</span><span>${serviceType}</span></div>
  </div>
  <div class="half" style="text-align:center">
    <div style="font-size:16px;font-weight:bold;margin-bottom:8px">${carrier}</div>
    <div class="barcode-container"><svg id="barcode-awb"></svg></div>
    ${qrSection}
  </div>
</div>

<!-- Return Address (Bug 6 — removed MongoDB _id barcode) -->
<div class="flex" style="border-bottom:2px solid #000">
  <div class="half half-left" style="font-size:13px">
    <p style="font-size:11px;color:#666;margin:0 0 4px">(If undelivered, return to)</p>
    <div style="font-weight:bold;font-style:italic">${shipment.pickup?.name || '—'}</div>
    <div>${shipment.pickup?.address || ''}</div>
    <div>${shipment.pickup?.city || ''}, ${shipment.pickup?.state || ''}</div>
    <div style="font-weight:bold;margin-top:4px">${shipment.pickup?.pincode || '—'}</div>
    <div style="margin-top:4px">Phone No.: ${pickupPhone}</div>
  </div>
  <div class="half" style="text-align:center;display:flex;flex-direction:column;justify-content:center">
    <div style="font-size:13px">AWB: <strong>${awb}</strong></div>
    <div style="margin-top:8px;font-size:11px">Invoice Date: ${invoiceDate}</div>
  </div>
</div>

<!-- Product Table -->
<div class="section" style="border-bottom:2px solid #000">
  <table>
    <thead>
      <tr style="border-bottom:1px solid #000">
        <th style="text-align:left;border-right:1px solid #000">Product</th>
        <th style="border-right:1px solid #000">Qty</th>
        <th style="border-right:1px solid #000">Price</th>
        <th>Total</th>
      </tr>
    </thead>
    <tbody>
      ${productRows}
      <tr style="font-weight:bold;background:#f5f5f5">
        <td style="padding:4px;text-align:left;border-right:1px solid #000" colspan="3">Grand Total</td>
        <td style="padding:4px">₹${grandTotal}</td>
      </tr>
    </tbody>
  </table>
</div>

<!-- Footer -->
<div class="footer">
  <div style="font-size:10px;color:#888">Powered by FastFare Logistics</div>
  <div style="text-align:right;font-size:10px;color:#888">
    ${codFooter}
  </div>
</div>
</div>

<script>
  document.addEventListener('DOMContentLoaded', () => {
    try { JsBarcode('#barcode-awb', '${awb}', { width: 2, height: 50, fontSize: 12, margin: 4 }); } catch(e) {}
  });
<\/script>
</body></html>`;
};
