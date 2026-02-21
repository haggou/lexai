import React, { useState, useEffect, useCallback } from 'react';
import { useAdmin } from '../../contexts/AdminContext';
import { FaUsers, FaCogs, FaShieldAlt, FaBell, FaSignOutAlt, FaClipboardList, FaLock, FaCreditCard, FaCloud, FaPowerOff, FaBrain, FaTicketAlt, FaComments, FaFileUpload, FaMoneyBillWave, FaKey, FaLayerGroup, FaPlusCircle, FaTrash, FaFileContract, FaUserShield, FaChartLine, FaBook, FaHeadset, FaPenFancy } from 'react-icons/fa';
import {
    LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { useNavigate } from 'react-router-dom';
import styles from './AdminPanel.module.css';
import SystemLiveFeed from './SystemLiveFeed';

const timeAgo = (date) => {
    if (!date) return '';
    const seconds = Math.floor((new Date() - new Date(date)) / 1000);
    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + " years ago";
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + " months ago";
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + " days ago";
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + " hours ago";
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + " mins ago";
    return Math.floor(seconds) + " seconds ago";
};

// --- SUB-COMPONENTS (Moved Outside to fix Focus Issue) ---

const AdminLoginScreen = () => {
    const { checkAdminStatus } = useAdmin();
    const navigate = useNavigate();
    const [adminLogin, setAdminLogin] = useState({ username: '', password: '' });
    const [authError, setAuthError] = useState('');
    const [isAuthenticating, setIsAuthenticating] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const handleAdminAuth = async (e) => {
        e.preventDefault();
        setAuthError('');
        setIsAuthenticating(true);

        try {
            const res = await fetch('http://localhost:3000/api/auth/admin/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(adminLogin)
            });
            const data = await res.json();

            if (res.ok && data.token) {
                localStorage.setItem('lexai_token', data.token);
                localStorage.setItem('lexai_userid', data.userId);

                // Double check admin status
                const isRealAdmin = await checkAdminStatus();
                if (!isRealAdmin) {
                    setAuthError("Access User is not an Administrator.");
                    localStorage.removeItem('lexai_token');
                }
            } else {
                setAuthError(data.error || "Invalid Credentials");
            }
        } catch (err) {
            setAuthError("Server Connection Failed");
        } finally {
            setIsAuthenticating(false);
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-[#050507] font-sans relative overflow-hidden">
            <div className="absolute top-[-20%] left-[-20%] w-[800px] h-[800px] bg-blue-600/10 rounded-full blur-[120px] animate-pulse mix-blend-screen pointer-events-none" />
            <div className="absolute bottom-[-20%] right-[-20%] w-[600px] h-[600px] bg-purple-600/10 rounded-full blur-[100px] animate-pulse delay-1000 mix-blend-screen pointer-events-none" />

            <div className="relative z-10 w-full max-w-md p-6">
                <div className="bg-gray-900/40 backdrop-blur-2xl border border-white/5 rounded-3xl shadow-2xl p-8 transform transition-all hover:border-white/10 hover:shadow-blue-900/20">
                    <div className="text-center mb-8">
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 shadow-lg shadow-blue-500/20 mb-4">
                            <FaShieldAlt className="text-3xl text-white" />
                        </div>
                        <h1 className="text-2xl font-bold text-white tracking-tight">System Administration</h1>
                        <p className="text-gray-500 text-sm mt-2">Please sign in to access the dashboard.</p>
                    </div>

                    {authError && (
                        <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 flex items-start gap-3 animate-pulse">
                            <div className="mt-1 w-2 h-2 rounded-full bg-red-500 flex-shrink-0" />
                            <span className="text-red-200 text-xs font-medium leading-relaxed">{authError}</span>
                        </div>
                    )}

                    <form onSubmit={handleAdminAuth} className="space-y-5">
                        <div className="space-y-1.5">
                            <label className="text-gray-400 text-xs font-semibold uppercase tracking-wider ml-1">Username</label>
                            <div className="group flex items-center bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500 transition-all">
                                <FaUsers className="text-gray-500 group-focus-within:text-blue-400 transition-colors mr-3" />
                                <input
                                    type="text"
                                    className="bg-transparent border-none text-white w-full outline-none placeholder-gray-600 text-sm selection:bg-blue-500/30"
                                    placeholder="admin"
                                    value={adminLogin.username}
                                    onChange={e => setAdminLogin({ ...adminLogin, username: e.target.value })}
                                    required
                                    autoFocus
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-gray-400 text-xs font-semibold uppercase tracking-wider ml-1">Password</label>
                            <div className="group flex items-center bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500 transition-all relative">
                                <FaLock className="text-gray-500 group-focus-within:text-blue-400 transition-colors mr-3" />
                                <input
                                    type={showPassword ? "text" : "password"}
                                    className="bg-transparent border-none text-white w-full outline-none placeholder-gray-600 text-sm selection:bg-blue-500/30"
                                    placeholder="••••••••"
                                    value={adminLogin.password}
                                    onChange={e => setAdminLogin({ ...adminLogin, password: e.target.value })}
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-4 text-xs font-medium text-gray-500 hover:text-white transition-colors"
                                >
                                    {showPassword ? "Hide" : "Show"}
                                </button>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={isAuthenticating}
                            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold py-3.5 rounded-xl transition-all shadow-lg shadow-blue-900/20 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed mt-4 flex justify-center items-center gap-2"
                        >
                            {isAuthenticating ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    <span>Signing In...</span>
                                </>
                            ) : (
                                <span>Sign In</span>
                            )}
                        </button>
                    </form>

                    <div className="mt-8 text-center border-t border-white/5 pt-6">
                        <button
                            onClick={() => navigate('/')}
                            className="text-gray-600 hover:text-white text-xs font-medium transition-colors flex items-center justify-center gap-2 mx-auto group"
                        >
                            <span className="group-hover:-translate-x-1 transition-transform">←</span> Return to Main Portal
                        </button>
                    </div>
                </div>

                <div className="text-center mt-8 text-gray-800 text-[9px] uppercase tracking-[0.3em] font-bold select-none">
                    LexAI Secure Admin Environment
                </div>
            </div>
        </div>
    );
};

const KnowledgeTab = () => (
    <div className={styles.card}>
        <div className={styles.cardTitle}>Legal Knowledge Base (RAG)</div>
        <p className="text-gray-500 mb-6">Upload Acts, Case Laws, and documents to train the AI's context.</p>
        <div className="border border-dashed border-gray-600 rounded-xl p-10 text-center hover:bg-gray-800 transition cursor-pointer group">
            <FaFileUpload className="text-5xl text-gray-500 mx-auto mb-4 group-hover:text-blue-500 transition" />
            <h3 className="text-white font-bold mb-2">Drag & Drop Legal PDFs</h3>
            <p className="text-sm text-gray-400">or click to browse files</p>
        </div>
        <div className="mt-8">
            <h4 className="text-white font-bold mb-4">Indexed Documents</h4>
            <div className="text-center text-gray-500 py-12 bg-gray-800/50 rounded-xl border border-gray-700/50">
                <FaBook className="text-4xl mx-auto mb-3 opacity-20" />
                No documents indexed yet.
            </div>
        </div>
    </div>
);

const SupportTab = () => (
    <div className={styles.card}>
        <div className={styles.cardTitle}>Support Tickets</div>
        <p className="text-gray-500 mb-6">Manage user queries, technical issues, and billing support.</p>

        <div className="flex gap-4 mb-6">
            <div className="bg-blue-600/20 text-blue-400 px-4 py-2 rounded-lg border border-blue-600/50 font-bold">Open (0)</div>
            <div className="bg-yellow-600/20 text-yellow-400 px-4 py-2 rounded-lg border border-yellow-600/50 font-bold">In Progress (0)</div>
            <div className="bg-green-600/20 text-green-400 px-4 py-2 rounded-lg border border-green-600/50 font-bold">Resolved (0)</div>
        </div>

        <div className="text-center py-16 text-gray-500 bg-gray-800/50 rounded-xl border border-gray-700/50">
            <FaHeadset className="text-6xl mx-auto mb-4 opacity-20" />
            <div className="text-lg">No active support tickets.</div>
            <p className="text-sm mt-2 opacity-60">Ticket system is online and listening.</p>
        </div>
    </div>
);

const DashboardTab = () => {
    const { config, actions } = useAdmin();

    const handleMaintenanceToggle = async () => {
        const isMaint = config.features?.system_status === 'maintenance';
        const newVal = isMaint ? 'active' : 'maintenance';
        if (window.confirm(`Turn System ${isMaint ? 'ONLINE' : 'OFFLINE (Maintenance)'}?`)) {
            await actions.updateSystemConfig('system_status', newVal);
            alert("System Status Updated.");
        }
    };

    // Sample Data for Charts (Replace with Real Data later)
    const revenueData = config.stats?.revenueStream?.map(r => ({ name: r.name, value: r.revenue })) || [];
    const usageData = [
        { name: 'Unsettled Law', value: 400 },
        { name: 'Routine', value: 300 },
        { name: 'Research', value: 300 },
        { name: 'Drafting', value: 200 }
    ];
    const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

    return (
        <div className={styles.card}>
            <div className="flex justify-between items-center mb-6">
                <div className={styles.cardTitle}>Executive Dashboard</div>
                <button
                    onClick={handleMaintenanceToggle}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold transition-all shadow-lg ${config.features?.system_status === 'maintenance' ? 'bg-red-600 animate-pulse' : 'bg-green-600 hover:bg-green-500'}`}
                >
                    <FaPowerOff /> {config.features?.system_status === 'maintenance' ? 'MAINTENANCE ON' : 'SYSTEM ONLINE'}
                </button>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                <div className="bg-gradient-to-br from-gray-800 to-gray-900 p-5 rounded-xl border border-gray-700 shadow-lg relative overflow-hidden group hover:border-blue-500 transition-colors">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity"><FaUsers size={50} /></div>
                    <h3 className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-1">Total Users</h3>
                    <p className="text-3xl font-black text-white">{config.stats?.totalUsers || 0}</p>
                    <div className="text-xs text-green-400 mt-2 flex items-center gap-1"><FaChartLine /> +12% this week</div>
                </div>
                <div className="bg-gradient-to-br from-gray-800 to-gray-900 p-5 rounded-xl border border-gray-700 shadow-lg relative overflow-hidden group hover:border-purple-500 transition-colors">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity"><FaUserShield size={50} /></div>
                    <h3 className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-1">Pro Users</h3>
                    <p className="text-3xl font-black text-white">{config.stats?.activeSubscriptions || 0}</p>
                    <div className="text-xs text-purple-400 mt-2">Active Subscribers</div>
                </div>
                <div className="bg-gradient-to-br from-gray-800 to-gray-900 p-5 rounded-xl border border-gray-700 shadow-lg relative overflow-hidden group hover:border-green-500 transition-colors">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity"><FaMoneyBillWave size={50} /></div>
                    <h3 className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-1">Total Revenue</h3>
                    <p className="text-3xl font-black text-green-400">₹{config.stats?.revenue?.toLocaleString() || '0'}</p>
                </div>
                <div className="bg-gradient-to-br from-gray-800 to-gray-900 p-5 rounded-xl border border-gray-700 shadow-lg relative overflow-hidden group hover:border-yellow-500 transition-colors">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity"><FaBrain size={50} /></div>
                    <h3 className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-1">AI Usage</h3>
                    <p className="text-3xl font-black text-yellow-400">142k</p>
                    <div className="text-xs text-gray-500 mt-2">Tokens Processed</div>
                </div>
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                {/* Revenue Chart */}
                <div className="lg:col-span-2 bg-gray-800 p-5 rounded-xl border border-gray-700 shadow-lg">
                    <h3 className="text-white font-bold mb-4 flex items-center gap-2"><FaChartLine className="text-green-500" /> Revenue Trend</h3>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={revenueData.length > 0 ? revenueData : [{ name: 'Jan', value: 4000 }, { name: 'Feb', value: 3000 }, { name: 'Mar', value: 5000 }, { name: 'Apr', value: 4500 }]}>
                                <defs>
                                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                                <XAxis dataKey="name" stroke="#9ca3af" tick={{ fontSize: 10 }} />
                                <YAxis stroke="#9ca3af" tick={{ fontSize: 10 }} />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px' }}
                                    itemStyle={{ color: '#fff' }}
                                />
                                <Area type="monotone" dataKey="value" stroke="#22c55e" fillOpacity={1} fill="url(#colorRevenue)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Usage Distribution */}
                <div className="bg-gray-800 p-5 rounded-xl border border-gray-700 shadow-lg">
                    <h3 className="text-white font-bold mb-4 flex items-center gap-2"><FaBrain className="text-purple-500" /> AI Task Distribution</h3>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={usageData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    fill="#8884d8"
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {usageData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip contentStyle={{ backgroundColor: '#1f2937', borderRadius: '8px', border: 'none' }} itemStyle={{ color: '#fff' }} />
                                <Legend verticalAlign="bottom" height={36} iconType="circle" />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>



            <div className="mb-6">
                <SystemLiveFeed />
            </div>
        </div>
    );
};

const UsersTab = () => {
    const { config, actions } = useAdmin(); // Access context here
    const [search, setSearch] = useState('');
    const [selectedUser, setSelectedUser] = useState(null);
    const [details, setDetails] = useState(null);
    const [walletAmount, setWalletAmount] = useState('');
    const [showCreateUserModal, setShowCreateUserModal] = useState(false);
    const [newUser, setNewUser] = useState({ username: '', email: '', mobile: '', password: '', role: 'user' });

    const fetchDetails = async (uid) => {
        const d = await actions.getUserDetails(uid);
        setDetails(d);
    };

    const handleCreateUser = async (e) => {
        e.preventDefault();
        const res = await actions.createUser(newUser);
        if (res.ok) {
            alert("User Created Successfully");
            setShowCreateUserModal(false);
            setNewUser({ username: '', email: '', mobile: '', password: '', role: 'user' });
            actions.fetchUsers();
        } else {
            const d = await res.json();
            alert("Failed: " + (d.error || 'Unknown error'));
        }
    };

    const filteredUsers = (config.users || []).filter(u =>
        u.username.toLowerCase().includes(search.toLowerCase()) ||
        u.email.toLowerCase().includes(search.toLowerCase()) ||
        (u.role || '').includes(search.toLowerCase())
    );

    const handleAdjustBalance = async (type) => {
        if (!walletAmount) return;
        const success = await actions.adjustUserBalance(
            selectedUser._id,
            walletAmount,
            type,
            `Admin Manual ${type}`
        );
        if (success) {
            alert("Balance updated");
            setWalletAmount('');
            fetchDetails(selectedUser._id);
        }
    };

    return (
        <div className={styles.card} style={{ position: 'relative', overflow: 'hidden' }}>
            <div className="flex justify-between items-center mb-6">
                <div className={styles.cardTitle}>User Management</div>
                <button
                    onClick={() => setShowCreateUserModal(true)}
                    className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-2 rounded-lg text-sm font-bold shadow-lg shadow-blue-500/20 hover:scale-105 transition-transform"
                >
                    + Create User
                </button>
            </div>

            {/* Modal for Create User */}
            {showCreateUserModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
                    <div className="bg-gray-900 p-8 rounded-2xl border border-gray-700 w-full max-w-md shadow-2xl relative">
                        <button
                            onClick={() => setShowCreateUserModal(false)}
                            className="absolute top-4 right-4 text-gray-400 hover:text-white"
                        >
                            &times;
                        </button>
                        <h3 className="text-xl font-bold text-white mb-6">Register New User</h3>
                        <form onSubmit={handleCreateUser} className="space-y-4">
                            <input type="text" placeholder="Username" className="w-full bg-gray-800 border border-gray-700 rounded p-3 text-white focus:border-blue-500 outline-none"
                                value={newUser.username} onChange={e => setNewUser({ ...newUser, username: e.target.value })} required />
                            <input type="email" placeholder="Email Address" className="w-full bg-gray-800 border border-gray-700 rounded p-3 text-white focus:border-blue-500 outline-none"
                                value={newUser.email} onChange={e => setNewUser({ ...newUser, email: e.target.value })} required />
                            <input type="text" placeholder="Mobile Number" className="w-full bg-gray-800 border border-gray-700 rounded p-3 text-white focus:border-blue-500 outline-none"
                                value={newUser.mobile} onChange={e => setNewUser({ ...newUser, mobile: e.target.value })} required />
                            <input type="password" placeholder="Password" className="w-full bg-gray-800 border border-gray-700 rounded p-3 text-white focus:border-blue-500 outline-none"
                                value={newUser.password} onChange={e => setNewUser({ ...newUser, password: e.target.value })} required />
                            <select className="w-full bg-gray-800 border border-gray-700 rounded p-3 text-white focus:border-blue-500 outline-none"
                                value={newUser.role} onChange={e => setNewUser({ ...newUser, role: e.target.value })}>
                                <option value="user">User</option>
                                <option value="admin">Admin</option>
                            </select>
                            <button type="submit" className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-xl mt-4">Create Account</button>
                        </form>
                    </div>
                </div>
            )}

            {/* Search Bar */}
            <div style={{ marginBottom: '1rem' }}>
                <input
                    type="text"
                    placeholder="Search by name, email or role..."
                    className="w-full bg-gray-700 text-white p-2 rounded border border-gray-600 outline-none focus:border-blue-500"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
            </div>

            {/* User List */}
            <div className={styles.tableResponsive}>
                <table className={styles.table}>
                    <thead>
                        <tr>
                            <th>User</th>
                            <th>Role</th>
                            <th>Plan</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredUsers.map(user => (
                            <tr key={user._id}>
                                <td className="font-medium text-white">
                                    <div>{user.username}</div>
                                    <div className="text-xs text-gray-500">{user.email}</div>
                                </td>
                                <td>
                                    <span className={`px-2 py-1 rounded text-xs ${user.role === 'admin' ? 'bg-purple-500/20 text-purple-400' : 'bg-gray-700 text-gray-400'}`}>
                                        {user.role}
                                    </span>
                                </td>
                                <td>
                                    <span style={{ color: user.subscriptionPlan === 'pro' ? '#3b82f6' : '#9ca3af' }}>
                                        {user.subscriptionPlan ? user.subscriptionPlan.toUpperCase() : 'FREE'}
                                    </span>
                                </td>
                                <td>
                                    <span className={`${styles.statusPill} ${user.blocked ? styles.blocked : styles.statusActive}`}>
                                        {user.blocked ? 'Blocked' : 'Active'}
                                    </span>
                                </td>
                                <td>
                                    <button
                                        className="bg-blue-600 hover:bg-blue-500 text-white px-3 py-1 rounded text-xs"
                                        onClick={() => { setSelectedUser(user); fetchDetails(user._id); }}
                                    >
                                        Manage
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Slide-over Detail Panel */}
            {selectedUser && (
                <div className="absolute inset-0 bg-gray-900 border border-gray-700 z-20 flex flex-col animate-in slide-in-from-right duration-300">
                    <div className="p-4 border-b border-gray-700 flex justify-between items-center bg-gray-800">
                        <h3 className="font-bold text-white">Managing: {selectedUser.username}</h3>
                        <button onClick={() => { setSelectedUser(null); setDetails(null); }} className="text-gray-400 hover:text-white">&times;</button>
                    </div>

                    <div className="p-6 overflow-y-auto flex-1 space-y-6">
                        {/* Profile Info */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-xs text-gray-500 uppercase">Role</label>
                                <select
                                    value={selectedUser.role}
                                    onChange={(e) => actions.updateUser(selectedUser._id, { role: e.target.value })}
                                    className="w-full bg-gray-800 border border-gray-600 rounded p-2 mt-1 text-white"
                                >
                                    <option value="user">User</option>
                                    <option value="admin">Admin</option>
                                </select>
                            </div>
                            <div>
                                <label className="text-xs text-gray-500 uppercase">Profession</label>
                                <select
                                    value={selectedUser.profession || 'individual'}
                                    onChange={(e) => actions.updateUser(selectedUser._id, { profession: e.target.value })}
                                    className="w-full bg-gray-800 border border-gray-600 rounded p-2 mt-1 text-white"
                                >
                                    <option value="individual">Individual</option>
                                    <option value="lawyer">Lawyer</option>
                                    <option value="law_firm">Law Firm</option>
                                    <option value="student">Student</option>
                                    <option value="judge">Judge</option>
                                </select>
                            </div>
                            <div>
                                <label className="text-xs text-gray-500 uppercase">Status</label>
                                <button
                                    className={`w-full p-2 mt-1 rounded text-white ${selectedUser.blocked ? 'bg-green-600' : 'bg-red-600'}`}
                                    onClick={() => actions.updateUser(selectedUser._id, { blocked: !selectedUser.blocked })}
                                >
                                    {selectedUser.blocked ? 'Unblock User' : 'Block User'}
                                </button>
                            </div>
                        </div>

                        {/* Wallet Manager */}
                        <div className="bg-gray-800 p-4 rounded border border-gray-700">
                            <h4 className="text-sm font-bold text-blue-400 mb-3 uppercase tracking-wider">Wallet Control</h4>
                            {details ? (
                                <>
                                    <div className="flex justify-between items-end mb-4">
                                        <div>
                                            <div className="text-gray-400 text-xs">Current Balance</div>
                                            <div className="text-3xl text-white font-mono">₹{details.wallet.balance.toFixed(2)}</div>
                                        </div>
                                        <div className="text-right text-xs text-gray-500">
                                            <div>Total In: <span className="text-green-400">₹{details.wallet.totalCredit.toFixed(2)}</span></div>
                                            <div>Total Out: <span className="text-red-400">₹{details.wallet.totalDebit.toFixed(2)}</span></div>
                                        </div>
                                    </div>

                                    <div className="flex gap-2 mb-6">
                                        <input
                                            type="number"
                                            placeholder="Amount"
                                            className="bg-gray-900 border border-gray-600 text-white rounded p-2 flex-1"
                                            value={walletAmount}
                                            onChange={e => setWalletAmount(e.target.value)}
                                        />
                                        <button
                                            className="bg-green-600 hover:bg-green-500 text-white px-4 py-2 rounded font-medium"
                                            onClick={() => handleAdjustBalance('CREDIT')}
                                        >
                                            + Add
                                        </button>
                                        <button
                                            className="bg-red-600 hover:bg-red-500 text-white px-4 py-2 rounded font-medium"
                                            onClick={() => handleAdjustBalance('DEBIT')}
                                        >
                                            - Deduct
                                        </button>
                                    </div>

                                    <h4 className="text-xs text-gray-500 uppercase mb-2">Recent Transactions</h4>
                                    <div className="space-y-1 max-h-40 overflow-y-auto">
                                        {details.wallet.transactions?.map((tx, idx) => (
                                            <div key={idx} className="flex justify-between text-xs p-2 bg-gray-900/50 rounded border border-gray-800">
                                                <span className={tx.type === 'CREDIT' ? 'text-green-400' : 'text-red-400'}>
                                                    {tx.type}
                                                </span>
                                                <span className="text-gray-400 truncate w-32">{tx.description}</span>
                                                <span className="text-white">₹{tx.amount}</span>
                                            </div>
                                        ))}
                                        {!details.wallet.transactions?.length && <div className="text-gray-600 text-xs">No recent transactions.</div>}
                                    </div>
                                </>
                            ) : <div className="text-gray-500 italic">Loading wallet info...</div>}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

const LogsTab = () => {
    const { config } = useAdmin();
    return (
        <div className={styles.card}>
            <div className={styles.cardTitle}>Audit Trail & System Logs</div>
            <p className="text-gray-500 mb-4">Track every administrative action for security.</p>
            <div className="space-y-2 max-h-[600px] overflow-y-auto">
                {config.logs && config.logs.length > 0 ? config.logs.map((log, i) => (
                    <div key={i} className="flex flex-col md:flex-row md:items-center justify-between p-3 bg-gray-800/50 rounded border border-gray-700 hover:bg-gray-800 transition">
                        <div className="flex items-center gap-4">
                            <span className="bg-gray-700 text-gray-400 text-xs px-2 py-1 rounded font-mono">{timeAgo(log.createdAt)}</span>
                            <div>
                                <div className="text-white font-bold text-sm flex items-center gap-2">
                                    <span className="text-blue-400">{log.adminName}</span>
                                    <span className="text-gray-600">➜</span>
                                    <span className="text-yellow-400">{log.action}</span>
                                </div>
                                <div className="text-gray-400 text-xs mt-1">{log.target}</div>
                            </div>
                        </div>
                        <div className="text-right mt-2 md:mt-0">
                            <code className="text-[10px] text-gray-500 block max-w-xs truncate">{JSON.stringify(log.details)}</code>
                            <div className="text-[10px] text-gray-600">{log.ipAddress}</div>
                        </div>
                    </div>
                )) : <div className="text-gray-500 text-center p-8">No audit logs found.</div>}
            </div>
        </div>
    );
};

const PromptsTab = () => {
    const { config, actions } = useAdmin();
    const [prompts, setPrompts] = useState(config.features?.system_prompts || {
        advice: '', draft: '', compare: '', risk_check: '', draft_analysis: '', hallucination_check: ''
    });
    const [targetType, setTargetType] = useState(null);

    useEffect(() => {
        if (config.features?.system_prompts) {
            setPrompts(config.features.system_prompts);
        }
    }, [config.features?.system_prompts]);

    const handleSave = async () => {
        await actions.updateSystemConfig('system_prompts', prompts);
        alert("AI Brain Updated! New prompts are live.");
    };

    const handleFileSelect = async (e) => {
        const file = e.target.files[0];
        if (!file || !targetType) return;

        const formData = new FormData();
        formData.append('file', file);
        formData.append('type', targetType);

        const res = await actions.uploadPrompt(formData);
        if (res.error) {
            alert("Upload Failed: " + res.error);
        } else {
            setPrompts(res.prompts);
            alert("Prompt Updated from File!");
        }
        e.target.value = null; // Reset
    };

    const triggerUpload = (type) => {
        setTargetType(type);
        document.getElementById('promptUpload').click();
    };

    return (
        <div className={styles.card}>
            <div className={styles.cardTitle}>AI Brain Surgery (System Prompts)</div>
            <p className="text-gray-400 mb-6 text-sm">
                Directly modify the persona and rules of the AI models.
                <span className="text-red-400 ml-1">Warning: Changes affect all users immediately.</span>
            </p>

            <input
                type="file"
                id="promptUpload"
                accept=".md,.txt"
                style={{ display: 'none' }}
                onChange={handleFileSelect}
            />

            <div className="space-y-6">
                {/* Advice Prompt */}
                <div className="bg-gray-800 p-4 rounded-xl border border-gray-700">
                    <div className="flex justify-between items-center mb-2">
                        <h3 className="text-blue-400 font-bold flex items-center gap-2">
                            <span>ADVICE PERSONA (Nyaya Mitra)</span>
                        </h3>
                        <button
                            onClick={() => triggerUpload('advice')}
                            className="text-xs bg-gray-700 hover:bg-gray-600 text-white px-3 py-1 rounded flex items-center gap-2 transition"
                        >
                            <FaFileUpload /> Upload .md
                        </button>
                    </div>
                    <div className="text-xs text-gray-500 mb-2">Used for: Chat & Legal Q&A</div>
                    <textarea
                        className="w-full h-48 bg-gray-900/50 text-gray-300 text-sm font-mono p-3 rounded border border-gray-600 focus:border-blue-500 outline-none resize-y"
                        value={prompts.advice}
                        onChange={(e) => setPrompts({ ...prompts, advice: e.target.value })}
                        placeholder="// Enter System Prompt for General Advice..."
                    />
                </div>

                {/* Draft Prompt */}
                <div className="bg-gray-800 p-4 rounded-xl border border-gray-700">
                    <div className="flex justify-between items-center mb-2">
                        <h3 className="text-purple-400 font-bold flex items-center gap-2">
                            <span>DRAFTING ARCHITECT (Nyaya Supremo)</span>
                        </h3>
                        <button
                            onClick={() => triggerUpload('draft')}
                            className="text-xs bg-gray-700 hover:bg-gray-600 text-white px-3 py-1 rounded flex items-center gap-2 transition"
                        >
                            <FaFileUpload /> Upload .md
                        </button>
                    </div>
                    <div className="text-xs text-gray-500 mb-2">Used for: Document Generation</div>
                    <textarea
                        className="w-full h-48 bg-gray-900/50 text-gray-300 text-sm font-mono p-3 rounded border border-gray-600 focus:border-purple-500 outline-none resize-y"
                        value={prompts.draft}
                        onChange={(e) => setPrompts({ ...prompts, draft: e.target.value })}
                        placeholder="// Enter System Prompt for Drafting..."
                    />
                </div>

                {/* Compare Prompt */}
                <div className="bg-gray-800 p-4 rounded-xl border border-gray-700">
                    <div className="flex justify-between items-center mb-2">
                        <h3 className="text-green-400 font-bold flex items-center gap-2">
                            <span>COMPARISON ENGINE (Nyaya Tulna)</span>
                        </h3>
                        <button
                            onClick={() => triggerUpload('compare')}
                            className="text-xs bg-gray-700 hover:bg-gray-600 text-white px-3 py-1 rounded flex items-center gap-2 transition"
                        >
                            <FaFileUpload /> Upload .md
                        </button>
                    </div>
                    <div className="text-xs text-gray-500 mb-2">Used for: Old vs New Law Analysis</div>
                    <textarea
                        className="w-full h-48 bg-gray-900/50 text-gray-300 text-sm font-mono p-3 rounded border border-gray-600 focus:border-green-500 outline-none resize-y"
                        value={prompts.compare}
                        onChange={(e) => setPrompts({ ...prompts, compare: e.target.value })}
                        placeholder="// Enter System Prompt for Comparison..."
                    />
                </div>

                {/* NEW: Risk Check Prompt */}
                <div className="bg-gray-800 p-4 rounded-xl border border-gray-700">
                    <div className="flex justify-between items-center mb-2">
                        <h3 className="text-red-400 font-bold flex items-center gap-2">
                            <span>RISK ANALYST (Nyaya Suraksha)</span>
                        </h3>
                        <button
                            onClick={() => triggerUpload('risk_check')}
                            className="text-xs bg-gray-700 hover:bg-gray-600 text-white px-3 py-1 rounded flex items-center gap-2 transition"
                        >
                            <FaFileUpload /> Upload .md
                        </button>
                    </div>
                    <div className="text-xs text-gray-500 mb-2">Used for: Risk Assessment Mode</div>
                    <textarea
                        className="w-full h-48 bg-gray-900/50 text-gray-300 text-sm font-mono p-3 rounded border border-gray-600 focus:border-red-500 outline-none resize-y"
                        value={prompts.risk_check || ''}
                        onChange={(e) => setPrompts({ ...prompts, risk_check: e.target.value })}
                        placeholder="// Enter System Prompt for Risk Analysis..."
                    />
                </div>

                {/* NEW: Draft Analysis Prompt */}
                <div className="bg-gray-800 p-4 rounded-xl border border-gray-700">
                    <div className="flex justify-between items-center mb-2">
                        <h3 className="text-yellow-400 font-bold flex items-center gap-2">
                            <span>DOCUMENT CRITIC (Draft Analyst)</span>
                        </h3>
                        <button
                            onClick={() => triggerUpload('draft_analysis')}
                            className="text-xs bg-gray-700 hover:bg-gray-600 text-white px-3 py-1 rounded flex items-center gap-2 transition"
                        >
                            <FaFileUpload /> Upload .md
                        </button>
                    </div>
                    <div className="text-xs text-gray-500 mb-2">Used for: Analyzing/Critiquing Drafts</div>
                    <textarea
                        className="w-full h-48 bg-gray-900/50 text-gray-300 text-sm font-mono p-3 rounded border border-gray-600 focus:border-yellow-500 outline-none resize-y"
                        value={prompts.draft_analysis || ''}
                        onChange={(e) => setPrompts({ ...prompts, draft_analysis: e.target.value })}
                        placeholder="// Enter System Prompt for Draft Analysis..."
                    />
                </div>

                {/* NEW: Hallucination Check Prompt */}
                <div className="bg-gray-800 p-4 rounded-xl border border-gray-700">
                    <div className="flex justify-between items-center mb-2">
                        <h3 className="text-cyan-400 font-bold flex items-center gap-2">
                            <span>FACT CHECKER (Satya Check)</span>
                        </h3>
                        <button
                            onClick={() => triggerUpload('hallucination_check')}
                            className="text-xs bg-gray-700 hover:bg-gray-600 text-white px-3 py-1 rounded flex items-center gap-2 transition"
                        >
                            <FaFileUpload /> Upload .md
                        </button>
                    </div>
                    <div className="text-xs text-gray-500 mb-2">Used for: Citation Verification (Auto-runs on Advice)</div>
                    <textarea
                        className="w-full h-48 bg-gray-900/50 text-gray-300 text-sm font-mono p-3 rounded border border-gray-600 focus:border-cyan-500 outline-none resize-y"
                        value={prompts.hallucination_check || ''}
                        onChange={(e) => setPrompts({ ...prompts, hallucination_check: e.target.value })}
                        placeholder="// Enter System Prompt for Hallucination Checking..."
                    />
                </div>

                <div className="flex justify-end pt-4">
                    <button
                        onClick={handleSave}
                        className="bg-gradient-to-r from-blue-600 to-purple-600 hover:scale-105 transition-transform text-white px-8 py-3 rounded-xl font-bold shadow-lg"
                    >
                        Save AI Configuration
                    </button>
                </div>
            </div>
        </div>
    );
};

const FeaturesTab = () => {
    const { config, actions } = useAdmin();
    const [mode, setMode] = useState('pricing'); // 'pricing' or 'raw'
    const [rawConfig, setRawConfig] = useState('');

    useEffect(() => {
        if (config.features) {
            setRawConfig(JSON.stringify(config.features, null, 2));
        }
    }, [config.features]);

    const saveRaw = () => {
        try {
            const parsed = JSON.parse(rawConfig);
            Object.keys(parsed).forEach(key => actions.updateSystemConfig(key, parsed[key]));
            alert("Settings Saved!");
        } catch (e) { alert("Invalid JSON"); }
    };

    return (
        <div className={styles.card}>
            <div className={styles.cardTitle}>System Configuration</div>
            <div className="flex justify-between items-center mb-6">
                <div className="flex bg-gray-800 rounded p-1">
                    <button onClick={() => setMode('raw')} className={`px-3 py-1 text-xs rounded ${mode === 'raw' ? 'bg-blue-600 text-white' : 'text-gray-400'}`}>Advanced JSON</button>
                    <button onClick={() => setMode('pricing')} className={`px-3 py-1 text-xs rounded ${mode === 'pricing' ? 'bg-blue-600 text-white' : 'text-gray-400'}`}>View Config</button>
                </div>
            </div>

            {mode === 'pricing' ? (
                <div className="animate-in fade-in">
                    <p className="text-gray-400 mb-2 text-xs">Read-Only System Configuration</p>
                    <div className="w-full h-96 bg-gray-900 text-blue-300 font-mono text-xs p-4 rounded border border-gray-700 overflow-auto">
                        <pre>{JSON.stringify(config.features, null, 2)}</pre>
                    </div>
                </div>
            ) : (
                <div className="animate-in fade-in">
                    <p className="text-red-400 mb-2 text-xs">Warning: Direct JSON Editing</p>
                    <textarea
                        className="w-full h-96 bg-gray-900 text-green-400 font-mono text-sm p-4 rounded border border-gray-700"
                        value={rawConfig}
                        onChange={(e) => setRawConfig(e.target.value)}
                    />
                    <button onClick={saveRaw} className="mt-4 bg-red-600 text-white px-6 py-2 rounded">Force Update Config</button>
                </div>
            )}
        </div>
    );
};

const FinanceTab = () => {
    const { config } = useAdmin();
    const transactions = config.stats?.recentActivity || [];

    return (
        <div className={styles.card}>
            <div className="flex justify-between items-center mb-6">
                <div className={styles.cardTitle}>Financial Overview</div>
                <div className="text-right">
                    <div className="text-xs text-gray-500">Total Revenue</div>
                    <div className="text-2xl font-bold text-green-400">₹{config.stats?.revenue?.toFixed(2) || '0.00'}</div>
                </div>
            </div>

            <h3 className="text-gray-400 text-sm font-bold mb-4 uppercase tracking-wider">Recent Global Transactions</h3>
            <div className={styles.tableResponsive}>
                <table className={styles.table}>
                    <thead>
                        <tr>
                            <th>Date</th>
                            <th>User</th>
                            <th>Type</th>
                            <th>Amount</th>
                            <th>Description</th>
                        </tr>
                    </thead>
                    <tbody>
                        {transactions.map((tx, i) => (
                            <tr key={i}>
                                <td className="text-gray-500 text-xs">{new Date(tx.timestamp).toLocaleDateString()}</td>
                                <td className="text-blue-400">{tx.username || 'Unknown'}</td>
                                <td>
                                    <span className={tx.type === 'CREDIT' ? 'text-green-400' : 'text-red-400'}>{tx.type}</span>
                                </td>
                                <td className="text-white font-mono">₹{tx.amount?.toFixed(2)}</td>
                                <td className="text-gray-400 text-xs">{tx.description}</td>
                            </tr>
                        ))}
                        {!transactions.length && <tr><td colSpan="5" className="text-center text-gray-500 py-4">No recent transactions found.</td></tr>}
                    </tbody>
                </table>
            </div>
        </div>
    );
};



const ModelsTab = () => {
    const { config, actions } = useAdmin();
    const [defaultModel, setDefaultModel] = useState('gemini-1.5-flash');
    const [availableModels, setAvailableModels] = useState([
        'gemini-1.5-flash', 'gemini-1.5-pro', 'gemini-1.5-flash-001', 'gemini-1.5-pro-001', 'gemini-1.0-pro'
    ]);
    const [modelPricing, setModelPricing] = useState({});
    const [newModel, setNewModel] = useState('');

    useEffect(() => {
        if (config.features?.DEFAULT_MODEL) setDefaultModel(config.features.DEFAULT_MODEL);
        if (config.features?.supported_models && Array.isArray(config.features.supported_models)) {
            setAvailableModels(config.features.supported_models);
        }
        if (config.features?.model_pricing) setModelPricing(config.features.model_pricing);
    }, [config.features]);

    const handleAddModel = async () => {
        if (!newModel) return;
        if (availableModels.includes(newModel)) { alert("Model already exists"); return; }
        const updated = [...availableModels, newModel];
        setAvailableModels(updated);
        await actions.updateSystemConfig('supported_models', updated);
        // Init pricing
        await actions.updateSystemConfig('model_pricing', { ...modelPricing, [newModel]: 0.001 });
        setNewModel('');
    };

    const handleRemoveModel = async (model) => {
        if (window.confirm(`Remove ${model}? This will also remove its pricing configuration.`)) {
            const updated = availableModels.filter(m => m !== model);
            setAvailableModels(updated);
            await actions.updateSystemConfig('supported_models', updated);

            // Cleanup Pricing
            const newPricing = { ...modelPricing };
            delete newPricing[model];
            setModelPricing(newPricing);
            await actions.updateSystemConfig('model_pricing', newPricing);

            if (defaultModel === model && updated.length > 0) setDefaultModel(updated[0]);
        }
    };

    const saveDefault = async () => {
        await actions.updateSystemConfig('DEFAULT_MODEL', defaultModel);
        alert("Default Model Updated");
    };

    return (
        <div className={styles.card}>
            <div className={styles.cardTitle}>AI Models Management</div>
            <p className="text-gray-500 mb-6">Manage supported AI models. Pricing is auto-linked.</p>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-gray-800/50 p-6 rounded-xl border border-gray-700">
                    <h3 className="text-blue-400 font-bold mb-4 uppercase text-sm tracking-wider">Default Core Model</h3>
                    <p className="text-gray-500 mb-4 text-xs">This model is used for all standard requests unless specified otherwise.</p>
                    <div className="flex gap-2">
                        <select
                            className="bg-gray-900 border border-gray-600 text-white p-3 rounded flex-1 outline-none focus:border-blue-500"
                            value={defaultModel}
                            onChange={(e) => setDefaultModel(e.target.value)}
                        >
                            {availableModels.map(m => <option key={m} value={m}>{m}</option>)}
                        </select>
                        <button onClick={saveDefault} className="bg-blue-600 px-4 rounded font-bold text-white hover:bg-blue-500">Save</button>
                    </div>
                </div>

                <div className="bg-gray-800/50 p-6 rounded-xl border border-gray-700">
                    <h3 className="text-purple-400 font-bold mb-4 uppercase text-sm tracking-wider">Add New Model</h3>
                    <p className="text-gray-500 mb-4 text-xs">Add model IDs exactly as required by the provider.</p>
                    <div className="flex gap-2">
                        <input
                            placeholder="Model ID (e.g. gpt-4-turbo)"
                            className="bg-gray-900 border border-gray-600 text-white p-3 rounded flex-1 outline-none focus:border-purple-500"
                            value={newModel}
                            onChange={e => setNewModel(e.target.value)}
                        />
                        <button onClick={handleAddModel} className="bg-purple-600 px-4 rounded font-bold text-white hover:bg-purple-500 flex items-center gap-2">
                            <FaPlusCircle /> Add
                        </button>
                    </div>
                </div>
            </div>

            <div className="mt-8">
                <h3 className="text-gray-300 font-bold mb-4 uppercase text-sm tracking-wider">Available Models List</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {availableModels.map(model => (
                        <div key={model} className="bg-gray-800 p-3 rounded border border-gray-700 flex justify-between items-center group">
                            <span className="text-gray-300 font-mono text-sm">{model}</span>
                            <button onClick={() => handleRemoveModel(model)} className="text-gray-500 hover:text-red-500 transition-colors p-2">
                                <FaTrash />
                            </button>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

const EnvTab = () => {
    const { actions } = useAdmin();
    const [envVars, setEnvVars] = useState({});
    const [loading, setLoading] = useState(true);
    const [editKey, setEditKey] = useState(null);
    const [editValue, setEditValue] = useState('');

    const loadEnv = useCallback(async () => {
        setLoading(true);
        const data = await actions.getEnvConfig();
        setEnvVars(data);
        setLoading(false);
    }, [actions]);

    useEffect(() => {
        loadEnv();
    }, [loadEnv]);

    const handleSave = async (key) => {
        const success = await actions.updateEnvConfig(key, editValue);
        if (success) {
            alert(`Updated ${key}`);
            setEditKey(null);
            loadEnv();
        } else {
            alert("Failed to update");
        }
    };

    return (
        <div className={styles.card}>
            <div className={styles.cardTitle}>Environment Variables</div>
            <p className="text-red-400 mb-6 text-sm flex items-center gap-2">
                <FaLock /> Sensitive Configuration. Changes require server restart to take full effect in some cases.
            </p>

            {loading ? <div className="text-white">Loading .env...</div> : (
                <div className="space-y-2 font-mono text-sm max-h-[600px] overflow-y-auto pr-2">
                    {Object.entries(envVars).map(([key, val]) => (
                        <div key={key} className="bg-gray-800 p-4 rounded border border-gray-700 hover:border-blue-500 transition-colors">
                            <div className="flex flex-col md:flex-row justify-between md:items-center gap-2">
                                <span className="text-blue-400 font-bold">{key}</span>
                                {editKey === key ? (
                                    <div className="flex gap-2 flex-1">
                                        <input
                                            className="bg-gray-900 text-white border border-gray-600 p-1 rounded flex-1"
                                            value={editValue}
                                            placeholder={val}
                                            onChange={e => setEditValue(e.target.value)}
                                        />
                                        <button onClick={() => handleSave(key)} className="text-green-500 hover:underline">Save</button>
                                        <button onClick={() => setEditKey(null)} className="text-gray-500 hover:underline">Cancel</button>
                                    </div>
                                ) : (
                                    <div className="flex gap-4 items-center flex-1 justify-end">
                                        <span className="text-gray-500 truncate max-w-xs" title={val}>
                                            {key.includes('KEY') || key.includes('SECRET') || key.includes('PASSWORD') ? '••••••••••••' : val}
                                        </span>
                                        <button
                                            onClick={() => { setEditKey(key); setEditValue(val); }}
                                            className="text-blue-500 hover:text-blue-400 text-xs px-2 py-1 bg-blue-500/10 rounded"
                                        >
                                            Edit
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                    <div className="mt-6 p-4 bg-gray-900 border border-gray-700 rounded-xl">
                        <h4 className="text-white font-bold mb-2">Add New Variable</h4>
                        <form onSubmit={async (e) => {
                            e.preventDefault();
                            const k = e.target.k.value;
                            const v = e.target.v.value;
                            const s = await actions.updateEnvConfig(k, v);
                            if (s) { alert("Added"); loadEnv(); e.target.reset(); }
                        }} className="flex gap-2">
                            <input name="k" placeholder="KEY_NAME" className="bg-gray-800 border border-gray-600 text-white p-2 rounded flex-1" required />
                            <input name="v" placeholder="VALUE" className="bg-gray-800 border border-gray-600 text-white p-2 rounded flex-1" required />
                            <button type="submit" className="bg-blue-600 text-white px-4 rounded">Add</button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

// --- NEW TABS (Refactored) ---

const NotificationsTab = () => {
    const { actions, config } = useAdmin();
    const [target, setTarget] = useState('ALL'); // 'ALL' or userId
    const [type, setType] = useState('SYSTEM');
    const [title, setTitle] = useState('');
    const [message, setMessage] = useState('');
    const [actionLink, setActionLink] = useState('');
    const [actionLabel, setActionLabel] = useState('');
    const [sending, setSending] = useState(false);

    const handleSend = async (e) => {
        e.preventDefault();
        setSending(true);
        if (!title || !message) {
            alert("Title and Message required.");
            setSending(false);
            return;
        }

        const data = {
            targetUserId: target,
            type,
            title,
            message,
            actionLink,
            actionLabel
        };

        const res = await actions.sendNotification(data);
        setSending(false);

        if (res.status === 'success') {
            alert(`Sent successfully to ${res.sentCount} recipients.`);
            setTitle(''); setMessage(''); setActionLink(''); setActionLabel('');
        } else {
            alert("Failed: " + (res.error || 'Unknown error'));
        }
    };

    return (
        <div className={styles.card}>
            <div className={styles.cardTitle}>Global Notification Dispatch</div>
            <p className="text-gray-500 mb-6">Send urgent alerts or updates to users directly.</p>

            <form onSubmit={handleSend} className="space-y-4 max-w-2xl">
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="text-xs text-gray-400 block mb-1">Target Audience</label>
                        <select className="w-full bg-gray-900 border border-gray-700 text-white p-3 rounded" value={target} onChange={e => setTarget(e.target.value)}>
                            <option value="ALL">All Users (Broadcast)</option>
                            {config.users?.map(u => (
                                <option key={u._id} value={u._id}>{u.username} ({u.email})</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="text-xs text-gray-400 block mb-1">Alert Type</label>
                        <select className="w-full bg-gray-900 border border-gray-700 text-white p-3 rounded" value={type} onChange={e => setType(e.target.value)}>
                            <option value="SYSTEM">System Alert</option>
                            <option value="LEGAL_UPDATE">Legal Update</option>
                            <option value="PROMO">Promotion</option>
                            <option value="SECURITY">Security Warning</option>
                        </select>
                    </div>
                </div>

                <div>
                    <label className="text-xs text-gray-400 block mb-1">Title</label>
                    <input className="w-full bg-gray-900 border border-gray-700 text-white p-3 rounded" placeholder="e.g. Maintenance Scheduled" value={title} onChange={e => setTitle(e.target.value)} required />
                </div>

                <div>
                    <label className="text-xs text-gray-400 block mb-1">Message Body</label>
                    <textarea className="w-full h-32 bg-gray-900 border border-gray-700 text-white p-3 rounded" placeholder="Type your message here..." value={message} onChange={e => setMessage(e.target.value)} required />
                </div>

                <div className="p-4 bg-gray-800/50 rounded border border-gray-700">
                    <h4 className="text-sm font-bold text-gray-300 mb-3">Action Button (Optional)</h4>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs text-gray-400 block mb-1">Button Label</label>
                            <input className="w-full bg-gray-900 border border-gray-700 text-white p-2 rounded" placeholder="e.g. View Details" value={actionLabel} onChange={e => setActionLabel(e.target.value)} />
                        </div>
                        <div>
                            <label className="text-xs text-gray-400 block mb-1">Link URL</label>
                            <input className="w-full bg-gray-900 border border-gray-700 text-white p-2 rounded" placeholder="e.g. /pricing" value={actionLink} onChange={e => setActionLink(e.target.value)} />
                        </div>
                    </div>
                </div>

                <button type="submit" disabled={sending} className="bg-blue-600 hover:bg-blue-500 text-white px-8 py-3 rounded font-bold shadow-lg w-full flex justify-center items-center gap-2">
                    {sending ? 'Sending...' : <><FaBell /> Send Notification</>}
                </button>
            </form>
        </div>
    );
};

const CloudTab = () => {
    const { actions } = useAdmin();
    const [status, setStatus] = useState({ state: 'IDLE', logs: [] });
    const [polling, setPolling] = useState(false);

    const checkStatus = useCallback(async () => {
        const s = await actions.getDeploymentStatus();
        if (s) {
            setStatus(s);
            if (s.state === 'DEPLOYING') {
                setPolling(true);
            } else {
                setPolling(false);
            }
        }
    }, [actions]);

    useEffect(() => {
        let interval;
        if (polling) {
            interval = setInterval(checkStatus, 3000);
        }
        return () => clearInterval(interval);
    }, [polling, checkStatus]);

    // Initial check on load
    useEffect(() => {
        checkStatus();
    }, []);

    const handleDeploy = async () => {
        if (status.state === 'DEPLOYING') return;
        const res = await actions.deployVertex();
        if (res.error) {
            alert(res.error + "\n" + (res.details || ""));
        } else {
            setStatus(prev => ({ ...prev, state: 'DEPLOYING', logs: ['Initiating...'] }));
            setPolling(true);
        }
    };

    const handleUndeploy = async () => {
        if (!window.confirm("Are you sure you want to tear down Vertex AI resources?")) return;
        setStatus(prev => ({ ...prev, logs: [...prev.logs, "Teardown initiated..."] }));
        const res = await actions.undeployVertex();
        if (res.error) alert(res.error);
        else alert(res.message);
    };

    return (
        <div className={styles.card}>
            <div className={styles.cardTitle}>Cloud Infrastructure (Vertex AI)</div>
            <p className="text-gray-500 mb-6">Manage Google Cloud Vertex AI deployments.</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 flex flex-col items-center text-center">
                    <FaCloud className={`text-6xl mb-4 ${status.state === 'DEPLOYING' ? 'text-yellow-500 animate-pulse' : status.state === 'SUCCESS' ? 'text-green-500' : 'text-blue-500'}`} />
                    <h3 className="text-xl font-bold text-white mb-2">
                        {status.state === 'IDLE' ? 'Deploy / Update' : status.state}
                    </h3>
                    <p className="text-gray-400 text-sm mb-6">
                        {status.state === 'DEPLOYING' ? 'Deployment in progress. Do not close.' : 'Push latest codebase to Cloud Run.'}
                    </p>
                    <button
                        onClick={handleDeploy}
                        disabled={status.state === 'DEPLOYING'}
                        className={`px-6 py-2 rounded-lg font-bold w-full disabled:opacity-50 ${status.state === 'DEPLOYING' ? 'bg-yellow-600' : 'bg-blue-600 hover:bg-blue-500'} text-white`}
                    >
                        {status.state === 'DEPLOYING' ? 'Deploying...' : 'Deploy to Vertex AI'}
                    </button>
                    {status.details && <p className="mt-2 text-xs text-gray-400">{status.details}</p>}
                </div>

                <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 flex flex-col items-center text-center">
                    <FaPowerOff className="text-6xl text-red-500 mb-4" />
                    <h3 className="text-xl font-bold text-white mb-2">Teardown</h3>
                    <p className="text-gray-400 text-sm mb-6">Remove cloud resources to save costs when not in use.</p>
                    <button
                        onClick={handleUndeploy}
                        className="bg-red-600 hover:bg-red-500 text-white px-6 py-2 rounded-lg font-bold w-full"
                    >
                        Undeploy Resources
                    </button>
                </div>
            </div>

            {/* Terminal View */}
            <div className="bg-black rounded-lg p-4 font-mono text-xs text-green-400 h-64 overflow-y-auto border border-gray-700 shadow-inner">
                <div className="flex items-center gap-2 border-b border-gray-800 pb-2 mb-2">
                    <div className="w-3 h-3 rounded-full bg-red-500"></div>
                    <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                    <div className="w-3 h-3 rounded-full bg-green-500"></div>
                    <span className="text-gray-500 ml-2">deployment_logs</span>
                </div>
                {status.logs && status.logs.length > 0 ? (
                    status.logs.map((log, i) => (
                        <div key={i} className="mb-1 break-all whitespace-pre-wrap">{log}</div>
                    ))
                ) : (
                    <span className="text-gray-600">Waiting for logs...</span>
                )}
                {status.state === 'DEPLOYING' && (
                    <div className="animate-pulse">_</div>
                )}
            </div>
        </div>
    );
};


const FeedbackTab = () => {
    const { config, actions } = useAdmin();

    const handleStatusUpdate = async (id, newStatus) => {
        await actions.updateFeedbackStatus(id, newStatus);
    };

    return (
        <div className={styles.card}>
            <div className={styles.cardTitle}>User Feedback Loop</div>
            <p className="text-gray-500 mb-4">Review and manage user submitted bugs, features, and ratings.</p>
            <div className="space-y-4">
                {config.feedbacks && config.feedbacks.length > 0 ? (config.feedbacks.map(fb => (
                    <div key={fb._id} className="bg-gray-800 p-4 rounded border border-gray-700">
                        <div className="flex justify-between">
                            <div>
                                <span className={`text-xs font-bold uppercase py-1 px-2 rounded ${fb.type === 'bug' ? 'bg-red-900 text-red-200' :
                                    fb.type === 'feature' ? 'bg-purple-900 text-purple-200' : 'bg-blue-900 text-blue-200'
                                    }`}>{fb.category || fb.type}</span>
                                <span className="text-gray-500 text-xs ml-2">{new Date(fb.createdAt).toLocaleDateString()}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-xs text-gray-400">Status:</span>
                                <select
                                    className={`bg-gray-900 border border-gray-600 text-xs px-2 py-1 rounded text-white font-bold outline-none ${fb.status === 'Resolved' ? 'text-green-400' : fb.status === 'In Progress' ? 'text-blue-400' : 'text-yellow-400'
                                        }`}
                                    value={fb.status || 'Pending'}
                                    onChange={(e) => handleStatusUpdate(fb._id, e.target.value)}
                                >
                                    <option value="Pending">Pending</option>
                                    <option value="Reviewed">Reviewed</option>
                                    <option value="In Progress">In Progress</option>
                                    <option value="Resolved">Resolved</option>
                                    <option value="Closed">Closed</option>
                                </select>
                            </div>
                        </div>
                        <div className="mt-3">
                            <p className="text-gray-300 text-sm">{fb.message}</p>
                        </div>
                        <div className="mt-2 text-xs text-gray-500 flex justify-between items-center">
                            <span>User: <span className="text-blue-400">{fb.userId ? (fb.userId.username || fb.userId.email) : 'Anonymous'}</span></span>
                            {fb.rating > 0 && <span>Rating: {fb.rating}/5 ⭐</span>}
                        </div>
                    </div>
                ))) : (
                    <div className="text-center py-8 text-gray-500">
                        <div className="text-4xl mb-2">📭</div>
                        <div>No feedback items received yet.</div>
                    </div>
                )}
            </div>
        </div>
    );
};

const PricingTab = () => {
    const { config, actions } = useAdmin();

    // --- State 1: Mode Pricing ---
    const [pricing, setPricing] = useState({
        advice: { disabled: false, type: 'token', price: 0.0005, isActive: true },
        draft: { disabled: false, type: 'fixed', price: 50, isActive: true },
        risk_check: { disabled: false, type: 'fixed', price: 99, isActive: true },
        draft_analysis: { disabled: false, type: 'fixed', price: 75, isActive: true },
        compare: { disabled: false, type: 'token', price: 0.001, isActive: true }
    });

    // --- State 2: Model Base Pricing ---
    const [modelPrices, setModelPrices] = useState({});
    const [availableModels, setAvailableModels] = useState([]);

    // --- State 3: Inference Config (New) ---
    const [inference, setInference] = useState({
        advice: { temperature: 0.2, model: '' },
        draft: { temperature: 0.1, model: '' },
        risk_check: { temperature: 0.0, model: '' },
        draft_analysis: { temperature: 0.1, model: '' },
        compare: { temperature: 0.0, model: '' }
    });

    // Sync with global config
    useEffect(() => {
        if (config.mode_pricing_config) {
            setPricing(config.mode_pricing_config);
        }
        // Load Model Pricing Data 
        if (config.features?.model_pricing) {
            setModelPrices(config.features.model_pricing);
        }
        if (config.features?.supported_models) {
            setAvailableModels(config.features.supported_models);
        }
        // Load Inference Config
        if (config.mode_inference_config) {
            setInference(config.mode_inference_config);
        }
    }, [config.mode_pricing_config, config.features, config.mode_inference_config]);

    // Handle Mode Changes
    const handleModeChange = (mode, field, value) => {
        setPricing(prev => ({
            ...prev,
            [mode]: { ...prev[mode], [field]: value }
        }));
    };

    // Handle Model Price Changes
    const handleModelPriceChange = (model, value) => {
        setModelPrices(prev => ({
            ...prev,
            [model]: parseFloat(value)
        }));
    };

    // Handle Inference Changes
    const handleInferenceChange = (mode, field, value) => {
        setInference(prev => ({
            ...prev,
            [mode]: { ...prev[mode] || {}, [field]: value }
        }));
    };

    const handleSave = async () => {
        await actions.updateSystemConfig('mode_pricing_config', pricing);
        await actions.updateSystemConfig('model_pricing', modelPrices);
        await actions.updateSystemConfig('mode_inference_config', inference);
        alert("Pricing & AI Configuration Saved!");
    };

    const modes = [
        { id: 'advice', label: 'Legal Advice (Chat)', icon: <FaComments /> },
        { id: 'draft', label: 'Drafting Engine', icon: <FaPenFancy /> },
        { id: 'risk_check', label: 'Risk Audit', icon: <FaShieldAlt /> },
        { id: 'draft_analysis', label: 'Draft Analysis', icon: <FaClipboardList /> },
        { id: 'compare', label: 'Comparison', icon: <FaLayerGroup /> }
    ];

    return (
        <div className="space-y-8">
            {/* --- SECTION 1: MODEL BASE RATES --- */}
            <div className={styles.card}>
                <div className={styles.cardTitle}>
                    <FaCloud className="inline mr-2" />
                    AI Model Base Rates (Per Token)
                </div>
                <p className="text-gray-500 mb-6">Set the base cost per token for each AI model. This applies when "Per Token" billing is used without a specific override.</p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {availableModels.length > 0 ? availableModels.map(model => (
                        <div key={model} className="bg-gray-800 p-4 rounded border border-gray-700">
                            <label className="text-gray-400 text-xs uppercase block mb-1 font-bold">{model}</label>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">₹</span>
                                <input
                                    type="number"
                                    step="0.000001"
                                    className="w-full bg-gray-900 border border-gray-600 text-white pl-6 pr-3 py-2 rounded focus:border-blue-500 outline-none font-mono"
                                    placeholder="0.0000"
                                    value={modelPrices[model] !== undefined ? modelPrices[model] : ''}
                                    onChange={(e) => handleModelPriceChange(model, e.target.value)}
                                />
                            </div>
                        </div>
                    )) : (
                        <div className="text-gray-500 italic">No AI models configured in System Config.</div>
                    )}
                </div>
            </div>

            {/* --- SECTION 2: FEATURE MODES --- */}
            <div className={styles.card}>
                <div className={styles.cardTitle}>
                    <FaCreditCard className="inline mr-2" />
                    Feature Access & Mode Pricing
                </div>
                <p className="text-gray-500 mb-6">Configure specific billing strategies for each application mode. Fixed prices override token rates.</p>

                <div className="grid grid-cols-1 gap-6">
                    {modes.map(mode => (
                        <div key={mode.id} className={`bg-gray-800 p-5 rounded-xl border transition-all ${pricing[mode.id]?.disabled ? 'border-red-900 opacity-70' : 'border-gray-700'}`}>
                            <div className="flex flex-col md:flex-row items-center justify-between gap-6">

                                {/* Header & Feature Toggle */}
                                <div className="flex items-center gap-4 flex-1">
                                    <div className={`p-3 rounded-lg ${pricing[mode.id]?.disabled ? 'bg-red-900/20 text-red-500' : 'bg-blue-600/20 text-blue-400'}`}>
                                        {mode.icon}
                                    </div>
                                    <div>
                                        <h3 className="text-white font-bold flex items-center gap-2">
                                            {mode.label}
                                            {pricing[mode.id]?.disabled && <span className="text-[10px] bg-red-600 text-white px-2 py-0.5 rounded">DISABLED</span>}
                                        </h3>
                                        <div className="text-xs text-gray-500 font-mono mt-1">ID: {mode.id}</div>
                                    </div>
                                </div>

                                {/* Controls */}
                                <div className="flex flex-col md:flex-row items-center gap-6">

                                    {/* Feature Switch */}
                                    <div className="flex flex-col items-center">
                                        <label className="text-[10px] text-gray-500 uppercase font-bold mb-2">Availability</label>
                                        <label className="relative inline-flex items-center cursor-pointer">
                                            <input
                                                type="checkbox"
                                                className="sr-only peer"
                                                checked={!pricing[mode.id]?.disabled}
                                                onChange={(e) => handleModeChange(mode.id, 'disabled', !e.target.checked)}
                                            />
                                            <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                                        </label>
                                    </div>

                                    <div className="h-8 w-[1px] bg-gray-700 hidden md:block"></div>

                                    {/* Pricing Strategy */}
                                    <div className={`flex flex-col items-center gap-2 ${pricing[mode.id]?.disabled ? 'pointer-events-none opacity-50' : ''}`}>
                                        <label className="text-[10px] text-gray-500 uppercase font-bold">Billing Strategy</label>

                                        <div className="flex items-center gap-3">
                                            <div className="flex items-center bg-gray-900 rounded-lg p-1 border border-gray-700">
                                                <button
                                                    className={`px-3 py-1.5 rounded text-xs font-bold transition-all ${pricing[mode.id]?.type === 'token' ? 'bg-blue-600 text-white shadow' : 'text-gray-500 hover:text-gray-300'}`}
                                                    onClick={() => handleModeChange(mode.id, 'type', 'token')}
                                                >
                                                    Per Token
                                                </button>
                                                <button
                                                    className={`px-3 py-1.5 rounded text-xs font-bold transition-all ${pricing[mode.id]?.type === 'fixed' ? 'bg-purple-600 text-white shadow' : 'text-gray-500 hover:text-gray-300'}`}
                                                    onClick={() => handleModeChange(mode.id, 'type', 'fixed')}
                                                >
                                                    Fixed Price
                                                </button>
                                            </div>

                                            <div className="relative group">
                                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-mono">₹</span>
                                                <input
                                                    type="number"
                                                    className="bg-gray-900 border border-gray-600 text-white pl-6 pr-3 py-1.5 rounded w-28 outline-none focus:border-blue-500 font-mono font-bold text-right"
                                                    value={pricing[mode.id]?.price || 0}
                                                    step={pricing[mode.id]?.type === 'token' ? "0.00001" : "1"}
                                                    onChange={(e) => handleModeChange(mode.id, 'price', e.target.value)}
                                                />
                                                <div className="absolute -bottom-5 right-0 text-[9px] text-gray-500 hidden group-hover:block whitespace-nowrap bg-black p-1 rounded border border-gray-700">
                                                    {pricing[mode.id]?.type === 'token'
                                                        ? 'Multiplier (Set 1.0 for Base Rate)'
                                                        : 'Flat Fee (Total cost per request)'}
                                                </div>
                                            </div>
                                        </div>
                                        {pricing[mode.id]?.type === 'token' && (
                                            <div className="text-[10px] text-gray-400">
                                                (Uses Model Rate × {pricing[mode.id]?.price || 1})
                                            </div>
                                        )}
                                    </div>

                                    <div className="h-8 w-[1px] bg-gray-700 hidden md:block"></div>

                                    {/* AI Inference Config */}
                                    <div className={`flex flex-col items-center gap-2 ${pricing[mode.id]?.disabled ? 'pointer-events-none opacity-50' : ''}`}>
                                        <label className="text-[10px] text-gray-500 uppercase font-bold flex items-center gap-1"><FaBrain /> AI Core Config</label>
                                        <div className="flex items-center gap-2">
                                            {/* Temperature */}
                                            <div className="bg-gray-900 p-1.5 rounded border border-gray-700 flex flex-col w-20">
                                                <label className="text-[8px] text-gray-400 uppercase">Creativity</label>
                                                <input
                                                    type="number"
                                                    min="0" max="1" step="0.1"
                                                    className="bg-transparent text-white text-xs font-mono outline-none w-full"
                                                    value={inference[mode.id]?.temperature ?? 0.2}
                                                    onChange={(e) => handleInferenceChange(mode.id, 'temperature', e.target.value)}
                                                />
                                            </div>
                                            {/* Model Override */}
                                            <div className="bg-gray-900 p-1.5 rounded border border-gray-700 flex flex-col w-32">
                                                <label className="text-[8px] text-gray-400 uppercase">Model Override</label>
                                                <select
                                                    className="bg-transparent text-white text-xs outline-none w-full cursor-pointer"
                                                    value={inference[mode.id]?.model || ""}
                                                    onChange={(e) => handleInferenceChange(mode.id, 'model', e.target.value)}
                                                >
                                                    <option value="">User Default</option>
                                                    {availableModels.map(m => <option key={m} value={m}>{m}</option>)}
                                                </select>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="mt-8 pt-6 border-t border-gray-700 flex justify-end">
                    <button
                        onClick={handleSave}
                        className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 px-8 rounded-xl shadow-lg transform hover:scale-105 transition-all flex items-center gap-2"
                    >
                        <FaLock /> Update System
                    </button>
                </div>
            </div>
        </div>
    );
};

const CouponsTab = () => {
    const { config, actions } = useAdmin();

    const handleCreate = async (e) => {
        e.preventDefault();
        const code = e.target.code.value;
        const discountValue = e.target.discountValue.value;
        const discountType = e.target.discountType.value;
        const expiryDate = e.target.expiryDate.value;

        await actions.createCoupon({
            code,
            discountValue: Number(discountValue),
            discountType,
            expiryDate,
            usageLimit: 100
        });
        e.target.reset();
    };

    return (
        <div className={styles.card}>
            <div className={styles.cardTitle}>Coupon Management</div>
            <div className="text-gray-500 mb-4">Manage discount codes for subscriptions.</div>
            <div className="space-y-4">
                {config.coupons?.map(c => (
                    <div key={c._id} className="bg-gray-800 p-3 rounded flex justify-between border border-gray-700">
                        <div>
                            <span className="text-green-400 font-mono font-bold mr-2">{c.code}</span>
                            <span className="text-gray-400 text-sm">
                                ({c.discountType === 'flat' ? '₹' : ''}{c.discountValue}{c.discountType === 'percentage' ? '%' : ''} OFF)
                            </span>
                            <span className="text-xs text-gray-500 ml-3">
                                Expires: {new Date(c.expiryDate).toLocaleDateString()}
                            </span>
                        </div>
                        <button onClick={() => actions.deleteCoupon(c._id)} className="text-red-500 hover:text-white">&times;</button>
                    </div>
                ))}

                <div className="mt-4 pt-4 border-t border-gray-700">
                    <h4 className="text-sm font-bold text-white mb-2">Create New Coupon</h4>
                    <form onSubmit={handleCreate} className="flex gap-2 flex-wrap items-end">
                        <div className="flex-1 min-w-[150px]">
                            <label className="text-xs text-gray-500 block mb-1">Code</label>
                            <input name="code" placeholder="SAVE20" className="w-full bg-gray-700 text-white p-2 rounded" required />
                        </div>
                        <div className="w-24">
                            <label className="text-xs text-gray-500 block mb-1">Type</label>
                            <select name="discountType" className="w-full bg-gray-700 text-white p-2 rounded">
                                <option value="percentage">%</option>
                                <option value="flat">Flat (₹)</option>
                            </select>
                        </div>
                        <div className="w-24">
                            <label className="text-xs text-gray-500 block mb-1">Value</label>
                            <input name="discountValue" type="number" placeholder="20" className="w-full bg-gray-700 text-white p-2 rounded" required />
                        </div>
                        <div className="w-32">
                            <label className="text-xs text-gray-500 block mb-1">Expiry</label>
                            <input name="expiryDate" type="date" className="w-full bg-gray-700 text-white p-2 rounded" required />
                        </div>
                        <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded h-[42px]">Add</button>
                    </form>
                </div>
            </div>
        </div>
    );
};

// --- MAIN COMPONENT ---

const AdminPanel = () => {
    const { isAdmin, config, actions, checkAdminStatus } = useAdmin();
    const [activeTab, setActiveTab] = useState('users');
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    const navigate = useNavigate();

    // --- Effects ---
    useEffect(() => {
        if (!isAdmin) return;
        if (activeTab === 'users') actions.fetchUsers();
        if (activeTab === 'features' || activeTab === 'models' || activeTab === 'pricing') actions.fetchSystemConfig();
        if (activeTab === 'logs') actions.fetchLogs();
        if (activeTab === 'feedback') actions.fetchFeedbacks();
        if (activeTab === 'coupons') actions.fetchCoupons();
        if (activeTab === 'templates') actions.fetchTemplates();
        if (activeTab === 'finance') checkAdminStatus(); // Refresh stats for finance
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeTab, isAdmin]);

    // Splash Component
    const [showSplash, setShowSplash] = useState(true);

    // Splash Timer
    useEffect(() => {
        if (isAdmin) {
            const timer = setTimeout(() => setShowSplash(false), 2400);
            return () => clearTimeout(timer);
        }
    }, [isAdmin]);

    if (isAdmin && showSplash) {
        return (
            <div className="fixed inset-0 z-50 bg-black flex flex-col items-center justify-center font-mono">
                <div className="animate-pulse flex flex-col items-center">
                    <FaShieldAlt className="text-6xl text-blue-500 mb-6 animate-bounce" />
                    <h1 className="text-4xl md:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 tracking-widest uppercase mb-4">
                        LexAI Admin
                    </h1>
                    <div className="h-1 w-64 bg-gray-800 rounded overflow-hidden">
                        <div className="h-full bg-blue-500 animate-[width_2.4s_linear_forwards]" style={{ width: '0%' }}></div>
                    </div>
                    <p className="text-gray-500 mt-4 text-xs tracking-[0.5em] animate-pulse">ESTABLISHING SECURE CONNECTION...</p>
                </div>
            </div>
        );
    }

    if (!isAdmin) {
        return <AdminLoginScreen />;
    }

    return (
        <div className={styles.adminContainer}>
            {/* Sidebar */}
            <div className={`${styles.sidebar} ${isMobileMenuOpen ? styles.mobileOpen : ''}`}>
                <div className={styles.sidebarHeader}>
                    <FaShieldAlt className="text-4xl text-blue-500 animate-pulse" />
                    <span className="text-2xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">
                        LEX.ADMIN
                    </span>
                </div>

                <nav className="flex flex-col w-full gap-1">
                    <button className={`${styles.navItem} ${activeTab === 'dashboard' ? styles.navItemActive : ''}`} onClick={() => { setActiveTab('dashboard'); setIsMobileMenuOpen(false); }}>
                        <FaCloud /> OVERVIEW
                    </button>
                    <button className={`${styles.navItem} ${activeTab === 'notifications' ? styles.navItemActive : ''}`} onClick={() => { setActiveTab('notifications'); setIsMobileMenuOpen(false); }}>
                        <FaBell /> NOTIFICATIONS
                    </button>
                    <button className={`${styles.navItem} ${activeTab === 'users' ? styles.navItemActive : ''}`} onClick={() => { setActiveTab('users'); setIsMobileMenuOpen(false); }}>
                        <FaUsers /> USER BASE
                    </button>
                    <button className={`${styles.navItem} ${activeTab === 'finance' ? styles.navItemActive : ''}`} onClick={() => { setActiveTab('finance'); setIsMobileMenuOpen(false); }}>
                        <FaMoneyBillWave /> FINANCE
                    </button>
                    <button className={`${styles.navItem} ${activeTab === 'models' ? styles.navItemActive : ''}`} onClick={() => { setActiveTab('models'); setIsMobileMenuOpen(false); }}>
                        <FaLayerGroup /> AI MODELS
                    </button>
                    <button className={`${styles.navItem} ${activeTab === 'pricing' ? styles.navItemActive : ''}`} onClick={() => { setActiveTab('pricing'); setIsMobileMenuOpen(false); }}>
                        <FaCreditCard /> PRICING
                    </button>
                    <button className={`${styles.navItem} ${activeTab === 'prompts' ? styles.navItemActive : ''}`} onClick={() => { setActiveTab('prompts'); setIsMobileMenuOpen(false); }}>
                        <FaBrain /> AI BRAIN
                    </button>
                    <button className={`${styles.navItem} ${activeTab === 'cloud' ? styles.navItemActive : ''}`} onClick={() => { setActiveTab('cloud'); setIsMobileMenuOpen(false); }}>
                        <FaCloud /> VERTEX AI
                    </button>
                    <button className={`${styles.navItem} ${activeTab === 'features' ? styles.navItemActive : ''}`} onClick={() => { setActiveTab('features'); setIsMobileMenuOpen(false); }}>
                        <FaCogs /> SYSTEM CONFIG
                    </button>
                    <button className={`${styles.navItem} ${activeTab === 'env' ? styles.navItemActive : ''}`} onClick={() => { setActiveTab('env'); setIsMobileMenuOpen(false); }}>
                        <FaKey /> ENV VARIABLES
                    </button>
                    <button className={`${styles.navItem} ${activeTab === 'logs' ? styles.navItemActive : ''}`} onClick={() => { setActiveTab('logs'); setIsMobileMenuOpen(false); }}>
                        <FaClipboardList /> SECURITY LOGS
                    </button>
                    <button className={`${styles.navItem} ${activeTab === 'feedback' ? styles.navItemActive : ''}`} onClick={() => { setActiveTab('feedback'); setIsMobileMenuOpen(false); }}>
                        <FaComments /> FEEDBACK LOOP
                    </button>
                    <button className={`${styles.navItem} ${activeTab === 'coupons' ? styles.navItemActive : ''}`} onClick={() => { setActiveTab('coupons'); setIsMobileMenuOpen(false); }}>
                        <FaTicketAlt /> COUPONS
                    </button>
                    <button className={`${styles.navItem} ${activeTab === 'templates' ? styles.navItemActive : ''}`} onClick={() => { setActiveTab('templates'); setIsMobileMenuOpen(false); }}>
                        <FaFileContract /> TEMPLATES
                    </button>
                    <button className={`${styles.navItem} ${activeTab === 'knowledge' ? styles.navItemActive : ''}`} onClick={() => { setActiveTab('knowledge'); setIsMobileMenuOpen(false); }}>
                        <FaBook /> KNOWLEDGE
                    </button>
                    <button className={`${styles.navItem} ${activeTab === 'support' ? styles.navItemActive : ''}`} onClick={() => { setActiveTab('support'); setIsMobileMenuOpen(false); }}>
                        <FaHeadset /> SUPPORT
                    </button>
                </nav>

                <div className="mt-8 pt-8 border-t border-gray-800">
                    <button onClick={() => navigate('/')} className={styles.logoutBtn}>
                        <FaSignOutAlt /> EXIT CONSOLE
                    </button>
                </div>
            </div>

            {/* Mobile Toggle */}
            <button className={styles.mobileToggle} onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
                ☰
            </button>

            {/* Main Content */}
            <div className={styles.content}>
                <div className="mb-8 flex justify-between items-end">
                    <div>
                        <h2 className="text-3xl font-black text-white mb-2 uppercase tracking-wide">
                            {activeTab} PANEL
                        </h2>
                        <p className="text-gray-500 text-sm font-mono">
                            SESSION ID: {Math.random().toString(36).substring(7).toUpperCase()} • LATENCY: 24ms
                        </p>
                    </div>
                </div>

                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                    {activeTab === 'dashboard' && <DashboardTab />}
                    {activeTab === 'notifications' && <NotificationsTab />}
                    {activeTab === 'users' && <UsersTab />}
                    {activeTab === 'finance' && <FinanceTab />}
                    {activeTab === 'models' && <ModelsTab />}
                    {activeTab === 'pricing' && <PricingTab />}
                    {activeTab === 'logs' && <LogsTab />}
                    {activeTab === 'env' && <EnvTab />}
                    {activeTab === 'prompts' && <PromptsTab />}
                    {activeTab === 'features' && <FeaturesTab />}

                    {activeTab === 'feedback' && <FeedbackTab />}
                    {activeTab === 'coupons' && <CouponsTab />}
                    {activeTab === 'cloud' && <CloudTab />}
                    {activeTab === 'knowledge' && <KnowledgeTab />}
                    {activeTab === 'support' && <SupportTab />}
                    {activeTab === 'templates' && (
                        <div className={styles.card}>
                            <div className={styles.cardTitle}>Legal Templates Library</div>
                            <div className="text-gray-500 mb-6">Create and manage standard legal documents for users.</div>

                            <div className="space-y-4">
                                {config.templates?.map(t => (
                                    <div key={t._id} className="bg-gray-800 p-4 rounded border border-gray-700 flex justify-between items-start">
                                        <div>
                                            <h4 className="text-white font-bold">{t.title}</h4>
                                            <span className="text-xs bg-gray-700 px-2 py-1 rounded text-gray-300 mr-2">{t.category}</span>
                                            {t.isPremium && <span className="text-xs bg-yellow-600/20 text-yellow-400 px-2 py-1 rounded border border-yellow-600/50">PREMIUM</span>}
                                            <p className="text-gray-400 text-sm mt-2 line-clamp-2">{t.content}</p>
                                        </div>
                                        <button onClick={() => { if (window.confirm('Delete template?')) actions.deleteTemplate(t._id) }} className="text-gray-500 hover:text-red-500 p-2">
                                            <FaTrash />
                                        </button>
                                    </div>
                                ))}

                                {!config.templates?.length && <div className="text-center text-gray-500 py-8">No templates found. Create one below.</div>}

                                <div className="mt-8 pt-6 border-t border-gray-700">
                                    <h3 className="text-white font-bold mb-4">Add New Template</h3>
                                    <form onSubmit={async (e) => {
                                        e.preventDefault();
                                        const formData = new FormData(e.target);
                                        const data = {
                                            title: formData.get('title'),
                                            category: formData.get('category'),
                                            content: formData.get('content'),
                                            isPremium: formData.get('isPremium') === 'on'
                                        };
                                        const success = await actions.createTemplate(data);
                                        if (success) { alert("Template Created"); e.target.reset(); }
                                        else alert("Failed to create template");
                                    }} className="space-y-3">
                                        <div className="grid grid-cols-2 gap-3">
                                            <input name="title" placeholder="Template Title (e.g. Rent Agreement)" className="bg-gray-900 border border-gray-700 text-white p-3 rounded" required />
                                            <input name="category" placeholder="Category (e.g. Contracts)" className="bg-gray-900 border border-gray-700 text-white p-3 rounded" required />
                                        </div>
                                        <textarea name="content" placeholder="Content (Markdown/Text). Use {{variables}} for dynamic fields in future versions." className="w-full h-32 bg-gray-900 border border-gray-700 text-white p-3 rounded" required />
                                        <div className="flex items-center gap-2">
                                            <input type="checkbox" name="isPremium" id="isPremium" className="w-4 h-4" />
                                            <label htmlFor="isPremium" className="text-gray-300 text-sm">Premium Only (Pro Users)</label>
                                        </div>
                                        <button type="submit" className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2 rounded font-bold">Save Template</button>
                                    </form>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AdminPanel;
