import Razorpay from 'razorpay';
import crypto from 'crypto';
import UserModel from '../models/User.js';
import TransactionModel from '../models/Transaction.js';
import dotenv from 'dotenv';
dotenv.config();

const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET
});

// Unified Dynamic Plan Configuration
const DEFAULT_PLANS = [
    {
        id: 'silver',
        name: 'Silver',
        price: 0,
        description: 'For Citizens & Beginners',
        features: ['Basic Legal Chat', 'search-laws', '10 Daily Queries'],
        limits: { dailyQueries: 10, models: ['gemini-1.5-flash'] }
    },
    {
        id: 'gold',
        name: 'Gold',
        price: 499,
        description: 'For Students & Learners',
        features: ['Unlimited Chat', 'Case Summaries', 'Drafting (Basic)', 'Citations'],
        limits: { dailyQueries: 100, models: ['gemini-1.5-flash', 'gemini-1.5-pro'] }
    },
    {
        id: 'diamond',
        name: 'Diamond',
        price: 999,
        description: 'For Legal Professionals',
        features: ['All AI Models', 'Advanced Drafting', 'Case Analysis', 'Priority Support', 'API Access'],
        limits: { dailyQueries: Infinity, models: ['gemini-1.5-flash', 'gemini-1.5-pro', 'gemini-ultra'] }
    },
    {
        id: 'premium',
        name: 'Premium',
        price: 1999,
        description: 'Enterprise / Full Suite',
        features: ['Everything in Diamond', 'Dedicated Account Manager', 'Custom Models'],
        limits: { dailyQueries: Infinity, models: ['gemini-1.5-flash', 'gemini-1.5-pro', 'gemini-ultra'] }
    }
];

// Helper to get plans (cached or fresh)
const getCurrentPlans = async () => {
    try {
        const { default: SystemSetting } = await import('../models/SystemSetting.js');
        const setting = await SystemSetting.findOne({ key: 'subscription_plans' });

        if (setting && setting.value && Array.isArray(setting.value) && setting.value.length > 0) {
            return setting.value;
        }
    } catch (e) {
        console.warn("Failed to fetch plan config, using defaults:", e);
    }
    return DEFAULT_PLANS;
};

// 1. Create Subscription Order
export const createSubscriptionOrder = async (req, res) => {
    try {
        let { plan } = req.body;
        if (!plan) return res.status(400).json({ error: "Plan ID required" });

        plan = plan.toLowerCase(); // normalize

        const plans = await getCurrentPlans();
        const selectedPlan = plans.find(p => p.id === plan);

        console.log(`[Subscription] Creating order for plan: ${plan}`);

        if (!selectedPlan) {
            console.error(`[Subscription] Invalid plan requested: ${plan}`);
            return res.status(400).json({ error: `Invalid plan selected.` });
        }

        const amount = selectedPlan.price;

        if (amount === 0) {
            return res.status(400).json({ error: "Free plans do not require payment." });
        }

        const options = {
            amount: amount * 100, // Amount in paise
            currency: "INR",
            receipt: `sub_${Date.now()}_${Math.random().toString(36).substring(7)}`
        };

        try {
            const order = await razorpay.orders.create(options);
            console.log(`[Subscription] Order created: ${order.id}`);
            res.json({ ...order, plan });
        } catch (razorpayError) {
            console.error("[Subscription] Razorpay API Error:", razorpayError);

            // Allow Test/Dev fallback
            if (process.env.NODE_ENV !== 'production') {
                console.warn("[Subscription] Returning MOCK order due to API failure (Dev Mode).");
                return res.json({
                    id: `order_mock_${Date.now()}`,
                    entity: "order",
                    amount: options.amount,
                    currency: "INR",
                    receipt: options.receipt,
                    status: "created",
                    plan // Pass back plan for verification logic
                });
            }

            return res.status(502).json({
                error: "Payment Gateway Error",
                details: razorpayError.error ? razorpayError.error.description : razorpayError.message
            });
        }

    } catch (error) {
        console.error("Server Error in createSubscriptionOrder:", error);
        res.status(500).json({ error: "Internal Server Error during subscription creation" });
    }
};

