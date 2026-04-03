/*
 RESEND SETUP CHECKLIST — complete before deploying:
 1. Go to resend.com → Domains → Add Domain → add fastfare.in
 2. Add the DNS records Resend provides (MX, TXT, DKIM) to your domain registrar
 3. Wait for domain verification (usually 5-30 minutes)
 4. Go to resend.com → API Keys → Create API Key → copy and add to RESEND_API_KEY env variable
 5. Set EMAIL_FROM=noreply@fastfare.in in your environment variables
 6. Test by sending a test email from the Resend dashboard before going live
*/

import { Resend } from 'resend';

// Use the API key from environment, optionally caching the instance
let resendClient = null;

const getResendClient = () => {
    if (!resendClient && process.env.RESEND_API_KEY) {
        resendClient = new Resend(process.env.RESEND_API_KEY);
    }
    return resendClient;
};

export const sendPasswordResetEmail = async (email, otpCode) => {
    const client = getResendClient();
    if (!client) {
        console.warn('RESEND_API_KEY is not defined. Skipping password reset email send.');
        return;
    }

    const fromEmail = process.env.EMAIL_FROM || 'noreply@fastfare.in';
    const year = new Date().getFullYear();
    const expiryMinutes = 10;

    const htmlTemplate = `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f9fafb; padding: 40px 20px;">
            <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05); overflow: hidden;">
                <div style="background-color: #011E41; padding: 24px; text-align: center;">
                    <h1 style="color: #ffffff; margin: 0; font-size: 24px; letter-spacing: 1px;">FastFare</h1>
                </div>
                <div style="padding: 40px 30px;">
                    <h2 style="color: #1f2937; margin-top: 0; font-size: 20px;">Forgot Your Password?</h2>
                    <p style="color: #4b5563; line-height: 1.6; font-size: 16px;">
                        We received a request to reset the password for your FastFare account associated with this email address.
                    </p>
                    <p style="color: #4b5563; line-height: 1.6; font-size: 16px;">
                        Please use the following 6-digit verification code to complete the process:
                    </p>
                    
                    <div style="text-align: center; margin: 35px 0;">
                        <span style="display: inline-block; background-color: #f3f4f6; border: 1px solid #e5e7eb; border-radius: 6px; padding: 16px 32px; font-size: 32px; font-weight: bold; letter-spacing: 6px; color: #111827;">
                            ${otpCode}
                        </span>
                    </div>
                    
                    <p style="color: #4b5563; line-height: 1.6; font-size: 16px;">
                        This code is valid for <strong>${expiryMinutes} minutes</strong>. If you did not request this password reset, please ignore this email or contact support if you have concerns.
                    </p>
                </div>
                <div style="background-color: #f3f4f6; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb;">
                    <p style="color: #6b7280; font-size: 13px; margin: 0;">
                        &copy; ${year} FastFare. All rights reserved.
                    </p>
                </div>
            </div>
        </div>
    `;

    try {
        const { data, error } = await client.emails.send({
            from: `FastFare <${fromEmail}>`,
            to: email,
            subject: 'Your FastFare Password Reset Code',
            html: htmlTemplate,
        });

        if (error) {
            console.error('Error sending password reset email:', error);
            if (process.env.NODE_ENV === 'development') {
                console.log('\n=============================================');
                console.log(`[DEV MODE] Password reset email failed to send (Resend API strict limits).`);
                console.log(`[DEV MODE] OTP for ${email} is: ${otpCode}`);
                console.log('=============================================\n');
                return { success: true, bypassed: true };
            }
            throw new Error('Failed to send email via Resend');
        }

        return data;
    } catch (err) {
        console.error('Exception in sendPasswordResetEmail:', err);
        if (process.env.NODE_ENV === 'development') {
            console.log('\n=============================================');
            console.log(`[DEV MODE] Password reset email exception caught.`);
            console.log(`[DEV MODE] OTP for ${email} is: ${otpCode}`);
            console.log('=============================================\n');
            return { success: true, bypassed: true };
        }
        throw err;
    }
};

