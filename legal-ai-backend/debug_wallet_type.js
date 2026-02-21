
import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';
dotenv.config();

const uri = process.env.MONGO_URI || "mongodb://localhost:27017/legal-ai-db";

async function inspectUserBalances() {
    const client = new MongoClient(uri);
    try {
        await client.connect();
        const users = client.db().collection('users');

        const allUsers = await users.find({}).project({ username: 1, walletBalance: 1 }).toArray();

        console.log("Checking User Wallet Types:");
        allUsers.forEach(u => {
            const type = typeof u.walletBalance;
            const valid = typeof u.walletBalance === 'number' && !isNaN(u.walletBalance);
            console.log(`User: ${u.username}, Balance: ${u.walletBalance} (Type: ${type}), Valid Number: ${valid}`);
        });

    } catch (e) {
        console.error(e);
    } finally {
        await client.close();
    }
}
inspectUserBalances();
