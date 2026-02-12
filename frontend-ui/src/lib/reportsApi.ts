import { API_BASE_URL } from "@/config";

const API_BASE = `${API_BASE_URL}/api/reports`;

const getHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
};

// Mock data for demo purposes
const MOCK_KPIS: KPIData = {
  totalTrucks: 45,
  activeTrucks: 32,
  pendingTrucks: 8,
  rejectedTrucks: 5,
  totalDrivers: 78,
  activeDrivers: 65,
  inactiveDrivers: 13,
  trucksInPeriod: 12,
  driversInPeriod: 18,
};

const MOCK_TRUCKS_ANALYTICS: AnalyticsData = {
  byStatus: [
    { status: 'Approved', count: 32 },
    { status: 'Pending', count: 8 },
    { status: 'Rejected', count: 5 },
  ],
  overTime: [
    { date: 'Jan', count: 5 },
    { date: 'Feb', count: 8 },
    { date: 'Mar', count: 12 },
    { date: 'Apr', count: 7 },
    { date: 'May', count: 10 },
    { date: 'Jun', count: 3 },
  ],
};

const MOCK_DRIVERS_ANALYTICS: AnalyticsData = {
  byStatus: [
    { status: 'Active', count: 65 },
    { status: 'Inactive', count: 13 },
  ],
  overTime: [
    { date: 'Jan', count: 8 },
    { date: 'Feb', count: 12 },
    { date: 'Mar', count: 15 },
    { date: 'Apr', count: 10 },
    { date: 'May', count: 18 },
    { date: 'Jun', count: 15 },
  ],
};

const MOCK_TRUCKS_TABLE: TruckTableData[] = [
  { _id: '1', name: 'Tata Ace Gold', chassisNo: 'MAT458219GH123456', rcNo: 'MH01AB1234', dlNo: 'MH0120200012345', status: 'approved', createdAt: '2026-01-15T10:30:00Z', createdBy: { businessName: 'FastFare Logistics', email: 'admin@fastfare.in' } },
  { _id: '2', name: 'Mahindra Bolero Pickup', chassisNo: 'MAH789456KL789012', rcNo: 'DL02CD5678', dlNo: 'DL0320190054321', status: 'approved', createdAt: '2026-01-20T14:15:00Z', createdBy: { businessName: 'QuickShip Transport', email: 'ops@quickship.in' } },
  { _id: '3', name: 'Ashok Leyland Dost', chassisNo: 'ASH123789PQ456789', rcNo: 'KA03EF9012', dlNo: 'KA0420180098765', status: 'pending', createdAt: '2026-02-01T09:00:00Z', createdBy: { businessName: 'Metro Movers', email: 'fleet@metromovers.in' } },
  { _id: '4', name: 'Eicher Pro 1049', chassisNo: 'EIC567123RS012345', rcNo: 'TN04GH3456', dlNo: 'TN0520170076543', status: 'approved', createdAt: '2026-02-05T16:45:00Z', createdBy: { businessName: 'Chennai Cargo', email: 'info@chennaicargo.in' } },
  { _id: '5', name: 'Tata 407 LPT', chassisNo: 'TAT890234TU678901', rcNo: 'GJ05IJ7890', dlNo: 'GJ0620160032109', status: 'rejected', createdAt: '2026-02-08T11:20:00Z', createdBy: { businessName: 'Gujarat Express', email: 'fleet@gujaratexp.in' }, rejectionReason: 'Invalid RC document' },
];

const MOCK_DRIVERS_TABLE: DriverTableData[] = [
  { _id: '1', fullName: 'Rajesh Kumar Singh', mobile: '9876543210', dlNo: 'MH0120200012345', aadhaar: '1234-5678-9012', status: 'active', createdAt: '2026-01-10T08:00:00Z', createdBy: { businessName: 'FastFare Logistics', email: 'admin@fastfare.in' } },
  { _id: '2', fullName: 'Amit Sharma', mobile: '9123456780', dlNo: 'DL0320190054321', aadhaar: '2345-6789-0123', status: 'active', createdAt: '2026-01-12T10:30:00Z', createdBy: { businessName: 'QuickShip Transport', email: 'ops@quickship.in' } },
  { _id: '3', fullName: 'Suresh Patel', mobile: '9234567890', dlNo: 'GJ0520180043210', aadhaar: '3456-7890-1234', status: 'active', createdAt: '2026-01-18T14:00:00Z', createdBy: { businessName: 'Gujarat Express', email: 'fleet@gujaratexp.in' } },
  { _id: '4', fullName: 'Vijay Reddy', mobile: '9345678901', dlNo: 'AP0420170098765', aadhaar: '4567-8901-2345', status: 'inactive', createdAt: '2026-01-25T09:15:00Z', createdBy: { businessName: 'Hyderabad Haulers', email: 'info@hydhaulers.in' } },
  { _id: '5', fullName: 'Mohammed Khan', mobile: '9456789012', dlNo: 'KA0620160076543', aadhaar: '5678-9012-3456', status: 'active', createdAt: '2026-02-02T11:45:00Z', createdBy: { businessName: 'Bangalore Freight', email: 'ops@bangfreight.in' } },
];

