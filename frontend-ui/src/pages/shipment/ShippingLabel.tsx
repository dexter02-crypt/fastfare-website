import { forwardRef, useEffect, useRef, useCallback } from "react";

export interface LabelData {
    orderId: string;
    awbNumber: string;
    createdAt: string;
    paymentMode: string;
    codAmount?: number;
    totalWeight: number;
    dimensions: string;
    carrier: string;
    serviceType: string;
    pickup: {
        name: string;
        address: string;
        phone: string;
        pincode: string;
    };
    delivery: {
        name: string;
        address: string;
        phone: string;
        pincode: string;
    };
    products: Array<{
        name: string;
        sku: string;
        qty: number;
        price: number;
    }>;
}

// ─── CODE128 Barcode Encoding ───
const CODE128_START_B = 104;
const CODE128_STOP = 106;
const CODE128_PATTERNS: number[][] = [
    [2, 1, 2, 2, 2, 2], [2, 2, 2, 1, 2, 2], [2, 2, 2, 2, 2, 1], [1, 2, 1, 2, 2, 3], [1, 2, 1, 3, 2, 2],
    [1, 3, 1, 2, 2, 2], [1, 2, 2, 2, 1, 3], [1, 2, 2, 3, 1, 2], [1, 3, 2, 2, 1, 2], [2, 2, 1, 2, 1, 3],
    [2, 2, 1, 3, 1, 2], [2, 3, 1, 2, 1, 2], [1, 1, 2, 2, 3, 2], [1, 2, 2, 1, 3, 2], [1, 2, 2, 2, 3, 1],
    [1, 1, 3, 2, 2, 2], [1, 2, 3, 1, 2, 2], [1, 2, 3, 2, 2, 1], [2, 2, 3, 2, 1, 1], [2, 2, 1, 1, 3, 2],
    [2, 2, 1, 2, 3, 1], [2, 1, 3, 2, 1, 2], [2, 2, 3, 1, 1, 2], [3, 1, 2, 1, 3, 1], [3, 1, 1, 2, 2, 2],
    [3, 2, 1, 1, 2, 2], [3, 2, 1, 2, 2, 1], [3, 1, 2, 2, 1, 2], [3, 2, 2, 1, 1, 2], [3, 2, 2, 2, 1, 1],
    [2, 1, 2, 1, 2, 3], [2, 1, 2, 3, 2, 1], [2, 3, 2, 1, 2, 1], [1, 1, 1, 3, 2, 3], [1, 3, 1, 1, 2, 3],
    [1, 3, 1, 3, 2, 1], [1, 1, 2, 3, 1, 3], [1, 3, 2, 1, 1, 3], [1, 3, 2, 3, 1, 1], [2, 1, 1, 3, 1, 3],
    [2, 3, 1, 1, 1, 3], [2, 3, 1, 3, 1, 1], [1, 1, 2, 1, 3, 3], [1, 1, 2, 3, 3, 1], [1, 3, 2, 1, 3, 1],
    [1, 1, 3, 1, 2, 3], [1, 1, 3, 3, 2, 1], [1, 3, 3, 1, 2, 1], [3, 1, 3, 1, 2, 1], [2, 1, 1, 3, 3, 1],
    [2, 3, 1, 1, 3, 1], [2, 1, 3, 1, 1, 3], [2, 1, 3, 3, 1, 1], [2, 1, 3, 1, 3, 1], [3, 1, 1, 1, 2, 3],
    [3, 1, 1, 3, 2, 1], [3, 3, 1, 1, 2, 1], [3, 1, 2, 1, 1, 3], [3, 1, 2, 3, 1, 1], [3, 3, 2, 1, 1, 1],
    [3, 1, 4, 1, 1, 1], [2, 2, 1, 4, 1, 1], [4, 3, 1, 1, 1, 1], [1, 1, 1, 2, 2, 4], [1, 1, 1, 4, 2, 2],
    [1, 2, 1, 1, 2, 4], [1, 2, 1, 4, 2, 1], [1, 4, 1, 1, 2, 2], [1, 4, 1, 2, 2, 1], [1, 1, 2, 2, 1, 4],
    [1, 1, 2, 4, 1, 2], [1, 2, 2, 1, 1, 4], [1, 2, 2, 4, 1, 1], [1, 4, 2, 1, 1, 2], [1, 4, 2, 2, 1, 1],
    [2, 4, 1, 2, 1, 1], [2, 2, 1, 1, 1, 4], [4, 1, 3, 1, 1, 1], [2, 4, 1, 1, 1, 2], [1, 3, 4, 1, 1, 1],
    [1, 1, 1, 2, 4, 2], [1, 2, 1, 1, 4, 2], [1, 2, 1, 2, 4, 1], [1, 1, 4, 2, 1, 2], [1, 2, 4, 1, 1, 2],
    [1, 2, 4, 2, 1, 1], [4, 1, 1, 2, 1, 2], [4, 2, 1, 1, 1, 2], [4, 2, 1, 2, 1, 1], [2, 1, 2, 1, 4, 1],
    [2, 1, 4, 1, 2, 1], [4, 1, 2, 1, 2, 1], [1, 1, 1, 1, 4, 3], [1, 1, 1, 3, 4, 1], [1, 3, 1, 1, 4, 1],
    [1, 1, 4, 1, 1, 3], [1, 1, 4, 3, 1, 1], [4, 1, 1, 1, 1, 3], [4, 1, 1, 3, 1, 1], [1, 1, 3, 1, 4, 1],
    [1, 1, 4, 1, 3, 1], [3, 1, 1, 1, 4, 1], [4, 1, 1, 1, 3, 1], [2, 1, 1, 4, 1, 2], [2, 1, 1, 2, 1, 4],
    [2, 1, 1, 2, 3, 2], [2, 3, 3, 1, 1, 1, 2]
];

