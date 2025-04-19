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
 * Fallback method to get basic site info without requiring API access
 */
const getFallbackSiteInfo = async (): Promise<SiteInfo> => {
  let blogName = 'XBlog';
  let blogDescription = 'A modern React blog with WordPress backend';
  let siteUrl = '';
  
  try {
    // Extract site URL from window location (this is safe)
    const protocol = window.location.protocol;
    const host = window.location.host;
    siteUrl = `${protocol}//${host}`;
    
    // Get blog info from multisite config first
    const blogPath = getCurrentBlogPath();
    
    if (blogPath) {
      // Import blogs in multisiteConfig dynamically
      const { blogs } = await import('../config/multisiteConfig');
      // Find the blog config that matches the current path
      const blogConfig = Object.values(blogs).find(b => b.wpPath === blogPath);
      if (blogConfig) {
        blogName = blogConfig.name;
        console.log(`Using multisite config for blog: ${blogName}`);
      }
    }
    
    // Try fetching the site's HTML directly
    try {
      const response = await fetch(siteUrl);
      if (response.ok) {
        const html = await response.text();
        
        // Extract site title from HTML
        const titleMatch = html.match(/<title>(.*?)<\/title>/i);
        if (titleMatch && titleMatch[1]) {
          // Remove " - WordPress" or similar suffix if present
          let title = titleMatch[1];
          title = title.replace(/\s+-\s+WordPress.*$/, '');
          blogName = title;
        }
        
        // Extract description meta tag
        const descMatch = html.match(/<meta name="description" content="(.*?)"/i);
        if (descMatch && descMatch[1]) {
          blogDescription = descMatch[1];
        }
      }
    } catch (e) {
      console.log('Could not fetch site HTML for fallback info:', e);
    }
  } catch (e) {
    console.error('Error in fallback site info method:', e);
  }
  
  return {
    name: blogName,
    description: blogDescription,
    url: siteUrl || window.location.origin,
    home: siteUrl || window.location.origin,
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
    
    // Add listener for offline/online events
    const handleOnline = () => {
      console.log('App is online, refreshing site info');
      fetchSiteInfo();
    };
    
    window.addEventListener('online', handleOnline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
    };
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