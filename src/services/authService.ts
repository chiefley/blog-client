// src/services/authService.ts
import { useState, useEffect } from 'react';

/**
 * Interface for authentication data
 */
export interface AuthData {
  isAuthenticated: boolean;
  authHeader: { Authorization: string } | null;
}

/**
 * Hook to handle WordPress Basic Authentication
 */
export const useAuth = (): AuthData => {
  const [authData, setAuthData] = useState<AuthData>({
    isAuthenticated: false,
    authHeader: null
  });
  
  useEffect(() => {
    // Check if credentials exist in environment variables
    const wpUsername = import.meta.env.VITE_WP_APP_USERNAME;
    const wpPassword = import.meta.env.VITE_WP_APP_PASSWORD;

    // For debugging only - REMOVE IN PRODUCTION
    console.log('Auth credentials available:', !!wpUsername && !!wpPassword);
    
    if (wpUsername && wpPassword) {
      try {
        const credentials = `${wpUsername}:${wpPassword}`;
        const encodedCredentials = btoa(credentials); // Base64 encode
        const header = { Authorization: `Basic ${encodedCredentials}` };
        
        // For debugging only - REMOVE IN PRODUCTION
        console.log('Auth header created successfully');
        
        setAuthData({
          isAuthenticated: true,
          authHeader: header
        });
      } catch (error) {
        console.error('Error creating authentication header:', error);
        setAuthData({
          isAuthenticated: false,
          authHeader: null
        });
      }
    } else {
      console.warn('WordPress API credentials not found in environment variables');
      setAuthData({
        isAuthenticated: false,
        authHeader: null
      });
    }
  }, []);

  return authData;
};

/**
 * Utility function to create auth header for fetch calls
 * Use this when you don't want to use the hook
 */
export const createAuthHeader = (): { Authorization: string } | null => {
  const wpUsername = import.meta.env.VITE_WP_APP_USERNAME;
  const wpPassword = import.meta.env.VITE_WP_APP_PASSWORD;
  
  if (!wpUsername || !wpPassword) {
    console.warn('WordPress API credentials not found in environment variables');
    return null;
  }
  
  try {
    const credentials = `${wpUsername}:${wpPassword}`;
    const encodedCredentials = btoa(credentials);
    return { 
      Authorization: `Basic ${encodedCredentials}`
    };
  } catch (error) {
    console.error('Error creating authentication header:', error);
    return null;
  }
};

/**
 * Test function to verify credentials are working
 * Call this during development to check if auth is working
 */
export const testAuthentication = async (): Promise<boolean> => {
  const authHeader = createAuthHeader();
  
  if (!authHeader) {
    console.error('No authentication header available to test');
    return false;
  }
  
  // For debugging only - REMOVE IN PRODUCTION
  console.log('Testing authentication with header:', authHeader);
  
  try {
    const baseUrl = import.meta.env.VITE_WP_API_BASE_URL || 'https://wpcms.thechief.com';
    const response = await fetch(`${baseUrl}/wp-json/wp/v2/users/me`, {
      headers: {
        ...authHeader,
        'Content-Type': 'application/json'
      }
    });
    
    // For debugging only - REMOVE IN PRODUCTION
    console.log('Auth test response status:', response.status);
    
    if (response.ok) {
      const userData = await response.json();
      console.log('Authentication successful, user data:', userData);
      return true;
    } else {
      console.error('Authentication failed with status:', response.status);
      return false;
    }
  } catch (error) {
    console.error('Error testing authentication:', error);
    return false;
  }
};