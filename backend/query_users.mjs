import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

async function main() {
    await mongoose.connect(process.env.MONGO_URI);

    // Find partner users
    const partners = await mongoose.connection.db.collection('users')
        .find({ role: 'shipment_partner' }, { projection: { email: 1, businessName: 1, contactPerson: 1, role: 1 } })
        .limit(5).toArray();
    console.log('=== PARTNER USERS ===');
    console.log(JSON.stringify(partners, null, 2));

    // Find WMS drivers
    const wmsDrivers = await mongoose.connection.db.collection('wmsdrivers')
        .find({}, { projection: { email: 1, driverId: 1, name: 1, phone: 1 } })
        .limit(5).toArray();
    console.log('\n=== WMS DRIVERS ===');
    console.log(JSON.stringify(wmsDrivers, null, 2));

    // Find regular drivers
    const drivers = await mongoose.connection.db.collection('drivers')
        .find({}, { projection: { email: 1, driverId: 1, name: 1, phone: 1 } })
        .limit(5).toArray();
    console.log('\n=== DRIVERS (regular) ===');
    console.log(JSON.stringify(drivers, null, 2));

    // List all collections
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('\n=== ALL COLLECTIONS ===');
    console.log(collections.map(c => c.name).join(', '));

    process.exit(0);
}

main().catch(e => { console.error(e); process.exit(1); });
