import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from './ui/button';

interface BackButtonProps {
    fallback?: string;
    label?: string;
    variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
    size?: "default" | "sm" | "lg" | "icon";
    className?: string;
}

export const BackButton = ({ fallback = '/dashboard', label, variant = "ghost", size = "icon", className }: BackButtonProps) => {
    const navigate = useNavigate();

    const handleBack = () => {
        if (window.history.length > 2) {
            navigate(-1);
        } else {
            navigate(fallback);
        }
    };

    return (
        <Button
            variant={variant}
            size={label ? "default" : size}
            onClick={handleBack}
            className={className}
            aria-label="Go back"
        >
            <ArrowLeft className={label ? "h-4 w-4 mr-2" : "h-5 w-5"} />
            {label && <span>{label}</span>}
        </Button>
    );
};
