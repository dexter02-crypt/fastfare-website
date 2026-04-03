import express from 'express';
import jwt from 'jsonwebtoken';
import { Resend } from 'resend';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import { protect } from '../middleware/auth.js';
import { Otp } from '../models/Otp.js';
import { PendingRegistration } from '../models/PendingRegistration.js';
import OnboardingEvent from '../models/OnboardingEvent.js';
import { generateOTP } from '../utils/otpGenerator.js';
import { sendPasswordResetEmail, sendPasswordChangedEmail } from '../utils/emailSender.js';

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

import { EmailVerification } from '../models/EmailVerification.js';
import { sendRegistrationOtpEmail } from '../utils/emailSender.js';

// Send OTP to email for registration
router.post('/send-registration-otp', async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) {
            return res.status(400).json({ error: 'Please enter a valid email address.' });
        }
        const normalizedEmail = email.toLowerCase().trim();

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(normalizedEmail)) {
            return res.status(400).json({ error: 'Please enter a valid email address.' });
        }

        const existingUser = await User.findOne({ email: normalizedEmail });
        // NOTE: Partner check uses User model since partners are inside User but we will explicitly block anyways
        if (existingUser) {
            return res.status(400).json({ error: 'An account with this email already exists. Please log in instead.' });
        }

        // Rate limiting: 3 reqs per 15 minutes
        const fifteenMinsAgo = new Date(Date.now() - 15 * 60 * 1000);
        const attemptCount = await EmailVerification.countDocuments({
            email: normalizedEmail,
            purpose: 'registration',
            createdAt: { $gte: fifteenMinsAgo }
        });

        if (attemptCount >= 3) {
            return res.status(429).json({ error: 'Too many OTP requests. Please wait 15 minutes before trying again.' });
        }

        // Generate cryptographically secure OTP
        const otpCode = crypto.randomInt(100000, 999999).toString();
        const otpHash = crypto.createHash('sha256').update(otpCode).digest('hex');

        // Delete old unexpired codes
        await EmailVerification.deleteMany({ email: normalizedEmail, purpose: 'registration' });

        // Save new OTP
        await EmailVerification.create({
            email: normalizedEmail,
            otpHash,
            purpose: 'registration',
            expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
        });

        // Send Email
        try {
            await sendRegistrationOtpEmail(normalizedEmail, otpCode);
        } catch (emailErr) {
            console.error('Failed to dispatch registration email via Resend:', emailErr);
            return res.status(500).json({ error: 'We had trouble sending the verification email. Please check your email address and try again, or contact support@fastfare.in.' });
        }

        res.status(200).json({
            success: true,
            message: 'A 6-digit verification code has been sent to your email. Please check your inbox.',
        });
    } catch (error) {
        console.error('Send registration OTP error:', error);
        res.status(500).json({ error: 'Failed to send verification email. Please try again.' });
    }
});

// Verify registration OTP (no auth required)
router.post('/verify-registration-otp', async (req, res) => {
    try {
        const { email, otp } = req.body;
        if (!email || !otp) {
            return res.status(400).json({ error: 'Email and verification code are required' });
        }
        
        const normalizedEmail = email.toLowerCase().trim();
        const record = await EmailVerification.findOne({ email: normalizedEmail, purpose: 'registration' });

        if (!record) {
            return res.status(400).json({ error: 'No verification code was requested for this email. Please go back and try again.' });
        }
        if (new Date() > record.expiresAt) {
            return res.status(400).json({ error: 'Your verification code has expired. Please request a new one.' });
        }
        if (record.used) {
            return res.status(400).json({ error: 'This verification code has already been used.' });
        }

        if (record.attempts >= 5) {
            await EmailVerification.deleteOne({ _id: record._id });
            return res.status(400).json({ error: 'Too many incorrect attempts. Please request a new verification code.' });
        }

        const hashedCode = crypto.createHash('sha256').update(otp.toString()).digest('hex');
        if (hashedCode !== record.otpHash) {
            record.attempts += 1;
            await record.save();
            return res.status(400).json({ error: 'Incorrect verification code. Please check and try again.' });
        }

        record.used = true;
        await record.save();

        const verifiedToken = jwt.sign(
            { email: normalizedEmail, purpose: 'registration', verified: true },
            process.env.JWT_SECRET,
            { expiresIn: '30m' }
        );

        res.status(200).json({
            success: true,
            verifiedToken
        });
    } catch (error) {
        console.error('Verify registration OTP error:', error);
        res.status(500).json({ error: 'Verification failed' });
    }
});


