// Interface for WordPress post objects
export interface WordPressPost {
  id: number;
  title: {
    rendered: string;
  };
  excerpt: {
    rendered: string;
  };
  content: {
    rendered: string;
    protected: boolean;
  };
  date: string;
  // New field added by Better REST API Featured Image plugin
  featured_media_url?: string;
  _embedded?: {
    author?: Array<{
      name?: string;
      avatar_urls?: {
        [key: string]: string;
      };
    }>;
    'wp:featuredmedia'?: Array<{
      source_url?: string;
      media_details?: {
        sizes?: {
          medium?: {
            source_url?: string;
          };
        };
      };
    }>;
    // Add wp:term for categories and tags
    'wp:term'?: Array<Array<Category | Tag>>;
  };
  link: string;
  slug: string;
  featured_media: number;
  author: number;
  categories: number[];
  tags: number[];
  comment_count?: number; // Add comment count property
}

// For backward compatibility with existing components
export type Post = WordPressPost;

// Interface for PostList component props
export interface PostListProps {
  posts: WordPressPost[];
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

// Interface for PostCard component props
export interface PostCardProps {
  post: WordPressPost;
}

// Interface for category objects
export interface Category {
  id: number;
  name: string;
  count: number;
  slug: string;
  parent: number;
  taxonomy?: string; // Added taxonomy property
}

// Interface for tag objects
export interface Tag {
  id: number;
  name: string;
  count: number;
  slug: string;
  taxonomy?: string; // Added taxonomy property
  parent?: number;   // Some tags might have a parent property
}