import { API_BASE_URL as BASE_URL } from "@/config";

const API_BASE_URL = `${BASE_URL}/api`;

// Type definitions
export interface ShipmentData {
    pickupAddress: AddressData;
    deliveryAddress: AddressData;
    packageDetails: PackageDetails;
    paymentType?: string;
    serviceType?: string;
}

export interface AddressData {
    name: string;
    phone: string;
    email?: string;
    address: string;
    city: string;
    state: string;
    pincode: string;
    country?: string;
}

export interface PackageDetails {
    weight: number;
    length?: number;
    width?: number;
    height?: number;
    description?: string;
    value?: number;
}

export interface ProfileData {
    businessName?: string;
    contactPerson?: string;
    phone?: string;
    address?: string;
}

export interface ShipmentUpdate {
    status?: string;
    notes?: string;
}

// Get token from localStorage
const getToken = () => localStorage.getItem('token');

// API request helper
const apiRequest = async (endpoint: string, options: RequestInit = {}) => {
    const token = getToken();

    const config: RequestInit = {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
            ...options.headers,
        },
    };

    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.error || 'API request failed');
    }

    return data;
};

// Auth API
export const authApi = {
    register: async (userData: {
        businessName: string;
        gstin: string;
        businessType: string;
        contactPerson: string;
        email: string;
        phone: string;
        password: string;
    }) => {
        const data = await apiRequest('/auth/register', {
            method: 'POST',
            body: JSON.stringify(userData),
        });
        if (data.token) {
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));
        }
        return data;
    },

    login: async (email: string, password: string) => {
        const data = await apiRequest('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email, password }),
        });
        if (data.token) {
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));
        }
        return data;
    },

    logout: () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
    },

    getCurrentUser: () => {
        const user = localStorage.getItem('user');
        return user ? JSON.parse(user) : null;
    },

    isAuthenticated: () => {
        return !!getToken();
    },

    getMe: async () => {
        return apiRequest('/auth/me');
    },
};

// Shipments API
export const shipmentsApi = {
    create: async (shipmentData: ShipmentData) => {
        return apiRequest('/shipments', {
            method: 'POST',
            body: JSON.stringify(shipmentData),
        });
    },

    getAll: async (params?: { status?: string; page?: number; limit?: number; search?: string }) => {
        const query = new URLSearchParams();
        if (params?.status) query.append('status', params.status);
        if (params?.page) query.append('page', params.page.toString());
        if (params?.limit) query.append('limit', params.limit.toString());
        if (params?.search) query.append('search', params.search);

        return apiRequest(`/shipments?${query.toString()}`);
    },

    getById: async (id: string) => {
        return apiRequest(`/shipments/${id}`);
    },

    update: async (id: string, updates: ShipmentUpdate) => {
        return apiRequest(`/shipments/${id}`, {
            method: 'PUT',
            body: JSON.stringify(updates),
        });
    },

    cancel: async (id: string) => {
        return apiRequest(`/shipments/${id}/cancel`, {
            method: 'POST',
        });
    },

    getDashboardStats: async () => {
        return apiRequest('/shipments/stats/dashboard');
    },
};

// Tracking API
export const trackingApi = {
    track: async (awb: string) => {
        return apiRequest(`/tracking/${awb}`);
    },

    getProofOfDelivery: async (awb: string) => {
        return apiRequest(`/tracking/${awb}/pod`);
    },
};

// User API
export const userApi = {
    updateProfile: async (profileData: ProfileData) => {
        const data = await apiRequest('/users/profile', {
            method: 'PUT',
            body: JSON.stringify(profileData),
        });
        if (data.user) {
            localStorage.setItem('user', JSON.stringify(data.user));
        }
        return data;
    },

    getAddresses: async () => {
        return apiRequest('/users/addresses');
    },

    addAddress: async (address: AddressData) => {
        return apiRequest('/users/addresses', {
            method: 'POST',
            body: JSON.stringify(address),
        });
    },

    deleteAddress: async (id: string) => {
        return apiRequest(`/users/addresses/${id}`, {
            method: 'DELETE',
        });
    },

    changePassword: async (currentPassword: string, newPassword: string) => {
        return apiRequest('/users/password', {
            method: 'PUT',
            body: JSON.stringify({ currentPassword, newPassword }),
        });
    },
};

// GSTIN API
export const gstinApi = {
    verify: async (gstin: string) => {
        return apiRequest('/gstin/verify', {
            method: 'POST',
            body: JSON.stringify({ gstin }),
        });
    },
};

// Payment API
export const paymentApi = {
    createOrder: async (amount: number) => {
        return apiRequest('/payment/create-order', {
            method: 'POST',
            body: JSON.stringify({ amount }),
        });
    },

    verifyPayment: async (paymentData: {
        razorpay_order_id: string;
        razorpay_payment_id: string;
        razorpay_signature: string;
    }) => {
        return apiRequest('/payment/verify', {
            method: 'POST',
            body: JSON.stringify(paymentData),
        });
    },
};

