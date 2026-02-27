/**
 * Fix: Drop stale gstin_1 index that doesn't have sparse:true,
 * causing E11000 duplicate key errors when multiple users have null GSTIN.
 * Mongoose will auto-recreate the index with sparse:true on next server start.
 */
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

async function fixGstinIndex() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Connected to MongoDB');

        const db = mongoose.connection.db;
        const collection = db.collection('users');

        // List current indexes
        const indexes = await collection.indexes();
        console.log('Current indexes:');
        indexes.forEach(idx => console.log(`  - ${idx.name}: ${JSON.stringify(idx.key)} sparse=${idx.sparse || false}`));

        // Drop the gstin_1 index if it exists
        const gstinIndex = indexes.find(idx => idx.name === 'gstin_1');
        if (gstinIndex) {
            console.log('\n🔧 Dropping stale gstin_1 index...');
            await collection.dropIndex('gstin_1');
            console.log('✅ gstin_1 index dropped successfully!');
            console.log('   Mongoose will recreate it with sparse:true on next server start.');
        } else {
            console.log('\n✅ gstin_1 index not found — no fix needed.');
        }

        // Also drop phone_1 if it exists and is not sparse (same potential issue)
        const phoneIndex = indexes.find(idx => idx.name === 'phone_1');
        if (phoneIndex && !phoneIndex.sparse) {
            console.log('\n🔧 Dropping phone_1 index (not sparse)...');
            await collection.dropIndex('phone_1');
            console.log('✅ phone_1 index dropped.');
        }

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await mongoose.disconnect();
        console.log('\nDone.');
    }
}

fixGstinIndex();
