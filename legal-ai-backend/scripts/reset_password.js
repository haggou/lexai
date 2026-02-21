
import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';

dotenv.config();

const uri = process.env.MONGODB_URI || "mongodb://localhost:27017/legal-ai-db";

async function resetPassword(username, newPassword) {
    const client = new MongoClient(uri);
    try {
        await client.connect();
        const database = client.db("legal-ai-db");
        const users = database.collection("users");

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        const result = await users.updateOne(
            { username: username },
            { $set: { password: hashedPassword } }
        );

        if (result.matchedCount === 0) {
            console.log(`User ${username} not found.`);
        } else {
            console.log(`Password for ${username} has been reset to: ${newPassword}`);
        }

    } catch (error) {
        console.error("Error resetting password:", error);
    } finally {
        await client.close();
    }
}

const targetUser = process.argv[2] || 'vinita';
const newPass = process.argv[3] || 'password123';

resetPassword(targetUser, newPass);
