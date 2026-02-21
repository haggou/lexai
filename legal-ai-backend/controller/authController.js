import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import UserModel from '../models/User.js';

const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkey';

const ALLOWED_PROFESSIONS = ['lawyer', 'lekhpal', 'csc user', 'individual', 'other'];

import { validationResult } from 'express-validator';

// Register User
export const register = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { username, email, profession, professionOther, mobile, whatsapp, password, termsAgreed, referralCode } = req.body;

        if (!termsAgreed) {
            return res.status(400).json({ error: "You must agree to the Terms & Conditions." });
        }

        // Validate Profession
        if (!ALLOWED_PROFESSIONS.includes(profession?.toLowerCase())) {
            return res.status(400).json({ error: `Invalid profession. Allowed: ${ALLOWED_PROFESSIONS.join(', ')}` });
        }

        let finalProfession = profession;
        if (profession.toLowerCase() === 'other') {
            if (!professionOther || professionOther.trim() === "") {
                return res.status(400).json({ error: "Please specify your profession for 'Other' category." });
            }
            finalProfession = `Other: ${professionOther}`;
        }

        // Check if user exists
        const existingUser = await UserModel.findByUsername(username);
        if (existingUser) return res.status(400).json({ error: "Username already exists." });

        const existingMobile = await UserModel.findByMobile(mobile);
        if (existingMobile) return res.status(400).json({ error: "Mobile number already registered." });

        const existingEmail = await UserModel.findByEmail(email);
        if (existingEmail) return res.status(400).json({ error: "Email already registered." });

        // Referral Logic
        let referredBy = null;
        if (referralCode) {
            const referrer = await UserModel.findByReferralCode(referralCode);
            if (referrer) {
                referredBy = referrer._id;
                // Bonus to Referrer (e.g. 20 INR)
                await UserModel.updateBalance(referrer._id, 20);
                console.log(`[Referral] User ${username} referred by ${referrer.username}. Bonus awarded.`);
            }
        }

        // Generate Referral Code for New User
        const newReferralCode = (username.substring(0, 4) + Math.floor(1000 + Math.random() * 9000)).toUpperCase();

        // Hash Password
        const hashedPassword = await bcrypt.hash(password, 10);

        await UserModel.create({
            username,
            email,
            mobile,
            whatsapp: whatsapp || mobile, // Default to mobile if not provided
            profession: finalProfession,
            password: hashedPassword,
            referralCode: newReferralCode,
            referredBy: referredBy,
            termsAgreed: true
        });

        res.status(201).json({ message: "User registered successfully." });

    } catch (error) {
        console.error("Register Error:", error);
        res.status(500).json({ error: "Registration failed." });
    }
};

// Login (Password OR OTP)
// If password is provided, try password. If otp provided, try otp.
export const login = async (req, res) => {
    try {
        const { username, password, otp } = req.body;

        // Allow logging in with Username OR Mobile OR Email
        let user = await UserModel.findByUsername(username);
        if (!user) user = await UserModel.findByEmail(username);
        if (!user) user = await UserModel.findByMobile(username);

        if (!user) return res.status(404).json({ error: "User not found." });

        let isAuthenticated = false;

        if (password) {
            isAuthenticated = await bcrypt.compare(password, user.password);
        } else if (otp) {
            // Verify OTP
            if (user.otp === otp && new Date() < new Date(user.otpExpires)) {
                isAuthenticated = true;
                // Clear OTP after use
                await UserModel.updateOTP(username, null, null);
            } else {
                return res.status(400).json({ error: "Invalid or expired OTP." });
            }
        } else {
            return res.status(400).json({ error: "Provide password or OTP." });
        }

        if (!isAuthenticated) return res.status(401).json({ error: "Invalid credentials." });

        // Generate Token
        const token = jwt.sign({ userId: user._id, username: user.username }, JWT_SECRET, { expiresIn: '7d' });

        res.json({ token, userId: user._id, username: user.username, message: "Login successful." });

    } catch (error) {
        console.error("Login Error:", error);
        res.status(500).json({ error: "Login failed." });
    }
};

import { sendOTP } from '../services/emailService.js';
import { sendSMS } from '../services/smsService.js';

// ... (imports)

