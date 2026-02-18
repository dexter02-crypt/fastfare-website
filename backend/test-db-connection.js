
const mongoose = require('mongoose');
const uriLocal = "mongodb://localhost:27017/fastfare";
const uriRemote = "mongodb+srv://fastfare:fastfare@cluster1.brrqru3.mongodb.net/?appName=Cluster1";

async function testConnection(uri, name) {
    console.log(`Testing ${name} connection...`);
    try {
        await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });
        console.log(`✅ SUCCESS: Connected to ${name}`);
        await mongoose.disconnect();
    } catch (err) {
        console.log(`❌ FAILED: Could not connect to ${name}`);
        console.log(`   Error: ${err.message}`);
    }
}

async function run() {
    await testConnection(uriLocal, "LOCAL");
    await testConnection(uriRemote, "REMOTE (Atlas)");
}

run();
