import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FaLock, FaGlobe, FaMoon, FaSun, FaChevronRight, FaSignOutAlt, FaEdit, FaPlus, FaWhatsapp, FaWallet, FaSave } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import './SettingsPage.css';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000/api';

const SettingsPage = () => {
    const navigate = useNavigate();
    const [darkMode, setDarkMode] = useState(true);
    const [notifications, setNotifications] = useState(true);
    const [language, setLanguage] = useState('en');

    // Enhanced State
    const [user, setUser] = useState({ name: '', email: '', avatar: '👨‍⚖️', walletBalance: 0, totalReferrals: 0, referralCode: 'Loading...', subscriptionPlan: 'free' });
    const [showAddFunds, setShowAddFunds] = useState(false);
    const [showAvatarPicker, setShowAvatarPicker] = useState(false);

    // Edit Mode State
    const [isEditing, setIsEditing] = useState(false);
    const [editForm, setEditForm] = useState({});
    const [isLoading, setIsLoading] = useState(false);

    const AVATARS = ['👨‍⚖️', '👩‍⚖️', '⚖️', '🏛️', '💼', '🧞‍♂️', '📜', '🎓'];

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const token = localStorage.getItem('lexai_token');
                if (!token) return;

                const res = await fetch(`${API_BASE_URL}/users/profile`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });

                if (res.ok) {
                    const data = await res.json();
                    const userData = {
                        name: data.username,
                        email: data.email,
                        mobile: data.mobile || '',
                        whatsapp: data.whatsapp || '',
                        profession: data.profession || 'N/A',
                        referralCode: data.referralCode || 'N/A',
                        totalReferrals: data.totalReferrals || 0,
                        walletBalance: data.walletBalance || 0,
                        avatar: data.avatar || '👨‍⚖️',
                        subscriptionPlan: data.subscriptionPlan || 'free'
                    };
                    setUser(userData);
                    setEditForm(userData); // Initialize edit form
                }
            } catch (err) {
                console.error("Failed to load profile", err);
            }
        };

        fetchProfile();
    }, []);

    const handleLogout = () => {
        localStorage.clear();
        navigate('/auth');
    };

    const handleSaveProfile = async () => {
        setIsLoading(true);
        try {
            const token = localStorage.getItem('lexai_token');
            const updates = {
                username: editForm.name, // Mapping 'name' back to 'username' expected by backend?
                profession: editForm.profession,
                mobile: editForm.mobile,
                whatsapp: editForm.whatsapp,
                avatar: editForm.avatar
            };

            const res = await fetch(`${API_BASE_URL}/users/profile`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(updates)
            });

            if (res.ok) {
                setUser({ ...user, ...editForm }); // Update user state with saved data
                setIsEditing(false);
                // Ideally show a success toast here
            } else {
                alert("Failed to update profile");
            }
        } catch (err) {
            console.error("Update failed", err);
            alert("Error updating profile");
        } finally {
            setIsLoading(false);
        }
    };

    const handleCancelEdit = () => {
        setEditForm(user); // Revert to original user data
        setIsEditing(false);
    };

    // Keep the old function for specific partial updates if needed, mostly replaced by save
    const handleUpdateProfile = async (field, value) => {
        // Legacy direct update - leaving it for preference toggles if used elsewhere, 
        // but for profile form we use handleSaveProfile now.
    };

    const handleAddFunds = (amount) => {
        if (window.confirm(`Simulate Payment Gateway: Add ₹${amount} to wallet?`)) {
            // Update wallet balance locally for demo
            const newBalance = parseFloat(user.walletBalance) + amount;

            // In a real app we would call an API here
            setUser(prev => ({ ...prev, walletBalance: newBalance }));
            setShowAddFunds(false);

            // Update backend ideally
            // ...
        }
    };

    const shareReferral = () => {
        const text = `Join LexAI Use my code ${user.referralCode} for credits!`;
        window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
    };

    return (
        <div className="settings-page">
            <div className="settings-container">
                <header className="settings-header">
                    <h1>Settings</h1>
                    <p>Manage your account, wallet & preferences.</p>
                </header>

                <div className="settings-grid">
                    {/* Account Section */}
                    <motion.section
                        className="settings-card"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                    >
                        <div className="profile-header-row">
                            <div className="profile-left">
                                <div className="avatar-wrapper" onClick={() => isEditing && setShowAvatarPicker(!showAvatarPicker)}>
                                    <span className="current-avatar">{isEditing ? (editForm.avatar || user.avatar) : user.avatar}</span>
                                    {isEditing && <div className="edit-badge"><FaEdit /></div>}
                                </div>
                                <div className="profile-titles">
                                    {isEditing ? (
                                        <div className="edit-name-group">
                                            <label className="field-label-mini">Display Name</label>
                                            <input
                                                type="text"
                                                className="input-field highlight-input"
                                                value={editForm.name}
                                                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                                                placeholder="Your Name"
                                            />
                                        </div>
                                    ) : (
                                        <h2>{user.name || 'User'}</h2>
                                    )}
                                    <span className={`plan-badge ${user.subscriptionPlan}`}>{user.subscriptionPlan ? user.subscriptionPlan.toUpperCase() : 'FREE'} PLAN</span>
                                </div>
                            </div>

                            <div className="profile-actions">
                                {!isEditing ? (
                                    <button className="edit-profile-btn" onClick={() => { setEditForm(user); setIsEditing(true); }}>
                                        <FaEdit /> Edit Profile
                                    </button>
                                ) : (
                                    <div className="action-buttons">
                                        <button className="cancel-btn" onClick={handleCancelEdit}>Cancel</button>
                                        <button className="save-btn" onClick={handleSaveProfile} disabled={isLoading}>
                                            {isLoading ? 'Saving...' : <><FaSave /> Save Changes</>}
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>

                        {showAvatarPicker && isEditing && (
                            <motion.div
                                className="avatar-picker-grid"
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                            >
                                {AVATARS.map(av => (
                                    <button key={av} onClick={() => { setEditForm({ ...editForm, avatar: av }); setShowAvatarPicker(false); }} className="avatar-option">
                                        {av}
                                    </button>
                                ))}
                            </motion.div>
                        )}

                        {/* Highlights Grid */}
                        <div className="highlights-grid">
                            <div className="highlight-box green">
                                <span className="label">Wallet Balance</span>
                                <span className="value">₹{parseFloat(user.walletBalance).toFixed(2)}</span>
                                <button className="mini-action-btn" onClick={() => setShowAddFunds(true)}><FaPlus /> Add Funds</button>
                            </div>
                            <div className="highlight-box">
                                <span className="label">Referrals</span>
                                <span className="value">{user.totalReferrals}</span>
                                <span className="sub-text">Earn ₹20/referral</span>
                            </div>
                            <div className="highlight-box blue">
                                <span className="label">Your Code</span>
                                <span className="value copy-text" onClick={() => navigator.clipboard.writeText(user.referralCode)}>{user.referralCode}</span>
                                <button className="mini-action-btn" onClick={shareReferral}><FaWhatsapp /> Share</button>
                            </div>
                        </div>

                        {/* Add Funds Modal Simulation */}
                        {showAddFunds && (
                            <div className="modal-overlay">
                                <motion.div className="lex-modal" initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
                                    <h3><FaWallet /> Add Funds</h3>
                                    <p>Select an amount to recharge.</p>
                                    <div className="amount-grid">
                                        <button className="amt-btn" onClick={() => handleAddFunds(100)}>₹100</button>
                                        <button className="amt-btn" onClick={() => handleAddFunds(500)}>₹500</button>
                                        <button className="amt-btn" onClick={() => handleAddFunds(1000)}>₹1000</button>
                                    </div>
                                    <button className="close-modal" onClick={() => setShowAddFunds(false)}>Cancel</button>
                                </motion.div>
                            </div>
                        )}

                        <div className="fields-container">
                            <div className="grid-split">
                                <div className="setting-item">
                                    <label>Professional Role</label>
                                    {isEditing ? (
                                        <input
                                            type="text"
                                            value={editForm.profession}
                                            onChange={(e) => setEditForm({ ...editForm, profession: e.target.value })}
                                            className="input-field"
                                            placeholder="e.g. Senior Lawyer"
                                        />
                                    ) : (
                                        <div className="value-display">{user.profession}</div>
                                    )}
                                </div>
                                <div className="setting-item">
                                    <label>Email Address</label>
                                    {/* Email is typically immutable or requires distinct flow */}
                                    <div className="value-display disabled">{user.email} <FaLock className="lock-icon" /></div>
                                </div>
                            </div>

                            <div className="grid-split">
                                <div className="setting-item">
                                    <label>Mobile Number</label>
                                    {isEditing ? (
                                        <input
                                            type="text"
                                            value={editForm.mobile}
                                            onChange={(e) => setEditForm({ ...editForm, mobile: e.target.value })}
                                            className="input-field"
                                            placeholder="+91..."
                                        />
                                    ) : (
                                        <div className="value-display">{user.mobile || 'Not Set'}</div>
                                    )}
                                </div>
                                <div className="setting-item">
                                    <label>WhatsApp Number</label>
                                    {isEditing ? (
                                        <input
                                            type="text"
                                            value={editForm.whatsapp}
                                            onChange={(e) => setEditForm({ ...editForm, whatsapp: e.target.value })}
                                            className="input-field"
                                            placeholder="+91..."
                                        />
                                    ) : (
                                        <div className="value-display">{user.whatsapp || 'Not Set'}</div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </motion.section>

                    {/* Preferences Section */}
                    <motion.section
                        className="settings-card"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                    >
                        <h2><FaGlobe /> Preferences</h2>

                        <div className="setting-row">
                            <div className="setting-info">
                                <span>Dark Mode</span>
                                <small>Switch between dark and light themes</small>
                            </div>
                            <button className="toggle-btn" onClick={() => setDarkMode(!darkMode)}>
                                {darkMode ? <FaMoon /> : <FaSun />}
                            </button>
                        </div>

                        <div className="setting-row">
                            <div className="setting-info">
                                <span>Notifications</span>
                                <small>Receive updates about legal news</small>
                            </div>
                            <div className={`switch ${notifications ? 'on' : 'off'}`} onClick={() => setNotifications(!notifications)}>
                                <div className="slider"></div>
                            </div>
                        </div>

                        <div className="setting-item">
                            <label>Language</label>
                            <select value={language} onChange={(e) => setLanguage(e.target.value)} className="select-field">
                                <option value="en">English (US)</option>
                                <option value="hi">Hindi</option>
                                <option value="es">Spanish</option>
                            </select>
                        </div>
                    </motion.section>

                    {/* Security Section */}
                    <motion.section
                        className="settings-card"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                    >
                        <h2><FaLock /> Security</h2>

                        <div className="setting-row hoverable" onClick={() => navigate('/change-password')}>
                            <div className="setting-info">
                                <span>Change Password</span>
                                <small>Update your login password</small>
                            </div>
                            <FaChevronRight />
                        </div>

                        <div className="setting-row hoverable danger-zone">
                            <div className="setting-info">
                                <span>Log Out</span>
                                <small>Sign out of this device</small>
                            </div>
                            <button className="btn-danger-text" onClick={handleLogout}><FaSignOutAlt /></button>
                        </div>
                    </motion.section>
                </div>
            </div>
        </div>
    );
};

export default SettingsPage;
