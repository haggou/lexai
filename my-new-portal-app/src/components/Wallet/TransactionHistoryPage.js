
import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { FaArrowLeft, FaArrowDown, FaArrowUp, FaCoins } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import './TransactionHistoryPage.css';

const API_BASE = 'http://localhost:3000/api/wallet';

const TransactionHistoryPage = () => {
    const navigate = useNavigate();

    // State
    const [transactions, setTransactions] = useState([]);
    const [stats, setStats] = useState({ totalCredit: 0, totalDebit: 0, count: 0 });
    const [filter, setFilter] = useState('ALL'); // ALL, INCOME, EXPENSE
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [minAmount, setMinAmount] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchData = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            let token = localStorage.getItem('lexai_token');
            if (!token) { navigate('/auth'); return; }

            let headers = { 'Authorization': `Bearer ${token}` };

            // 1. Fetch Stats (Auth Check)
            let statsRes = await fetch(`${API_BASE}/stats`, { headers });

            // Auto-Recover Session if Stale (Demo User Fix)
            if ((statsRes.status === 401 || statsRes.status === 404) && localStorage.getItem('lexai_username')) {
                const username = localStorage.getItem('lexai_username');
                const pwd = 'securepassword123';
                const authUrl = 'http://localhost:3000/api/auth';

                console.warn("Session stale in TxHistory, attempting recovery...");
                let authRes = await fetch(`${authUrl}/login`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username, password: pwd })
                });

                if (!authRes.ok && authRes.status !== 500) {
                    // Try Register
                    await fetch(`${authUrl}/register`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            username,
                            email: `${username.toLowerCase()}@lexai.demo`,
                            password: pwd,
                            profession: 'lawyer',
                            mobile: '9999999999',
                            whatsapp: '9999999999',
                            termsAgreed: 'true'
                        })
                    });
                    // Retry Login
                    authRes = await fetch(`${authUrl}/login`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ username, password: pwd })
                    });
                }

                if (authRes.ok) {
                    const authData = await authRes.json();
                    localStorage.setItem('lexai_token', authData.token);
                    localStorage.setItem('lexai_userid', authData.userId);
                    token = authData.token;
                    headers = { 'Authorization': `Bearer ${token}` };
                    // Retry Stats
                    statsRes = await fetch(`${API_BASE}/stats`, { headers });
                }
            }

            if (statsRes.ok) {
                setStats(await statsRes.json());
            } else {
                console.warn("Failed to fetch wallet stats");
            }

            // Fetch All Records
            const txRes = await fetch(`${API_BASE}/transactions?limit=all`, { headers });
            if (txRes.ok) {
                const txData = await txRes.json();
                setTransactions(Array.isArray(txData) ? txData : []);
            } else {
                setTransactions([]); // Safe fallback
            }

        } catch (e) {
            console.error("Failed to load history", e);
            setError("Could not connect to wallet server. Please ensure backend is running.");
            setTransactions([]);
        } finally {
            setLoading(false);
        }
    }, [navigate]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // Filter Logic
    const filteredTx = transactions.filter(tx => {
        // Category Filter
        if (filter === 'INCOME' && tx.type !== 'CREDIT') return false;
        if (filter === 'EXPENSE' && tx.type !== 'DEBIT') return false;

        // Amount Filter
        if (minAmount && tx.amount < parseFloat(minAmount)) return false;

        // Date Range Filter
        if (startDate || endDate) {
            const txDate = new Date(tx.timestamp);
            txDate.setHours(0, 0, 0, 0); // Normalize time

            if (startDate) {
                const start = new Date(startDate);
                if (txDate < start) return false;
            }
            if (endDate) {
                const end = new Date(endDate);
                if (txDate > end) return false;
            }
        }

        return true;
    });

    const categories = [
        { id: 'ALL', label: 'All' },
        { id: 'INCOME', label: 'Income' },
        { id: 'EXPENSE', label: 'Expense' }
    ];

    return (
        <div className="tx-history-page">
            <div className="tx-header">
                <button className="back-btn" onClick={() => navigate('/wallet')}><FaArrowLeft /></button>
                <h2>Transaction Passbook</h2>
                <div style={{ flex: 1 }}></div>
                <div className="date-filter">
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
                        <input
                            type="date"
                            value={startDate}
                            onChange={e => setStartDate(e.target.value)}
                            className="filter-date-input"
                            placeholder="Start Date"
                        />
                        <span style={{ color: '#64748b' }}>-</span>
                        <input
                            type="date"
                            value={endDate}
                            onChange={e => setEndDate(e.target.value)}
                            className="filter-date-input"
                            placeholder="End Date"
                        />
                    </div>
                </div>
            </div>

            <div className="tx-container">
                {/* Stats Cards */}
                <div className="stats-grid">
                    <motion.div className="stat-card income" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                        <div className="stat-icon"><FaArrowDown /></div>
                        <div>
                            <div className="stat-label">Total Received</div>
                            <div className="stat-val">₹{Number(stats.totalCredit || 0).toFixed(2)}</div>
                        </div>
                    </motion.div>
                    <motion.div className="stat-card expense" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                        <div className="stat-icon"><FaArrowUp /></div>
                        <div>
                            <div className="stat-label">Total Spent</div>
                            <div className="stat-val">₹{Number(stats.totalDebit || 0).toFixed(2)}</div>
                        </div>
                    </motion.div>
                    <motion.div className="stat-card net" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                        <div className="stat-icon"><FaCoins /></div>
                        <div>
                            <div className="stat-label">Net Balance</div>
                            <div className="stat-val">₹{(Number(stats.totalCredit || 0) - Number(stats.totalDebit || 0)).toFixed(2)}</div>
                        </div>
                    </motion.div>
                </div>

                {/* Filters */}
                <div className="filter-bar">
                    <div className="cat-filters">
                        {categories.map(cat => (
                            <button
                                key={cat.id}
                                className={`filter-btn ${filter === cat.id ? 'active' : ''}`}
                                onClick={() => setFilter(cat.id)}
                            >
                                {cat.label}
                            </button>
                        ))}
                    </div>
                    <div className="amount-filter">
                        <input
                            type="number"
                            placeholder="Min Amount (₹)"
                            value={minAmount}
                            onChange={e => setMinAmount(e.target.value)}
                            className="min-amount-input"
                        />
                    </div>
                </div>

                {/* Error Message */}
                {error && (
                    <div className="bg-red-900/50 border border-red-500 text-red-200 p-4 rounded-xl text-center mb-4">
                        {error}
                        <button
                            onClick={fetchData}
                            className="block mx-auto mt-2 text-xs bg-red-600 hover:bg-red-500 text-white px-3 py-1 rounded"
                        >
                            Retry
                        </button>
                    </div>
                )}

                {/* List */}
                <div className="tx-full-list">
                    {loading ? (
                        <div className="loading-state">Loading history...</div>
                    ) : filteredTx.length === 0 && !error ? (
                        <div className="empty-state">No transactions found.</div>
                    ) : (
                        filteredTx.map(tx => (
                            <motion.div
                                key={tx._id}
                                className="tx-row"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                            >
                                <div className="tx-row-left">
                                    <div className={`tx-type-dot ${tx.type === 'CREDIT' ? 'green' : 'red'}`} />
                                    <div className="tx-details">
                                        <div className="tx-desc-main">{tx.description || tx.category}</div>
                                        <div className="tx-meta">
                                            {new Date(tx.timestamp).toLocaleString()} • {tx.category}
                                        </div>
                                    </div>
                                </div>
                                <div className={`tx-row-right ${tx.type === 'CREDIT' ? 'credit' : 'debit'}`}>
                                    {tx.type === 'CREDIT' ? '+' : '-'} ₹{Number(tx.amount || 0).toFixed(4)}
                                </div>
                            </motion.div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

export default TransactionHistoryPage;