export const sendPasswordChangedEmail = async (email, userName) => {
    const client = getResendClient();
    if (!client) {
        console.warn('RESEND_API_KEY is not defined. Skipping password changed email.');
        return;
    }

    const fromEmail = process.env.EMAIL_FROM || 'support@fastfare.in';
    const year = new Date().getFullYear();

    const htmlTemplate = `
        <div style="font-family: 'Inter', 'Segoe UI', sans-serif; background-color: #f3f4f6; padding: 40px 20px;">
            <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05); overflow: hidden;">
                <div style="background: linear-gradient(135deg, #10b981, #059669); padding: 30px; text-align: center;">
                    <div style="background-color: white; width: 64px; height: 64px; border-radius: 50%; margin: 0 auto 16px; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 10px rgba(0,0,0,0.1);">
                        <span style="font-size: 32px;">✓</span>
                    </div>
                    <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: bold;">Password Updated</h1>
                </div>
                <div style="padding: 40px 30px;">
                    <p style="color: #374151; font-size: 16px; line-height: 1.6; margin-top: 0;">Hi ${userName},</p>
                    <p style="color: #374151; font-size: 16px; line-height: 1.6;">
                        Your FastFare account password was recently changed. If you made this change, you can safely ignore this email.
                    </p>
                    
                    <div style="background-color: #fef2f2; border-left: 4px solid #ef4444; padding: 16px; margin: 30px 0; border-radius: 4px;">
                        <p style="color: #991b1b; margin: 0; font-size: 14px; font-weight: 500;">
                            Didn't change your password?
                        </p>
                        <p style="color: #7f1d1d; margin: 8px 0 0 0; font-size: 14px;">
                            Please contact our support team immediately at <a href="mailto:support@fastfare.in" style="color: #ef4444; text-decoration: underline;">support@fastfare.in</a> to secure your account.
                        </p>
                    </div>
                    
                    <div style="text-align: center; margin-top: 40px;">
                        <a href="https://fastfare.in/login" style="background-color: #2563eb; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: 500; font-size: 16px; display: inline-block;">
                            Go to Login
                        </a>
                    </div>
                </div>
                
                <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 0;" />
                
                <div style="padding: 24px; background-color: #f9fafb; text-align: center;">
                    <p style="color: #6b7280; font-size: 13px; margin: 0 0 8px 0;">FastFare Logistics Platform</p>
                    <p style="color: #9ca3af; font-size: 12px; margin: 0;">&copy; ${year} FastFare. All rights reserved.</p>
                </div>
            </div>
        </div>
    `;

    try {
        const { error } = await client.emails.send({
            from: `FastFare Security <${fromEmail}>`,
            to: email,
            subject: 'Security Alert: Your FastFare password has been changed',
            html: htmlTemplate,
        });

        if (error) {
            console.error('Error sending password changed email:', error);
            throw new Error('Failed to send email via Resend');
        }
        return { success: true };
    } catch (err) {
        console.error('Exception in sendPasswordChangedEmail:', err);
        throw err;
    }
};

