import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
dotenv.config();

async function main() {
    await mongoose.connect(process.env.MONGO_URI);

    // Seed test partner for Partners Scan app
    const existing = await mongoose.connection.db.collection('partners').findOne({ phone: '9876543210' });
    if (!existing) {
        const hashedPw = await bcrypt.hash('Partner@123', 10);
        await mongoose.connection.db.collection('partners').insertOne({
            partnerId: 'PTN-0001',
            name: 'Test Partner',
            phone: '9876543210',
            email: 'partner@fastfare.com',
            password: hashedPw,
            businessName: 'FastTrack Logistics',
            zone: 'North',
            status: 'active',
            totalScans: 0,
            createdAt: new Date(),
            updatedAt: new Date()
        });
        console.log('✅ Test Partner created for Scan App');
    } else {
        console.log('ℹ️  Test Partner already exists');
    }

    console.log('\n══════════════════════════════════════════');
    console.log('  PARTNERS SCAN APP CREDENTIALS:');
    console.log('    Phone:    9876543210');
    console.log('    Password: Partner@123');
    console.log('══════════════════════════════════════════');

    process.exit(0);
}

main().catch(e => { console.error(e); process.exit(1); });
