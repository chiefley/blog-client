// src/services/wordpressApi.ts
import { WordPressPost, Category, Comment, CommentData, SiteInfo } from '../types/interfaces';
import { createAuthHeader } from './authService';
import { getCurrentBlogPath } from '../config/multisiteConfig';

// Base API URL from environment variables
const API_BASE_URL = import.meta.env.VITE_WP_API_BASE_URL || 'https://wpcms.thechief.com';

/**
 * Construct the full API URL for the current blog
 */
export const getApiUrl = (): string => {
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

/**
 * Get the root API URL (without /wp/v2) for other endpoints
 */
export const getRootApiUrl = (): string => {
  const blogPath = getCurrentBlogPath();
  let apiUrl = `${API_BASE_URL}`;
  
  // Add blog path if we're in a multisite environment
  if (blogPath) {
    apiUrl += `/${blogPath}`;
  }
  
  // Add the REST API root endpoint
  apiUrl += '/wp-json';
  
  return apiUrl;
};

/**
 * Get site information
 */
export const getSiteInfo = async (): Promise<SiteInfo> => {
  const baseUrl = import.meta.env.VITE_WP_API_BASE_URL || 'https://wpcms.thechief.com';
  const blogPath = getCurrentBlogPath();
  
  // Construct the site info URL, adding the blog path for multisite
  let siteInfoUrl = `${baseUrl}`;
  if (blogPath) {
    siteInfoUrl += `/${blogPath}`;
  }
  siteInfoUrl += '/wp-json/site-info/v1/public';
  
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
    
    console.log('Fetching site info:', siteInfoUrl);
    
    const response = await fetch(siteInfoUrl, requestOptions);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch site info: ${response.status} ${response.statusText}`);
    }
    
    const siteInfo = await response.json();
    console.log('Site info fetched successfully:', siteInfo);
    return siteInfo as SiteInfo;
  } catch (error) {
    console.error('Error fetching site info:', error);
    
    // Return fallback values if the API fails
    return {
      name: 'XBlog',
      description: 'A modern React blog with WordPress backend',
      url: '/',
      home: '/',
      gmt_offset: 0,
      timezone_string: '',
      site_logo: null
    };
  }
}
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
  
  // FIXED: Put back wp:featuredmedia since we need the embedded media as a fallback
  // even with Better REST API Featured Image plugin installed
  params.append('_embed', 'author,wp:featuredmedia,wp:term');

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

/**
 * Get comments for a specific post
 */
export const getComments = async (postId: number): Promise<Comment[]> => {
  const apiUrl = getApiUrl();
  const requestUrl = `${apiUrl}/comments?post=${postId}&orderby=date&order=asc&per_page=100`;
  
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

    console.log('Fetching comments for post:', postId);
    console.log('Request URL:', requestUrl);
    console.log('With auth header:', !!authHeader);

    const response = await fetch(requestUrl, requestOptions);
    
    console.log(`Comments API Response [${response.status}]:`, {
      postId,
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
    
    const comments = await response.json();
    console.log(`Successfully fetched ${comments.length} comments for post ${postId}`);
    return comments;
  } catch (error) {
    console.error('Error fetching comments:', error);
    return [];
  }
};

/**
 * Post a new comment
 */
export const postComment = async (commentData: CommentData): Promise<Comment | null> => {
  const apiUrl = getApiUrl();
  const requestUrl = `${apiUrl}/comments`;
  
  try {
    // Get authentication header from authService
    const authHeader = createAuthHeader();
    
    // Create request options with auth header and comment data
    const requestOptions: RequestInit = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(authHeader || {})
      },
      body: JSON.stringify(commentData)
    };

    console.log('Posting comment for post:', commentData.post);
    console.log('Request URL:', requestUrl);
    console.log('With auth header:', !!authHeader);

    const response = await fetch(requestUrl, requestOptions);
    
    console.log(`Post Comment API Response [${response.status}]:`, {
      postId: commentData.post,
      url: requestUrl,
      authenticated: !!authHeader,
      status: response.status
    });
    
    if (!response.ok) {
      // Try to get more information about the error
      let errorDetails = '';
      try {
        const errorData = await response.json();
        errorDetails = JSON.stringify(errorData).substring(0, 200); // First 200 chars for brevity
      } catch (e) {
        // If JSON parsing fails, try to get text
        try {
          const errorText = await response.text();
          errorDetails = errorText.substring(0, 200); // First 200 chars for brevity
        } catch (e2) {
          // Ignore if we can't get error details
        }
      }
      
      throw new Error(`API request failed with status ${response.status}: ${errorDetails}`);
    } 
    
    const newComment = await response.json();
    console.log('Successfully posted comment');
    return newComment;
  } catch (error) {
    console.error('Error posting comment:', error);
    throw error; // Re-throw to handle in UI
  }
};