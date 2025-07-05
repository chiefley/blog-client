// src/config/multisiteConfig.ts

/**
 * Configuration for WordPress multisite blogs
 * Maps between local access patterns and WordPress site paths
 */
export interface BlogConfig {
  // The path segment in the WordPress multisite (e.g., 'wa1x')
  wpPath: string;
  
  // Local URL patterns that should map to this blog
  patterns: {
    // Subdomain patterns (e.g., 'wa1x.localhost')
    subdomains: string[];
    
    // Path patterns (e.g., '/hamradio')
    paths: string[];
    
    // Keyword patterns that might appear in the URL
    keywords: string[];
  };
  
  // Display name of the blog
  name: string;
  
  // Blog description/tagline
  description?: string;
  
  // Primary theme color for the blog (optional)
  themeColor?: string;
}

/**
 * Configuration for multisite blogs
 */
export const blogs: Record<string, BlogConfig> = {
  // Ham Radio blog
  hamRadio: {
    wpPath: 'wa1x',
    patterns: {
      subdomains: ['wa1x', 'hamradio', 'radio'],
      paths: ['wa1x', 'hamradio', 'radio'],
      keywords: ['wa1x', 'hamradio', 'ham-radio', 'radio']
    },
    name: 'WA1X',
    description: 'Ham Radio Adventures and Technical Articles',
    themeColor: '#1976d2' // Blue theme
  },
  
  // Science blog
  science: {
    wpPath: 'applefinch',
    patterns: {
      subdomains: ['applefinch', 'science'],
      paths: ['applefinch', 'science', 'evolution'],
      keywords: ['applefinch', 'science', 'evolution']
    },
    name: 'The Apple and the Finch',
    description: 'Exploring Evolution, Science, and Natural History',
    themeColor: '#43a047' // Green theme
  }
  
  // Add more blogs as needed
};

/**
 * Get WordPress path (subdirectory) for the current URL
 */
export function getCurrentBlogPath(): string {
  const hostname = window.location.hostname;
  const pathname = window.location.pathname;
  const url = window.location.href.toLowerCase();
  
  // Check if this is a development environment
  const isDevelopment = process.env.NODE_ENV === 'development' || 
                        !hostname.includes('.com');
  
  // First try to match by subdomain (for local development)
  if (isDevelopment && hostname.includes('.')) {
    const subdomain = hostname.split('.')[0].toLowerCase();
    
    // Use Object.values to avoid unused variable warnings
    for (const config of Object.values(blogs)) {
      if (config.patterns.subdomains.includes(subdomain)) {
        console.log(`Matched blog "${config.name}" by subdomain "${subdomain}"`);
        return config.wpPath;
      }
    }
  }
  
  // Next, try to match by URL path
  const pathSegment = pathname.split('/')[1]?.toLowerCase() || '';
  if (pathSegment) {
    for (const config of Object.values(blogs)) {
      if (config.patterns.paths.includes(pathSegment)) {
        console.log(`Matched blog "${config.name}" by path segment "${pathSegment}"`);
        return config.wpPath;
      }
    }
  }
  
  // Finally, try to match by keywords in the URL
  for (const config of Object.values(blogs)) {
    for (const keyword of config.patterns.keywords) {
      if (url.includes(keyword.toLowerCase())) {
        console.log(`Matched blog "${config.name}" by keyword "${keyword}"`);
        return config.wpPath;
      }
    }
  }
  
  // Default to main blog (empty path)
  console.log('No specific blog matched, using main blog');
  return '';
}