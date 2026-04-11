import { useNavigate } from 'react-router-dom';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

interface Settlement {
    _id: string;
    orderId: string;
    orderValue: number;
    platformFee: number;
    netAmount: number;
    settlementStatus: 'pending' | 'processing' | 'paid';
    payoutDate: string | null;
    orderType: 'prepaid' | 'cod';
    createdAt: string;
    order?: {
        orderId: string;
        customer: { name: string };
    };
}

interface SettlementTableProps {
    settlements: Settlement[];
    isLoading?: boolean;
    onPageChange?: (page: number) => void;
    currentPage?: number;
    totalPages?: number;
}

const statusColors: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-800',
    processing: 'bg-blue-100 text-blue-800',
    paid: 'bg-green-100 text-green-800'
};

export function SettlementTable({ settlements, isLoading, onPageChange, currentPage = 1, totalPages = 1 }: SettlementTableProps) {
    const navigate = useNavigate();

    const handleRowClick = (orderId: string) => {
        navigate(`/orders?highlight=${orderId}`);
    };

    if (isLoading) {
        return (
            <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        );
    }

    return (
        <>
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Order ID</TableHead>
                        <TableHead>Customer</TableHead>
                        <TableHead>Order Value</TableHead>
                        <TableHead>Platform Fee</TableHead>
                        <TableHead>Net Payout</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Payout Date</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {settlements.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                                No settlements found
                            </TableCell>
                        </TableRow>
                    ) : (
                        settlements.map((settlement) => (
                            <TableRow 
                                key={settlement._id} 
                                className="cursor-pointer"
                                onClick={() => handleRowClick(settlement.order?.orderId || settlement.orderId)}
                            >
                                <TableCell className="font-mono">
                                    {settlement.order?.orderId || settlement.orderId}
                                    {settlement.orderType === 'cod' && (
                                        <Badge variant="destructive" className="ml-2">COD</Badge>
                                    )}
                                </TableCell>
                                <TableCell>{settlement.order?.customer?.name || '-'}</TableCell>
                                <TableCell>₹{settlement.orderValue.toLocaleString()}</TableCell>
                                <TableCell>₹{settlement.platformFee.toLocaleString()}</TableCell>
                                <TableCell className="font-semibold">₹{settlement.netAmount.toLocaleString()}</TableCell>
                                <TableCell>
                                    <Badge className={statusColors[settlement.settlementStatus]}>
                                        {settlement.settlementStatus}
                                    </Badge>
                                </TableCell>
                                <TableCell>
                                    {settlement.payoutDate 
                                        ? new Date(settlement.payoutDate).toLocaleDateString('en-IN')
                                        : '-'
                                    }
                                </TableCell>
                            </TableRow>
                        ))
                    )}
                </TableBody>
            </Table>

            {totalPages > 1 && (
                <div className="flex justify-center gap-2 mt-4">
                    <Button 
                        variant="outline" 
                        disabled={currentPage === 1}
                        onClick={() => onPageChange?.(currentPage - 1)}
                    >
                        Previous
                    </Button>
                    <span className="py-2">Page {currentPage} of {totalPages}</span>
                    <Button 
                        variant="outline"
                        disabled={currentPage === totalPages}
                        onClick={() => onPageChange?.(currentPage + 1)}
                    >
                        Next
                    </Button>
                </div>
            )}
        </>
    );
}