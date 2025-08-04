import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import {
  createPost,
  getPosts,
  getPost,
  updatePost,
  deletePost,
  getPopularPosts,
  searchPosts
} from '../controllers/forumController';
import { body, query, param } from 'express-validator';
import { validate } from '../utils/validation';

const router = Router();

// Validation rules
const createPostValidation = [
  body('content').trim().notEmpty().withMessage('Content is required'),
  body('title')
    .if(body('parentId').not().exists())
    .trim().notEmpty().withMessage('Title is required for new threads')
    .isLength({ max: 200 }).withMessage('Title must be at most 200 characters'),
  body('parentId').optional().isInt().withMessage('Parent ID must be a number'),
  validate
];

const updatePostValidation = [
  param('id').isInt().withMessage('Invalid post ID'),
  body('content').trim().notEmpty().withMessage('Content is required'),
  validate
];

const paginationValidation = [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  validate
];

// Public routes
router.get('/', paginationValidation, getPosts);
router.get('/search', paginationValidation, searchPosts);
router.get('/popular', getPopularPosts);
router.get('/:id', param('id').isInt().withMessage('Invalid post ID'), validate, getPost);

// Protected routes
router.use(authenticate);
router.post('/', createPostValidation, createPost);
router.put('/:id', updatePostValidation, updatePost);
router.delete('/:id', param('id').isInt().withMessage('Invalid post ID'), validate, deletePost);

export default router;