// ─── WMS (Warehouse Management System) API ───
export const wmsApi = {
    // Vehicles
    getVehicles: async () => apiRequest('/wms/vehicles'),
    addVehicle: async (data: any) => apiRequest('/wms/vehicles', { method: 'POST', body: JSON.stringify(data) }),
    updateVehicle: async (id: string, data: any) => apiRequest(`/wms/vehicles/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    deleteVehicle: async (id: string) => apiRequest(`/wms/vehicles/${id}`, { method: 'DELETE' }),

    // Drivers
    getDrivers: async () => apiRequest('/wms/drivers'),
    addDriver: async (data: any) => apiRequest('/wms/drivers', { method: 'POST', body: JSON.stringify(data) }),
    updateDriver: async (id: string, data: any) => apiRequest(`/wms/drivers/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    deleteDriver: async (id: string) => apiRequest(`/wms/drivers/${id}`, { method: 'DELETE' }),

    // Trips
    getTrips: async (status?: string) => apiRequest(`/wms/trips${status ? `?status=${status}` : ''}`),
    createTrip: async (data: any) => apiRequest('/wms/trips', { method: 'POST', body: JSON.stringify(data) }),
    updateTripStatus: async (id: string, data: any) => apiRequest(`/wms/trips/${id}/status`, { method: 'PUT', body: JSON.stringify(data) }),

    // Inventory
    getInventory: async () => apiRequest('/wms/inventory'),
    addInventoryItem: async (data: any) => apiRequest('/wms/inventory', { method: 'POST', body: JSON.stringify(data) }),
    updateInventoryItem: async (id: string, data: any) => apiRequest(`/wms/inventory/${id}`, { method: 'PUT', body: JSON.stringify(data) }),

    // RTD (Return to Depot)
    getRTDReports: async () => apiRequest('/wms/rtd'),
    createRTD: async (data: any) => apiRequest('/wms/rtd', { method: 'POST', body: JSON.stringify(data) }),
    resolveRTD: async (id: string, data: any) => apiRequest(`/wms/rtd/${id}/resolve`, { method: 'PUT', body: JSON.stringify(data) }),

    // Stats
    getStats: async () => apiRequest('/wms/stats'),

    // Reports
    getReportSummary: async () => apiRequest('/wms/reports/summary'),

    // Inbound
    getInboundShipments: async () => apiRequest('/wms/inbound'),
    createInbound: async (data: any) => apiRequest('/wms/inbound', { method: 'POST', body: JSON.stringify(data) }),
    updateInboundStatus: async (id: string, status: string) => apiRequest(`/wms/inbound/${id}/status`, { method: 'PUT', body: JSON.stringify({ status }) }),

    // Live Tracking
    getTrackingSessions: async () => apiRequest('/wms/tracking'),
    getTrackingById: async (id: string) => apiRequest(`/wms/tracking/${id}`),
};

// ─── Settlement & Tier API ───
export const settlementApi = {
    // Settlement
    trigger: async (orderId: string) => apiRequest('/settlement/trigger', { method: 'POST', body: JSON.stringify({ orderId }) }),
    getSchedule: async () => apiRequest('/settlement/schedule'),
    getHistory: async (page = 1, limit = 20) => apiRequest(`/settlement/history?page=${page}&limit=${limit}`),
    getLedger: async (page = 1, limit = 50, type?: string) => apiRequest(`/settlement/ledger?page=${page}&limit=${limit}${type ? `&type=${type}` : ''}`),
    process: async () => apiRequest('/settlement/process', { method: 'POST' }),

    // Seller Dashboard
    getDashboard: async () => apiRequest('/seller/dashboard'),
    getPerformance: async () => apiRequest('/seller/performance'),

    // Tiers
    getCurrentTier: async () => apiRequest('/tiers/current'),
    getTierHistory: async (page = 1) => apiRequest(`/tiers/history?page=${page}`),
    evaluateTiers: async (sellerId?: string) => apiRequest('/tiers/evaluate', { method: 'POST', body: JSON.stringify({ sellerId }) }),

    // COD
    getCodReconciliation: async (page = 1, status?: string) => apiRequest(`/cod/reconciliation?page=${page}${status ? `&status=${status}` : ''}`),

    // Partner Withdrawals
    requestWithdrawal: async (amount: number, bankDetails?: any) => apiRequest('/partner/withdraw', { method: 'POST', body: JSON.stringify({ amount, bankDetails }) }),
    getWithdrawals: async () => apiRequest('/partner/withdrawals'),
    getPartnerEarnings: async () => apiRequest('/partner/earnings'),

    // Admin Withdrawal Management
    getAdminWithdrawals: async (status?: string, page = 1) => apiRequest(`/partner/admin/withdrawals?page=${page}${status ? `&status=${status}` : ''}`),
    approveWithdrawal: async (id: string, transactionRef?: string, adminNote?: string) => apiRequest(`/partner/admin/withdrawals/${id}/approve`, { method: 'PUT', body: JSON.stringify({ transactionRef, adminNote }) }),
    rejectWithdrawal: async (id: string, rejectionReason?: string) => apiRequest(`/partner/admin/withdrawals/${id}/reject`, { method: 'PUT', body: JSON.stringify({ rejectionReason }) }),

    // Admin Partner Management
    getAdminPartners: async (page = 1, search?: string, tier?: string) => apiRequest(`/admin/partners?page=${page}${search ? `&search=${search}` : ''}${tier ? `&tier=${tier}` : ''}`),
    getAdminPartnerDetail: async (id: string) => apiRequest(`/admin/partners/${id}`),
    overrideTier: async (sellerId: string, newTier: string, reason: string) => apiRequest('/admin/override/tier', { method: 'POST', body: JSON.stringify({ sellerId, newTier, reason }) }),
    holdPayout: async (partnerId: string, action: string, reason: string) => apiRequest('/admin/override/payout-hold', { method: 'POST', body: JSON.stringify({ partnerId, action, reason }) }),
    updateAccountStatus: async (id: string, status: string, reason: string) => apiRequest(`/admin/partners/${id}/status`, { method: 'PUT', body: JSON.stringify({ status, reason }) }),
    deleteAccount: async (id: string, reason: string) => apiRequest(`/admin/partners/${id}`, { method: 'DELETE', body: JSON.stringify({ reason }) }),
};

export default {
    auth: authApi,
    shipments: shipmentsApi,
    tracking: trackingApi,
    user: userApi,
    gstin: gstinApi,
    payment: paymentApi,
    wms: wmsApi,
    settlement: settlementApi,
};

