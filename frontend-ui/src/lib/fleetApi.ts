import { API_BASE_URL } from "@/config";

const API_BASE = `${API_BASE_URL}/api/fleet`;

const getHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Authorization': `Bearer ${token}`,
  };
};

const getJsonHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  };
};

export interface Truck {
  _id: string;
  name: string;
  chassisNo: string;
  rcNo: string;
  dlNo: string;
  vehicleType?: 'mini_truck' | 'pickup' | 'light_truck' | 'medium_truck' | 'heavy_truck' | 'trailer' | 'container';
  capacity?: string;
  manufacturer?: string;
  model?: string;
  year?: number;
  color?: string;
  insuranceNo?: string;
  insuranceExpiry?: string;
  permitNo?: string;
  permitExpiry?: string;
  fitnessExpiry?: string;
  photos: string[];
  status: 'pending' | 'approved' | 'rejected';
  rejectionReason?: string;
  approvedBy?: { _id: string; businessName: string };
  approvedAt?: string;
  createdBy: { _id: string; businessName: string; email: string };
  createdAt: string;
  updatedAt: string;
}

export interface Driver {
  _id: string;
  fullName: string;
  mobile: string;
  dlNo: string;
  aadhaar: string;
  photo?: string;
  status: 'active' | 'inactive';
  createdBy: { _id: string; businessName: string; email: string };
  createdAt: string;
}

export interface TruckFormData {
  name: string;
  chassisNo: string;
  rcNo: string;
  dlNo: string;
  vehicleType?: string;
  capacity?: string;
  manufacturer?: string;
  model?: string;
  year?: string;
  color?: string;
  insuranceNo?: string;
  insuranceExpiry?: string;
  permitNo?: string;
  permitExpiry?: string;
  fitnessExpiry?: string;
  photos: File[];
}

export interface DriverFormData {
  fullName: string;
  mobile: string;
  dlNo: string;
  aadhaar: string;
  photo?: File;
}

