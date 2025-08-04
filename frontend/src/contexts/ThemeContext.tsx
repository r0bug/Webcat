import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../services/api';

interface ThemeSettings {
  // Brand
  site_title?: string;
  site_tagline?: string;
  welcome_message?: string;
  
  // Colors
  primary_color?: string;
  secondary_color?: string;
  accent_color?: string;
  background_color?: string;
  text_color?: string;
  navbar_bg_color?: string;
  navbar_text_color?: string;
  
  // Typography
  font_family?: string;
  heading_font_family?: string;
  base_font_size?: number;
  
  // Layout
  border_radius?: number;
  container_max_width?: number;
  
  // Features
  enable_dark_mode?: boolean;
  show_vendor_logos?: boolean;
}

interface ThemeContextType {
  theme: ThemeSettings;
  loading: boolean;
  updateTheme: (newTheme: Partial<ThemeSettings>) => void;
  refreshTheme: () => Promise<void>;
  isDarkMode: boolean;
  toggleDarkMode: () => void;
}

const defaultTheme: ThemeSettings = {
  site_title: 'WebCat',
  site_tagline: 'Your Consignment Mall Catalog',
  welcome_message: 'Welcome to WebCat - Browse our collection of unique items',
  primary_color: '#3B82F6',
  secondary_color: '#6366F1',
  accent_color: '#8B5CF6',
  background_color: '#FFFFFF',
  text_color: '#1F2937',
  navbar_bg_color: '#1F2937',
  navbar_text_color: '#FFFFFF',
  font_family: 'Inter, system-ui, -apple-system, sans-serif',
  heading_font_family: 'Inter, system-ui, -apple-system, sans-serif',
  base_font_size: 16,
  border_radius: 8,
  container_max_width: 1200,
  enable_dark_mode: true,
  show_vendor_logos: true
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<ThemeSettings>(defaultTheme);
  const [loading, setLoading] = useState(true);
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Apply theme CSS variables
  const applyTheme = useCallback((themeSettings: ThemeSettings) => {
    const root = document.documentElement;
    
    // Apply colors
    if (themeSettings.primary_color) {
      root.style.setProperty('--primary-color', themeSettings.primary_color);
    }
    if (themeSettings.secondary_color) {
      root.style.setProperty('--secondary-color', themeSettings.secondary_color);
    }
    if (themeSettings.accent_color) {
      root.style.setProperty('--accent-color', themeSettings.accent_color);
    }
    if (themeSettings.background_color) {
      root.style.setProperty('--background-color', themeSettings.background_color);
    }
    if (themeSettings.text_color) {
      root.style.setProperty('--text-color', themeSettings.text_color);
    }
    if (themeSettings.navbar_bg_color) {
      root.style.setProperty('--navbar-bg-color', themeSettings.navbar_bg_color);
    }
    if (themeSettings.navbar_text_color) {
      root.style.setProperty('--navbar-text-color', themeSettings.navbar_text_color);
    }
    
    // Apply typography
    if (themeSettings.font_family) {
      root.style.setProperty('--font-family', themeSettings.font_family);
    }
    if (themeSettings.heading_font_family) {
      root.style.setProperty('--heading-font-family', themeSettings.heading_font_family);
    }
    if (themeSettings.base_font_size) {
      root.style.setProperty('--base-font-size', `${themeSettings.base_font_size}px`);
    }
    
    // Apply layout
    if (themeSettings.border_radius !== undefined) {
      root.style.setProperty('--border-radius', `${themeSettings.border_radius}px`);
    }
    if (themeSettings.container_max_width) {
      root.style.setProperty('--container-max-width', `${themeSettings.container_max_width}px`);
    }
  }, []);

  // Fetch theme from API
  const refreshTheme = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get('/theme/public');
      const themeData = response.data;
      setTheme(themeData);
      applyTheme(themeData);
      
      // Check dark mode preference
      const savedDarkMode = localStorage.getItem('darkMode') === 'true';
      setIsDarkMode(savedDarkMode);
    } catch (error) {
      console.error('Failed to fetch theme:', error);
      // Use default theme on error
      applyTheme(defaultTheme);
    } finally {
      setLoading(false);
    }
  }, [applyTheme]);

  // Update theme (for admin use)
  const updateTheme = useCallback((newTheme: Partial<ThemeSettings>) => {
    const updatedTheme = { ...theme, ...newTheme };
    setTheme(updatedTheme);
    applyTheme(updatedTheme);
  }, [theme, applyTheme]);

  // Toggle dark mode
  const toggleDarkMode = useCallback(() => {
    const newDarkMode = !isDarkMode;
    setIsDarkMode(newDarkMode);
    localStorage.setItem('darkMode', String(newDarkMode));
    
    if (newDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  // Initialize theme on mount
  useEffect(() => {
    refreshTheme();
  }, [refreshTheme]);

  // Apply dark mode class
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  return (
    <ThemeContext.Provider value={{
      theme,
      loading,
      updateTheme,
      refreshTheme,
      isDarkMode,
      toggleDarkMode
    }}>
      {children}
    </ThemeContext.Provider>
  );
};