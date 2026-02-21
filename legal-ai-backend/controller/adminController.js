import UserModel from '../models/User.js';
import SystemSetting from '../models/SystemSetting.js';
import NotificationModel from '../models/Notification.js';
import TransactionModel from '../models/Transaction.js';

import CouponModel from '../models/Coupon.js';
import FeedbackModel from '../models/Feedback.js';
import { exec } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const envPath = path.join(__dirname, '../.env');

// Deployment Status Tracker (In-Memory for now)
let deploymentStatus = {
    state: 'IDLE', // IDLE, DEPLOYING, SUCCESS, FAILED
    timestamp: null,
    details: null,
    logs: []
};

// --- Helper for File Upload ---
export const uploadPrompt = async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ error: "No file uploaded" });

        const content = fs.readFileSync(req.file.path, 'utf-8');
        const { type } = req.body; // 'advice', 'draft', or 'compare'

        if (!['advice', 'draft', 'compare'].includes(type)) {
            // Clean up
            fs.unlinkSync(req.file.path);
            return res.status(400).json({ error: "Invalid prompt type" });
        }

        // Fetch current prompts
        const setting = await SystemSetting.findOne({ key: 'system_prompts' });
        const prompts = setting ? setting.value : {};

        // Update specific prompt
        prompts[type] = content;

        // Save
        await SystemSetting.findOneAndUpdate(
            { key: 'system_prompts' },
            { value: prompts, updatedAt: new Date() },
            { upsert: true, new: true }
        );

        // Clean up temp file
        fs.unlinkSync(req.file.path);

        res.json({ message: "Prompt updated from file", prompts });
    } catch (error) {
        console.error("Upload Prompt Error:", error);
        res.status(500).json({ error: "Failed to upload prompt" });
    }
};


// 1. Get Dashboard Stats
// 1. Get Dashboard Stats
export const getStats = async (req, res) => {
    try {
        const totalUsers = await UserModel.collection().countDocuments();
        const proUsers = await UserModel.collection().countDocuments({ subscriptionPlan: 'pro' });

        // Real Revenue
        const revenue = await TransactionModel.getTotalRevenue();

        // Real Activity
        const recentActivity = await TransactionModel.getRecentGlobalActivity(10);

        res.json({
            totalUsers,
            activeSubscriptions: proUsers,
            revenue: revenue,
            recentActivity,
            revenueStream: await TransactionModel.getMonthlyRevenueData()
        });
    } catch (error) {
        console.error("Admin Stats Error:", error);
        res.status(500).json({ error: "Failed to fetch stats" });
    }
};

// 2. Get All Users (Unchanged + Search)
export const getUsers = async (req, res) => {
    try {
        const { search, role } = req.query;
        let query = {};

        if (search) {
            query = {
                $or: [
                    { username: { $regex: search, $options: 'i' } },
                    { email: { $regex: search, $options: 'i' } }
                ]
            };
        }

        if (role) {
            query.role = role;
        }

        const users = await UserModel.collection().find(query).project({ password: 0 }).sort({ createdAt: -1 }).toArray();
        res.json(users);
    } catch (error) {
        console.error("Get Users Error:", error);
        res.status(500).json({ error: "Failed to fetch users" });
    }
};

// 2.1 Get Specific User Details (Deep Dive)
export const getUserDetails = async (req, res) => {
    try {
        const { id } = req.params;
        const user = await UserModel.findById(id).select('-password');
        if (!user) return res.status(404).json({ error: "User not found" });

        // Get Wallet Stats
        const walletStats = await TransactionModel.getStats(id);
        const recentTransactions = await TransactionModel.find({ userId: id })
            .sort({ timestamp: -1 })
            .limit(10); // Get last 10 tx

        res.json({
            user,
            wallet: {
                balance: walletStats.totalCredit - walletStats.totalDebit,
                totalCredit: walletStats.totalCredit,
                totalDebit: walletStats.totalDebit,
                transactions: recentTransactions
            }
        });
    } catch (error) {
        res.status(500).json({ error: "Failed fetch details" });
    }
};

