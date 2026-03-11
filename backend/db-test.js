import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const MONGO_URI = 'mongodb+srv://fastfare:fastfare@cluster1.brrqru3.mongodb.net/?appName=Cluster1';

async function testDB() {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('Connected to MongoDB');

        const db = mongoose.connection.db;
        const drivers = await db.collection('wmsdrivers').find().limit(5).toArray();

        console.log(`Found ${drivers.length} drivers:`);

        for (const driver of drivers) {
            console.log('---');
            console.log(`Driver ID: "${driver.driverId}"`);
            console.log(`Name: ${driver.name}`);
            console.log(`Status: ${driver.status}`);
            console.log(`Visible Pwd: "${driver.visiblePassword}"`);
            console.log(`Hashed Pwd: ${driver.password}`);
            console.log(`Created At: ${driver.createdAt}`);

            if (driver.visiblePassword && driver.password) {
                const isMatch = await bcrypt.compare(driver.visiblePassword, driver.password);
                console.log(`Password Match Test (visible === hash): ${isMatch}`);
            }
        }

    } catch (e) {
        console.error(e);
    } finally {
        await mongoose.disconnect();
    }
}

testDB();
