import { Response, NextFunction } from 'express';
import fs from 'fs/promises';
import { Item, ItemImage } from '../models';
import { AuthRequest } from '../types';
import { CustomError } from '../middleware/errorHandler';
import { USER_TYPES, MAX_IMAGES_PER_ITEM } from '../config/constants';
import * as itemService from '../services/itemService';
import { imageProcessingService } from '../services/imageProcessingService';
import sequelize from '../config/database';

export const uploadImages = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  const transaction = await sequelize.transaction();

  try {
    if (!req.user) {
      const error: CustomError = new Error('Unauthorized');
      error.statusCode = 401;
      throw error;
    }

    const itemId = parseInt(req.params.id);
    const files = req.files as Express.Multer.File[];

    if (!files || files.length === 0) {
      const error: CustomError = new Error('No files uploaded');
      error.statusCode = 400;
      throw error;
    }

    // Find item
    const item = await Item.findByPk(itemId, {
      include: [{
        model: ItemImage,
        as: 'images'
      }]
    });
    
    if (!item) {
      // Clean up uploaded files
      await Promise.all(files.map(file => fs.unlink(file.path).catch(() => {})));
      
      const error: CustomError = new Error('Item not found');
      error.statusCode = 404;
      throw error;
    }

    // Check permissions
    const isOwner = itemService.checkItemOwnership(item, req.user.userId);
    const canUpload = isOwner || req.user.userType === USER_TYPES.ADMIN || req.user.userType === USER_TYPES.STAFF;

    if (!canUpload) {
      // Clean up uploaded files
      await Promise.all(files.map(file => fs.unlink(file.path).catch(() => {})));
      
      const error: CustomError = new Error('You do not have permission to upload images for this item');
      error.statusCode = 403;
      throw error;
    }

    // Check image limit
    const currentImageCount = (item as any).images?.length || 0;
    if (currentImageCount + files.length > MAX_IMAGES_PER_ITEM) {
      // Clean up uploaded files
      await Promise.all(files.map(file => fs.unlink(file.path).catch(() => {})));
      
      const error: CustomError = new Error(`Cannot exceed ${MAX_IMAGES_PER_ITEM} images per item. Current: ${currentImageCount}`);
      error.statusCode = 400;
      throw error;
    }

    // Process images and create records
    const newImages = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const imageOrder = currentImageCount + i + 1;
      
      // Process image with Sharp
      const processedImage = await imageProcessingService.processImage(
        file.path,
        itemId
      );
      
      // Create image record with variants
      const imageRecord = await ItemImage.create({
        itemId,
        imageUrl: processedImage.original,
        imageOrder,
        altText: req.body.altTexts?.[i] || `${item.title} - Image ${imageOrder}`,
        variants: JSON.stringify(processedImage.variants)
      }, { transaction });
      
      newImages.push(imageRecord);
    }

    await transaction.commit();

    // Fetch updated item with all images
    const updatedItem = await itemService.getItemById(itemId);

    res.json({
      message: 'Images uploaded successfully',
      images: newImages,
      item: updatedItem
    });
  } catch (error) {
    await transaction.rollback();
    
    // Clean up uploaded files on error
    if (req.files) {
      const files = req.files as Express.Multer.File[];
      await Promise.all(files.map(file => fs.unlink(file.path).catch(() => {})));
    }
    
    next(error);
  }
};

export const deleteImage = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  const transaction = await sequelize.transaction();

  try {
    if (!req.user) {
      const error: CustomError = new Error('Unauthorized');
      error.statusCode = 401;
      throw error;
    }

    const itemId = parseInt(req.params.id);
    const imageId = parseInt(req.params.imageId);

    // Find image
    const image = await ItemImage.findOne({
      where: { imageId, itemId }
    });
    
    if (!image) {
      const error: CustomError = new Error('Image not found');
      error.statusCode = 404;
      throw error;
    }

    // Find item to check permissions
    const item = await Item.findByPk(itemId);
    if (!item) {
      const error: CustomError = new Error('Item not found');
      error.statusCode = 404;
      throw error;
    }

    // Check permissions
    const isOwner = itemService.checkItemOwnership(item, req.user.userId);
    const canDelete = isOwner || req.user.userType === USER_TYPES.ADMIN || req.user.userType === USER_TYPES.STAFF;

    if (!canDelete) {
      const error: CustomError = new Error('You do not have permission to delete this image');
      error.statusCode = 403;
      throw error;
    }

    // Delete all image variants from filesystem
    await imageProcessingService.deleteImageVariants(image.imageUrl);

    // Delete image record
    await image.destroy({ transaction });

    // Reorder remaining images
    const remainingImages = await ItemImage.findAll({
      where: { itemId },
      order: [['image_order', 'ASC']],
      transaction
    });

    await Promise.all(
      remainingImages.map((img, index) => 
        img.update({ imageOrder: index + 1 }, { transaction })
      )
    );

    await transaction.commit();

    res.json({
      message: 'Image deleted successfully'
    });
  } catch (error) {
    await transaction.rollback();
    next(error);
  }
};

export const reorderImages = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  const transaction = await sequelize.transaction();

  try {
    if (!req.user) {
      const error: CustomError = new Error('Unauthorized');
      error.statusCode = 401;
      throw error;
    }

    const itemId = parseInt(req.params.id);
    const { imageOrders } = req.body;

    // Find item to check permissions
    const item = await Item.findByPk(itemId);
    if (!item) {
      const error: CustomError = new Error('Item not found');
      error.statusCode = 404;
      throw error;
    }

    // Check permissions
    const isOwner = itemService.checkItemOwnership(item, req.user.userId);
    const canReorder = isOwner || req.user.userType === USER_TYPES.ADMIN || req.user.userType === USER_TYPES.STAFF;

    if (!canReorder) {
      const error: CustomError = new Error('You do not have permission to reorder images');
      error.statusCode = 403;
      throw error;
    }

    // Validate all images belong to this item
    const imageIds = imageOrders.map((io: any) => io.imageId);
    const images = await ItemImage.findAll({
      where: {
        imageId: imageIds,
        itemId
      },
      transaction
    });

    if (images.length !== imageOrders.length) {
      const error: CustomError = new Error('Invalid image IDs');
      error.statusCode = 400;
      throw error;
    }

    // Update image orders
    await Promise.all(
      imageOrders.map((io: any) => 
        ItemImage.update(
          { imageOrder: io.order },
          { 
            where: { imageId: io.imageId, itemId },
            transaction
          }
        )
      )
    );

    await transaction.commit();

    // Fetch updated item
    const updatedItem = await itemService.getItemById(itemId);

    res.json({
      message: 'Images reordered successfully',
      item: updatedItem
    });
  } catch (error) {
    await transaction.rollback();
    next(error);
  }
};