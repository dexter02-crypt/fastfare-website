import { useState } from "react";
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
import { Bell, Search, Menu, X, User, Settings, LogOut } from "lucide-react";
import DashboardSidebar from "./DashboardSidebar";
import Header from "./Header";
import { authApi } from "@/lib/api";

interface DashboardLayoutProps {
    children: React.ReactNode;
}

const DashboardLayout = ({ children }: DashboardLayoutProps) => {
    const navigate = useNavigate();
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const user = authApi.getCurrentUser();

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

            {/* Desktop Sidebar */}
            <div className="hidden lg:block">
                <DashboardSidebar
                    collapsed={sidebarCollapsed}
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
                    sidebarCollapsed ? "lg:pl-[72px]" : "lg:pl-[260px]"
                )}
            >
                {/* Page Content */}
                <main className="p-4 lg:p-6">{children}</main>
            </div>
        </div>
    );
};

export default DashboardLayout;
