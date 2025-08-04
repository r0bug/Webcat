import { Router } from 'express';
import * as tagController from '../controllers/tagController';
import { handleValidationErrors } from '../utils/validation';
import { validateGetTags } from '../validators/tags';

const router = Router();

// Public routes
router.get('/', validateGetTags, handleValidationErrors, tagController.getAllTags);
router.get('/popular', tagController.getPopularTags);

export default router;