// 2.2 Adjust User Balance (Admin Action)
export const adjustUserBalance = async (req, res) => {
    try {
        const { id } = req.params;
        const { amount, type, description } = req.body; // type: 'CREDIT' or 'DEBIT'

        if (!amount || !type) return res.status(400).json({ error: "Missing fields" });

        await TransactionModel.create({
            userId: id,
            amount: parseFloat(amount),
            type: type,
            category: 'ADMIN_ADJUSTMENT',
            description: description || 'Admin manual adjustment',
            metadata: { adminId: req.user._id }
        });

        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: "Failed adjust balance" });
    }
};

// 3. Update User
export const updateUser = async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body; // e.g., { role: 'admin', blocked: true, subscriptionPlan: 'pro' }

        // Security check: Don't allow changing your own role to non-admin via this if not careful, but typically fine.

        // Convert string id to ObjectId if using native driver, or just pass if mongoose model handles it. 
        // Use the custom static method defined in UserModel class
        const { ObjectId } = await import('mongodb');
        const result = await UserModel.collection().findOneAndUpdate(
            { _id: new ObjectId(id) },
            { $set: updates },
            { returnDocument: 'after' }
        );

        if (!result) return res.status(404).json({ error: "User not found" });

        // result.value contains the updated document in standard MongoDB driver
        res.json(result.value || result);
    } catch (error) {
        console.error("Update User Error:", error);
        res.status(500).json({ error: "Failed to update user" });
    }
};

// 4. System Config
export const getSystemConfig = async (req, res) => {
    try {
        const settings = await SystemSetting.find({});
        // Convert array to object key-value
        const config = {};
        settings.forEach(s => config[s.key] = s.value);
        res.json(config);
    } catch (error) {
        res.status(500).json({ error: "Failed config fetch" });
    }
};

// Helper to Log Audit
import AuditLog from '../models/AuditLog.js'; // Ensure import at top of file, but since I am editing function, I will add it dynamically or rely on top import if I add it.
// I'll add the dynamic import inside to be safe since I can't see top imports easily in this chunk edit.

export const updateSystemConfig = async (req, res) => {
    try {
        const { key, value } = req.body;
        // Upsert
        const setting = await SystemSetting.findOneAndUpdate(
            { key },
            { value, updatedAt: new Date() },
            { upsert: true, new: true }
        );

        // AUDIT LOG
        try {
            const AuditLog = (await import('../models/AuditLog.js')).default;
            await AuditLog.create({
                adminId: req.user._id,
                adminName: req.user.username,
                action: 'UPDATE_CONFIG',
                target: `Config: ${key}`,
                details: { newValue: value },
                ipAddress: req.ip
            });
        } catch (logErr) { console.error("Audit Log Fail:", logErr); }

        res.json(setting);
    } catch (error) {
        res.status(500).json({ error: "Failed config update" });
    }
};

// 6. Audit Logs
export const getAuditLogs = async (req, res) => {
    try {
        const AuditLog = (await import('../models/AuditLog.js')).default;
        const logs = await AuditLog.find().sort({ createdAt: -1 }).limit(100);
        res.json(logs);
    } catch (error) {
        res.status(500).json({ error: "Failed fetch logs" });
    }
};

// 5. Notifications
export const getNotifications = async (req, res) => {
    try {
        const notes = await NotificationModel.find().sort({ createdAt: -1 }).limit(20);
        res.json(notes);
    } catch (error) {
        res.status(500).json({ error: "Failed fetch notifications" });
    }
};


