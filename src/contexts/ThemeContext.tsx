import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Theme } from '@mui/material/styles';
import { lightTheme, darkTheme, createCustomTheme } from '../config/theme';
import { getCurrentBlogPath, blogs } from '../config/multisiteConfig';

interface ThemeContextType {
  theme: Theme;
  mode: 'light' | 'dark';
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// Theme preference storage key
const THEME_STORAGE_KEY = 'blog-theme-preference';

interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  // Initialize theme mode from localStorage or default to 'light'
  const [mode, setMode] = useState<'light' | 'dark'>(() => {
    const savedMode = localStorage.getItem(THEME_STORAGE_KEY);
    return (savedMode === 'dark' || savedMode === 'light') ? savedMode : 'light';
  });

  // Get the current blog configuration to use blog-specific colors
  const currentBlogPath = getCurrentBlogPath();
  const currentBlog = Object.values(blogs).find(blog => blog.wpPath === currentBlogPath);
  
  // Create theme based on mode and blog-specific color if available
  const theme = React.useMemo(() => {
    if (currentBlog?.themeColor) {
      return createCustomTheme(currentBlog.themeColor, mode);
    }
    return mode === 'light' ? lightTheme : darkTheme;
  }, [mode, currentBlog?.themeColor]);

  // Save theme preference to localStorage when it changes
  useEffect(() => {
    localStorage.setItem(THEME_STORAGE_KEY, mode);
  }, [mode]);

  const toggleTheme = () => {
    setMode((prevMode) => prevMode === 'light' ? 'dark' : 'light');
  };

  const value = {
    theme,
    mode,
    toggleTheme,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useAppTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useAppTheme must be used within a ThemeProvider');
  }
  return context;
};