// Register
router.post('/register/initiate-digilocker', async (req, res) => {
    try {
        const { email, businessName, businessType, contactPerson, phone, gstin } = req.body;
        
        if (!email || !phone) return res.status(400).json({ error: 'Email and phone are required.' });

        const existingUser = await User.findOne({ email });
        if (existingUser) return res.status(409).json({ error: 'An account with this email already exists. Please sign in.' });

        const pendingReg = await PendingRegistration.create({
            email, businessName, businessType, contactPerson, phone, gstin,
            status: "pending_digilocker"
        });

        const state = crypto.randomBytes(32).toString('hex');
        
        // PKCE: Generate code_verifier and code_challenge
        const codeVerifier = crypto.randomBytes(32).toString('base64url');
        const codeChallenge = crypto.createHash('sha256').update(codeVerifier).digest('base64url');

        req.session.digilocker_oauth_state = state;
        req.session.digilocker_pending_reg_id = pendingReg._id.toString();
        req.session.digilocker_code_verifier = codeVerifier;

        const clientId = process.env.DIGILOCKER_CLIENT_ID;
        const redirectUri = process.env.DIGILOCKER_REDIRECT_URI;
        
        if (!clientId || !redirectUri) return res.status(500).json({ error: 'DigiLocker config missing' });

        req.session.save((err) => {
             if (err) return res.status(500).json({ error: 'Failed to initialize sign up session' });
             
             const authUrl = new URL('https://api.digitallocker.gov.in/public/oauth2/1/authorize');
             authUrl.searchParams.append('response_type', 'code');
             authUrl.searchParams.append('client_id', clientId);
             authUrl.searchParams.append('redirect_uri', redirectUri);
             authUrl.searchParams.append('state', state);
             authUrl.searchParams.append('code_challenge', codeChallenge);
             authUrl.searchParams.append('code_challenge_method', 'S256');
             
             res.json({ auth_url: authUrl.toString(), pending_id: pendingReg._id.toString() });
        });
    } catch (error) {
        console.error('Initiate error:', error);
        res.status(500).json({ error: 'Failed to initiate DigiLocker verification.' });
    }
});

