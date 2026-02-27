/**
 * Seed default carrier partners into the database.
 * These are User documents with role='shipment_partner' and status='approved'.
 */
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI;

async function seed() {
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB');

    const db = mongoose.connection.db;
    const usersCol = db.collection('users');

    const carriers = [
        {
            businessName: 'FastFare Express',
            businessType: 'logistics',
            contactPerson: 'FastFare Logistics',
            email: 'carrier-express@fastfare.in',
            phone: '9000000001',
            password: await bcrypt.hash('Carrier@123', 10),
            role: 'shipment_partner',
            isVerified: true,
            partnerDetails: {
                status: 'approved',
                approvedAt: new Date(),
                baseFare: 49,
                perKgRate: 8,
                rating: 4.8,
                eta: '1-2 days',
                supportedTypes: ['express', 'overnight'],
                features: ['Live Tracking', 'Priority Handling', 'Insured', 'SMS Alerts'],
                serviceZones: [],  // empty = serves all pincodes
                fleetDetails: { totalVehicles: 50, vehicleTypes: ['bike', 'mini_truck', 'truck'] }
            },
            walletBalance: 0,
            createdAt: new Date(),
            updatedAt: new Date()
        },
        {
            businessName: 'FastFare Standard',
            businessType: 'logistics',
            contactPerson: 'FastFare Logistics',
            email: 'carrier-standard@fastfare.in',
            phone: '9000000002',
            password: await bcrypt.hash('Carrier@123', 10),
            role: 'shipment_partner',
            isVerified: true,
            partnerDetails: {
                status: 'approved',
                approvedAt: new Date(),
                baseFare: 29,
                perKgRate: 5,
                rating: 4.5,
                eta: '3-5 days',
                supportedTypes: ['standard', 'economy'],
                features: ['Live Tracking', 'COD Available', 'SMS Alerts'],
                serviceZones: [],
                fleetDetails: { totalVehicles: 120, vehicleTypes: ['bike', 'auto', 'mini_truck', 'truck', 'large_truck'] }
            },
            walletBalance: 0,
            createdAt: new Date(),
            updatedAt: new Date()
        },
        {
            businessName: 'FastFare Premium',
            businessType: 'logistics',
            contactPerson: 'FastFare Logistics',
            email: 'carrier-premium@fastfare.in',
            phone: '9000000003',
            password: await bcrypt.hash('Carrier@123', 10),
            role: 'shipment_partner',
            isVerified: true,
            partnerDetails: {
                status: 'approved',
                approvedAt: new Date(),
                baseFare: 99,
                perKgRate: 15,
                rating: 4.9,
                eta: '12 hours',
                supportedTypes: ['express', 'overnight', 'fragile'],
                features: ['Live Tracking', 'Priority Handling', 'Insured', 'White Glove', 'Temperature Controlled'],
                serviceZones: [],
                fleetDetails: { totalVehicles: 30, vehicleTypes: ['mini_truck', 'truck'] }
            },
            walletBalance: 0,
            createdAt: new Date(),
            updatedAt: new Date()
        }
    ];

    for (const carrier of carriers) {
        const exists = await usersCol.findOne({ email: carrier.email });
        if (exists) {
            console.log(`   ⚠️ '${carrier.businessName}' already exists, updating status to approved...`);
            await usersCol.updateOne(
                { email: carrier.email },
                { $set: { 'partnerDetails.status': 'approved', 'partnerDetails.approvedAt': new Date() } }
            );
        } else {
            await usersCol.insertOne(carrier);
            console.log(`   ✅ Added '${carrier.businessName}'`);
        }
    }

    console.log('\n🎉 Carrier seeding complete! You should now see carriers when creating shipments.');
    await mongoose.disconnect();
}

seed().catch(err => { console.error('❌ Error:', err.message); process.exit(1); });
