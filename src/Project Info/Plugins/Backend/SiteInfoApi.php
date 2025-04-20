/**
 * Get site information using multiple fallback strategies
 */
export const getSiteInfo = async (): Promise<SiteInfo> => {
  const baseUrl = import.meta.env.VITE_WP_API_BASE_URL || 'https://wpcms.thechief.com';
  const blogPath = getCurrentBlogPath();
  
  // Construct the site info URL with blog path for multisite
  let baseApiUrl = baseUrl;
  if (blogPath) {
    baseApiUrl += `/${blogPath}`;
  }
  
  // Create an array of endpoints to try in order
  const endpointsToTry = [
    // 1. Try the public endpoint first (no auth required)
    {
      url: `${baseApiUrl}/wp-json/site-info/v1/public`,
      auth: false,
      description: 'public site-info endpoint'
    },
    // 2. Try the basic endpoint with auth
    {
      url: `${baseApiUrl}/wp-json/site-info/v1/basic`,
      auth: true,
      description: 'authenticated site-info endpoint'
    },
    // 3. Try standard WordPress API for minimal data
    {
      url: `${baseApiUrl}/wp-json`,
      auth: false,
      description: 'WordPress root endpoint'
    }
  ];
  
  let lastError = null;
  
  // Try each endpoint in order
  for (const endpoint of endpointsToTry) {
    try {
      console.log(`Attempting to fetch site info from ${endpoint.description}:`, endpoint.url);
      
      // Set up request options
      const requestOptions: RequestInit = {
        headers: {
          'Content-Type': 'application/json'
        }
      };
      
      // Add auth header if needed
      if (endpoint.auth) {
        const authHeader = createAuthHeader();
        if (authHeader) {
          requestOptions.headers = {
            ...requestOptions.headers,
            ...authHeader
          };
          console.log('Using authentication for request');
        } else {
          console.log('Authentication credentials not available');
        }
      }
      
      // Make the request
      const response = await fetch(endpoint.url, requestOptions);
      
      if (!response.ok) {
        console.log(`${endpoint.description} returned ${response.status} ${response.statusText}`);
        continue; // Try next endpoint
      }
      
      const data = await response.json();
      
      // Process response based on which endpoint succeeded
      if (endpoint.url.includes('site-info')) {
        // This is our custom endpoint, return data directly
        console.log('Site info fetched successfully from custom endpoint');
        return data as SiteInfo;
      } else if (endpoint.url.endsWith('/wp-json')) {
        // This is the WordPress root endpoint, extract what we can
        console.log('Extracting site info from WordPress root endpoint');
        return {
          name: data.name || 'XBlog',
          description: data.description || 'A WordPress Blog',
          url: data.url || '/',
          home: data.home || '/',
          gmt_offset: 0,
          timezone_string: '',
          site_logo: null
        };
      }
    } catch (error) {
      console.error(`Error fetching from ${endpoint.description}:`, error);
      lastError = error;
    }
  }
  
  // If we reach here, all endpoints failed
  console.error('All site info endpoints failed', lastError);
  throw new Error('Failed to fetch site information from any available endpoint');
}