export interface KPIData {
  totalTrucks: number;
  activeTrucks: number;
  pendingTrucks: number;
  rejectedTrucks: number;
  totalDrivers: number;
  activeDrivers: number;
  inactiveDrivers: number;
  trucksInPeriod: number;
  driversInPeriod: number;
}

export interface ChartDataPoint {
  status?: string;
  date?: string;
  count: number;
}

export interface AnalyticsData {
  byStatus: ChartDataPoint[];
  overTime: ChartDataPoint[];
}

export interface PaginationInfo {
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export interface TruckTableData {
  _id: string;
  name: string;
  chassisNo: string;
  rcNo: string;
  dlNo: string;
  status: string;
  createdAt: string;
  createdBy?: { businessName: string; email: string };
  rejectionReason?: string;
}

export interface DriverTableData {
  _id: string;
  fullName: string;
  mobile: string;
  dlNo: string;
  aadhaar: string;
  status: string;
  createdAt: string;
  createdBy?: { businessName: string; email: string };
}

export interface ExportData {
  [key: string]: string | number;
}

export interface ReportsFilters {
  dateRange?: string;
  truckStatus?: string;
  driverStatus?: string;
}

export const reportsApi = {
  // Get KPI data
  async getKPIs(filters: ReportsFilters = {}): Promise<{ kpis: KPIData }> {
    try {
      const params = new URLSearchParams();
      if (filters.dateRange) params.append('dateRange', filters.dateRange);
      
      const url = `${API_BASE}/kpis${params.toString() ? '?' + params.toString() : ''}`;
      const response = await fetch(url, { headers: getHeaders() });
      
      if (!response.ok) {
        throw new Error('Failed to fetch KPIs');
      }
      const data = await response.json();
      // If no data or empty, use mock
      if (!data?.kpis || data.kpis.totalTrucks === 0 && data.kpis.totalDrivers === 0) {
        console.warn('Empty KPI data, using mock');
        return { kpis: MOCK_KPIS };
      }
      return data;
    } catch (error) {
      console.warn('Using mock KPI data:', error);
      return { kpis: MOCK_KPIS };
    }
  },

  // Get trucks analytics
  async getTrucksAnalytics(filters: ReportsFilters = {}): Promise<AnalyticsData> {
    try {
      const params = new URLSearchParams();
      if (filters.dateRange) params.append('dateRange', filters.dateRange);
      
      const url = `${API_BASE}/trucks/analytics${params.toString() ? '?' + params.toString() : ''}`;
      const response = await fetch(url, { headers: getHeaders() });
      
      if (!response.ok) {
        throw new Error('Failed to fetch trucks analytics');
      }
      const data = await response.json();
      // If no data or empty arrays, use mock
      if (!data?.byStatus || data.byStatus.length === 0) {
        console.warn('Empty trucks analytics, using mock');
        return MOCK_TRUCKS_ANALYTICS;
      }
      return data;
    } catch (error) {
      console.warn('Using mock trucks analytics:', error);
      return MOCK_TRUCKS_ANALYTICS;
    }
  },

  // Get drivers analytics
  async getDriversAnalytics(filters: ReportsFilters = {}): Promise<AnalyticsData> {
    try {
      const params = new URLSearchParams();
      if (filters.dateRange) params.append('dateRange', filters.dateRange);
      
      const url = `${API_BASE}/drivers/analytics${params.toString() ? '?' + params.toString() : ''}`;
      const response = await fetch(url, { headers: getHeaders() });
      
      if (!response.ok) {
        throw new Error('Failed to fetch drivers analytics');
      }
      const data = await response.json();
      // If no data or empty arrays, use mock
      if (!data?.byStatus || data.byStatus.length === 0) {
        console.warn('Empty drivers analytics, using mock');
        return MOCK_DRIVERS_ANALYTICS;
      }
      return data;
    } catch (error) {
      console.warn('Using mock drivers analytics:', error);
      return MOCK_DRIVERS_ANALYTICS;
    }
  },

  // Get trucks table data with pagination
  async getTrucksTable(params: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  } = {}): Promise<{ trucks: TruckTableData[]; pagination: PaginationInfo }> {
    try {
      const urlParams = new URLSearchParams();
      if (params.page) urlParams.append('page', params.page.toString());
      if (params.limit) urlParams.append('limit', params.limit.toString());
      if (params.search) urlParams.append('search', params.search);
      if (params.status) urlParams.append('status', params.status);
      if (params.sortBy) urlParams.append('sortBy', params.sortBy);
      if (params.sortOrder) urlParams.append('sortOrder', params.sortOrder);
      
      const url = `${API_BASE}/trucks/table${urlParams.toString() ? '?' + urlParams.toString() : ''}`;
      const response = await fetch(url, { headers: getHeaders() });
      
      if (!response.ok) {
        throw new Error('Failed to fetch trucks table data');
      }
      const data = await response.json();
      // If no trucks data, use mock
      if (!data?.trucks || data.trucks.length === 0) {
        console.warn('Empty trucks table, using mock');
        let filteredTrucks = [...MOCK_TRUCKS_TABLE];
        if (params.status && params.status !== 'all') {
          filteredTrucks = filteredTrucks.filter(t => t.status === params.status);
        }
        return {
          trucks: filteredTrucks,
          pagination: { total: filteredTrucks.length, page: 1, limit: 5, pages: 1 }
        };
      }
      return data;
    } catch (error) {
      console.warn('Using mock trucks table:', error);
      let filteredTrucks = [...MOCK_TRUCKS_TABLE];
      if (params.status && params.status !== 'all') {
        filteredTrucks = filteredTrucks.filter(t => t.status === params.status);
      }
      if (params.search) {
        const search = params.search.toLowerCase();
        filteredTrucks = filteredTrucks.filter(t => 
          t.name.toLowerCase().includes(search) || t.chassisNo.toLowerCase().includes(search)
        );
      }
      return {
        trucks: filteredTrucks,
        pagination: { total: filteredTrucks.length, page: 1, limit: 5, pages: 1 }
      };
    }
  },

