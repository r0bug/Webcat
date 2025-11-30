import { Router } from 'express';
import * as contentController from '../controllers/contentController';
import { authenticate } from '../middleware/auth';

const router = Router();

// Public route to get content
router.get('/', contentController.getContent);

// Protected route to update content (admin only)
router.put('/', authenticate, contentController.updateContent);

export default router;