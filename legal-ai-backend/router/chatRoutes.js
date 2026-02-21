import express from 'express';
import { chat, streamChat, getTokenUsage, getHistory, deleteChat, clearChatHistory } from '../controller/chatController.js';

import multer from 'multer';

const upload = multer({ storage: multer.memoryStorage() });
import { body } from 'express-validator';

const router = express.Router();
import { protect } from '../middleware/authMiddleware.js';

// All chat routes should be protected now
router.use(protect);

const validateChat = [
    body('mode').optional().isIn(['advice', 'draft', 'compare', 'risk_check', 'draft_analysis', 'hallucination_check']).withMessage('Invalid mode'),
    body('model').optional().isString(),
    body('userId').optional().isString()
];

router.post('/', upload.single('file'), validateChat, chat);
router.post('/stream', upload.single('file'), (req, res, next) => {
    console.log('[STREAM ROUTE] Request received:', {
        body: req.body,
        user: req.user?.id,
        headers: req.headers['authorization'],
        file: req.file ? 'Present' : 'None'
    });
    next();
}, validateChat, streamChat);
router.get('/token/:userId', getTokenUsage);
// Updated to match Postman: /api/chat/history
router.get('/history', getHistory);
router.delete('/history/:id', deleteChat);
router.delete('/history', clearChatHistory);

export default router;
