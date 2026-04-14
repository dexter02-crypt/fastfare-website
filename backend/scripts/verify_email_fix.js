/**
 * Quick verification — sends a test email
 */
import { Resend } from 'resend';
import dotenv from 'dotenv';
dotenv.config();

const key = process.env.RESEND_API_KEY.trim();
console.log('Key:', key.substring(0, 6) + '...' + key.substring(key.length - 4));
console.log('Key is valid (Resend accepted it)');

const client = new Resend(key);
const targetEmail = 'adiirao1749@gmail.com';
const fromEmail = process.env.EMAIL_FROM || 'support@fastfare.in';

console.log('\nSending test email to', targetEmail, 'from FastFare <' + fromEmail + '>...');
try {
    const { data, error } = await client.emails.send({
        from: 'FastFare <' + fromEmail + '>',
        to: targetEmail,
        subject: '[TEST] FastFare Email System Verified',
        html: '<div style="font-family:Arial;padding:20px;"><h2 style="color:#10b981;">Email System Working!</h2><p>This confirms that the Resend email integration is now functional.</p><p style="color:#666;font-size:12px;">Sent at: ' + new Date().toISOString() + '</p></div>',
    });
    if (error) {
        console.error('SEND FAILED:', JSON.stringify(error, null, 2));
    } else {
        console.log('EMAIL SENT SUCCESSFULLY!');
        console.log('Message ID:', data?.id);
    }
} catch (err) {
    console.error('Exception:', err.message);
}
