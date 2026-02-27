/**
 * Production fix: Drop stale unique indexes that conflict with multi-tenant (per-user) data.
 * After running, Mongoose will recreate the correct indexes on next server start.
 */
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

async function fixIndexes() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Connected to MongoDB');

        const db = mongoose.connection.db;

        // Collections and their problematic unique indexes
        const fixes = [
            { collection: 'vehicles', indexes: ['numberPlate_1', 'chassisNumber_1'] },
            { collection: 'inventories', indexes: ['sku_1'] },
        ];

        for (const fix of fixes) {
            const col = db.collection(fix.collection);
            let indexes;
            try {
                indexes = await col.indexes();
            } catch (e) {
                console.log(`  ⚠️ Collection '${fix.collection}' doesn't exist yet, skipping.`);
                continue;
            }

            for (const idxName of fix.indexes) {
                const idx = indexes.find(i => i.name === idxName);
                if (idx && idx.unique) {
                    console.log(`🔧 Dropping unique index '${idxName}' from '${fix.collection}'...`);
                    await col.dropIndex(idxName);
                    console.log(`   ✅ Dropped.`);
                } else if (idx) {
                    console.log(`   ℹ️ '${idxName}' on '${fix.collection}' is not unique, OK.`);
                } else {
                    console.log(`   ℹ️ '${idxName}' not found on '${fix.collection}', OK.`);
                }
            }
        }

        console.log('\n✅ All stale unique indexes fixed.');
    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await mongoose.disconnect();
        console.log('Done.');
    }
}

fixIndexes();
