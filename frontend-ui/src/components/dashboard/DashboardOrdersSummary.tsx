import { Card, CardContent } from '@/components/ui/card';
import { OrderStatCards } from './OrderStatCards';
import { RecentOrdersList } from './RecentOrdersList';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';

interface DashboardOrdersSummaryProps {
  summary: {
    total: number;
    active: number;
    delivered: number;
    pending: number;
  };
  recentOrders: any[];
  isLoading?: boolean;
}

export function DashboardOrdersSummary({ summary, recentOrders, isLoading }: DashboardOrdersSummaryProps) {
  const navigate = useNavigate();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      <OrderStatCards summary={summary} isLoading={isLoading} />
      <RecentOrdersList orders={recentOrders} isLoading={isLoading} />
      <div className="flex justify-end">
        <Button variant="outline" onClick={() => navigate('/orders')}>
          View All Orders
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </motion.div>
  );
}