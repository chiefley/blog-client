// src/services/simpleAuth.ts
import { getRootApiUrl } from './wordpressApi';

// Auth response interfaces
export interface SimpleAuthUser {
  id: number;
  username: string;
  email: string;
  display_name: string;
  roles: string[];
  capabilities: {
    read_private_posts: boolean;
    edit_posts: boolean;
  };
  blogs?: Array<{
    userblog_id: string;
    blogname: string;
    domain: string;
    path: string;
  }>;
  current_blog_id?: number;
}

export interface SimpleAuthResponse {
  success: boolean;
  token: string;
  user: SimpleAuthUser;
  expires_in: number;
}

export interface SimpleAuthError {
  code: string;
  message: string;
  data?: {
    status: number;
  };
}

// Storage keys
const STORAGE_KEYS = {
  TOKEN: 'wp_simple_auth_token',
  USER: 'wp_simple_auth_user',
  EXPIRES: 'wp_simple_auth_expires'
};

/**
 * Login with Simple Auth
 */
export const simpleAuthLogin = async (
  username: string, 
  password: string
): Promise<SimpleAuthResponse> => {
  const apiUrl = getRootApiUrl();
  
  try {
    const response = await fetch(`${apiUrl}/simple-auth/v1/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username, password })
    });

    const data = await response.json();

    if (!response.ok) {
      throw {
        code: data.code || 'login_failed',
        message: data.message || 'Login failed',
        data: { status: response.status }
      };
    }

    // Store auth data
    if (data.token) {
      localStorage.setItem(STORAGE_KEYS.TOKEN, data.token);
      localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(data.user));
      const expiresAt = Date.now() + (data.expires_in * 1000);
      localStorage.setItem(STORAGE_KEYS.EXPIRES, expiresAt.toString());
    }

    return data;
  } catch (error) {
    console.error('Simple Auth login error:', error);
    throw error;
  }
};

/**
 * Logout and clear tokens
 */
export const simpleAuthLogout = async (): Promise<void> => {
  const token = localStorage.getItem(STORAGE_KEYS.TOKEN);
  
  // Clear local storage immediately to prevent race conditions
  localStorage.removeItem(STORAGE_KEYS.TOKEN);
  localStorage.removeItem(STORAGE_KEYS.USER);
  localStorage.removeItem(STORAGE_KEYS.EXPIRES);
  
  // Then try to notify the server
  if (token) {
    const apiUrl = getRootApiUrl();
    
    try {
      await fetch(`${apiUrl}/simple-auth/v1/logout`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
    } catch (error) {
      console.error('Logout request failed:', error);
      // Already cleared local storage, so we're good
    }
  }
};

/**
 * Verify current token
 */
export const simpleAuthVerify = async (): Promise<SimpleAuthUser | null> => {
  const token = localStorage.getItem(STORAGE_KEYS.TOKEN);
  
  if (!token) {
    return null;
  }
  
  // Check expiry
  const expires = localStorage.getItem(STORAGE_KEYS.EXPIRES);
  if (expires && Date.now() > parseInt(expires)) {
    // Token expired
    await simpleAuthLogout();
    return null;
  }
  
  const apiUrl = getRootApiUrl();
  
  try {
    const response = await fetch(`${apiUrl}/simple-auth/v1/verify`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      // Token invalid
      await simpleAuthLogout();
      return null;
    }

    const data = await response.json();
    return data.user;
  } catch (error) {
    console.error('Token verification failed:', error);
    return null;
  }
};

/**
 * Refresh token
 */
export const simpleAuthRefresh = async (): Promise<string | null> => {
  const token = localStorage.getItem(STORAGE_KEYS.TOKEN);
  
  if (!token) {
    return null;
  }
  
  const apiUrl = getRootApiUrl();
  
  try {
    const response = await fetch(`${apiUrl}/simple-auth/v1/refresh`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    
    if (data.token) {
      localStorage.setItem(STORAGE_KEYS.TOKEN, data.token);
      const expiresAt = Date.now() + (data.expires_in * 1000);
      localStorage.setItem(STORAGE_KEYS.EXPIRES, expiresAt.toString());
      return data.token;
    }
    
    return null;
  } catch (error) {
    console.error('Token refresh failed:', error);
    return null;
  }
};

/**
 * Get current auth token
 */
export const getSimpleAuthToken = (): string | null => {
  const token = localStorage.getItem(STORAGE_KEYS.TOKEN);
  console.log('🗝️ getSimpleAuthToken:', token ? 'Token found in localStorage' : 'No token in localStorage');
  return token;
};

/**
 * Get current user
 */
export const getSimpleAuthUser = (): SimpleAuthUser | null => {
  const userStr = localStorage.getItem(STORAGE_KEYS.USER);
  if (!userStr) return null;
  
  try {
    return JSON.parse(userStr);
  } catch {
    return null;
  }
};

/**
 * Create auth headers for API requests
 */
export const createSimpleAuthHeader = (): { Authorization: string } | {} => {
  const token = getSimpleAuthToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
};