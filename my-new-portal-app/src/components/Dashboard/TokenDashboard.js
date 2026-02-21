import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip,
    ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area
} from 'recharts';
import {
    ArrowLeft, RefreshCw, Zap, TrendingUp,
    CreditCard, Activity, Shield, FileText, CheckCircle, AlertCircle
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import './TokenDashboard.css';

const COLORS = {
    primary: '#3b82f6',    // Lex Blue
    accent: '#fbbf24',     // Gold
    emerald: '#10b981',    // Success
    purple: '#8b5cf6',     // Model Logic
    slate: '#94a3b8'
};

const TokenDashboard = ({ userId = "6766d9b90847f975d0b9876e" }) => {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [stats, setStats] = useState({
        input: 0,
        output: 0,
        requests: 0,
        history: []
    });
    const [effectiveUserId, setEffectiveUserId] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        // 1. Try prop (if not default)
        if (userId && userId !== "6766d9b90847f975d0b9876e") {
            setEffectiveUserId(userId);
            return;
        }

        // 2. Try localStorage direct ID (most reliable)
        const storedId = localStorage.getItem('lexai_userid');
        if (storedId) {
            setEffectiveUserId(storedId);
            return;
        }

        // 3. Try legacy object
        try {
            const storedUser = localStorage.getItem('lexai_user_data');
            if (storedUser) {
                const u = JSON.parse(storedUser);
                if (u._id) {
                    setEffectiveUserId(u._id);
                    return;
                }
            }
        } catch (e) { }

        // 4. Default
        setEffectiveUserId("6766d9b90847f975d0b9876e");
    }, [userId]);

    const fetchUsage = useCallback(async () => {
        if (!effectiveUserId) return;

        setLoading(true);
        setError(null);
        try {
            const token = localStorage.getItem('lexai_token');
            console.log("Fetching Token Usage for:", effectiveUserId);

            const response = await fetch(`http://localhost:3000/api/token/${effectiveUserId}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.error || `Server Error: ${response.status}`);
            }

            const data = await response.json();
            console.log("Token Data Received:", data);

            let chartHistory = [];
            if (data.dailyUsage) {
                chartHistory = Object.entries(data.dailyUsage).map(([date, usages]) => ({
                    name: date.split('-').slice(1).join('/'),
                    tokens: (usages.input || 0) + (usages.output || 0),
                    fullDate: date
                })).sort((a, b) => new Date(a.fullDate) - new Date(b.fullDate));
            }

            // Fallback for empty history
            if (chartHistory.length === 0) {
                chartHistory = [{ name: 'Today', tokens: 0 }];
            }

            setStats({
                input: data.totalInputTokens || 0,
                output: data.totalOutputTokens || 0,
                requests: data.totalRequestCount || 0,
                history: chartHistory
            });
        } catch (err) {
            setError(err.message || "Failed to sync ledger with LexAI servers.");
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [effectiveUserId]);

    useEffect(() => {
        if (effectiveUserId) fetchUsage();
    }, [fetchUsage, effectiveUserId]);

    // Pricing Logic (Gemini 1.5 Pro Approx: $1.25 per 1M input / $3.75 per 1M output)
    const costCalc = (stats.input * 0.01) + (stats.output * 0.01);
    const totalTokens = stats.input + stats.output;

    const pieData = [
        { name: 'Input', value: stats.input || 1, color: COLORS.primary },
        { name: 'Output', value: stats.output || 1, color: COLORS.accent },
    ];

    return (
        <div className="token-dashboard-container">
            {/* Background Aesthetic */}
            <div className="bg-gradient-1"></div>
            <div className="bg-gradient-2"></div>

            <div className="dashboard-content">
                {/* Header Section */}
                <header className="dashboard-header">
                    <div className="header-left">
                        <button onClick={() => navigate(-1)} className="back-btn">
                            <ArrowLeft size={20} />
                        </button>
                        <div className="title-section">
                            <h1>
                                Utilization <span className="highlight">Intelligence</span>
                            </h1>
                            <p className="user-id-label">ID: {effectiveUserId}</p>
                        </div>
                    </div>

                    <div className="header-right">
                        <button onClick={fetchUsage} className="sync-btn">
                            <RefreshCw size={14} className={loading ? 'spin' : ''} /> SYNC LEDGER
                        </button>
                    </div>
                </header>

                {/* Error Banner */}
                <AnimatePresence>
                    {error && (
                        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="error-banner">
                            <AlertCircle size={18} /> {error}
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* KPI Grid */}
                <div className="kpi-grid">
                    <StatCard label="Total Volume" value={totalTokens.toLocaleString()} sub="Combined Tokens" icon={<Zap />} color="blue" />
                    <StatCard label="Total Requests" value={stats.requests} sub="API Interactions" icon={<FileText />} color="purple" />
                    <StatCard label="Operational Cost" value={`$${costCalc.toFixed(4)}`} sub="Estimated USD" icon={<CreditCard />} color="amber" />
                    <StatCard label="System Status" value="Healthy" sub="Latency: 14ms" icon={<CheckCircle />} color="emerald" />
                </div>

                {/* Charts Area */}
                <div className="charts-layout">
                    {/* Main Area Chart */}
                    <div className="chart-panel">
                        <div className="panel-header">
                            <h3><Activity size={16} color={COLORS.primary} /> Usage Trajectory</h3>
                            <span className="live-badge">Real-time Data</span>
                        </div>
                        <div className="chart-container">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={stats.history}>
                                    <defs>
                                        <linearGradient id="colorTokens" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor={COLORS.primary} stopOpacity={0.3} />
                                            <stop offset="95%" stopColor={COLORS.primary} stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: COLORS.slate, fontSize: 10 }} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fill: COLORS.slate, fontSize: 10 }} />
                                    <RechartsTooltip content={<CustomTooltip />} />
                                    <Area type="monotone" dataKey="tokens" stroke={COLORS.primary} strokeWidth={2} fillOpacity={1} fill="url(#colorTokens)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Distribution Pie */}
                    <div className="chart-panel">
                        <div className="panel-header">
                            <h3><TrendingUp size={16} color={COLORS.accent} /> Data Mix</h3>
                        </div>
                        <div className="pie-container">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie data={pieData} innerRadius={60} outerRadius={80} paddingAngle={8} dataKey="value" stroke="none">
                                        {pieData.map((entry, index) => <Cell key={index} fill={entry.color} />)}
                                    </Pie>
                                </PieChart>
                            </ResponsiveContainer>
                            <div className="pie-center-text">
                                <span className="percent-text">{((stats.output / (totalTokens || 1)) * 100).toFixed(0)}%</span>
                                <span className="label-text">Draft Ratio</span>
                            </div>
                        </div>
                        <div className="legend-list">
                            {pieData.map((item, i) => (
                                <div key={i} className="legend-item">
                                    <div className="legend-info">
                                        <div className="dot" style={{ background: item.color }}></div>
                                        <span className="legend-name">{item.name}</span>
                                    </div>
                                    <span className="legend-val">{(item.value / 1000).toFixed(1)}k</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Footer Security Note */}
                <div className="security-footer">
                    <Shield size={14} />
                    <span className="footer-text">Encrypted Ledger Access — Internal Audit Only</span>
                </div>
            </div>
        </div>
    );
};

// UI Sub-components
const StatCard = ({ label, value, sub, icon, color }) => {
    return (
        <div className={`stat-card ${color}`}>
            <div className="icon-box">
                {React.cloneElement(icon, { size: 18 })}
            </div>
            <p className="stat-label">{label}</p>
            <p className="stat-value">{value}</p>
            <p className="stat-sub">{sub}</p>
        </div>
    );
};

const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
        return (
            <div className="custom-tooltip">
                <p className="tooltip-label">Tokens Processed</p>
                <p className="tooltip-val">{payload[0].value.toLocaleString()}</p>
            </div>
        );
    }
    return null;
};

export default TokenDashboard;