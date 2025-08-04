import { Request } from 'express';

export type UserType = 'Admin' | 'Staff' | 'Vendor';
export type ItemStatus = 'Available' | 'Pending' | 'Sold' | 'Removed';

export interface AuthRequest extends Request {
  user?: {
    userId: number;
    email: string;
    userType: UserType;
  };
}

export interface PaginationQuery {
  page?: number;
  limit?: number;
}

export interface ItemFilters {
  status?: ItemStatus;
  vendorId?: number;
  minPrice?: number;
  maxPrice?: number;
  tags?: string[];
  search?: string;
}