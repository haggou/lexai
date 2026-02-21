
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
    FaPhoneAlt, FaEnvelope, FaMapMarkerAlt, FaWhatsapp,
    FaTwitter, FaLinkedinIn, FaInstagram, FaPaperPlane,
    FaHeadset, FaGlobe
} from 'react-icons/fa';
import styles from './ContactPage.module.css';

const ContactPage = () => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        subject: '',
        message: ''
    });
    const [sending, setSending] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSending(true);

        try {
            const res = await fetch('http://localhost:3000/api/contact', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            const data = await res.json();

            if (res.ok) {
                alert(`Thank you, ${formData.name}! We have received your message. Our team will contact you shortly.`);
                setFormData({ name: '', email: '', subject: '', message: '' });
            } else {
                alert(data.error || "Failed to send message. Please try again.");
            }
        } catch (error) {
            console.error("Contact Error:", error);
            alert("Network error. Please try again.");
        } finally {
            setSending(false);
        }
    };

    const contactChannels = [
        {
            icon: <FaPhoneAlt />,
            title: "Customer Support (24/7)",
            content: "1800-LEX-HELP (1800-539-4357)",
            link: "tel:18005394357",
            action: "Call Now"
        },
        {
            icon: <FaWhatsapp />,
            title: "WhatsApp Chat",
            content: "+91 99999 00000",
            link: "https://wa.me/919999900000",
            action: "Chat Now"
        },
        {
            icon: <FaEnvelope />,
            title: "Email Us",
            content: "support@lexai.in",
            link: "mailto:support@lexai.in",
            action: "Send Email"
        },
        {
            icon: <FaMapMarkerAlt />,
            title: "Visit Our HQ",
            content: "LexAI Tower, Cyber City, Gurugram, India, 122002",
            link: "https://maps.google.com",
            action: "Get Directions"
        }
    ];

    return (
        <div className={styles.pageWrapper}>
            <div className={styles.container}>
                {/* Hero Header */}
                <motion.div
                    className={styles.header}
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                >
                    <h1 className={styles.title}>Get in Touch</h1>
                    <p className={styles.subtitle}>
                        Have questions about our legal AI services? We are here to help you via phone, email, chat, or in person.
                    </p>
                </motion.div>

                <div className={styles.grid}>
                    {/* Left Column: Contact Info */}
                    <motion.div
                        className={styles.infoSection}
                        initial={{ opacity: 0, x: -30 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2, duration: 0.6 }}
                    >
                        {contactChannels.map((item, index) => (
                            <div key={index} className={styles.infoCard}>
                                <div className={styles.iconBox}>{item.icon}</div>
                                <div className={styles.cardContent}>
                                    <h3>{item.title}</h3>
                                    <p>{item.content}</p>
                                    <a href={item.link} target="_blank" rel="noopener noreferrer">
                                        {item.action} &rarr;
                                    </a>
                                </div>
                            </div>
                        ))}

                        <div className={styles.socialSection}>
                            <h3>Connect on Social Media</h3>
                            <div className={styles.socialIcons}>
                                <a href="https://twitter.com" className={styles.socialBtn}><FaTwitter /></a>
                                <a href="https://linkedin.com" className={styles.socialBtn}><FaLinkedinIn /></a>
                                <a href="https://instagram.com" className={styles.socialBtn}><FaInstagram /></a>
                                <a href="https://lexai.in" className={styles.socialBtn}><FaGlobe /></a>
                            </div>
                        </div>
                    </motion.div>

                    {/* Right Column: Contact Form */}
                    <motion.div
                        className={styles.formSection}
                        initial={{ opacity: 0, x: 30 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.3, duration: 0.6 }}
                    >
                        <div className={styles.formHeader}>
                            <h2><FaHeadset style={{ marginRight: '10px', color: '#3b82f6' }} /> Send a Message</h2>
                            <p>Fill out the form below and our legal experts will get back to you within 24 hours.</p>
                        </div>

                        <form onSubmit={handleSubmit}>
                            <div className={styles.formGroup}>
                                <label>Full Name</label>
                                <input
                                    type="text"
                                    className={styles.input}
                                    placeholder="Enter your name"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    required
                                />
                            </div>

                            <div className={styles.formGroup}>
                                <label>Email Address</label>
                                <input
                                    type="email"
                                    className={styles.input}
                                    placeholder="Enter your email"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    required
                                />
                            </div>

                            <div className={styles.formGroup}>
                                <label>Subject</label>
                                <div style={{ position: 'relative' }}>
                                    <select
                                        className={styles.input}
                                        value={formData.subject}
                                        onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                                        required
                                    >
                                        <option value="">Select a Topic</option>
                                        <option value="General Inquiry">General Inquiry</option>
                                        <option value="Technical Support">Technical Support</option>
                                        <option value="Billing Issue">Billing Issue</option>
                                        <option value="Partnership">Partnership</option>
                                    </select>
                                </div>
                            </div>

                            <div className={styles.formGroup}>
                                <label>Message</label>
                                <textarea
                                    className={styles.textarea}
                                    placeholder="How can we help you?"
                                    value={formData.message}
                                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                                    required
                                ></textarea>
                            </div>

                            <button type="submit" className={styles.submitBtn} disabled={sending}>
                                {sending ? 'Sending...' : (
                                    <>Send Message <FaPaperPlane /></>
                                )}
                            </button>
                        </form>
                    </motion.div>
                </div>
            </div>
        </div>
    );
};

export default ContactPage;
