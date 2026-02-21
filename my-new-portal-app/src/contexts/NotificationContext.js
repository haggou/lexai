import React, { createContext, useContext, useEffect, useState } from 'react';
import io from 'socket.io-client';
import toast, { Toaster } from 'react-hot-toast';

const NotificationContext = createContext();

export const useNotifications = () => useContext(NotificationContext);

// Helper to get base URL (removes /api if present for socket, keeps it for fetch)
const getBaseUrl = () => {
    const url = process.env.REACT_APP_API_URL || 'http://localhost:3000/api';
    return url.replace('/api', ''); // For Socket.io we usually want the root domain
};

const getApiUrl = () => {
    return process.env.REACT_APP_API_URL || 'http://localhost:3000/api';
};

export const NotificationProvider = ({ children }) => {
    const [socket, setSocket] = useState(null);
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);

    // Initial Fetch & Socket Setup
    useEffect(() => {
        const token = localStorage.getItem('lexai_token');
        const userStr = localStorage.getItem('lexai_user_info');
        const user = userStr ? JSON.parse(userStr) : null;

        if (!token || !user) return;

        // 1. Fetch History
        fetchNotifications(token);

        // 2. Setup Socket
        const newSocket = io(getBaseUrl(), {
            transports: ['websocket'],
            autoConnect: true
        });

        newSocket.on('connect', () => {
            // Join User Room
            newSocket.emit('join_notifications', user._id);
        });

        // Listen for Real-Time Pulse
        newSocket.on('lex_pulse', (newNotif) => {
            // Play Sound?
            const audio = new Audio('/assets/sounds/notification.mp3'); // Optional
            audio.play().catch(e => console.log('Audio play failed', e));

            // Add to State
            setNotifications(prev => [newNotif, ...prev]);
            setUnreadCount(prev => prev + 1);

            // Toast
            toast((t) => (
                <div onClick={() => !newNotif.actions?.length && toast.dismiss(t.id)}>
                    <div style={{ fontWeight: 600, marginBottom: '4px' }}>{newNotif.title}</div>
                    <div style={{ fontSize: '0.85rem', color: '#ccc' }}>{newNotif.message}</div>

                    {newNotif.actions && newNotif.actions.length > 0 && (
                        <div style={{ marginTop: '8px', display: 'flex', gap: '8px' }}>
                            {newNotif.actions.map((act, i) => (
                                <a
                                    key={i}
                                    href={act.link}
                                    style={{
                                        fontSize: '0.75rem',
                                        padding: '4px 8px',
                                        borderRadius: '4px',
                                        background: act.primary ? '#3b82f6' : '#333',
                                        color: '#fff',
                                        textDecoration: 'none',
                                        fontWeight: 'bold'
                                    }}
                                >
                                    {act.label}
                                </a>
                            ))}
                        </div>
                    )}
                </div>
            ), {
                icon: '🔔',
                style: {
                    background: '#111',
                    color: '#fff',
                    border: '1px solid #333',
                    minWidth: '300px'
                },
                duration: 6000
            });
        });

        setSocket(newSocket);

        return () => newSocket.disconnect();
    }, []);

    const fetchNotifications = async (token) => {
        try {
            // Fix: ensure we don't duplicate /api if it's in the env var
            const res = await fetch(`${getApiUrl()}/notifications`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = await res.json();
            if (data.status === 'success') {
                setNotifications(data.data);
                setUnreadCount(data.meta.unreadCount);
            }
        } catch (error) {
            console.error("Failed to fetch notifications", error);
        }
    };

    const markAsRead = async (id) => {
        try {
            const token = localStorage.getItem('lexai_token');
            await fetch(`${getApiUrl()}/notifications/${id}/read`, {
                method: 'PUT',
                headers: { Authorization: `Bearer ${token}` }
            });

            // Optimistic Update
            setNotifications(prev => prev.map(n =>
                n._id === id ? { ...n, isRead: true } : n
            ));
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch (error) {
            console.error("Failed to mark read", error);
        }
    };

    const markAllRead = async () => {
        try {
            const token = localStorage.getItem('lexai_token');
            await fetch(`${getApiUrl()}/notifications/all/read`, {
                method: 'PUT',
                headers: { Authorization: `Bearer ${token}` }
            });

            setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
            setUnreadCount(0);
        } catch (error) {
            console.error("Failed to mark all read", error);
        }
    }

    return (
        <NotificationContext.Provider value={{ notifications, unreadCount, markAsRead, markAllRead, socket }}>
            {children}
            <Toaster position="top-right" />
        </NotificationContext.Provider>
    );
};
