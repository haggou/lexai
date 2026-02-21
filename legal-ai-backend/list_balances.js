
import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';
dotenv.config();

const uri = process.env.MONGO_URI || "mongodb://localhost:27017/legal-ai-db";

async function listAllBalances() {
    const client = new MongoClient(uri);
    try {
        await client.connect();
        const users = client.db().collection('users');

        const allUsers = await users.find({}).project({ username: 1, email: 1, walletBalance: 1 }).toArray();

        console.log("\n=== USER WALLET REPORT ===");
        console.log("Username".padEnd(20) + " | " + "Balance".padEnd(10) + " | " + "Email");
        console.log("-".repeat(60));

        allUsers.forEach(u => {
            const balance = u.walletBalance !== undefined && u.walletBalance !== null
                ? `₹ ${u.walletBalance.toFixed(2)}`
                : "NaN (Error)";
            console.log(`${u.username.padEnd(20)} | ${balance.padEnd(10)} | ${u.email}`);
        });
        console.log("-".repeat(60));

    } catch (e) {
        console.error(e);
    } finally {
        await client.close();
    }
}
listAllBalances();
