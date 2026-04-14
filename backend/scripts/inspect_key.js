import dotenv from 'dotenv';
dotenv.config();

const k = process.env.RESEND_API_KEY;
console.log('Raw key:', JSON.stringify(k));
console.log('Length:', k.length);

for (let i = 0; i < k.length; i++) {
    const ch = k[i];
    const code = k.charCodeAt(i);
    console.log('  [' + i + '] char=' + ch + ' code=' + code + ' hex=0x' + code.toString(16));
}

// Show what the cleaning regex does
const cleaned = k.replace(/['"\\r\\n\\t ]/g, '').trim();
console.log('\nCleaned key:', JSON.stringify(cleaned));
console.log('Cleaned length:', cleaned.length);

// Try with ONLY whitespace/control char cleaning (no quote stripping)
const safeClean = k.replace(/[\r\n\t ]/g, '').trim();
console.log('\nSafe-cleaned key:', JSON.stringify(safeClean));
console.log('Safe-cleaned length:', safeClean.length);
