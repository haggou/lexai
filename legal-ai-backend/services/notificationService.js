import Notification from '../models/Notification.js';
import { getIO } from './socketService.js';

/**
 * Send a notification to a specific user.
 * @param {string} userId - The user's ID.
 * @param {string} type - 'FINANCIAL', 'LEGAL_UPDATE', 'SYSTEM', 'DRAFT', 'SECURITY'
 * @param {string} title - Short title.
 * @param {string} message - Detailed message body.
 * @param {object} metadata - Optional IDs or links.
 * @param {Array} actions - Optional [{ label: 'View', link: '/path', primary: true }]
 */
export const notifyUser = async (userId, type, title, message, metadata = {}, actions = []) => {
    try {
        // 1. Persist to DB
        const notification = await Notification.create({
            userId,
            type,
            title,
            message,
            metadata,
            actions
        });

        // 2. Real-time Emit
        try {
            const io = getIO();
            const userRoom = `user_${userId}`;
            io.to(userRoom).emit('lex_pulse', {
                _id: notification._id,
                type,
                title,
                message,
                metadata,
                actions,
                createdAt: notification.createdAt
            });
            // console.log(`📢 Notification Sent to ${userRoom}: ${title}`);
        } catch (socketError) {
            console.warn('Socket.io not ready or failed to emit:', socketError.message);
        }

        return notification;
    } catch (error) {
        console.error('Notification Service Error:', error);
        throw error;
    }
};

/**
 * Send a notification to all admins via the admin_pulse channel.
 */
export const notifyAdmins = async (type, title, message, metadata = {}) => {
    try {
        // We usually don't save admin broadcast ephemeral notifs to *every* admin's DB to save space,
        // or we could save to a specific 'system_admin' user ID if one exists.
        // For now, we will purely broadcast it to the live feed.

        const io = getIO();
        io.to('admin_pulse').emit('admin_pulse', {
            type,
            title,
            message,
            metadata,
            timestamp: new Date()
        });

    } catch (error) {
        console.warn('Failed to notify admins:', error);
    }
};
