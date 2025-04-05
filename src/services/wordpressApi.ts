// src/services/wordpressApi.ts
import { WordPressPost, Category } from '../types/interfaces';
import { createAuthHeader } from './authService';
import { getCurrentBlogPath } from '../config/multisiteConfig';

// Base API URL from environment variables
const API_BASE_URL = import.meta.env.VITE_WP_API_BASE_URL || 'https://wpcms.thechief.com';

/**
 * Construct the full API URL for the current blog
 */
const getApiUrl = (): string => {
  const blogPath = getCurrentBlogPath();
  let apiUrl = `${API_BASE_URL}`;
  
  // Add blog path if we're in a multisite environment
  if (blogPath) {
    apiUrl += `/${blogPath}`;
  }
  
  // Add the REST API endpoint
  apiUrl += '/wp-json/wp/v2';
  
  // Debug logging
  console.log('🌐 API URL Construction:');
  console.log('  - Hostname:', window.location.hostname);
  console.log('  - Path:', window.location.pathname);
  console.log('  - Detected blog path:', blogPath ? `"${blogPath}"` : '(main blog)');
  console.log('  - Base API URL:', API_BASE_URL);
  console.log('  - Final API URL:', apiUrl);
  
  return apiUrl;
};

// Helper function code has been removed to fix TS6133 error
// We can reimplement this in the future if needed

/**
 * Get posts with optional filtering
 */
export const getPosts = async (options: {
  page?: number;
  perPage?: number;
  categoryId?: number;
  categorySlug?: string | null;
  search?: string;
} = {}): Promise<{ posts: WordPressPost[]; totalPages: number }> => {
  const { page = 1, perPage = 10, categoryId, categorySlug, search } = options;

  const params = new URLSearchParams();
  params.append('page', page.toString());
  params.append('per_page', perPage.toString());
  
  // With Better REST API Featured Image plugin, we can avoid embedding media
  // when we only need the featured image URL, but we'll still request it for backward compatibility
  params.append('_embed', 'author,wp:term');

  // Handle either categoryId or categorySlug
  if (categoryId) {
    params.append('categories', categoryId.toString());
  } else if (categorySlug) {
    // If we have a slug instead of an ID, we need to first find the category ID
    try {
      const categories = await getCategories();
      const category = categories.find(cat => cat.slug === categorySlug);
      if (category) {
        params.append('categories', category.id.toString());
      }
    } catch (error) {
      console.error('Error finding category by slug:', error);
    }
  }

  if (search) {
    params.append('search', search);
  }

  const apiUrl = getApiUrl();
  const requestUrl = `${apiUrl}/posts?${params}`;
  
  try {
    // Get authentication header from authService
    const authHeader = createAuthHeader();
    
    // Create request options with auth header
    const requestOptions: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...(authHeader || {})
      }
    };

    // For debugging - log the full request details
    console.log('Request URL:', requestUrl);
    console.log('Request Headers:', requestOptions.headers);

    const response = await fetch(requestUrl, requestOptions);
    
    // Log response details for debugging
    console.log(`Posts API Response [${response.status}]:`, {
      url: requestUrl,
      authenticated: !!authHeader,
      status: response.status,
      headers: {
        'X-WP-Total': response.headers.get('X-WP-Total'),
        'X-WP-TotalPages': response.headers.get('X-WP-TotalPages')
      }
    });
    
    // Check if the request was successful
    if (!response.ok) {
      // Try to get more information about the error
      let errorDetails = '';
      try {
        const errorData = await response.text();
        errorDetails = errorData.substring(0, 200); // First 200 chars for brevity
      } catch (e) {
        // Ignore if we can't get error details
      }
      
      throw new Error(`API request failed with status ${response.status}: ${errorDetails}`);
    }
    
    const posts = await response.json();
    const totalPages = parseInt(response.headers.get('X-WP-TotalPages') || '1', 10);
    
    console.log(`Successfully fetched ${posts.length} posts, total pages: ${totalPages}`);
    return { posts, totalPages };
  } catch (error) {
    console.error('Error fetching posts:', error);
    return { posts: [], totalPages: 0 };
  }
};

/**
 * Get a single post by slug
 */
