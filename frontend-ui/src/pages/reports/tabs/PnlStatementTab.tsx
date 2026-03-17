import { Card, CardContent } from "@/components/ui/card";
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

const PnlStatementTab = () => {
    const pnlData = [
        { id: "1", awb: "FFMM2026001", date: "13 Mar", rev: 1500, freight: 100, gst: 18, itc: 18, netLog: 100, cogs: null, profit: 1400 },
        { id: "2", awb: "FFMM2026002", date: "15 Mar", rev: 899, freight: 80, gst: 14.4, itc: 14.4, netLog: 80, cogs: null, profit: 819 },
        { id: "3", awb: "FFMM2026003", date: "16 Mar", rev: 2500, freight: 180, gst: 32.4, itc: 32.4, netLog: 180, cogs: null, profit: 2320 },
    ];

    return (
        <div className="space-y-6 mt-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <h2 className="text-xl font-bold">P&amp;L Statement — Last 30 Days</h2>
                <Button className="bg-purple-600 hover:bg-purple-700 text-white w-full sm:w-auto">
                    <Download className="h-4 w-4 mr-2" /> Download P&amp;L
                </Button>
            </div>

            <div className="flex flex-col lg:flex-row gap-6">
                <div className="flex-1 overflow-x-auto">
                    <Card className="border shadow-sm overflow-hidden">
                        <Table className="whitespace-nowrap w-max min-w-full">
                            <TableHeader className="bg-muted/50">
                                <TableRow>
                                    <TableHead>AWB</TableHead>
                                    <TableHead>DATE</TableHead>
                                    <TableHead className="text-right">PRODUCT REV</TableHead>
                                    <TableHead className="text-right">FREIGHT COST</TableHead>
                                    <TableHead className="text-right">GST PAID</TableHead>
                                    <TableHead className="text-right">ITC BENEFIT</TableHead>
                                    <TableHead className="text-right">NET LOG. COST</TableHead>
                                    <TableHead className="text-center">EST. COGS</TableHead>
                                    <TableHead className="text-right">NET PROFIT</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {pnlData.map((row) => (
                                    <TableRow key={row.id}>
                                        <TableCell className="font-mono text-blue-600 hover:underline cursor-pointer">{row.awb}</TableCell>
                                        <TableCell>{row.date}</TableCell>
                                        <TableCell className="text-right">₹{row.rev.toLocaleString()}</TableCell>
                                        <TableCell className="text-right text-red-600 font-medium">-₹{row.freight.toLocaleString()}</TableCell>
                                        <TableCell className="text-right text-red-600 font-medium">-₹{row.gst.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 2 })}</TableCell>
                                        <TableCell className="text-right text-green-600 font-medium">+₹{row.itc.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 2 })}</TableCell>
                                        <TableCell className="text-right text-red-600 font-medium">-₹{row.netLog.toLocaleString()}</TableCell>
                                        <TableCell className="text-center text-muted-foreground">{row.cogs ? row.cogs : "—"}</TableCell>
                                        <TableCell className="text-right text-green-600 font-bold">+₹{row.profit.toLocaleString()}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                            <tfoot className="bg-slate-900 border-t font-semibold px-4 text-white">
                                <tr>
                                    <td colSpan={2} className="py-3 px-4">TOTAL</td>
                                    <td className="text-right py-3 px-4">₹4,899</td>
                                    <td className="text-right py-3 px-4 text-red-300">-₹360</td>
                                    <td className="text-right py-3 px-4 text-red-300">-₹64.80</td>
                                    <td className="text-right py-3 px-4 text-green-400">+₹64.80</td>
                                    <td className="text-right py-3 px-4 text-red-300">-₹360</td>
                                    <td className="text-center py-3 px-4">—</td>
                                    <td className="text-right py-3 px-4 text-green-400 font-bold">+₹4,539</td>
                                </tr>
                            </tfoot>
                        </Table>
                    </Card>

                    <div className="mt-4 flex items-start gap-2 bg-blue-50 border border-blue-200 text-blue-800 p-3 rounded-md text-sm">
                        <Info className="h-5 w-5 shrink-0 text-blue-600" />
                        <p>
                            <strong>ITC Note:</strong> All IGST paid on FastFare invoices is fully recoverable in GSTR-3B. Effective freight cost = freight only (not freight+GST).
                        </p>
                    </div>
                </div>

                <div className="lg:w-80 shrink-0">
                    <Card className="bg-yellow-50 border-yellow-300 shadow-md sticky top-6">
                        <CardContent className="p-6">
                            <h3 className="text-lg font-bold text-yellow-900 mb-4 border-b border-yellow-200 pb-2">P&amp;L Summary</h3>
                            <div className="space-y-4">
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-gray-700">Total Revenue</span>
                                    <span className="font-semibold text-black">₹4,899.00</span>
                                </div>
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-gray-700">Total Logistics Cost</span>
                                    <span className="font-semibold text-red-600">-₹360.00</span>
                                </div>
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-gray-700">GST ITC Recovered</span>
                                    <span className="font-semibold text-green-600">+₹64.80</span>
                                </div>
                                <div className="pt-3 border-t border-yellow-200">
                                    <div className="flex justify-between items-center">
                                        <span className="font-semibold text-yellow-900">Net Profit</span>
                                        <span className="text-xl font-black text-gray-900">₹4,539.00</span>
                                    </div>
                                    <span className="text-xs text-yellow-700 block text-right mt-1">After Logistics</span>
                                </div>

                                <div className="mt-6 pt-4 pb-4 px-4 bg-slate-900 rounded-lg text-center shadow-inner">
                                    <p className="text-xs font-semibold text-slate-400 mb-1 leading-tight tracking-wider">LOGISTICS COST<br />% OF REVENUE</p>
                                    <p className="text-3xl font-black text-amber-500">7.3%</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default PnlStatementTab;