router.post('/register', async (req, res) => {
    // Note: email must be verified via /send-registration-otp + /verify-registration-otp before registering
    try {
        const { 
            verifiedToken, businessName, gstin, businessType, contactPerson, email, phone, password, role,
            digilocker_verified, digilocker_id, kyc_name, kyc_dob, kyc_gender, pending_registration_id
        } = req.body;

        if (!verifiedToken) {
            return res.status(400).json({ error: 'Email verification is required before creating an account.' });
        }

        let decoded;
        try {
            decoded = jwt.verify(verifiedToken, process.env.JWT_SECRET);
        } catch (err) {
            return res.status(401).json({ error: 'Email verification failed or expired. Please verify your email again.' });
        }

        if (decoded.purpose !== 'registration' || !decoded.verified || !decoded.email) {
            return res.status(401).json({ error: 'Email verification failed or expired. Please verify your email again.' });
        }

        const normalizedEmail = email.toLowerCase().trim();
        if (decoded.email !== normalizedEmail) {
            return res.status(401).json({ error: 'Email verification failed or expired. Please verify your email again.' });
        }

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

        if (digilocker_verified) {
            userData.kyc_status = "verified";
            userData.digilocker_verified = true;
            userData.digilocker_verified_at = new Date();
            userData.digilocker_id = digilocker_id;
            userData.kyc_name = kyc_name;
            userData.kyc_dob = kyc_dob;
            userData.kyc_gender = kyc_gender;
            userData.kyc = {
                status: 'verified',
                verifiedAt: new Date(),
                digilocker: {
                    status: 'verified',
                    verifiedAt: new Date(),
                    dob: kyc_dob || '',
                    gender: kyc_gender || ''
                }
            };
            // Set verified identity for onboarding
            userData.verifiedIdentity = {
                source: 'digilocker',
                status: 'verified',
                fullName: kyc_name,
                dob: kyc_dob,
                gender: kyc_gender,
                digilockerId: digilocker_id,
                verifiedAt: new Date(),
                lastAttemptAt: new Date(),
                attemptCount: 1
            };
            // Auto-approve clean user registrations; partners always go to pending_review
            if (userRole === 'user') {
                userData.onboardingStatus = 'approved';
                userData.onboardingApprovedAt = new Date();
                userData.payoutEligible = true;
                userData.operationallyActive = true;
            } else {
                userData.onboardingStatus = 'pending_review';
                userData.onboardingSubmittedAt = new Date();
            }
        } else {
            userData.kyc_status = "pending";
            userData.digilocker_verified = false;
            userData.verifiedIdentity = { source: 'none', status: 'not_started' };
            if (userRole === 'user') {
                userData.onboardingStatus = 'draft';
            } else {
                userData.onboardingStatus = 'draft';
            }
        }

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

        // Log onboarding event
        await OnboardingEvent.create({
            targetUserId: user._id,
            targetRole: user.role,
            eventType: digilocker_verified && userRole === 'user' ? 'auto_approved' : 'account_created',
            actorId: user._id,
            actorRole: userRole === 'shipment_partner' ? 'partner' : 'user',
            previousStatus: null,
            newStatus: user.onboardingStatus,
            reason: digilocker_verified && userRole === 'user' 
                ? 'Auto-approved: DigiLocker verified at registration' 
                : 'Account created via registration'
        });

        // Clean up the OTP from collection
        await EmailVerification.deleteMany({ email: normalizedEmail, purpose: 'registration' });
        
        if (pending_registration_id) {
            await PendingRegistration.findByIdAndDelete(pending_registration_id);
        }

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
                kyc: user.kyc,
                partnerDetails: user.partnerDetails,
                onboardingStatus: user.onboardingStatus,
                verifiedIdentity: {
                    source: user.verifiedIdentity?.source,
                    status: user.verifiedIdentity?.status,
                    fullName: user.verifiedIdentity?.fullName,
                    verifiedAt: user.verifiedIdentity?.verifiedAt,
                },
                payoutEligible: user.payoutEligible,
                operationallyActive: user.operationallyActive,
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
                partnerDetails: user.partnerDetails,
                onboardingStatus: user.onboardingStatus || 'approved',
                verifiedIdentity: {
                    source: user.verifiedIdentity?.source || 'none',
                    status: user.verifiedIdentity?.status || 'not_started',
                    fullName: user.verifiedIdentity?.fullName || null,
                    verifiedAt: user.verifiedIdentity?.verifiedAt || null,
                },
                payoutEligible: user.payoutEligible || false,
                operationallyActive: user.operationallyActive || false,
                nameMismatchFlag: user.nameMismatchFlag || false,
                reviewFlags: user.reviewFlags || [],
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
            partnerDetails: req.user.partnerDetails,
            onboardingStatus: req.user.onboardingStatus || 'approved',
            verifiedIdentity: {
                source: req.user.verifiedIdentity?.source || 'none',
                status: req.user.verifiedIdentity?.status || 'not_started',
                fullName: req.user.verifiedIdentity?.fullName || null,
                verifiedAt: req.user.verifiedIdentity?.verifiedAt || null,
            },
            payoutEligible: req.user.payoutEligible || false,
            operationallyActive: req.user.operationallyActive || false,
            nameMismatchFlag: req.user.nameMismatchFlag || false,
            reviewFlags: req.user.reviewFlags || [],
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


// ============= Forgot Password (OTP-based) =============

const forgotPasswordRateLimit = new Map();
const usedResetTokensCache = new Set();

// Periodically clean up rate limit map
setInterval(() => {
    const now = Date.now();
    for (const [email, data] of forgotPasswordRateLimit.entries()) {
        if (now - data.windowStart > 15 * 60 * 1000) forgotPasswordRateLimit.delete(email);
    }
}, 15 * 60 * 1000);

// Request password reset (sends OTP email)
router.post('/forgot-password', async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) {
            return res.status(400).json({ error: 'Email is required' });
        }

        const normalizedEmail = email.toLowerCase().trim();

        // Rate limiting
        const now = Date.now();
        const windowMs = 15 * 60 * 1000;
        let rlRecord = forgotPasswordRateLimit.get(normalizedEmail);
        
        if (!rlRecord || now - rlRecord.windowStart > windowMs) {
            forgotPasswordRateLimit.set(normalizedEmail, { count: 1, windowStart: now });
        } else {
            if (rlRecord.count >= 3) {
                return res.status(429).json({ success: false, message: 'Too many requests. Please wait before requesting another code.' });
            }
            rlRecord.count++;
        }

        const user = await User.findOne({ email: normalizedEmail });

        // Don't reveal if email exists — always return success
        if (!user) {
            return res.json({
                success: true,
                message: 'If this email is registered, a reset code has been sent.',
            });
        }

        // Invalidate previous unexpired OTPs for this email to prevent flooding
        await Otp.updateMany({ email: normalizedEmail, used: false }, { used: true });

        // Generate OTP
        const otpCode = generateOTP();
        const otpHash = crypto.createHash('sha256').update(otpCode).digest('hex');

        // Store OTP
        await Otp.create({
            email: normalizedEmail,
            otpHash,
            expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
            used: false,
            attempts: 0
        });

        // Send Email
        await sendPasswordResetEmail(normalizedEmail, otpCode);

        res.json({
            success: true,
            message: 'If this email is registered, a reset code has been sent.',
        });

    } catch (error) {
        console.error('Forgot password error:', error);
        res.status(500).json({ error: 'Failed to process password reset request' });
    }
});