export const getPostBySlug = async (slug: string): Promise<WordPressPost | null> => {
  const params = new URLSearchParams();
  params.append('slug', slug);
  params.append('_embed', 'author,wp:featuredmedia,wp:term');

  const apiUrl = getApiUrl();
  const requestUrl = `${apiUrl}/posts?${params}`;

  try {
    // Get authentication header from authService
    const authHeader = createAuthHeader();

    // Create request options with auth header
    const requestOptions: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...(authHeader || {})
      }
    };

    // For debugging - log the request
    console.log('Fetching post by slug:', slug);
    console.log('Request URL:', requestUrl);
    console.log('With auth header:', !!authHeader);

    const response = await fetch(requestUrl, requestOptions);
    
    // Log response details for debugging
    console.log(`Post by Slug API Response [${response.status}]:`, {
      slug,
      url: requestUrl,
      authenticated: !!authHeader,
      status: response.status
    });
    
    if (!response.ok) {
      // Try to get more information about the error
      let errorDetails = '';
      try {
        const errorData = await response.text();
        errorDetails = errorData.substring(0, 200); // First 200 chars for brevity
      } catch (e) {
        // Ignore if we can't get error details
      }
      
      throw new Error(`API request failed with status ${response.status}: ${errorDetails}`);
    }
    
    const posts = await response.json();
    
    // The API returns an array, but we only want the first post with this slug
    return posts.length > 0 ? posts[0] : null;
  } catch (error) {
    console.error('Error fetching post by slug:', error);
    return null;
  }
};

/**
 * Get categories
 */
export const getCategories = async (): Promise<Category[]> => {
  const apiUrl = getApiUrl();
  const requestUrl = `${apiUrl}/categories?per_page=100`;

  try {
    // Get authentication header from authService
    const authHeader = createAuthHeader();

    // Create request options with auth header
    const requestOptions: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...(authHeader || {})
      }
    };

    console.log('Fetching categories with auth:', !!authHeader);
    console.log('Categories request URL:', requestUrl);

    const response = await fetch(requestUrl, requestOptions);
    
    // Log response details for debugging
    console.log(`Categories API Response [${response.status}]:`, {
      url: requestUrl,
      authenticated: !!authHeader,
      status: response.status
    });
    
    if (!response.ok) {
      // Try to get more information about the error
      let errorDetails = '';
      try {
        const errorData = await response.text();
        errorDetails = errorData.substring(0, 200); // First 200 chars for brevity
      } catch (e) {
        // Ignore if we can't get error details
      }
      
      throw new Error(`API request failed with status ${response.status}: ${errorDetails}`);
    }
    
    const categories = await response.json();
    console.log(`Successfully fetched ${categories.length} categories`);
    return categories;
  } catch (error) {
    console.error('Error fetching categories:', error);
    return [];
  }
};

/**
 * Get a specific category by slug
 */
export const getCategoryBySlug = async (slug: string): Promise<Category | null> => {
  const apiUrl = getApiUrl();
  const requestUrl = `${apiUrl}/categories?slug=${slug}`;

  try {
    // Get authentication header from authService
    const authHeader = createAuthHeader();

    // Create request options with auth header
    const requestOptions: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...(authHeader || {})
      }
    };

    console.log('Fetching category by slug:', slug);
    console.log('Request URL:', requestUrl);
    console.log('With auth header:', !!authHeader);

    const response = await fetch(requestUrl, requestOptions);
    
    // Log response details for debugging
    console.log(`Category by Slug API Response [${response.status}]:`, {
      slug,
      url: requestUrl,
      authenticated: !!authHeader,
      status: response.status
    });
    
    if (!response.ok) {
      // Try to get more information about the error
      let errorDetails = '';
      try {
        const errorData = await response.text();
        errorDetails = errorData.substring(0, 200); // First 200 chars for brevity
      } catch (e) {
        // Ignore if we can't get error details
      }
      
      throw new Error(`API request failed with status ${response.status}: ${errorDetails}`);
    }
    
    const categories = await response.json();
    
    // The API returns an array, but we only want the first category with this slug
    return categories.length > 0 ? categories[0] : null;
  } catch (error) {
    console.error('Error fetching category by slug:', error);
    return null;
  }
};

/**
 * Get tags
 */
export const getTags = async (): Promise<any[]> => {
  const apiUrl = getApiUrl();
  const requestUrl = `${apiUrl}/tags?per_page=100`;

  try {
    // Get authentication header from authService
    const authHeader = createAuthHeader();

    // Create request options with auth header
    const requestOptions: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...(authHeader || {})
      }
    };

    console.log('Fetching tags with auth:', !!authHeader);
    console.log('Tags request URL:', requestUrl);

    const response = await fetch(requestUrl, requestOptions);
    
    // Log response details for debugging
    console.log(`Tags API Response [${response.status}]:`, {
      url: requestUrl,
      authenticated: !!authHeader,
      status: response.status
    });
    
    if (!response.ok) {
      // Try to get more information about the error
      let errorDetails = '';
      try {
        const errorData = await response.text();
        errorDetails = errorData.substring(0, 200); // First 200 chars for brevity
      } catch (e) {
        // Ignore if we can't get error details
      }
      
      throw new Error(`API request failed with status ${response.status}: ${errorDetails}`);
    }
    
    const tags = await response.json();
    console.log(`Successfully fetched ${tags.length} tags`);
    return tags;
  } catch (error) {
    console.error('Error fetching tags:', error);
    return [];
  }
};