// 2. Verify Subscription Payment
export const verifySubscription = async (req, res) => {
    try {
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature, plan } = req.body;
        const userId = req.user ? req.user._id : req.body.userId;

        if (!userId) return res.status(401).json({ error: "User not identified" });

        console.log(`[Verification] Verifying order: ${razorpay_order_id} for user: ${userId}`);

        let isValid = false;

        // Mock Verification
        if (razorpay_order_id && razorpay_order_id.startsWith('order_mock_')) {
            console.log("[Verification] Mock Order detected. Bypassing signature check.");
            isValid = true;
        } else {
            // Standard Signature Verification
            const body = razorpay_order_id + "|" + razorpay_payment_id;
            const expectedSignature = crypto
                .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
                .update(body.toString())
                .digest('hex');

            isValid = (expectedSignature === razorpay_signature);
        }

        if (isValid) {
            // Update User Subscription
            const { ObjectId } = await import('mongodb');
            await UserModel.collection().updateOne(
                { _id: new ObjectId(userId) },
                {
                    $set: {
                        subscriptionPlan: plan,
                        subscriptionDate: new Date(),
                        isActive: true
                    }
                }
            );

            // LOG TRANSACTION
            const plans = await getCurrentPlans();
            const selectedPlan = plans.find(p => p.id === plan);
            const amountPaid = selectedPlan ? selectedPlan.price : 0;

            if (amountPaid > 0) {
                await TransactionModel.create({
                    userId: userId,
                    amount: amountPaid,
                    type: 'DEBIT', // Money spent
                    category: 'SUBSCRIPTION',
                    description: `Subscription Upgrade to ${plan.toUpperCase()}`,
                    metadata: {
                        orderId: razorpay_order_id,
                        plan: plan
                    }
                });
            }

            console.log(`[Verification] Success. User ${userId} upgraded to ${plan}`);
            return res.json({
                status: "success",
                message: `Successfully subscribed to ${plan} plan`
            });
        } else {
            console.error(`[Verification] Signature Mismatch`);
            return res.status(400).json({ error: "Invalid payment signature" });
        }
    } catch (error) {
        console.error("Subscription Verification Error:", error);
        res.status(500).json({ error: "Subscription verification failed" });
    }
};

// 3. Get Subscription Status
export const getSubscriptionStatus = async (req, res) => {
    try {
        const userId = req.params.id;
        const { ObjectId } = await import('mongodb');
        const user = await UserModel.collection().findOne({ _id: new ObjectId(userId) });

        if (!user) return res.status(404).json({ error: "User not found" });

        // Default to 'silver' (free) if not set
        const plan = user.subscriptionPlan || 'silver';

        // Normalize legacy 'free' or 'citizen' to 'silver' if using new system
        // But let's just return what's in DB mainly.
        let planId = plan;
        if (plan === 'free' || plan === 'citizen') planId = 'silver';

        res.json({ planId });
    } catch (error) {
        console.error("Get Status Error:", error);
        res.status(500).json({ error: "Failed to fetch status" });
    }
};

// 4. Direct Upgrade (Debug/Simple Flow)
export const upgradeSubscription = async (req, res) => {
    try {
        const { userId, planId } = req.body;
        const { ObjectId } = await import('mongodb');
        await UserModel.collection().updateOne(
            { _id: new ObjectId(userId) },
            { $set: { subscriptionPlan: planId, subscriptionDate: new Date() } }
        );

        res.json({ status: 'success', planId });
    } catch (error) {
        console.error("Upgrade Error:", error);
        res.status(500).json({ error: "Failed to upgrade" });
    }
};

// 5. Get Subscription Plans (Dynamic)
export const getPlans = async (req, res) => {
    try {
        const plans = await getCurrentPlans();
        // Return full objects now, sorted by price
        plans.sort((a, b) => a.price - b.price);
        res.json(plans);
    } catch (e) {
        res.status(500).json({ error: "Failed to load plans" });
    }
};
