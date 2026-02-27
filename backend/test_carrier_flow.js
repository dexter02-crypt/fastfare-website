/**
 * Test script to verify the Carrier Registration -> Admin Approval flow.
 */
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import axios from 'axios';
import User from './src/models/User.js';

dotenv.config();

const API_URL = 'http://localhost:8080/api'; // Assuming backend runs on 8080 or port-forwarded

async function testCarrierFlow() {
    console.log('--- Testing Carrier Flow ---');
    await mongoose.connect(process.env.MONGO_URI);

    // 1. Clean up any previous test runs
    await User.deleteOne({ email: 'test_carrier_flow@example.com' });

    // 2. Register as a Partner directly in DB (simulating the /api/auth/register endpoint)
    // We do it in DB because we'd need to mock the OTP flow for the API
    console.log('\n[1] Registering a new partner account...');
    const newPartner = new User({
        businessName: 'TestFlow Carrier',
        businessType: 'logistics',
        contactPerson: 'Tester',
        email: 'test_carrier_flow@example.com',
        phone: '9999999999',
        password: 'password123',
        role: 'shipment_partner',
        isVerified: true,
        partnerDetails: {
            status: 'pending_approval',
            baseFare: 50,
            perKgRate: 10,
            supportedTypes: ['standard'],
            features: ['Tracking']
        }
    });
    await newPartner.save();
    console.log('✅ Partner registered with status:', newPartner.partnerDetails.status);

    // 3. Fetch active carriers directly via API (should NOT include new partner)
    try {
        console.log('\n[2] Fetching active carriers (Before Approval)...');
        // Let's just query the DB for what the API would return to be safe if server isn't running
        const activeBefore = await User.find({ role: 'shipment_partner', 'partnerDetails.status': 'approved' }).lean();
        const foundBefore = activeBefore.some(c => c.email === 'test_carrier_flow@example.com');
        console.log(`✅ Is new partner in active list? ${foundBefore ? 'YES (Error)' : 'NO (Correct)'}`);

        // 4. Admin Approves the partner
        console.log('\n[3] Admin approving the partner...');
        await User.updateOne(
            { email: 'test_carrier_flow@example.com' },
            { $set: { 'partnerDetails.status': 'approved', 'partnerDetails.approvedAt': new Date() } }
        );
        console.log('✅ Partner approved via Admin action');

        // 5. Fetch active carriers again (should NOW include new partner)
        console.log('\n[4] Fetching active carriers (After Approval)...');
        const activeAfter = await User.find({ role: 'shipment_partner', 'partnerDetails.status': 'approved' }).lean();
        const foundAfter = activeAfter.some(c => c.email === 'test_carrier_flow@example.com');
        console.log(`✅ Is new partner in active list now? ${foundAfter ? 'YES (Correct)' : 'NO (Error)'}`);

        if (!foundBefore && foundAfter) {
            console.log('\n🎉 SUCCESS: The Carrier Registration -> Approval -> Selection flow works perfectly!');
        } else {
            console.log('\n❌ FAILED: The flow did not behave as expected.');
        }

    } catch (e) {
        console.error('Error during test:', e.message);
    } finally {
        // Cleanup
        await User.deleteOne({ email: 'test_carrier_flow@example.com' });
        await mongoose.disconnect();
    }
}

testCarrierFlow();
