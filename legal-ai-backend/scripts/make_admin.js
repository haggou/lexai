
import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';
dotenv.config();

const uri = process.env.MONGODB_URI || "mongodb://localhost:27017/legal-ai-db";

async function makeAdmin(username) {
    const client = new MongoClient(uri);
    try {
        await client.connect();
        const database = client.db("legal-ai-db");
        const users = database.collection("users");

        const result = await users.updateOne(
            { username: username },
            { $set: { role: 'admin' } }
        );

        if (result.matchedCount === 0) {
            console.log(`User ${username} not found.`);
        } else {
            console.log(`User ${username} is now an ADMIN.`);
        }

    } finally {
        await client.close();
    }
}

// Get username from command line arg or default to 'vinita'
const targetUser = process.argv[2] || 'vinita';
makeAdmin(targetUser).catch(console.error);
