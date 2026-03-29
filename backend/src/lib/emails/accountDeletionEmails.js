import { Resend } from 'resend';

const resendClient = new Resend(process.env.RESEND_API_KEY);
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';

export const sendDeleteOtpEmail = async (email, name, otp, accountType) => {
    const subject = `🔐 Your FastFare Account Deletion OTP — ${name}`;
    const html = `
    <div style="font-family: 'Inter', Arial, sans-serif; background-color: #F8F9FA; padding: 20px; text-align: center;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #FFFFFF; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.05);">
            <div style="background-color: #FF6B00; height: 6px; width: 100%;"></div>
            <div style="padding: 24px; text-align: center; border-bottom: 1px solid #E5E7EB;">
                <h1 style="color: #FF6B00; margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.5px;">FastFare</h1>
            </div>
            
            <div style="padding: 40px 30px; text-align: center;">
                <div style="width: 64px; height: 64px; background-color: #FEE2E2; border-radius: 50%; margin: 0 auto 24px auto; display: flex; align-items: center; justify-content: center;">
                    <span style="font-size: 32px;">🔐</span>
                </div>
                
                <h2 style="color: #1A1A2E; margin: 0 0 16px 0; font-size: 22px;">Hi ${name},</h2>
                <p style="color: #4B5563; font-size: 15px; margin: 0 0 32px 0; line-height: 1.6;">
                    We received a request to permanently delete your FastFare account.
                </p>
                
                <div style="background-color: #F9FAFB; border: 1px solid #E5E7EB; border-radius: 12px; padding: 24px; margin-bottom: 32px;">
                    <p style="color: #6B7280; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 16px 0; font-weight: 600;">YOUR DELETION OTP</p>
                    <div style="font-size: 36px; font-weight: 700; color: #1A1A2E; letter-spacing: 12px; margin-bottom: 16px; font-family: monospace;">
                        ${otp}
                    </div>
                    <p style="color: #EF4444; font-size: 13px; margin: 0; font-weight: 600;">⏱ Valid for 10 minutes only</p>
                </div>

                <p style="color: #4B5563; font-size: 14px; margin: 0 0 24px 0;">
                    Enter this OTP on the verification page to confirm deletion of your account.
                </p>
                
                <div style="border-top: 1px dashed #E5E7EB; border-bottom: 1px dashed #E5E7EB; padding: 20px 0; margin-bottom: 32px; text-align: left;">
                    <h3 style="color: #1A1A2E; font-size: 14px; margin: 0 0 16px 0;">Account Details:</h3>
                    <table style="width: 100%; font-size: 13px; color: #4B5563;">
                        <tr><td style="padding-bottom: 8px; width: 120px;">Name:</td><td style="font-weight: 600; color: #1A1A2E;">${name}</td></tr>
                        <tr><td style="padding-bottom: 8px;">Email:</td><td style="font-weight: 600; color: #1A1A2E;">${email}</td></tr>
                        <tr><td style="padding-bottom: 8px;">Account Type:</td><td style="font-weight: 600; color: #1A1A2E;">${accountType === 'partner' ? 'Partner' : 'User'}</td></tr>
                        <tr><td style="padding-bottom: 8px;">Requested At:</td><td style="font-weight: 600; color: #1A1A2E;">${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}</td></tr>
                    </table>
                </div>

                <div style="background-color: #FFFBEB; border: 1px solid #FCD34D; border-radius: 10px; padding: 20px; text-align: left; margin-bottom: 32px;">
                    <h3 style="color: #92400E; margin: 0 0 12px 0; font-size: 14px; display: flex; align-items: center;">
                        <span style="margin-right: 8px;">⚠️</span> IMPORTANT SECURITY NOTICE
                    </h3>
                    <p style="color: #92400E; font-size: 13px; margin: 0; line-height: 1.6;">
                        If you did NOT request account deletion, someone may have access to your account. Do NOT share this OTP with anyone. Immediately secure your account by changing your password at <a href="https://fastfare.in/settings" style="color: #D97706; text-decoration: underline;">fastfare.in/settings</a> or contact us at <a href="mailto:support@fastfare.in" style="color: #D97706; text-decoration: underline;">support@fastfare.in</a>.
                    </p>
                </div>
                
                <a href="https://fastfare.in/account/delete/verify-otp" style="display: inline-block; background-color: #FF6B00; color: #FFFFFF; font-weight: 600; font-size: 15px; text-decoration: none; padding: 14px 32px; border-radius: 8px;">
                    Go to Verification Page →
                </a>
            </div>
            
            <div style="background-color: #1A1A2E; padding: 32px 24px; text-align: center;">
                <h4 style="color: #FFFFFF; margin: 0 0 12px 0; font-size: 16px;">FastFare Technologies Pvt. Ltd.</h4>
                <div style="margin-bottom: 16px;">
                    <a href="https://fastfare.in/help-center" style="color: #9CA3AF; text-decoration: none; font-size: 12px; margin: 0 8px;">Help Center</a> |
                    <a href="https://fastfare.in/contact" style="color: #9CA3AF; text-decoration: none; font-size: 12px; margin: 0 8px;">Contact</a> |
                    <a href="https://fastfare.in/privacy" style="color: #9CA3AF; text-decoration: none; font-size: 12px; margin: 0 8px;">Privacy</a> |
                    <a href="https://fastfare.in/terms" style="color: #9CA3AF; text-decoration: none; font-size: 12px; margin: 0 8px;">Terms</a>
                </div>
                <p style="color: #6B7280; font-size: 12px; margin: 0 0 16px 0;">© ${new Date().getFullYear()} FastFare Technologies Pvt. Ltd. All rights reserved.</p>
                <p style="color: #4B5563; font-size: 11px; margin: 0;">This is an automated security email. Do not reply to this email.</p>
            </div>
        </div>
    </div>
    `;

    try {
        await resendClient.emails.send({
            from: `FastFare <${FROM_EMAIL}>`,
            reply_to: 'support@fastfare.in',
            to: [email],
            subject,
            html,
        });
    } catch (err) {
        console.error('[FastFare Email] Failed to send OTP email:', err);
    }
};

