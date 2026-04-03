import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { digilockerApi, authApi } from '@/lib/api';

interface DigilockerState {
    digilocker_verified: boolean;
    digilocker_verified_at: string | null;
    kyc_name: string | null;
    kyc_status: 'verified' | 'not_started' | 'pending' | 'in_progress';
    loading: boolean;
}

interface DigilockerContextValue extends DigilockerState {
    /** Force-set verified state (e.g. after callback redirect) */
    markVerified: () => void;
    /** Re-fetch status from the backend */
    refetch: () => Promise<void>;
}

const defaultState: DigilockerState = {
    digilocker_verified: false,
    digilocker_verified_at: null,
    kyc_name: null,
    kyc_status: 'not_started',
    loading: true,
};

const DigilockerContext = createContext<DigilockerContextValue>({
    ...defaultState,
    markVerified: () => {},
    refetch: async () => {},
});

export const useDigilocker = () => useContext(DigilockerContext);

export const DigilockerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [state, setState] = useState<DigilockerState>(defaultState);

    const fetchStatus = useCallback(async () => {
        if (!authApi.isAuthenticated()) {
            setState(prev => ({ ...prev, loading: false }));
            return;
        }
        try {
            const data = await digilockerApi.getStatus();
            setState({
                digilocker_verified: !!data.digilocker_verified,
                digilocker_verified_at: data.digilocker_verified_at || null,
                kyc_name: data.kyc_name || null,
                kyc_status: data.digilocker_verified ? 'verified' : (data.kyc_status || 'not_started'),
                loading: false,
            });
        } catch (err) {
            console.error('Failed to fetch DigiLocker status:', err);
            setState(prev => ({ ...prev, loading: false }));
        }
    }, []);

    useEffect(() => {
        fetchStatus();
    }, [fetchStatus]);

    useEffect(() => {
        if (state.kyc_status === 'in_progress' && !state.digilocker_verified) {
            const interval = setInterval(() => {
                fetchStatus();
            }, 10000);
            return () => clearInterval(interval);
        }
    }, [state.kyc_status, state.digilocker_verified, fetchStatus]);

    const markVerified = useCallback(() => {
        setState(prev => ({
            ...prev,
            digilocker_verified: true,
            kyc_status: 'verified',
            digilocker_verified_at: new Date().toISOString(),
        }));
    }, []);

    return (
        <DigilockerContext.Provider value={{ ...state, markVerified, refetch: fetchStatus }}>
            {children}
        </DigilockerContext.Provider>
    );
};

export default DigilockerContext;
