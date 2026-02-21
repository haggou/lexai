import React from 'react';
import { motion } from 'framer-motion';
import { FaUsers, FaLightbulb, FaRocket } from 'react-icons/fa';
import styles from './AboutPage.module.css';

const AboutPage = () => {
    return (
        <div className={styles.container}>
            <div className={styles.hero}>
                <motion.h1
                    className={styles.title}
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    Revolutionizing Legal Tech
                </motion.h1>
                <p className={styles.lead}>
                    LexAI is on a mission to democratize access to legal intelligence through the power of advanced artificial intelligence.
                </p>
            </div>

            <div className={styles.grid}>
                <motion.div
                    className={styles.card}
                    whileHover={{ y: -5 }}
                >
                    <FaLightbulb className={styles.icon} />
                    <h3 className={styles.cardTitle}>Innovation</h3>
                    <p className={styles.cardDesc}>Combining cutting-edge LLMs with deep legal expertise to solve complex problems.</p>
                </motion.div>
                <motion.div
                    className={styles.card}
                    whileHover={{ y: -5 }}
                >
                    <FaUsers className={styles.icon} />
                    <h3 className={styles.cardTitle}>Accessibility</h3>
                    <p className={styles.cardDesc}>Making high-quality legal tools available to professionals and individuals alike.</p>
                </motion.div>
                <motion.div
                    className={styles.card}
                    whileHover={{ y: -5 }}
                >
                    <FaRocket className={styles.icon} />
                    <h3 className={styles.cardTitle}>Efficiency</h3>
                    <p className={styles.cardDesc}>Streamlining workflows to save time and reduce costs for everyone.</p>
                </motion.div>
            </div>
        </div>
    );
};

export default AboutPage;

