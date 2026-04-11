// updateAdminCredentials.js
// One‑time script to update admin email and password (hashed with bcrypt)
// Replace NEW_EMAIL and NEW_PASSWORD with actual values before running.

import { config as dotenvConfig } from 'dotenv';
dotenvConfig({ path: '../.env' }); // load env from backend/.env
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import User from '../src/models/User.js'; // adjust path if needed

const NEW_EMAIL = 'support@fastfare.in'; // updated admin email
const NEW_PASSWORD = 'F!s5*S29^hkR#0'; // updated admin password

async function main() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI, {
      // options can be added if needed
    });
    console.log('✅ Connected to MongoDB');

    const adminUser = await User.findOne({ role: 'admin' });
    if (!adminUser) {
      console.error('⚠️ No admin user found');
      process.exit(1);
    }

    // Assign plain password; pre‑save hook will hash it
    adminUser.email = NEW_EMAIL;
    adminUser.password = NEW_PASSWORD;
    await adminUser.save();

    console.log('✅ Admin credentials updated successfully');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error updating admin credentials:', err);
    process.exit(1);
  }
}

main();
