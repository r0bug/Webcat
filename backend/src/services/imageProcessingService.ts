import sharp from 'sharp';
import path from 'path';
import fs from 'fs/promises';

export interface ImageVariant {
  name: string;
  width?: number;
  height?: number;
  quality: number;
  format: 'jpeg' | 'webp';
}

const IMAGE_VARIANTS: ImageVariant[] = [
  { name: 'thumbnail', width: 150, height: 150, quality: 80, format: 'jpeg' },
  { name: 'small', width: 400, quality: 85, format: 'jpeg' },
  { name: 'medium', width: 800, quality: 85, format: 'jpeg' },
  { name: 'large', width: 1200, quality: 90, format: 'jpeg' },
  { name: 'thumbnail_webp', width: 150, height: 150, quality: 80, format: 'webp' },
  { name: 'small_webp', width: 400, quality: 85, format: 'webp' },
  { name: 'medium_webp', width: 800, quality: 85, format: 'webp' },
  { name: 'large_webp', width: 1200, quality: 90, format: 'webp' },
];

export interface ProcessedImage {
  original: string;
  variants: {
    [key: string]: string;
  };
}

export class ImageProcessingService {
  private uploadDir: string;

  constructor() {
    this.uploadDir = path.join(__dirname, '../../uploads');
  }

  async processImage(filePath: string, _itemId: number | string): Promise<ProcessedImage> {
    const fileExt = path.extname(filePath);
    const fileName = path.basename(filePath, fileExt);
    const timestamp = Date.now();
    
    const processedImage: ProcessedImage = {
      original: '',
      variants: {}
    };

    try {
      // Read the original image
      const imageBuffer = await fs.readFile(filePath);
      const image = sharp(imageBuffer);
      await image.metadata();

      // Process original (compress it)
      const originalFileName = `${fileName}-${timestamp}-original${fileExt}`;
      const originalPath = path.join(this.uploadDir, originalFileName);
      
      await image
        .jpeg({ quality: 85, progressive: true })
        .toFile(originalPath);
      
      processedImage.original = `/uploads/${originalFileName}`;

      // Generate variants
      for (const variant of IMAGE_VARIANTS) {
        const variantFileName = `${fileName}-${timestamp}-${variant.name}.${variant.format}`;
        const variantPath = path.join(this.uploadDir, variantFileName);

        let processChain = sharp(imageBuffer);

        // Resize based on variant specifications
        if (variant.width && variant.height) {
          // Thumbnail - crop to exact size
          processChain = processChain.resize(variant.width, variant.height, {
            fit: 'cover',
            position: 'centre'
          });
        } else if (variant.width) {
          // Maintain aspect ratio, limit width
          processChain = processChain.resize(variant.width, undefined, {
            fit: 'inside',
            withoutEnlargement: true
          });
        }

        // Apply format and quality
        if (variant.format === 'webp') {
          processChain = processChain.webp({ quality: variant.quality });
        } else {
          processChain = processChain.jpeg({ 
            quality: variant.quality, 
            progressive: true 
          });
        }

        await processChain.toFile(variantPath);
        processedImage.variants[variant.name] = `/uploads/${variantFileName}`;
      }

      // Delete the original unprocessed file
      await fs.unlink(filePath).catch(() => {});

      return processedImage;
    } catch (error) {
      console.error('Image processing error:', error);
      // If processing fails, at least return the original
      const fallbackName = `${fileName}-${timestamp}${fileExt}`;
      const fallbackPath = path.join(this.uploadDir, fallbackName);
      await fs.rename(filePath, fallbackPath).catch(() => {});
      
      processedImage.original = `/uploads/${fallbackName}`;
      return processedImage;
    }
  }

  async deleteImageVariants(imageUrl: string): Promise<void> {
    try {
      // Extract the base filename from the URL
      const fileName = path.basename(imageUrl);
      const baseName = fileName.split('-').slice(0, -1).join('-');
      
      // Find and delete all variants
      const files = await fs.readdir(this.uploadDir);
      const variantsToDelete = files.filter(file => file.startsWith(baseName));
      
      await Promise.all(
        variantsToDelete.map(file => 
          fs.unlink(path.join(this.uploadDir, file)).catch(() => {})
        )
      );
    } catch (error) {
      console.error('Error deleting image variants:', error);
    }
  }

  async ensureUploadDirectory(): Promise<void> {
    try {
      await fs.access(this.uploadDir);
    } catch {
      await fs.mkdir(this.uploadDir, { recursive: true });
    }
  }

  getResponsiveImageData(variants: { [key: string]: string }) {
    return {
      thumbnail: variants.thumbnail || variants.thumbnail_webp,
      small: variants.small || variants.small_webp,
      medium: variants.medium || variants.medium_webp,
      large: variants.large || variants.large_webp,
      webp: {
        thumbnail: variants.thumbnail_webp,
        small: variants.small_webp,
        medium: variants.medium_webp,
        large: variants.large_webp,
      }
    };
  }
}

export const imageProcessingService = new ImageProcessingService();