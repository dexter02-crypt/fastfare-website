const BASE = 'http://localhost:3000';
const headers = { 'Content-Type': 'application/json' };

async function test() {
    // 1. Login
    const loginRes = await fetch(`${BASE}/api/partner-auth/login`, {
        method: 'POST', headers,
        body: JSON.stringify({ phone: '9876543210', password: 'Partner@123' })
    });
    const loginData = await loginRes.json();
    console.log('Login:', loginRes.status, loginData.success ? 'OK' : 'FAIL');
    const token = loginData.token;
    const authHeaders = { ...headers, 'Authorization': `Bearer ${token}` };

    // 2. Scan
    console.log('\n=== Scan Parcel ===');
    const scanRes = await fetch(`${BASE}/api/parcels/scan`, {
        method: 'POST', headers: authHeaders,
        body: JSON.stringify({ barcode: 'TEST-001', packageName: 'Test Package' })
    });
    const scanData = await scanRes.json();
    console.log(scanRes.status, JSON.stringify(scanData, null, 2));

    // 3. My scans
    console.log('\n=== My Scans ===');
    const scansRes = await fetch(`${BASE}/api/parcels/partner/my-scans`, { headers: authHeaders });
    const scansData = await scansRes.json();
    console.log(scansRes.status, JSON.stringify(scansData, null, 2));
}
test();
