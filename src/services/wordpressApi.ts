// src/services/wordpressApi.ts

// Define interfaces for WordPress API responses
export interface WordPressPost {
  id: number;
  date: string;
  slug: string;
  title: {
    rendered: string;
  };
  content: {
    rendered: string;
  };
  excerpt: {
    rendered: string;
  };
  featured_media: number;
  author: number;
  categories: number[];
  tags: number[];
  _embedded?: {
    author?: Array<{
      id: number;
      name: string;
      avatar_urls?: {
        [key: string]: string;
      };
    }>;
    'wp:featuredmedia'?: Array<{
      source_url: string;
      alt_text?: string;
    }>;
    'wp:term'?: Array<Array<{
      id: number;
      name: string;
      slug: string;
      taxonomy: 'category' | 'post_tag';
    }>>;
  };
}

// Base API URL from environment variables
const API_BASE_URL = import.meta.env.VITE_WP_API_BASE_URL || 'https://wpcms.thechief.com';

// Get the blog-specific path from environment variables (if any)
const getBlogPath = (): string => {
  // Default to main blog if no specific blog is selected
  const currentBlog = window.location.pathname.split('/')[1] || '';
  
  // Map the path to the corresponding blog slug in WordPress multisite
  switch (currentBlog) {
    case 'hamradio':
      return import.meta.env.VITE_WP_BLOG_HAMRADIO || 'wa1x';
    case 'science':
      return import.meta.env.VITE_WP_BLOG_SCIENCE || 'applefinch';
    default:
      return import.meta.env.VITE_WP_BLOG_MAIN || '';
  }
};

// Construct the full API URL for the current blog
const getApiUrl = (): string => {
  const blogPath = getBlogPath();
  let apiUrl = `${API_BASE_URL}`;
  
  // Add blog path if we're in a multisite environment
  if (blogPath) {
    apiUrl += `/${blogPath}`;
  }
  
  // Add the REST API endpoint
  apiUrl += '/wp-json/wp/v2';
  return apiUrl;
};

// Create auth header for Basic Authentication
const createAuthHeader = (): { Authorization: string } | undefined => {
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

// Get posts with optional filtering
export const getPosts = async (options: {
  page?: number;
  perPage?: number;
  categoryId?: number;
  search?: string;
} = {}): Promise<{ posts: WordPressPost[]; totalPages: number }> => {
  const { page = 1, perPage = 10, categoryId, search } = options;

  const params = new URLSearchParams();
  params.append('page', page.toString());
  params.append('per_page', perPage.toString());
  params.append('_embed', 'author,wp:featuredmedia,wp:term');

  if (categoryId) {
    params.append('categories', categoryId.toString());
  }

  if (search) {
    params.append('search', search);
  }

  const apiUrl = getApiUrl();

  try {
    // Get authentication header
    const authHeader = createAuthHeader();

    // Create request options with auth header
    const requestOptions: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...(authHeader || {})
      }
    };

    const response = await fetch(`${apiUrl}/posts?${params}`, requestOptions);
    
    // Check if the request was successful
    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`);
    }
    
    const posts = await response.json();
    const totalPages = parseInt(response.headers.get('X-WP-TotalPages') || '1', 10);

    return { posts, totalPages };
  } catch (error) {
    console.error('Error fetching posts:', error);
    return { posts: [], totalPages: 0 };
  }
};

// Get a single post by slug
export const getPostBySlug = async (slug: string): Promise<WordPressPost | null> => {
  const params = new URLSearchParams();
  params.append('slug', slug);
  params.append('_embed', 'author,wp:featuredmedia,wp:term');

  const apiUrl = getApiUrl();

  try {
    // Get authentication header
    const authHeader = createAuthHeader();

    // Create request options with auth header
    const requestOptions: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...(authHeader || {})
      }
    };

    const response = await fetch(`${apiUrl}/posts?${params}`, requestOptions);
    
    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`);
    }
    
    const posts = await response.json();
    
    // The API returns an array, but we only want the first post with this slug
    return posts.length > 0 ? posts[0] : null;
  } catch (error) {
    console.error('Error fetching post by slug:', error);
    return null;
  }
};

// Get categories
export const getCategories = async (): Promise<any[]> => {
  const apiUrl = getApiUrl();

  try {
    // Get authentication header
    const authHeader = createAuthHeader();

    // Create request options with auth header
    const requestOptions: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...(authHeader || {})
      }
    };

    const response = await fetch(`${apiUrl}/categories?per_page=100`, requestOptions);
    
    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching categories:', error);
    return [];
  }
};

// Get tags
export const getTags = async (): Promise<any[]> => {
  const apiUrl = getApiUrl();

  try {
    // Get authentication header
    const authHeader = createAuthHeader();

    // Create request options with auth header
    const requestOptions: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...(authHeader || {})
      }
    };

    const response = await fetch(`${apiUrl}/tags?per_page=100`, requestOptions);
    
    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching tags:', error);
    return [];
  }
};