// Generate OTP (Email)
export const generateOTP = async (req, res) => {
    try {
        const { username } = req.body;

        let user = await UserModel.findByUsername(username);
        if (!user) user = await UserModel.findByEmail(username);
        if (!user) user = await UserModel.findByMobile(username);

        if (!user) return res.status(404).json({ error: "User not found." });

        const otp = Math.floor(100000 + Math.random() * 900000).toString(); // 6 digit
        const expires = new Date(Date.now() + 10 * 60 * 1000); // 10 mins

        await UserModel.updateOTP(username, otp, expires);

        // Send Real Email & SMS
        const emailSent = await sendOTP(user.email, otp);
        const smsSent = await sendSMS(user.mobile, otp);

        if (emailSent || smsSent) {
            res.json({ message: `OTP sent to Registered Mobile (${user.mobile}) and Email (${user.email})` });
        } else {
            console.warn(`[Mock Fallback] OTP for ${username}: ${otp}`);
            res.json({ message: "Delivery failed (Check Console for Mock OTP).", mockOtp: otp });
        }

    } catch (error) {
        console.error("OTP Error:", error);
        res.status(500).json({ error: "Failed to generate OTP." });
    }
};

// Forgot Password (Request OTP -> Verify -> Reset)
// We reuse generateOTP for the first step.
// This step is specifically for Reseting using the OTP.
export const resetPassword = async (req, res) => {
    try {
        const { username, otp, newPassword } = req.body;

        const user = await UserModel.findByUsername(username);
        if (!user) return res.status(404).json({ error: "User not found." });

        // Verify OTP
        if (user.otp !== otp || new Date() > new Date(user.otpExpires)) {
            return res.status(400).json({ error: "Invalid or expired OTP." });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await UserModel.updatePassword(username, hashedPassword);

        res.json({ message: "Password reset successfully." });

    } catch (error) {
        res.status(500).json({ error: "Failed to reset password." });
    }
};


export const logout = (req, res) => {
    res.json({ message: "Logged out successfully." });
};

// Admin Login (Strict: Password or OTP)
export const adminLogin = async (req, res) => {
    try {
        const { username, password, otp } = req.body;

        // Allow Admin login by Username, Email, or Mobile
        let user = await UserModel.findByUsername(username);
        if (!user) user = await UserModel.findByEmail(username);
        if (!user) user = await UserModel.findByMobile(username);

        if (!user) return res.status(404).json({ error: "Admin account not found." });

        if (user.role !== 'admin') {
            return res.status(403).json({ error: "Access Denied. Not an Administrator." });
        }

        let isAuthenticated = false;

        if (password) {
            isAuthenticated = await bcrypt.compare(password, user.password);
        } else if (otp) {
            // Verify OTP
            if (user.otp === otp && new Date() < new Date(user.otpExpires)) {
                isAuthenticated = true;
                // Clear OTP after use
                await UserModel.updateOTP(user.username, null, null);
            } else {
                return res.status(400).json({ error: "Invalid or expired Admin OTP." });
            }
        } else {
            return res.status(400).json({ error: "Provide password or OTP." });
        }

        if (!isAuthenticated) return res.status(401).json({ error: "Invalid admin credentials." });

        // Generate Token
        const token = jwt.sign({ userId: user._id, username: user.username, role: user.role }, JWT_SECRET, { expiresIn: '12h' });

        res.json({
            token,
            userId: user._id,
            username: user.username,
            role: user.role,
            message: "Admin Login successful."
        });


    } catch (error) {
        console.error("Admin Login Error:", error);
        res.status(500).json({ error: "Admin Login failed." });
    }
};

// Admin Register (Protected by Secret Key)
export const adminRegister = async (req, res) => {
    try {
        const { username, password, email, adminSecret } = req.body;

        // Verify Admin Secret (Must be set in .env)
        if (adminSecret !== process.env.ADMIN_SECRET) {
            return res.status(403).json({ error: "Invalid Admin Creation Secret." });
        }

        const existingUser = await UserModel.findByUsername(username);
        if (existingUser) return res.status(400).json({ error: "Admin username already exists." });

        const hashedPassword = await bcrypt.hash(password, 10);

        await UserModel.create({
            username,
            email,
            password: hashedPassword,
            role: 'admin', // Explicitly set admin role
            isVerified: true
        });

        res.status(201).json({ message: "Admin Account created successfully." });

    } catch (error) {
        console.error("Admin Register Error:", error);
        res.status(500).json({ error: "Admin Registration failed." });
    }
};


