import React, { createContext, useContext, useState, useEffect } from 'react';

const API_BASE = `${process.env.REACT_APP_API_URL || 'http://localhost:3000/api'}/subscription`;

const SubscriptionContext = createContext();

export const useSubscription = () => useContext(SubscriptionContext);

// Fallback Defaults (in case backend fetch fails)
// Matches the structure you want: Premium, Silver, Gold, Diamond
const DEFAULT_PLANS = {
    silver: {
        id: 'silver',
        name: 'Silver',
        price: 0,
        features: ['Basic Legal Chat', 'search-laws', '10 Daily Queries'],
        limits: { dailyQueries: 10, models: ['gemini-1.5-flash'] }
    },
    gold: {
        id: 'gold',
        name: 'Gold',
        price: 499,
        features: ['Unlimited Chat', 'Case Summaries', 'Drafting (Basic)', 'Citations'],
        limits: { dailyQueries: 100, models: ['gemini-1.5-flash', 'gemini-1.5-pro'] }
    },
    diamond: {
        id: 'diamond',
        name: 'Diamond',
        price: 999,
        features: ['All AI Models', 'Advanced Drafting', 'Case Analysis', 'Priority Support', 'API Access'],
        limits: { dailyQueries: Infinity, models: ['gemini-1.5-flash', 'gemini-1.5-pro', 'gemini-ultra'] }
    },
    premium: {
        id: 'premium',
        name: 'Premium',
        price: 1999,
        features: ['Everything in Diamond', 'Dedicated Account Manager', 'Custom Models'],
        limits: { dailyQueries: Infinity, models: ['gemini-1.5-flash', 'gemini-1.5-pro', 'gemini-ultra'] }
    }
};

export const SubscriptionProvider = ({ children }) => {
    // PLANS is now stateful. Initialized with defaults but updated via API
    const [PLANS, setPLANS] = useState(DEFAULT_PLANS);
    const [currentPlan, setCurrentPlan] = useState(DEFAULT_PLANS.silver);
    const [loading, setLoading] = useState(true);
    const [planIdFromDb, setPlanIdFromDb] = useState(null); // Store raw plan ID (e.g. 'gold')

    useEffect(() => {
        const init = async () => {
            await fetchPlans();
            await fetchSubscription();
            setLoading(false);
        };
        init();
    }, []);

    const fetchPlans = async () => {
        try {
            const res = await fetch(API_BASE); // GET /subscription (returns array)
            if (res.ok) {
                const plansArray = await res.json();
                // Convert Array back to Object Map for easy lookup by existing code
                // Array: [{id: 'silver', ...}, {id: 'gold', ...}]
                if (Array.isArray(plansArray) && plansArray.length > 0) {
                    const plansMap = {};
                    plansArray.forEach(p => {
                        plansMap[p.id] = p;
                    });
                    setPLANS(plansMap);
                }
            }
        } catch (e) {
            console.warn("Failed to fetch dynamic plans, using defaults.", e);
        }
    };

    const fetchSubscription = async () => {
        const userId = localStorage.getItem('lexai_userid');
        if (!userId) return;

        try {
            const token = localStorage.getItem('lexai_token');
            const res = await fetch(`${API_BASE}/status/${userId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                // data.planId e.g. 'gold' or 'student' (legacy)
                setPlanIdFromDb(data.planId);
            }
        } catch (e) {
            console.error("Failed to fetch subscription", e);
        }
    };

    // Re-calculate currentPlan whenever PLANS or planIdFromDb changes
    useEffect(() => {
        if (!planIdFromDb) {
            // Default if no subscription found
            setCurrentPlan(Object.values(PLANS).find(p => p.price === 0) || Object.values(PLANS)[0]);
            return;
        }

        let plan = PLANS[planIdFromDb];
        if (!plan) {
            // If plan ID mismatch (e.g. user has legacy 'student' but we removed it)
            // Map legacy IDs to new ones if possible, or fallback
            if (planIdFromDb === 'student') plan = PLANS['gold'];
            else if (planIdFromDb === 'professional') plan = PLANS['diamond'];
            else if (planIdFromDb === 'citizen') plan = PLANS['silver'];
            else plan = Object.values(PLANS).find(p => p.price === 0) || Object.values(PLANS)[0]; // Fallback to free/first
        }

        if (plan) setCurrentPlan(plan);

    }, [PLANS, planIdFromDb]);

    const upgradePlan = async (planId) => {
        const userId = localStorage.getItem('lexai_userid');
        if (!userId) throw new Error("User not logged in");

        return new Promise(async (resolve, reject) => {
            try {
                const token = localStorage.getItem('lexai_token');

                // 1. Create Order
                const orderRes = await fetch(`${API_BASE}/create-order`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({ plan: planId, userId })
                });

                if (!orderRes.ok) {
                    const errorData = await orderRes.json();
                    throw new Error(errorData.error || "Order creation failed");
                }

                const orderData = await orderRes.json();

                // 2. Initialize Razorpay
                const options = {
                    key: process.env.REACT_APP_RAZORPAY_KEY_ID || "rzp_test_RthJI5c5lB2gfy",
                    amount: orderData.amount,
                    currency: orderData.currency,
                    name: "LexAI Subscription",
                    description: `Upgrade to ${orderData.plan}`,
                    order_id: orderData.id,
                    handler: async function (response) {
                        try {
                            // 3. Verify Payment
                            const verifyRes = await fetch(`${API_BASE}/verify`, {
                                method: 'POST',
                                headers: {
                                    'Content-Type': 'application/json',
                                    'Authorization': `Bearer ${token}`
                                },
                                body: JSON.stringify({
                                    razorpay_order_id: response.razorpay_order_id,
                                    razorpay_payment_id: response.razorpay_payment_id,
                                    razorpay_signature: response.razorpay_signature,
                                    plan: planId,
                                    userId
                                })
                            });

                            if (verifyRes.ok) {
                                setPlanIdFromDb(planId);
                                resolve(true);
                            } else {
                                reject("Payment Verification Failed");
                            }
                        } catch (e) {
                            reject(e);
                        }
                    },
                    prefill: {
                        name: localStorage.getItem('lexai_username') || "User",
                        contact: localStorage.getItem('lexai_mobile') || ""
                    },
                    theme: { color: "#10a37f" }
                };

                const rzp1 = new window.Razorpay(options);
                rzp1.on('payment.failed', function (response) {
                    reject(response.error.description);
                });
                rzp1.open();

            } catch (e) {
                console.error("Upgrade flow failed", e);
                reject(e);
            }
        });
    };

    const checkPermission = (feature) => {
        if (!currentPlan) return false;

        // Legacy Checks for stability
        if (feature === 'drafting' && (currentPlan.id === 'gold' || currentPlan.id === 'diamond' || currentPlan.id === 'premium' || currentPlan.id === 'student')) return true;
        if (feature === 'advanced-models' && (currentPlan.id === 'diamond' || currentPlan.id === 'premium' || currentPlan.id === 'professional')) return true;

        if (currentPlan.features && Array.isArray(currentPlan.features)) {
            // Case insensitive check just in case
            return currentPlan.features.some(f => f.toLowerCase() === feature.toLowerCase()) || currentPlan.features.includes(feature);
        }
        return false;
    };

    const getModelAccess = () => {
        return currentPlan.limits?.models;
    };

    return (
        <SubscriptionContext.Provider value={{
            currentPlan,
            loading,
            PLANS,
            upgradePlan,
            checkPermission,
            getModelAccess
        }}>
            {children}
        </SubscriptionContext.Provider>
    );
};
