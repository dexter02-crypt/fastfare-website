import { useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { CheckCircle2, Home, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function AccountDeletedConfirmation() {
    const navigate = useNavigate();
    const location = useLocation();
    
    // Fallback if accessed directly
    const emailReleased = location.state?.email || 'your email';

    return (
        <div className="min-h-screen bg-[#F8F9FA] flex flex-col items-center justify-center p-4">
            <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="max-w-md w-full bg-white rounded-2xl shadow-xl overflow-hidden text-center"
            >
                <div className="bg-[#10B981] p-8 pb-12 rounded-b-[50%] mb-[-30px]">
                    <div className="mx-auto bg-white/20 w-20 h-20 rounded-full flex items-center justify-center">
                        <CheckCircle2 className="h-10 w-10 text-white" />
                    </div>
                </div>

                <div className="p-8 pt-12">
                    <h1 className="text-2xl font-bold text-[#1A1A2E] mb-2">Account Deleted</h1>
                    <p className="text-gray-600 mb-6">
                        Your FastFare account has been successfully and permanently removed from our systems.
                    </p>

                    <div className="bg-gray-50 border border-gray-100 rounded-xl p-5 mb-8 text-sm text-left">
                        <h3 className="font-semibold text-gray-900 mb-2">What happens next:</h3>
                        <ul className="space-y-2 text-gray-600">
                            <li className="flex items-start">
                                <span className="text-[#10B981] mr-2">✓</span>
                                All associated personal data, shipments, and billing have been erased.
                            </li>
                            <li className="flex items-start">
                                <span className="text-[#10B981] mr-2">✓</span>
                                The email <span className="font-medium text-gray-800 mx-1">{emailReleased}</span> is now free to use again.
                            </li>
                            <li className="flex items-start">
                                <span className="text-[#10B981] mr-2">✓</span>
                                Confirmation has been sent to your email.
                            </li>
                        </ul>
                    </div>

                    <div className="space-y-3">
                        <Button 
                            className="w-full bg-[#FF6B00] hover:bg-[#E66000] text-white h-12"
                            onClick={() => navigate('/register')}
                        >
                            <UserPlus className="h-4 w-4 mr-2" />
                            Create a New Account
                        </Button>
                        <Button 
                            variant="ghost" 
                            className="w-full text-gray-500 hover:text-gray-900 h-12"
                            onClick={() => navigate('/')}
                        >
                            <Home className="h-4 w-4 mr-2" />
                            Return to Homepage
                        </Button>
                    </div>
                </div>
            </motion.div>
            
            <p className="mt-8 text-sm text-gray-400">
                © {new Date().getFullYear()} FastFare Technologies Pvt. Ltd.
            </p>
        </div>
    );
}
