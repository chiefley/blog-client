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
