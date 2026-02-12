// Quick test of the partner-auth and driver-auth endpoints
const BASE = 'http://localhost:3000/api';

async function test() {
    // Test partner-auth/login
    console.log('=== Testing partner-auth/login ===');
    try {
        const r1 = await fetch(`${BASE}/partner-auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ phone: '9876543210', password: 'Partner@123' })
        });
        const d1 = await r1.json();
        console.log(`Status: ${r1.status}`, JSON.stringify(d1, null, 2));
    } catch (e) { console.error('partner-auth failed:', e.message); }

    // Test driver-auth/login
    console.log('\n=== Testing driver-auth/login ===');
    try {
        const r2 = await fetch(`${BASE}/driver-auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: 'DRV-TEST-001', password: 'Driver@123' })
        });
        const d2 = await r2.json();
        console.log(`Status: ${r2.status}`, JSON.stringify(d2, null, 2));
    } catch (e) { console.error('driver-auth failed:', e.message); }

    // Test health
    console.log('\n=== Testing health ===');
    try {
        const r3 = await fetch(`${BASE}/health`);
        const d3 = await r3.json();
        console.log(`Status: ${r3.status}`, JSON.stringify(d3));
    } catch (e) { console.error('health failed:', e.message); }
}

test();
