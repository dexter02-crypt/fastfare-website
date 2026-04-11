import { useQuery } from '@tanstack/react-query';
import { API_BASE_URL } from '@/config';

interface Settlement {
    _id: string;
    orderId: string;
    partnerId: string;
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

interface UseSettlementsParams {
    page?: number;
    limit?: number;
    status?: string;
    startDate?: string;
    endDate?: string;
}

export function useSettlements(params: UseSettlementsParams = {}) {
    const { page = 1, limit = 20, status, startDate, endDate } = params;

    return useQuery({
        queryKey: ['settlements', page, limit, status, startDate, endDate],
        queryFn: async () => {
            const token = localStorage.getItem('token');
            const queryParams = new URLSearchParams({
                page: page.toString(),
                limit: limit.toString()
            });
            if (status) queryParams.append('status', status);
            if (startDate) queryParams.append('startDate', startDate);
            if (endDate) queryParams.append('endDate', endDate);

            const res = await fetch(`${API_BASE_URL}/api/partner/settlements?${queryParams}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (!res.ok) throw new Error('Failed to fetch settlements');
            return res.json();
        }
    });
}

export function useSettlementsSummary() {
    return useQuery({
        queryKey: ['settlements-summary'],
        queryFn: async () => {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_BASE_URL}/api/partner/settlements/summary`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (!res.ok) throw new Error('Failed to fetch summary');
            return res.json();
        }
    });
}