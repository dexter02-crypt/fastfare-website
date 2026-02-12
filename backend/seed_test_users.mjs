import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
dotenv.config();

async function main() {
    await mongoose.connect(process.env.MONGO_URI);

    // ── 1. Seed a test WMS Driver ──
    const driverPassword = await bcrypt.hash('Driver@123', 10);
    const existingDriver = await mongoose.connection.db.collection('wmsdrivers').findOne({ driverId: 'DRV-TEST-001' });
    if (!existingDriver) {
        await mongoose.connection.db.collection('wmsdrivers').insertOne({
            driverId: 'DRV-TEST-001',
            name: 'Test Driver',
            phone: '9876543210',
            email: 'driver@fastfare.com',
            password: driverPassword,
            status: 'active',
            license: { number: 'DL-TEST-0001', type: 'LMV', expiry: new Date('2028-12-31') },
            createdAt: new Date(),
            updatedAt: new Date()
        });
        console.log('✅ Test WMS Driver created');
    } else {
        console.log('ℹ️  Test WMS Driver already exists');
    }

    // ── 2. Ensure partner user has a known password ──
    const partnerPassword = await bcrypt.hash('Partner@123', 10);
    const result = await mongoose.connection.db.collection('users').updateOne(
        { email: 'partner@fastfare.com' },
        { $set: { password: partnerPassword } }
    );
    if (result.modifiedCount > 0) {
        console.log('✅ Partner password reset to Partner@123');
    } else {
        console.log('ℹ️  Partner password already set or user not found');
    }

    console.log('\n══════════════════════════════════════════');
    console.log('  TEST CREDENTIALS');
    console.log('══════════════════════════════════════════');
    console.log('  PARTNERS SCAN APP:');
    console.log('    Email:    partner@fastfare.com');
    console.log('    Password: Partner@123');
    console.log('');
    console.log('  DRIVER APP:');
    console.log('    Driver ID: DRV-TEST-001');
    console.log('    Password:  Driver@123');
    console.log('══════════════════════════════════════════');

    process.exit(0);
}

main().catch(e => { console.error(e); process.exit(1); });
