import { Router } from 'express';
import * as messageController from '../controllers/messageController';
import { authenticate } from '../middleware/auth';
import { handleValidationErrors } from '../utils/validation';
import {
  validateSendMessage,
  validateGetMessages,
  validateMessageId,
  validateMarkAsRead,
  validateMessageThread
} from '../validators/messages';

const router = Router();

// All message routes require authentication
router.use(authenticate);

// Message operations
router.post('/', validateSendMessage, handleValidationErrors, messageController.sendMessage);
router.get('/', validateGetMessages, handleValidationErrors, messageController.getMessages);
router.get('/thread', validateMessageThread, handleValidationErrors, messageController.getMessageThread);
router.get('/:id', validateMessageId, handleValidationErrors, messageController.getMessage);
router.put('/:id/read', validateMarkAsRead, handleValidationErrors, messageController.markAsRead);
router.delete('/:id', validateMessageId, handleValidationErrors, messageController.deleteMessage);

export default router;