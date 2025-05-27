// src/contexts/AuthContext.tsx
import React, { createContext, useState, use, useEffect, ReactNode } from 'react';
import { getRootApiUrl } from '../services/wordpressApi';

// Define user interface
interface User {
  id: number;
  username: string;
  email: string;
  name: string;
}

// Define the authentication context type
interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  user: User | null;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  getAuthHeader: () => { Authorization: string } | {};
}

// Create the context with default values
const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  isLoading: false,
  error: null,
  user: null,
  login: async () => false,
  logout: () => {},
  getAuthHeader: () => ({})
});

// Provider component props
interface AuthProviderProps {
  children: ReactNode;
}

// Storage keys
const STORAGE_KEYS = {
  USERNAME: 'wp_auth_username',
  PASSWORD: 'wp_auth_password',
  USER: 'wp_auth_user'
};

// Auth provider component
export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true); // Start as loading to check stored credentials
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [credentials, setCredentials] = useState<{ username: string; password: string } | null>(null);

  /**
   * Create Basic Auth header from credentials
   */
  const createBasicAuthHeader = (username: string, password: string): { Authorization: string } => {
    const credentials = btoa(`${username}:${password}`);
    return { Authorization: `Basic ${credentials}` };
  };

  /**
   * Validate credentials by calling WordPress API
   */
  const validateCredentials = async (username: string, password: string): Promise<User | null> => {
    try {
      const apiUrl = getRootApiUrl();
      const authHeader = createBasicAuthHeader(username, password);
      
      // Try to get current user info to validate credentials
      const response = await fetch(`${apiUrl}/wp/v2/users/me`, {
        headers: {
          'Content-Type': 'application/json',
          ...authHeader
        }
      });

      if (response.ok) {
        const userData = await response.json();
        console.log('User data received:', userData); // Debug log
        return {
          id: userData.id || 0,
          username: userData.username || username,
          email: userData.email || '',
          name: userData.name || userData.display_name || username
        };
      } else {
        console.error('Credential validation failed:', response.status, response.statusText);
        return null;
      }
    } catch (error) {
      console.error('Error validating credentials:', error);
      return null;
    }
  };

  /**
   * Save credentials to localStorage
   */
  const saveCredentials = (username: string, password: string, user: User) => {
    try {
      localStorage.setItem(STORAGE_KEYS.USERNAME, username);
      localStorage.setItem(STORAGE_KEYS.PASSWORD, password);
      localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
    } catch (error) {
      console.error('Error saving credentials to localStorage:', error);
    }
  };

  /**
   * Load credentials from localStorage
   */
  const loadCredentials = (): { username: string; password: string; user: User } | null => {
    try {
      const username = localStorage.getItem(STORAGE_KEYS.USERNAME);
      const password = localStorage.getItem(STORAGE_KEYS.PASSWORD);
      const userStr = localStorage.getItem(STORAGE_KEYS.USER);
      
      if (username && password && userStr) {
        const user = JSON.parse(userStr);
        return { username, password, user };
      }
    } catch (error) {
      console.error('Error loading credentials from localStorage:', error);
    }
    return null;
  };

  /**
   * Clear stored credentials
   */
  const clearStoredCredentials = () => {
    try {
      localStorage.removeItem(STORAGE_KEYS.USERNAME);
      localStorage.removeItem(STORAGE_KEYS.PASSWORD);
      localStorage.removeItem(STORAGE_KEYS.USER);
    } catch (error) {
      console.error('Error clearing credentials from localStorage:', error);
    }
  };

  /**
   * Login function - authenticates with WordPress using Basic Auth
   */
  const login = async (username: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const userData = await validateCredentials(username, password);
      
      if (userData) {
        console.log('Login successful, setting user:', userData); // Debug log
        setCredentials({ username, password });
        setUser(userData);
        setIsAuthenticated(true);
        
        // Save to localStorage for persistence
        saveCredentials(username, password, userData);
        
        setIsLoading(false);
        return true;
      } else {
        setError('Invalid username or password');
        setIsLoading(false);
        return false;
      }
    } catch (error) {
      console.error('Login error:', error);
      setError('Network error occurred');
      setIsLoading(false);
      return false;
    }
  };

  /**
   * Logout function
   */
  const logout = (): void => {
    setCredentials(null);
    setIsAuthenticated(false);
    setUser(null);
    setError(null);
    clearStoredCredentials();
  };

  /**
   * Get authentication header for API requests
   */
  const getAuthHeader = (): { Authorization: string } | {} => {
    if (credentials) {
      return createBasicAuthHeader(credentials.username, credentials.password);
    }
    return {};
  };

  /**
   * Initialize authentication state from localStorage on mount
   */
  useEffect(() => {
    const initializeAuth = async () => {
      const storedCredentials = loadCredentials();
      
      if (storedCredentials) {
        // Validate stored credentials
        const userData = await validateCredentials(storedCredentials.username, storedCredentials.password);
        
        if (userData) {
          setCredentials({ 
            username: storedCredentials.username, 
            password: storedCredentials.password 
          });
          setUser(userData);
          setIsAuthenticated(true);
        } else {
          // Stored credentials are invalid, clear them
          clearStoredCredentials();
        }
      }
      
      setIsLoading(false);
    };

    initializeAuth();
  }, []);

  // Context value
  const contextValue: AuthContextType = {
    isAuthenticated,
    isLoading,
    error,
    user,
    login,
    logout,
    getAuthHeader
  };

  return (
    <AuthContext value={contextValue}>
      {children}
    </AuthContext>
  );
};

// Custom hook for using the auth context
export const useAuth = (): AuthContextType => {
  const context = use(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

/**
 * Helper function to create auth header - exported for backward compatibility
 * This now checks for stored credentials as well
 */
export const createAuthHeader = (): { Authorization: string } | {} => {
  // First try to get credentials from localStorage
  try {
    const username = localStorage.getItem(STORAGE_KEYS.USERNAME);
    const password = localStorage.getItem(STORAGE_KEYS.PASSWORD);
    
    if (username && password) {
      const credentials = btoa(`${username}:${password}`);
      return { Authorization: `Basic ${credentials}` };
    }
  } catch (error) {
    console.error('Error reading stored credentials:', error);
  }
  
  // Fallback to environment variables
  const username = import.meta.env.VITE_WP_APP_USERNAME;
  const password = import.meta.env.VITE_WP_APP_PASSWORD;
  
  if (username && password) {
    const credentials = btoa(`${username}:${password}`);
    return { Authorization: `Basic ${credentials}` };
  }
  
  return {};
};

export default AuthContext;