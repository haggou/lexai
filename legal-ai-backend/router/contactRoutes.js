
import express from 'express';
import { body } from 'express-validator';
import { submitContactForm } from '../controller/contactController.js';

const router = express.Router();

router.post('/', [
    body('name').notEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('Valid email is required'),
    body('subject').notEmpty().withMessage('Subject is required'),
    body('message').notEmpty().withMessage('Message is required')
], submitContactForm);

export default router;
