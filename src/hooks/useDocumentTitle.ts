import { useEffect } from 'react';
import { useSiteInfo } from '../contexts/SiteInfoContext';

/**
 * Custom hook to manage document title
 * Updates the browser tab title based on page content and site info
 */
export function useDocumentTitle(pageTitle?: string) {
  const { siteInfo } = useSiteInfo();
  
  useEffect(() => {
    // Build the title
    let title = siteInfo.name || 'XBlog';
    
    if (pageTitle) {
      // Format: "Page Title | Site Name"
      title = `${pageTitle} | ${title}`;
    } else if (siteInfo.description) {
      // For home page, include description
      title = `${title} - ${siteInfo.description}`;
    }
    
    // Update document title
    document.title = title;
    
    // Cleanup function to restore title when component unmounts
    return () => {
      document.title = siteInfo.name || 'XBlog';
    };
  }, [pageTitle, siteInfo.name, siteInfo.description]);
}