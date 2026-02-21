import React from 'react';
import { Link } from 'react-router-dom';
import { FaShieldAlt, FaTwitter, FaLinkedin, FaGithub, FaInstagram } from 'react-icons/fa';
import styles from './Footer.module.css';

const Footer = () => {
    return (
        <footer className={styles.footer}>
            <div className={styles.container}>
                <div className={styles.grid}>
                    {/* Brand Section */}
                    <div className={styles.brandSection}>
                        <div className={styles.brand}>
                            <FaShieldAlt className={styles.logoIcon} />
                            <span className={styles.brandName}>LexAI</span>
                        </div>
                        <p className={styles.description}>
                            Empowering legal professionals with next-generation AI intelligence.
                            Secure, precise, and efficient legal drafting and research.
                        </p>
                        <div className={styles.socials}>
                            <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className={styles.socialLink}><FaTwitter /></a>
                            <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className={styles.socialLink}><FaLinkedin /></a>
                            <a href="https://github.com" target="_blank" rel="noopener noreferrer" className={styles.socialLink}><FaGithub /></a>
                            <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className={styles.socialLink}><FaInstagram /></a>
                        </div>
                    </div>

                    {/* Quick Links */}
                    <div className={styles.linksSection}>
                        <h4 className={styles.heading}>Product</h4>
                        <ul className={styles.linkList}>
                            <li><Link to="/features">Features</Link></li>
                            <li><Link to="/pricing">Pricing</Link></li>
                            <li><Link to="/wallet">Wallet</Link></li>
                            <li><Link to="/legal-assistant">AI Assistant</Link></li>
                        </ul>
                    </div>

                    <div className={styles.linksSection}>
                        <h4 className={styles.heading}>Company</h4>
                        <ul className={styles.linkList}>
                            <li><Link to="/about">About Us</Link></li>
                            <li><Link to="/careers">Careers</Link></li>
                            <li><Link to="/blog">Blog</Link></li>
                            <li><Link to="/contact">Contact</Link></li>
                        </ul>
                    </div>

                    <div className={styles.linksSection}>
                        <h4 className={styles.heading}>Legal</h4>
                        <ul className={styles.linkList}>
                            <li><Link to="/privacy">Privacy Policy</Link></li>
                            <li><Link to="/terms">Terms of Service</Link></li>
                            <li><Link to="/security">Security</Link></li>
                        </ul>
                    </div>
                </div>

                <div className={styles.bottomBar}>
                    <p>&copy; {new Date().getFullYear()} LexAI Technologies. All rights reserved.</p>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
