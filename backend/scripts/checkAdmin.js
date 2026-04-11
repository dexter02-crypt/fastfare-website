// checkAdmin.js
// Simple script to verify the admin credentials after the update
import { config as dotenvConfig } from 'dotenv';
dotenvConfig({ path: '../.env' }); // load env from backend/.env
import mongoose from 'mongoose';
import User from '../src/models/User.js';

async function main() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');
    const admin = await User.findOne({ role: 'admin' });
    if (!admin) {
      console.error('⚠️ No admin user found');
      process.exit(1);
    }
    console.log('Admin email:', admin.email);
    const match = await admin.comparePassword('F!s5*S29^hkR#0');
    console.log('Password matches new password?', match);
    process.exit(0);
  } catch (err) {
    console.error('❌ Error checking admin:', err);
    process.exit(1);
  }
}

main();
