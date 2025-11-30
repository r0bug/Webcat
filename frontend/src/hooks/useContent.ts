import { useEffect, useState } from 'react';
import api from '../services/api';

interface ContentSettings {
  [key: string]: string;
}

let cachedContent: ContentSettings | null = null;

export const useContent = () => {
  const [content, setContent] = useState<ContentSettings>(cachedContent || {});
  const [loading, setLoading] = useState(!cachedContent);

  useEffect(() => {
    if (!cachedContent) {
      fetchContent();
    }
  }, []);

  const fetchContent = async () => {
    try {
      const response = await api.get('/theme/content');
      const contentMap: ContentSettings = {};
      
      // Convert to simple key-value map for easy access
      if (response.content) {
        Object.entries(response.content).forEach(([key, setting]: [string, any]) => {
          contentMap[key] = setting.value || setting.default || '';
        });
      }
      
      cachedContent = contentMap;
      setContent(contentMap);
    } catch (error) {
      console.error('Failed to fetch content settings:', error);
      // Set default values if fetch fails
      setContent(getDefaultContent());
    } finally {
      setLoading(false);
    }
  };

  const refreshContent = async () => {
    cachedContent = null;
    await fetchContent();
  };

  // Helper function to get content with fallback
  const t = (key: string, fallback?: string): string => {
    return content[key] || fallback || key;
  };

  return { content, loading, refreshContent, t };
};

// Default content values
const getDefaultContent = (): ContentSettings => ({
  // Page Titles
  page_title_items: 'Browse Items',
  page_title_my_items: 'My Items',
  page_title_calendar: 'Events Calendar',
  page_title_forum: 'Community Forum',
  page_title_admin: 'Admin Dashboard',
  
  // Navigation
  nav_home: 'Home',
  nav_items: 'Items',
  nav_my_items: 'My Items',
  nav_calendar: 'Calendar',
  nav_forum: 'Forum',
  nav_admin: 'Admin',
  nav_login: 'Login',
  nav_logout: 'Logout',
  nav_register: 'Register',
  
  // Buttons
  btn_add_item: 'Add New Item',
  btn_save: 'Save',
  btn_cancel: 'Cancel',
  btn_edit: 'Edit',
  btn_delete: 'Delete',
  btn_search: 'Search',
  btn_filter: 'Filter',
  btn_upload: 'Upload',
  btn_download: 'Download',
  btn_batch_upload: 'Batch Upload',
  btn_manage_images: 'Manage Images',
  btn_contact_vendor: 'Contact Vendor',
  
  // Form Labels
  form_title: 'Title',
  form_description: 'Description',
  form_price: 'Price',
  form_location: 'Location',
  form_contact: 'Contact Information',
  form_status: 'Status',
  form_tags: 'Tags',
  form_images: 'Images',
  form_email: 'Email',
  form_password: 'Password',
  form_name: 'Name',
  
  // Status
  status_available: 'Available',
  status_pending: 'Pending',
  status_sold: 'Sold',
  status_removed: 'Removed',
  
  // Messages
  msg_no_items: 'No items found',
  msg_loading: 'Loading...',
  msg_error: 'An error occurred',
  msg_success: 'Success!',
  msg_confirm_delete: 'Are you sure you want to delete this item?',
  msg_login_required: 'Please login to continue',
  msg_welcome_back: 'Welcome back!',
  msg_item_created: 'Item created successfully',
  msg_item_updated: 'Item updated successfully',
  msg_item_deleted: 'Item deleted successfully',
  
  // Placeholders
  placeholder_search: 'Search items...',
  placeholder_email: 'Enter your email',
  placeholder_password: 'Enter your password',
  placeholder_title: 'Enter item title',
  placeholder_description: 'Describe your item...',
  placeholder_price: 'Enter price',
  
  // Item Detail
  detail_vendor: 'Vendor',
  detail_listed: 'Listed',
  detail_views: 'Views',
  detail_interested: 'Interested?',
  detail_share: 'Share this item',
  detail_no_images: 'No images available',
  
  // Footer
  footer_copyright: '© 2024 Yakima Finds. All rights reserved.',
  footer_contact: 'Contact Us',
  footer_privacy: 'Privacy Policy',
  footer_terms: 'Terms of Service'
});