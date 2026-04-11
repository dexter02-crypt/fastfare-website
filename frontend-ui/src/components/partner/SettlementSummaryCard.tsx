import { Card, CardContent } from '@/components/ui/card';
import { DollarSign, Clock, CheckCircle } from 'lucide-react';
import { Loader2 } from 'lucide-react';

interface SettlementSummaryCardProps {
    totalEarnings: number;
    totalPending: number;
    totalPaid: number;
    isLoading?: boolean;
}

export function SettlementSummaryCard({ totalEarnings, totalPending, totalPaid, isLoading }: SettlementSummaryCardProps) {
    const stats = [
        { label: 'Earnings This Month', value: totalEarnings, icon: DollarSign, color: 'text-green-600' },
        { label: 'Pending', value: totalPending, icon: Clock, color: 'text-yellow-600' },
        { label: 'Paid Out', value: totalPaid, icon: CheckCircle, color: 'text-blue-600' }
    ];

    return (
        <div className="grid grid-cols-3 gap-4">
            {stats.map((stat) => (
                <Card key={stat.label}>
                    <CardContent className="p-4 flex items-center gap-4">
                        {isLoading ? (
                            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                        ) : (
                            <stat.icon className={`h-8 w-8 ${stat.color}`} />
                        )}
                        <div>
                            <p className="text-sm text-muted-foreground">{stat.label}</p>
                            <p className="text-2xl font-bold">₹{stat.value.toLocaleString()}</p>
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}