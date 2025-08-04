import { Router } from 'express';
import authRoutes from './auth';
import itemRoutes from './items';
import tagRoutes from './tags';
import messageRoutes from './messages';
import forumRoutes from './forumRoutes';
import eventRoutes from './eventRoutes';

const router = Router();

// Mount routes
router.use('/auth', authRoutes);
router.use('/items', itemRoutes);
router.use('/tags', tagRoutes);
router.use('/messages', messageRoutes);
router.use('/forum', forumRoutes);
router.use('/events', eventRoutes);

// Health check route
router.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

export default router;