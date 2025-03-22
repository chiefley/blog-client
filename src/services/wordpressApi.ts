// src/services/wordpressApi.ts
import apiAuthService from './apiAuthService';

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

export interface Category {
  id: number;
  count: number;
  description: string;
  link: string;
  name: string;
  slug: string;
  taxonomy: string;
  parent: number;
}

export interface Tag {
  id: number;
  count: number;
  name: string;
  slug: string;
}

// Base API URL for your WordPress site
const API_BASE_URL = 'https://wpcms.thechief.com';
const WP_API_PATH = '/wp-json/wp/v2';

// Helper function to build API URL for a specific site/blog
const getSiteApiUrl = (siteSlug?: string): string => {
  if (siteSlug) {
    return `${API_BASE_URL}/${siteSlug}${WP_API_PATH}`;
  }
  return `${API_BASE_URL}${WP_API_PATH}`;
};

// Helper function to handle API errors
const handleApiError = (error: any, message: string): never => {
  console.error(`${message}:`, error);
  throw new Error(`${message}: ${error.message || 'Unknown error'}`);
};

/**
 * Get posts with optional filtering
 */
export const getPosts = async (options: {
  page?: number;
  perPage?: number;
  categoryId?: number;
  tagId?: number;
  search?: string;
  slug?: string;
  siteSlug?: string; // For multisite support - e.g., 'wa1x' or 'applefinch'
} = {}): Promise<{ posts: WordPressPost[]; totalPages: number }> => {
  const { page = 1, perPage = 10, categoryId, tagId, search, slug, siteSlug } = options;

  const params = new URLSearchParams();
  params.append('page', page.toString());
  params.append('per_page', perPage.toString());
  params.append('_embed', 'author,wp:featuredmedia,wp:term');

  if (categoryId) {
    params.append('categories', categoryId.toString());
  }

  if (tagId) {
    params.append('tags', tagId.toString());
  }

  if (search) {
    params.append('search', search);
  }

  if (slug) {
    params.append('slug', slug);
  }

  const apiUrl = getSiteApiUrl(siteSlug);
  const url = `${apiUrl}/posts?${params}`;

  try {
    // Try to make an authenticated request
    const headers = apiAuthService.getAuthHeaders();
    
    const response = await fetch(url, { headers });
    
    if (!response.ok) {
      // If auth fails, fall back to public access
      if (response.status === 401) {
        console.warn('Using public API access - authentication failed');
        const publicResponse = await fetch(url);
        
        if (!publicResponse.ok) {
          throw new Error(`API error: ${publicResponse.status}`);
        }
        
        const posts = await publicResponse.json();
        const totalPages = parseInt(publicResponse.headers.get('X-WP-TotalPages') || '1', 10);
        return { posts, totalPages };
      }
      
      throw new Error(`API error: ${response.status}`);
    }

    const posts = await response.json();
    const totalPages = parseInt(response.headers.get('X-WP-TotalPages') || '1', 10);

    return { posts, totalPages };
  } catch (error) {
    return handleApiError(error, 'Error fetching posts');
  }
};

/**
 * Get a single post by slug
 */
export const getPostBySlug = async (slug: string, siteSlug?: string): Promise<WordPressPost | null> => {
  try {
    const { posts } = await getPosts({ slug, perPage: 1, siteSlug });
    return posts.length > 0 ? posts[0] : null;
  } catch (error) {
    return handleApiError(error, `Error fetching post with slug: ${slug}`);
  }
};

/**
 * Get categories with optional filtering
 */
export const getCategories = async (options: {
  perPage?: number;
  siteSlug?: string;
} = {}): Promise<Category[]> => {
  const { perPage = 100, siteSlug } = options;

  const params = new URLSearchParams();
  params.append('per_page', perPage.toString());

  const apiUrl = getSiteApiUrl(siteSlug);
  const url = `${apiUrl}/categories?${params}`;

  try {
    // Try to make an authenticated request
    const headers = apiAuthService.getAuthHeaders();
    
    const response = await fetch(url, { headers });
    
    if (!response.ok) {
      // If auth fails, fall back to public access
      if (response.status === 401) {
        console.warn('Using public API access for categories - authentication failed');
        const publicResponse = await fetch(url);
        
        if (!publicResponse.ok) {
          throw new Error(`API error: ${publicResponse.status}`);
        }
        
        return await publicResponse.json();
      }
      
      throw new Error(`API error: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    return handleApiError(error, 'Error fetching categories');
  }
};

/**
 * Get tags with optional filtering
 */
export const getTags = async (options: {
  perPage?: number;
  siteSlug?: string;
} = {}): Promise<Tag[]> => {
  const { perPage = 100, siteSlug } = options;

  const params = new URLSearchParams();
  params.append('per_page', perPage.toString());

  const apiUrl = getSiteApiUrl(siteSlug);
  const url = `${apiUrl}/tags?${params}`;

  try {
    // Try to make an authenticated request
    const headers = apiAuthService.getAuthHeaders();
    
    const response = await fetch(url, { headers });
    
    if (!response.ok) {
      // If auth fails, fall back to public access
      if (response.status === 401) {
        console.warn('Using public API access for tags - authentication failed');
        const publicResponse = await fetch(url);
        
        if (!publicResponse.ok) {
          throw new Error(`API error: ${publicResponse.status}`);
        }
        
        return await publicResponse.json();
      }
      
      throw new Error(`API error: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    return handleApiError(error, 'Error fetching tags');
  }
};

// Export default service object with all functions
export default {
  getPosts,
  getPostBySlug,
  getCategories,
  getTags
};
