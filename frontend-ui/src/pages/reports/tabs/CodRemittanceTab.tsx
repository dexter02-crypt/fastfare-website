import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Info, Download } from "lucide-react";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";

const CodRemittanceTab = () => {
    // Stubbed data matching user request
    const codData = [
        { id: "1", awb: "FFMM2026001", date: "15 Mar 2026", collected: 1500, freight: 118, fee: 30, net: 1352, partnerRemit: "22 Mar 2026", ffRemit: "24 Mar 2026", bank: "SBI XXXX4231", status: "Remitted" },
        { id: "2", awb: "FFMM2026002", date: "Pending", collected: 899, freight: 95, fee: 30, net: 774, partnerRemit: "-", ffRemit: "-", bank: "HDFC XXXX1122", status: "In Transit" },
        { id: "3", awb: "FFMM2026003", date: "17 Mar 2026", collected: 2500, freight: 200, fee: 50, net: 2250, partnerRemit: "24 Mar 2026", ffRemit: "26 Mar 2026", bank: "SBI XXXX4231", status: "Pending Transfer" },
        { id: "4", awb: "FFMM2026004", date: "Returned", collected: 0, freight: 150, fee: 0, net: 0, partnerRemit: "-", ffRemit: "-", bank: "-", status: "COD Lost" },
    ];

    const getStatusBadge = (status: string) => {
        switch (status) {
            case "Pending Transfer": return <Badge className="bg-orange-100 text-orange-800 hover:bg-orange-100">Pending Transfer</Badge>;
            case "In Transit": return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">In Transit</Badge>;
            case "COD Lost": return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">COD Lost</Badge>;
            case "Remitted": return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Remitted</Badge>;
            default: return <Badge>{status}</Badge>;
        }
    };

    return (
        <div className="space-y-6 mt-6">
            <div>
                <h2 className="text-xl font-bold">COD Remittance Tracker</h2>
                <div className="mt-2 flex items-start gap-2 bg-yellow-50 border border-yellow-200 text-yellow-800 p-3 rounded-md text-sm">
                    <Info className="h-5 w-5 shrink-0 text-yellow-600" />
                    <p>
                        <strong>COD Flow:</strong> Customer pays cash → Partner holds → Partner remits to FastFare D+7 → FastFare deducts freight invoice → FastFare NEFT to your bank account.
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <Card className="border-amber-500 shadow-sm border-t-4">
                    <CardContent className="p-4">
                        <p className="text-xs font-semibold text-muted-foreground mb-1">TOTAL COD ORDERS</p>
                        <p className="text-2xl font-bold">145</p>
                        <p className="text-xs text-muted-foreground mt-1">₹68,450 total</p>
                    </CardContent>
                </Card>
                <Card className="border-green-500 shadow-sm border-t-4">
                    <CardContent className="p-4">
                        <p className="text-xs font-semibold text-muted-foreground mb-1">COD COLLECTED</p>
                        <p className="text-2xl font-bold">110</p>
                        <p className="text-xs text-muted-foreground mt-1">₹45,200</p>
                    </CardContent>
                </Card>
                <Card className="border-blue-500 shadow-sm border-t-4">
                    <CardContent className="p-4">
                        <p className="text-xs font-semibold text-muted-foreground mb-1">PENDING DELIVERY</p>
                        <p className="text-2xl font-bold">25</p>
                        <p className="text-xs text-muted-foreground mt-1">₹18,500</p>
                    </CardContent>
                </Card>
                <Card className="border-red-400 shadow-sm border-t-4">
                    <CardContent className="p-4">
                        <p className="text-xs font-semibold text-muted-foreground mb-1">RTO (COD LOST)</p>
                        <p className="text-2xl font-bold">10</p>
                        <p className="text-xs text-muted-foreground mt-1 text-red-600">₹4,750 not collected</p>
                    </CardContent>
                </Card>
                <Card className="bg-yellow-50 border-yellow-400 shadow-sm border-t-4">
                    <CardContent className="p-4">
                        <p className="text-xs font-semibold text-yellow-800 mb-1">NET TO RECEIVE</p>
                        <p className="text-2xl font-bold text-green-700">₹39,850</p>
                        <p className="text-xs text-yellow-700 mt-1">After freight deduction</p>
                    </CardContent>
                </Card>
            </div>

            <Card className="border shadow-sm overflow-hidden">
                <div className="overflow-x-auto w-full">
                    <Table className="whitespace-nowrap w-max min-w-full">
                        <TableHeader className="bg-muted/50">
                            <TableRow>
                                <TableHead>AWB</TableHead>
                                <TableHead>DELIVERY DATE</TableHead>
                                <TableHead className="text-right">COD COLLECTED</TableHead>
                                <TableHead className="text-right">FREIGHT+GST</TableHead>
                                <TableHead className="text-right">COD FEE</TableHead>
                                <TableHead className="text-right">NET TO YOU</TableHead>
                                <TableHead>PARTNER REMIT BY</TableHead>
                                <TableHead>FF REMIT BY</TableHead>
                                <TableHead>BANK</TableHead>
                                <TableHead>STATUS</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {codData.map((row) => (
                                <TableRow key={row.id}>
                                    <TableCell className="font-mono text-blue-600 hover:underline cursor-pointer">{row.awb}</TableCell>
                                    <TableCell>{row.date}</TableCell>
                                    <TableCell className="text-right">₹{row.collected.toLocaleString()}</TableCell>
                                    <TableCell className="text-right text-red-600 font-medium">-₹{row.freight.toLocaleString()}</TableCell>
                                    <TableCell className="text-right text-red-600 font-medium">-₹{row.fee.toLocaleString()}</TableCell>
                                    <TableCell className="text-right font-bold text-green-600">
                                        {row.status === "COD Lost" ? <span className="text-red-500">₹0 (RTO)</span> : `₹${row.net.toLocaleString()}`}
                                    </TableCell>
                                    <TableCell>{row.partnerRemit}</TableCell>
                                    <TableCell>{row.ffRemit}</TableCell>
                                    <TableCell className="text-muted-foreground text-xs">{row.bank}</TableCell>
                                    <TableCell>{getStatusBadge(row.status)}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                        <tfoot className="bg-slate-900 border-t font-semibold px-4 text-white">
                            <tr>
                                <td colSpan={2} className="py-3 px-4">TOTAL</td>
                                <td className="text-right py-3 px-4">₹4,899</td>
                                <td className="text-right py-3 px-4 text-red-300">-₹563</td>
                                <td className="text-right py-3 px-4 text-red-300">-₹110</td>
                                <td className="text-right py-3 px-4 text-green-400 font-bold">₹4,376</td>
                                <td colSpan={4} className="py-3 px-4"></td>
                            </tr>
                        </tfoot>
                    </Table>
                </div>
            </Card>

            <div className="flex justify-end">
                <Button variant="outline">
                    <Download className="h-4 w-4 mr-2" /> Download COD Report
                </Button>
            </div>
        </div>
    );
};

export default CodRemittanceTab;