export const sendRegistrationOtpEmail = async (email, otpCode) => {
    const client = getResendClient();
    if (!client) {
        console.warn('RESEND_API_KEY is not defined. Skipping registration OTP email send.');
        return;
    }

    const fromEmail = process.env.EMAIL_FROM || 'noreply@fastfare.in';
    const year = new Date().getFullYear();

    const htmlTemplate = `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f9fafb; padding: 40px 20px;">
            <div style="display: none; max-height: 0px; overflow: hidden;">Your FastFare email verification code is ${otpCode}. Valid for 10 minutes. Do not share this with anyone.</div>
            <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05); overflow: hidden;">
                <div style="background: linear-gradient(135deg, #1a3c8f, #2563eb); padding: 24px; text-align: center;">
                    <div style="display: inline-block; background-color: #ffffff; color: #1a3c8f; border-radius: 8px; padding: 4px 8px; font-weight: bold; margin-bottom: 8px; font-size: 18px;">FF</div>
                    <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: bold;">FastFare</h1>
                    <p style="color: #bfdbfe; font-size: 12px; margin: 4px 0 0 0; letter-spacing: 1px;">LOGISTICS PLATFORM</p>
                </div>
                <div style="padding: 40px 30px; background-color: #ffffff;">
                    <div style="text-align: center; margin-bottom: 24px;">
                        <div style="display: inline-block; background-color: #eff6ff; width: 64px; height: 64px; border-radius: 50%; line-height: 64px; font-size: 28px;">✉️</div>
                    </div>
                    <h2 style="color: #111827; margin-top: 0; font-size: 24px; font-weight: bold; text-align: center;">Confirm Your Email Address</h2>
                    <p style="color: #374151; line-height: 1.6; font-size: 15px; text-align: center;">
                        You're almost there! Enter the code below to verify your email address and complete your FastFare account setup.
                    </p>
                    
                    <div style="text-align: center; margin: 35px 0; background-color: #f0f7ff; border: 2px dashed #2563eb; border-radius: 12px; padding: 20px 48px;">
                        <span style="display: block; color: #2563eb; font-size: 11px; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 12px;">Your Verification Code</span>
                        <span style="display: block; color: #1a3c8f; font-size: 42px; font-weight: bold; font-family: monospace; letter-spacing: 10px;">
                            ${otpCode}
                        </span>
                        <span style="display: block; color: #9ca3af; font-size: 12px; margin-top: 12px;">Valid for 10 minutes only</span>
                    </div>
                    
                    <div style="border-left: 4px solid #f59e0b; background-color: #fffbeb; padding: 16px; margin-top: 30px;">
                        <p style="color: #92400e; margin: 0; font-size: 14px; line-height: 1.5;">
                            ⚠️ <strong>Did not request this?</strong> If you did not try to create a FastFare account, please ignore this email. No account will be created unless this code is entered.
                        </p>
                    </div>
                </div>
                
                <hr style="border: none; border-top: 1px solid #f3f4f6; margin: 28px 0;" />
                
                <div style="padding: 20px; text-align: center;">
                    <p style="color: #9ca3af; font-size: 12px; margin: 0 0 8px 0;">This is an automated message from FastFare. Please do not reply to this email.</p>
                    <p style="color: #9ca3af; font-size: 12px; margin: 0 0 8px 0;">FastFare Logistics Pvt Ltd, Gurgaon, Haryana, India</p>
                    <p style="color: #9ca3af; font-size: 12px; margin: 0 0 16px 0;">&copy; ${year} FastFare. All rights reserved.</p>
                    <p style="color: #9ca3af; font-size: 12px; margin: 0;">
                        <a href="https://fastfare.in/privacy" style="color: #2563eb; text-decoration: none;">Privacy Policy</a> &middot; 
                        <a href="https://fastfare.in/terms" style="color: #2563eb; text-decoration: none;">Terms of Service</a>
                    </p>
                </div>
            </div>
        </div>
    `;

    try {
        const { error } = await client.emails.send({
            from: `FastFare <${fromEmail}>`,
            to: email,
            subject: 'Verify your FastFare account — OTP inside',
            html: htmlTemplate,
        });

        if (error) {
            console.error('Error sending registration OTP email:', error);
            if (process.env.NODE_ENV === 'development') {
                console.log('\n=============================================');
                console.log(`[DEV MODE] Registration email failed to send (Resend API strict limits).`);
                console.log(`[DEV MODE] Registration OTP for ${email} is: ${otpCode}`);
                console.log('=============================================\n');
                return { success: true, bypassed: true };
            }
            throw new Error('Failed to send email via Resend');
        }
        return { success: true };
    } catch (err) {
        console.error('Exception in sendRegistrationOtpEmail:', err);
        if (process.env.NODE_ENV === 'development') {
            console.log('\n=============================================');
            console.log(`[DEV MODE] Registration email exception caught.`);
            console.log(`[DEV MODE] Registration OTP for ${email} is: ${otpCode}`);
            console.log('=============================================\n');
            return { success: true, bypassed: true };
        }
        throw err;
    }
};


