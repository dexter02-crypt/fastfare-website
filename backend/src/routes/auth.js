import express from 'express';
import jwt from 'jsonwebtoken';
import { Resend } from 'resend';
import crypto from 'crypto';
import User from '../models/User.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// Generate JWT
const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

// ============= Resend Email Setup =============
const resendClient = new Resend(process.env.RESEND_API_KEY);
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';

// Send email helper using Resend
const sendEmail = async ({ to, subject, html }) => {
    const { data, error } = await resendClient.emails.send({
        from: `FastFare <${FROM_EMAIL}>`,
        to: [to],
        subject,
        html,
    });
    if (error) {
        console.error('Resend email error:', error);
        throw new Error(error.message || 'Failed to send email');
    }
    return data;
};

// ============= Registration OTP (Public - No Auth Required) =============

// In-memory OTP store: Map<email, { hashedCode, expires, verified }>
const registrationOtpStore = new Map();

// Clean up expired OTPs every 5 minutes
setInterval(() => {
    const now = Date.now();
    for (const [email, data] of registrationOtpStore.entries()) {
        if (now > data.expires) {
            registrationOtpStore.delete(email);
        }
    }
}, 5 * 60 * 1000);


// Send OTP to email for registration (no auth required)
router.post('/send-registration-otp', async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({ error: 'Email is required' });
        }

        const normalizedEmail = email.toLowerCase().trim();

        // Check if email is already registered
        const existingUser = await User.findOne({ email: normalizedEmail });
        if (existingUser) {
            return res.status(400).json({ error: 'This email is already registered. Please log in instead.' });
        }

        // Rate limiting: don't send again if last code was sent < 60 seconds ago
        const existing = registrationOtpStore.get(normalizedEmail);
        if (existing && existing.sentAt && (Date.now() - existing.sentAt) < 60000) {
            const waitSeconds = Math.ceil((60000 - (Date.now() - existing.sentAt)) / 1000);
            return res.status(429).json({
                error: `Please wait ${waitSeconds} seconds before requesting a new code`,
                retryAfter: waitSeconds,
            });
        }

        // Generate 6-digit code
        const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
        const hashedCode = crypto.createHash('sha256').update(verificationCode).digest('hex');

        // Store with 10-minute expiry
        registrationOtpStore.set(normalizedEmail, {
            hashedCode,
            expires: Date.now() + 10 * 60 * 1000,
            sentAt: Date.now(),
            verified: false,
        });

        // Send verification email
        await sendEmail({
            to: normalizedEmail,
            subject: 'FastFare — Verify Your Email',
            html: `
                <div style="font-family: 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px; background: #f9fafb;">
                    <div style="background: white; border-radius: 12px; padding: 40px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
                        <div style="text-align: center; margin-bottom: 30px;">
                            <h1 style="color: #011E41; font-size: 28px; margin: 0;">FastFare</h1>
                            <p style="color: #999; font-size: 14px; margin-top: 4px;">B2B Logistics Platform</p>
                        </div>
                        <h2 style="color: #333; font-size: 20px; text-align: center;">Email Verification</h2>
                        <p style="color: #666; line-height: 1.6; text-align: center;">
                            Use the following code to verify your email and complete registration:
                        </p>
                        <div style="text-align: center; margin: 30px 0;">
                            <div style="display: inline-block; background: #f0f4ff; border: 2px dashed #011E41; border-radius: 12px; padding: 20px 40px;">
                                <span style="font-size: 36px; font-weight: bold; letter-spacing: 8px; color: #011E41; font-family: monospace;">
                                    ${verificationCode}
                                </span>
                            </div>
                        </div>
                        <p style="color: #999; font-size: 13px; line-height: 1.5; text-align: center;">
                            This code expires in <strong>10 minutes</strong>. Do not share it with anyone.
                        </p>
                        <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;" />
                        <p style="color: #999; font-size: 12px; text-align: center;">
                            &copy; ${new Date().getFullYear()} FastFare. All rights reserved.
                        </p>
                    </div>
                </div>
            `,
        });

        res.json({
            success: true,
            message: 'Verification code sent',
            email: normalizedEmail.replace(/(.{2})(.*)(@.*)/, '$1***$3'),
        });

    } catch (error) {
        console.error('Send registration OTP error:', error);
        res.status(500).json({ error: 'Failed to send verification email. Please try again.' });
    }
});


