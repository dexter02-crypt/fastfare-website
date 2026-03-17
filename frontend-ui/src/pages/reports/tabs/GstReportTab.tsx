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
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const GstReportTab = () => {
    // Stubbed Data
    const itcData = [
        { id: "1", invoice: "FF-INV-13548601", date: "13 Mar", awb: "FFMM2026001", ffGstin: "06XXXX1234X1ZY", userGstin: "08BLXPV9775J1ZK", sac: "996812", pos: "08-Rajasthan", taxable: 169.49, igst: 30.51, cgst: "—", sgst: "—", total: 200 },
        { id: "2", invoice: "FF-INV-13548602", date: "15 Mar", awb: "FFMM2026002", ffGstin: "06XXXX1234X1ZY", userGstin: "08BLXPV9775J1ZK", sac: "996812", pos: "08-Rajasthan", taxable: 80.51, igst: 14.49, cgst: "—", sgst: "—", total: 95 },
    ];

    return (
        <div className="space-y-6 mt-6">
            <div>
                <h2 className="text-xl font-bold">GST Reports — For Your CA &amp; Filing</h2>
                <div className="mt-2 flex items-start gap-2 bg-blue-50 border border-blue-200 text-blue-800 p-3 rounded-md text-sm">
                    <Info className="h-5 w-5 shrink-0 text-blue-600" />
                    <p>
                        You paid IGST to FastFare on every interstate shipment (SAC 996812). As a B2B registered buyer, claim full IGST as ITC in GSTR-3B. This appears in your GSTR-2B once FastFare files their GSTR-1 by 11th of each month.
                    </p>
                </div>
            </div>

            <Tabs defaultValue="itc" className="w-full">
                <TabsList className="grid w-full grid-cols-3 max-w-md">
                    <TabsTrigger value="itc">ITC Report (GSTR-3B)</TabsTrigger>
                    <TabsTrigger value="sales">Sales Report (GSTR-1)</TabsTrigger>
                    <TabsTrigger value="tds">TDS Report</TabsTrigger>
                </TabsList>

                <TabsContent value="itc" className="mt-6 space-y-4">
                    <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                        <Select defaultValue="mar26">
                            <SelectTrigger className="w-[180px]">
                                <SelectValue placeholder="Select Month" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="mar26">March 2026</SelectItem>
                                <SelectItem value="feb26">February 2026</SelectItem>
                                <SelectItem value="jan26">January 2026</SelectItem>
                            </SelectContent>
                        </Select>

                        <div className="flex gap-2 w-full sm:w-auto">
                            <Button className="bg-indigo-600 hover:bg-indigo-700 text-white w-full sm:w-auto">
                                <Download className="h-4 w-4 mr-2" /> GSTR CSV (for CA)
                            </Button>
                            <Button variant="secondary" className="w-full sm:w-auto">
                                <Download className="h-4 w-4 mr-2" /> PDF Summary
                            </Button>
                        </div>
                    </div>

                    <Card className="border shadow-sm overflow-hidden">
                        <div className="overflow-x-auto w-full">
                            <Table className="whitespace-nowrap w-max min-w-full">
                                <TableHeader className="bg-muted/50">
                                    <TableRow>
                                        <TableHead>INVOICE NO.</TableHead>
                                        <TableHead>DATE</TableHead>
                                        <TableHead>AWB</TableHead>
                                        <TableHead>FASTFARE GSTIN</TableHead>
                                        <TableHead>YOUR GSTIN</TableHead>
                                        <TableHead>SAC</TableHead>
                                        <TableHead>PLACE OF SUPPLY</TableHead>
                                        <TableHead className="text-right">TAXABLE (₹)</TableHead>
                                        <TableHead className="text-center">IGST %</TableHead>
                                        <TableHead className="text-right">IGST (₹)</TableHead>
                                        <TableHead className="text-right">CGST (₹)</TableHead>
                                        <TableHead className="text-right">SGST (₹)</TableHead>
                                        <TableHead className="text-right">TOTAL (₹)</TableHead>
                                        <TableHead className="text-center">ITC ELIGIBLE</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {itcData.map((row) => (
                                        <TableRow key={row.id}>
                                            <TableCell className="font-mono text-xs">{row.invoice}</TableCell>
                                            <TableCell>{row.date}</TableCell>
                                            <TableCell className="font-mono text-blue-600">{row.awb}</TableCell>
                                            <TableCell className="font-mono text-xs text-muted-foreground">{row.ffGstin}</TableCell>
                                            <TableCell className="font-mono text-xs">{row.userGstin}</TableCell>
                                            <TableCell>{row.sac}</TableCell>
                                            <TableCell>{row.pos}</TableCell>
                                            <TableCell className="text-right">₹{row.taxable.toFixed(2)}</TableCell>
                                            <TableCell className="text-center">18%</TableCell>
                                            <TableCell className="text-right font-bold text-indigo-600">₹{row.igst.toFixed(2)}</TableCell>
                                            <TableCell className="text-right text-muted-foreground">{row.cgst}</TableCell>
                                            <TableCell className="text-right text-muted-foreground">{row.sgst}</TableCell>
                                            <TableCell className="text-right font-medium">₹{row.total.toFixed(2)}</TableCell>
                                            <TableCell className="text-center text-green-600 font-medium">✓ Yes</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                                <tfoot className="bg-slate-900 border-t font-semibold px-4 text-white">
                                    <tr>
                                        <td colSpan={7} className="py-3 px-4">TOTAL</td>
                                        <td className="text-right py-3 px-4">₹250.00</td>
                                        <td className="text-center py-3 px-4"></td>
                                        <td className="text-right py-3 px-4 text-indigo-300 font-bold">₹45.00</td>
                                        <td className="text-right py-3 px-4">—</td>
                                        <td className="text-right py-3 px-4">—</td>
                                        <td className="text-right py-3 px-4">₹295.00</td>
                                        <td className="text-center py-3 px-4"></td>
                                    </tr>
                                </tfoot>
                            </Table>
                        </div>
                    </Card>

                    <div className="bg-yellow-100 border border-yellow-300 text-yellow-900 p-4 rounded-md text-sm font-medium flex gap-3 items-center">
                        <span className="text-xl shrink-0">⭐</span>
                        <p>
                            Claim ₹45.00 as ITC in GSTR-3B → Table 4A → All Other ITC. FastFare GSTIN: 06XXXX1234X1ZY will appear in your GSTR-2B once they file GSTR-1 by 11th April 2026.
                        </p>
                    </div>
                </TabsContent>

                <TabsContent value="sales" className="mt-6">
                    <div className="bg-blue-50 border border-blue-200 text-blue-800 p-5 rounded-md text-sm space-y-4">
                        <div className="flex items-start gap-2">
                            <Info className="h-5 w-5 shrink-0 text-blue-600" />
                            <p>Your outward sales report — if your customers are B2B GST registered, declare shipment value here for your own GSTR-1 outward supplies.</p>
                        </div>
                        <p className="font-medium bg-blue-100/50 p-3 rounded border border-blue-200 ml-7">
                            Currently FastFare does not auto-generate your outward GSTR-1. Use the Orders CSV and share with your CA.
                        </p>
                        <div className="ml-7 pt-2">
                            <Button>
                                <Download className="h-4 w-4 mr-2" /> Download Orders CSV
                            </Button>
                        </div>
                    </div>
                </TabsContent>

                <TabsContent value="tds" className="mt-6">
                    <div className="bg-amber-50 border border-amber-200 text-amber-800 p-5 rounded-md text-sm">
                        <div className="flex items-start gap-2">
                            <Info className="h-5 w-5 shrink-0 text-amber-600" />
                            <p>
                                <strong>TDS deducted on your account (if applicable).</strong> FastFare does not currently deduct TDS from sellers — this applies only to partner payouts under Section 194C. No TDS liability for users at this time.
                            </p>
                        </div>
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
};

export default GstReportTab;
