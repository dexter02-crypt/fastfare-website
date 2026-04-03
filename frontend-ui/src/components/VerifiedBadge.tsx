import React from 'react';
import { CheckCircle, Clock, XCircle } from 'lucide-react';

interface VerifiedBadgeProps {
  status?: string; // 'verified' | 'initiated' | 'failed' | 'not_started'
  source?: string; // 'digilocker' | 'manual' | 'none'
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

const VerifiedBadge: React.FC<VerifiedBadgeProps> = ({
  status = 'not_started',
  source = 'none',
  size = 'sm',
  showLabel = true
}) => {
  const sizeClasses = {
    sm: 'text-xs gap-1',
    md: 'text-sm gap-1.5',
    lg: 'text-base gap-2',
  };

  const iconSize = {
    sm: 'w-3.5 h-3.5',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  };

  if (status === 'verified') {
    return (
      <span className={`inline-flex items-center ${sizeClasses[size]} px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-medium`}>
        <CheckCircle className={iconSize[size]} />
        {showLabel && (
          <span>{source === 'digilocker' ? 'DigiLocker Verified' : 'Verified'}</span>
        )}
      </span>
    );
  }

  if (status === 'initiated') {
    return (
      <span className={`inline-flex items-center ${sizeClasses[size]} px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 font-medium`}>
        <Clock className={iconSize[size]} />
        {showLabel && <span>Verification Pending</span>}
      </span>
    );
  }

  if (status === 'failed') {
    return (
      <span className={`inline-flex items-center ${sizeClasses[size]} px-2 py-0.5 rounded-full bg-red-50 text-red-700 border border-red-200 font-medium`}>
        <XCircle className={iconSize[size]} />
        {showLabel && <span>Verification Failed</span>}
      </span>
    );
  }

  // not_started
  return (
    <span className={`inline-flex items-center ${sizeClasses[size]} px-2 py-0.5 rounded-full bg-gray-50 text-gray-500 border border-gray-200 font-medium`}>
      <XCircle className={iconSize[size]} />
      {showLabel && <span>Not Verified</span>}
    </span>
  );
};

export default VerifiedBadge;
