import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNotifications } from '../../contexts/NotificationContext';
import { FaCheckDouble, FaBellSlash, FaBolt, FaCoins, FaShieldAlt, FaInfoCircle, FaGavel } from 'react-icons/fa';
import './NotificationCenter.css';

const getIcon = (type) => {
    switch (type) {
        case 'FINANCIAL': return <FaCoins color="#fbbf24" />;
        case 'LEGAL_UPDATE': return <FaGavel color="#ef4444" />;
        case 'SECURITY': return <FaShieldAlt color="#3b82f6" />;
        case 'SYSTEM': return <FaBolt color="#10b981" />;
        default: return <FaInfoCircle color="#94a3b8" />;
    }
};

const NotificationCenter = () => {
    const { notifications, markAsRead, markAllRead } = useNotifications();

    // Mark notifications as read when they appear on screen? Or manually? 
    // Let's do manual "Mark All Read" button or click to expand.

    return (
        <div className="notification-page-container">
            <header className="notif-header">
                <div>
                    <h1>Notification Center</h1>
                    <p className="text-muted">Real-time alerts & system updates.</p>
                </div>
                <button className="mark-all-btn" onClick={markAllRead}>
                    <FaCheckDouble /> Mark All Read
                </button>
            </header>

            <div className="notif-list">
                <AnimatePresence>
                    {notifications.length === 0 ? (
                        <div className="empty-state">
                            <FaBellSlash size={40} color="#333" />
                            <p>No notifications yet.</p>
                        </div>
                    ) : (
                        notifications.map((notif) => (
                            <motion.div
                                key={notif._id}
                                className={`notif-item ${notif.isRead ? 'read' : 'unread'}`}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, height: 0 }}
                                onClick={() => !notif.isRead && markAsRead(notif._id)}
                            >
                                <div className="notif-icon">
                                    {getIcon(notif.type)}
                                </div>
                                <div className="notif-content">
                                    <div className="notif-top">
                                        <h4 className="notif-title">{notif.title}</h4>
                                        <span className="notif-time">
                                            {new Date(notif.createdAt).toLocaleDateString()} {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    </div>
                                    <p className="notif-msg">{notif.message}</p>

                                    {notif.actions && notif.actions.length > 0 && (
                                        <div className="notif-actions" style={{ marginTop: '1rem', display: 'flex', gap: '0.8rem' }}>
                                            {notif.actions.map((act, i) => (
                                                <a
                                                    key={i}
                                                    href={act.link}
                                                    className={`action-btn ${act.primary ? 'primary' : ''}`}
                                                    onClick={(e) => e.stopPropagation()}
                                                    style={{
                                                        padding: '0.5rem 1rem',
                                                        borderRadius: '6px',
                                                        fontSize: '0.85rem',
                                                        textDecoration: 'none',
                                                        fontWeight: '600',
                                                        background: act.primary ? 'linear-gradient(90deg, #3b82f6, #2563eb)' : '#333',
                                                        color: '#fff',
                                                        boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                                                    }}
                                                >
                                                    {act.label}
                                                </a>
                                            ))}
                                        </div>
                                    )}

                                    {notif.metadata && Object.keys(notif.metadata).length > 0 && (
                                        <div className="notif-meta">
                                            {JSON.stringify(notif.metadata).slice(0, 50)}...
                                        </div>
                                    )}
                                </div>
                                {!notif.isRead && <div className="unread-dot"></div>}
                            </motion.div>
                        ))
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default NotificationCenter;
