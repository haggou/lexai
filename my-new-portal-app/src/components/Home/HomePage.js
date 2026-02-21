import React from 'react';
import { motion } from 'framer-motion';
import { FaShieldAlt, FaRobot, FaWallet, FaArrowRight, FaLock } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import './HomePage.css';

const HomePage = () => {
    const navigate = useNavigate();
    const userStr = localStorage.getItem('lexai_user_info');
    const user = userStr ? JSON.parse(userStr) : {};
    const profession = (user.profession || '').toLowerCase();
    const LEGAL_PROFESSIONS = ['lawyer', 'advocate', 'lekhpal', 'judge', 'attorney', 'legal consultant', 'jurist', 'barrister', 'senior counsel', 'solicitor', 'notary'];
    const isLegalPro = LEGAL_PROFESSIONS.some(p => profession.includes(p));
    const userId = localStorage.getItem('lexai_userid');

    const handleProtectedNav = (path) => {
        if (!userId) navigate('/auth');
        else navigate(path);
    };

    return (
        <div className="home-container">
            {/* Navbar Removed - Using Global Navbar */}

            {/* Hero Section */}
            <header className="hero-section">
                <motion.div
                    className="hero-content"
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8 }}
                >
                    <h1>Legal Intelligence,<br /><span className="gradient-text">Reimagined.</span></h1>
                    <p>
                        Your advanced AI companion for legal drafting, research, and analysis.
                        Secure, precise, and powered by next-gen LLMs.
                    </p>

                    <div className="cta-group">
                        {isLegalPro && (
                            <>
                                <button className="primary-cta" onClick={() => handleProtectedNav('/legal-assistant')}>
                                    Launch Assistant <FaArrowRight />
                                </button>
                                <button className="secondary-cta" onClick={() => handleProtectedNav('/wallet')}>
                                    Add Credits <FaWallet />
                                </button>
                            </>
                        )}
                        {!isLegalPro && (
                            <button className="primary-cta" onClick={() => handleProtectedNav('/legal-portal')}>
                                Open Portal <FaShieldAlt />
                            </button>
                        )}
                    </div>
                </motion.div>

                <div className="hero-visuals">
                    <div className="floating-card c1">
                        <FaRobot size={24} color="#60a5fa" />
                        <span>AI Drafting</span>
                    </div>
                    <div className="floating-card c2">
                        <FaLock size={24} color="#a78bfa" />
                        <span>Secure Vault</span>
                    </div>
                    <div className="glow-orb"></div>
                </div>
            </header>




            {/* Features Grid */}
            <section className="features-grid">
                {isLegalPro && (
                    <>
                        <motion.div
                            className="feature-card"
                            whileHover={{ y: -5 }}
                            onClick={() => handleProtectedNav('/legal-assistant')}
                        >
                            <div className="icon-box blue"><FaRobot /></div>
                            <h3>Legal Assistant</h3>
                            <p>interactive chat for case law research, drafting, and comparisons.</p>
                        </motion.div>

                        <motion.div
                            className="feature-card"
                            whileHover={{ y: -5 }}
                            onClick={() => handleProtectedNav('/wallet')}
                        >
                            <div className="icon-box green"><FaWallet /></div>
                            <h3>Wallet & Credits</h3>
                            <p>Manage your token usage and recharge your account securely.</p>
                        </motion.div>
                    </>
                )}

                <motion.div
                    className="feature-card"
                    whileHover={{ y: -5 }}
                    onClick={() => navigate('/legal-portal')} // Keeping old portal as legacy/reference if needed
                >
                    <div className="icon-box purple"><FaShieldAlt /></div>
                    <h3>Legacy Portal</h3>
                    <p>Access the classic grid view of all legal modules.</p>
                </motion.div>
            </section>
        </div>
    );
};

export default HomePage;
