import { Card, CardContent } from '@/components/ui/card';
import { Package, Clock, CheckCircle, Truck } from 'lucide-react';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';

interface OrderStatCardsProps {
  summary: {
    total: number;
    active: number;
    delivered: number;
    pending: number;
  };
  isLoading?: boolean;
}

export function OrderStatCards({ summary, isLoading }: OrderStatCardsProps) {
  const stats = [
    { label: 'Total Orders', value: summary.total, icon: Package, color: 'text-blue-600' },
    { label: 'Active', value: summary.active, icon: Truck, color: 'text-orange-600' },
    { label: 'Delivered', value: summary.delivered, icon: CheckCircle, color: 'text-green-600' },
    { label: 'Pending', value: summary.pending, icon: Clock, color: 'text-yellow-600' }
  ];

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: { delay: i * 0.1 }
    })
  };

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {stats.map((stat, index) => (
        <motion.div
          key={stat.label}
          custom={index}
          initial="hidden"
          animate="visible"
          variants={cardVariants}
        >
          <Card>
            <CardContent className="p-4 flex items-center gap-4">
              {isLoading ? (
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              ) : (
                <stat.icon className={`h-8 w-8 ${stat.color}`} />
              )}
              <div>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
                <p className="text-2xl font-bold">{stat.value}</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  );
}