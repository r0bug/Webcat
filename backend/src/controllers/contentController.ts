import { Request, Response } from 'express';
import fs from 'fs/promises';
import path from 'path';

const CONTENT_FILE_PATH = path.join(__dirname, '../../../content-config.json');

export const getContent = async (req: Request, res: Response): Promise<void> => {
  try {
    const contentData = await fs.readFile(CONTENT_FILE_PATH, 'utf-8');
    const content = JSON.parse(contentData);
    res.json(content);
  } catch (error) {
    console.error('Error reading content file:', error);
    // Return default content if file doesn't exist
    res.json({
      siteName: 'WebCat',
      siteDescription: 'Inventory Management System',
      pages: {},
      navigation: {},
      common: {},
      footer: {}
    });
  }
};

export const updateContent = async (req: Request, res: Response): Promise<void> => {
  try {
    const newContent = req.body;
    
    // Validate that it's valid JSON
    const contentString = JSON.stringify(newContent, null, 2);
    
    // Write to file
    await fs.writeFile(CONTENT_FILE_PATH, contentString, 'utf-8');
    
    res.json({
      message: 'Content updated successfully',
      content: newContent
    });
  } catch (error) {
    console.error('Error updating content file:', error);
    res.status(500).json({
      error: 'Failed to update content'
    });
  }
};