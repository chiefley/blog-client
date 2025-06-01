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
  JWT_TOKEN: 'wp_auth_jwt_token',
  USER: 'wp_auth_user'
};

// Global variables to track auth state for immediate access
let globalJwtToken: string | null = null;
let globalAuthInitialized = false;

// Auth provider component
export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true); // Start as loading to check stored credentials
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [jwtToken, setJwtToken] = useState<string | null>(null);

  /**
   * Create JWT Auth header from token
   */
  const createJwtAuthHeader = (token: string): { Authorization: string } => {
    return { Authorization: `Bearer ${token}` };
  };

  /**
   * Get JWT token by authenticating with WordPress JWT endpoint
   */
  const getJwtToken = async (username: string, password: string): Promise<string | null> => {
    try {
      const apiUrl = getRootApiUrl();
      
      // Call JWT auth endpoint to get token
      const response = await fetch(`${apiUrl}/jwt-auth/v1/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username, password })
      });

      if (response.ok) {
        const data = await response.json();
        console.log('JWT token received'); // Debug log
        return data.token;
      } else {
        console.error('JWT authentication failed:', response.status, response.statusText);
        const errorData = await response.json().catch(() => null);
        if (errorData?.message) {
          setError(errorData.message);
        }
        return null;
      }
    } catch (error) {
      console.error('Error getting JWT token:', error);
      return null;
    }
  };

  /**
   * Validate JWT token and get user info
   */
  const validateJwtToken = async (token: string): Promise<User | null> => {
    try {
      const apiUrl = getRootApiUrl();
      const authHeader = createJwtAuthHeader(token);
      
      // Validate token and get user info
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
          username: userData.username || userData.slug || '',
          email: userData.email || '',
          name: userData.name || userData.display_name || ''
        };
      } else {
        console.error('Token validation failed:', response.status, response.statusText);
        return null;
      }
    } catch (error) {
      console.error('Error validating token:', error);
      return null;
    }
  };

  /**
   * Save JWT token and user to localStorage
   */
  const saveAuthData = (token: string, user: User) => {
    try {
      localStorage.setItem(STORAGE_KEYS.JWT_TOKEN, token);
      localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
    } catch (error) {
      console.error('Error saving auth data to localStorage:', error);
    }
  };

  /**
   * Load auth data from localStorage
   */
  const loadAuthData = (): { token: string; user: User } | null => {
    try {
      const token = localStorage.getItem(STORAGE_KEYS.JWT_TOKEN);
      const userStr = localStorage.getItem(STORAGE_KEYS.USER);
      
      if (token && userStr) {
        const user = JSON.parse(userStr);
        return { token, user };
      }
    } catch (error) {
      console.error('Error loading auth data from localStorage:', error);
    }
    return null;
  };

  /**
   * Clear stored auth data
   */
  const clearStoredAuthData = () => {
    try {
      localStorage.removeItem(STORAGE_KEYS.JWT_TOKEN);
      localStorage.removeItem(STORAGE_KEYS.USER);
      // Clear global state
      globalJwtToken = null;
    } catch (error) {
      console.error('Error clearing auth data from localStorage:', error);
    }
  };

  /**
   * Update global JWT token state
   */
  const updateGlobalToken = (token: string | null) => {
    globalJwtToken = token;
    globalAuthInitialized = true;
  };

  /**
   * Login function - authenticates with WordPress using JWT
   */
  const login = async (username: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Get JWT token
      const token = await getJwtToken(username, password);
      
      if (token) {
        // Validate token and get user data
        const userData = await validateJwtToken(token);
        
        if (userData) {
          console.log('Login successful, setting user:', userData); // Debug log
          setJwtToken(token);
          setUser(userData);
          setIsAuthenticated(true);
          
          // Update global state immediately
          updateGlobalToken(token);
          
          // Save to localStorage for persistence
          saveAuthData(token, userData);
          
          setIsLoading(false);
          return true;
        } else {
          setError('Failed to validate token');
          setIsLoading(false);
          return false;
        }
      } else {
        setError(error || 'Invalid username or password');
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
    setJwtToken(null);
    setIsAuthenticated(false);
    setUser(null);
    setError(null);
    updateGlobalToken(null);
    clearStoredAuthData();
  };

  /**
   * Get authentication header for API requests
   */
  const getAuthHeader = (): { Authorization: string } | {} => {
    if (jwtToken) {
      return createJwtAuthHeader(jwtToken);
    }
    return {};
  };

  /**
   * Initialize authentication state from localStorage on mount
   */
  useEffect(() => {
    const initializeAuth = async () => {
      console.log('🔐 Initializing JWT authentication...');
      const storedAuthData = loadAuthData();
      
      if (storedAuthData) {
        console.log('🔐 Found stored JWT token, validating...');
        // Update global state immediately with stored token
        updateGlobalToken(storedAuthData.token);
        
        // Validate stored token
        const userData = await validateJwtToken(storedAuthData.token);
        
        if (userData) {
          console.log('🔐 Stored JWT token is valid');
          setJwtToken(storedAuthData.token);
          setUser(userData);
          setIsAuthenticated(true);
        } else {
          console.log('🔐 Stored JWT token is invalid, clearing...');
          // Stored token is invalid, clear it
          clearStoredAuthData();
          updateGlobalToken(null);
        }
      } else {
        console.log('🔐 No stored JWT token found');
        updateGlobalToken(null);
      }
      
      console.log('🔐 JWT authentication initialization complete');
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
 * This now uses JWT tokens from global state for immediate access during initialization
 */
export const createAuthHeader = (): { Authorization: string } | {} => {
  // Use global JWT token if available (immediate access)
  if (globalJwtToken) {
    console.log('🔐 Using global JWT token for auth header');
    return { Authorization: `Bearer ${globalJwtToken}` };
  }
  
  // During initialization, try to read from localStorage directly
  if (!globalAuthInitialized) {
    console.log('🔐 Auth not initialized yet, trying localStorage...');
    try {
      const token = localStorage.getItem(STORAGE_KEYS.JWT_TOKEN);
      
      if (token) {
        console.log('🔐 Using localStorage JWT token for auth header');
        return { Authorization: `Bearer ${token}` };
      }
    } catch (error) {
      console.error('Error reading stored JWT token during initialization:', error);
    }
  }
  
  console.log('🔐 No JWT token available');
  return {};
};

export default AuthContext;