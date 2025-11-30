-- Add more content/text settings to theme_settings table
INSERT INTO theme_settings (setting_key, setting_value, setting_type, category, description) VALUES
-- Page Titles
('page_title_items', 'Browse Items', 'text', 'content', 'Title for items browse page'),
('page_title_my_items', 'My Items', 'text', 'content', 'Title for my items page'),
('page_title_calendar', 'Events Calendar', 'text', 'content', 'Title for calendar page'),
('page_title_forum', 'Community Forum', 'text', 'content', 'Title for forum page'),
('page_title_admin', 'Admin Dashboard', 'text', 'content', 'Title for admin dashboard'),

-- Navigation Labels
('nav_home', 'Home', 'text', 'content', 'Navigation label for home'),
('nav_items', 'Items', 'text', 'content', 'Navigation label for items'),
('nav_my_items', 'My Items', 'text', 'content', 'Navigation label for my items'),
('nav_calendar', 'Calendar', 'text', 'content', 'Navigation label for calendar'),
('nav_forum', 'Forum', 'text', 'content', 'Navigation label for forum'),
('nav_admin', 'Admin', 'text', 'content', 'Navigation label for admin'),
('nav_login', 'Login', 'text', 'content', 'Navigation label for login'),
('nav_logout', 'Logout', 'text', 'content', 'Navigation label for logout'),
('nav_register', 'Register', 'text', 'content', 'Navigation label for register'),

-- Button Labels
('btn_add_item', 'Add New Item', 'text', 'content', 'Button text for adding new item'),
('btn_save', 'Save', 'text', 'content', 'Button text for save'),
('btn_cancel', 'Cancel', 'text', 'content', 'Button text for cancel'),
('btn_edit', 'Edit', 'text', 'content', 'Button text for edit'),
('btn_delete', 'Delete', 'text', 'content', 'Button text for delete'),
('btn_search', 'Search', 'text', 'content', 'Button text for search'),
('btn_filter', 'Filter', 'text', 'content', 'Button text for filter'),
('btn_upload', 'Upload', 'text', 'content', 'Button text for upload'),
('btn_download', 'Download', 'text', 'content', 'Button text for download'),
('btn_batch_upload', 'Batch Upload', 'text', 'content', 'Button text for batch upload'),
('btn_manage_images', 'Manage Images', 'text', 'content', 'Button text for manage images'),
('btn_contact_vendor', 'Contact Vendor', 'text', 'content', 'Button text for contact vendor'),

-- Form Labels
('form_title', 'Title', 'text', 'content', 'Form label for title field'),
('form_description', 'Description', 'text', 'content', 'Form label for description field'),
('form_price', 'Price', 'text', 'content', 'Form label for price field'),
('form_location', 'Location', 'text', 'content', 'Form label for location field'),
('form_contact', 'Contact Information', 'text', 'content', 'Form label for contact field'),
('form_status', 'Status', 'text', 'content', 'Form label for status field'),
('form_tags', 'Tags', 'text', 'content', 'Form label for tags field'),
('form_images', 'Images', 'text', 'content', 'Form label for images field'),
('form_email', 'Email', 'text', 'content', 'Form label for email field'),
('form_password', 'Password', 'text', 'content', 'Form label for password field'),
('form_name', 'Name', 'text', 'content', 'Form label for name field'),

-- Status Labels
('status_available', 'Available', 'text', 'content', 'Status label for available'),
('status_pending', 'Pending', 'text', 'content', 'Status label for pending'),
('status_sold', 'Sold', 'text', 'content', 'Status label for sold'),
('status_removed', 'Removed', 'text', 'content', 'Status label for removed'),

-- Messages
('msg_no_items', 'No items found', 'text', 'content', 'Message when no items are found'),
('msg_loading', 'Loading...', 'text', 'content', 'Loading message'),
('msg_error', 'An error occurred', 'text', 'content', 'Generic error message'),
('msg_success', 'Success!', 'text', 'content', 'Generic success message'),
('msg_confirm_delete', 'Are you sure you want to delete this item?', 'text', 'content', 'Delete confirmation message'),
('msg_login_required', 'Please login to continue', 'text', 'content', 'Login required message'),
('msg_welcome_back', 'Welcome back!', 'text', 'content', 'Welcome back message'),
('msg_item_created', 'Item created successfully', 'text', 'content', 'Item created message'),
('msg_item_updated', 'Item updated successfully', 'text', 'content', 'Item updated message'),
('msg_item_deleted', 'Item deleted successfully', 'text', 'content', 'Item deleted message'),

-- Placeholder Text
('placeholder_search', 'Search items...', 'text', 'content', 'Search placeholder text'),
('placeholder_email', 'Enter your email', 'text', 'content', 'Email placeholder text'),
('placeholder_password', 'Enter your password', 'text', 'content', 'Password placeholder text'),
('placeholder_title', 'Enter item title', 'text', 'content', 'Title placeholder text'),
('placeholder_description', 'Describe your item...', 'text', 'content', 'Description placeholder text'),
('placeholder_price', 'Enter price', 'text', 'content', 'Price placeholder text'),

-- Item Detail Page
('detail_vendor', 'Vendor', 'text', 'content', 'Label for vendor on item detail'),
('detail_listed', 'Listed', 'text', 'content', 'Label for listed date on item detail'),
('detail_views', 'Views', 'text', 'content', 'Label for view count on item detail'),
('detail_interested', 'Interested?', 'text', 'content', 'Interested section title'),
('detail_share', 'Share this item', 'text', 'content', 'Share section title'),
('detail_no_images', 'No images available', 'text', 'content', 'No images message'),

-- Footer Text
('footer_copyright', '© 2024 Yakima Finds. All rights reserved.', 'text', 'content', 'Footer copyright text'),
('footer_contact', 'Contact Us', 'text', 'content', 'Footer contact link text'),
('footer_privacy', 'Privacy Policy', 'text', 'content', 'Footer privacy link text'),
('footer_terms', 'Terms of Service', 'text', 'content', 'Footer terms link text')
ON DUPLICATE KEY UPDATE 
  setting_value = VALUES(setting_value),
  description = VALUES(description);