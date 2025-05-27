// src/contexts/AuthContext.tsx
import React, { createContext, useState, use, ReactNode } from 'react';

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

// Auth provider component
export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [authToken, setAuthToken] = useState<string | null>(null);

  /**
   * Login function - authenticates with WordPress JWT
   */
  const login = async (username: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const baseUrl = import.meta.env.VITE_WP_API_BASE_URL || 'https://wpcms.thechief.com';
      
      const response = await fetch(`${baseUrl}/wp-json/jwt-auth/v1/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          username,
          password
        })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.token) {
          setAuthToken(data.token);
          setIsAuthenticated(true);
          
          // Set user data if available in response
          if (data.user) {
            setUser({
              id: data.user.id || 0,
              username: data.user.user_login || username,
              email: data.user.user_email || '',
              name: data.user.user_display_name || username
            });
          } else {
            // Create a basic user object if not provided
            setUser({
              id: 0,
              username: username,
              email: '',
              name: username
            });
          }
          
          setIsLoading(false);
          return true;
        }
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Login failed');
      }
      
      setIsLoading(false);
      return false;
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
    setAuthToken(null);
    setIsAuthenticated(false);
    setUser(null);
    setError(null);
  };

  /**
   * Get authentication header for API requests
   */
  const getAuthHeader = (): { Authorization: string } | {} => {
    if (authToken) {
      return { Authorization: `Bearer ${authToken}` };
    }
    return {};
  };

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
 */
export const createAuthHeader = (): { Authorization: string } | {} => {
  // Get credentials from environment variables
  const username = import.meta.env.VITE_WP_APP_USERNAME;
  const password = import.meta.env.VITE_WP_APP_PASSWORD;
  
  if (username && password) {
    const credentials = btoa(`${username}:${password}`);
    return { Authorization: `Basic ${credentials}` };
  }
  
  return {};
};

export default AuthContext;