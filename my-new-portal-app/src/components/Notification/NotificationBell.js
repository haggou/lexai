import React from 'react';
import { FaBell } from 'react-icons/fa';
import { useNotifications } from '../../contexts/NotificationContext';

const NotificationBell = () => {
    const { unreadCount } = useNotifications();

    return (
        <div style={{ position: 'relative', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
            <FaBell size={20} color="var(--text-muted, #94a3b8)" style={{
                transition: 'color 0.2s',
            }}
                onMouseOver={(e) => e.currentTarget.style.color = '#fff'}
                onMouseOut={(e) => e.currentTarget.style.color = '#94a3b8'}
            />
            {unreadCount > 0 && (
                <span style={{
                    position: 'absolute',
                    top: '-6px',
                    right: '-6px',
                    background: '#ef4444',
                    color: '#fff',
                    borderRadius: '50%',
                    padding: '2px 5px',
                    fontSize: '0.65rem',
                    fontWeight: 'bold',
                    boxShadow: '0 2px 5px rgba(0,0,0,0.2)'
                }}>
                    {unreadCount > 9 ? '9+' : unreadCount}
                </span>
            )}
        </div>
    );
};

export default NotificationBell;
