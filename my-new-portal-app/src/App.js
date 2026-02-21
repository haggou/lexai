import React, { Suspense, lazy, useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { AnimatePresence } from 'framer-motion';

// Core Styles
import styles from './App.module.css';

// Contexts
import { AdminProvider } from './contexts/AdminContext';
import { SubscriptionProvider } from './contexts/SubscriptionContext';
import { NotificationProvider } from './contexts/NotificationContext';

// Components
import Navbar from './components/Layout/Navbar';
import Footer from './components/Layout/Footer';
import ErrorBoundary from './components/ErrorBoundary';
import SplashScreen from './components/Layout/SplashScreen';
import FeedbackWidget from './components/FeedbackWidget';

// Lazy Loaded Pages
const HomePage = lazy(() => import('./components/Home/HomePage'));
const AuthPage = lazy(() => import('./components/Auth/AuthPage'));
const AdminPanel = lazy(() => import('./components/Admin/AdminPanel'));
const VidhiLandingPage = lazy(() => import('./components/VidhiLandingPage/VidhiLandingPage'));
const WalletPage = lazy(() => import('./components/Wallet/WalletPage'));


const TransactionHistoryPage = lazy(() => import('./components/Wallet/TransactionHistoryPage'));
const LegalAssistantPage = lazy(() => import('./components/LegalPortalPage/LegalAssistantPage'));
const VoiceAgentPage = lazy(() => import('./components/LegalPortalPage/VoiceAgentPage'));
const PricingPage = lazy(() => import('./components/Pages/PricingPage'));
const AboutPage = lazy(() => import('./components/Pages/AboutPage'));
const TermsPage = lazy(() => import('./components/Pages/TermsPage'));
const PrivacyPage = lazy(() => import('./components/Pages/PrivacyPage'));
const SettingsPage = lazy(() => import('./components/Pages/SettingsPage'));
const ContactPage = lazy(() => import('./components/Pages/ContactPage'));
const TokenDashboard = lazy(() => import('./components/Dashboard/TokenDashboard'));
const NotificationCenter = lazy(() => import('./components/Notification/NotificationCenter'));

// Legacy Pages
const PortalGrid = lazy(() => import('./components/PortalGrid/PortalGrid'));
const LegalPortalPage = lazy(() => import('./components/LegalPortalPage/LegalPortalPage'));

// --- Access Control Configuration ---
const LEGAL_PROFESSIONS = ['lawyer', 'advocate', 'lekhpal', 'judge', 'attorney', 'legal consultant', 'jurist', 'barrister', 'senior counsel', 'solicitor', 'notary'];

// Helper to check access
const checkAccess = () => {
    try {
        const token = localStorage.getItem('lexai_token');
        if (!token) return { isAuth: false };

        const userStr = localStorage.getItem('lexai_user_info');
        const user = userStr ? JSON.parse(userStr) : {};

        return {
            isAuth: true,
            profession: (user.profession || '').toLowerCase(),
            sub: (user.subscriptionPlan || 'free').toLowerCase(),
            role: user.role
        };
    } catch (e) { return { isAuth: false, sub: 'free' }; }
};

// Advanced Route Guard
const RoleProtectedRoute = ({ children, allowedProfessions = [], requireSubscription = false }) => {
    const { isAuth, profession, sub } = checkAccess();

    if (!isAuth) return <Navigate to="/auth" replace />;

    // 1. Subscription Check (Priority)
    const isPaid = sub !== 'free' && sub !== 'citizen';
    if (requireSubscription && !isPaid) {
        return <Navigate to="/pricing" replace />;
    }

    // 2. Profession Check (Strict)
    if (allowedProfessions.length > 0) {
        const hasProfession = allowedProfessions.some(p => profession.includes(p));

        if (!hasProfession) {
            // User is Subscribed (passed step 1) but NOT a Lawyer.
            // Redirect them to the Legacy Portal which they ARE allowed to access.
            return <Navigate to="/legal-portal" replace />;
        }
    }

    return children;
};

// Basic Auth Guard
const ProtectedRoute = ({ children }) => {
    if (!localStorage.getItem('lexai_token')) {
        return <Navigate to="/auth" replace />;
    }
    return children;
};

// Layout Wrapper
const Layout = ({ children }) => {
    const location = useLocation();
    const isAuthPage = location.pathname === '/auth';
    const isAdminPage = location.pathname.startsWith('/admin');

    return (
        <div className={styles.appContainer}>
            {!isAuthPage && !isAdminPage && <Navbar />}
            <main className={styles.mainContent}>
                <Suspense fallback={
                    <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                    </div>
                }>
                    {children}
                </Suspense>
            </main>
            {!isAuthPage && !isAdminPage && <Footer />}
            {!isAuthPage && !isAdminPage && <FeedbackWidget />}
        </div>
    );
};

function App() {
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const timer = setTimeout(() => setIsLoading(false), 2400); // 2.4s splash
        return () => clearTimeout(timer);
    }, []);

    return (
        <ErrorBoundary>
            <HelmetProvider>
                <AdminProvider>
                    <SubscriptionProvider>
                        <NotificationProvider>
                            <AnimatePresence>
                                {isLoading && <SplashScreen key="splash" />}
                            </AnimatePresence>

                            {!isLoading && (
                                <Router>
                                    <Layout>
                                        <Routes>
                                            {/* Core */}
                                            <Route path="/" element={<HomePage />} />
                                            <Route path="/auth" element={<AuthPage />} />
                                            <Route path="/admin" element={<AdminPanel />} />
                                            <Route path="/vidhi" element={<VidhiLandingPage />} />

                                            {/* User Features */}
                                            <Route path="/wallet" element={
                                                <RoleProtectedRoute allowedProfessions={LEGAL_PROFESSIONS} requireSubscription={true}>
                                                    <WalletPage />
                                                </RoleProtectedRoute>
                                            } />
                                            <Route path="/wallet/history" element={
                                                <RoleProtectedRoute allowedProfessions={LEGAL_PROFESSIONS} requireSubscription={true}>
                                                    <TransactionHistoryPage />
                                                </RoleProtectedRoute>
                                            } />

                                            <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
                                            <Route path="/token-dashboard" element={<ProtectedRoute><TokenDashboard /></ProtectedRoute>} />
                                            <Route path="/notifications" element={<ProtectedRoute><NotificationCenter /></ProtectedRoute>} />

                                            {/* RESTRICTED: Legal Assistant (Professionals Only + Subscription) */}
                                            <Route path="/legal-assistant" element={
                                                <RoleProtectedRoute allowedProfessions={LEGAL_PROFESSIONS} requireSubscription={true}>
                                                    <LegalAssistantPage />
                                                </RoleProtectedRoute>
                                            } />

                                            {/* Voice Agent */}
                                            <Route path="/voice-agent" element={
                                                <RoleProtectedRoute allowedProfessions={LEGAL_PROFESSIONS} requireSubscription={true}>
                                                    <VoiceAgentPage />
                                                </RoleProtectedRoute>
                                            } />

                                            {/* RESTRICTED: Legacy Portal (Subscription Only, Any Profession) */}
                                            <Route path="/legal-portal" element={
                                                <RoleProtectedRoute requireSubscription={true}>
                                                    <LegalPortalPage />
                                                </RoleProtectedRoute>
                                            } />

                                            {/* Public Pages */}
                                            <Route path="/pricing" element={<PricingPage />} />
                                            <Route path="/about" element={<AboutPage />} />
                                            <Route path="/terms" element={<TermsPage />} />
                                            <Route path="/privacy" element={<PrivacyPage />} />
                                            <Route path="/grid" element={<PortalGrid />} />
                                            <Route path="/contact" element={<ContactPage />} />

                                            {/* Fallback */}
                                            <Route path="*" element={<Navigate to="/" replace />} />
                                        </Routes>
                                    </Layout>
                                </Router>
                            )}
                        </NotificationProvider>
                    </SubscriptionProvider>
                </AdminProvider>
            </HelmetProvider>
        </ErrorBoundary>
    );
}

export default App;