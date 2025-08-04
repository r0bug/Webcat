import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import {
  createEvent,
  getEvents,
  getEvent,
  updateEvent,
  deleteEvent,
  getUpcomingEvents,
  getEventsByMonth
} from '../controllers/eventController';
import { body, query, param } from 'express-validator';
import { validate } from '../utils/validation';

const router = Router();

// Validation rules
const createEventValidation = [
  body('title').trim().notEmpty().withMessage('Title is required')
    .isLength({ max: 200 }).withMessage('Title must be at most 200 characters'),
  body('description').optional().trim(),
  body('eventDate').isISO8601().withMessage('Valid event date is required'),
  body('startTime').optional().matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('Start time must be in HH:MM format'),
  body('endTime').optional().matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('End time must be in HH:MM format'),
  body('location').optional().trim().isLength({ max: 200 })
    .withMessage('Location must be at most 200 characters'),
  validate
];

const updateEventValidation = [
  param('id').isInt().withMessage('Invalid event ID'),
  ...createEventValidation.slice(0, -1), // All create validations except validate
  body('isActive').optional().isBoolean().withMessage('isActive must be a boolean'),
  validate
];

const paginationValidation = [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  validate
];

const monthYearValidation = [
  param('year').isInt({ min: 2020, max: 2100 }).withMessage('Year must be between 2020 and 2100'),
  param('month').isInt({ min: 1, max: 12 }).withMessage('Month must be between 1 and 12'),
  validate
];

// Public routes
router.get('/', paginationValidation, getEvents);
router.get('/upcoming', getUpcomingEvents);
router.get('/calendar/:year/:month', monthYearValidation, getEventsByMonth);
router.get('/:id', param('id').isInt().withMessage('Invalid event ID'), validate, getEvent);

// Protected routes
router.use(authenticate);
router.post('/', createEventValidation, createEvent);
router.put('/:id', updateEventValidation, updateEvent);
router.delete('/:id', param('id').isInt().withMessage('Invalid event ID'), validate, deleteEvent);

export default router;