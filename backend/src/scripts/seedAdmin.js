import User from '../models/User.js';
import Parcel from '../models/Parcel.js';

const TEST_ACCOUNTS = [
    {
        businessName: 'FastFare Admin',
        businessType: 'logistics',
        contactPerson: 'System Admin',
        email: 'admin@fastfare.com',
        phone: '0000000000',
        password: 'Admin@123',
        role: 'admin',
        isVerified: true
    },
    {
        businessName: 'FastFare Test User',
        gstin: 'USER0000000000',
        businessType: 'ecommerce',
        contactPerson: 'Test User',
        email: 'user@fastfare.com',
        phone: '1111111111',
        password: 'User@123',
        role: 'user',
        isVerified: true
    },
    {
        businessName: 'FastFare Test Partner',
        gstin: 'PARTNER00000000',
        businessType: 'logistics',
        contactPerson: 'Test Partner',
        email: 'partner@fastfare.com',
        phone: '2222222222',
        password: 'Partner@123',
        role: 'shipment_partner',
        isVerified: true
    }
];

export const seedAdmin = async () => {
    try {
        if (process.env.NODE_ENV === 'production') {
            const adminEmail = process.env.ADMIN_EMAIL;
            const adminPassword = process.env.ADMIN_PASSWORD;
            if (!adminEmail || !adminPassword) {
                console.warn('⚠️  ADMIN_EMAIL/ADMIN_PASSWORD not set — skipping seed');
                return;
            }
            const exists = await User.findOne({ 
                $or: [{ email: adminEmail }, { role: 'admin' }, { phone: TEST_ACCOUNTS[0].phone }] 
            });
            if (!exists) {
                await User.create({
                    ...TEST_ACCOUNTS[0],
                    email: adminEmail,
                    password: adminPassword
                });
                console.log(`✅ Admin created: ${adminEmail}`);
            } else {
                console.log(`ℹ️ Admin account or seed data already exists — skipping seed`);
            }
            return;
        }

        // Development — seed 3 test accounts
        for (const account of TEST_ACCOUNTS) {
            const exists = await User.findOne({ email: account.email });
            if (!exists) {
                await User.create(account);
                console.log(`✅ ${account.role} created: ${account.email}`);
            }
        }

        // Seed 1 demo parcel linked to partner (if none exist)
        const parcelCount = await Parcel.countDocuments();
        if (parcelCount === 0) {
            const partner = await User.findOne({ role: 'shipment_partner' });
            if (partner) {
                await Parcel.create({
                    barcode: 'FF-DEMO-001',
                    orderId: 'ORD-000001',
                    awb: 'AWB0000000001',
                    packageName: 'Demo Shipment',
                    packageDescription: 'Test parcel for system verification',
                    contentType: 'Electronics',
                    weight: 1.5,
                    quantity: 1,
                    sender: {
                        name: 'FastFare Warehouse',
                        phone: '0000000000',
                        address: 'FastFare Hub, Andheri East',
                        city: 'Mumbai',
                        pincode: '400093'
                    },
                    receiver: {
                        name: 'Test Recipient',
                        phone: '9999999999',
                        address: 'Green Park, Sector 21',
                        city: 'Delhi',
                        pincode: '110022'
                    },
                    status: 'scanned',
                    scannedBy: {
                        partnerId: partner._id,
                        name: partner.contactPerson
                    },
                    scannedAt: new Date()
                });
                console.log('✅ Demo parcel created: AWB0000000001');
            }
        }
    } catch (error) {
        console.error('❌ Seed error:', error.message);
    }
};

export default seedAdmin;