// Mock truck data for demo/testing with placeholder photos
const MOCK_TRUCKS: Truck[] = [
  { _id: '1', name: 'Tata Ace Gold - FL001', chassisNo: 'MAT458219GH123456', rcNo: 'MH01AB1234', dlNo: 'MH0120200012345', vehicleType: 'mini_truck', capacity: '1500 kg', manufacturer: 'Tata Motors', model: 'Ace Gold', year: 2024, color: 'White', insuranceNo: 'INS123456789', insuranceExpiry: '2027-06-15', permitNo: 'PERM001234', permitExpiry: '2027-12-31', fitnessExpiry: '2027-03-20', photos: ['https://images.unsplash.com/photo-1519003722824-194d4455a60c?w=400&h=300&fit=crop'], status: 'approved', createdBy: { _id: '1', businessName: 'FastFare Logistics', email: 'admin@fastfare.in' }, createdAt: '2026-01-15T10:30:00Z', updatedAt: '2026-01-15T10:30:00Z' },
  { _id: '2', name: 'Mahindra Bolero Pickup - FL002', chassisNo: 'MAH789456KL789012', rcNo: 'DL02CD5678', dlNo: 'DL0320190054321', vehicleType: 'pickup', capacity: '1200 kg', manufacturer: 'Mahindra', model: 'Bolero Pickup', year: 2023, color: 'Silver', insuranceNo: 'INS987654321', insuranceExpiry: '2027-08-20', permitNo: 'PERM005678', permitExpiry: '2027-10-15', fitnessExpiry: '2027-05-10', photos: ['https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?w=400&h=300&fit=crop'], status: 'approved', createdBy: { _id: '2', businessName: 'QuickShip Transport', email: 'ops@quickship.in' }, createdAt: '2026-01-20T14:15:00Z', updatedAt: '2026-01-20T14:15:00Z' },
  { _id: '3', name: 'Ashok Leyland Dost+ - FL003', chassisNo: 'ASH123789PQ456789', rcNo: 'KA03EF9012', dlNo: 'KA0420180098765', vehicleType: 'light_truck', capacity: '2500 kg', manufacturer: 'Ashok Leyland', model: 'Dost+', year: 2024, color: 'Blue', insuranceNo: 'INS567890123', insuranceExpiry: '2026-03-01', permitNo: 'PERM009012', permitExpiry: '2027-09-30', fitnessExpiry: '2027-01-15', photos: ['https://images.unsplash.com/photo-1566576912321-d58ddd7a6088?w=400&h=300&fit=crop'], status: 'pending', createdBy: { _id: '3', businessName: 'Metro Movers', email: 'fleet@metromovers.in' }, createdAt: '2026-02-01T09:00:00Z', updatedAt: '2026-02-01T09:00:00Z' },
  { _id: '4', name: 'Eicher Pro 1049 - FL004', chassisNo: 'EIC567123RS012345', rcNo: 'TN04GH3456', dlNo: 'TN0520170076543', vehicleType: 'medium_truck', capacity: '5000 kg', manufacturer: 'Eicher', model: 'Pro 1049', year: 2022, color: 'Red', insuranceNo: 'INS345678901', insuranceExpiry: '2027-04-10', permitNo: 'PERM003456', permitExpiry: '2027-07-20', fitnessExpiry: '2027-02-28', photos: ['https://images.unsplash.com/photo-1586191582056-5f9e00861f36?w=400&h=300&fit=crop'], status: 'approved', createdBy: { _id: '4', businessName: 'Chennai Cargo', email: 'info@chennaicargo.in' }, createdAt: '2026-02-05T16:45:00Z', updatedAt: '2026-02-05T16:45:00Z' },
  { _id: '5', name: 'Tata 407 LPT - FL005', chassisNo: 'TAT890234TU678901', rcNo: 'GJ05IJ7890', dlNo: 'GJ0620160032109', vehicleType: 'light_truck', capacity: '3500 kg', manufacturer: 'Tata Motors', model: '407 LPT', year: 2023, color: 'Green', insuranceNo: 'INS789012345', insuranceExpiry: '2027-02-28', permitNo: 'PERM007890', permitExpiry: '2026-12-15', fitnessExpiry: '2027-04-05', photos: ['https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=300&fit=crop'], status: 'rejected', rejectionReason: 'Invalid RC document - expired date', createdBy: { _id: '5', businessName: 'Gujarat Express', email: 'fleet@gujaratexp.in' }, createdAt: '2026-02-08T11:20:00Z', updatedAt: '2026-02-08T11:20:00Z' },
  { _id: '6', name: 'BharatBenz 1617 - FL006', chassisNo: 'BBZ456789UV123456', rcNo: 'RJ06KL2345', dlNo: 'RJ0720210045678', vehicleType: 'heavy_truck', capacity: '16000 kg', manufacturer: 'BharatBenz', model: '1617', year: 2025, color: 'Yellow', insuranceNo: 'INS234567890', insuranceExpiry: '2028-01-15', permitNo: 'PERM002345', permitExpiry: '2028-06-30', fitnessExpiry: '2027-11-20', photos: ['https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=400&h=300&fit=crop'], status: 'approved', createdBy: { _id: '1', businessName: 'FastFare Logistics', email: 'admin@fastfare.in' }, createdAt: '2026-01-25T08:30:00Z', updatedAt: '2026-01-25T08:30:00Z' },
  { _id: '7', name: 'Force Traveller Delivery Van - FL007', chassisNo: 'FRC678901WX234567', rcNo: 'UP07MN6789', dlNo: 'UP0820220098765', vehicleType: 'container', capacity: '2000 kg', manufacturer: 'Force Motors', model: 'Traveller Delivery Van', year: 2024, color: 'White', insuranceNo: 'INS456789012', insuranceExpiry: '2027-09-10', permitNo: 'PERM006789', permitExpiry: '2027-11-25', fitnessExpiry: '2027-06-15', photos: ['https://images.unsplash.com/photo-1591768793355-74d04bb6608f?w=400&h=300&fit=crop'], status: 'pending', createdBy: { _id: '6', businessName: 'Lucknow Loaders', email: 'ops@lucknowloaders.in' }, createdAt: '2026-02-06T13:45:00Z', updatedAt: '2026-02-06T13:45:00Z' },
  { _id: '8', name: 'Tata Prima 4025 - FL008', chassisNo: 'TPR901234YZ345678', rcNo: 'MP08OP1234', dlNo: 'MP0920190054321', vehicleType: 'trailer', capacity: '40000 kg', manufacturer: 'Tata Motors', model: 'Prima 4025', year: 2023, color: 'Orange', insuranceNo: 'INS678901234', insuranceExpiry: '2027-05-20', permitNo: 'PERM001234', permitExpiry: '2027-08-30', fitnessExpiry: '2027-07-10', photos: ['https://images.unsplash.com/photo-1592838064575-70ed626d3a0e?w=400&h=300&fit=crop'], status: 'approved', createdBy: { _id: '7', businessName: 'Bhopal Freight Co', email: 'admin@bhopalfreight.in' }, createdAt: '2026-01-30T10:00:00Z', updatedAt: '2026-01-30T10:00:00Z' },
];

