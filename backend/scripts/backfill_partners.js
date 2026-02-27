import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../src/models/User.js';

import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

const backfillPartners = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        const partnersWithoutDetails = await User.find({
            role: 'shipment_partner',
            partnerDetails: { $exists: false }
        });

        console.log(`Found ${partnersWithoutDetails.length} partners missing partnerDetails`);

        for (const user of partnersWithoutDetails) {
            user.partnerDetails = {
                fleetDetails: { totalVehicles: 0, vehicleTypes: [] },
                serviceZones: [],
                supportedTypes: ['standard'],
                baseFare: 99,
                perKgRate: 10,
                webhookUrl: '',
                features: [],
                eta: '3-5 days',
                zone: '',
                city: '',
                state: '',
                aadhaar: '',
                address: '',
                status: 'pending_approval'
            };
            await user.save();
            console.log(`Updated partner: ${user.email}`);
        }

        console.log('Backfill complete!');
        process.exit(0);
    } catch (error) {
        console.error('Error backfilling partners:', error);
        process.exit(1);
    }
};

backfillPartners();