export const createUser = async (req, res) => {
    try {
        const { username, email, mobile, password, role, profession } = req.body;
        // Basic Validation
        if (!username || !email || !password || !mobile) {
            return res.status(400).json({ error: "Missing required fields" });
        }

        const bcrypt = (await import('bcryptjs')).default;
        const hashedPassword = await bcrypt.hash(password, 10);

        // Check duplicates
        const existing = await UserModel.findByEmail(email);
        if (existing) return res.status(400).json({ error: "Email already exists" });

        await UserModel.create({
            username, email, mobile, password: hashedPassword, role: role || 'user', profession: profession || 'individual',
            walletBalance: 0,
            termsAgreed: true
        });

        res.status(201).json({ message: "User created successfully" });
    } catch (error) {
        console.error("Create User Error:", error);
        res.status(500).json({ error: "Failed to create user" });
    }
};

export const createNotification = async (req, res) => {
    try {
        const { title, message, type, target } = req.body;
        const note = await NotificationModel.create({
            title, message, type, target
        });
        res.json(note);
    } catch (error) {
        res.status(500).json({ error: "Failed create notification" });
    }
};

// --- Cloud Deployment ---

export const getDeploymentStatus = async (req, res) => {
    res.json(deploymentStatus);
};

export const deployToVertex = async (req, res) => {
    // 1. Check Env Vars
    const projectId = process.env.GOOGLE_CLOUD_PROJECT;
    if (!projectId || projectId === 'your-gcp-project-id') {
        return res.status(400).json({
            error: "Configuration Error",
            details: "GOOGLE_CLOUD_PROJECT is not set in Environment Variables. Please set it in the 'Env Variables' tab."
        });
    }

    // 2. Check GCloud CLI
    exec('gcloud --version', (err) => {
        if (err) {
            return res.status(500).json({
                error: "Dependency Missing",
                details: "Google Cloud SDK (gcloud) is not installed on the server. Please install it to enable auto-deployment.",
                link: "https://cloud.google.com/sdk/docs/install"
            });
        }

        // 3. Initiate Deployment (Background)
        if (deploymentStatus.state === 'DEPLOYING') {
            return res.status(409).json({ error: "Deployment already in progress" });
        }

        deploymentStatus = {
            state: 'DEPLOYING',
            timestamp: new Date(),
            details: "Starting Cloud Run deployment...",
            logs: ["Initializing..."]
        };

        res.json({ message: "Deployment Initiated", status: "DEPLOYING" });

        // Run Command
        const region = process.env.GOOGLE_CLOUD_LOCATION || 'us-central1';
        const cmd = `gcloud run deploy lexai-backend --source . --region ${region} --project ${projectId} --allow-unauthenticated --format=json`;

        const deployProcess = exec(cmd, { cwd: path.join(__dirname, '..') });

        deployProcess.stdout.on('data', (data) => {
            deploymentStatus.logs.push(data.toString());
            // Optionally parse JSON output if formatted
        });

        deployProcess.stderr.on('data', (data) => {
            deploymentStatus.logs.push(`[LOG] ${data.toString()}`);
        });

        deployProcess.on('exit', (code) => {
            if (code === 0) {
                deploymentStatus.state = 'SUCCESS';
                deploymentStatus.details = `Deployed successfully to ${projectId}`;
                deploymentStatus.logs.push("Deployment Complete.");
            } else {
                deploymentStatus.state = 'FAILED';
                deploymentStatus.details = `Process exited with code ${code}`;
                deploymentStatus.logs.push("Deployment Failed.");
            }
        });
    });
};

export const undeployFromVertex = async (req, res) => {
    exec('gcloud --version', (err) => {
        if (err) {
            return res.status(500).json({ error: "Undeploy Failed: gcloud CLI not found." });
        }
        res.json({ message: "Vertex AI Resources Teardown Initiated. Please verify in GCP Console." });
    });
};

// --- Coupon Management ---
export const getCoupons = async (req, res) => {
    try {
        const coupons = await CouponModel.find({}, null, { sort: { createdAt: -1 } });
        res.json(coupons);
    } catch (e) { res.status(500).json({ error: "Failed to fetch coupons" }); }
};

