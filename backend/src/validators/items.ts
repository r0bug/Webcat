import { body, query, param, ValidationChain } from 'express-validator';
import { ITEM_STATUS } from '../config/constants';

export const validateCreateItem: ValidationChain[] = [
  body('title')
    .trim()
    .notEmpty()
    .withMessage('Title is required')
    .isLength({ min: 3, max: 200 })
    .withMessage('Title must be between 3 and 200 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 5000 })
    .withMessage('Description must not exceed 5000 characters'),
  body('price')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Price must be a positive number'),
  body('location')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Location must not exceed 100 characters'),
  body('contactInfo')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Contact info must not exceed 200 characters'),
  body('status')
    .optional()
    .isIn(Object.values(ITEM_STATUS))
    .withMessage('Invalid status')
];

export const validateUpdateItem: ValidationChain[] = [
  param('id')
    .isInt()
    .withMessage('Invalid item ID'),
  body('title')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Title cannot be empty')
    .isLength({ min: 3, max: 200 })
    .withMessage('Title must be between 3 and 200 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 5000 })
    .withMessage('Description must not exceed 5000 characters'),
  body('price')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Price must be a positive number'),
  body('location')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Location must not exceed 100 characters'),
  body('contactInfo')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Contact info must not exceed 200 characters'),
  body('status')
    .optional()
    .isIn(Object.values(ITEM_STATUS))
    .withMessage('Invalid status')
];

export const validateGetItems: ValidationChain[] = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  query('status')
    .optional()
    .custom((value) => {
      if (!value || value === '') return true; // Allow empty string
      return Object.values(ITEM_STATUS).includes(value);
    })
    .withMessage('Invalid status'),
  query('vendorId')
    .optional()
    .isInt()
    .withMessage('Invalid vendor ID'),
  query('minPrice')
    .optional()
    .custom((value) => {
      if (!value || value === '') return true; // Allow empty string
      const num = parseFloat(value);
      return !isNaN(num) && num >= 0;
    })
    .withMessage('Min price must be a positive number'),
  query('maxPrice')
    .optional()
    .custom((value) => {
      if (!value || value === '') return true; // Allow empty string
      const num = parseFloat(value);
      return !isNaN(num) && num >= 0;
    })
    .withMessage('Max price must be a positive number'),
  query('search')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Search query too long'),
  query('tags')
    .optional()
    .custom((value) => {
      if (typeof value === 'string') return true;
      if (Array.isArray(value)) return value.every(tag => typeof tag === 'string');
      return false;
    })
    .withMessage('Tags must be a string or array of strings'),
  query('sortBy')
    .optional()
    .isIn(['dateAdded', 'price', 'title', 'viewCount'])
    .withMessage('Invalid sort field'),
  query('sortOrder')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('Sort order must be asc or desc')
];

export const validateItemId: ValidationChain[] = [
  param('id')
    .isInt()
    .withMessage('Invalid item ID')
];

export const validateItemSlug: ValidationChain[] = [
  param('slug')
    .trim()
    .notEmpty()
    .withMessage('Item slug is required')
    .matches(/^[a-z0-9-]+$/)
    .withMessage('Invalid item slug format')
];