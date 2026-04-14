import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import User from '../models/User.js';
import Transaction from '../models/Transaction.js';

const run = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Connected to MongoDB');

        const user = await User.findOne({ email: 'user@fastfare.com' });
        if (!user) {
            console.log('❌ User not found: user@fastfare.com');
            process.exit(1);
        }

        console.log(`Found user: ${user.email} (ID: ${user._id})`);
        const before = user.walletBalance || 0;
        console.log(`Current wallet balance: ₹${before}`);

        user.walletBalance = before + 5000;
        await user.save();

        await Transaction.create({
            userId: user._id,
            type: 'recharge',
            amount: 5000,
            status: 'completed',
            description: 'Manual test recharge — ₹5,000',
            balanceBefore: before,
            balanceAfter: user.walletBalance
        });

        console.log(`✅ Done! Balance: ₹${before} → ₹${user.walletBalance}`);
        console.log('✅ Transaction record created');
        process.exit(0);
    } catch (err) {
        console.error('❌ Error:', err.message);
        process.exit(1);
    }
};

run();
