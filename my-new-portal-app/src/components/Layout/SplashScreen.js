import React from 'react';
import { motion } from 'framer-motion';
import { FaShieldAlt } from 'react-icons/fa';

const SplashScreen = ({ onFinish }) => {
    return (
        <motion.div
            className="splash-screen"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8, ease: "easeInOut" }}
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                width: '100vw',
                height: '100vh',
                background: '#0B1120', // Lex Navy
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 9999,
                color: '#D4AF37' // Lex Gold
            }}
        >
            <motion.div
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.8, ease: "backOut" }}
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: '20px',
                    width: '100px',
                    height: '100px',
                    borderRadius: '20px',
                    background: 'linear-gradient(135deg, rgba(212, 175, 55, 0.2) 0%, rgba(212, 175, 55, 0.05) 100%)',
                    boxShadow: '0 0 40px rgba(212, 175, 55, 0.3)',
                    border: '1px solid rgba(212, 175, 55, 0.3)'
                }}
            >
                <FaShieldAlt style={{ fontSize: '3.5rem', filter: 'drop-shadow(0 0 10px rgba(212, 175, 55, 0.5))' }} />
            </motion.div>

            <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.4, duration: 0.6 }}
                style={{ textAlign: 'center' }}
            >
                <h1 style={{
                    fontFamily: '"Playfair Display", serif',
                    fontSize: '2.5rem',
                    margin: 0,
                    background: 'linear-gradient(to right, #D4AF37, #F2E8C6, #997B28)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    letterSpacing: '2px'
                }}>
                    LEX.AI
                </h1>
                <p style={{
                    fontFamily: '"Inter", sans-serif',
                    fontSize: '0.9rem',
                    color: '#94a3b8',
                    letterSpacing: '4px',
                    textTransform: 'uppercase',
                    marginTop: '10px'
                }}>
                    Advanced Legal Intelligence
                </p>
            </motion.div>

            <div style={{
                marginTop: '40px',
                width: '150px',
                height: '2px',
                background: 'rgba(255, 255, 255, 0.1)',
                position: 'relative',
                overflow: 'hidden',
                borderRadius: '2px'
            }}>
                <motion.div
                    style={{
                        width: '100%',
                        height: '100%',
                        background: '#D4AF37',
                        position: 'absolute',
                        left: '-100%'
                    }}
                    animate={{ left: '100%' }}
                    transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
                />
            </div>
        </motion.div>
    );
};

export default SplashScreen;
