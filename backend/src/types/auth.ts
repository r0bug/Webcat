import { Request } from 'express';

export interface AuthRequest extends Request {
  user?: {
    userId: number;
    email: string;
    role: 'Admin' | 'Staff' | 'Vendor';
  };
}