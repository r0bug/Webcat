export const USER_TYPES = {
  ADMIN: 'Admin',
  STAFF: 'Staff',
  VENDOR: 'Vendor'
} as const;

export const ITEM_STATUS = {
  AVAILABLE: 'Available',
  PENDING: 'Pending',
  SOLD: 'Sold',
  REMOVED: 'Removed'
} as const;

export const MAX_IMAGES_PER_ITEM = 6;

export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

export const MAX_FILE_SIZE = parseInt(process.env.MAX_FILE_SIZE || '5242880'); // 5MB

export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100
};