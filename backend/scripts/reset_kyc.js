import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env variables from backend root
dotenv.config({ path: path.join(__dirname, '../.env') });

import User from '../src/models/User.js'; // Adjust path if necessary

const resetKyc = async () => {
  try {
    if (!process.env.MONGODB_URI) {
      throw new Error("MONGODB_URI is not defined in .env");
    }
    
    console.log("Connecting to MongoDB...");
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected.");

    // You can specify an email here if you only want to reset a specific user
    // e.g., const filter = { email: "your.email@example.com" };
    const filter = {}; // Empty filter means it will update ALL users! 
    // Please update the filter object above to target a specific user if preferred.

    const update = {
      $set: {
        digilocker_status: 'not_started',
        kyc_status: 'not_started',
        'kyc.status': 'pending',
        digilocker_verified: false,
        'kyc.digilocker.status': 'pending'
      },
      $unset: {
        digilocker_initiated_at: "",
        digilocker_verified_at: "",
        kyc_name: "",
        kyc_dob: "",
        kyc_gender: ""
      }
    };

    console.log(`Applying update to users matching filter:`, filter);
    const result = await User.updateMany(filter, update);
    console.log(`Update complete! Modified ${result.modifiedCount} user(s).`);

  } catch (error) {
    console.error("Error resetting KYC fields:", error);
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected from MongoDB.");
    process.exit(0);
  }
};

resetKyc();
