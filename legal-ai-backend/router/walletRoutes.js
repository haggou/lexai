import express from 'express';
import { createOrder, verifyPayment, getBalance, getTransactions, getWalletStats } from '../controller/walletController.js';
import { body } from 'express-validator';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

const validateOrder = [
    body('amount').isFloat({ gt: 0 }).withMessage('Amount must be a positive number')
];

const validatePayment = [
    body('razorpay_order_id').notEmpty().withMessage('Order ID is required'),
    body('razorpay_payment_id').notEmpty().withMessage('Payment ID is required'),
    body('razorpay_signature').notEmpty().withMessage('Signature is required'),
    body('amount').isFloat({ gt: 0 }).withMessage('Amount must be valid')
];

router.post('/create-order', protect, validateOrder, createOrder);
router.post('/verify-payment', protect, validatePayment, verifyPayment);
router.get('/balance', protect, getBalance);
router.get('/transactions', protect, getTransactions);
router.get('/stats', protect, getWalletStats);

export default router;
