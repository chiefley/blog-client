// src/services/wordpressApi.ts
import { WordPressPost, Category, Comment, CommentData, SiteInfo } from '../types/interfaces';
import { getCurrentBlogPath } from '../config/multisiteConfig';
import { createAuthHeader } from '../contexts/AuthContext';

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
    if (authHeader && Object.keys(authHeader).length > 0) {
      options.headers = {
        ...options.headers,
        ...authHeader
      };
      console.log('🔐 Using authentication header for API request');
    }
  }

  return options;
};

/**
 * Check if user is authenticated (has valid auth header)
 */
const isAuthenticated = (): boolean => {
  const authHeader = createAuthHeader();
  return authHeader && Object.keys(authHeader).length > 0;
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
      const timeoutId = setTimeout(() => { controller.abort(); }, 5000); // 5-second timeout
      
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
    console.log('🔍 Making authenticated requests for published and draft posts separately');
    
    // First, get published posts
    params.append('status', 'publish');
    const publishedUrl = `${apiUrl}/posts?${params}`;
    
    try {
      const publishedResponse = await fetch(publishedUrl, requestOptions);
      if (publishedResponse.ok) {
        const publishedPosts = await publishedResponse.json();
        allPosts = [...publishedPosts];
        totalPagesCount = parseInt(publishedResponse.headers.get('X-WP-TotalPages') || '1', 10);
        console.log(`📖 Fetched ${publishedPosts.length} published posts`);
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
        console.log(`👤 Current user: ${userData.name} (ID: ${userId})${isSuperAdmin ? ' [SUPER ADMIN]' : ''}`);
        
        // Log roles for debugging
        if (userData.roles && userData.roles.length > 0) {
          console.log(`👤 User roles: ${userData.roles.join(', ')}`);
        }
      }
    } catch (e) {
      console.log('Could not get user ID for draft filtering');
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
          console.log(`📝 Fetched ${draftPosts.length} draft posts${userId ? ' (filtered by author)' : ''}`);
          
          // Update total pages if draft response has more
          const draftTotalPages = parseInt(draftResponse.headers.get('X-WP-TotalPages') || '1', 10);
          totalPagesCount = Math.max(totalPagesCount, draftTotalPages);
        } else {
          console.log('📝 Draft posts response was not an array:', draftPosts);
        }
      } else {
        console.log(`📝 Could not fetch draft posts (status: ${draftResponse.status})${userId ? ' even with author filter' : ''}`);
        
        // Try to get error details for debugging
        try {
          const errorData = await draftResponse.json();
          console.log('Draft posts error:', errorData.message || errorData.code || 'Unknown error');
          
          // If author-filtered request failed, try without author filter
          if (userId && (draftResponse.status === 403 || draftResponse.status === 401)) {
            console.log('🔄 Retrying draft fetch without author filter...');
            draftParams.delete('author');
            const retryUrl = `${apiUrl}/posts?${draftParams}`;
            const retryResponse = await fetch(retryUrl, requestOptions);
            
            if (retryResponse.ok) {
              const retryPosts = await retryResponse.json();
              if (Array.isArray(retryPosts)) {
                allPosts = [...allPosts, ...retryPosts];
                console.log(`📝 Fetched ${retryPosts.length} draft posts (without author filter)`);
              }
            } else {
              console.log(`📝 Retry also failed (status: ${retryResponse.status})`);
              
              // For superadmins, log more debugging info
              if (isSuperAdmin) {
                console.warn('⚠️ Super Admin cannot access drafts - this may be a WordPress REST API limitation');
                console.log('Debug info:', {
                  apiUrl,
                  draftUrl: retryUrl,
                  blogPath: getCurrentBlogPath(),
                  status: retryResponse.status
                });
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
  console.log('📖 Requesting only published posts');

  const requestUrl = `${apiUrl}/posts?${params}`;
  
  try {

    // For debugging - log the request details
    console.log('Request URL:', requestUrl);
    console.log('Request includes auth:', userIsAuthenticated);
    console.log('Include drafts:', includeDrafts);

    const response = await fetch(requestUrl, requestOptions);
    
    // Log response details for debugging
    console.log(`Posts API Response [${response.status}]:`, {
      url: requestUrl,
      status: response.status,
      authenticated: userIsAuthenticated,
      includeDrafts: includeDrafts,
      contentType: response.headers.get('Content-Type'),
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
        console.warn('Posts array contains invalid post objects:', firstPost);
      }
    }
    
    // Log what types of posts we received
    const draftPosts = posts.filter((post: WordPressPost) => post.status === 'draft');
    const publishedPosts = posts.filter((post: WordPressPost) => post.status === 'publish');
    const otherPosts = posts.filter((post: WordPressPost) => post.status !== 'draft' && post.status !== 'publish');
    
    console.log(`📊 Posts received: ${posts.length} total (${publishedPosts.length} published, ${draftPosts.length} drafts, ${otherPosts.length} other)`);
    
    if (draftPosts.length > 0) {
      console.log('📝 Draft posts found:', draftPosts.map(p => p.title.rendered));
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
  
  // Create request options with auth if user is authenticated
  const requestOptions = createRequestOptions(userIsAuthenticated);
  
  // WordPress REST API behavior requires explicit status parameter for drafts
  if (includeDrafts && userIsAuthenticated) {
    console.log('🔍 Searching for post in both published and draft posts');
    
    // First try to find in published posts
    params.append('status', 'publish');
    const publishedUrl = `${apiUrl}/posts?${params}`;
    
    try {
      const publishedResponse = await fetch(publishedUrl, requestOptions);
      if (publishedResponse.ok) {
        const publishedPosts = await publishedResponse.json();
        if (publishedPosts.length > 0) {
          console.log(`✅ Found published post: "${publishedPosts[0].title.rendered}"`);
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
          console.log(`📝 Found draft post: "${draftPosts[0].title.rendered}"`);
          return draftPosts[0];
        }
      } else {
        console.log(`📝 Could not fetch draft posts (status: ${draftResponse.status})`);
        
        // Try to get error details for debugging
        try {
          const errorData = await draftResponse.json();
          console.log('Draft posts error response:', errorData);
        } catch (e) {
          // Ignore if we can't parse error response
        }
      }
    } catch (error) {
      console.error('Error fetching draft post:', error);
    }
    
    console.log(`❌ Post with slug "${slug}" not found in published or drafts`);
    return null;
  }
  
  // Only search published posts (non-authenticated case)
  params.append('status', 'publish');
  console.log('📖 Searching only published posts');

  const requestUrl = `${apiUrl}/posts?${params}`;

  try {
    console.log('Fetching post by slug:', slug);
    console.log('Request URL:', requestUrl);

    const response = await fetch(requestUrl, requestOptions);
    
    console.log(`Post by Slug API Response [${response.status}]:`, {
      slug,
      url: requestUrl,
      status: response.status
    });
    
    if (!response.ok) {
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
      console.log(`✅ Found post: "${post.title.rendered}" (status: ${post.status})`);
    } else {
      console.log(`❌ Post with slug "${slug}" not found`);
    }
    
    return post;
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
    // Create request options - categories don't typically need auth but include it anyway
    const requestOptions = createRequestOptions(true);

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
    const requestOptions = createRequestOptions(true);

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
    const requestOptions = createRequestOptions(true);

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
    const requestOptions = createRequestOptions(true);

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
    // Create request options with comment data and auth
    const requestOptions: RequestInit = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...createAuthHeader() // Always include auth for posting comments
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