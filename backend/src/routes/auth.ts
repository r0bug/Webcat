import { Router } from 'express';
import * as authController from '../controllers/authController';
import { authenticate } from '../middleware/auth';
import { handleValidationErrors } from '../utils/validation';
import { authLimiter, passwordResetLimiter } from '../middleware/rateLimiter';
import {
  validateLogin,
  validateRegister,
  validateForgotPassword,
  validateResetPassword,
  validateRefreshToken,
  validateChangePassword
} from '../validators/auth';

const router = Router();

// Public routes
router.post('/register', authLimiter, validateRegister, handleValidationErrors, authController.register);
router.post('/login', authLimiter, validateLogin, handleValidationErrors, authController.login);
router.post('/refresh', validateRefreshToken, handleValidationErrors, authController.refreshAccessToken);
router.post('/forgot-password', passwordResetLimiter, validateForgotPassword, handleValidationErrors, authController.forgotPassword);
router.post('/reset-password', passwordResetLimiter, validateResetPassword, handleValidationErrors, authController.resetPassword);

// Protected routes
router.get('/me', authenticate, authController.getProfile);
router.put('/me', authenticate, authController.updateProfile);
router.post('/change-password', authenticate, validateChangePassword, handleValidationErrors, authController.changePassword);

export default router;