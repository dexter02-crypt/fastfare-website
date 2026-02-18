import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Bell, Search, Menu, X, User, Settings, LogOut, AlertTriangle } from "lucide-react";
import DashboardSidebar from "./DashboardSidebar";
import Header from "./Header";
import { authApi } from "@/lib/api";

interface DashboardLayoutProps {
    children: React.ReactNode;
}

const DashboardLayout = ({ children }: DashboardLayoutProps) => {
    const navigate = useNavigate();
    const [sidebarCollapsed, setSidebarCollapsed] = useState(true);
    const [sidebarHovered, setSidebarHovered] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const user = authApi.getCurrentUser();

    // Check if KYC/GSTIN is incomplete
    const needsKyc = user && (!user.gstin || user.kyc?.status === 'pending');

    // Sidebar expands on hover, collapses when mouse leaves
    const effectiveCollapsed = sidebarCollapsed && !sidebarHovered;

    // Lock body scroll when mobile sidebar is open
    useEffect(() => {
        if (mobileMenuOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => { document.body.style.overflow = ''; };
    }, [mobileMenuOpen]);

    const handleLogout = () => {
        authApi.logout();
        navigate("/login");
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
        }
    };

    const getInitials = (name: string) => {
        return name
            .split(" ")
            .map((n) => n[0])
            .join("")
            .toUpperCase()
            .slice(0, 2);
    };

    return (
        <div className="min-h-screen bg-background">
            {/* Global Header */}
            <Header mobileMenuOpen={mobileMenuOpen} onMobileMenuToggle={() => setMobileMenuOpen(!mobileMenuOpen)} />

            {/* Desktop Sidebar — hover to expand */}
            <div
                className="hidden lg:block"
                onMouseEnter={() => setSidebarHovered(true)}
                onMouseLeave={() => setSidebarHovered(false)}
            >
                <DashboardSidebar
                    collapsed={effectiveCollapsed}
                    onCollapse={setSidebarCollapsed}
                />
            </div>

            {/* Mobile Sidebar Overlay */}
            <div
                className={`lg:hidden fixed inset-0 z-40 transition-opacity duration-300 ${mobileMenuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
            >
                <div
                    className="absolute inset-0 bg-black/50 transition-opacity duration-300"
                    onClick={() => setMobileMenuOpen(false)}
                />
                <div
                    className={`absolute left-0 top-16 h-[calc(100vh-4rem)] w-[260px] bg-background transform transition-transform duration-300 ease-in-out ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}
                >
                    <DashboardSidebar onMobileItemClick={() => setMobileMenuOpen(false)} />
                </div>
            </div>

            {/* Main Content Area */}
            <div
                className={cn(
                    "transition-all duration-300",
                    effectiveCollapsed ? "lg:pl-[72px]" : "lg:pl-[260px]"
                )}
            >
                {/* KYC Alert Banner */}
                {needsKyc && (
                    <div className="mb-4 mx-4 lg:mx-6 mt-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3 dark:bg-red-950/30 dark:border-red-800">
                        <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
                        <div className="flex-1">
                            <p className="text-sm font-semibold text-red-800 dark:text-red-200">
                                KYC Verification Incomplete
                            </p>
                            <p className="text-sm text-red-700 dark:text-red-300 mt-0.5">
                                Please complete your KYC and GSTIN verification to unlock all features.
                            </p>
                        </div>
                        <Link
                            to="/settings/kyc"
                            className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-md transition-colors flex-shrink-0"
                        >
                            Complete KYC
                        </Link>
                    </div>
                )}

                {/* Page Content */}
                <main className="p-4 lg:p-6 pt-2">{children}</main>
            </div>
        </div>
    );
};

export default DashboardLayout;
