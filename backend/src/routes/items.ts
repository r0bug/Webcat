import { Router } from 'express';
import * as itemController from '../controllers/itemController';
import * as tagController from '../controllers/tagController';
import * as imageController from '../controllers/imageController';
import { authenticate, authorize } from '../middleware/auth';
import { handleValidationErrors } from '../utils/validation';
import { upload, handleUploadError } from '../config/multer';
import { uploadCsv, handleCsvUploadError } from '../config/multerCsv';
import {
  validateCreateItem,
  validateUpdateItem,
  validateGetItems,
  validateItemId,
  validateItemSlug
} from '../validators/items';
import {
  validateAddTags,
  validateRemoveTag
} from '../validators/tags';
import {
  validateUploadImages,
  validateDeleteImage,
  validateReorderImages
} from '../validators/images';

const router = Router();

// Public routes
router.get('/', validateGetItems, handleValidationErrors, itemController.getItems);
router.get('/id/:id', validateItemId, handleValidationErrors, itemController.getItemById);
router.get('/slug/:slug', validateItemSlug, handleValidationErrors, itemController.getItemBySlug);

// Protected routes
router.post('/', authenticate, validateCreateItem, handleValidationErrors, itemController.createItem);
router.put('/:id', authenticate, validateUpdateItem, handleValidationErrors, itemController.updateItem);
router.delete('/:id', authenticate, validateItemId, handleValidationErrors, itemController.deleteItem);

// User's own items
router.get('/my-items', authenticate, validateGetItems, handleValidationErrors, itemController.getMyItems);

// Batch upload
router.post('/batch-upload', 
  authenticate, 
  uploadCsv.single('csv'),
  handleCsvUploadError,
  itemController.batchUploadItems
);

// Tag management on items
router.post('/:id/tags', authenticate, validateAddTags, handleValidationErrors, tagController.addTagsToItem);
router.delete('/:id/tags/:tagId', authenticate, validateRemoveTag, handleValidationErrors, tagController.removeTagFromItem);

// Image management
router.post('/:id/images', 
  authenticate, 
  validateUploadImages, 
  handleValidationErrors, 
  upload.array('images', 6),
  handleUploadError,
  imageController.uploadImages
);
router.delete('/:id/images/:imageId', authenticate, validateDeleteImage, handleValidationErrors, imageController.deleteImage);
router.put('/:id/images/reorder', authenticate, validateReorderImages, handleValidationErrors, imageController.reorderImages);

export default router;