// ══════════════════════════════════════════════════
// Onboarding Notification Emails
// ══════════════════════════════════════════════════

const onboardingEmailWrapper = (iconEmoji, headerBg, headerTitle, bodyHtml) => {
    const year = new Date().getFullYear();
    return `
        <div style="font-family: 'Inter', 'Segoe UI', sans-serif; background-color: #f3f4f6; padding: 40px 20px;">
            <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.05); overflow: hidden;">
                <div style="background: ${headerBg}; padding: 30px; text-align: center;">
                    <div style="background-color: white; width: 64px; height: 64px; border-radius: 50%; margin: 0 auto 16px; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 10px rgba(0,0,0,0.1);">
                        <span style="font-size: 32px;">${iconEmoji}</span>
                    </div>
                    <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: bold;">${headerTitle}</h1>
                    <p style="color: rgba(255,255,255,0.8); font-size: 12px; margin: 4px 0 0 0; letter-spacing: 1px;">FASTFARE LOGISTICS</p>
                </div>
                <div style="padding: 40px 30px;">
                    ${bodyHtml}
                </div>
                <div style="padding: 24px; background-color: #f9fafb; text-align: center; border-top: 1px solid #e5e7eb;">
                    <p style="color: #6b7280; font-size: 13px; margin: 0 0 8px 0;">FastFare Logistics Pvt Ltd</p>
                    <p style="color: #9ca3af; font-size: 12px; margin: 0;">&copy; ${year} FastFare. All rights reserved.</p>
                </div>
            </div>
        </div>
    `;
};

export const sendOnboardingApprovedEmail = async (email, userName, role) => {
    const client = getResendClient();
    if (!client) return;
    const fromEmail = process.env.EMAIL_FROM || 'noreply@fastfare.in';
    const roleLabel = role === 'shipment_partner' ? 'Delivery Partner' : 'User';
    const body = `
        <h2 style="color: #065f46; margin-top: 0; font-size: 22px; text-align: center;">Your Account Has Been Approved! 🎉</h2>
        <p style="color: #374151; font-size: 15px; line-height: 1.6;">Hi ${userName},</p>
        <p style="color: #374151; font-size: 15px; line-height: 1.6;">
            Great news! Your <strong>FastFare ${roleLabel}</strong> account has been reviewed and approved by our team.
        </p>
        <div style="background-color: #ecfdf5; border-radius: 8px; padding: 20px; margin: 24px 0;">
            <p style="color: #065f46; margin: 0; font-size: 15px; font-weight: 600;">✅ What's now unlocked:</p>
            <ul style="color: #065f46; font-size: 14px; margin: 12px 0 0 0; padding-left: 20px; line-height: 2;">
                ${role === 'shipment_partner' ? `
                    <li>Accept & manage shipment orders</li>
                    <li>Receive earnings from deliveries</li>
                    <li>Withdraw funds to your bank account</li>
                    <li>Access fleet & warehouse management tools</li>
                ` : `
                    <li>Book shipments nationwide</li>
                    <li>Access wallet & payments</li>
                    <li>Full dashboard features</li>
                `}
            </ul>
        </div>
        <div style="text-align: center; margin-top: 30px;">
            <a href="https://fastfare.in/dashboard" style="background-color: #10b981; color: white; padding: 14px 36px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; display: inline-block;">
                Go to Dashboard →
            </a>
        </div>
    `;
    try {
        await client.emails.send({
            from: `FastFare <${fromEmail}>`,
            to: email,
            subject: '🎉 Your FastFare account is approved!',
            html: onboardingEmailWrapper('✅', 'linear-gradient(135deg, #10b981, #059669)', 'Account Approved', body),
        });
    } catch (err) {
        console.error('Failed to send onboarding approved email:', err);
    }
};

