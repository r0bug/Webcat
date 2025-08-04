import { body, param, ValidationChain } from 'express-validator';

export const validateUploadImages: ValidationChain[] = [
  param('id')
    .isInt()
    .withMessage('Invalid item ID')
];

export const validateDeleteImage: ValidationChain[] = [
  param('id')
    .isInt()
    .withMessage('Invalid item ID'),
  param('imageId')
    .isInt()
    .withMessage('Invalid image ID')
];

export const validateReorderImages: ValidationChain[] = [
  param('id')
    .isInt()
    .withMessage('Invalid item ID'),
  body('imageOrders')
    .isArray()
    .withMessage('Image orders must be an array'),
  body('imageOrders.*.imageId')
    .isInt()
    .withMessage('Invalid image ID'),
  body('imageOrders.*.order')
    .isInt({ min: 1, max: 6 })
    .withMessage('Image order must be between 1 and 6')
];