import React, { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import type { User, AuthResponse } from '../types';
import api from '../services/api';
import storage from '../utils/storage';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => void;
  updateUser: (user: User) => void;
}

interface RegisterData {
  name: string;
  email: string;
  password: string;
  phoneNumber?: string;
  contactInfo?: string;
  yfVendorId?: string;
  userType: 'Vendor' | 'Staff';
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const token = storage.getItem('token');
      if (token) {
        const userData = await api.get<User>('/auth/me');
        setUser(userData);
      }
    } catch (error) {
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    const response = await api.post<AuthResponse>('/auth/login', { email, password });
    const { token, refreshToken, user } = response;
    
    storage.setItem('token', token);
    storage.setItem('refreshToken', refreshToken);
    setUser(user);
  };

  const register = async (data: RegisterData) => {
    const response = await api.post<AuthResponse>('/auth/register', data);
    const { token, refreshToken, user } = response;
    
    storage.setItem('token', token);
    storage.setItem('refreshToken', refreshToken);
    setUser(user);
  };

  const logout = () => {
    storage.removeItem('token');
    storage.removeItem('refreshToken');
    setUser(null);
  };

  const updateUser = (updatedUser: User) => {
    setUser(updatedUser);
  };

  return (
    <AuthContext.Provider value={{ user, loading, isAuthenticated: !!user, login, register, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};