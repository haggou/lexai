import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { getNotifications, markAsRead, sendManualNotification } from '../controller/notificationController.js';

const router = express.Router();

router.use(protect); // All routes protected

router.get('/', getNotifications);
router.post('/send', sendManualNotification); // Admin Only (Controller checks role)
router.put('/:id/read', markAsRead);

export default router;
