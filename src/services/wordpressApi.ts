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
 
// Base API URL - you'll need to update this with your WordPress.com site URL 
const API_BASE_URL = 'https://yourblog.wordpress.com/wp-json/wp/v2'; 
 
// Get posts with optional filtering 
export const getPosts = async (options: { 
  page?: number; 
  perPage?: number; 
  categoryId?: number; 
  search?: string; 
} = {}): Promise<{ posts: WordPressPost[]; totalPages: number }> =
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
 
  try { 
    const response = await fetch(`${API_BASE_URL}/posts?${params}`); 
    const posts = await response.json(); 
 
    return { posts, totalPages }; 
  } catch (error) { 
    console.error('Error fetching posts:', error); 
    return { posts: [], totalPages: 0 }; 
  } 
}; 
