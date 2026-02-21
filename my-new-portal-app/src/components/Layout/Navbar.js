import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { FaShieldAlt, FaUserCircle, FaBars, FaTimes, FaSignOutAlt, FaUserEdit, FaTrashAlt, FaCog } from 'react-icons/fa';
import NotificationBell from '../Notification/NotificationBell';
import styles from './Navbar.module.css';

const API_BASE_URL = 'http://localhost:3000/api';

const Navbar = () => {
    const navigate = useNavigate();
    const [scrolled, setScrolled] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
    const username = localStorage.getItem('lexai_username');
    const userId = localStorage.getItem('lexai_userid');

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 20);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);


    const toggleMenu = () => setMobileMenuOpen(!mobileMenuOpen);

    const handleLogout = () => {
        localStorage.removeItem('lexai_userid');
        localStorage.removeItem('lexai_username');
        localStorage.removeItem('lexai_token'); // Ensure token is also cleared if used
        navigate('/auth');
        setProfileDropdownOpen(false);
    };

    const handleUpdateProfile = () => {
        navigate('/update-profile');
        setProfileDropdownOpen(false);
    };

    const handleDeleteAccount = async () => {
        if (window.confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
            try {
                const token = localStorage.getItem('lexai_token');
                const res = await fetch(`${API_BASE_URL}/users/profile`, {
                    method: 'DELETE',
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (res.ok) {
                    alert('Account deleted successfully.');
                    handleLogout();
                } else {
                    alert('Failed to delete account. Please try again.');
                }
            } catch (error) {
                console.error('Error deleting account:', error);
                alert('An error occurred. Please check your connection.');
            }
        }
        setProfileDropdownOpen(false);
    };

    return (
        <nav className={`${styles.navbar} ${scrolled ? styles.scrolled : ''}`}>
            <div className={styles.container}>
                <div className={styles.brand} onClick={() => navigate('/')}>
                    <FaShieldAlt className={styles.logoIcon} />
                    <span className={styles.brandName}>LexAI</span>
                </div>

                <div className={styles.desktopMenu}>
                    <NavLink to="/" className={({ isActive }) => isActive ? `${styles.navLink} ${styles.active}` : styles.navLink}>Home</NavLink>
                    <NavLink to="/pricing" className={({ isActive }) => isActive ? `${styles.navLink} ${styles.active}` : styles.navLink}>Pricing</NavLink>
                    <NavLink to="/vidhi" className={({ isActive }) => isActive ? `${styles.navLink} ${styles.active}` : styles.navLink}>Pro Suite</NavLink>
                    <a href="https://www.livelaw.in/" target="_blank" rel="noopener noreferrer" className={styles.navLink}>News</a>
                    <NavLink to="/about" className={({ isActive }) => isActive ? `${styles.navLink} ${styles.active}` : styles.navLink}>About Us</NavLink>
                    <NavLink to="/contact" className={({ isActive }) => isActive ? `${styles.navLink} ${styles.active}` : styles.navLink}>Contact</NavLink>
                </div>

                <div className={styles.actions}>
                    {userId ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                            <div onClick={() => navigate('/notifications')}>
                                <NotificationBell />
                            </div>
                            <div className={styles.profileContainer}>
                                <div className={styles.userProfile} onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}>
                                    <FaUserCircle size={24} />
                                    <span className={styles.username}>{username}</span>
                                </div>
                                {profileDropdownOpen && (
                                    <div className={styles.profileDropdown}>
                                        <button className={styles.dropdownItem} onClick={handleUpdateProfile}>
                                            <FaUserEdit /> Edit Profile
                                        </button>
                                        <button className={styles.dropdownItem} onClick={() => { navigate('/settings'); setProfileDropdownOpen(false); }}>
                                            <FaCog /> Settings
                                        </button>
                                        <button className={`${styles.dropdownItem} ${styles.dangerItem}`} onClick={handleDeleteAccount}>
                                            <FaTrashAlt /> Delete Account
                                        </button>
                                        <button className={styles.dropdownItem} onClick={handleLogout}>
                                            <FaSignOutAlt /> Logout
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : (
                        <button className={styles.loginBtn} onClick={() => navigate('/auth')}>
                            Login
                        </button>
                    )}
                    <button className={styles.mobileToggle} onClick={toggleMenu}>
                        {mobileMenuOpen ? <FaTimes /> : <FaBars />}
                    </button>
                </div>
            </div>
            {/* Mobile Menu */}
            {mobileMenuOpen && (
                <div className={styles.mobileMenu}>
                    <NavLink to="/" onClick={toggleMenu} className={styles.mobileLink}>Home</NavLink>
                    <NavLink to="/pricing" onClick={toggleMenu} className={styles.mobileLink}>Pricing</NavLink>
                    <NavLink to="/vidhi" onClick={toggleMenu} className={styles.mobileLink}>Pro Suite</NavLink>
                    <a href="https://www.livelaw.in/" target="_blank" rel="noopener noreferrer" className={styles.mobileLink} onClick={toggleMenu}>News</a>
                    <NavLink to="/about" onClick={toggleMenu} className={styles.mobileLink}>About Us</NavLink>
                    <NavLink to="/contact" onClick={toggleMenu} className={styles.mobileLink}>Contact</NavLink>
                    {userId && <button onClick={handleLogout} className={styles.mobileLink}>Logout</button>}
                </div>
            )}
        </nav>
    );
};

export default Navbar;
