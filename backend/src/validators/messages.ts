import { body, param, query, ValidationChain } from 'express-validator';

export const validateSendMessage: ValidationChain[] = [
  body('recipientId')
    .isInt()
    .withMessage('Invalid recipient ID'),
  body('subject')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Subject must not exceed 200 characters'),
  body('messageText')
    .trim()
    .notEmpty()
    .withMessage('Message text is required')
    .isLength({ max: 5000 })
    .withMessage('Message must not exceed 5000 characters'),
  body('itemId')
    .optional()
    .isInt()
    .withMessage('Invalid item ID')
];

export const validateGetMessages: ValidationChain[] = [
  query('type')
    .optional()
    .isIn(['inbox', 'sent'])
    .withMessage('Type must be inbox or sent'),
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  query('isRead')
    .optional()
    .isBoolean()
    .withMessage('isRead must be a boolean')
];

export const validateMessageId: ValidationChain[] = [
  param('id')
    .isInt()
    .withMessage('Invalid message ID')
];

export const validateMarkAsRead: ValidationChain[] = [
  param('id')
    .isInt()
    .withMessage('Invalid message ID')
];

export const validateMessageThread: ValidationChain[] = [
  query('userId')
    .isInt()
    .withMessage('Invalid user ID'),
  query('itemId')
    .optional()
    .isInt()
    .withMessage('Invalid item ID')
];