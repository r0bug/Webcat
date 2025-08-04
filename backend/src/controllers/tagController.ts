import { Response, NextFunction } from 'express';
import { Tag, ItemTag, Item } from '../models';
import { AuthRequest } from '../types';
import { CustomError } from '../middleware/errorHandler';
import { USER_TYPES } from '../config/constants';
import * as itemService from '../services/itemService';
import sequelize from '../config/database';

export const addTagsToItem = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  const transaction = await sequelize.transaction();

  try {
    if (!req.user) {
      const error: CustomError = new Error('Unauthorized');
      error.statusCode = 401;
      throw error;
    }

    const itemId = parseInt(req.params.id);
    const { tags } = req.body;

    // Find item
    const item = await Item.findByPk(itemId);
    
    if (!item) {
      const error: CustomError = new Error('Item not found');
      error.statusCode = 404;
      throw error;
    }

    // Check permissions
    const isOwner = itemService.checkItemOwnership(item, req.user.userId);
    const canAddTags = isOwner || req.user.userType === USER_TYPES.ADMIN || req.user.userType === USER_TYPES.STAFF;

    if (!canAddTags) {
      const error: CustomError = new Error('You do not have permission to add tags to this item');
      error.statusCode = 403;
      throw error;
    }

    // Process tags
    const tagInstances = await Promise.all(
      tags.map(async (tagName: string) => {
        const normalizedTag = tagName.toLowerCase().trim();
        const [tag] = await Tag.findOrCreate({
          where: { tagName: normalizedTag },
          defaults: { tagName: normalizedTag },
          transaction
        });
        return tag;
      })
    );

    // Add tags to item
    for (const tag of tagInstances) {
      await ItemTag.findOrCreate({
        where: {
          itemId,
          tagId: tag.tagId
        },
        defaults: {
          itemId,
          tagId: tag.tagId,
          addedByUserId: req.user.userId
        },
        transaction
      });
    }

    await transaction.commit();

    // Fetch updated item with tags
    const updatedItem = await itemService.getItemById(itemId);

    res.json({
      message: 'Tags added successfully',
      item: updatedItem
    });
  } catch (error) {
    await transaction.rollback();
    next(error);
  }
};

export const removeTagFromItem = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) {
      const error: CustomError = new Error('Unauthorized');
      error.statusCode = 401;
      throw error;
    }

    const itemId = parseInt(req.params.id);
    const tagId = parseInt(req.params.tagId);

    // Find item
    const item = await Item.findByPk(itemId);
    
    if (!item) {
      const error: CustomError = new Error('Item not found');
      error.statusCode = 404;
      throw error;
    }

    // Check permissions
    const isOwner = itemService.checkItemOwnership(item, req.user.userId);
    const canRemoveTags = isOwner || req.user.userType === USER_TYPES.ADMIN || req.user.userType === USER_TYPES.STAFF;

    if (!canRemoveTags) {
      const error: CustomError = new Error('You do not have permission to remove tags from this item');
      error.statusCode = 403;
      throw error;
    }

    // Remove tag from item
    const deleted = await ItemTag.destroy({
      where: {
        itemId,
        tagId
      }
    });

    if (!deleted) {
      const error: CustomError = new Error('Tag not found on this item');
      error.statusCode = 404;
      throw error;
    }

    res.json({
      message: 'Tag removed successfully'
    });
  } catch (error) {
    next(error);
  }
};

export const getAllTags = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const tags = await Tag.findAll({
      attributes: [
        'tagId',
        'tagName',
        [sequelize.fn('COUNT', sequelize.col('items.item_id')), 'itemCount']
      ],
      include: [
        {
          model: Item,
          as: 'items',
          attributes: [],
          through: { attributes: [] },
          where: { status: 'Available' },
          required: false
        }
      ],
      group: ['Tag.tag_id'],
      order: [[sequelize.literal('itemCount'), 'DESC']]
    });

    res.json({ tags });
  } catch (error) {
    next(error);
  }
};

export const getPopularTags = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;

    const tags = await Tag.findAll({
      attributes: [
        'tagId',
        'tagName',
        [sequelize.fn('COUNT', sequelize.col('items.item_id')), 'itemCount']
      ],
      include: [
        {
          model: Item,
          as: 'items',
          attributes: [],
          through: { attributes: [] },
          where: { status: 'Available' },
          required: true
        }
      ],
      group: ['Tag.tag_id'],
      order: [[sequelize.literal('itemCount'), 'DESC']],
      limit,
      having: sequelize.literal('itemCount > 0')
    });

    res.json({ tags });
  } catch (error) {
    next(error);
  }
};