import {
  BucketEventNotification,
  Each,
  Message,
} from "@liquidmetal-ai/raindrop-framework";
import { Env } from './raindrop.gen';

interface ImageProcessingResult {
  originalUrl: string;
  thumbnailUrl?: string;
  optimizedUrl?: string;
  width?: number;
  height?: number;
  fileSize?: number;
  error?: string;
}

export default class extends Each<BucketEventNotification, Env> {
  async process(message: Message<BucketEventNotification>): Promise<void> {
    try {
      const notification = message.body;
      this.env.logger.info('Processing bucket event', { notification });

      // Only process PUT events (uploads)
      const notificationData = notification as any;
      if (notificationData.eventName !== 's3:ObjectCreated:Put') {
        this.env.logger.debug('Ignoring non-PUT event', { eventName: notificationData.eventName });
        return;
      }

      // Extract object key from the notification
      const objectKey = notificationData.s3?.object?.key;
      if (!objectKey) {
        this.env.logger.warn('No object key found in notification');
        return;
      }

      // Only process image files
      if (!this.isImageFile(objectKey)) {
        this.env.logger.debug('Ignoring non-image file', { objectKey });
        return;
      }

      // Extract item ID from filename (format: item_<ID>_<timestamp>_<index>.<ext>)
      const itemId = this.extractItemIdFromKey(objectKey);
      if (!itemId) {
        this.env.logger.warn('Could not extract item ID from object key', { objectKey });
        return;
      }

      // Process the image
      const result = await this.processImage(objectKey, itemId);
      
      if (result.error) {
        this.env.logger.error('Image processing failed', { error: result.error });
        return;
      }

      // Update database with processed image metadata
      await this.updateImageMetadata(objectKey, itemId, result);

      this.env.logger.info('Successfully processed image', { objectKey });
    } catch (error) {
      this.env.logger.error('Error processing bucket event', { error: error as Error });
    }
  }

