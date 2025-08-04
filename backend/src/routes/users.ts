import { Router } from 'express';
import {
  getAllUsers,
  getUser,
  createUser,
  updateUser,
  toggleUserStatus,
  deleteUser,
  getProfile,
  updateProfile
} from '../controllers/userController';
import { authenticate, authorize } from '../middleware/auth';
import { body, param } from 'express-validator';

const router = Router();

// Validation rules
const userValidation = [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('userType').isIn(['Admin', 'Staff', 'Vendor']).withMessage('Invalid user type'),
  body('phoneNumber').optional().trim(),
  body('contactInfo').optional().trim(),
  body('yfVendorId').optional().trim()
];

const createUserValidation = [
  ...userValidation,
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
];

// Public profile routes
router.get('/profile', authenticate, getProfile);
router.put('/profile', authenticate, [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('phoneNumber').optional().trim(),
  body('contactInfo').optional().trim()
], updateProfile);

// Admin-only routes
router.get('/', authenticate, authorize(['Admin']), getAllUsers);
router.get('/:id', authenticate, authorize(['Admin']), getUser);
router.post('/', authenticate, authorize(['Admin']), createUserValidation, createUser);
router.put('/:id', authenticate, authorize(['Admin']), userValidation, updateUser);
router.put('/:id/status', authenticate, authorize(['Admin']), [
  body('isActive').isBoolean().withMessage('isActive must be a boolean')
], toggleUserStatus);
router.delete('/:id', authenticate, authorize(['Admin']), deleteUser);

export default router;