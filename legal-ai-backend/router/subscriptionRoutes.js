import express from 'express';
import { verifySubscription, getPlans, createSubscriptionOrder, getSubscriptionStatus, upgradeSubscription } from '../controller/subscriptionController.js';
import { protect } from '../middleware/authMiddleware.js';
import { body } from 'express-validator';

const router = express.Router();

router.post('/create-order', protect, [
    body('plan').isIn(['pro', 'csc']).withMessage('Invalid plan')
], createSubscriptionOrder);

// New routes to match Frontend Context
router.get('/status/:id', getSubscriptionStatus);
router.post('/upgrade', protect, upgradeSubscription);

router.post('/verify', protect, verifySubscription);
router.get('/', getPlans);

export default router;