// Mock driver data for demo/testing
const MOCK_DRIVERS: Driver[] = [
  { _id: '1', fullName: 'Rajesh Kumar', mobile: '+91 98765 43210', dlNo: 'MH0120200012345', aadhaar: '1234 5678 9012', photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop', status: 'active', createdBy: { _id: '1', businessName: 'FastFare Logistics', email: 'admin@fastfare.in' }, createdAt: '2026-01-10T08:00:00Z' },
  { _id: '2', fullName: 'Suresh Patel', mobile: '+91 87654 32109', dlNo: 'GJ0320190054321', aadhaar: '2345 6789 0123', photo: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop', status: 'active', createdBy: { _id: '2', businessName: 'QuickShip Transport', email: 'ops@quickship.in' }, createdAt: '2026-01-12T09:30:00Z' },
  { _id: '3', fullName: 'Amit Singh', mobile: '+91 76543 21098', dlNo: 'KA0420180098765', aadhaar: '3456 7890 1234', photo: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop', status: 'active', createdBy: { _id: '3', businessName: 'Metro Movers', email: 'fleet@metromovers.in' }, createdAt: '2026-01-15T10:00:00Z' },
  { _id: '4', fullName: 'Vijay Sharma', mobile: '+91 65432 10987', dlNo: 'TN0520170076543', aadhaar: '4567 8901 2345', photo: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=100&h=100&fit=crop', status: 'inactive', createdBy: { _id: '4', businessName: 'Chennai Cargo', email: 'info@chennaicargo.in' }, createdAt: '2026-01-18T11:15:00Z' },
  { _id: '5', fullName: 'Pradeep Yadav', mobile: '+91 54321 09876', dlNo: 'AP0620160032109', aadhaar: '5678 9012 3456', photo: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=100&h=100&fit=crop', status: 'active', createdBy: { _id: '5', businessName: 'Gujarat Express', email: 'fleet@gujaratexp.in' }, createdAt: '2026-01-20T14:00:00Z' },
  { _id: '6', fullName: 'Mohammad Irfan', mobile: '+91 43210 98765', dlNo: 'RJ0720210045678', aadhaar: '6789 0123 4567', photo: 'https://images.unsplash.com/photo-1463453091185-61582044d556?w=100&h=100&fit=crop', status: 'active', createdBy: { _id: '1', businessName: 'FastFare Logistics', email: 'admin@fastfare.in' }, createdAt: '2026-01-22T16:30:00Z' },
  { _id: '7', fullName: 'Ravi Verma', mobile: '+91 32109 87654', dlNo: 'UP0820220098765', aadhaar: '7890 1234 5678', photo: 'https://images.unsplash.com/photo-1504257432389-52343af06ae3?w=100&h=100&fit=crop', status: 'active', createdBy: { _id: '6', businessName: 'Lucknow Loaders', email: 'ops@lucknowloaders.in' }, createdAt: '2026-01-25T09:00:00Z' },
  { _id: '8', fullName: 'Karthik Reddy', mobile: '+91 21098 76543', dlNo: 'MH0920190054321', aadhaar: '8901 2345 6789', photo: 'https://images.unsplash.com/photo-1507591064344-4c6ce005b128?w=100&h=100&fit=crop', status: 'active', createdBy: { _id: '7', businessName: 'Bhopal Freight Co', email: 'admin@bhopalfreight.in' }, createdAt: '2026-01-28T12:45:00Z' },
  { _id: '9', fullName: 'Sanjay Gupta', mobile: '+91 10987 65432', dlNo: 'DL1020180076543', aadhaar: '9012 3456 7890', photo: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=100&h=100&fit=crop', status: 'inactive', createdBy: { _id: '2', businessName: 'QuickShip Transport', email: 'ops@quickship.in' }, createdAt: '2026-02-01T08:00:00Z' },
  { _id: '10', fullName: 'Arun Nair', mobile: '+91 09876 54321', dlNo: 'KL1120210098765', aadhaar: '0123 4567 8901', photo: 'https://images.unsplash.com/photo-1556157382-97eda2d62296?w=100&h=100&fit=crop', status: 'active', createdBy: { _id: '3', businessName: 'Metro Movers', email: 'fleet@metromovers.in' }, createdAt: '2026-02-05T15:00:00Z' },
];

export const fleetApi = {
  // Trucks
  async addTruck(data: TruckFormData): Promise<{ success: boolean; message: string; truck: Truck }> {
    const formData = new FormData();
    formData.append('name', data.name);
    formData.append('chassisNo', data.chassisNo);
    formData.append('rcNo', data.rcNo);
    formData.append('dlNo', data.dlNo);
    // New metadata fields
    if (data.vehicleType) formData.append('vehicleType', data.vehicleType);
    if (data.capacity) formData.append('capacity', data.capacity);
    if (data.manufacturer) formData.append('manufacturer', data.manufacturer);
    if (data.model) formData.append('model', data.model);
    if (data.year) formData.append('year', data.year);
    if (data.color) formData.append('color', data.color);
    if (data.insuranceNo) formData.append('insuranceNo', data.insuranceNo);
    if (data.insuranceExpiry) formData.append('insuranceExpiry', data.insuranceExpiry);
    if (data.permitNo) formData.append('permitNo', data.permitNo);
    if (data.permitExpiry) formData.append('permitExpiry', data.permitExpiry);
    if (data.fitnessExpiry) formData.append('fitnessExpiry', data.fitnessExpiry);
    // Photos
    data.photos.forEach(photo => {
      formData.append('photos', photo);
    });

    const response = await fetch(`${API_BASE}/trucks`, {
      method: 'POST',
      headers: getHeaders(),
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to add truck');
    }

    return response.json();
  },

  async getTrucks(status?: string): Promise<{ trucks: Truck[] }> {
    try {
      const url = status && status !== 'all' 
        ? `${API_BASE}/trucks?status=${status}`
        : `${API_BASE}/trucks`;
      
      const response = await fetch(url, {
        headers: getHeaders(),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch trucks');
      }

      const data = await response.json();
      
      // Safeguard: Filter by user role for real data too if backend doesn't
      try {
        const userStr = localStorage.getItem('user');
        if (userStr && data.trucks) {
          const user = JSON.parse(userStr);
          if (user.role === 'shipment_partner') {
             // Only show trucks created by this partner
             // Check if CreatedBy is populated object or just ID
             data.trucks = data.trucks.filter((t: any) => {
                const creatorId = typeof t.createdBy === 'object' ? t.createdBy?._id : t.createdBy;
                return creatorId === user._id || creatorId === user.id;
             });
          }
        }
      } catch (e) {
         console.error("Error filtering trucks", e);
      }
      
      // If no trucks data, use mock
      if (!data?.trucks || data.trucks.length === 0) {
        console.warn('Empty trucks data, using mock');
        let trucks = [...MOCK_TRUCKS];
        
        // Filter by user role for mock data
        try {
          const userStr = localStorage.getItem('user');
          if (userStr) {
            const user = JSON.parse(userStr);
            if (user.role === 'shipment_partner') {
              // For partners, only show their own trucks
              // In a real app, backend handles this. For mock, we filter by createdBy._id if it matches,
              // or default to showing some if we don't have exact ID match in mock.
              // For better demo experience, let's show subset if ID doesn't match specific mock ones.
              trucks = trucks.filter(t => t.createdBy?._id === user._id || t.createdBy?._id === user.id);
              
              // If filtering resulted in empty (because mock IDs don't match live user ID), 
              // let's show a few generic ones for demo purposes if we really want, 
              // OR just return empty so they can add their own.
              // Returning empty is safer/more realistic.
            }
          }
        } catch (e) {
          console.error("Error filtering mock trucks", e);
        }

        if (status && status !== 'all') {
          trucks = trucks.filter(t => t.status === status);
        }
        return { trucks };
      }
      
      return data;
    } catch (error) {
      console.warn('Using mock trucks data:', error);
      let trucks = [...MOCK_TRUCKS];
      if (status && status !== 'all') {
        trucks = trucks.filter(t => t.status === status);
      }
      return { trucks };
    }
  },

  async approveTruck(id: string): Promise<{ success: boolean; message: string; truck: Truck }> {
    const response = await fetch(`${API_BASE}/trucks/${id}/approve`, {
      method: 'POST',
      headers: getJsonHeaders(),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to approve truck');
    }

    return response.json();
  },

  async rejectTruck(id: string, reason: string): Promise<{ success: boolean; message: string; truck: Truck }> {
    const response = await fetch(`${API_BASE}/trucks/${id}/reject`, {
      method: 'POST',
      headers: getJsonHeaders(),
      body: JSON.stringify({ reason }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to reject truck');
    }

    return response.json();
  },

  async deleteTruck(id: string): Promise<{ success: boolean; message: string }> {
    const response = await fetch(`${API_BASE}/trucks/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to delete truck');
    }

    return response.json();
  },

  // Drivers
  async addDriver(data: DriverFormData): Promise<{ success: boolean; message: string; driver: Driver }> {
    const formData = new FormData();
    formData.append('fullName', data.fullName);
    formData.append('mobile', data.mobile);
    formData.append('dlNo', data.dlNo);
    formData.append('aadhaar', data.aadhaar);
    if (data.photo) {
      formData.append('photo', data.photo);
    }

    const response = await fetch(`${API_BASE}/drivers`, {
      method: 'POST',
      headers: getHeaders(),
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to add driver');
    }

    return response.json();
  },

  async getDrivers(): Promise<{ drivers: Driver[] }> {
    try {
      const response = await fetch(`${API_BASE}/drivers`, {
        headers: getHeaders(),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch drivers');
      }

      const data = await response.json();
      
      // Safeguard: Filter by user role for real data too if backend doesn't
      try {
        const userStr = localStorage.getItem('user');
        if (userStr && data.drivers) {
          const user = JSON.parse(userStr);
          if (user.role === 'shipment_partner') {
             // Only show drivers created by this partner
             data.drivers = data.drivers.filter((d: any) => {
                const creatorId = typeof d.createdBy === 'object' ? d.createdBy?._id : d.createdBy;
                return creatorId === user._id || creatorId === user.id;
             });
          }
        }
      } catch (e) {
         console.error("Error filtering drivers", e);
      }

      // If no drivers data, use mock
      if (!data?.drivers || data.drivers.length === 0) {
        console.warn('Empty drivers data, using mock');
        let drivers = [...MOCK_DRIVERS];
        
        // Filter mock drivers by user role
        try {
          const userStr = localStorage.getItem('user');
          if (userStr) {
            const user = JSON.parse(userStr);
            if (user.role === 'shipment_partner') {
              drivers = drivers.filter(d => d.createdBy?._id === user._id || d.createdBy?._id === user.id);
            }
          }
        } catch (e) {
          console.error("Error filtering mock drivers", e);
        }
        
        return { drivers };
      }
      
      return data;
    } catch (error) {
      console.warn('Using mock drivers data:', error);
      return { drivers: [...MOCK_DRIVERS] };
    }
  },

  async deleteDriver(id: string): Promise<{ success: boolean; message: string }> {
    const response = await fetch(`${API_BASE}/drivers/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to delete driver');
    }

    return response.json();
  },
};
