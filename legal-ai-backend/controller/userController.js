import UserModel from '../models/User.js';
import { validationResult } from 'express-validator';
import bcrypt from 'bcryptjs';
import FeedbackModel from '../models/Feedback.js';

// 1. Get User Profile (Self or Admin by ID)
export const getProfile = async (req, res) => {
    try {
        let userId = req.user._id;
        console.log(`[PROFILE] Fetching profile for User ID: ${userId}`);

        // If Admin allows fetching other profiles via params
        if (req.params.id && req.user.role === 'admin') {
            userId = req.params.id;
            console.log(`[PROFILE] Admin override. Fetching User ID: ${userId}`);
        }

        const user = await UserModel.findById(userId);
        if (!user) {
            console.log(`[PROFILE] User not found: ${userId}`);
            return res.status(404).json({ error: "User not found" });
        }

        console.log(`[PROFILE] Found User: ${user.username}, Role: ${user.role}`);

        // Check and Generate Referral Code if missing
        if (!user.referralCode) {
            const newReferralCode = (user.username.substring(0, 4) + Math.floor(1000 + Math.random() * 9000)).toUpperCase();
            await UserModel.updateProfile(user._id, { referralCode: newReferralCode });
            user.referralCode = newReferralCode; // Update local object
            console.log(`[PROFILE] Generated missing referral code for ${user.username}: ${newReferralCode}`);
        }

        // Get Referral Count
        const referralCount = await UserModel.countReferrals(user._id);

        // Construct Enhanced Profile Object
        const enhancedProfile = {
            id: user._id,
            username: user.username,
            email: user.email,
            mobile: user.mobile,
            whatsapp: user.whatsapp,
            profession: user.profession,
            role: user.role,

            // Financials
            walletBalance: user.walletBalance || 0,
            subscriptionPlan: user.subscriptionPlan || 'free',

            // Referral System
            referralCode: user.referralCode,
            totalReferrals: referralCount,

            // Timestamps
            createdAt: user.createdAt,
            updatedAt: user.updatedAt
        };

        res.json(enhancedProfile);

    } catch (error) {
        console.error("Profile Fetch Error:", error);
        res.status(500).json({ error: "Failed to fetch profile" });
    }
};

// 2. Update Profile
export const updateProfile = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    try {
        let userId = req.user._id;

        // Admin Override
        if (req.params.id && req.user.role === 'admin') {
            userId = req.params.id;
        }

        const { username, email, mobile, profession, whatsapp, password } = req.body;
        const updates = {};

        // Validation & Uniqueness Check (Only if changing)
        if (username) {
            const exists = await UserModel.findByUsername(username);
            if (exists && exists._id.toString() !== userId.toString()) {
                return res.status(400).json({ error: "Username already taken." });
            }
            updates.username = username;
        }

        if (email) {
            const exists = await UserModel.findByEmail(email);
            if (exists && exists._id.toString() !== userId.toString()) {
                return res.status(400).json({ error: "Email already taken." });
            }
            updates.email = email;
        }

        if (mobile) updates.mobile = mobile;
        if (whatsapp) updates.whatsapp = whatsapp;
        if (profession) updates.profession = profession;

        // Password Update (Optional - Recommended to use specific endpoint, but supported here for Admin "Hero" control)
        if (password) {
            updates.password = await bcrypt.hash(password, 10);
        }

        if (Object.keys(updates).length === 0) {
            return res.status(400).json({ error: "No update data provided." });
        }

        await UserModel.updateProfile(userId, updates);
        res.json({ message: "Profile updated successfully.", updates });

    } catch (error) {
        console.error("Update Profile Error:", error);
        res.status(500).json({ error: "Failed to update profile." });
    }
};

// 3. Delete Profile
export const deleteProfile = async (req, res) => {
    try {
        let userId = req.user._id;
        let message = "Your account has been deleted.";

        // Admin Override
        if (req.params.id && req.user.role === 'admin') {
            userId = req.params.id;
            message = "User account has been deleted by Admin.";
        }

        const result = await UserModel.deleteUser(userId);

        if (result.deletedCount === 0) {
            return res.status(404).json({ error: "User not found or already deleted." });
        }

        res.json({ message });

    } catch (error) {
        console.error("Delete Profile Error:", error);
        res.status(500).json({ error: "Failed to delete profile." });
    }
};

// 4. Admin: List All Users (Enhanced)
export const getAllUsers = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const skip = (page - 1) * limit;

        const users = await UserModel.findAll({}, limit, skip);

        // Sanitize
        const sanitizedUsers = users.map(u => {
            const { password, otp, ...rest } = u;
            return rest;
        });

        res.json({
            count: sanitizedUsers.length,
            page,
            users: sanitizedUsers
        });

    } catch (error) {
        res.status(500).json({ error: "Failed to fetch users." });
    }
};
// 5. Submit Feedback

export const submitFeedback = async (req, res) => {
    try {
        console.log("[FEEDBACK] Received Feedback Request:", req.body);
        const { message, type, rating } = req.body;
        if (!message) return res.status(400).json({ error: "Message is required" });

        const feedback = await FeedbackModel.create({
            userId: req.user._id,
            message,
            type: type || 'other',
            rating: rating || 0
        });

        res.status(201).json({ message: "Feedback submitted successfully", feedback });
    } catch (error) {
        console.error("Feedback Error:", error);
        res.status(500).json({ error: "Failed to submit feedback" });
    }
};
// 6. Get Public System Config (Models & Pricing)
export const getPublicConfig = async (req, res) => {
    try {
        const { default: SystemSetting } = await import('../models/SystemSetting.js');

        const modelsSetting = await SystemSetting.findOne({ key: 'supported_models' });
        const pricingSetting = await SystemSetting.findOne({ key: 'model_pricing' });

        const supportedModels = (modelsSetting?.value && Array.isArray(modelsSetting.value))
            ? modelsSetting.value
            : ['gemini-1.5-flash', 'gemini-1.5-pro']; // Default fallback

        // Optional: Send pricing info too if frontend needs to show estimated costs
        const modelPricing = pricingSetting?.value || {};

        res.json({
            supported_models: supportedModels.map(id => ({
                id,
                name: id.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()), // Formatted Name
                desc: modelPricing[id] ? `Rate: $${modelPricing[id]}/tok` : 'Standard AI Model',
                context: '128k' // Generic context window
            }))
        });

    } catch (error) {
        console.error("Config Fetch Error:", error);
        res.status(500).json({ error: "Failed to fetch system config" });
    }
};
