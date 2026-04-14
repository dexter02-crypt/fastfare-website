// updateAdminEmail.js — Update admin email, removing any conflicting account first
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: resolve(__dirname, '../.env') });
import mongoose from 'mongoose';
import User from '../src/models/User.js';

async function main() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // Find the admin
    const admin = await User.findOne({ role: 'admin' });
    if (!admin) {
      console.error('⚠️ No admin user found');
      process.exit(1);
    }
    console.log('Current admin email:', admin.email);

    // Check if adiirao1749@gmail.com already exists as a non-admin
    const conflicting = await User.findOne({ email: 'adiirao1749@gmail.com', role: { $ne: 'admin' } });
    if (conflicting) {
      console.log(`⚠️ Found conflicting non-admin account with email adiirao1749@gmail.com (role: ${conflicting.role}). Removing it...`);
      await User.deleteOne({ _id: conflicting._id });
      console.log('✅ Conflicting account removed.');
    }

    // Check if admin already has the right email
    const existingAdmin = await User.findOne({ email: 'adiirao1749@gmail.com', role: 'admin' });
    if (existingAdmin) {
      console.log('✅ Admin already has email adiirao1749@gmail.com — no change needed.');
      process.exit(0);
    }

    // Update admin email
    admin.email = 'adiirao1749@gmail.com';
    await admin.save();
    console.log('✅ Admin email updated to: adiirao1749@gmail.com');
    console.log('Password remains unchanged.');

    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err);
    process.exit(1);
  }
}

main();
