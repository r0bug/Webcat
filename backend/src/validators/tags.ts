import { body, param, ValidationChain } from 'express-validator';

export const validateAddTags: ValidationChain[] = [
  param('id')
    .isInt()
    .withMessage('Invalid item ID'),
  body('tags')
    .isArray({ min: 1 })
    .withMessage('Tags must be an array with at least one tag'),
  body('tags.*')
    .trim()
    .notEmpty()
    .withMessage('Tag cannot be empty')
    .isLength({ max: 50 })
    .withMessage('Tag must not exceed 50 characters')
    .matches(/^[a-zA-Z0-9\s-]+$/)
    .withMessage('Tag can only contain letters, numbers, spaces, and hyphens')
];

export const validateRemoveTag: ValidationChain[] = [
  param('id')
    .isInt()
    .withMessage('Invalid item ID'),
  param('tagId')
    .isInt()
    .withMessage('Invalid tag ID')
];

export const validateGetTags: ValidationChain[] = [
  // No validation needed for get all tags
];