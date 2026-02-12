import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../src/models/User.js';

dotenv.config();

const seedUsers = async () => {
    try {
        if (!process.env.MONGO_URI) {
            throw new Error('MONGO_URI is not defined in environment variables');
        }

        console.log('Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Connected to MongoDB');

        // Check and create Admin if not exists
        const adminExists = await User.findOne({ email: 'admin@fastfare.com' });
        if (!adminExists) {
            console.log('👤 Creating Admin User...');
            const adminUser = new User({
                businessName: "FastFare Admin",
                gstin: "22AAAAA0000A1Z5",
                businessType: "logistics",
                contactPerson: "System Admin",
                email: "admin@fastfare.com",
                phone: "9999999999",
                password: "admin123",
                role: "admin",
                isVerified: true
            });
            await adminUser.save();
            console.log('✅ Admin created: admin@fastfare.com / admin123');
        } else {
            console.log('ℹ️ Admin already exists');
        }

        // Check and create Standard User if not exists
        const userExists = await User.findOne({ email: 'user@fastfare.com' });
        if (!userExists) {
            console.log('👤 Creating Standard User...');
            const standardUser = new User({
                businessName: "Demo Logistics Pvt Ltd",
                gstin: "27ABCDE1234F1Z5",
                businessType: "distributor",
                contactPerson: "Demo User",
                email: "user@fastfare.com",
                phone: "8888888888",
                password: "user123",
                role: "user",
                isVerified: true,
                walletBalance: 5000
            });
            await standardUser.save();
            console.log('✅ User created: user@fastfare.com / user123');
        } else {
            console.log('ℹ️ Standard user already exists');
        }

        // Check and create Partner if not exists
        const partnerExists = await User.findOne({ email: 'partner@fastfare.com' });
        if (!partnerExists) {
            console.log('👤 Creating Shipment Partner...');
            const partnerUser = new User({
                businessName: "FastTrack Logistics",
                gstin: "29XYZAB5678C1Z9",
                businessType: "logistics",
                contactPerson: "Partner Demo",
                email: "partner@fastfare.com",
                phone: "7777777777",
                password: "partner123",
                role: "shipment_partner",
                isVerified: true,
                walletBalance: 10000
            });
            await partnerUser.save();
            console.log('✅ Partner created: partner@fastfare.com / partner123');
        } else {
            console.log('ℹ️ Partner already exists');
        }

        // List all users
        console.log('\n📋 All users in database:');
        const allUsers = await User.find({}, 'email role businessName');
        allUsers.forEach(u => console.log(`  - ${u.email} (${u.role}) - ${u.businessName}`));

        console.log('\n✨ Seeding complete!');
        process.exit(0);

    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
};

seedUsers();
