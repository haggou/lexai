import React, { createContext, useState, useContext, useEffect } from 'react';

// Use environment variable for API base
const getApiBase = () => process.env.REACT_APP_API_URL || 'http://localhost:3000/api';

const AdminContext = createContext();

export const useAdmin = () => useContext(AdminContext);

export const AdminProvider = ({ children }) => {
    const [isAdmin, setIsAdmin] = useState(false);
    const [config, setConfig] = useState({
        users: [],
        features: {},
        announcements: [],
        pricingPlans: [],
        stats: {}, // Add stats
        feedbacks: [],
        logs: [],
        coupons: [],
        templates: []
    });
    const [loading, setLoading] = useState(true);

    // Initialize state from Backend
    const checkAdminStatus = async () => {
        const userId = localStorage.getItem('lexai_userid');
        if (!userId) {
            setIsAdmin(false);
            setLoading(false);
            return false;
        }

        try {
            // Verify admin status
            const token = localStorage.getItem('lexai_token');
            const res = await fetch(`${getApiBase()}/admin/stats`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (res.ok) {
                const statsData = await res.json();
                setConfig(prev => ({ ...prev, stats: statsData }));
                setIsAdmin(true);
                setLoading(false);
                return true;
            } else {
                setIsAdmin(false);
                setLoading(false);
                return false;
            }
        } catch (e) {
            console.error("Failed to fetch admin config:", e);
            setIsAdmin(false);
            setLoading(false);
            return false;
        }
    };

    useEffect(() => {
        checkAdminStatus();
    }, []);

    // Actions
    // Data Fetchers
    const fetchUsers = async () => {
        try {
            const token = localStorage.getItem('lexai_token');
            const res = await fetch(`${getApiBase()}/admin/users`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const users = await res.json();
                if (Array.isArray(users)) {
                    setConfig(prev => ({ ...prev, users }));
                } else {
                    console.error("[ADMIN] Users data invalid:", users);
                    setConfig(prev => ({ ...prev, users: [] }));
                }
            } else {
                console.error("[ADMIN] Fetch Users Failed:", res.status);
            }
        } catch (e) { console.error("[ADMIN] Fetch Users Error:", e); }
    };


    const fetchSystemConfig = async () => {
        try {
            const token = localStorage.getItem('lexai_token');
            const res = await fetch(`${getApiBase()}/admin/config`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const fetchedConfig = await res.json();
                setConfig(prev => ({ ...prev, features: fetchedConfig })); // Storing all config in 'features' for now or a new key
            }
        } catch (e) { console.error(e); }
    };

    // Actions
    const getUserDetails = async (userId) => {
        try {
            const token = localStorage.getItem('lexai_token');
            const res = await fetch(`${getApiBase()}/admin/users/${userId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) return await res.json();
            return null;
        } catch (e) { console.error(e); return null; }
    };

    const adjustUserBalance = async (userId, amount, type, description) => {
        try {
            const token = localStorage.getItem('lexai_token');
            const res = await fetch(`${getApiBase()}/admin/users/${userId}/balance`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ amount, type, description })
            });
            return res.ok;
        } catch (e) { console.error(e); return false; }
    };

    const updateUser = async (userId, updates) => {
        try {
            const token = localStorage.getItem('lexai_token');
            const res = await fetch(`${getApiBase()}/admin/users/${userId}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(updates)
            });
            if (res.ok) {
                const updatedUser = await res.json();
                setConfig(prev => ({
                    ...prev,
                    users: prev.users.map(u => u._id === userId ? { ...u, ...updatedUser } : u)
                }));
                return true;
            }
        } catch (e) { console.error(e); return false; }
    };

    // Generic Config Update
    const updateSystemConfig = async (key, value) => {
        try {
            const token = localStorage.getItem('lexai_token');
            const res = await fetch(`${getApiBase()}/admin/config`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ key, value })
            });
            if (res.ok) {
                setConfig(prev => ({
                    ...prev,
                    features: { ...prev.features, [key]: value }
                }));
            }
        } catch (e) { console.error(e); }
    };

    // Notifications
    const addAnnouncement = async (title, message, type = 'info') => {
        try {
            const token = localStorage.getItem('lexai_token');
            const res = await fetch(`${getApiBase()}/admin/notifications`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ title, message, type })
            });
            if (res.ok) {
                return true;
            }
        } catch (e) { console.error(e); }
    };

    const fetchFeedbacks = async () => {
        try {
            const token = localStorage.getItem('lexai_token');
            const res = await fetch(`${getApiBase()}/admin/feedback`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                console.log("[ADMIN] Fetched Feedbacks (Raw):", data);
                if (Array.isArray(data)) {
                    setConfig(prev => ({ ...prev, feedbacks: data }));
                } else {
                    console.error("[ADMIN] Feedback data structure invalid:", data);
                    setConfig(prev => ({ ...prev, feedbacks: [] }));
                }
            } else {
                console.error("[ADMIN] Feedback fetch failed:", res.status);
            }
        } catch (e) {
            console.error("[ADMIN] Feedback Fetch Error:", e);
            setConfig(prev => ({ ...prev, feedbacks: [] }));
        }
    };

    const updateFeedbackStatus = async (id, status, notes = '') => {
        try {
            const token = localStorage.getItem('lexai_token');
            const res = await fetch(`${getApiBase()}/admin/feedback/${id}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ status, adminNotes: notes })
            });
            if (res.ok) {
                fetchFeedbacks();
                return true;
            }
        } catch (e) { console.error(e); return false; }
    };

    const fetchLogs = async () => {
        try {
            const token = localStorage.getItem('lexai_token');
            const res = await fetch(`${getApiBase()}/admin/logs`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setConfig(prev => ({ ...prev, logs: data }));
            }
        } catch (e) { console.error(e); }
    };

    // Coupons
    const fetchCoupons = async () => {
        try {
            const token = localStorage.getItem('lexai_token');
            const res = await fetch(`${getApiBase()}/admin/coupons`, { headers: { 'Authorization': `Bearer ${token}` } });
            if (res.ok) {
                const data = await res.json();
                setConfig(prev => ({ ...prev, coupons: data }));
            }
        } catch (e) { console.error(e); }
    };

    const createCoupon = async (data) => {
        try {
            const token = localStorage.getItem('lexai_token');
            const res = await fetch(`${getApiBase()}/admin/coupons`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(data)
            });
            if (res.ok) {
                fetchCoupons();
                return true;
            }
            return false;
        } catch (e) { return false; }
    };

    const deleteCoupon = async (id) => {
        try {
            const token = localStorage.getItem('lexai_token');
            await fetch(`${getApiBase()}/admin/coupons/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            fetchCoupons();
        } catch (e) { console.error(e); }
    };

    // Templates
    const fetchTemplates = async () => {
        try {
            const token = localStorage.getItem('lexai_token');
            // Using the content API, but we can access it via admin context if we want, or just direct
            const res = await fetch(`${getApiBase()}/content/templates`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setConfig(prev => ({ ...prev, templates: data }));
            }
        } catch (e) { console.error(e); }
    };

    const createTemplate = async (data) => {
        try {
            const token = localStorage.getItem('lexai_token');
            const res = await fetch(`${getApiBase()}/content/templates`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(data)
            });
            if (res.ok) {
                fetchTemplates();
                return true;
            }
            return false;
        } catch (e) { return false; }
    };

    const deleteTemplate = async (id) => {
        try {
            const token = localStorage.getItem('lexai_token');
            await fetch(`${getApiBase()}/content/templates/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            fetchTemplates();
        } catch (e) { console.error(e); }
    };

    return (
        <AdminContext.Provider value={{
            isAdmin,
            config,
            loading,
            checkAdminStatus,
            actions: {
                fetchUsers,
                fetchSystemConfig,
                updateUser,
                getUserDetails,
                adjustUserBalance,
                updateSystemConfig,
                addAnnouncement,
                fetchFeedbacks,
                updateFeedbackStatus,
                fetchLogs,
                fetchCoupons,
                createCoupon,
                deleteCoupon,
                fetchTemplates,
                createTemplate,
                deleteTemplate,
                createUser: async (userData) => {
                    try {
                        const token = localStorage.getItem('lexai_token');
                        const res = await fetch(`${getApiBase()}/admin/users`, {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                                'Authorization': `Bearer ${token}`
                            },
                            body: JSON.stringify(userData)
                        });
                        return res;
                    } catch (e) {
                        console.error(e);
                        return { ok: false };
                    }
                },
                deployVertex: async () => {
                    try {
                        const token = localStorage.getItem('lexai_token');
                        const res = await fetch(`${getApiBase()}/admin/deploy/vertex`, {
                            method: 'POST',
                            headers: { 'Authorization': `Bearer ${token}` }
                        });
                        return res.json();
                    } catch (e) { return { error: e.message }; }
                },
                getDeploymentStatus: async () => {
                    try {
                        const token = localStorage.getItem('lexai_token');
                        const res = await fetch(`${getApiBase()}/admin/deploy/status`, {
                            headers: { 'Authorization': `Bearer ${token}` }
                        });
                        if (res.ok) return await res.json();
                        return null;
                    } catch (e) { return null; }
                },
                uploadPrompt: async (formData) => {
                    try {
                        const token = localStorage.getItem('lexai_token');
                        const res = await fetch(`${getApiBase()}/admin/prompts/upload`, {
                            method: 'POST',
                            headers: { 'Authorization': `Bearer ${token}` },
                            body: formData
                        });
                        return res.json();
                    } catch (e) { return { error: e.message }; }
                },
                undeployVertex: async () => {
                    try {
                        const token = localStorage.getItem('lexai_token');
                        const res = await fetch(`${getApiBase()}/admin/deploy/vertex`, {
                            method: 'DELETE',
                            headers: { 'Authorization': `Bearer ${token}` }
                        });
                        return res.json();
                    } catch (e) { return { error: e.message }; }
                },
                getEnvConfig: async () => {
                    try {
                        const token = localStorage.getItem('lexai_token');
                        const res = await fetch(`${getApiBase()}/admin/env`, {
                            headers: { 'Authorization': `Bearer ${token}` }
                        });
                        if (res.ok) return await res.json();
                        return {};
                    } catch (e) { console.error(e); return {}; }
                },
                updateEnvConfig: async (key, value) => {
                    try {
                        const token = localStorage.getItem('lexai_token');
                        const res = await fetch(`${getApiBase()}/admin/env`, {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                                'Authorization': `Bearer ${token}`
                            },
                            body: JSON.stringify({ key, value })
                        });
                        return res.ok;
                    } catch (e) { console.error(e); return false; }
                },
                sendNotification: async (data) => {
                    try {
                        const token = localStorage.getItem('lexai_token');
                        // Use consistent API base for notification sending too
                        const res = await fetch(`${getApiBase()}/notifications/send`, {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                                'Authorization': `Bearer ${token}`
                            },
                            body: JSON.stringify(data)
                        });
                        return await res.json();
                    } catch (e) {
                        return { error: e.message };
                    }
                }
            }
        }}>
            {children}
        </AdminContext.Provider>
    );
};