// Verify OTP
router.post('/verify-otp', async (req, res) => {
    try {
        const { email, otp } = req.body;
        if (!email || !otp) {
            return res.status(400).json({ error: 'Email and OTP are required' });
        }

        const normalizedEmail = email.toLowerCase().trim();
        const otpHash = crypto.createHash('sha256').update(otp).digest('hex');

        const otpRecord = await Otp.findOne({
            email: normalizedEmail,
            used: false,
            expiresAt: { $gt: Date.now() }
        }).sort({ createdAt: -1 });

        if (!otpRecord) {
            return res.status(400).json({ success: false, message: 'Invalid or expired code.' });
        }

        // Validate OTP
        if (otpRecord.otpHash !== otpHash) {
            otpRecord.attempts = (otpRecord.attempts || 0) + 1;
            if (otpRecord.attempts >= 5) {
                otpRecord.used = true; // Invalidate
                await otpRecord.save();
                return res.status(400).json({ success: false, message: 'Too many failed attempts. Please request a new code.' });
            }
            await otpRecord.save();
            return res.status(400).json({ success: false, message: 'Invalid or expired code.' });
        }

        // Valid OTP
        otpRecord.used = true;
        await otpRecord.save();

        // Return short-lived signed JWT correctly issued for password reset
        const resetToken = jwt.sign(
            { email: normalizedEmail, purpose: 'password_reset' },
            process.env.JWT_SECRET,
            { expiresIn: '5m' }
        );

        res.json({ success: true, resetToken });

    } catch (error) {
        console.error('Verify OTP error:', error);
        res.status(500).json({ error: 'Failed to verify OTP' });
    }
});

// Reset password
router.post('/reset-password', async (req, res) => {
    console.log('reset-password body received:', req.body);
    const { resetToken, newPassword } = req.body;

    if (!resetToken || typeof resetToken !== 'string' || resetToken.trim() === '') {
        return res.status(400).json({ success: false, message: "Reset token is missing." });
    }

    if (!newPassword || typeof newPassword !== 'string' || newPassword.trim() === '') {
        return res.status(400).json({ success: false, message: "New password is required." });
    }

    if (newPassword.length < 8) {
        return res.status(400).json({ success: false, message: "Password too short." });
    }

    if (!/[A-Z]/.test(newPassword)) {
        return res.status(400).json({ success: false, message: "Password needs uppercase." });
    }

    if (!/[a-z]/.test(newPassword)) {
        return res.status(400).json({ success: false, message: "Password needs lowercase." });
    }

    if (!/[0-9]/.test(newPassword)) {
        return res.status(400).json({ success: false, message: "Password needs a number." });
    }

    if (!/[^A-Za-z0-9]/.test(newPassword)) {
        return res.status(400).json({ success: false, message: "Password needs a special character." });
    }

    console.log('Password passed all validation checks');

    let decoded;
    try {
        decoded = jwt.verify(resetToken, process.env.JWT_SECRET);
        console.log('Token decoded successfully:', decoded);
    } catch (err) {
        return res.status(401).json({ success: false, message: "Invalid or expired reset token." });
    }

    if (decoded.purpose !== 'password_reset' && decoded.purpose !== 'reset') {
        return res.status(401).json({ success: false, message: "Invalid token purpose." });
    }

    const userEmail = decoded.email;
    const user = await User.findOne({ email: userEmail });

    if (!user) {
        return res.status(404).json({ success: false, message: "User not found." });
    }

    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    await User.updateOne({ _id: user._id }, { $set: { password: hashedPassword } });

    // Send Password Changed Successfully Email asynchronously
    sendPasswordChangedEmail(user.email, user.name || user.email.split('@')[0]).catch(err => {
        console.error('Failed to send password changed notification email:', err);
    });

    return res.status(200).json({ success: true, message: "Password updated successfully." });
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
                            <a href="${process.env.FRONTEND_URL || 'https://fastfare.in'}/settings" style="color: #999;">Manage notification preferences</a>
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
