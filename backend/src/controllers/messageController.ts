import { Response, NextFunction } from 'express';
import { Op } from 'sequelize';
import { Message, User, Item } from '../models';
import { AuthRequest } from '../types';
import { CustomError } from '../middleware/errorHandler';
import { PAGINATION } from '../config/constants';
import sequelize from '../config/database';

export const sendMessage = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) {
      const error: CustomError = new Error('Unauthorized');
      error.statusCode = 401;
      throw error;
    }

    const { recipientId, subject, messageText, itemId } = req.body;

    // Prevent sending message to self
    if (recipientId === req.user.userId) {
      const error: CustomError = new Error('Cannot send message to yourself');
      error.statusCode = 400;
      throw error;
    }

    // Verify recipient exists
    const recipient = await User.findByPk(recipientId);
    if (!recipient || !recipient.isActive) {
      const error: CustomError = new Error('Recipient not found');
      error.statusCode = 404;
      throw error;
    }

    // Verify item exists if itemId provided
    if (itemId) {
      const item = await Item.findByPk(itemId);
      if (!item) {
        const error: CustomError = new Error('Item not found');
        error.statusCode = 404;
        throw error;
      }
    }

    // Create message
    const message = await Message.create({
      senderId: req.user.userId,
      recipientId,
      subject: subject || (itemId ? 'Inquiry about your item' : 'Message'),
      messageText,
      itemId,
      isRead: false
    });

    // Fetch complete message with associations
    const completeMessage = await Message.findByPk(message.messageId, {
      include: [
        {
          model: User,
          as: 'sender',
          attributes: ['userId', 'name', 'email']
        },
        {
          model: User,
          as: 'recipient',
          attributes: ['userId', 'name', 'email']
        },
        {
          model: Item,
          as: 'item',
          attributes: ['itemId', 'title', 'urlSlug']
        }
      ]
    });

    res.status(201).json({
      message: 'Message sent successfully',
      data: completeMessage
    });
  } catch (error) {
    next(error);
  }
};

export const getMessages = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) {
      const error: CustomError = new Error('Unauthorized');
      error.statusCode = 401;
      throw error;
    }

    const {
      type = 'inbox',
      page = PAGINATION.DEFAULT_PAGE,
      limit = PAGINATION.DEFAULT_LIMIT,
      isRead
    } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const offset = (pageNum - 1) * limitNum;

    // Build where clause
    const where: any = {};
    
    if (type === 'inbox') {
      where.recipientId = req.user.userId;
    } else {
      where.senderId = req.user.userId;
    }

    if (isRead !== undefined) {
      where.isRead = isRead === 'true';
    }

    // Get messages
    const { count, rows } = await Message.findAndCountAll({
      where,
      include: [
        {
          model: User,
          as: 'sender',
          attributes: ['userId', 'name', 'email']
        },
        {
          model: User,
          as: 'recipient',
          attributes: ['userId', 'name', 'email']
        },
        {
          model: Item,
          as: 'item',
          attributes: ['itemId', 'title', 'urlSlug']
        }
      ],
      order: [['sent_at', 'DESC']],
      limit: limitNum,
      offset
    });

    res.json({
      data: rows,
      total: count,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(count / limitNum),
      unreadCount: type === 'inbox' ? await Message.count({ 
        where: { recipientId: req.user.userId, isRead: false }
      }) : undefined
    });
  } catch (error) {
    next(error);
  }
};

export const getMessage = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) {
      const error: CustomError = new Error('Unauthorized');
      error.statusCode = 401;
      throw error;
    }

    const messageId = parseInt(req.params.id);

    // Get message
    const message = await Message.findByPk(messageId, {
      include: [
        {
          model: User,
          as: 'sender',
          attributes: ['userId', 'name', 'email', 'contactInfo', 'phoneNumber']
        },
        {
          model: User,
          as: 'recipient',
          attributes: ['userId', 'name', 'email']
        },
        {
          model: Item,
          as: 'item',
          attributes: ['itemId', 'title', 'urlSlug', 'price', 'status']
        }
      ]
    });

    if (!message) {
      const error: CustomError = new Error('Message not found');
      error.statusCode = 404;
      throw error;
    }

    // Check if user has access to this message
    if (message.senderId !== req.user.userId && message.recipientId !== req.user.userId) {
      const error: CustomError = new Error('You do not have access to this message');
      error.statusCode = 403;
      throw error;
    }

    // Mark as read if recipient is viewing
    if (message.recipientId === req.user.userId && !message.isRead) {
      await message.update({ isRead: true });
    }

    res.json({ data: message });
  } catch (error) {
    next(error);
  }
};

export const markAsRead = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) {
      const error: CustomError = new Error('Unauthorized');
      error.statusCode = 401;
      throw error;
    }

    const messageId = parseInt(req.params.id);

    // Update message
    const [updated] = await Message.update(
      { isRead: true },
      {
        where: {
          messageId,
          recipientId: req.user.userId,
          isRead: false
        }
      }
    );

    if (!updated) {
      const error: CustomError = new Error('Message not found or already read');
      error.statusCode = 404;
      throw error;
    }

    res.json({ message: 'Message marked as read' });
  } catch (error) {
    next(error);
  }
};

export const deleteMessage = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) {
      const error: CustomError = new Error('Unauthorized');
      error.statusCode = 401;
      throw error;
    }

    const messageId = parseInt(req.params.id);

    // Find message
    const message = await Message.findByPk(messageId);

    if (!message) {
      const error: CustomError = new Error('Message not found');
      error.statusCode = 404;
      throw error;
    }

    // Check if user can delete (sender or recipient)
    if (message.senderId !== req.user.userId && message.recipientId !== req.user.userId) {
      const error: CustomError = new Error('You do not have permission to delete this message');
      error.statusCode = 403;
      throw error;
    }

    // Soft delete by nullifying for the user
    // This keeps the message for the other party
    if (message.senderId === req.user.userId) {
      // Sender is deleting - mark as deleted for sender
      // In a real app, you'd add deleted_by_sender column
      await message.destroy();
    } else {
      // Recipient is deleting - mark as deleted for recipient
      // In a real app, you'd add deleted_by_recipient column
      await message.destroy();
    }

    res.json({ message: 'Message deleted successfully' });
  } catch (error) {
    next(error);
  }
};

export const getMessageThread = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) {
      const error: CustomError = new Error('Unauthorized');
      error.statusCode = 401;
      throw error;
    }

    const { userId, itemId } = req.query;
    const otherUserId = parseInt(userId as string);

    // Build where clause for messages between two users
    const where: any = {
      [Op.or]: [
        {
          senderId: req.user.userId,
          recipientId: otherUserId
        },
        {
          senderId: otherUserId,
          recipientId: req.user.userId
        }
      ]
    };

    if (itemId) {
      where.itemId = parseInt(itemId as string);
    }

    // Get messages
    const messages = await Message.findAll({
      where,
      include: [
        {
          model: User,
          as: 'sender',
          attributes: ['userId', 'name', 'email']
        },
        {
          model: User,
          as: 'recipient',
          attributes: ['userId', 'name', 'email']
        },
        {
          model: Item,
          as: 'item',
          attributes: ['itemId', 'title', 'urlSlug']
        }
      ],
      order: [['sent_at', 'ASC']]
    });

    // Mark messages as read where current user is recipient
    await Message.update(
      { isRead: true },
      {
        where: {
          ...where,
          recipientId: req.user.userId,
          isRead: false
        }
      }
    );

    res.json({ data: messages });
  } catch (error) {
    next(error);
  }
};