export const sendOnboardingRejectedEmail = async (email, userName, reason, role) => {
    const client = getResendClient();
    if (!client) return;
    const fromEmail = process.env.EMAIL_FROM || 'noreply@fastfare.in';
    const roleLabel = role === 'shipment_partner' ? 'Delivery Partner' : 'User';
    const body = `
        <h2 style="color: #991b1b; margin-top: 0; font-size: 22px; text-align: center;">Application Not Approved</h2>
        <p style="color: #374151; font-size: 15px; line-height: 1.6;">Hi ${userName},</p>
        <p style="color: #374151; font-size: 15px; line-height: 1.6;">
            After reviewing your <strong>FastFare ${roleLabel}</strong> application, our team was unable to approve it at this time.
        </p>
        <div style="background-color: #fef2f2; border-left: 4px solid #ef4444; padding: 16px; margin: 24px 0; border-radius: 4px;">
            <p style="color: #991b1b; margin: 0 0 8px 0; font-size: 14px; font-weight: 600;">Reason:</p>
            <p style="color: #7f1d1d; margin: 0; font-size: 14px; line-height: 1.5;">${reason || 'Your application did not meet the requirements. Please review and update your details.'}</p>
        </div>
        <p style="color: #374151; font-size: 15px; line-height: 1.6;">
            You can update your profile and resubmit your application for review. If you believe this was an error, please contact our support team.
        </p>
        <div style="text-align: center; margin-top: 30px;">
            <a href="https://fastfare.in/settings" style="background-color: #2563eb; color: white; padding: 14px 36px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; display: inline-block;">
                Update Profile & Resubmit
            </a>
        </div>
        <p style="color: #6b7280; font-size: 13px; margin-top: 24px; text-align: center;">
            Need help? Contact us at <a href="mailto:support@fastfare.in" style="color: #2563eb;">support@fastfare.in</a>
        </p>
    `;
    try {
        await client.emails.send({
            from: `FastFare <${fromEmail}>`,
            to: email,
            subject: 'FastFare Application Status Update',
            html: onboardingEmailWrapper('❌', 'linear-gradient(135deg, #dc2626, #b91c1c)', 'Application Update', body),
        });
    } catch (err) {
        console.error('Failed to send onboarding rejected email:', err);
    }
};

export const sendOnboardingNeedsMoreInfoEmail = async (email, userName, adminNote) => {
    const client = getResendClient();
    if (!client) return;
    const fromEmail = process.env.EMAIL_FROM || 'noreply@fastfare.in';
    const body = `
        <h2 style="color: #92400e; margin-top: 0; font-size: 22px; text-align: center;">Additional Information Needed</h2>
        <p style="color: #374151; font-size: 15px; line-height: 1.6;">Hi ${userName},</p>
        <p style="color: #374151; font-size: 15px; line-height: 1.6;">
            We're reviewing your FastFare application and need a bit more information before we can proceed.
        </p>
        <div style="background-color: #fffbeb; border-left: 4px solid #f59e0b; padding: 16px; margin: 24px 0; border-radius: 4px;">
            <p style="color: #92400e; margin: 0 0 8px 0; font-size: 14px; font-weight: 600;">Message from our team:</p>
            <p style="color: #78350f; margin: 0; font-size: 14px; line-height: 1.5;">${adminNote || 'Please update your profile with the required information and resubmit.'}</p>
        </div>
        <div style="text-align: center; margin-top: 30px;">
            <a href="https://fastfare.in/settings" style="background-color: #f59e0b; color: white; padding: 14px 36px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; display: inline-block;">
                Update Your Profile
            </a>
        </div>
    `;
    try {
        await client.emails.send({
            from: `FastFare <${fromEmail}>`,
            to: email,
            subject: 'Action Required: Additional information needed for your FastFare application',
            html: onboardingEmailWrapper('📋', 'linear-gradient(135deg, #f59e0b, #d97706)', 'Info Required', body),
        });
    } catch (err) {
        console.error('Failed to send needs-more-info email:', err);
    }
};

