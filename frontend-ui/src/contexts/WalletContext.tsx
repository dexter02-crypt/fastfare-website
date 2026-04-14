import { createContext, useContext, useState, useEffect, useCallback, useRef, ReactNode } from "react";
import { useLocation } from "react-router-dom";
import { API_BASE_URL } from "@/config";
import { authApi } from "@/lib/api";

interface WalletContextType {
    balance: number;
    refreshBalance: () => Promise<void>;
    isLoading: boolean;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export const WalletProvider = ({ children }: { children: ReactNode }) => {
    const [balance, setBalance] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const location = useLocation();
    const lastFetchRef = useRef(0);

    const refreshBalance = useCallback(async () => {
        try {
            const token = localStorage.getItem("token");
            if (!token) {
                setBalance(0);
                return;
            }

            const response = await fetch(`${API_BASE_URL}/api/payment/wallet`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (response.ok) {
                const data = await response.json();
                setBalance(data.balance || 0);
                lastFetchRef.current = Date.now();
            }
        } catch (error) {
            console.error("Failed to fetch wallet balance", error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Refresh on mount
    useEffect(() => {
        if (authApi.isAuthenticated()) {
            refreshBalance();
        } else {
            setBalance(0);
            setIsLoading(false);
        }
    }, [refreshBalance]);

    // Refresh on route change (throttled — at most once per 5 seconds)
    useEffect(() => {
        if (!authApi.isAuthenticated()) return;
        const now = Date.now();
        if (now - lastFetchRef.current > 5000) {
            refreshBalance();
        }
    }, [location.pathname, refreshBalance]);

    // Periodic refresh every 60 seconds as a safety net
    useEffect(() => {
        if (!authApi.isAuthenticated()) return;
        const interval = setInterval(() => {
            refreshBalance();
        }, 60000);
        return () => clearInterval(interval);
    }, [refreshBalance]);

    return (
        <WalletContext.Provider value={{ balance, refreshBalance, isLoading }}>
            {children}
        </WalletContext.Provider>
    );
};

export const useWallet = () => {
    const context = useContext(WalletContext);
    if (context === undefined) {
        throw new Error("useWallet must be used within a WalletProvider");
    }
    return context;
};

