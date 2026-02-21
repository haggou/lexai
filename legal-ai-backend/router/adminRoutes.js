import express from 'express';
import {
    getStats, getUsers, updateUser, getUserDetails, adjustUserBalance, createUser,
    getSystemConfig, updateSystemConfig,
    getNotifications, createNotification,
    deployToVertex, undeployFromVertex,
    getAuditLogs,
    getCoupons, createCoupon, deleteCoupon,
    getFeedbacks, updateFeedbackStatus,
    getEnvConfig, updateEnvConfig,
    uploadPrompt // Import
} from '../controller/adminController.js';

import { protect, restrictTo } from '../middleware/authMiddleware.js';
import multer from 'multer';

// Multer Setup
const upload = multer({ dest: 'uploads/' });

const router = express.Router();

// Ideally, add middleware here to check if user is admin
router.use(protect);
router.use(restrictTo('admin'));

router.get('/stats', getStats);
router.get('/users', getUsers);
router.post('/users', createUser);
router.get('/users/:id', getUserDetails);
router.post('/users/:id/balance', adjustUserBalance);
router.patch('/users/:id', updateUser);

router.get('/config', getSystemConfig);
router.post('/config', updateSystemConfig);
router.post('/prompts/upload', upload.single('file'), uploadPrompt);

router.get('/notifications', getNotifications);
router.post('/notifications', createNotification);

router.get('/logs', getAuditLogs);

// Coupons
router.get('/coupons', getCoupons);
router.post('/coupons', createCoupon);
router.delete('/coupons/:id', deleteCoupon);

// Feedback
router.get('/feedback', getFeedbacks);
router.patch('/feedback/:id', updateFeedbackStatus);

// Environment Variables
router.get('/env', getEnvConfig);
router.post('/env', updateEnvConfig);

// Cloud Deployment
router.get('/deploy/status', protect, restrictTo('admin'), (await import('../controller/adminController.js')).getDeploymentStatus);
router.post('/deploy/vertex', deployToVertex);
router.delete('/deploy/vertex', undeployFromVertex);
// Frontend seems to call /api/admin/stats probably, or just /api/admin for dashboard? 
// Based on typical patterns, let's expose these.

export default router;
