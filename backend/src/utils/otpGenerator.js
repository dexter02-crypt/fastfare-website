import crypto from 'crypto';

/**
 * Generate a cryptographically secure 6-digit OTP code
 * @returns {string} 6-digit numeric string
 */
export const generateOTP = () => {
    // Generate an integer between 100000 and 999999 inclusive
    const otp = crypto.randomInt(100000, 1000000);
    return otp.toString();
};
