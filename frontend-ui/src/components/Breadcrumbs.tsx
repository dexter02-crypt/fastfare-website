import { Link, useLocation } from "react-router-dom";
import { ChevronRight, Home } from "lucide-react";

interface BreadcrumbItem {
    label: string;
    href?: string;
}

interface BreadcrumbsProps {
    items: BreadcrumbItem[];
    className?: string;
}

export const Breadcrumbs = ({ items, className = "" }: BreadcrumbsProps) => {
    return (
        <nav aria-label="Breadcrumb" className={`flex items-center text-sm text-muted-foreground ${className}`}>
            <ol className="flex items-center space-x-2">
                <li>
                    <Link
                        to="/dashboard"
                        className="flex items-center hover:text-foreground transition-colors"
                    >
                        <Home className="h-4 w-4" />
                        <span className="sr-only">Home</span>
                    </Link>
                </li>
                {items.map((item, index) => {
                    const isLast = index === items.length - 1;

                    return (
                        <li key={item.label} className="flex items-center space-x-2">
                            <ChevronRight className="h-4 w-4" />
                            {isLast || !item.href ? (
                                <span
                                    className="font-medium text-foreground"
                                    aria-current={isLast ? "page" : undefined}
                                >
                                    {item.label}
                                </span>
                            ) : (
                                <Link
                                    to={item.href}
                                    className="hover:text-foreground transition-colors"
                                >
                                    {item.label}
                                </Link>
                            )}
                        </li>
                    );
                })}
            </ol>
        </nav>
    );
};
