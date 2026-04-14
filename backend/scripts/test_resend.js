import { Resend } from 'resend';
import dotenv from 'dotenv';
dotenv.config();

const testEmails = async () => {
    let client = null;
    if (process.env.RESEND_API_KEY) {
        client = new Resend(process.env.RESEND_API_KEY);
    }
    if (!client) {
        console.log('No API key');
        return;
    }

    const fromEmail = process.env.EMAIL_FROM || process.env.RESEND_FROM_EMAIL || 'support@fastfare.in';
    const emailTo = process.env.SUPPORT_EMAIL || 'test@example.com';
    
    console.log(`Sending to ${emailTo} from FastFare <${fromEmail}>`);
    
    try {
        const res = await client.emails.send({
            from: `FastFare <${fromEmail}>`,
            to: emailTo,
            subject: 'Test Email',
            html: '<p>Test</p>'
        });
        console.dir(res, { depth: null });
    } catch(err) {
        console.error('Error:', err);
    }
};

testEmails();
