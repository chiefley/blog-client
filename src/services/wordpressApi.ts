// src/services/wordpressApi.ts
import { WordPressPost, Category, Comment, CommentData, SiteInfo } from '../types/interfaces';
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
  
  // Construct the site info URL with blog path for multisite
  let baseApiUrl = baseUrl;
  if (blogPath) {
    baseApiUrl += `/${blogPath}`;
  }
  
  console.log('Fetching site info for:', baseApiUrl);
  
  // Create an array of endpoints to try in order
  const endpointsToTry = [
    // 1. Try the public endpoint first
    {
      url: `${baseApiUrl}/wp-json/site-info/v1/public`,
      description: 'public site-info endpoint'
    },
    // 2. Try the standard WordPress API for minimal data (fallback)
    {
      url: `${baseApiUrl}/wp-json`,
      description: 'WordPress root endpoint'
    }
  ];
  
  // Try each endpoint in order
  for (const endpoint of endpointsToTry) {
    try {
      console.log(`Attempting to fetch site info from ${endpoint.description}:`, endpoint.url);
      
      // Set up request options
      const requestOptions: RequestInit = {
        headers: {
          'Content-Type': 'application/json'
        },
        // Add a cache-busting query parameter
        cache: 'no-cache'
      };
      
      // Make the request with timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5-second timeout
      
      try {
        requestOptions.signal = controller.signal;
        const response = await fetch(endpoint.url, requestOptions);
        clearTimeout(timeoutId);
        
        console.log(`Response from ${endpoint.description}:`, response.status, response.statusText);
        
        if (!response.ok) {
          // Log detailed error for debugging
          console.warn(`${endpoint.description} returned ${response.status} ${response.statusText}`);
          
          // Try to get more error details if possible
          try {
            const errorText = await response.text();
            console.warn('Error details:', errorText.substring(0, 200)); // First 200 chars
          } catch (e) {
            // Just log and continue if we can't get the error text
            console.warn('Could not read error details');
          }
          
          continue; // Try next endpoint
        }
        
        const data = await response.json();
        
        // Process response based on which endpoint succeeded
        if (endpoint.url.includes('site-info')) {
          // This is our custom endpoint, return data directly
          console.log('Site info fetched successfully from custom endpoint');
          return data as SiteInfo;
        } else if (endpoint.url.endsWith('/wp-json')) {
          // This is the WordPress root endpoint, extract what we can
          console.log('Extracting site info from WordPress root endpoint');
          return {
            name: data.name || 'XBlog',
            description: data.description || 'A WordPress Blog',
            url: data.url || '/',
            home: data.home || '/',
            gmt_offset: 0,
            timezone_string: '',
            site_logo: null
          };
        }
      } catch (fetchError) {
        // Clear the timeout if there was an error
        clearTimeout(timeoutId);
        throw fetchError;
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(`Error fetching from ${endpoint.description}:`, errorMessage);
    }
  }
  
  // If we reach here, all endpoints failed - use local environment detection
  console.warn('All site info endpoints failed. Using local fallback detection...');
  
  try {
    // Extract site URL from window location (this is safe)
    const protocol = window.location.protocol;
    const host = window.location.host;
    const siteUrl = `${protocol}//${host}`;
    
    // Get blog info from multisite config for a better fallback
    const blogPath = getCurrentBlogPath();
    let blogName = 'XBlog';
    
    if (blogPath) {
      // Import blogs in multisiteConfig dynamically
      try {
        const { blogs } = await import('../config/multisiteConfig');
        // Find the blog config that matches the current path
        const blogConfig = Object.values(blogs).find(b => b.wpPath === blogPath);
        if (blogConfig) {
          blogName = blogConfig.name;
          console.log(`Using multisite config for blog: ${blogName}`);
        }
      } catch (e) {
        console.error('Could not import multisite config:', e);
      }
    }
    
    // Return a minimal fallback
    return {
      name: blogName,
      description: 'A WordPress Blog',
      url: siteUrl,
      home: siteUrl,
      gmt_offset: 0,
      timezone_string: '',
      site_logo: null
    };
  } catch (fallbackError) {
    // Absolute minimal fallback if everything else fails
    console.error('Even local fallback detection failed:', fallbackError);
    
    return {
      name: 'XBlog',
      description: 'A WordPress Blog',
      url: '/',
      home: '/',
      gmt_offset: 0,
      timezone_string: '',
      site_logo: null
    };
  }
};

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
  
  // Include embedded media data
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
    // Create request options
    const requestOptions: RequestInit = {
      headers: {
        'Content-Type': 'application/json'
      }
    };

    // For debugging - log the request details
    console.log('Request URL:', requestUrl);

    const response = await fetch(requestUrl, requestOptions);
    
    // Log response details for debugging
    console.log(`Posts API Response [${response.status}]:`, {
      url: requestUrl,
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
    // Create request options
    const requestOptions: RequestInit = {
      headers: {
        'Content-Type': 'application/json'
      }
    };

    // For debugging - log the request
    console.log('Fetching post by slug:', slug);
    console.log('Request URL:', requestUrl);

    const response = await fetch(requestUrl, requestOptions);
    
    // Log response details for debugging
    console.log(`Post by Slug API Response [${response.status}]:`, {
      slug,
      url: requestUrl,
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
    // Create request options
    const requestOptions: RequestInit = {
      headers: {
        'Content-Type': 'application/json'
      }
    };

    console.log('Fetching categories');
    console.log('Categories request URL:', requestUrl);

    const response = await fetch(requestUrl, requestOptions);
    
    // Log response details for debugging
    console.log(`Categories API Response [${response.status}]:`, {
      url: requestUrl,
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
    // Create request options
    const requestOptions: RequestInit = {
      headers: {
        'Content-Type': 'application/json'
      }
    };

    console.log('Fetching category by slug:', slug);
    console.log('Request URL:', requestUrl);

    const response = await fetch(requestUrl, requestOptions);
    
    // Log response details for debugging
    console.log(`Category by Slug API Response [${response.status}]:`, {
      slug,
      url: requestUrl,
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
    // Create request options
    const requestOptions: RequestInit = {
      headers: {
        'Content-Type': 'application/json'
      }
    };

    console.log('Fetching tags');
    console.log('Tags request URL:', requestUrl);

    const response = await fetch(requestUrl, requestOptions);
    
    // Log response details for debugging
    console.log(`Tags API Response [${response.status}]:`, {
      url: requestUrl,
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
    // Create request options
    const requestOptions: RequestInit = {
      headers: {
        'Content-Type': 'application/json'
      }
    };

    console.log('Fetching comments for post:', postId);
    console.log('Request URL:', requestUrl);

    const response = await fetch(requestUrl, requestOptions);
    
    console.log(`Comments API Response [${response.status}]:`, {
      postId,
      url: requestUrl,
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
    // Create request options with comment data
    const requestOptions: RequestInit = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(commentData)
    };

    console.log('Posting comment for post:', commentData.post);
    console.log('Request URL:', requestUrl);

    const response = await fetch(requestUrl, requestOptions);
    
    console.log(`Post Comment API Response [${response.status}]:`, {
      postId: commentData.post,
      url: requestUrl,
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