import express from 'express';
import { getProfile, updateProfile, deleteProfile, getAllUsers, submitFeedback, getPublicConfig } from '../controller/userController.js';
import { protect, restrictTo } from '../middleware/authMiddleware.js';
import { body } from 'express-validator';
import { getUserPortals, addUserPortal, deleteUserPortal } from '../controller/portalController.js';

const router = express.Router();

// protect all routes
router.use(protect);

// 0. System Config
router.get('/config', getPublicConfig);

// 1. Self Profile Management
router.get('/profile', getProfile);
router.post('/feedback', submitFeedback); // Submit Feedback
router.put('/profile', [
    body('email').optional().isEmail(),
    body('password').optional().isLength({ min: 6 })
], updateProfile); // Self update
router.delete('/profile', deleteProfile); // Self delete

// 2. Admin Management (Zero to Hero)
// Admin can access anyone by ID
router.get('/:id', restrictTo('admin'), getProfile);
router.put('/:id', restrictTo('admin'), updateProfile);
router.delete('/:id', restrictTo('admin'), deleteProfile);

// List users (Admin)
router.get('/', restrictTo('admin'), getAllUsers);

// 3. User-Specific Portals
router.get('/:id/portals', getUserPortals); // Fetch portals for a user
router.post('/:id/portals', addUserPortal); // Add a new portal for a user
router.delete('/:id/portals/:portalId', deleteUserPortal); // Delete a portal

export default router;
