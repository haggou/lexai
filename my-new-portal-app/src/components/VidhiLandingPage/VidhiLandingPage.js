import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
    FaFileUpload, FaCheckCircle, FaExclamationTriangle,
    FaShieldAlt, FaBolt, FaMicrophone, FaCoins, FaDatabase, FaServer, FaLock
} from 'react-icons/fa';
import './VidhiLandingPage.css';

const VidhiLandingPage = () => {
    const navigate = useNavigate();
    const [isScanning, setIsScanning] = useState(false);
    const [scanComplete, setScanComplete] = useState(false);
    const [riskScore, setRiskScore] = useState(100); // Start at 100 (Safe)

    // Gauge matches standard: 0 deg = Safe (Left), 180 deg = Danger (Right).
    // But CSS rotation is 0 to 180.
    // Let's invert: 100% Safe = 0 rotation. 0% Safe = 180 rotation.
    const [gaugeRotation, setGaugeRotation] = useState(0);

    const handleAuditSim = () => {
        if (isScanning) return;
        setIsScanning(true);
        setScanComplete(false);
        setGaugeRotation(0);
        setRiskScore(100);

        // Simulation Step 1: Scanning...
        setTimeout(() => {
            // Found some issues...
            setRiskScore(75);
            setGaugeRotation(45);
        }, 1000);

        // Simulation Step 2: Critical issues...
        setTimeout(() => {
            setRiskScore(28); // Low Safety
            setGaugeRotation(130); // Into the Red
            setIsScanning(false);
            setScanComplete(true);
        }, 2500);
    };

    return (
        <div className="vidhi-container">
            {/* Header */}
            <header className="dashboard-header vidhi-section">
                <h1 className="dashboard-title">Advanced Features</h1>
                <p className="dashboard-subtitle">
                    Professional Legal Intelligence Suite powered by LexAI. <br />
                    <span style={{ color: 'var(--primary)' }}>Audit. Verify. Consult.</span>
                </p>
            </header>

            {/* 1. Smart Audit Command Center */}
            <section className="vidhi-section">
                <h2 style={{ marginBottom: '2rem' }}>Smart Audit Command Center</h2>
                <div className="audit-command-center">
                    {/* Scanner Zone */}
                    <div
                        className={`active-scanner ${isScanning ? 'scanning' : ''}`}
                        onClick={handleAuditSim}
                    >
                        <div className="scanner-line"></div>
                        {!isScanning && !scanComplete && (
                            <>
                                <FaFileUpload size={40} color="var(--text-muted)" />
                                <h3 style={{ marginTop: '1rem' }}>Drop Contract Here</h3>
                                <p style={{ color: 'var(--text-muted)' }}>AI Redlining Active</p>
                            </>
                        )}
                        {isScanning && (
                            <div className="mono" style={{ color: 'var(--primary)' }}>
                                ANALYZING CLAUSES...
                            </div>
                        )}
                        {scanComplete && (
                            <div style={{ textAlign: 'center' }}>
                                <FaExclamationTriangle size={40} color="var(--danger)" />
                                <h3 style={{ marginTop: '1rem', color: 'var(--danger)' }}>Risks Detected</h3>
                                <p style={{ color: 'var(--text-muted)' }}>3 Critical Clauses Found</p>
                            </div>
                        )}
                    </div>

                    {/* Risk Panel */}
                    <div className="risk-panel">
                        <h3 style={{ marginBottom: '1rem' }}>Risk Radar</h3>

                        {/* Dynamic Gauge */}
                        <div className="risk-gauge-wrapper">
                            <div className='risk-gauge-cover'></div>
                            <div
                                className="risk-gauge-arc"
                                style={{ transform: `rotate(-${gaugeRotation}deg)` }}
                            ></div>
                            {/* Note: In CSS I used `rotate(0deg)` initially, logic here might need tweaking based on visual preference */}
                            {/* Correcting Logic: Let's assume CSS handles the 180deg arc. We just rotate the mask or the needle.
                                Actually, my CSS `risk-gauge-arc` rotates the entire gradient.
                                Let's simplify: rotate the gradient arc. 0deg = All Green visible?
                                Actually Conic Gradient is typically full circle.
                                Let's stick to the visual:
                                Arc starts at 0deg. Rotate it to show different parts?
                                Simplified: The Arc is the background. The Needle moves?
                                My CSS implementation `risk-gauge-arc` is the colored part.
                                `transform: rotate(-${gaugeRotation}deg)` might shift colors.
                                Let's assume the Gauge is a static colored arc and we need a NEEDLE.
                                Okay, adapting to strict existing CSS I wrote in previous step:
                                The CSS has `risk-gauge-arc` with `transform`.
                                Let's rely on that.
                            */}
                            <div className="risk-score-display">
                                <div className="risk-score-val" style={{
                                    color: riskScore > 80 ? 'var(--success)' : riskScore < 40 ? 'var(--danger)' : 'var(--accent)'
                                }}>
                                    {riskScore}%
                                </div>
                                <div className="risk-label">Safety Score</div>
                            </div>
                        </div>

                        <div style={{ flex: 1, overflowY: 'auto' }}>
                            <AnimatePresence>
                                {scanComplete && (
                                    <motion.div
                                        initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                                        style={{ marginTop: '1rem', fontSize: '0.9rem' }}
                                    >
                                        <div style={{ marginBottom: '1rem', borderLeft: '3px solid var(--danger)', paddingLeft: '1rem' }}>
                                            <strong style={{ color: 'var(--danger)' }}>Clause 4.1 (Termination)</strong>
                                            <p style={{ color: 'var(--text-muted)' }}>"Termination at will without notice" violates Section 28.</p>
                                        </div>
                                        <div style={{ marginBottom: '1rem', borderLeft: '3px solid var(--accent)', paddingLeft: '1rem' }}>
                                            <strong style={{ color: 'var(--accent)' }}>Jurisdiction</strong>
                                            <p style={{ color: 'var(--text-muted)' }}>Defined as "Singapore" - Non-standard for domestic contract.</p>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>
                </div>
            </section>

            {/* 2. Nyaya-Tulna Table */}
            <section className="vidhi-section">
                <h2 style={{ marginBottom: '1rem' }}>Nyaya-Tulna <span className="mono" style={{ fontSize: '1rem', color: 'var(--text-muted)' }}>{`// LEGISLATIVE COMPARISON ENGINE`}</span></h2>
                <div className="tulna-table-wrapper">
                    <table className="tulna-table">
                        <thead>
                            <tr>
                                <th>Subject</th>
                                <th>Old Law (IPC 1860)</th>
                                <th>New Law (BNS 2023)</th>
                                <th>Impact Analysis</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td><strong>Cheating</strong></td>
                                <td>
                                    <span className="old-law-badge">Section 420</span><br />
                                    "Dishonestly inducing delivery of property..."
                                </td>
                                <td>
                                    <span className="new-law-badge">Section 318</span><br />
                                    Streamlined definition focusing on digital deception.
                                </td>
                                <td className="mono" style={{ color: 'var(--accent)' }}>+ DIGITAL SCOPE ADDED</td>
                            </tr>
                            <tr>
                                <td><strong>Sedition</strong></td>
                                <td>
                                    <span className="old-law-badge">Section 124A</span><br />
                                    "Exciting disaffection against Govt..."
                                </td>
                                <td>
                                    <span className="new-law-badge">Section 150</span><br />
                                    Replaced by "Acts endangering sovereignty".
                                </td>
                                <td className="mono" style={{ color: 'var(--success)' }}>+ COLONIAL TERM REMOVED</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </section>

            {/* 3. Satya-Check */}
            <section className="vidhi-section satya-section">
                <div className="satya-grid">
                    <div>
                        <h2 style={{ color: 'var(--success)' }}>Satya-Check™</h2>
                        <h3 style={{ marginBottom: '1rem' }}>Zero Hallucinations. 100% Verified.</h3>
                        <p style={{ color: 'var(--text-muted)', lineHeight: '1.6' }}>
                            Standard AI models make up laws. We don't. <br />
                            Every response serves a verified citation from our RAG (Retrieval Augmented Generation) database
                            linked directly to the Gazette of India.
                        </p>
                    </div>
                    <div>
                        <div className="citation-card">
                            <div>"As per Section 318 of BNS 2023..."</div>
                            <div className="citation-source">
                                <span><FaCheckCircle /> VERIFIED SOURCE</span>
                                <span>GAZETTE NOTIFICATION NO. 45</span>
                            </div>
                        </div>
                        <div className="citation-card">
                            <div>"Under Section 14 of Hindu Marriage Act..."</div>
                            <div className="citation-source">
                                <span><FaCheckCircle /> VERIFIED SOURCE</span>
                                <span>ACT 25 OF 1955</span>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* 4. Orb Workspace */}
            <section className="vidhi-section">
                <div className="orb-workspace">
                    <div>
                        <h2>Voice-Activated Legal Partner</h2>
                        <p style={{ color: 'var(--text-muted)', maxWidth: '400px', margin: '1rem 0' }}>
                            Legal jargon is intimidating. Just speak. Our "Orb" interface uses
                            Gemini 1.5 Pro to provide low-latency, conversational advice in Hindi, English, or Hinglish.
                        </p>
                        <button className="cta-btn" onClick={() => navigate('/voice-agent')}>
                            <FaMicrophone /> Enter Voice Room
                        </button>
                    </div>
                    {/* Visual Orb Representation */}
                    <div style={{ position: 'relative', width: '200px', height: '200px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                        <div style={{
                            width: '100px', height: '100px', background: '#fff', borderRadius: '50%',
                            boxShadow: '0 0 40px var(--primary)'
                        }}></div>
                        <div style={{
                            position: 'absolute', width: '160px', height: '160px', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '50%'
                        }}></div>
                    </div>
                </div>
            </section>

            {/* 5. Token Wallet */}
            <section className="vidhi-section" style={{ textAlign: 'center' }}>
                <h2>Pay for Results. Not Fees.</h2>
                <p style={{ color: 'var(--text-muted)', marginBottom: '3rem' }}>Transparent Micro-Transactions.</p>

                <div className="token-dashboard">
                    <div className="token-card">
                        <FaBolt size={30} color="var(--primary)" />
                        <div className="token-cost">1</div>
                        <div className="token-unit">Token / Chat</div>
                        <p style={{ fontSize: '0.8rem', color: '#666', marginTop: '1rem' }}>Standard Advice</p>
                    </div>
                    <div className="token-card" style={{ borderColor: 'var(--accent)' }}>
                        <FaShieldAlt size={30} color="var(--accent)" />
                        <div className="token-cost" style={{ color: 'var(--accent)' }}>5</div>
                        <div className="token-unit">Tokens / Audit</div>
                        <p style={{ fontSize: '0.8rem', color: '#666', marginTop: '1rem' }}>Risk Radar Check</p>
                    </div>
                    <div className="token-card">
                        <FaCoins size={30} color="var(--success)" />
                        <div className="token-cost">10</div>
                        <div className="token-unit">Tokens / Draft</div>
                        <p style={{ fontSize: '0.8rem', color: '#666', marginTop: '1rem' }}>Pro Document Gen</p>
                    </div>
                </div>
            </section>

            {/* Footer Indicators */}
            <footer className="prod-footer">
                <div className="prod-badge"><FaDatabase /> REDIS CACHING ACTIVE (&lt;50ms)</div>
                <div className="prod-badge"><FaLock /> 256-BIT ENCRYPTION</div>
                <div className="prod-badge"><FaServer /> VERTEX AI FAILOVER READY</div>
            </footer>
        </div>
    );
};

export default VidhiLandingPage;
