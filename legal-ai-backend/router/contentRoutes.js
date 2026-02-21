
import express from 'express';
import { getTemplates, createTemplate, deleteTemplate, updateTemplate } from '../controller/contentController.js';
import { protect, restrictTo } from '../middleware/authMiddleware.js';

const router = express.Router();

// Public (Authenticted) can view
router.get('/templates', protect, getTemplates);

// Only Admin can manage
router.post('/templates', protect, restrictTo('admin'), createTemplate);
router.patch('/templates/:id', protect, restrictTo('admin'), updateTemplate);
router.delete('/templates/:id', protect, restrictTo('admin'), deleteTemplate);

export default router;
