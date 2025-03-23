// src/services/authService.ts
import { useState, useEffect } from 'react';

/**
 * Simple service to handle WordPress Basic Authentication
 */
export const useAuth = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [authHeader, setAuthHeader] = useState<string | null>(null);
  
  // Check if credentials exist in environment variables
  const wpUsername = import.meta.env.VITE_WP_APP_USERNAME;
  const wpPassword = import.meta.env.VITE_WP_APP_PASSWORD;

  useEffect(() => {
    // If environment variables are available, create the auth header
    if (wpUsername && wpPassword) {
      const credentials = `${wpUsername}:${wpPassword}`;
      const encodedCredentials = btoa(credentials); // Base64 encode
      const header = `Basic ${encodedCredentials}`;
      
      setAuthHeader(header);
      setIsAuthenticated(true);
    } else {
      console.warn('WordPress API credentials not found in environment variables');
      setIsAuthenticated(false);
      setAuthHeader(null);
    }
  }, [wpUsername, wpPassword]);

  return {
    isAuthenticated,
    authHeader
  };
};

/**
 * Utility function to create auth header for fetch calls
 * Use this when you don't want to use the hook
 */
export const createAuthHeader = (): { Authorization: string } | undefined => {
  const wpUsername = import.meta.env.VITE_WP_APP_USERNAME;
  const wpPassword = import.meta.env.VITE_WP_APP_PASSWORD;
  
  if (wpUsername && wpPassword) {
    const credentials = `${wpUsername}:${wpPassword}`;
    const encodedCredentials = btoa(credentials);
    return { 
      Authorization: `Basic ${encodedCredentials}`
    };
  }
  
  return undefined;
};
