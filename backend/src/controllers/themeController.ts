import { Response } from 'express';
import { AuthRequest } from '../types/auth';
import { ThemeSetting } from '../models';
import { validationResult } from 'express-validator';

// Get all theme settings
export const getThemeSettings = async (req: AuthRequest, res: Response) => {
  try {
    const settings = await ThemeSetting.findAll({
      attributes: ['id', 'settingKey', 'settingValue', 'settingType', 'category', 'description'],
      order: [['category', 'ASC'], ['settingKey', 'ASC']]
    });

    // Transform settings into a more usable format
    const settingsByCategory = settings.reduce((acc: any, setting: any) => {
      if (!acc[setting.category]) {
        acc[setting.category] = {};
      }
      
      // Parse value based on type
      let value = setting.settingValue;
      if (setting.settingType === 'number' && value) {
        value = parseFloat(value);
      } else if (setting.settingType === 'boolean' && value) {
        value = value === 'true';
      } else if (setting.settingType === 'json' && value) {
        try {
          value = JSON.parse(value);
        } catch (e) {
          // Keep as string if JSON parse fails
        }
      }
      
      acc[setting.category][setting.settingKey] = {
        id: setting.id,
        value,
        type: setting.settingType,
        description: setting.description
      };
      
      return acc;
    }, {});

    res.json({
      settings: settingsByCategory,
      raw: settings // Also include raw format for admin panel
    });
  } catch (error) {
    console.error('Error fetching theme settings:', error);
    res.status(500).json({ error: 'Failed to fetch theme settings' });
  }
};

// Get public theme settings (for non-admin users)
export const getPublicThemeSettings = async (req: AuthRequest, res: Response) => {
  try {
    const settings = await ThemeSetting.findAll({
      attributes: ['settingKey', 'settingValue', 'settingType'],
      order: [['category', 'ASC'], ['settingKey', 'ASC']]
    });

    // Transform to key-value pairs with proper types
    const themeVars = settings.reduce((acc: any, setting: any) => {
      let value = setting.settingValue;
      
      if (setting.settingType === 'number' && value) {
        value = parseFloat(value);
      } else if (setting.settingType === 'boolean' && value) {
        value = value === 'true';
      } else if (setting.settingType === 'json' && value) {
        try {
          value = JSON.parse(value);
        } catch (e) {
          // Keep as string if JSON parse fails
        }
      }
      
      acc[setting.settingKey] = value;
      return acc;
    }, {});

    res.json(themeVars);
  } catch (error) {
    console.error('Error fetching public theme settings:', error);
    res.status(500).json({ error: 'Failed to fetch theme settings' });
  }
};

// Update theme settings (admin only)
export const updateThemeSettings = async (req: AuthRequest, res: Response) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { settings } = req.body;
    const userId = req.user?.userId;

    if (!Array.isArray(settings)) {
      return res.status(400).json({ error: 'Settings must be an array' });
    }

    // Update each setting
    const updatePromises = settings.map(async (setting: any) => {
      const { id, value } = setting;
      
      // Find the setting
      const themeSetting = await ThemeSetting.findByPk(id);
      if (!themeSetting) {
        throw new Error(`Setting with id ${id} not found`);
      }

      // Convert value to string for storage
      let stringValue = value;
      if (themeSetting.settingType === 'json' && typeof value === 'object') {
        stringValue = JSON.stringify(value);
      } else if (typeof value !== 'string') {
        stringValue = String(value);
      }

      // Update the setting
      await themeSetting.update({
        settingValue: stringValue,
        updatedBy: userId
      });

      return themeSetting;
    });

    const updatedSettings = await Promise.all(updatePromises);

    res.json({
      message: 'Theme settings updated successfully',
      settings: updatedSettings
    });
  } catch (error: any) {
    console.error('Error updating theme settings:', error);
    res.status(500).json({ error: error.message || 'Failed to update theme settings' });
  }
};

// Reset theme settings to defaults (admin only)
export const resetThemeSettings = async (req: AuthRequest, res: Response) => {
  try {
    const { category } = req.body;

    // Default values for reset
    const defaults: any = {
      brand: {
        site_title: 'WebCat',
        site_tagline: 'Your Consignment Mall Catalog',
        welcome_message: 'Welcome to WebCat - Browse our collection of unique items'
      },
      colors: {
        primary_color: '#3B82F6',
        secondary_color: '#6366F1',
        accent_color: '#8B5CF6',
        background_color: '#FFFFFF',
        text_color: '#1F2937',
        navbar_bg_color: '#1F2937',
        navbar_text_color: '#FFFFFF'
      },
      typography: {
        font_family: 'Inter, system-ui, -apple-system, sans-serif',
        heading_font_family: 'Inter, system-ui, -apple-system, sans-serif',
        base_font_size: '16'
      },
      layout: {
        border_radius: '8',
        container_max_width: '1200'
      },
      features: {
        enable_dark_mode: 'true',
        show_vendor_logos: 'true'
      }
    };

    // Build where clause
    const whereClause: any = {};
    if (category && defaults[category]) {
      whereClause.category = category;
    }

    // Get settings to reset
    const settingsToReset = await ThemeSetting.findAll({
      where: whereClause
    });

    // Reset each setting
    const resetPromises = settingsToReset.map(async (setting: any) => {
      const defaultValue = defaults[setting.category]?.[setting.settingKey];
      if (defaultValue !== undefined) {
        await setting.update({
          settingValue: defaultValue,
          updatedBy: req.user?.userId
        });
      }
      return setting;
    });

    await Promise.all(resetPromises);

    res.json({
      message: `Theme settings ${category ? `for ${category}` : ''} reset to defaults`,
      affectedSettings: settingsToReset.length
    });
  } catch (error) {
    console.error('Error resetting theme settings:', error);
    res.status(500).json({ error: 'Failed to reset theme settings' });
  }
};