  private isImageFile(key: string): boolean {
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];
    const lowercaseKey = key.toLowerCase();
    return imageExtensions.some(ext => lowercaseKey.endsWith(ext));
  }

  private extractItemIdFromKey(key: string): number | null {
    // Expected format: item_<ID>_<timestamp>_<index>.<ext>
    const match = key.match(/^item_(\d+)_\d+_\d+\./);
    return match ? parseInt(match[1] || '0') : null;
  }

  private async processImage(objectKey: string, itemId: number): Promise<ImageProcessingResult> {
    try {
      this.env.logger.info('Processing image for item', { objectKey, itemId });

      // Get the original image from bucket
      const originalObject = await this.env.ITEM_IMAGES.get(objectKey);
      if (!originalObject) {
        return { originalUrl: objectKey, error: 'Failed to retrieve original image' };
      }

      const originalBuffer = await originalObject.arrayBuffer();
      const originalSize = originalBuffer.byteLength;

      this.env.logger.debug('Retrieved image', { objectKey, size: originalSize });

      // For basic image processing, we'll resize and optimize the image
      // In a real implementation, you might use libraries like sharp, canvas, or external services
      const processedResults = await this.optimizeImage(originalBuffer, objectKey);

      // Generate thumbnail
      const thumbnailResults = await this.generateThumbnail(originalBuffer, objectKey);

      // Get image dimensions (simplified - in production you'd use proper image libraries)
      const dimensions = await this.getImageDimensions(originalBuffer, objectKey);

      return {
        originalUrl: objectKey,
        optimizedUrl: processedResults.optimizedUrl,
        thumbnailUrl: thumbnailResults.thumbnailUrl,
        width: dimensions.width,
        height: dimensions.height,
        fileSize: originalSize
      };
    } catch (error) {
      this.env.logger.error('Error processing image', { objectKey, error: error as Error });
      return { originalUrl: objectKey, error: `Processing failed: ${error}` };
    }
  }

  private async optimizeImage(buffer: ArrayBuffer, originalKey: string): Promise<{ optimizedUrl?: string }> {
    try {
      // For now, we'll just store the original as the optimized version
      // In a real implementation, you would:
      // 1. Use image processing library to resize/compress
      // 2. Apply optimization algorithms
      // 3. Convert to more efficient formats (WebP, AVIF)
      
      // Generate optimized filename
      const optimizedKey = originalKey.replace(/(\.[^.]+)$/, '_optimized$1');
      
      // For this basic implementation, we'll just copy the original
      // In production, you'd process the buffer here
      await this.env.ITEM_IMAGES.put(optimizedKey, buffer, {
        httpMetadata: {
          contentType: this.getContentType(originalKey)
        }
      });

      this.env.logger.debug('Created optimized version', { optimizedKey });
      return { optimizedUrl: optimizedKey };
    } catch (error) {
      this.env.logger.warn('Failed to create optimized image', { error: error as Error });
      return {};
    }
  }

  private async generateThumbnail(buffer: ArrayBuffer, originalKey: string): Promise<{ thumbnailUrl?: string }> {
    try {
      // Generate thumbnail filename
      const thumbnailKey = originalKey.replace(/(\.[^.]+)$/, '_thumb$1');
      
      // For this basic implementation, we'll create a smaller version
      // In production, you'd use proper image processing libraries
      const thumbnailBuffer = await this.resizeImage(buffer, 200, 200);
      
      await this.env.ITEM_IMAGES.put(thumbnailKey, thumbnailBuffer || buffer, {
        httpMetadata: {
          contentType: this.getContentType(originalKey)
        }
      });

      this.env.logger.debug('Created thumbnail', { thumbnailKey });
      return { thumbnailUrl: thumbnailKey };
    } catch (error) {
      this.env.logger.warn('Failed to create thumbnail', { error: error as Error });
      return {};
    }
  }

  private async resizeImage(buffer: ArrayBuffer, maxWidth: number, maxHeight: number): Promise<ArrayBuffer | null> {
    try {
      // This is a placeholder implementation
      // In a real application, you would use proper image processing libraries like:
      // - sharp (for server-side Node.js)
      // - canvas API (in browser/Cloudflare Workers)
      // - External services (like Cloudinary, ImageKit)
      
      // For now, just return the original buffer
      // The actual resizing logic would be implemented here
      this.env.logger.debug(`Resize requested to ${maxWidth}x${maxHeight} (placeholder implementation)`);
      return buffer;
    } catch (error) {
      this.env.logger.error('Error resizing image', { error: error as Error });
      return null;
    }
  }

  private async getImageDimensions(buffer: ArrayBuffer, key: string): Promise<{ width?: number; height?: number }> {
    try {
      // This is a simplified implementation
      // In production, you'd use proper image libraries to extract EXIF data
      
      // For common formats, you might parse headers to get dimensions
      // For now, we'll return default dimensions
      this.env.logger.debug('Getting dimensions (placeholder implementation)', { key });
      
      // Basic JPEG dimension parsing (very simplified)
      if (key.toLowerCase().includes('.jpg') || key.toLowerCase().includes('.jpeg')) {
        const dimensions = this.parseJpegDimensions(buffer);
        if (dimensions) {
          return dimensions;
        }
      }
      
      // Default fallback
      return { width: 800, height: 600 };
    } catch (error) {
      this.env.logger.error('Error getting image dimensions', { error: error as Error });
      return {};
    }
  }

  private parseJpegDimensions(buffer: ArrayBuffer): { width: number; height: number } | null {
    try {
      // Very basic JPEG dimension parsing
      // This is a simplified implementation - in production use proper libraries
      const bytes = new Uint8Array(buffer);
      
      // Look for SOF (Start of Frame) marker
      for (let i = 0; i < bytes.length - 10; i++) {
        if (bytes[i] === 0xFF && (bytes[i + 1] === 0xC0 || bytes[i + 1] === 0xC2)) {
          // SOF marker found, dimensions are at offset +5 and +7
          const height = ((bytes[i + 5] || 0) << 8) | (bytes[i + 6] || 0);
          const width = ((bytes[i + 7] || 0) << 8) | (bytes[i + 8] || 0);
          return { width, height };
        }
      }
      
      return null;
    } catch (error) {
      this.env.logger.debug('JPEG parsing failed', { error: error as Error });
      return null;
    }
  }

  private getContentType(key: string): string {
    const lowercaseKey = key.toLowerCase();
    if (lowercaseKey.endsWith('.jpg') || lowercaseKey.endsWith('.jpeg')) {
      return 'image/jpeg';
    } else if (lowercaseKey.endsWith('.png')) {
      return 'image/png';
    } else if (lowercaseKey.endsWith('.webp')) {
      return 'image/webp';
    } else if (lowercaseKey.endsWith('.gif')) {
      return 'image/gif';
    }
    return 'image/jpeg'; // default
  }

  private async updateImageMetadata(objectKey: string, itemId: number, result: ImageProcessingResult): Promise<void> {
    try {
      // Update the item_images table with processed image metadata
      await this.env.MAIN_DB.prepare(`
        UPDATE item_images 
        SET 
          alt_text = COALESCE(alt_text, ?),
          uploaded_at = CURRENT_TIMESTAMP
        WHERE item_id = ? AND image_url = ?
      `).bind(
        result.width && result.height ? `Image ${result.width}x${result.height}` : 'Processed image',
        itemId,
        objectKey
      ).run();

      this.env.logger.debug(`Updated metadata for image ${objectKey}`);

      // If we have processed versions, you could store references to them
      if (result.thumbnailUrl || result.optimizedUrl) {
        // In a more sophisticated setup, you might store these in a separate table
        // For now, we'll just log that they were created
        this.env.logger.info(`Created processed versions for ${objectKey}:`, {
          thumbnail: result.thumbnailUrl,
          optimized: result.optimizedUrl,
          dimensions: result.width && result.height ? `${result.width}x${result.height}` : 'unknown'
        });
      }

      // Optionally, trigger search index update for the item
      await this.updateSearchIndex(itemId);

    } catch (error) {
      this.env.logger.error('Failed to update metadata for image', { objectKey, error: error as Error });
    }
  }

  private async updateSearchIndex(itemId: number): Promise<void> {
    try {
      // Trigger search service to update embeddings for this item
      // This helps keep the search index fresh when new images are added
      await this.env.SEARCH_SERVICE.fetch(
        new Request('http://localhost/update-embeddings', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            itemIds: [itemId]
          })
        })
      );

      this.env.logger.debug(`Triggered search index update for item ${itemId}`);
    } catch (error) {
      this.env.logger.warn('Failed to update search index for item', { itemId, error: error as Error });
      // This is not a critical failure, so we don't throw
    }
  }

  // Utility method to validate image file constraints
  private async validateImageConstraints(buffer: ArrayBuffer, key: string): Promise<{ valid: boolean; reason?: string }> {
    try {
      const maxFileSize = 5 * 1024 * 1024; // 5MB
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
      
      // Check file size
      if (buffer.byteLength > maxFileSize) {
        return { valid: false, reason: 'File size exceeds 5MB limit' };
      }

      // Check file type
      const contentType = this.getContentType(key);
      if (!allowedTypes.includes(contentType)) {
        return { valid: false, reason: 'Unsupported file type' };
      }

      // Additional validation could be added here:
      // - Check image dimensions
      // - Validate image integrity
      // - Scan for malicious content

      return { valid: true };
    } catch (error) {
      this.env.logger.error('Error validating image constraints', { error: error as Error });
      return { valid: false, reason: 'Validation error' };
    }
  }

  // Method to handle image deletion events
  private async handleImageDeletion(objectKey: string): Promise<void> {
    try {
      this.env.logger.info('Handling deletion of image', { objectKey });

      // Clean up related processed images
      const baseKey = objectKey.replace(/(\.[^.]+)$/, '');
      const relatedKeys = [
        baseKey + '_optimized' + this.getFileExtension(objectKey),
        baseKey + '_thumb' + this.getFileExtension(objectKey)
      ];

      for (const relatedKey of relatedKeys) {
        try {
          await this.env.ITEM_IMAGES.delete(relatedKey);
          this.env.logger.debug('Deleted related image', { relatedKey });
        } catch (deleteError) {
          this.env.logger.warn('Failed to delete related image', { relatedKey, deleteError: deleteError as Error });
        }
      }

      // Extract item ID and update search index
      const itemId = this.extractItemIdFromKey(objectKey);
      if (itemId) {
        await this.updateSearchIndex(itemId);
      }

    } catch (error) {
      this.env.logger.error('Error handling image deletion', { objectKey, error: error as Error });
    }
  }

  private getFileExtension(key: string): string {
    const match = key.match(/(\.[^.]+)$/);
    return match ? (match[1] || '.jpg') : '.jpg';
  }

  // Health check method for monitoring
  async healthCheck(): Promise<{ status: string; details: any }> {
    try {
      // Check if we can access the bucket
      const testKey = 'health-check-' + Date.now();
      const testContent = 'health check';
      
      await this.env.ITEM_IMAGES.put(testKey, testContent);
      const retrieved = await this.env.ITEM_IMAGES.get(testKey);
      await this.env.ITEM_IMAGES.delete(testKey);

      return {
        status: 'healthy',
        details: {
          bucketAccess: retrieved ? 'ok' : 'error',
          timestamp: new Date().toISOString()
        }
      };
    } catch (error) {
      this.env.logger.error('Health check failed', { error: error as Error });
      return {
        status: 'unhealthy',
        details: {
          error: String(error),
          timestamp: new Date().toISOString()
        }
      };
    }
  }
}