function encodeCode128B(text: string): number[][] {
    const codes: number[] = [CODE128_START_B];
    let checksum = CODE128_START_B;
    for (let i = 0; i < text.length; i++) {
        const code = text.charCodeAt(i) - 32;
        codes.push(code);
        checksum += code * (i + 1);
    }
    codes.push(checksum % 103);
    codes.push(CODE128_STOP);
    return codes.map(c => CODE128_PATTERNS[c]);
}

function drawBarcode(canvas: HTMLCanvasElement, text: string, width: number, height: number) {
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = width;
    canvas.height = height;
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, width, height);

    const patterns = encodeCode128B(text);
    // Calculate total modules
    let totalModules = 0;
    patterns.forEach(p => p.forEach(m => totalModules += m));
    // Add quiet zones (10 modules each side)
    totalModules += 20;

    const moduleWidth = width / totalModules;
    let x = 10 * moduleWidth; // quiet zone
    ctx.fillStyle = "#000";

    patterns.forEach(pattern => {
        for (let i = 0; i < pattern.length; i++) {
            if (i % 2 === 0) {
                // bar
                ctx.fillRect(Math.round(x), 0, Math.ceil(pattern[i] * moduleWidth), height);
            }
            x += pattern[i] * moduleWidth;
        }
    });
}

// ─── Barcode Component ───
const Barcode = ({ value, width = 280, height = 50 }: { value: string; width?: number; height?: number }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        if (canvasRef.current && value) {
            drawBarcode(canvasRef.current, value, width, height);
        }
    }, [value, width, height]);

    return (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
            <canvas ref={canvasRef} style={{ width: `${width}px`, height: `${height}px` }} />
            <span style={{ fontSize: "11px", fontFamily: "monospace", letterSpacing: "2px", marginTop: "2px" }}>{value}</span>
        </div>
    );
};

interface ShippingLabelProps {
    data: LabelData;
}

