import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { FaWallet, FaHistory, FaBolt, FaArrowLeft } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import './WalletPage.css';

const API_BASE = 'http://localhost:3000/api/wallet';

const WalletPage = () => {
    const navigate = useNavigate();
    const [balance, setBalance] = useState(0);
    const [transactions, setTransactions] = useState([]);
    const [amount, setAmount] = useState('');
    const [loading, setLoading] = useState(false);
    const userId = localStorage.getItem('lexai_userid');

    const fetchBalance = useCallback(async () => {
        try {
            let token = localStorage.getItem('lexai_token');

            // 1. Balance
            let res = await fetch(`${API_BASE}/balance`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            // Handle Session Expiry
            if (res.status === 401) {
                console.warn("Session expired. Redirecting to login.");
                localStorage.removeItem('lexai_token');
                localStorage.removeItem('lexai_userid');
                navigate('/auth');
                return;
            }

            if (res.ok) {
                const data = await res.json();
                console.log("[WalletPage] Balance Fetch Success:", data);
                setBalance(data.balance || 0);
            }

            // 2. Transactions
            const txRes = await fetch(`${API_BASE}/transactions?limit=10`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (txRes.ok) {
                const txData = await txRes.json();
                setTransactions(Array.isArray(txData) ? txData : []);
            }
        } catch (e) {
            console.error("Failed to fetch wallet data", e);
        }
    }, []);

    useEffect(() => {
        if (!userId) {
            navigate('/auth');
            return;
        }
        fetchBalance();
    }, [userId, navigate, fetchBalance]);

    const handleAddFunds = async (e) => {
        e.preventDefault();
        if (!amount || isNaN(amount) || amount <= 0) return alert("Invalid Amount");

        setLoading(true);
        try {
            // 1. Create Order via Backend
            const orderRes = await fetch(`${API_BASE}/create-order`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('lexai_token')}`
                },
                body: JSON.stringify({ amount: parseInt(amount) })
            });

            if (orderRes.status === 401) {
                alert("Session expired. Please login again.");
                localStorage.removeItem('lexai_token');
                localStorage.removeItem('lexai_userid');
                navigate('/auth');
                return;
            }

            if (!orderRes.ok) throw new Error("Failed to create payment order");
            const orderData = await orderRes.json();

            // 2. Initiate Razorpay with Order ID
            await import('../../utils/payment').then(mod => {
                mod.initiatePayment({
                    amount: amount,
                    orderId: orderData.id, // Pass Order ID
                    name: "LexAI Wallet",
                    description: "Add Funds to Wallet",
                    prefill: {
                        name: localStorage.getItem('lexai_username') || "LexAI User",
                        email: "user@lexai.com"
                    },
                    onSuccess: async (response) => {
                        // Implement Verification Here
                        console.log("Payment Success:", response);

                        try {
                            const token = localStorage.getItem('lexai_token');
                            const verifyRes = await fetch(`${API_BASE}/verify-payment`, {
                                method: 'POST',
                                headers: {
                                    'Content-Type': 'application/json',
                                    'Authorization': `Bearer ${token}`
                                },
                                body: JSON.stringify({
                                    userId,
                                    amount: parseInt(amount),
                                    razorpay_payment_id: response.razorpay_payment_id,
                                    razorpay_order_id: response.razorpay_order_id,
                                    razorpay_signature: response.razorpay_signature
                                })
                            });

                            if (verifyRes.ok) {
                                alert("Payment Successful! Wallet Recharged.");
                                fetchBalance();
                                setAmount('');
                            } else {
                                const errorData = await verifyRes.json();
                                alert(`Payment verification failed: ${errorData.error}`);
                            }
                        } catch (err) {
                            console.error(err);
                            alert("Payment verification error");
                        }
                    },
                    onFailure: (err) => {
                        alert("Payment Failed or Cancelled");
                    }
                });
            });

        } catch (err) {
            console.error(err);
            alert("Something went wrong");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="wallet-page">
            <div className="wallet-header">
                <button className="back-btn" onClick={() => navigate('/')}><FaArrowLeft /></button>
                <h2>LexAI Wallet</h2>
            </div>

            <div className="wallet-content">
                <motion.div
                    className="balance-card"
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                >
                    <div className="balance-label">Current Balance</div>
                    <div className="balance-amount">₹ {Number(balance || 0).toFixed(2)}</div>
                    <div className="balance-sub">Available for AI Tokens & Drafts</div>
                </motion.div>

                <motion.div
                    className="add-funds-card"
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.1 }}
                >
                    <h3><FaBolt /> Add Funds</h3>
                    <div className="quick-amounts">
                        {[100, 500, 1000].map(val => (
                            <button key={val} onClick={() => setAmount(val)}>+ ₹{val}</button>
                        ))}
                    </div>

                    <form onSubmit={handleAddFunds} className="fund-form">
                        <div className="input-with-icon">
                            <span>₹</span>
                            <input
                                type="number"
                                placeholder="Enter Amount"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                            />
                        </div>
                        <button type="submit" className="recharge-btn" disabled={loading}>
                            {loading ? 'Processing...' : 'Proceed to Pay'} <FaWallet />
                        </button>
                    </form>
                </motion.div>

                {/* Placeholder for Transaction History */}
                {/* Transaction History */}
                <div className="history-section">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                        <h3><FaHistory /> Recent Transactions</h3>
                        <button className="view-all-btn" onClick={() => navigate('/wallet/history')}>
                            View Passbook & Stats →
                        </button>
                    </div>
                    {transactions.length === 0 ? (
                        <div className="empty-history">
                            No recent transactions found.
                        </div>
                    ) : (
                        <div className="tx-list">
                            {transactions.map(tx => (
                                <div key={tx._id} className="tx-item">
                                    <div className="tx-left">
                                        <div className={`tx-icon ${tx.type === 'CREDIT' ? 'in' : 'out'}`}>
                                            {tx.type === 'CREDIT' ? '+' : '-'}
                                        </div>
                                        <div className="tx-info">
                                            <div className="tx-desc">{tx.description}</div>
                                            <div className="tx-date">{new Date(tx.timestamp).toLocaleDateString()}</div>
                                        </div>
                                    </div>
                                    <div className={`tx-amount ${tx.type === 'CREDIT' ? 'credit' : 'debit'}`}>
                                        {tx.type === 'CREDIT' ? '+' : '-'} ₹{Number(tx.amount || 0).toFixed(2)}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default WalletPage;
