// src/contexts/SimpleAuthContext.tsx
import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { 
  simpleAuthLogin, 
  simpleAuthLogout, 
  simpleAuthVerify,
  simpleAuthRefresh,
  getSimpleAuthToken,
  createSimpleAuthHeader,
  SimpleAuthUser 
} from '../services/simpleAuth';

// Define the authentication context type
interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  user: SimpleAuthUser | null;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  getAuthHeader: () => { Authorization: string } | {};
  refreshToken: () => Promise<boolean>;
}

// Create the context with default values
const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  isLoading: false,
  error: null,
  user: null,
  login: async () => false,
  logout: async () => {},
  getAuthHeader: () => ({}),
  refreshToken: async () => false
});

// Provider component props
interface AuthProviderProps {
  children: ReactNode;
}

// Auth provider component
export const SimpleAuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<SimpleAuthUser | null>(null);

  /**
   * Initialize auth state from stored token
   */
  useEffect(() => {
    const initAuth = async () => {
      setIsLoading(true);
      
      // Check for stored token
      const token = getSimpleAuthToken();
      if (!token) {
        setIsLoading(false);
        updateGlobalAuthState(false);
        return;
      }

      // Verify token with server
      const verifiedUser = await simpleAuthVerify();
      if (verifiedUser) {
        setUser(verifiedUser);
        setIsAuthenticated(true);
        updateGlobalAuthState(true);
        console.log('✅ Authenticated as:', verifiedUser.display_name);
      } else {
        console.log('❌ Stored token invalid or expired');
        updateGlobalAuthState(false);
      }
      
      setIsLoading(false);
    };

    initAuth();
  }, []);

  /**
   * Login function
   */
  const login = async (username: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await simpleAuthLogin(username, password);
      
      if (response.success && response.user) {
        setUser(response.user);
        setIsAuthenticated(true);
        updateGlobalAuthState(true);
        setIsLoading(false);
        console.log('✅ Login successful:', response.user.display_name);
        return true;
      }
      
      setError('Login failed');
      setIsLoading(false);
      return false;
    } catch (err: any) {
      console.error('Login error:', err);
      setError(err.message || 'Login failed');
      setIsLoading(false);
      return false;
    }
  };

  /**
   * Logout function
   */
  const logout = async (): Promise<void> => {
    setIsLoading(true);
    
    // Clear local state first to prevent race conditions
    setUser(null);
    setIsAuthenticated(false);
    setError(null);
    updateGlobalAuthState(false);
    
    try {
      await simpleAuthLogout();
    } catch (error) {
      console.error('Logout error:', error);
    }
    
    setIsLoading(false);
    console.log('👋 Logged out');
  };

  /**
   * Get auth header for API requests
   */
  const getAuthHeader = () => {
    return createSimpleAuthHeader();
  };

  /**
   * Refresh authentication token
   */
  const refreshToken = async (): Promise<boolean> => {
    try {
      const newToken = await simpleAuthRefresh();
      return !!newToken;
    } catch (error) {
      console.error('Token refresh failed:', error);
      return false;
    }
  };

  // Set up token refresh interval (refresh 1 day before expiry)
  useEffect(() => {
    if (!isAuthenticated) return;

    const refreshInterval = setInterval(async () => {
      console.log('🔄 Attempting token refresh...');
      const success = await refreshToken();
      if (!success) {
        console.error('Token refresh failed, logging out');
        await logout();
      }
    }, 6 * 24 * 60 * 60 * 1000); // 6 days

    return () => clearInterval(refreshInterval);
  }, [isAuthenticated]);

  const value: AuthContextType = {
    isAuthenticated,
    isLoading,
    error,
    user,
    login,
    logout,
    getAuthHeader,
    refreshToken
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Custom hook to use auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Export for backward compatibility with existing code
export { AuthContext };

// Store auth state globally for API functions
let globalAuthState = {
  isAuthenticated: false,
  token: null as string | null
};

// Update global state when context changes
export const updateGlobalAuthState = (authenticated: boolean) => {
  globalAuthState.isAuthenticated = authenticated;
  if (!authenticated) {
    globalAuthState.token = null;
  } else {
    globalAuthState.token = getSimpleAuthToken();
  }
};

// Helper function for immediate auth header access (used by API functions)
export const createAuthHeader = (): { Authorization: string } | {} => {
  console.log('🔑 createAuthHeader called:', {
    isAuthenticated: globalAuthState.isAuthenticated,
    hasToken: !!globalAuthState.token,
    tokenPreview: globalAuthState.token ? globalAuthState.token.substring(0, 10) + '...' : 'null'
  });
  
  // Check global state first to avoid race conditions
  if (!globalAuthState.isAuthenticated || !globalAuthState.token) {
    return {};
  }
  // Only return auth header if we're truly authenticated
  return { Authorization: `Bearer ${globalAuthState.token}` };
};

// Helper to check if user is authenticated (for API functions)
export const isAuthenticated = (): boolean => {
  return globalAuthState.isAuthenticated;
};