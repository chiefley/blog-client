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
 * Unicode-safe base64 encoding function
 * This properly handles special characters in credentials that btoa() can't handle
 */
export const safeBase64Encode = (str: string): string => {
  // Convert string to UTF-8 encoded string
  const encoded = encodeURIComponent(str)
    .replace(/%([0-9A-F]{2})/g, (match, p1) => {
      return String.fromCharCode(parseInt(p1, 16));
    });
  
  // Now use standard base64 encoding on the UTF-8 string
  return btoa(encoded);
};

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

    // For debugging only - show if credentials are available
    console.log('Auth credentials available:', !!wpUsername && !!wpPassword);
    
    if (wpUsername && wpPassword) {
      try {
        const credentials = `${wpUsername}:${wpPassword}`;
        // Use the safe base64 encoding function
        const encodedCredentials = safeBase64Encode(credentials);
        const header = { Authorization: `Basic ${encodedCredentials}` };
        
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
    console.warn('🔐 Authentication Error: WordPress API credentials not found in environment variables');
    return null;
  }
  
  try {
    const credentials = `${wpUsername}:${wpPassword}`;
    // Use the safe base64 encoding function
    const encodedCredentials = safeBase64Encode(credentials);
    const authHeader = { 
      Authorization: `Basic ${encodedCredentials}`
    };
    
    // Debug logging
    console.log('🔐 Authentication: Created auth header successfully');
    
    return authHeader;
  } catch (error) {
    console.error('🔐 Authentication Error: Failed to create auth header', error);
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
    console.error('🔐 Authentication Test: No authentication header available to test');
    return false;
  }
  
  // Debug the current URL context
  console.log('🔐 Authentication Test:');
  console.log('  - Current URL:', window.location.href);
  console.log('  - Testing with auth header:', !!authHeader);
  
  try {
    const baseUrl = import.meta.env.VITE_WP_API_BASE_URL || 'https://wpcms.thechief.com';
    const testUrl = `${baseUrl}/wp-json/wp/v2/users/me`;
    
    console.log('  - Testing URL:', testUrl);
    
    const response = await fetch(testUrl, {
      headers: {
        ...authHeader,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('  - Response status:', response.status);
    
    if (response.ok) {
      const userData = await response.json();
      console.log('  - Authentication successful, user data:', userData);
      return true;
    } else {
      console.error('  - Authentication failed with status:', response.status);
      // Try to get more info about the failure
      try {
        const errorData = await response.json();
        console.error('  - Error details:', errorData);
      } catch (e) {
        // If we can't parse JSON, try to get the text
        try {
          const errorText = await response.text();
          console.error('  - Error response:', errorText);
        } catch (e2) {
          console.error('  - Could not get error details');
        }
      }
      return false;
    }
  } catch (error) {
    console.error('  - Error testing authentication:', error);
    return false;
  }
};