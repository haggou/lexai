import Notification from '../models/Notification.js';
import User from '../models/User.js';
import { notifyUser } from '../services/notificationService.js';

export const getNotifications = async (req, res) => {
    try {
        const userId = req.user._id;
        const page = parseInt(req.query.page) || 1;
        const limit = 20;
        const skip = (page - 1) * limit;

        const notifications = await Notification.find({ userId })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        const total = await Notification.countDocuments({ userId });
        const unreadCount = await Notification.countDocuments({ userId, isRead: false });

        res.status(200).json({
            status: 'success',
            data: notifications,
            meta: {
                total,
                page,
                unreadCount
            }
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const markAsRead = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user._id;

        // If ID is 'all', mark all as read
        if (id === 'all') {
            await Notification.updateMany({ userId, isRead: false }, { isRead: true });
            return res.status(200).json({ status: 'success', message: 'All marked as read' });
        }

        const notification = await Notification.findOneAndUpdate(
            { _id: id, userId },
            { isRead: true },
            { new: true }
        );

        if (!notification) {
            return res.status(404).json({ error: 'Notification not found' });
        }

        res.status(200).json({ status: 'success', data: notification });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const sendManualNotification = async (req, res) => {
    try {
        // 1. Admin Security Check
        if (req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Not authorized as admin' });
        }

        const { targetUserId, type, title, message, actionLink, actionLabel } = req.body;

        if (!title || !message) {
            return res.status(400).json({ error: 'Title and Message are required' });
        }

        // Construct Actions if provided
        const actions = [];
        if (actionLink && actionLabel) {
            actions.push({ label: actionLabel, link: actionLink, primary: true });
        }

        // 2. Determine Targets
        let targetIds = [];
        if (targetUserId === 'ALL') {
            const users = await User.findAll({}, 99999, 0);
            targetIds = users.map(u => u._id);
        } else {
            targetIds = [targetUserId];
        }

        // 3. Send Loop (Basic)
        let count = 0;
        for (const uid of targetIds) {
            await notifyUser(uid, type || 'SYSTEM', title, message, {}, actions);
            count++;
        }

        res.status(200).json({ status: 'success', sentCount: count });

    } catch (error) {
        console.error("Manual Notification Error:", error);
        res.status(500).json({ error: error.message });
    }
};
