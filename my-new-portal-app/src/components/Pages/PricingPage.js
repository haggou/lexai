import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FaCheckCircle, FaSpinner } from 'react-icons/fa';
import styles from './PricingPage.module.css';
import { useSubscription } from '../../contexts/SubscriptionContext';
import { useNavigate } from 'react-router-dom';

const PricingPage = () => {
    const { PLANS, upgradePlan, currentPlan } = useSubscription();
    const [processing, setProcessing] = useState(null);
    const navigate = useNavigate();
    const userId = localStorage.getItem('lexai_userid');

    const handleSelectPlan = async (planId) => {
        const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000/api';

        if (!userId) {
            navigate('/auth');
            return;
        }
        if (currentPlan.id === planId) return;

        setProcessing(planId);

        // Check for Free Plan
        const selectedPlan = PLANS[Object.keys(PLANS).find(k => PLANS[k].id === planId)];
        if (selectedPlan.price === 0) {
            try {
                await upgradePlan(planId);
                alert(`Welcome to the ${selectedPlan.name} Plan!`);
            } catch (e) {
                alert("Failed to join plan. Please try again.");
            } finally {
                setProcessing(null);
            }
            return;
        }

        try {
            // 1. Create Order on Backend
            const token = localStorage.getItem('lexai_token');
            const orderRes = await fetch(`${API_URL}/subscription/create-order`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ plan: planId })
            });

            if (!orderRes.ok) {
                const errData = await orderRes.json();
                throw new Error(errData.error || "Order creation failed");
            }

            const orderData = await orderRes.json();
            const { id: orderId, amount: orderAmount, currency } = orderData; // amount is in paise

            // 2. Initiate Payment
            const { initiatePayment } = await import('../../utils/payment');

            initiatePayment({
                amount: orderAmount, // Pass paise directly
                currency: currency,
                name: "LexAI Subscription",
                description: `Upgrade to ${selectedPlan.name} Plan`,
                orderId: orderId,
                prefill: {
                    name: "LexAI User",
                    email: "user@lexai.com"
                },
                onSuccess: async (response) => {
                    try {
                        // 3. Verify Payment
                        const verifyRes = await fetch(`${API_URL}/subscription/verify`, {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                                'Authorization': `Bearer ${token}`
                            },
                            body: JSON.stringify({
                                razorpay_payment_id: response.razorpay_payment_id,
                                razorpay_order_id: response.razorpay_order_id,
                                razorpay_signature: response.razorpay_signature,
                                userId,
                                plan: planId // Correct field name: 'plan'
                            })
                        });

                        const verifyData = await verifyRes.json();

                        if (verifyRes.ok) {
                            await upgradePlan(planId);
                            // Refresh Token/Profile to reflect new status
                            alert(`Payment Successful! Upgraded to ${selectedPlan.name}`);
                            // Optional: Trigger profile reload
                        } else {
                            throw new Error(verifyData.error || "Verification failed");
                        }
                    } catch (err) {
                        console.error("Verification failed", err);
                        alert(`Payment Verified. Please refresh to see changes. Error: ${err.message}`);
                    }
                },
                onFailure: (err) => {
                    console.error("Payment Failed", err);
                    alert("Payment Process Failed or Cancelled");
                }
            });

        } catch (e) {
            console.error("Payment initialization failed", e);
            alert(`Subscription Error: ${e.message}`);
        } finally {
            // Keep specific spinner a bit longer or clear it
            setTimeout(() => setProcessing(null), 1000);
        }
    };

    const planList = Object.values(PLANS);

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <motion.h1
                    className={styles.title}
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    Plans by Category
                </motion.h1>
                <p className={styles.subtitle}>
                    Tailored solutions for Citizens, Students, and Legal Professionals.
                </p>
            </div>

            <div className={styles.grid}>
                {planList.map((plan, index) => {
                    const isCurrent = currentPlan.id === plan.id;
                    const isRecommended = plan.id === 'diamond';

                    return (
                        <motion.div
                            key={plan.id}
                            className={`${styles.card} ${isRecommended ? styles.popularCard : ''}`}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                        >
                            {isRecommended && <span className={styles.popularTag}>RECOMMENDED</span>}
                            {isCurrent && <span className={styles.currentTag} style={{ color: '#10b981', fontWeight: 'bold', fontSize: '0.8rem', marginBottom: '5px' }}>CURRENT PLAN</span>}

                            <h3 className={styles.planName}>{plan.name}</h3>
                            <div className={styles.price}>
                                {plan.price === 0 ? "Free" : `₹${plan.price}`}
                                {plan.price > 0 && <span style={{ fontSize: '1rem', color: '#6b7280', fontWeight: 'normal' }}>/mo</span>}
                            </div>

                            <ul className={styles.features}>
                                {plan.features.map((feature, i) => (
                                    <li key={i} className={styles.featureItem}>
                                        <FaCheckCircle className={styles.checkIcon} />
                                        {feature}
                                    </li>
                                ))}
                            </ul>

                            <button
                                className={`${styles.button} ${isRecommended ? styles.primaryBtn : styles.secondaryBtn}`}
                                onClick={() => handleSelectPlan(plan.id)}
                                disabled={isCurrent || processing === plan.id}
                                style={isCurrent ? { opacity: 0.6, cursor: 'default' } : {}}
                            >
                                {processing === plan.id ? (
                                    <FaSpinner className="animate-spin" />
                                ) : (
                                    isCurrent ? "Active Plan" : (plan.price === 0 ? "Get Started" : "Subscribe Now")
                                )}
                            </button>
                        </motion.div>
                    );
                })}
            </div>
        </div>
    );
};

export default PricingPage;


