import { Response } from 'express';
import { AuthRequest } from '../types/auth';
import { User } from '../models';
import bcrypt from 'bcryptjs';
import { validationResult } from 'express-validator';

// Get all users (admin only)
export const getAllUsers = async (req: AuthRequest, res: Response) => {
  try {
    const users = await User.findAll({
      attributes: ['userId', 'name', 'email', 'userType', 'isActive', 'phoneNumber', 'contactInfo', 'createdAt'],
      order: [['createdAt', 'DESC']]
    });

    res.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
};

// Get single user
export const getUser = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    
    const user = await User.findByPk(id, {
      attributes: ['userId', 'name', 'email', 'userType', 'isActive', 'phoneNumber', 'contactInfo', 'yfVendorId', 'createdAt']
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
};

// Create new user (admin only)
export const createUser = async (req: AuthRequest, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, email, password, userType, phoneNumber, contactInfo, yfVendorId } = req.body;

    // Check if email already exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create user
    const user = await User.create({
      name,
      email,
      passwordHash,
      userType,
      phoneNumber,
      contactInfo,
      yfVendorId,
      isActive: true
    });

    res.status(201).json({
      userId: user.userId,
      name: user.name,
      email: user.email,
      userType: user.userType,
      isActive: user.isActive
    });
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ error: 'Failed to create user' });
  }
};

// Update user (admin only)
export const updateUser = async (req: AuthRequest, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const { name, email, userType, phoneNumber, contactInfo, yfVendorId } = req.body;

    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if email is being changed and already exists
    if (email !== user.email) {
      const existingUser = await User.findOne({ where: { email } });
      if (existingUser) {
        return res.status(400).json({ error: 'Email already in use' });
      }
    }

    // Update user
    await user.update({
      name,
      email,
      userType,
      phoneNumber,
      contactInfo,
      yfVendorId
    });

    res.json({
      userId: user.userId,
      name: user.name,
      email: user.email,
      userType: user.userType,
      isActive: user.isActive
    });
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ error: 'Failed to update user' });
  }
};

// Toggle user status (admin only)
export const toggleUserStatus = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;

    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Prevent admin from deactivating themselves
    if (user.userId === req.user?.userId) {
      return res.status(400).json({ error: 'Cannot deactivate your own account' });
    }

    await user.update({ isActive });

    res.json({
      userId: user.userId,
      isActive: user.isActive
    });
  } catch (error) {
    console.error('Error updating user status:', error);
    res.status(500).json({ error: 'Failed to update user status' });
  }
};

// Delete user (admin only)
export const deleteUser = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Prevent admin from deleting themselves
    if (user.userId === req.user?.userId) {
      return res.status(400).json({ error: 'Cannot delete your own account' });
    }

    // Soft delete by deactivating
    await user.update({ isActive: false });

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ error: 'Failed to delete user' });
  }
};

// Get current user profile
export const getProfile = async (req: AuthRequest, res: Response) => {
  try {
    const user = await User.findByPk(req.user?.userId, {
      attributes: ['userId', 'name', 'email', 'userType', 'phoneNumber', 'contactInfo', 'yfVendorId', 'createdAt']
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    console.error('Error fetching profile:', error);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
};

// Update current user profile
export const updateProfile = async (req: AuthRequest, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, phoneNumber, contactInfo } = req.body;

    const user = await User.findByPk(req.user?.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    await user.update({
      name,
      phoneNumber,
      contactInfo
    });

    res.json({
      userId: user.userId,
      name: user.name,
      email: user.email,
      userType: user.userType,
      phoneNumber: user.phoneNumber,
      contactInfo: user.contactInfo
    });
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
};