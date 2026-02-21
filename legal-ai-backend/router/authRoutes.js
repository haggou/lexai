import express from 'express';
import { register, login, generateOTP, resetPassword, logout, adminLogin, adminRegister } from '../controller/authController.js';
import { body } from 'express-validator';

const router = express.Router();

const validateRegister = [
    body('username').notEmpty().withMessage('Username is required'),
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be 6+ chars'),
    body('mobile').notEmpty().withMessage('Mobile number is required'),
    body('whatsapp').notEmpty().withMessage('WhatsApp number is required'),
    body('profession').isIn(['lawyer', 'lekhpal', 'csc user', 'individual', 'other']).withMessage('Invalid profession selected'),
    body('termsAgreed').equals('true').withMessage('You must agree to Terms & Conditions')
];

router.post('/register', validateRegister, register);
router.post('/login', login);
router.post('/otp/generate', generateOTP); // For Login with OTP or Forgot Password
router.post('/password/reset', resetPassword); // Final step of forgot password
router.post('/logout', logout);
router.post('/admin/login', adminLogin);
router.post('/admin/register', adminRegister);

export default router;
