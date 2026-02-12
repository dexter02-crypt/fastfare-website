/**
 * API Configuration for FastFare Partners Scan
 * Connects to PC WMS backend for pickup management
 */

// PC WMS Backend URL - change this for different environments
export const API_CONFIG = {
    // Development: Use localhost or PC IP
    BASE_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000',
    SOCKET_URL: process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:5000',
};

// API client using fetch
const api = {
    async get(endpoint: string) {
        const response = await fetch(`${API_CONFIG.BASE_URL}/api${endpoint}`, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${typeof window !== 'undefined' ? localStorage.getItem('token') || '' : ''}`
            }
        });
        if (!response.ok) throw new Error(`API Error: ${response.status}`);
        return response.json();
    },

    async post(endpoint: string, data: any) {
        const response = await fetch(`${API_CONFIG.BASE_URL}/api${endpoint}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${typeof window !== 'undefined' ? localStorage.getItem('token') || '' : ''}`
            },
            body: JSON.stringify(data)
        });
        if (!response.ok) throw new Error(`API Error: ${response.status}`);
        return response.json();
    },

    async put(endpoint: string, data: any) {
        const response = await fetch(`${API_CONFIG.BASE_URL}/api${endpoint}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${typeof window !== 'undefined' ? localStorage.getItem('token') || '' : ''}`
            },
            body: JSON.stringify(data)
        });
        if (!response.ok) throw new Error(`API Error: ${response.status}`);
        return response.json();
    },

    async delete(endpoint: string) {
        const response = await fetch(`${API_CONFIG.BASE_URL}/api${endpoint}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${typeof window !== 'undefined' ? localStorage.getItem('token') || '' : ''}`
            }
        });
        if (!response.ok) throw new Error(`API Error: ${response.status}`);
        return response.json();
    }
};

export default api;