export const sendOnboardingSuspendedEmail = async (email, userName, reason) => {
    const client = getResendClient();
    if (!client) return;
    const fromEmail = process.env.EMAIL_FROM || 'noreply@fastfare.in';
    const body = `
        <h2 style="color: #991b1b; margin-top: 0; font-size: 22px; text-align: center;">Account Suspended</h2>
        <p style="color: #374151; font-size: 15px; line-height: 1.6;">Hi ${userName},</p>
        <p style="color: #374151; font-size: 15px; line-height: 1.6;">
            Your FastFare account has been temporarily suspended. During this time, access to platform features will be restricted.
        </p>
        ${reason ? `
            <div style="background-color: #fef2f2; border-left: 4px solid #ef4444; padding: 16px; margin: 24px 0; border-radius: 4px;">
                <p style="color: #991b1b; margin: 0 0 8px 0; font-size: 14px; font-weight: 600;">Reason:</p>
                <p style="color: #7f1d1d; margin: 0; font-size: 14px; line-height: 1.5;">${reason}</p>
            </div>
        ` : ''}
        <p style="color: #374151; font-size: 15px; line-height: 1.6;">
            If you believe this is an error or have questions, please contact our support team immediately.
        </p>
        <div style="text-align: center; margin-top: 30px;">
            <a href="mailto:support@fastfare.in" style="background-color: #6b7280; color: white; padding: 14px 36px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; display: inline-block;">
                Contact Support
            </a>
        </div>
    `;
    try {
        await client.emails.send({
            from: `FastFare <${fromEmail}>`,
            to: email,
            subject: '⚠️ Your FastFare account has been suspended',
            html: onboardingEmailWrapper('🚫', 'linear-gradient(135deg, #6b7280, #4b5563)', 'Account Suspended', body),
        });
    } catch (err) {
        console.error('Failed to send suspended email:', err);
    }
};

export const sendReverificationRequiredEmail = async (email, userName) => {
    const client = getResendClient();
    if (!client) return;
    const fromEmail = process.env.EMAIL_FROM || 'noreply@fastfare.in';
    const body = `
        <h2 style="color: #1e40af; margin-top: 0; font-size: 22px; text-align: center;">Re-Verification Required</h2>
        <p style="color: #374151; font-size: 15px; line-height: 1.6;">Hi ${userName},</p>
        <p style="color: #374151; font-size: 15px; line-height: 1.6;">
            Our team has requested that you re-verify your identity through DigiLocker. This may be due to a data mismatch, security review, or a periodic verification check.
        </p>
        <div style="background-color: #eff6ff; border-left: 4px solid #2563eb; padding: 16px; margin: 24px 0; border-radius: 4px;">
            <p style="color: #1e40af; margin: 0; font-size: 14px; line-height: 1.5;">
                🔒 Please log in to your FastFare account and complete the DigiLocker verification process. This is essential to maintain your account access.
            </p>
        </div>
        <div style="text-align: center; margin-top: 30px;">
            <a href="https://fastfare.in/settings/kyc" style="background-color: #2563eb; color: white; padding: 14px 36px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; display: inline-block;">
                Verify Now
            </a>
        </div>
    `;
    try {
        await client.emails.send({
            from: `FastFare <${fromEmail}>`,
            to: email,
            subject: 'Action Required: Re-verify your FastFare identity',
            html: onboardingEmailWrapper('🔄', 'linear-gradient(135deg, #2563eb, #1d4ed8)', 'Re-Verification', body),
        });
    } catch (err) {
        console.error('Failed to send reverification email:', err);
    }
};
