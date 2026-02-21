import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaUser, FaLock, FaEnvelope, FaMobileAlt, FaArrowRight, FaShieldAlt, FaBriefcase, FaEye, FaEyeSlash, FaWhatsapp, FaKey, FaArrowLeft } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import './AuthPage.css';

const AuthPage = () => {
    const [view, setView] = useState('login'); // 'login', 'register', 'forgot'
    const [useOtp, setUseOtp] = useState(false); // Restored OTP toggle
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [successMsg, setSuccessMsg] = useState('');

    const navigate = useNavigate();
    const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000/api';

    const [formData, setFormData] = useState({
        username: '',
        password: '',
        email: '',
        whatsapp: '',
        mobile: '',
        otp: '',
        newPassword: '',
        profession: '',
        otherProfession: '',
        referralCode: '', // Added Referral Code
        termsAgreed: false,
    });

    const handleChange = (e) => {
        const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
        setFormData({ ...formData, [e.target.name]: value });
        setError(''); // Clear error on typing
    };

    const triggerError = (msg) => {
        setError(msg);
        setTimeout(() => setError(''), 4000);
    };

    const triggerSuccess = (msg) => {
        setSuccessMsg(msg);
        setTimeout(() => setSuccessMsg(''), 4000);
    };

    // --- API HANDLERS ---

    const handleGenerateOtp = async () => {
        if (!formData.username) return triggerError("Please enter your Username first.");
        setLoading(true);
        try {
            const res = await fetch(`${API_URL}/auth/otp/generate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username: formData.username })
            });
            const data = await res.json();
            if (res.ok) triggerSuccess("OTP sent to your registered mobile/terminal.");
            else triggerError(data.error || "Failed to send OTP.");
        } catch (e) {
            triggerError("Network error: Unable to reach server.");
        } finally {
            setLoading(false);
        }
    };

    const handleRegister = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const body = {
                username: formData.username,
                email: formData.email,
                mobile: formData.mobile,
                whatsapp: formData.whatsapp,
                profession: formData.profession,
                password: formData.password,
                referralCode: formData.referralCode, // Pass to backend
                termsAgreed: formData.termsAgreed ? 'true' : 'false'
            };
            if (formData.profession === 'other') body.professionOther = formData.otherProfession;

            const res = await fetch(`${API_URL}/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });
            const data = await res.json();

            if (!res.ok) {
                let msg = data.message || data.error || 'Registration failed';
                if (data.errors) msg = data.errors.map(err => err.msg).join(', ');
                throw new Error(msg);
            }

            triggerSuccess("Registration Successful! Please Login.");
            setView('login');
            // reset critical fields
            setFormData(prev => ({ ...prev, password: '', otp: '' }));
        } catch (err) {
            triggerError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            // Login Body based on method
            const body = useOtp
                ? { username: formData.username, otp: formData.otp }
                : { username: formData.username, password: formData.password };

            const res = await fetch(`${API_URL}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });
            const data = await res.json();

            if (!res.ok) throw new Error(data.message || data.error || 'Login failed');

            localStorage.setItem('lexai_token', data.token);
            localStorage.setItem('lexai_userid', data.userId);

            // 2. Fetch Full Profile for Access Control
            const profileRes = await fetch(`${API_URL}/users/profile`, {
                headers: { 'Authorization': `Bearer ${data.token}` }
            });

            if (profileRes.ok) {
                const profileData = await profileRes.json();
                localStorage.setItem('lexai_user_info', JSON.stringify({
                    username: profileData.username,
                    profession: profileData.profession,
                    role: profileData.role,
                    subscriptionPlan: profileData.subscriptionPlan,
                    avatar: profileData.avatar
                }));
                localStorage.setItem('lexai_username', profileData.username);
            } else {
                // Fallback if profile fetch fails (though it shouldn't)
                localStorage.setItem('lexai_username', data.username || formData.username);
            }

            navigate('/');
        } catch (err) {
            triggerError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleResetPassword = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await fetch(`${API_URL}/auth/password/reset`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    username: formData.username,
                    otp: formData.otp,
                    newPassword: formData.newPassword
                })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || "Reset failed");

            triggerSuccess("Password Reset Successfully! Please Login.");
            setView('login');
            setFormData(prev => ({ ...prev, password: '', newPassword: '', otp: '' }));
        } catch (err) {
            triggerError(err.message);
        } finally {
            setLoading(false);
        }
    };

    // --- RENDER HELPERS ---

    const renderHeader = () => (
        <div className="auth-header">
            <div className="logo-wrapper">
                <FaShieldAlt className="logo-icon" />
            </div>
            <h2>LexAI Portal</h2>
            <p className="fade-in">
                {view === 'login' && 'Secure Professional Access'}
                {view === 'register' && 'Initialize New Counsel'}
                {view === 'forgot' && 'Account Recovery Protocol'}
            </p>
        </div>
    );

    return (
        <div className="auth-container">
            <div className="auth-background">
                <div className="blob blob-1"></div>
                <div className="blob blob-2"></div>
                <div className="blob blob-3"></div>
            </div>

            <motion.div
                className="auth-card"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
            >
                {renderHeader()}

                <AnimatePresence>
                    {error && (
                        <motion.div className="error-msg" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                            {error}
                        </motion.div>
                    )}
                    {successMsg && (
                        <motion.div className="success-msg" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                            {successMsg}
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* VIEW TABS (Login/Register only) */}
                {view !== 'forgot' && (
                    <div className="auth-tabs">
                        <button className={view === 'login' ? 'active' : ''} onClick={() => setView('login')}>Login</button>
                        <button className={view === 'register' ? 'active' : ''} onClick={() => setView('register')}>Register</button>
                    </div>
                )}

                <form onSubmit={view === 'login' ? handleLogin : (view === 'register' ? handleRegister : handleResetPassword)}>
                    <AnimatePresence mode="wait">

                        {/* --- COMMON: USERNAME --- */}
                        <motion.div key="username" className="input-group" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                            <FaUser className="input-icon" />
                            <input
                                type="text" name="username" placeholder="Username / Bar ID"
                                value={formData.username} onChange={handleChange} required
                            />
                        </motion.div>

                        {/* --- REGISTER VIEW --- */}
                        {view === 'register' && (
                            <motion.div key="reg-fields" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
                                <div className="input-group">
                                    <FaEnvelope className="input-icon" />
                                    <input type="email" name="email" placeholder="Official Email" value={formData.email} onChange={handleChange} required />
                                </div>
                                <div className="row-group">
                                    <div className="input-group">
                                        <FaMobileAlt className="input-icon" />
                                        <input type="text" name="mobile" placeholder="Mobile No." value={formData.mobile} onChange={handleChange} required />
                                    </div>
                                    <div className="input-group">
                                        <FaWhatsapp className="input-icon" />
                                        <input type="text" name="whatsapp" placeholder="WhatsApp No." value={formData.whatsapp} onChange={handleChange} required />
                                    </div>
                                </div>
                                <div className="input-group">
                                    <FaBriefcase className="input-icon" />
                                    <select name="profession" value={formData.profession} onChange={handleChange} required className="auth-select">
                                        <option value="" disabled>Select Profession</option>
                                        <option value="lawyer">Advocate / Lawyer</option>
                                        <option value="lekhpal">Lekhpal / Revenue Officer</option>
                                        <option value="csc user">CSC Operator</option>
                                        <option value="individual">Citizen / Individual</option>
                                        <option value="other">Other Legal Professional</option>
                                    </select>
                                </div>
                                {formData.profession === 'other' && (
                                    <div className="input-group">
                                        <input type="text" name="otherProfession" placeholder="Specify Profession" value={formData.otherProfession} onChange={handleChange} required />
                                    </div>
                                )}
                                <div className="input-group">
                                    <FaBriefcase className="input-icon" />
                                    <input type="text" name="referralCode" placeholder="Referral Code (Optional)" value={formData.referralCode} onChange={handleChange} />
                                </div>
                            </motion.div>
                        )}

                        {view === 'login' && (
                            <motion.div key="login-fields" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                                {useOtp ? (
                                    <div className="input-group otp-group">
                                        <input type="text" name="otp" placeholder="Enter OTP" value={formData.otp} onChange={handleChange} required />
                                        <button type="button" onClick={handleGenerateOtp} className="otp-btn">Send OTP</button>
                                    </div>
                                ) : (
                                    <div className="input-group">
                                        <FaLock className="input-icon" />
                                        <input type={showPassword ? "text" : "password"} name="password" placeholder="Secure Password" value={formData.password} onChange={handleChange} required />
                                        <button type="button" className="password-toggle" onClick={() => setShowPassword(!showPassword)}>
                                            {showPassword ? <FaEyeSlash /> : <FaEye />}
                                        </button>
                                    </div>
                                )}
                            </motion.div>
                        )}

                        {/* --- FORGOT PASSWORD VIEW --- */}
                        {view === 'forgot' && (
                            <motion.div key="forgot-fields" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                                <div className="input-group otp-group" style={{ marginBottom: '15px' }}>
                                    <input type="text" name="otp" placeholder="Enter Received OTP" value={formData.otp} onChange={handleChange} required />
                                    <button type="button" onClick={handleGenerateOtp} className="otp-btn">Get OTP</button>
                                </div>
                                <div className="input-group">
                                    <FaKey className="input-icon" />
                                    <input type="password" name="newPassword" placeholder="New Password" value={formData.newPassword} onChange={handleChange} required />
                                </div>
                            </motion.div>
                        )}

                        {/* --- FOOTER ACTIONS --- */}
                        <motion.div className="form-footer" layout>
                            {view === 'login' && (
                                <>
                                    <label className="checkbox-wrapper">
                                        <input type="checkbox" checked={useOtp} onChange={() => setUseOtp(!useOtp)} />
                                        <span className="custom-check"></span>
                                        <span>Login via OTP</span>
                                    </label>
                                    <span className="forgot-link" onClick={() => setView('forgot')}>Forgot Password?</span>
                                </>
                            )}
                            {view === 'register' && (
                                <label className="checkbox-wrapper full-width">
                                    <input type="checkbox" name="termsAgreed" checked={formData.termsAgreed} onChange={handleChange} required />
                                    <span className="custom-check"></span>
                                    <span>
                                        I accept the <span style={{ color: '#c5a059', cursor: 'pointer', textDecoration: 'underline' }} onClick={() => window.open('/terms', '_blank')}>Terms</span> & <span style={{ color: '#c5a059', cursor: 'pointer', textDecoration: 'underline' }} onClick={() => window.open('/privacy', '_blank')}>Privacy Policy</span>
                                    </span>
                                </label>
                            )}
                            {view === 'forgot' && (
                                <span className="forgot-link" onClick={() => setView('login')}><FaArrowLeft /> Back to Login</span>
                            )}
                        </motion.div>

                        <motion.button
                            type="submit"
                            className="submit-btn"
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            disabled={loading}
                        >
                            {loading ? <span className="loader"></span> : (
                                view === 'login' ? 'AUTHENTICATE' :
                                    view === 'register' ? 'INITIALIZE ACCOUNT' :
                                        'RESET CREDENTIALS'
                            )}
                            {!loading && <FaArrowRight />}
                        </motion.button>

                    </AnimatePresence>
                </form>
            </motion.div>
        </div>
    );
};

export default AuthPage;
