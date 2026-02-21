import Razorpay from 'razorpay';
import crypto from 'crypto';
import UserModel from '../models/User.js';
import TransactionModel from '../models/Transaction.js';
import dotenv from 'dotenv';
import { validationResult } from 'express-validator';

dotenv.config();

const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET
});

// 1. Create Order
export const createOrder = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

        const { amount } = req.body; // Amount in INR
        if (!amount || amount <= 0) return res.status(400).json({ error: "Amount must be a positive number" });

        const options = {
            amount: amount * 100, // Razorpay takes amount in paisa
            currency: "INR",
            receipt: `receipt_${Date.now()}`
        };

        const order = await razorpay.orders.create(options);
        res.json(order);
    } catch (error) {
        console.error("Razorpay Order Error:", error);
        res.status(500).json({ error: "Failed to create order" });
    }
};

// 2. Verify Payment & Add Credits
export const verifyPayment = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

        const { razorpay_order_id, razorpay_payment_id, razorpay_signature, amount } = req.body;
        const userId = req.user._id;

        const body = razorpay_order_id + "|" + razorpay_payment_id;
        const expectedSignature = crypto
            .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
            .update(body.toString())
            .digest('hex');

        if (expectedSignature === razorpay_signature) {
            // Payment Success -> Add Balance (Direct INR)
            const amountToAdd = parseFloat(amount);

            console.log(`[WalletController] Verifying Payment: User=${userId}, Amount=${amountToAdd}`);

            await UserModel.updateBalance(userId, amountToAdd);
            console.log(`[WalletController] Balance Updated Successfully`);

            // LOG TRANSACTION
            await TransactionModel.create({
                userId: userId,
                amount: amountToAdd,
                type: 'CREDIT',
                category: 'RECHARGE',
                description: 'Wallet Recharge (Razorpay)',
                metadata: {
                    orderId: razorpay_order_id,
                    paymentId: razorpay_payment_id
                }
            });

            return res.json({
                status: "success",
                message: "Payment verified and balance added",
                balanceAdded: amountToAdd
            });
        } else {
            return res.status(400).json({ error: "Invalid signature" });
        }
    } catch (error) {
        console.error("Payment Verification Error:", error);
        res.status(500).json({ error: "Payment verification failed" });
    }
};

// Deprecated: Old manual method (Optional: Keep for admin/testing)
export const addCredits = async (req, res) => {
    res.status(400).json({ error: "Use /create-order and /verify-payment instead." });
};

export const getBalance = async (req, res) => {
    try {
        const userId = req.user._id;
        let user = await UserModel.findById(userId);
        if (!user) return res.status(404).json({ error: "User not found" });

        // DEMO MODE: Auto-Refill if Balance is 0 (Infinite Refill)
        if (user.walletBalance < 1) { // Check < 1 to catch near-zero
            console.log(`[Wallet] Demo Auto-Refill for ${user.username}`);
            await UserModel.updateBalance(userId, 50.00);
            await TransactionModel.create({
                userId: userId,
                amount: 50.00,
                type: 'CREDIT',
                category: 'BONUS',
                description: 'Demo Account Refill'
            });
            // Refresh User Data
            user = await UserModel.findById(userId);
        }

        res.json({
            balance: isNaN(user.walletBalance) ? 0 : user.walletBalance,
            plan: user.subscriptionPlan
        });
    } catch (error) {
        console.error("Get Balance Error:", error);
        res.status(500).json({ error: "Failed to fetch balance" });
    }
};

export const getTransactions = async (req, res) => {
    try {
        const userId = req.user._id.toString();
        // If limit is 'all' or -1, set to 0 (all) for Model
        let limit = parseInt(req.query.limit) || 20;
        if (req.query.limit === 'all') limit = 0;

        console.log(`[Transactions] Fetching for User: ${userId} | Limit: ${limit}`);
        const transactions = await TransactionModel.getHistory(userId, limit);
        console.log(`[Transactions] Found: ${transactions.length} records`);

        res.json(transactions);
    } catch (error) {
        console.error("Fetch Transactions Error:", error);
        res.status(500).json({ error: "Failed to fetch transactions" });
    }
};

export const getWalletStats = async (req, res) => {
    try {
        const userId = req.user._id.toString();
        const stats = await TransactionModel.getStats(userId);
        res.json(stats);
    } catch (error) {
        console.error("Wallet Stats Error:", error);
        res.status(500).json({ error: "Failed to fetch stats" });
    }
};
