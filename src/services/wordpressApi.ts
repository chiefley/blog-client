// src/services/wordpressApi.ts
import { WordPressPost, Category, Comment, CommentData, SiteInfo } from '../types/interfaces';
import { getCurrentBlogPath } from '../config/multisiteConfig';
import { createAuthHeader } from '../contexts/SimpleAuthContext';

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
 * Create request options with authentication headers when available
 */
const createRequestOptions = (includeAuth = true): RequestInit => {
  const options: RequestInit = {
    headers: {
      'Content-Type': 'application/json'
    }
  };

  // Add authentication header if available and requested
  if (includeAuth) {
    const authHeader = createAuthHeader();
    
    // Double-check that we actually have a valid auth header
    // createAuthHeader now checks global state first
    if (authHeader && Object.keys(authHeader).length > 0 && 'Authorization' in authHeader) {
      options.headers = {
        ...options.headers,
        ...authHeader
      };
    }
  }

  return options;
};

/**
 * Check if user is authenticated (has valid auth header)
 */
const isAuthenticated = (): boolean => {
  // Use the function from AuthContext which checks global state
  const authHeader = createAuthHeader();
  return authHeader && Object.keys(authHeader).length > 0 && 'Authorization' in authHeader;
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
  
  
  // Create an array of endpoints to try in order
  const endpointsToTry = [
    // 1. Try the custom public endpoint first (might work with proper CORS)
    {
      url: `${baseApiUrl}/wp-json/site-info/v1/public`,
      description: 'public site-info endpoint',
      type: 'custom'
    },
    // 2. Try the standard WordPress API root for basic info
    {
      url: `${baseApiUrl}/wp-json`,
      description: 'WordPress root endpoint',
      type: 'root'
    },
    // 3. Try wp/v2 namespace which might have more info
    {
      url: `${baseApiUrl}/wp-json/wp/v2`,
      description: 'WordPress v2 API root',
      type: 'v2root'
    }
  ];
  
  // Try each endpoint in order
  for (const endpoint of endpointsToTry) {
    try {
      
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
      const timeoutId = setTimeout(() => { controller.abort(); }, 5000); // 5-second timeout
      
      try {
        requestOptions.signal = controller.signal;
        const response = await fetch(endpoint.url, requestOptions);
        clearTimeout(timeoutId);
        
        
        if (!response.ok) {
          // Try to get more error details if possible
          try {
            await response.text();
          } catch (e) {
            // Just continue if we can't get the error text
          }
          
          continue; // Try next endpoint
        }
        
        const data = await response.json();
        
        // Process response based on which endpoint succeeded
        if (endpoint.type === 'custom') {
          // This is our custom endpoint, return data directly
          return data as SiteInfo;
        } else if (endpoint.type === 'settings') {
          // This is the WordPress settings endpoint
          return {
            name: data.title || 'XBlog',
            description: data.description || 'A WordPress Blog',  // This is the tagline!
            url: data.url || '/',
            home: data.url || '/',
            gmt_offset: data.gmt_offset || 0,
            timezone_string: data.timezone_string || '',
            site_logo: null
          };
        } else if (endpoint.type === 'root' || endpoint.type === 'v2root') {
          // This is the WordPress root endpoint, extract what we can
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
  
  try {
    // Extract site URL from window location (this is safe)
    const protocol = window.location.protocol;
    const host = window.location.host;
    const siteUrl = `${protocol}//${host}`;
    
    // Get blog info from multisite config for a better fallback
    const blogPath = getCurrentBlogPath();
    let blogName = 'XBlog';
    let blogDescription = 'A modern React blog with WordPress backend';
    
    if (blogPath) {
      // Import blogs in multisiteConfig dynamically
      try {
        const { blogs } = await import('../config/multisiteConfig');
        // Find the blog config that matches the current path
        const blogConfig = Object.values(blogs).find(b => b.wpPath === blogPath);
        if (blogConfig) {
          blogName = blogConfig.name;
          blogDescription = blogConfig.description || blogDescription;
        }
      } catch (e) {
        console.error('Could not import multisite config:', e);
      }
    }
    
    // Return a minimal fallback
    return {
      name: blogName,
      description: blogDescription,
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
 * Get posts with optional filtering - simplified approach without status parameter
 */
export const getPosts = async (options: {
  page?: number;
  perPage?: number;
  categoryId?: number;
  categorySlug?: string | null;
  search?: string;
  includeDrafts?: boolean; // New option to include drafts
} = {}): Promise<{ posts: WordPressPost[]; totalPages: number }> => {
  const { page = 1, perPage = 10, categoryId, categorySlug, search, includeDrafts = false } = options;

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
      const category = categories.find((cat: Category) => cat.slug === categorySlug);
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

  // Get API URL first
  const apiUrl = getApiUrl();
  
  // Check authentication status
  const userIsAuthenticated = isAuthenticated();
  
  // Create request options with auth if user is authenticated
  const requestOptions = createRequestOptions(userIsAuthenticated);
  
  // WordPress REST API behavior: 
  // - Without status parameter: returns only published posts (even when authenticated)
  // - To get drafts: must make separate request for draft posts
  // - Multiple statuses in one request often requires special permissions
  
  let allPosts: WordPressPost[] = [];
  let totalPagesCount = 1;
  
  if (includeDrafts && userIsAuthenticated) {
    
    // First, get published posts
    params.append('status', 'publish');
    const publishedUrl = `${apiUrl}/posts?${params}`;
    
    try {
      const publishedResponse = await fetch(publishedUrl, requestOptions);
      if (publishedResponse.ok) {
        const publishedPosts = await publishedResponse.json();
        allPosts = [...publishedPosts];
        totalPagesCount = parseInt(publishedResponse.headers.get('X-WP-TotalPages') || '1', 10);
      }
    } catch (error) {
      console.error('Error fetching published posts:', error);
    }
    
    // Then try to get draft posts separately
    // First, try to get current user info to use author filter
    let userId: number | null = null;
    let isSuperAdmin = false;
    try {
      const userResponse = await fetch(`${apiUrl.replace('/posts', '/users/me')}`, requestOptions);
      if (userResponse.ok) {
        const userData = await userResponse.json();
        userId = userData.id;
        isSuperAdmin = userData.is_super_admin === true;
        
        // Log roles for debugging
        if (userData.roles && userData.roles.length > 0) {
        }
      }
    } catch (e) {
    }
    
    // Try different approaches to get draft posts
    const draftParams = new URLSearchParams();
    // Copy relevant params but not status
    ['page', 'per_page', '_embed'].forEach(key => {
      const value = params.get(key);
      if (value) draftParams.set(key, value);
    });
    
    // Set draft status
    draftParams.set('status', 'draft');
    
    // If filtering by category, keep that filter
    const categoryId = params.get('categories');
    if (categoryId) {
      draftParams.set('categories', categoryId);
    }
    
    // If we have a user ID, try to get user's own drafts first
    if (userId) {
      draftParams.set('author', userId.toString());
    }
    
    const draftUrl = `${apiUrl}/posts?${draftParams}`;
    
    try {
      const draftResponse = await fetch(draftUrl, requestOptions);
      if (draftResponse.ok) {
        const draftPosts = await draftResponse.json();
        
        // Ensure draftPosts is an array before spreading
        if (Array.isArray(draftPosts)) {
          allPosts = [...allPosts, ...draftPosts];
          
          // Update total pages if draft response has more
          const draftTotalPages = parseInt(draftResponse.headers.get('X-WP-TotalPages') || '1', 10);
          totalPagesCount = Math.max(totalPagesCount, draftTotalPages);
        } else {
        }
      } else {
        
        // Try to get error details for debugging
        try {
          await draftResponse.json();
          
          // If author-filtered request failed, try without author filter
          if (userId && (draftResponse.status === 403 || draftResponse.status === 401)) {
            draftParams.delete('author');
            const retryUrl = `${apiUrl}/posts?${draftParams}`;
            const retryResponse = await fetch(retryUrl, requestOptions);
            
            if (retryResponse.ok) {
              const retryPosts = await retryResponse.json();
              if (Array.isArray(retryPosts)) {
                allPosts = [...allPosts, ...retryPosts];
              }
            } else {
              
              // For superadmins, log more debugging info
              if (isSuperAdmin) {
              }
            }
          }
        } catch (e) {
          // Ignore if we can't parse error response
        }
      }
    } catch (error) {
      console.error('Error fetching draft posts:', error);
    }
    
    // Sort combined posts by date (newest first)
    allPosts.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    
    // Return paginated results
    const startIndex = (page - 1) * perPage;
    const endIndex = startIndex + perPage;
    const paginatedPosts = allPosts.slice(startIndex, endIndex);
    
    return { posts: paginatedPosts, totalPages: totalPagesCount };
  }
  
  // Standard request for published posts only
  params.append('status', 'publish');

  const requestUrl = `${apiUrl}/posts?${params}`;
  
  try {


    const response = await fetch(requestUrl, requestOptions);
    
    
    // Check if the request was successful
    if (!response.ok) {
      // Handle 401 Unauthorized specifically
      if (response.status === 401 && userIsAuthenticated) {
        
        // Retry without auth header
        const retryOptions = createRequestOptions(false);
        const retryResponse = await fetch(requestUrl, retryOptions);
        
        if (retryResponse.ok) {
          const responseData = await retryResponse.json();
          const totalPages = parseInt(retryResponse.headers.get('X-WP-TotalPages') || '1', 10);
          
          return { posts: responseData, totalPages };
        }
      }
      
      // Try to get more information about the error
      let errorDetails = '';
      try {
        const errorData = await response.text();
        errorDetails = errorData.substring(0, 200); // First 200 chars for brevity
        console.error('API Error Response:', errorDetails);
      } catch (e) {
        // Ignore if we can't get error details
      }
      
      throw new Error(`API request failed with status ${response.status}: ${errorDetails}`);
    }
    
    // Parse the response
    let responseData;
    try {
      responseData = await response.json();
    } catch (parseError) {
      console.error('Error parsing JSON response:', parseError);
      throw new Error('Invalid JSON response from API');
    }

    // Validate that we received an array
    if (!Array.isArray(responseData)) {
      console.error('API returned non-array response:', responseData);
      
      // Check if it's an error object
      if (responseData && typeof responseData === 'object') {
        if (responseData.code && responseData.message) {
          throw new Error(`WordPress API Error: ${responseData.message} (${responseData.code})`);
        }
        if (responseData.error) {
          throw new Error(`API Error: ${responseData.error}`);
        }
      }
      
      throw new Error('API returned unexpected response format (expected array of posts)');
    }

    const posts = responseData;
    const totalPages = parseInt(response.headers.get('X-WP-TotalPages') || '1', 10);
    
    // Validate that posts array contains valid post objects
    if (posts.length > 0) {
      const firstPost = posts[0];
      if (!firstPost.id || !firstPost.title) {
      }
    }
    
    // Log what types of posts we received
    const draftPosts = posts.filter((post: WordPressPost) => post.status === 'draft');
    
    
    if (draftPosts.length > 0) {
    }
    
    return { posts, totalPages };
  } catch (error) {
    console.error('Error fetching posts:', error);
    
    // Return empty result instead of letting the error propagate to the filter function
    return { posts: [], totalPages: 0 };
  }
};

/**
 * Get a single post by slug - simplified approach without status parameter
 */
export const getPostBySlug = async (slug: string, includeDrafts = false): Promise<WordPressPost | null> => {
  const params = new URLSearchParams();
  params.append('slug', slug);
  params.append('_embed', 'author,wp:featuredmedia,wp:term');

  // Get API URL first
  const apiUrl = getApiUrl();
  
  // Check authentication status  
  const userIsAuthenticated = isAuthenticated();
  
  // Only include auth header if we're searching for drafts AND user is authenticated
  const requestOptions = createRequestOptions(includeDrafts && userIsAuthenticated);
  
  // WordPress REST API behavior requires explicit status parameter for drafts
  if (includeDrafts && userIsAuthenticated) {
    
    // First try to find in published posts
    params.append('status', 'publish');
    const publishedUrl = `${apiUrl}/posts?${params}`;
    
    try {
      const publishedResponse = await fetch(publishedUrl, requestOptions);
      if (publishedResponse.ok) {
        const publishedPosts = await publishedResponse.json();
        if (publishedPosts.length > 0) {
          return publishedPosts[0];
        }
      }
    } catch (error) {
      console.error('Error fetching published post:', error);
    }
    
    // If not found in published, try drafts
    const draftParams = new URLSearchParams(params);
    draftParams.set('status', 'draft');
    const draftUrl = `${apiUrl}/posts?${draftParams}`;
    
    try {
      const draftResponse = await fetch(draftUrl, requestOptions);
      if (draftResponse.ok) {
        const draftPosts = await draftResponse.json();
        
        // Ensure draftPosts is an array
        if (Array.isArray(draftPosts) && draftPosts.length > 0) {
          return draftPosts[0];
        }
      } else {
        
        // Try to get error details for debugging
        try {
          await draftResponse.json();
        } catch (e) {
          // Ignore if we can't parse error response
        }
      }
    } catch (error) {
      console.error('Error fetching draft post:', error);
    }
    
    return null;
  }
  
  // Only search published posts (non-authenticated case)
  params.append('status', 'publish');

  const requestUrl = `${apiUrl}/posts?${params}`;

  try {

    const response = await fetch(requestUrl, requestOptions);
    
    
    if (!response.ok) {
      // Handle 401 Unauthorized specifically
      if (response.status === 401) {
        
        // Simple Auth plugin might be expecting auth header even for public posts
        // Try again with no auth header at all
        const retryOptions = createRequestOptions(false);
        const retryResponse = await fetch(requestUrl, retryOptions);
        
        if (retryResponse.ok) {
          const posts = await retryResponse.json();
          const post = Array.isArray(posts) && posts.length > 0 ? posts[0] : null;
          
          if (post) {
          }
          
          return post;
        } else if (retryResponse.status === 401) {
          // Still getting 401 - check the error
          let retryErrorData = '';
          try {
            retryErrorData = await retryResponse.text();
          } catch (e) {
            // Ignore
          }
          console.error('❌ Still getting 401 after retry:', retryErrorData);
          
          // Return null instead of throwing to handle gracefully
          return null;
        }
      }
      
      let errorDetails = '';
      try {
        const errorData = await response.text();
        errorDetails = errorData.substring(0, 200);
      } catch (e) {
        // Ignore if we can't get error details
      }
      throw new Error(`API request failed with status ${response.status}: ${errorDetails}`);
    }
    
    const posts = await response.json();
    
    // The API returns an array, but we only want the first post with this slug
    const post = Array.isArray(posts) && posts.length > 0 ? posts[0] : null;
    
    if (post) {
    } else {
    }
    
    return post;
  } catch (error) {
    console.error('Error fetching post by slug:', error);
    return null;
  }
};

/**
 * Get a single post by ID - useful for drafts that don't have slugs
 */
export const getPostById = async (id: number, includeDrafts = false): Promise<WordPressPost | null> => {
  const apiUrl = getApiUrl();
  
  // Check authentication status  
  const userIsAuthenticated = isAuthenticated();
  
  // Create request options with auth if user is authenticated
  const requestOptions = createRequestOptions(userIsAuthenticated);
  
  try {
    
    // WordPress REST API allows fetching by ID directly
    const requestUrl = `${apiUrl}/posts/${id}?_embed=author,wp:featuredmedia,wp:term`;
    
    const response = await fetch(requestUrl, requestOptions);
    
    
    if (!response.ok) {
      // If we get a 401/403 and we're trying to get a draft, it's likely a permissions issue
      if ((response.status === 401 || response.status === 403) && includeDrafts) {
      }
      
      let errorDetails = '';
      try {
        const errorData = await response.text();
        errorDetails = errorData.substring(0, 200);
      } catch (e) {
        // Ignore if we can't get error details
      }
      
      throw new Error(`API request failed with status ${response.status}: ${errorDetails}`);
    }
    
    const post = await response.json();
    
    if (post) {
    }
    
    return post;
  } catch (error) {
    console.error('Error fetching post by ID:', error);
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
    // Categories are public - don't include auth headers
    const requestOptions = createRequestOptions(false);


    const response = await fetch(requestUrl, requestOptions);
    
    
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
    // Categories are public - don't include auth headers
    const requestOptions = createRequestOptions(false);


    const response = await fetch(requestUrl, requestOptions);
    
    
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
    // Tags are public - don't include auth headers
    const requestOptions = createRequestOptions(false);


    const response = await fetch(requestUrl, requestOptions);
    
    
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
    // Comments are public - use the standard request options without auth
    const requestOptions = createRequestOptions(false);


    const response = await fetch(requestUrl, requestOptions);
    
    
    if (!response.ok) {
      // Handle 401 Unauthorized specifically for comments
      if (response.status === 401) {
        
        try {
          const errorText = await response.text();
          
          // Try to parse as JSON
          try {
            JSON.parse(errorText);
          } catch (e) {
            // Not JSON
          }
        } catch (e) {
        }
        
        // Comments should always be public, so just return empty array
        return [];
      }
      
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
    // Create request options with comment data and auth
    const requestOptions: RequestInit = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...createAuthHeader() // Always include auth for posting comments
      },
      body: JSON.stringify(commentData)
    };


    const response = await fetch(requestUrl, requestOptions);
    
    
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
    return newComment;
  } catch (error) {
    console.error('Error posting comment:', error);
    throw error; // Re-throw to handle in UI
  }
};