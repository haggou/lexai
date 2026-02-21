
import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';
dotenv.config();

const uri = process.env.MONGODB_URI || "mongodb://localhost:27017/legal-ai-db";

async function listUsers() {
    const client = new MongoClient(uri);
    try {
        await client.connect();
        const database = client.db("legal-ai-db"); // Assuming db name is legal-ai or from uri
        const users = database.collection("users");

        const userList = await users.find({}).toArray();
        console.log("Users found:", userList.length);
        userList.forEach(user => {
            console.log(`- ${user.username} | Role: ${user.role} | Email: ${user.email} | Mobile: ${user.mobile} | ID: ${user._id}`);
        });

    } finally {
        await client.close();
    }
}

listUsers().catch(console.error);
