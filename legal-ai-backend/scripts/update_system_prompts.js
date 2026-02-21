
import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import SystemSetting from '../models/SystemSetting.js';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.join(__dirname, '..');

const connectDB = async () => {
    try {
        const uri = process.env.MONGODB_URI || "mongodb://localhost:27017/legal-ai-db";
        console.log(`Connecting to MongoDB at ${uri}...`);
        await mongoose.connect(uri);
        console.log('MongoDB Connected');
    } catch (err) {
        console.error('MongoDB Connection Error:', err);
        process.exit(1);
    }
};

const readFile = (filename) => {
    try {
        const filePath = path.join(rootDir, filename);
        if (fs.existsSync(filePath)) {
            return fs.readFileSync(filePath, 'utf8');
        }
        console.warn(`File not found: ${filename}`);
        return null;
    } catch (e) {
        console.error(`Error reading ${filename}:`, e);
        return null;
    }
};

const updatePrompts = async () => {
    await connectDB();

    const advicePrompt = readFile('advice.md');
    const draftPrompt = readFile('draft.md');

    // Check for other prompts to ensure we don't accidentally wipe them if we were replacing everything
    // But since we merge, it's fine.

    let updates = {};
    if (advicePrompt) {
        console.log("Read advice.md (" + advicePrompt.length + " chars)");
        updates.advice = advicePrompt;
    }
    if (draftPrompt) {
        console.log("Read draft.md (" + draftPrompt.length + " chars)");
        updates.draft = draftPrompt;
    }

    if (Object.keys(updates).length === 0) {
        console.log("No prompts found to update.");
        process.exit(0);
    }

    try {
        let setting = await SystemSetting.findOne({ key: 'system_prompts' });

        if (setting) {
            console.log("Existing system_prompts found. Updating...");
            // Merge existing with new
            const updatedValue = { ...setting.value, ...updates };
            setting.value = updatedValue;
            setting.markModified('value'); // Vital for Mixed type
            setting.updatedAt = new Date();
            await setting.save();
        } else {
            console.log("No system_prompts found. Creating new...");
            await SystemSetting.create({
                key: 'system_prompts',
                value: updates
            });
        }

        console.log("System prompts updated successfully in database.");

    } catch (error) {
        console.error("Error updating system prompts:", error);
    } finally {
        await mongoose.disconnect();
    }
};

updatePrompts();