export const sendDeleteConfirmationEmail = async (email, name, accountType, userId) => {
    const subject = `⚠️ Your FastFare Account Has Been Permanently Deleted`;
    const html = `
    <div style="font-family: 'Inter', Arial, sans-serif; background-color: #F8F9FA; padding: 20px; text-align: center;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #FFFFFF; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.05);">
            <div style="background-color: #EF4444; height: 6px; width: 100%;"></div>
            <div style="padding: 24px; text-align: center; border-bottom: 1px solid #E5E7EB;">
                <h1 style="color: #FF6B00; margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.5px;">FastFare</h1>
            </div>
            
            <div style="padding: 40px 30px; text-align: center;">
                <div style="width: 64px; height: 64px; background-color: #DCFCE7; border-radius: 50%; margin: 0 auto 20px auto; display: flex; align-items: center; justify-content: center;">
                    <span style="font-size: 32px; color: #16A34A;">✓</span>
                </div>
                
                <h2 style="color: #1A1A2E; margin: 0 0 24px 0; font-size: 22px;">Account Permanently Deleted</h2>
                
                <p style="color: #4B5563; font-size: 15px; margin: 0 0 32px 0; line-height: 1.6; text-align: left;">
                    Hi <strong>${name}</strong>,<br><br>
                    Your FastFare account has been permanently deleted from our platform. All your data has been erased as requested. This action is final and cannot be reversed.
                </p>
                
                <div style="background-color: #F9FAFB; border: 1px solid #E5E7EB; border-radius: 10px; padding: 20px; text-align: left; margin-bottom: 24px;">
                    <h3 style="color: #1A1A2E; font-size: 13px; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 16px 0;">DELETION SUMMARY</h3>
                    <table style="width: 100%; font-size: 13px; color: #4B5563; line-height: 1.6;">
                        <tr><td style="width: 140px;">Account Name:</td><td style="font-weight: 600; color: #1A1A2E;">${name}</td></tr>
                        <tr><td>Email Address:</td><td style="font-weight: 600; color: #1A1A2E;">${email}</td></tr>
                        <tr><td>Account Type:</td><td style="font-weight: 600; color: #1A1A2E;">${accountType === 'partner' ? 'Partner' : 'User'}</td></tr>
                        <tr><td>Account ID:</td><td style="font-weight: 600; color: #1A1A2E; font-family: monospace;">${userId}</td></tr>
                        <tr><td>Deleted On:</td><td style="font-weight: 600; color: #1A1A2E;">${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}</td></tr>
                        <tr><td>Deleted By:</td><td style="font-weight: 600; color: #1A1A2E;">Self-Requested</td></tr>
                    </table>
                </div>

                <div style="background-color: #F0FDF4; border: 1px solid #BBF7D0; border-radius: 10px; padding: 20px; text-align: left; margin-bottom: 24px;">
                    <h3 style="color: #166534; font-size: 13px; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 16px 0;">WHAT WAS ERASED</h3>
                    <ul style="list-style-type: none; padding: 0; margin: 0; font-size: 13px; color: #15803D; line-height: 2;">
                        <li><span style="margin-right: 8px;">✓</span> All shipment history and records</li>
                        <li><span style="margin-right: 8px;">✓</span> Billing and invoice data</li>
                        <li><span style="margin-right: 8px;">✓</span> API keys and webhook configurations</li>
                        <li><span style="margin-right: 8px;">✓</span> Organization profile and settings</li>
                        <li><span style="margin-right: 8px;">✓</span> Address book entries</li>
                        <li><span style="margin-right: 8px;">✓</span> Team member access and permissions</li>
                        <li><span style="margin-right: 8px;">✓</span> Notification preferences</li>
                        <li><span style="margin-right: 8px;">✓</span> Login credentials removed from system</li>
                        <li><span style="margin-right: 8px;">✓</span> Partner/driver associations</li>
                        <li><span style="margin-right: 8px;">✓</span> Wallet credits and balance (forfeited)</li>
                    </ul>
                </div>

                <div style="background-color: #FFF7ED; border: 1px solid #FDBA74; border-radius: 10px; padding: 24px; text-align: center; margin-bottom: 24px;">
                    <div style="font-size: 24px; margin-bottom: 12px;">🔓</div>
                    <h3 style="color: #9A3412; margin: 0 0 12px 0; font-size: 16px;">Your Email is Now Free</h3>
                    <p style="color: #9A3412; font-size: 13px; margin: 0 0 20px 0; line-height: 1.5;">
                        The email address <strong>${email}</strong> has been completely released from our system. You may use it to create a brand new FastFare account at any time.
                    </p>
                    <a href="https://fastfare.in/register" style="display: inline-block; background-color: #FF6B00; color: #FFFFFF; font-weight: 600; font-size: 14px; text-decoration: none; padding: 12px 24px; border-radius: 8px;">
                        Create a New Account
                    </a>
                </div>

                <div style="background-color: #FFF5F5; border: 1px solid #FECACA; border-radius: 10px; padding: 20px; text-align: left;">
                    <h3 style="color: #991B1B; margin: 0 0 12px 0; font-size: 15px;">Was this not you?</h3>
                    <p style="color: #991B1B; font-size: 13px; margin: 0 0 16px 0; line-height: 1.5;">
                        If you did not request this deletion, please contact our support team IMMEDIATELY at <a href="mailto:support@fastfare.in" style="color: #DC2626; text-decoration: underline;">support@fastfare.in</a> or call our helpline. We may be able to assist within 48 hours of deletion.
                    </p>
                    <a href="https://fastfare.in/contact" style="display: inline-block; background-color: transparent; border: 1px solid #DC2626; color: #DC2626; font-weight: 600; font-size: 13px; text-decoration: none; padding: 10px 20px; border-radius: 8px;">
                        Contact Support Immediately
                    </a>
                </div>
            </div>
            
            <div style="background-color: #1A1A2E; padding: 32px 24px; text-align: center;">
                <h4 style="color: #FF6B00; margin: 0 0 8px 0; font-size: 18px; font-weight: 700;">FastFare</h4>
                <p style="color: #9CA3AF; font-size: 13px; margin: 0 0 24px 0; font-style: italic;">
                    "Modern B2B logistics infrastructure for global businesses."
                </p>
                <div style="margin-bottom: 16px;">
                    <a href="https://fastfare.in/help-center" style="color: #FFFFFF; text-decoration: none; font-size: 13px; margin: 0 8px;">Help Center</a> |
                    <a href="https://fastfare.in/contact" style="color: #FFFFFF; text-decoration: none; font-size: 13px; margin: 0 8px;">Contact</a> |
                    <a href="https://fastfare.in/privacy" style="color: #FFFFFF; text-decoration: none; font-size: 13px; margin: 0 8px;">Privacy Policy</a> |
                    <a href="https://fastfare.in/terms" style="color: #FFFFFF; text-decoration: none; font-size: 13px; margin: 0 8px;">Terms of Service</a>
                </div>
                <div style="border-top: 1px solid #374151; margin: 24px 0;"></div>
                <p style="color: #6B7280; font-size: 12px; margin: 0 0 16px 0;">© ${new Date().getFullYear()} FastFare Technologies Pvt. Ltd. All rights reserved.</p>
                <p style="color: #4B5563; font-size: 11px; margin: 0; line-height: 1.5;">
                    This email was sent to ${email} because an account deletion was completed.<br>
                    This is a system notification — please do not reply.
                </p>
            </div>
        </div>
    </div>
    `;

    try {
        await resendClient.emails.send({
            from: `FastFare <${FROM_EMAIL}>`,
            reply_to: 'support@fastfare.in',
            to: [email],
            subject,
            html,
        });
    } catch (err) {
        console.error('[FastFare Email] Failed to send deletion confirmation email:', err);
    }
};
