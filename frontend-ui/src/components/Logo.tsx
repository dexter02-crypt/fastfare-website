import React from "react";
import { cn } from "@/lib/utils";

// Using the public folder paths based on project usages
const LOGO_FULL = "/logo.png";
const LOGO_ICON = "/logo-icon.png";

export interface LogoProps {
    size?: "sm" | "md" | "lg";
    variant?: "full" | "icon";
    className?: string;     // Wrapper classes
    imgClassName?: string;  // Image specific classes
}

const Logo: React.FC<LogoProps> = ({
    size = "md",
    variant = "full",
    className,
    imgClassName,
}) => {
    const isFull = variant === "full";

    const ht = {
        sm: "32px",
        md: "40px",
        lg: "56px",
    }[size];

    // Sizing specs
    const mdStyles = size === "md" ? {
        minHeight: "36px",
        maxHeight: "44px",
        maxWidth: "160px"
    } : {};

    return (
        <div className={cn("flex items-center min-w-fit overflow-visible", className)}>
            <img
                src={isFull ? LOGO_FULL : LOGO_ICON}
                alt="FastFare Logo"
                style={{
                    height: ht,
                    width: "auto",
                    objectFit: "contain",
                    backgroundColor: "transparent",
                    flexShrink: 0,
                    ...mdStyles
                }}
                className={cn(imgClassName)}
            />
        </div>
    );
};

export default Logo;
