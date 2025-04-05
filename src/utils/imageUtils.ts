// src/utils/imageUtils.ts

/**
 * Checks if a URL is already an Optimole URL
 * @param url The image URL to check
 * @returns boolean
 */
export const isOptimoleUrl = (url: string | undefined): boolean => {
  if (!url) return false;
  return (
    url.includes('wp.optimole.com') || 
    url.includes('i.optimole.com')
  );
};

/**
 * Add resize parameters to an Optimole URL
 * @param url Original Optimole URL
 * @param width Desired width
 * @param height Desired height (optional)
 * @param quality Image quality (1-100, default: 75)
 * @returns Formatted Optimole URL with parameters
 */
export const getOptimizedImageUrl = (
  url: string | undefined, 
  width: number, 
  height?: number,
  quality: number = 75
): string => {
  if (!url) return '';
  
  // If it's not an Optimole URL, return the original URL
  if (!isOptimoleUrl(url)) {
    return url;
  }
  
  // Start building query parameters
  let params = `w=${width}&q=${quality}`;
  
  // Add height if provided
  if (height) {
    params += `&h=${height}`;
  }
  
  // Check if URL already has query parameters
  const hasParams = url.includes('?');
  
  // Add parameters to URL
  return `${url}${hasParams ? '&' : '?'}${params}`;
};

/**
 * Get responsive size for an image based on screen size
 * @param url Original Optimole URL
 * @param options Configuration options
 * @returns Formatted URL with responsive sizing
 */
export const getResponsiveImageUrl = (
  url: string | undefined,
  options: {
    mobile?: { width: number; height?: number };
    tablet?: { width: number; height?: number };
    desktop?: { width: number; height?: number };
    quality?: number;
  } = {}
): string => {
  if (!url || !isOptimoleUrl(url)) return url || '';
  
  const { 
    mobile = { width: 480 },
    tablet = { width: 768 },
    desktop = { width: 1200 },
    quality = 75
  } = options;
  
  // Build the responsive URL pattern
  let responsiveUrl = url;
  const hasParams = url.includes('?');
  const separator = hasParams ? '&' : '?';
  
  // Add responsive parameters
  responsiveUrl += `${separator}w=${mobile.width},${tablet.width},${desktop.width}`;
  
  // Add heights if provided
  if (mobile.height || tablet.height || desktop.height) {
    responsiveUrl += `&h=${mobile.height || ''},${tablet.height || ''},${desktop.height || ''}`;
  }
  
  // Add quality parameter
  responsiveUrl += `&q=${quality}`;
  
  return responsiveUrl;
};