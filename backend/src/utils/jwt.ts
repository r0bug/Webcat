import jwt from 'jsonwebtoken';
import { UserType } from '../types';

interface TokenPayload {
  userId: number;
  email: string;
  userType: UserType;
}

interface RefreshTokenPayload extends TokenPayload {
  isRefresh: boolean;
}

export const generateAccessToken = (payload: TokenPayload): string => {
  return jwt.sign(payload, process.env.JWT_SECRET!, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
  } as jwt.SignOptions);
};

export const generateRefreshToken = (payload: TokenPayload): string => {
  const refreshPayload: RefreshTokenPayload = { ...payload, isRefresh: true };
  return jwt.sign(refreshPayload, process.env.JWT_REFRESH_SECRET!, {
    expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d'
  } as jwt.SignOptions);
};

export const verifyAccessToken = (token: string): TokenPayload => {
  return jwt.verify(token, process.env.JWT_SECRET!) as TokenPayload;
};

export const verifyRefreshToken = (token: string): RefreshTokenPayload => {
  return jwt.verify(token, process.env.JWT_REFRESH_SECRET!) as RefreshTokenPayload;
};

export const generatePasswordResetToken = (email: string): string => {
  return jwt.sign({ email, type: 'password-reset' }, process.env.JWT_SECRET!, {
    expiresIn: '1h'
  } as jwt.SignOptions);
};

export const verifyPasswordResetToken = (token: string): { email: string } => {
  const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
  if (decoded.type !== 'password-reset') {
    throw new Error('Invalid token type');
  }
  return { email: decoded.email };
};