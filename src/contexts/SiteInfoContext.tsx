import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import { getSiteInfo } from '../services/wordpressApi';
import { SiteInfo } from '../types/interfaces';
import { getCurrentBlogPath } from '../config/multisiteConfig';

// Default values
const defaultSiteInfo: SiteInfo = {
  name: 'XBlog',
  description: 'A modern React blog with WordPress backend',
  url: '/',
  home: '/',
  gmt_offset: 0,
  timezone_string: '',
  site_logo: null
};

/**
 * Fallback method to get basic site info from available public endpoints
 */
const getFallbackSiteInfo = async (): Promise<SiteInfo> => {
  let blogName = 'Blog';
  let blogDescription = 'A WordPress Blog';
  let siteUrl = '';
  
  // Try to get blog info from multisite config first (this doesn't require API access)
  try {
    const blogPath = getCurrentBlogPath();
    
    // Use multisite config to get a meaningful name if possible
    if (blogPath) {
      // Import blogs in multisiteConfig dynamically
      const { blogs } = await import('../config/multisiteConfig');
      // Find the blog config that matches the current path
      const blogConfig = Object.values(blogs).find(b => b.wpPath === blogPath);
      if (blogConfig) {
        blogName = blogConfig.name;
        // If there's a theme color, we might be able to use as a signal we got the right blog
        if (blogConfig.themeColor) {
          console.log(`Using multisite config for blog: ${blogName}`);
        }
      }
    }
    
    // Extract site URL from window location (this is safe)
    const protocol = window.location.protocol;
    const host = window.location.host;
    siteUrl = `${protocol}//${host}`;
    
  } catch (e) {
    console.error('Error using multisite config fallback:', e);
  }
  
  // Try to fetch the site HTML directly - this doesn't need authentication
  try {
    // Only try this if we have a URL from the window location
    if (siteUrl) {
      // Use fetch without authentication
      const response = await fetch(siteUrl);
      if (response.ok) {
        const html = await response.text();
        
        // Simple regex to extract site title
        const titleMatch = html.match(/<title>(.*?)<\/title>/i);
        if (titleMatch && titleMatch[1]) {
          // Remove " - WordPress" or similar suffix if present
          let title = titleMatch[1];
          title = title.replace(/\s+-\s+WordPress.*$/, '');
          blogName = title;
        }
        
        // Try to extract description
        const descMatch = html.match(/<meta name="description" content="(.*?)"/i);
        if (descMatch && descMatch[1]) {
          blogDescription = descMatch[1];
        }
      }
    }
  } catch (e) {
    console.error('Error fetching site HTML for fallback:', e);
  }
  
  // Last resort - use bare minimum info, but at least it's something
  return {
    name: blogName,
    description: blogDescription,
    url: siteUrl,
    home: siteUrl,
    gmt_offset: 0,
    timezone_string: '',
    site_logo: null
  };
};

// Create the context
interface SiteInfoContextType {
  siteInfo: SiteInfo;
  loading: boolean;
  error: string | null;
  refreshSiteInfo: () => Promise<void>;
}

const SiteInfoContext = createContext<SiteInfoContextType>({
  siteInfo: defaultSiteInfo,
  loading: false,
  error: null,
  refreshSiteInfo: async () => {}
});

// Provider component
interface SiteInfoProviderProps {
  children: ReactNode;
}

export const SiteInfoProvider: React.FC<SiteInfoProviderProps> = ({ children }) => {
  const [siteInfo, setSiteInfo] = useState<SiteInfo>(defaultSiteInfo);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSiteInfo = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Try to get site info from WordPress API
      const data = await getSiteInfo();
      setSiteInfo(data);
    } catch (err) {
      console.error('Failed to fetch site info from API:', err);
      
      try {
        // Try fallback method if API fails
        console.log('Trying fallback site info method...');
        const fallbackData = await getFallbackSiteInfo();
        setSiteInfo(fallbackData);
      } catch (fallbackErr) {
        console.error('Fallback site info method also failed:', fallbackErr);
        setError('Failed to load site information');
        // Keep the default values in case of error
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSiteInfo();
  }, []);

  // Function to manually refresh the site info
  const refreshSiteInfo = async () => {
    await fetchSiteInfo();
  };

  return (
    <SiteInfoContext.Provider value={{ siteInfo, loading, error, refreshSiteInfo }}>
      {children}
    </SiteInfoContext.Provider>
  );
};

// Custom hook for easy context usage
export const useSiteInfo = () => useContext(SiteInfoContext);

export default SiteInfoContext;