const ShippingLabel = forwardRef<HTMLDivElement, ShippingLabelProps>(({ data }, ref) => {
    return (
        <div ref={ref} style={{ backgroundColor: "#fff", padding: "16px", maxWidth: "800px", margin: "0 auto", color: "#000", fontFamily: "Arial, Helvetica, sans-serif", boxSizing: "border-box" }}>
            <div style={{ border: "3px solid #000" }}>
                {/* Section 1: Ship To */}
                <div style={{ padding: "8px", borderBottom: "2px solid #000" }}>
                    <p style={{ fontWeight: "bold", fontSize: "13px", marginBottom: "4px" }}>Ship To</p>
                    <div style={{ fontSize: "18px", fontWeight: "bold" }}>{data.delivery.name}</div>
                    <div style={{ fontSize: "13px", whiteSpace: "pre-wrap" }}>{data.delivery.address}</div>
                    <div style={{ fontSize: "13px", fontWeight: "bold", marginTop: "4px" }}>PIN: {data.delivery.pincode}</div>
                    <div style={{ fontSize: "13px", marginTop: "4px" }}>Phone No.: {data.delivery.phone}</div>
                </div>

                {/* Section 2: Shipment Details & Routing */}
                <div style={{ display: "flex", borderBottom: "2px solid #000" }}>
                    {/* Left */}
                    <div style={{ width: "50%", padding: "8px", borderRight: "2px solid #000", fontSize: "13px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                            <span>Dimensions:</span>
                            <span>{data.dimensions}</span>
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between", fontWeight: "bold", marginBottom: "4px" }}>
                            <span>Payment:</span>
                            <span>{data.paymentMode.toUpperCase()}</span>
                        </div>
                        {data.paymentMode === "cod" && (
                            <div style={{ display: "flex", justifyContent: "space-between", fontWeight: "bold", marginBottom: "4px" }}>
                                <span>COD Amount:</span>
                                <span>₹{data.codAmount}</span>
                            </div>
                        )}
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                            <span>Weight:</span>
                            <span>{data.totalWeight} kg</span>
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between" }}>
                            <span>Service:</span>
                            <span>{data.serviceType}</span>
                        </div>
                    </div>

                    {/* Right: Carrier & AWB Barcode */}
                    <div style={{ width: "50%", padding: "8px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                        <div style={{ fontSize: "16px", fontWeight: "bold", marginBottom: "8px" }}>{data.carrier || "FastFare"}</div>
                        <Barcode value={data.awbNumber} width={260} height={48} />
                    </div>
                </div>

                {/* Section 3: Return Address & Order Barcode */}
                <div style={{ display: "flex", borderBottom: "2px solid #000" }}>
                    {/* Left: Return Address */}
                    <div style={{ width: "50%", padding: "8px", borderRight: "2px solid #000", fontSize: "13px" }}>
                        <p style={{ marginBottom: "4px", fontSize: "11px", color: "#666" }}>(If undelivered, return to)</p>
                        <div style={{ fontWeight: "bold", fontStyle: "italic" }}>{data.pickup.name}</div>
                        <div style={{ whiteSpace: "pre-wrap" }}>{data.pickup.address}</div>
                        <div style={{ fontWeight: "bold", marginTop: "4px" }}>{data.pickup.pincode}</div>
                        <div style={{ marginTop: "4px" }}>Phone No.: {data.pickup.phone}</div>
                    </div>

                    {/* Right: Order ID Barcode */}
                    <div style={{ width: "50%", padding: "8px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                        <div style={{ fontSize: "13px", marginBottom: "8px" }}>Order #: {data.orderId}</div>
                        <Barcode value={data.orderId} width={260} height={48} />
                        <div style={{ marginTop: "8px", fontSize: "11px" }}>Invoice Date: {new Date(data.createdAt).toLocaleDateString()}</div>
                    </div>
                </div>

                {/* Section 4: Product Table */}
                <div style={{ borderBottom: "2px solid #000" }}>
                    <table style={{ width: "100%", fontSize: "11px", textAlign: "center", borderCollapse: "collapse" }}>
                        <thead>
                            <tr style={{ fontWeight: "bold", borderBottom: "1px solid #000" }}>
                                <th style={{ padding: "4px", borderRight: "1px solid #000", textAlign: "left", width: "40%" }}>Product Name & SKU</th>
                                <th style={{ padding: "4px", borderRight: "1px solid #000" }}>Qty</th>
                                <th style={{ padding: "4px", borderRight: "1px solid #000" }}>Unit Price</th>
                                <th style={{ padding: "4px" }}>Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data.products.map((product, idx) => (
                                <tr key={idx} style={{ borderBottom: "1px solid #000" }}>
                                    <td style={{ padding: "4px", borderRight: "1px solid #000", textAlign: "left" }}>
                                        <div style={{ fontWeight: "bold" }}>{product.name}</div>
                                        <div style={{ fontSize: "10px", color: "#666" }}>SKU: {product.sku}</div>
                                    </td>
                                    <td style={{ padding: "4px", borderRight: "1px solid #000" }}>{product.qty}</td>
                                    <td style={{ padding: "4px", borderRight: "1px solid #000" }}>₹{product.price}</td>
                                    <td style={{ padding: "4px" }}>₹{product.qty * product.price}</td>
                                </tr>
                            ))}
                            <tr style={{ fontWeight: "bold", backgroundColor: "#f5f5f5" }}>
                                <td style={{ padding: "4px", borderRight: "1px solid #000", textAlign: "right" }} colSpan={3}>Grand Total</td>
                                <td style={{ padding: "4px" }}>₹{data.products.reduce((sum, p) => sum + (p.qty * p.price), 0)}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                {/* Footer */}
                <div style={{ padding: "8px", fontSize: "11px", display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
                    <div style={{ width: "75%" }}>
                        All disputes are subject to local jurisdiction only. Goods once sold will only be taken back or exchanged as per the store's exchange/return policy.
                        <div style={{ marginTop: "8px", fontWeight: "bold" }}>THIS IS AN AUTO-GENERATED LABEL AND DOES NOT NEED SIGNATURE.</div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                        <div style={{ fontSize: "10px", color: "#666" }}>Powered By:</div>
                        <div style={{ fontWeight: "bold", fontSize: "16px", color: "#011E41" }}>FastFare</div>
                    </div>
                </div>
            </div>
        </div>
    );
});

export default ShippingLabel;
