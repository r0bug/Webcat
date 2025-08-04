import { Request, Response, NextFunction } from 'express';
import { User } from '../models';
import { AuthRequest } from '../types';
import { 
  generateAccessToken, 
  generateRefreshToken, 
  verifyRefreshToken,
  generatePasswordResetToken,
  verifyPasswordResetToken 
} from '../utils/jwt';
import { sendPasswordResetEmail, sendWelcomeEmail } from '../utils/email';
import { CustomError } from '../middleware/errorHandler';

export const register = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { name, email, password, phoneNumber, contactInfo, yfVendorId, userType = 'Vendor' } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      const error: CustomError = new Error('User with this email already exists');
      error.statusCode = 400;
      throw error;
    }

    // Create new user
    const user = await User.create({
      name,
      email,
      passwordHash: password, // Will be hashed by the model hook
      phoneNumber,
      contactInfo,
      yfVendorId,
      userType,
      isActive: true
    });

    // Generate tokens
    const tokenPayload = {
      userId: user.userId,
      email: user.email,
      userType: user.userType
    };

    const accessToken = generateAccessToken(tokenPayload);
    const refreshToken = generateRefreshToken(tokenPayload);

    // Send welcome email (don't await to avoid blocking response)
    sendWelcomeEmail(user.email, user.name).catch(console.error);

    // Return user data without password
    const userData = user.toJSON();
    delete (userData as any).passwordHash;

    res.status(201).json({
      message: 'Registration successful',
      token: accessToken,
      refreshToken,
      user: userData
    });
  } catch (error) {
    next(error);
  }
};

export const login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { email, password } = req.body;

    // Find user
    const user = await User.findOne({ where: { email } });
    if (!user) {
      const error: CustomError = new Error('Invalid email or password');
      error.statusCode = 401;
      throw error;
    }

    // Check if user is active
    if (!user.isActive) {
      const error: CustomError = new Error('Account is deactivated');
      error.statusCode = 403;
      throw error;
    }

    // Verify password
    const isPasswordValid = await user.checkPassword(password);
    if (!isPasswordValid) {
      const error: CustomError = new Error('Invalid email or password');
      error.statusCode = 401;
      throw error;
    }

    // Generate tokens
    const tokenPayload = {
      userId: user.userId,
      email: user.email,
      userType: user.userType
    };

    const accessToken = generateAccessToken(tokenPayload);
    const refreshToken = generateRefreshToken(tokenPayload);

    // Return user data without password
    const userData = user.toJSON();
    delete (userData as any).passwordHash;

    res.json({
      message: 'Login successful',
      token: accessToken,
      refreshToken,
      user: userData
    });
  } catch (error) {
    next(error);
  }
};

export const refreshAccessToken = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { refreshToken } = req.body;

    // Verify refresh token
    const decoded = verifyRefreshToken(refreshToken);

    // Find user
    const user = await User.findByPk(decoded.userId);
    if (!user || !user.isActive) {
      const error: CustomError = new Error('Invalid refresh token');
      error.statusCode = 401;
      throw error;
    }

    // Generate new access token
    const tokenPayload = {
      userId: user.userId,
      email: user.email,
      userType: user.userType
    };

    const accessToken = generateAccessToken(tokenPayload);

    res.json({
      message: 'Token refreshed successfully',
      token: accessToken
    });
  } catch (error) {
    next(error);
  }
};

export const forgotPassword = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { email } = req.body;

    // Find user
    const user = await User.findOne({ where: { email } });
    if (!user) {
      // Don't reveal if user exists or not
      res.json({
        message: 'If the email exists, a password reset link has been sent'
      });
      return;
    }

    // Generate reset token
    const resetToken = generatePasswordResetToken(user.email);

    // Send reset email (don't await)
    sendPasswordResetEmail(user.email, resetToken).catch(console.error);

    res.json({
      message: 'If the email exists, a password reset link has been sent'
    });
  } catch (error) {
    next(error);
  }
};

export const resetPassword = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { token, password } = req.body;

    // Verify reset token
    const { email } = verifyPasswordResetToken(token);

    // Find user
    const user = await User.findOne({ where: { email } });
    if (!user) {
      const error: CustomError = new Error('Invalid reset token');
      error.statusCode = 400;
      throw error;
    }

    // Update password
    await user.setPassword(password);
    await user.save();

    res.json({
      message: 'Password reset successful'
    });
  } catch (error) {
    next(error);
  }
};

export const getProfile = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) {
      const error: CustomError = new Error('Unauthorized');
      error.statusCode = 401;
      throw error;
    }

    // Find user
    const user = await User.findByPk(req.user.userId);
    if (!user) {
      const error: CustomError = new Error('User not found');
      error.statusCode = 404;
      throw error;
    }

    // Return user data without password
    const userData = user.toJSON();
    delete (userData as any).passwordHash;

    res.json({
      user: userData
    });
  } catch (error) {
    next(error);
  }
};

export const updateProfile = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) {
      const error: CustomError = new Error('Unauthorized');
      error.statusCode = 401;
      throw error;
    }

    const { name, phoneNumber, contactInfo, yfVendorId } = req.body;

    // Find user
    const user = await User.findByPk(req.user.userId);
    if (!user) {
      const error: CustomError = new Error('User not found');
      error.statusCode = 404;
      throw error;
    }

    // Update user
    await user.update({
      name: name || user.name,
      phoneNumber: phoneNumber !== undefined ? phoneNumber : user.phoneNumber,
      contactInfo: contactInfo !== undefined ? contactInfo : user.contactInfo,
      yfVendorId: yfVendorId !== undefined ? yfVendorId : user.yfVendorId
    });

    // Return updated user data without password
    const userData = user.toJSON();
    delete (userData as any).passwordHash;

    res.json({
      message: 'Profile updated successfully',
      user: userData
    });
  } catch (error) {
    next(error);
  }
};

export const changePassword = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) {
      const error: CustomError = new Error('Unauthorized');
      error.statusCode = 401;
      throw error;
    }

    const { currentPassword, newPassword } = req.body;

    // Find user
    const user = await User.findByPk(req.user.userId);
    if (!user) {
      const error: CustomError = new Error('User not found');
      error.statusCode = 404;
      throw error;
    }

    // Verify current password
    const isPasswordValid = await user.checkPassword(currentPassword);
    if (!isPasswordValid) {
      const error: CustomError = new Error('Current password is incorrect');
      error.statusCode = 400;
      throw error;
    }

    // Update password
    await user.setPassword(newPassword);
    await user.save();

    res.json({
      message: 'Password changed successfully'
    });
  } catch (error) {
    next(error);
  }
};