// Verify registration OTP (no auth required)
router.post('/verify-registration-otp', async (req, res) => {
    try {
        const { email, code } = req.body;

        if (!email || !code) {
            return res.status(400).json({ error: 'Email and verification code are required' });
        }

        const normalizedEmail = email.toLowerCase().trim();
        const stored = registrationOtpStore.get(normalizedEmail);

        if (!stored) {
            return res.status(400).json({ error: 'No verification code found. Please request a new one.' });
        }

        if (Date.now() > stored.expires) {
            registrationOtpStore.delete(normalizedEmail);
            return res.status(400).json({ error: 'Code has expired. Please request a new one.' });
        }

        const hashedCode = crypto.createHash('sha256').update(code.toString()).digest('hex');

        if (hashedCode !== stored.hashedCode) {
            return res.status(400).json({ error: 'Invalid verification code' });
        }

        // Mark as verified
        stored.verified = true;
        registrationOtpStore.set(normalizedEmail, stored);

        res.json({
            success: true,
            message: 'Email verified successfully',
            verified: true,
        });

    } catch (error) {
        console.error('Verify registration OTP error:', error);
        res.status(500).json({ error: 'Verification failed' });
    }
});


// Register
router.post('/register', async (req, res) => {
    // Note: email must be verified via /send-registration-otp + /verify-registration-otp before registering
    try {
        const { businessName, gstin, businessType, contactPerson, email, phone, password, role } = req.body;

        // ⚠️ TODO: RE-ENABLE once domain email propagation is complete (48hr wait)
        // Check if email was verified via registration OTP
        // const normalizedEmail = email.toLowerCase().trim();
        // const otpData = registrationOtpStore.get(normalizedEmail);
        // if (!otpData || !otpData.verified) {
        //     return res.status(400).json({ error: 'Please verify your email before registering' });
        // }
        const normalizedEmail = email.toLowerCase().trim();

        // Validate role - only user and shipment_partner allowed through registration
        const validRoles = ['user', 'shipment_partner'];
        const userRole = role && validRoles.includes(role) ? role : 'user';

        // Block admin registration through this endpoint
        if (role === 'admin') {
            return res.status(403).json({ error: 'Admin accounts cannot be created through registration' });
        }

        // Check if user exists (email, phone, or gstin if provided)
        const orConditions = [
            { email },
            { phone }
        ];
        if (gstin && gstin.trim()) {
            orConditions.push({ gstin });
        }
        const userExists = await User.findOne({ $or: orConditions });

        if (userExists) {
            let errorMsg = 'User already exists';
            if (userExists.email === email) errorMsg = 'Email already registered';
            if (gstin && userExists.gstin === gstin) errorMsg = 'GSTIN already registered';
            if (userExists.phone === phone) errorMsg = 'Phone number already registered';

            return res.status(400).json({ error: errorMsg });
        }

        const userData = {
            businessName,
            gstin: gstin && gstin.trim() ? gstin.trim() : undefined,
            businessType,
            contactPerson,
            email,
            phone,
            password,
            role: userRole,
            isVerified: true,
            emailVerified: true,
        };

        if (userRole === 'shipment_partner') {
            const { fleetDetails, serviceZones, supportedTypes, baseFare, perKgRate, webhookUrl, features, eta, zone, city, aadhaar, address, state } = req.body;
            userData.partnerDetails = {
                fleetDetails: fleetDetails || { totalVehicles: 0, vehicleTypes: [] },
                serviceZones: serviceZones || [],
                supportedTypes: supportedTypes || ['standard'],
                baseFare: baseFare || 99,
                perKgRate: perKgRate || 10,
                webhookUrl: webhookUrl || '',
                features: features || [],
                eta: eta || '3-5 days',
                zone: zone || city || '',
                city: city || '',
                state: state || '',
                aadhaar: aadhaar || '',
                address: address || '',
                status: 'pending_approval'
            };
        }

        const user = await User.create(userData);

        // Clean up the OTP from store
        registrationOtpStore.delete(normalizedEmail);

        const token = generateToken(user._id);

        res.status(201).json({
            success: true,
            user: {
                id: user._id,
                businessName: user.businessName,
                email: user.email,
                phone: user.phone,
                businessType: user.businessType,
                gstin: user.gstin,
                contactPerson: user.contactPerson,
                role: user.role,
                kyc: user.kyc
            },
            token
        });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Login
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Find user by email or phone
        const user = await User.findOne({
            $or: [{ email: email }, { phone: email }]
        });

        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const token = generateToken(user._id);

        res.json({
            success: true,
            user: {
                id: user._id,
                businessName: user.businessName,
                email: user.email,
                phone: user.phone,
                businessType: user.businessType,
                gstin: user.gstin,
                contactPerson: user.contactPerson,
                role: user.role,
                partnerDetails: user.partnerDetails
            },
            token
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Get current user
router.get('/me', protect, async (req, res) => {
    res.json({
        success: true,
        user: {
            id: req.user._id,
            businessName: req.user.businessName,
            email: req.user.email,
            phone: req.user.phone,
            businessType: req.user.businessType,
            gstin: req.user.gstin,
            contactPerson: req.user.contactPerson,
            role: req.user.role,
            savedAddresses: req.user.savedAddresses,
            partnerDetails: req.user.partnerDetails
        }
    });
});

// Logout (client-side token removal)
router.post('/logout', (req, res) => {
    res.json({ success: true, message: 'Logged out successfully' });
});



// ============= Email Verification =============

// Send verification code to user's email
router.post('/send-verification', protect, async (req, res) => {
    try {
        const user = await User.findById(req.user._id);

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        if (user.emailVerified) {
            return res.json({ success: true, message: 'Email is already verified', alreadyVerified: true });
        }

        // Generate 6-digit verification code
        const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
        const hashedCode = crypto.createHash('sha256').update(verificationCode).digest('hex');

        // Store code with 10-minute expiry
        user.emailVerificationCode = hashedCode;
        user.emailVerificationExpires = new Date(Date.now() + 10 * 60 * 1000);
        await user.save({ validateBeforeSave: false });

        // Send verification email
        await sendEmail({
            to: user.email,
            subject: 'FastFare — Verify Your Email',
            html: `
                <div style="font-family: 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px; background: #f9fafb;">
                    <div style="background: white; border-radius: 12px; padding: 40px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
                        <div style="text-align: center; margin-bottom: 30px;">
                            <h1 style="color: #011E41; font-size: 28px; margin: 0;">FastFare</h1>
                            <p style="color: #999; font-size: 14px; margin-top: 4px;">B2B Logistics Platform</p>
                        </div>
                        <h2 style="color: #333; font-size: 20px; text-align: center;">Verify Your Email</h2>
                        <p style="color: #666; line-height: 1.6; text-align: center;">
                            Hello ${user.contactPerson || user.businessName},
                        </p>
                        <p style="color: #666; line-height: 1.6; text-align: center;">
                            Use the following code to verify your email address:
                        </p>
                        <div style="text-align: center; margin: 30px 0;">
                            <div style="display: inline-block; background: #f0f4ff; border: 2px dashed #011E41; border-radius: 12px; padding: 20px 40px;">
                                <span style="font-size: 36px; font-weight: bold; letter-spacing: 8px; color: #011E41; font-family: monospace;">
                                    ${verificationCode}
                                </span>
                            </div>
                        </div>
                        <p style="color: #999; font-size: 13px; line-height: 1.5; text-align: center;">
                            This code expires in <strong>10 minutes</strong>. Do not share it with anyone.
                        </p>
                        <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;" />
                        <p style="color: #999; font-size: 12px; text-align: center;">
                            &copy; ${new Date().getFullYear()} FastFare. All rights reserved.
                        </p>
                    </div>
                </div>
            `,
        });

        res.json({
            success: true,
            message: 'Verification code sent to your email',
            email: user.email.replace(/(.{2})(.*)(@.*)/, '$1***$3'), // Partially mask email
        });

    } catch (error) {
        console.error('Send verification error:', error);
        res.status(500).json({ error: 'Failed to send verification email. Please try again.' });
    }
});


// Verify the email code
router.post('/verify-email', protect, async (req, res) => {
    try {
        const { code } = req.body;

        if (!code) {
            return res.status(400).json({ error: 'Verification code is required' });
        }

        const user = await User.findById(req.user._id);

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        if (user.emailVerified) {
            return res.json({ success: true, message: 'Email is already verified', alreadyVerified: true });
        }

        // Check if code has expired
        if (!user.emailVerificationCode || !user.emailVerificationExpires) {
            return res.status(400).json({ error: 'No verification code was sent. Please request a new one.' });
        }

        if (new Date() > user.emailVerificationExpires) {
            // Clear expired code
            user.emailVerificationCode = undefined;
            user.emailVerificationExpires = undefined;
            await user.save({ validateBeforeSave: false });
            return res.status(400).json({ error: 'Verification code has expired. Please request a new one.' });
        }

        // Verify the code
        const hashedCode = crypto.createHash('sha256').update(code.toString()).digest('hex');

        if (hashedCode !== user.emailVerificationCode) {
            return res.status(400).json({ error: 'Invalid verification code' });
        }

        // Mark email as verified and clear the code
        user.emailVerified = true;
        user.isVerified = true;
        user.emailVerificationCode = undefined;
        user.emailVerificationExpires = undefined;
        await user.save({ validateBeforeSave: false });

        // Send confirmation email
        await sendEmail({
            to: user.email,
            subject: 'FastFare — Email Verified Successfully',
            html: `
                <div style="font-family: 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px; background: #f9fafb;">
                    <div style="background: white; border-radius: 12px; padding: 40px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
                        <div style="text-align: center; margin-bottom: 30px;">
                            <h1 style="color: #011E41; font-size: 28px; margin: 0;">FastFare</h1>
                        </div>
                        <div style="text-align: center; margin-bottom: 20px;">
                            <div style="display: inline-block; background: #d4edda; border-radius: 50%; padding: 16px;">
                                <span style="font-size: 32px;">✅</span>
                            </div>
                        </div>
                        <h2 style="color: #333; font-size: 20px; text-align: center;">Email Verified!</h2>
                        <p style="color: #666; line-height: 1.6; text-align: center;">
                            Hello ${user.contactPerson || user.businessName}, your email has been verified successfully. 
                            You now have full access to all FastFare features.
                        </p>
                        <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;" />
                        <p style="color: #999; font-size: 12px; text-align: center;">
                            &copy; ${new Date().getFullYear()} FastFare. All rights reserved.
                        </p>
                    </div>
                </div>
            `,
        }).catch(() => { }); // Don't fail the request if confirmation email fails

        res.json({
            success: true,
            message: 'Email verified successfully',
            verified: true,
        });

    } catch (error) {
        console.error('Verify email error:', error);
        res.status(500).json({ error: 'Failed to verify email' });
    }
});


// Check email verification status
router.get('/email-status', protect, async (req, res) => {
    try {
        const user = await User.findById(req.user._id).select('email emailVerified');
        res.json({
            success: true,
            email: user.email,
            verified: user.emailVerified || false,
        });
    } catch (error) {
        res.status(500).json({ error: 'Failed to check email status' });
    }
});


// ============= Forgot Password =============

// Request password reset (sends email with reset link)
router.post('/forgot-password', async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({ error: 'Email is required' });
        }

        const user = await User.findOne({ email: email.toLowerCase() });

        if (!user) {
            // Don't reveal if email exists — always return success
            return res.json({
                success: true,
                message: 'If an account with that email exists, a password reset link has been sent.',
            });
        }

        // Generate reset token
        const resetToken = crypto.randomBytes(32).toString('hex');
        const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');

        user.resetPasswordToken = hashedToken;
        user.resetPasswordExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
        await user.save({ validateBeforeSave: false });

        // Build reset URL
        const frontendUrl = process.env.FRONTEND_URL || 'https://fastfare.org';
        const resetUrl = `${frontendUrl}/reset-password?token=${resetToken}&email=${encodeURIComponent(email)}`;

        // Send email
        await sendEmail({
            to: user.email,
            subject: 'FastFare — Reset Your Password',
            html: `
                <div style="font-family: 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px; background: #f9fafb;">
                    <div style="background: white; border-radius: 12px; padding: 40px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
                        <div style="text-align: center; margin-bottom: 30px;">
                            <h1 style="color: #011E41; font-size: 28px; margin: 0;">FastFare</h1>
                        </div>
                        <h2 style="color: #333; font-size: 20px;">Reset Your Password</h2>
                        <p style="color: #666; line-height: 1.6;">
                            Hello ${user.contactPerson || user.businessName},
                        </p>
                        <p style="color: #666; line-height: 1.6;">
                            We received a request to reset your password. Click the button below to create a new password:
                        </p>
                        <div style="text-align: center; margin: 30px 0;">
                            <a href="${resetUrl}" style="display: inline-block; background: #011E41; color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 16px;">
                                Reset Password
                            </a>
                        </div>
                        <p style="color: #999; font-size: 13px; line-height: 1.5;">
                            This link expires in 1 hour. If you didn't request a password reset, you can safely ignore this email.
                        </p>
                        <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;" />
                        <p style="color: #999; font-size: 12px; text-align: center;">
                            &copy; ${new Date().getFullYear()} FastFare. All rights reserved.
                        </p>
                    </div>
                </div>
            `,
        });

        res.json({
            success: true,
            message: 'If an account with that email exists, a password reset link has been sent.',
        });

    } catch (error) {
        console.error('Forgot password error:', error);
        res.status(500).json({ error: 'Failed to process password reset request' });
    }
});


// Reset password (using token from email)
router.post('/reset-password', async (req, res) => {
    try {
        const { token, email, newPassword } = req.body;

        if (!token || !email || !newPassword) {
            return res.status(400).json({ error: 'Token, email, and new password are required' });
        }

        if (newPassword.length < 8) {
            return res.status(400).json({ error: 'Password must be at least 8 characters' });
        }

        const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

        const user = await User.findOne({
            email: email.toLowerCase(),
            resetPasswordToken: hashedToken,
            resetPasswordExpires: { $gt: Date.now() },
        });

        if (!user) {
            return res.status(400).json({ error: 'Invalid or expired reset token' });
        }

        // Update password
        user.password = newPassword;
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;
        await user.save();

        // Send confirmation email
        await sendEmail({
            to: user.email,
            subject: 'FastFare — Password Changed Successfully',
            html: `
                <div style="font-family: 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px; background: #f9fafb;">
                    <div style="background: white; border-radius: 12px; padding: 40px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
                        <div style="text-align: center; margin-bottom: 30px;">
                            <h1 style="color: #011E41; font-size: 28px; margin: 0;">FastFare</h1>
                        </div>
                        <h2 style="color: #333; font-size: 20px;">Password Changed</h2>
                        <p style="color: #666; line-height: 1.6;">
                            Hello ${user.contactPerson || user.businessName},
                        </p>
                        <p style="color: #666; line-height: 1.6;">
                            Your password has been changed successfully. If you did not make this change, please contact our support team immediately.
                        </p>
                        <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;" />
                        <p style="color: #999; font-size: 12px; text-align: center;">
                            &copy; ${new Date().getFullYear()} FastFare. All rights reserved.
                        </p>
                    </div>
                </div>
            `,
        }).catch(() => { }); // Don't fail if confirmation email fails

        res.json({
            success: true,
            message: 'Password has been reset successfully. You can now log in.',
        });

    } catch (error) {
        console.error('Reset password error:', error);
        res.status(500).json({ error: 'Failed to reset password' });
    }
});


// ============= Notification Email Preferences =============

// Get notification preferences
router.get('/notification-preferences', protect, async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        res.json({
            success: true,
            preferences: user.notificationPreferences || {
                emailShipmentUpdates: true,
                emailBilling: true,
                emailMarketing: false,
            },
        });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch notification preferences' });
    }
});

