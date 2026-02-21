
import { MongoClient, ObjectId } from 'mongodb';
import dotenv from 'dotenv';
dotenv.config();

const uri = process.env.MONGO_URI || "mongodb://localhost:27017/legal-ai-db";

async function fixWalletBalances() {
    const client = new MongoClient(uri);
    try {
        await client.connect();
        const users = client.db().collection('users');

        const allUsers = await users.find({}).toArray();
        console.log(`Found ${allUsers.length} users. Checking balances...`);

        for (const user of allUsers) {
            let updateNeeded = false;
            let currentBal = user.walletBalance;
            let newBal = 0;

            if (currentBal === undefined || currentBal === null) {
                console.log(`User ${user.username} has NO balance field. Initializing to 0.`);
                newBal = 0;
                updateNeeded = true;
            } else if (typeof currentBal === 'string') {
                console.log(`User ${user.username} has STRING balance ("${currentBal}"). Converting to number.`);
                newBal = parseFloat(currentBal);
                if (isNaN(newBal)) newBal = 0;
                updateNeeded = true;
            } else if (typeof currentBal === 'number' && isNaN(currentBal)) {
                console.log(`User ${user.username} has NaN balance. Resetting to 0.`);
                newBal = 0;
                updateNeeded = true;
            }

            if (updateNeeded) {
                await users.updateOne(
                    { _id: user._id },
                    { $set: { walletBalance: newBal } }
                );
                console.log(`-> Fixed ${user.username}: Balance set to ${newBal}`);
            }
        }

        console.log("Wallet Balance Check Code Complete.");

    } catch (e) {
        console.error(e);
    } finally {
        await client.close();
    }
}
fixWalletBalances();
