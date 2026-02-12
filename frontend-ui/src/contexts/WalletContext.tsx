import React, { createContext, useContext, useState, useEffect } from "react";
import { API_BASE_URL } from "@/config";
import { authApi } from "@/lib/api";

interface WalletContextType {
    balance: number;
    refreshBalance: () => Promise<void>;
    isLoading: boolean;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export const WalletProvider = ({ children }: { children: React.ReactNode }) => {
    const [balance, setBalance] = useState(500000);
    const [isLoading, setIsLoading] = useState(true);

    const refreshBalance = async () => {
        try {
            const token = localStorage.getItem("token");
            if (!token) {
                setBalance(500000);
                return;
            }

            const response = await fetch(`${API_BASE_URL}/api/payment/wallet`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (response.ok) {
                const data = await response.json();
                setBalance(data.balance || 0);
            }
        } catch (error) {
            console.error("Failed to fetch wallet balance", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (authApi.isAuthenticated()) {
            refreshBalance();
        } else {
            setBalance(500000);
            setIsLoading(false);
        }
    }, []);

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
