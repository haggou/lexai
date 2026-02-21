import { connectDB, getDB } from './config/db.js';
import UserModel from './models/User.js';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
dotenv.config();

const createAdmin = async () => {
    try {
        await connectDB();
        const db = getDB();

        const username = 'admin';
        const password = 'admin123';

        // Check if exists
        const existing = await UserModel.findByUsername(username);
        if (existing) {
            console.log("Admin user 'admin' already exists.");

            // Optional: Update to ensure role is admin
            await UserModel.collection().updateOne(
                { username: 'admin' },
                { $set: { role: 'admin' } }
            );
            console.log("Ensured role is 'admin'.");
            process.exit(0);
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        await UserModel.collection().insertOne({
            username,
            email: 'admin@lexai.com',
            mobile: '0000000000',
            password: hashedPassword,
            role: 'admin',
            termsAgreed: true,
            createdAt: new Date(),
            walletBalance: 1000.00
        });

        console.log("✅ Admin User Created Successfully!");
        console.log("Username: admin");
        console.log("Password: admin123");

        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
};

createAdmin();