export const createCoupon = async (req, res) => {
    try {
        const { code, discountType, discountValue, expiryDate, usageLimit } = req.body;
        const coupon = await CouponModel.create({
            code, discountType, discountValue, expiryDate, usageLimit
        });
        res.status(201).json(coupon);
    } catch (e) {
        if (e.code === 11000) return res.status(400).json({ error: "Code already exists" });
        res.status(500).json({ error: "Failed to create coupon" });
    }
};

export const deleteCoupon = async (req, res) => {
    try {
        await CouponModel.findByIdAndDelete(req.params.id);
        res.json({ message: "Coupon deleted" });
    } catch (e) { res.status(500).json({ error: "Failed to delete" }); }
};

// --- Feedback Loop ---
export const getFeedbacks = async (req, res) => {
    try {
        // Fetch without populate, use lean for plain objects
        const feedbacks = await FeedbackModel.find().sort({ createdAt: -1 }).limit(50).lean();

        // Manual Population because User is not a Mongoose Model
        const populated = await Promise.all(feedbacks.map(async (fb) => {
            if (fb.userId) {
                try {
                    const user = await UserModel.findById(fb.userId);
                    // Safe user object
                    fb.userId = user ? { _id: user._id, username: user.username, email: user.email } : null;
                } catch (err) {
                    fb.userId = null; // Handle orphaned IDs
                }
            }
            return fb;
        }));

        res.json(populated);
    } catch (e) {
        console.error("Get Feedbacks Error:", e); // Detailed logging
        res.status(500).json({ error: "Failed to fetch feedback" });
    }
};

export const updateFeedbackStatus = async (req, res) => {
    try {
        const { status, adminNotes } = req.body;
        const feedback = await FeedbackModel.findByIdAndUpdate(req.params.id, { status, adminNotes }, { new: true });
        res.json(feedback);
    } catch (e) { res.status(500).json({ error: "Failed update" }); }
};

// --- Environment Variables ---
export const getEnvConfig = async (req, res) => {
    try {
        if (!fs.existsSync(envPath)) {
            return res.json({}); // No .env file
        }
        const envContent = fs.readFileSync(envPath, 'utf-8');
        const lines = envContent.split('\n');
        const envVars = {};

        lines.forEach(line => {
            const trimmed = line.trim();
            if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
                const parts = trimmed.split('=');
                const key = parts[0].trim();
                let value = parts.slice(1).join('=').trim();
                // Remove quotes if present
                if (value.startsWith('"') && value.endsWith('"')) {
                    value = value.slice(1, -1);
                }
                envVars[key] = value;
            }
        });

        res.json(envVars);
    } catch (error) {
        console.error("Get Env Error:", error);
        res.status(500).json({ error: "Failed to read environment variables" });
    }
};

export const updateEnvConfig = async (req, res) => {
    try {
        const { key, value } = req.body;
        if (!key) return res.status(400).json({ error: "Key is required" });

        let envContent = '';
        if (fs.existsSync(envPath)) {
            envContent = fs.readFileSync(envPath, 'utf-8');
        }

        const lines = envContent.split('\n');
        let found = false;
        const newLines = lines.map(line => {
            const trimmed = line.trim();
            if (trimmed.startsWith(`${key}=`)) {
                found = true;
                // Add quotes if value contains spaces
                const formattedValue = value.includes(' ') ? `"${value}"` : value;
                return `${key}=${formattedValue}`;
            }
            return line;
        });

        if (!found) {
            const formattedValue = value.includes(' ') ? `"${value}"` : value;
            newLines.push(`${key}=${formattedValue}`);
        }

        fs.writeFileSync(envPath, newLines.join('\n'));

        // Update current process env as well (optional, but good for immediate effect if possible)
        process.env[key] = value;

        res.json({ message: "Environment variable updated", key, value });
    } catch (error) {
        console.error("Update Env Error:", error);
        res.status(500).json({ error: "Failed to update environment variable" });
    }
};
