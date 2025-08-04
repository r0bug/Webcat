export type UserType = 'Admin' | 'Staff' | 'Vendor';
export type ItemStatus = 'Available' | 'Pending' | 'Sold' | 'Removed';

export interface User {
  id: number;
  userId: number;
  username: string;
  name: string;
  email: string;
  contactInfo?: string;
  phoneNumber?: string;
  yfVendorId?: string;
  role: UserType;
  userType: UserType;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Item {
  itemId: number;
  title: string;
  description?: string;
  price?: number;
  vendorId: number;
  vendor?: User;
  location?: string;
  contactInfo?: string;
  status: ItemStatus;
  dateAdded: string;
  updatedAt: string;
  urlSlug: string;
  viewCount: number;
  images?: ItemImage[];
  tags?: Tag[];
}

export interface ItemImage {
  imageId: number;
  itemId: number;
  imageUrl: string;
  imageOrder: number;
  altText?: string;
  uploadedAt: string;
}

export interface Tag {
  tagId: number;
  tagName: string;
  createdAt: string;
}

export interface Message {
  messageId: number;
  itemId?: number;
  item?: Item;
  senderId: number;
  sender?: User;
  recipientId: number;
  recipient?: User;
  subject?: string;
  messageText: string;
  isRead: boolean;
  sentAt: string;
}

export interface ForumPost {
  id: number;
  postId: number;
  itemId?: number;
  item?: Item;
  userId: number;
  user?: User;
  author: User;
  parentId?: number;
  parentPostId?: number;
  title?: string;
  content: string;
  isPinned: boolean;
  isEdited: boolean;
  viewCount: number;
  createdAt: string;
  updatedAt: string;
  replies?: ForumPost[];
  parent?: ForumPost;
}

export interface Event {
  id: number;
  eventId: number;
  title: string;
  description?: string;
  eventDate: string;
  startTime?: string;
  endTime?: string;
  location?: string;
  createdBy: number;
  createdByUserId: number;
  creator?: User;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponse {
  token: string;
  refreshToken: string;
  user: User;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}