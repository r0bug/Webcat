import { Response, NextFunction } from 'express';
import { Item, ItemImage, Tag, ItemTag } from '../models';
import { AuthRequest } from '../types';
import { CustomError } from '../middleware/errorHandler';
import * as itemService from '../services/itemService';
import { USER_TYPES } from '../config/constants';
import sequelize from '../config/database';

export const createItem = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  const transaction = await sequelize.transaction();
  
  try {
    if (!req.user) {
      const error: CustomError = new Error('Unauthorized');
      error.statusCode = 401;
      throw error;
    }

    const { title, description, price, location, contactInfo, status } = req.body;

    // Create item
    const item = await Item.create({
      title,
      description,
      price: price ? parseFloat(price) : undefined,
      vendorId: req.user.userId,
      location,
      contactInfo,
      status: status || 'Available'
    }, { transaction });

    await transaction.commit();

    // Fetch complete item with associations
    const completeItem = await itemService.getItemById(item.itemId);

    res.status(201).json({
      message: 'Item created successfully',
      item: completeItem
    });
  } catch (error) {
    await transaction.rollback();
    next(error);
  }
};

export const getItems = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const filters = {
      page: req.query.page ? parseInt(req.query.page as string) : undefined,
      limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
      status: req.query.status as any,
      vendorId: req.query.vendorId ? parseInt(req.query.vendorId as string) : undefined,
      minPrice: req.query.minPrice ? parseFloat(req.query.minPrice as string) : undefined,
      maxPrice: req.query.maxPrice ? parseFloat(req.query.maxPrice as string) : undefined,
      tags: req.query.tags,
      search: req.query.search as string,
      sortBy: req.query.sortBy as string,
      sortOrder: req.query.sortOrder as 'asc' | 'desc'
    };

    const result = await itemService.getItems(filters);

    res.json(result);
  } catch (error) {
    next(error);
  }
};

export const getItemById = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const itemId = parseInt(req.params.id);
    
    const item = await itemService.getItemById(itemId);
    
    if (!item) {
      const error: CustomError = new Error('Item not found');
      error.statusCode = 404;
      throw error;
    }

    // Increment view count
    await itemService.incrementViewCount(itemId);

    res.json({ item });
  } catch (error) {
    next(error);
  }
};

export const getItemBySlug = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { slug } = req.params;
    
    const item = await itemService.getItemBySlug(slug);
    
    if (!item) {
      const error: CustomError = new Error('Item not found');
      error.statusCode = 404;
      throw error;
    }

    // Increment view count
    await itemService.incrementViewCount(item.itemId);

    res.json({ item });
  } catch (error) {
    next(error);
  }
};

export const updateItem = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) {
      const error: CustomError = new Error('Unauthorized');
      error.statusCode = 401;
      throw error;
    }

    const itemId = parseInt(req.params.id);
    const { title, description, price, location, contactInfo, status } = req.body;

    // Find item
    const item = await Item.findByPk(itemId);
    
    if (!item) {
      const error: CustomError = new Error('Item not found');
      error.statusCode = 404;
      throw error;
    }

    // Check permissions
    const isOwner = itemService.checkItemOwnership(item, req.user.userId);
    const canEdit = isOwner || req.user.userType === USER_TYPES.ADMIN || req.user.userType === USER_TYPES.STAFF;

    if (!canEdit) {
      const error: CustomError = new Error('You do not have permission to edit this item');
      error.statusCode = 403;
      throw error;
    }

    // Update item
    await item.update({
      title: title || item.title,
      description: description !== undefined ? description : item.description,
      price: price !== undefined ? parseFloat(price) : item.price,
      location: location !== undefined ? location : item.location,
      contactInfo: contactInfo !== undefined ? contactInfo : item.contactInfo,
      status: status || item.status
    });

    // Regenerate slug if title changed
    if (title && title !== item.title) {
      item.urlSlug = Item.generateSlug(title, item.itemId);
      await item.save();
    }

    // Fetch updated item with associations
    const updatedItem = await itemService.getItemById(itemId);

    res.json({
      message: 'Item updated successfully',
      item: updatedItem
    });
  } catch (error) {
    next(error);
  }
};

export const deleteItem = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) {
      const error: CustomError = new Error('Unauthorized');
      error.statusCode = 401;
      throw error;
    }

    const itemId = parseInt(req.params.id);

    // Find item
    const item = await Item.findByPk(itemId);
    
    if (!item) {
      const error: CustomError = new Error('Item not found');
      error.statusCode = 404;
      throw error;
    }

    // Check permissions
    const isOwner = itemService.checkItemOwnership(item, req.user.userId);
    const canDelete = isOwner || req.user.userType === USER_TYPES.ADMIN;

    if (!canDelete) {
      const error: CustomError = new Error('You do not have permission to delete this item');
      error.statusCode = 403;
      throw error;
    }

    // Soft delete by changing status
    await item.update({ status: 'Removed' });

    res.json({
      message: 'Item deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

export const getMyItems = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) {
      const error: CustomError = new Error('Unauthorized');
      error.statusCode = 401;
      throw error;
    }

    const filters = {
      page: req.query.page ? parseInt(req.query.page as string) : undefined,
      limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
      vendorId: req.user.userId,
      status: req.query.status as any,
      sortBy: req.query.sortBy as string,
      sortOrder: req.query.sortOrder as 'asc' | 'desc'
    };

    const result = await itemService.getItems(filters);

    res.json(result);
  } catch (error) {
    next(error);
  }
};