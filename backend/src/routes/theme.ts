import { Router } from 'express';
import {
  getThemeSettings,
  getPublicThemeSettings,
  updateThemeSettings,
  resetThemeSettings
} from '../controllers/themeController';
import { authenticate, authorize } from '../middleware/auth';
import { body } from 'express-validator';

const router = Router();

// Public route - get theme settings for frontend
router.get('/public', getPublicThemeSettings);

// Admin routes
router.get('/', authenticate, authorize(['Admin']), getThemeSettings);

router.put('/', 
  authenticate, 
  authorize(['Admin']),
  [
    body('settings').isArray().withMessage('Settings must be an array'),
    body('settings.*.id').isInt().withMessage('Setting ID must be an integer'),
    body('settings.*.value').exists().withMessage('Setting value is required')
  ],
  updateThemeSettings
);

router.post('/reset', 
  authenticate, 
  authorize(['Admin']),
  [
    body('category').optional().isString().withMessage('Category must be a string')
  ],
  resetThemeSettings
);

export default router;