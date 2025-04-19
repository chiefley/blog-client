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
  // Field from Better REST API Featured Image plugin
  featured_media_url?: string;
  // Alternative field provided by Better REST API Featured Image plugin
  better_featured_image?: {
    id: number;
    alt_text: string;
    caption: string;
    description: string;
    media_type: string;
    media_details: {
      width: number;
      height: number;
      file: string;
      sizes: {
        medium?: {
          file: string;
          width: number;
          height: number;
          mime_type: string;
          source_url: string;
        };
        thumbnail?: {
          file: string;
          width: number;
          height: number;
          mime_type: string;
          source_url: string;
        };
        medium_large?: {
          file: string;
          width: number;
          height: number;
          mime_type: string;
          source_url: string;
        };
        full?: {
          file: string;
          width: number;
          height: number;
          mime_type: string;
          source_url: string;
        };
      };
    };
    source_url: string;
  };
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

// Interface for site information from WordPress
export interface SiteInfo {
  name: string;
  description: string;
  url: string;
  home: string;
  gmt_offset: number;
  timezone_string: string;
  site_logo: number | null;
  // Additional fields from our custom endpoint
  logo_url?: string | null;
  logo_medium?: string | null;
  logo_thumbnail?: string | null;
  logo_large?: string | null;
  logo_full?: string | null;
  icon_url?: string | null;
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

// Interface for WordPress comment objects
export interface Comment {
  id: number;
  post: number;
  parent: number;
  author: number;
  author_name: string;
  author_url: string;
  author_avatar_urls?: {
    [key: string]: string;
  };
  date: string;
  content: {
    rendered: string;
  };
  status: string;
  type: string;
  replies?: Comment[]; // For hierarchical display
}

// Interface for comment submission data
export interface CommentData {
  post: number;
  parent: number;
  content: string;
  author_name: string;
  author_email: string;
  author_url?: string;
}