// Update notification preferences
router.put('/notification-preferences', protect, async (req, res) => {
    try {
        const { emailShipmentUpdates, emailBilling, emailMarketing } = req.body;
        const user = await User.findById(req.user._id);

        user.notificationPreferences = {
            emailShipmentUpdates: emailShipmentUpdates ?? user.notificationPreferences?.emailShipmentUpdates ?? true,
            emailBilling: emailBilling ?? user.notificationPreferences?.emailBilling ?? true,
            emailMarketing: emailMarketing ?? user.notificationPreferences?.emailMarketing ?? false,
        };

        await user.save({ validateBeforeSave: false });

        res.json({
            success: true,
            message: 'Notification preferences updated',
            preferences: user.notificationPreferences,
        });
    } catch (error) {
        res.status(500).json({ error: 'Failed to update notification preferences' });
    }
});


// ============= Send Notification Email (Internal Use) =============

// Send a notification email to a user (e.g., shipment update, billing)
router.post('/send-notification', protect, async (req, res) => {
    try {
        const { subject, message, type } = req.body;

        if (!subject || !message) {
            return res.status(400).json({ error: 'Subject and message are required' });
        }

        const user = await User.findById(req.user._id);

        // Check notification preferences
        if (type === 'shipment' && !user.notificationPreferences?.emailShipmentUpdates) {
            return res.json({ success: true, message: 'User has disabled shipment email notifications' });
        }
        if (type === 'billing' && !user.notificationPreferences?.emailBilling) {
            return res.json({ success: true, message: 'User has disabled billing email notifications' });
        }

        await sendEmail({
            to: user.email,
            subject: `FastFare — ${subject}`,
            html: `
                <div style="font-family: 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px; background: #f9fafb;">
                    <div style="background: white; border-radius: 12px; padding: 40px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
                        <div style="text-align: center; margin-bottom: 30px;">
                            <h1 style="color: #011E41; font-size: 28px; margin: 0;">FastFare</h1>
                        </div>
                        <h2 style="color: #333; font-size: 20px;">${subject}</h2>
                        <p style="color: #666; line-height: 1.6;">
                            Hello ${user.contactPerson || user.businessName},
                        </p>
                        <div style="color: #666; line-height: 1.6;">
                            ${message}
                        </div>
                        <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;" />
                        <p style="color: #999; font-size: 12px; text-align: center;">
                            &copy; ${new Date().getFullYear()} FastFare. All rights reserved.<br/>
                            <a href="${process.env.FRONTEND_URL || 'https://fastfare.org'}/settings" style="color: #999;">Manage notification preferences</a>
                        </p>
                    </div>
                </div>
            `,
        });

        res.json({ success: true, message: 'Notification email sent' });

    } catch (error) {
        console.error('Send notification error:', error);
        res.status(500).json({ error: 'Failed to send notification email' });
    }
});


export default router;
