/**
 * Email Diagnostic Script — Tests the Resend API setup end-to-end
 * Run: node --experimental-specifier-resolution=node scripts/diagnose_email.js
 */
import { Resend } from 'resend';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env from the backend root
dotenv.config({ path: resolve(__dirname, '..', '.env') });

const rawKey = process.env.RESEND_API_KEY;
const emailFrom = process.env.EMAIL_FROM || process.env.RESEND_FROM_EMAIL || 'support@fastfare.in';
const targetEmail = 'adiirao1749@gmail.com';

console.log('\n╔══════════════════════════════════════════════╗');
console.log('║     FASTFARE EMAIL DIAGNOSTIC REPORT        ║');
console.log('╚══════════════════════════════════════════════╝\n');

// 1. Check env vars
console.log('1️⃣  Environment Variables:');
console.log(`   RESEND_API_KEY exists:    ${!!rawKey}`);
console.log(`   RESEND_API_KEY length:    ${rawKey?.length ?? 0}`);
console.log(`   RESEND_API_KEY prefix:    ${rawKey?.substring(0, 6) ?? 'N/A'}...`);
console.log(`   RESEND_API_KEY raw bytes: ${rawKey ? Buffer.from(rawKey).toString('hex').match(/.{2}/g).join(' ') : 'N/A'}`);
console.log(`   EMAIL_FROM:               ${emailFrom}`);
console.log(`   NODE_ENV:                 ${process.env.NODE_ENV}`);
console.log('');

if (!rawKey) {
    console.error('❌ RESEND_API_KEY is not set. Emails will never send.');
    process.exit(1);
}

// 2. Clean the key & check for hidden chars
const cleanKey = rawKey.replace(/['"\\r\\n\\t ]/g, '').trim();
console.log('2️⃣  Key Cleaning:');
console.log(`   Raw length:     ${rawKey.length}`);
console.log(`   Cleaned length: ${cleanKey.length}`);
console.log(`   Had hidden chars: ${rawKey.length !== cleanKey.length ? '⚠️ YES' : '✅ NO'}`);
console.log('');

// 3. Test API key validity by listing domains
const client = new Resend(cleanKey);

console.log('3️⃣  Testing Resend API Key...');
try {
    const { data: domains, error: domainErr } = await client.domains.list();
    if (domainErr) {
        console.error(`   ❌ API Key Error: ${JSON.stringify(domainErr)}`);
    } else {
        console.log(`   ✅ API Key is VALID`);
        console.log(`   Verified Domains:`);
        if (domains?.data?.length > 0) {
            for (const d of domains.data) {
                console.log(`      - ${d.name} (status: ${d.status})`);
            }
        } else {
            console.log(`      ⚠️ NO DOMAINS FOUND — this means you can ONLY send from onboarding@resend.dev`);
        }
    }
} catch (err) {
    console.error(`   ❌ API Key Test Failed: ${err.message}`);
}
console.log('');

// 4. Attempt to send a test email from the configured FROM address
console.log(`4️⃣  Sending test email FROM "FastFare <${emailFrom}>" TO "${targetEmail}"...`);
try {
    const { data, error } = await client.emails.send({
        from: `FastFare <${emailFrom}>`,
        to: targetEmail,
        subject: '[DIAGNOSTIC] FastFare Email Test',
        html: '<p>If you receive this, Resend email sending works correctly from this FROM address.</p>',
    });
    if (error) {
        console.error(`   ❌ SEND FAILED: ${JSON.stringify(error, null, 2)}`);
        console.log('');
        console.log('   🔧 LIKELY FIX: The FROM domain is not verified in Resend.');
        console.log('      Go to https://resend.com/domains and verify "fastfare.in"');
        console.log('      OR use "onboarding@resend.dev" as EMAIL_FROM temporarily.');
    } else {
        console.log(`   ✅ EMAIL SENT SUCCESSFULLY!`);
        console.log(`   Message ID: ${data?.id}`);
    }
} catch (err) {
    console.error(`   ❌ SEND EXCEPTION: ${err.message}`);
}
console.log('');

// 5. Try sending from onboarding@resend.dev as fallback test
console.log(`5️⃣  Fallback: Sending from "onboarding@resend.dev" TO "${targetEmail}"...`);
try {
    const { data, error } = await client.emails.send({
        from: 'FastFare <onboarding@resend.dev>',
        to: targetEmail,
        subject: '[DIAGNOSTIC] FastFare Fallback Email Test',
        html: '<p>This email was sent from onboarding@resend.dev as a fallback test.</p>',
    });
    if (error) {
        console.error(`   ❌ FALLBACK ALSO FAILED: ${JSON.stringify(error, null, 2)}`);
        console.log('   This means even the default Resend domain is blocked.');
        console.log('   Check if the API key is valid and the Resend account is active.');
    } else {
        console.log(`   ✅ FALLBACK SENT SUCCESSFULLY!`);
        console.log(`   Message ID: ${data?.id}`);
        console.log('');
        console.log('   ⚡ CONCLUSION: The API key works, but fastfare.in domain is NOT verified.');
        console.log('      EITHER:');
        console.log('        a) Verify fastfare.in domain at https://resend.com/domains');
        console.log('        b) Set EMAIL_FROM=onboarding@resend.dev in .env as a temporary fix');
    }
} catch (err) {
    console.error(`   ❌ FALLBACK EXCEPTION: ${err.message}`);
}

console.log('\n════════════════════════════════════════════════\n');
