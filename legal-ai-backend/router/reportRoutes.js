import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { body } from 'express-validator';
import { saveReport, getReports, getReportById, deleteReport } from '../controller/reportController.js';

const router = express.Router();

router.use(protect); // All routes protected

// POST /api/reports - Save new
router.post(
    '/',
    [
        body('type').isIn(['RISK_CHECK', 'DRAFT_ANALYSIS']).withMessage('Invalid report type'),
        body('rawContent').notEmpty().withMessage('Content is required')
    ],
    saveReport
);

// GET /api/reports - List (Query: type, limit)
router.get('/', getReports);

// GET /api/reports/:id - Details
router.get('/:id', getReportById);

// DELETE /api/reports/:id
router.delete('/:id', deleteReport);

export default router;
