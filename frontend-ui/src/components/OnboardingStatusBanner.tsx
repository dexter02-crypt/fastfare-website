import React, { useState } from 'react';
import { Info, Clock, X, Loader2 } from 'lucide-react';
import { useDigilocker } from '@/contexts/DigilockerContext';
import { digilockerApi, authApi } from '@/lib/api';
import { toast } from 'sonner';

/**
 * DigiLocker verification banner.
 *
 * Reads from DigilockerContext (which fetches per-user from the backend).
 * Renders nothing while loading or when the user is already verified.
 * Dismissible per user per browser session (keyed by user ID).
 */
const OnboardingStatusBanner: React.FC = () => {
    const { digilocker_verified, kyc_status, loading } = useDigilocker();
    const currentUser = authApi.getCurrentUser();
    const dismissKey = `digilocker_banner_dismissed_${currentUser?.id || currentUser?._id || 'unknown'}`;
    const [dismissed, setDismissed] = useState(() =>
        sessionStorage.getItem(dismissKey) === 'true'
    );
    const [initLoading, setInitLoading] = useState(false);

    // ── Gate: hide while fetching, if verified, or if dismissed ──
    if (loading) return null;
    if (digilocker_verified || kyc_status === 'verified') return null;
    if (dismissed) return null;

    const handleDismiss = () => {
        sessionStorage.setItem(dismissKey, 'true');
        setDismissed(true);
    };

    const handleVerify = async () => {
        setInitLoading(true);
        try {
            const data = await digilockerApi.initAuth();
            if (data?.auth_url) {
                window.location.href = data.auth_url;
            } else {
                toast.error('Could not connect to DigiLocker. Please try again.');
            }
        } catch (err) {
            toast.error('Could not connect to DigiLocker. Please try again.');
        } finally {
            setInitLoading(false);
        }
    };

    // ── Pending variant (yellow) ──
    if (kyc_status === 'in_progress') {
        return (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4 relative">
                <div className="flex items-start gap-3">
                    <div className="text-amber-700 mt-0.5 flex-shrink-0">
                        <Clock className="w-5 h-5 animate-pulse" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <h4 className="text-amber-800 font-semibold text-sm">Verification In Progress</h4>
                        <p className="text-amber-700 text-sm mt-1 opacity-90">
                            Your DigiLocker verification is being processed. This usually takes a few minutes.
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    // ── Default: not_started / false – blue prompt ──
    return (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4 relative">
            {/* Dismiss button */}
            <button
                onClick={handleDismiss}
                className="absolute top-2.5 right-2.5 p-1 rounded-md text-blue-400 hover:text-blue-600 hover:bg-blue-100 transition-colors"
                aria-label="Dismiss banner"
            >
                <X className="w-4 h-4" />
            </button>

            <div className="flex items-start gap-3 pr-6">
                <div className="text-blue-600 mt-0.5 flex-shrink-0">
                    <Info className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                    <h4 className="text-blue-800 font-semibold text-sm">Complete Your Profile</h4>
                    <p className="text-blue-700 text-sm mt-1 opacity-90">
                        Complete your profile and verify with DigiLocker to get started on FastFare.
                    </p>
                    <button
                        onClick={handleVerify}
                        disabled={initLoading}
                        className="mt-3 inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-md bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60 transition-colors"
                    >
                        {initLoading ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Connecting…
                            </>
                        ) : (
                            'Verify with DigiLocker'
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default OnboardingStatusBanner;