  // Get drivers table data with pagination
  async getDriversTable(params: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  } = {}): Promise<{ drivers: DriverTableData[]; pagination: PaginationInfo }> {
    try {
      const urlParams = new URLSearchParams();
      if (params.page) urlParams.append('page', params.page.toString());
      if (params.limit) urlParams.append('limit', params.limit.toString());
      if (params.search) urlParams.append('search', params.search);
      if (params.status) urlParams.append('status', params.status);
      if (params.sortBy) urlParams.append('sortBy', params.sortBy);
      if (params.sortOrder) urlParams.append('sortOrder', params.sortOrder);
      
      const url = `${API_BASE}/drivers/table${urlParams.toString() ? '?' + urlParams.toString() : ''}`;
      const response = await fetch(url, { headers: getHeaders() });
      
      if (!response.ok) {
        throw new Error('Failed to fetch drivers table data');
      }
      const data = await response.json();
      // If no drivers data, use mock
      if (!data?.drivers || data.drivers.length === 0) {
        console.warn('Empty drivers table, using mock');
        let filteredDrivers = [...MOCK_DRIVERS_TABLE];
        if (params.status && params.status !== 'all') {
          filteredDrivers = filteredDrivers.filter(d => d.status === params.status);
        }
        return {
          drivers: filteredDrivers,
          pagination: { total: filteredDrivers.length, page: 1, limit: 5, pages: 1 }
        };
      }
      return data;
    } catch (error) {
      console.warn('Using mock drivers table:', error);
      let filteredDrivers = [...MOCK_DRIVERS_TABLE];
      if (params.status && params.status !== 'all') {
        filteredDrivers = filteredDrivers.filter(d => d.status === params.status);
      }
      if (params.search) {
        const search = params.search.toLowerCase();
        filteredDrivers = filteredDrivers.filter(d => 
          d.fullName.toLowerCase().includes(search) || d.mobile.includes(search)
        );
      }
      return {
        drivers: filteredDrivers,
        pagination: { total: filteredDrivers.length, page: 1, limit: 5, pages: 1 }
      };
    }
  },

  // Export trucks data
  async exportTrucks(status?: string): Promise<{ data: ExportData[] }> {
    try {
      const params = new URLSearchParams();
      if (status && status !== 'all') params.append('status', status);
      
      const url = `${API_BASE}/trucks/export${params.toString() ? '?' + params.toString() : ''}`;
      const response = await fetch(url, { headers: getHeaders() });
      
      if (!response.ok) {
        throw new Error('Failed to export trucks data');
      }
      return response.json();
    } catch (error) {
      console.warn('Using mock trucks export:', error);
      const data = MOCK_TRUCKS_TABLE.map(t => ({
        Name: t.name,
        'Chassis No': t.chassisNo,
        'RC No': t.rcNo,
        Status: t.status,
        'Created At': new Date(t.createdAt).toLocaleDateString(),
        'Business': t.createdBy?.businessName || 'N/A'
      }));
      return { data };
    }
  },

  // Export drivers data
  async exportDrivers(status?: string): Promise<{ data: ExportData[] }> {
    try {
      const params = new URLSearchParams();
      if (status && status !== 'all') params.append('status', status);
      
      const url = `${API_BASE}/drivers/export${params.toString() ? '?' + params.toString() : ''}`;
      const response = await fetch(url, { headers: getHeaders() });
      
      if (!response.ok) {
        throw new Error('Failed to export drivers data');
      }
      return response.json();
    } catch (error) {
      console.warn('Using mock drivers export:', error);
      const data = MOCK_DRIVERS_TABLE.map(d => ({
        'Full Name': d.fullName,
        'Mobile': d.mobile,
        'DL No': d.dlNo,
        'Aadhaar': d.aadhaar,
        Status: d.status,
        'Created At': new Date(d.createdAt).toLocaleDateString(),
        'Business': d.createdBy?.businessName || 'N/A'
      }));
      return { data };
    }
  },
};

