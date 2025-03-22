// src/services/apiAuthService.ts

/**
 * API Authentication Service
 * 
 * This service handles application-level JWT authentication with the WordPress API.
 * It authenticates the application itself rather than end users.
 */

// Base API URL - update this with your WordPress site URL
const API_BASE_URL = 'https://wpcms.thechief.com';
const JWT_AUTH_ENDPOINT = `${API_BASE_URL}/wp-json/jwt-auth/v1`;

// Configuration
const APP_USERNAME = import.meta.env.VITE_WP_APP_USERNAME || '';
const APP_PASSWORD = import.meta.env.VITE_WP_APP_PASSWORD || '';

// Storage keys for token
const TOKEN_KEY = 'wp_app_jwt_token';
const TOKEN_EXPIRY_KEY = 'wp_app_jwt_expiry';

// Interface for authentication response
interface AuthResponse {
  token: string;
  user_email: string;
  user_nicename: string;
  user_display_name: string;
}

/**
 * Application-level authentication service
 */
export const apiAuthService = {
  /**
   * Initialize the authentication service
   * This should be called when the application starts
   * It will attempt to authenticate with stored credentials
   */
  initialize: async (): Promise<boolean> => {
    // Check if we already have a valid token
    if (apiAuthService.isTokenValid()) {
      return true;
    }

    // If no valid token, attempt to authenticate
    return apiAuthService.authenticate();
  },

  /**
   * Authenticate the application with the WordPress API
   * Uses environment variables for credentials
   */
  authenticate: async (): Promise<boolean> => {
    // Ensure we have credentials
    if (!APP_USERNAME || !APP_PASSWORD) {
      console.error('API authentication failed: Missing credentials in environment variables');
      return false;
    }

    try {
      const response = await fetch(`${JWT_AUTH_ENDPOINT}/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: APP_USERNAME,
          password: APP_PASSWORD,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        console.error('API authentication failed:', error.message);
        return false;
      }

      const authData: AuthResponse = await response.json();
      
      // Store the token with an expiry (default: 24 hours)
      localStorage.setItem(TOKEN_KEY, authData.token);
      localStorage.setItem(TOKEN_EXPIRY_KEY, (Date.now() + 24 * 60 * 60 * 1000).toString());
      
      console.log('API authenticated successfully');
      return true;
    } catch (error) {
      console.error('API authentication failed:', error);
      return false;
    }
  },

  /**
   * Check if the current token is valid (exists and not expired)
   */
  isTokenValid: (): boolean => {
    const token = localStorage.getItem(TOKEN_KEY);
    const expiry = localStorage.getItem(TOKEN_EXPIRY_KEY);
    
    if (!token || !expiry) {
      return false;
    }

    // Check if token is expired
    return Date.now() < parseInt(expiry, 10);
  },

  /**
   * Get the current authentication token
   */
  getToken: (): string | null => {
    // If token exists but is expired, return null
    if (!apiAuthService.isTokenValid()) {
      return null;
    }
    
    return localStorage.getItem(TOKEN_KEY);
  },

  /**
   * Add authentication headers to fetch requests
   * @param headers Existing headers object or undefined
   * @returns Headers with authorization token if available
   */
  getAuthHeaders: (headers: HeadersInit = {}): HeadersInit => {
    const token = apiAuthService.getToken();
    
    if (!token) {
      return headers;
    }

    return {
      ...headers,
      'Authorization': `Bearer ${token}`
    };
  },

  /**
   * Make an authenticated fetch request to the WordPress API
   * @param url The full URL to fetch
   * @param options Fetch options
   * @returns Promise with the fetch response
   */
  authenticatedFetch: async <T>(
    url: string, 
    options: RequestInit = {}
  ): Promise<T> => {
    // Check if token is valid, if not, try to authenticate
    if (!apiAuthService.isTokenValid()) {
      const authenticated = await apiAuthService.authenticate();
      if (!authenticated) {
        throw new Error('Failed to authenticate with the API');
      }
    }

    // Add auth headers to the request
    const headers = apiAuthService.getAuthHeaders(options.headers);

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      if (!response.ok) {
        // Handle 401 Unauthorized by attempting to refresh the token
        if (response.status === 401) {
          const refreshed = await apiAuthService.authenticate();
          if (refreshed) {
            // Retry the request with the new token
            const retryHeaders = apiAuthService.getAuthHeaders(options.headers);
            const retryResponse = await fetch(url, {
              ...options,
              headers: retryHeaders,
            });

            if (!retryResponse.ok) {
              throw new Error(`API request failed with status ${retryResponse.status}`);
            }

            return await retryResponse.json();
          }
        }

        throw new Error(`API request failed with status ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }
};

export default apiAuthService;
