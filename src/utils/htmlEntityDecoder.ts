/**
 * Decode HTML entities in content before parsing shortcodes
 * 
 * WordPress REST API returns content with HTML entities encoded.
 * This decoder handles the most common entities that appear in shortcode attributes.
 */

/**
 * Decode common HTML entities that interfere with shortcode parsing
 * @param content - HTML content with encoded entities
 * @returns Content with decoded entities
 */
export function decodeHtmlEntities(content: string): string {
  if (!content) return content;
  
  // Create a mapping of common HTML entities to their decoded values
  const entities: Record<string, string> = {
    '&quot;': '"',
    '&#34;': '"',
    '&#x22;': '"',
    '&apos;': "'",
    '&#39;': "'",
    '&#x27;': "'",
    '&amp;': '&',
    '&#38;': '&',
    '&#x26;': '&',
    '&lt;': '<',
    '&#60;': '<',
    '&#x3C;': '<',
    '&gt;': '>',
    '&#62;': '>',
    '&#x3E;': '>',
    '&nbsp;': ' ',
    '&#160;': ' ',
    '&#xA0;': ' ',
    // Smart quotes (curly quotes) used by WordPress
    '&#8220;': '"', // Left double quotation mark
    '&#8221;': '"', // Right double quotation mark
    '&ldquo;': '"', // Left double quotation mark
    '&rdquo;': '"', // Right double quotation mark
    '&#8216;': "'", // Left single quotation mark
    '&#8217;': "'", // Right single quotation mark
    '&lsquo;': "'", // Left single quotation mark
    '&rsquo;': "'", // Right single quotation mark
    '&#8243;': '"', // Double prime (used as right double quote)
    '&#8242;': "'", // Single prime (used as right single quote)
  };
  
  // Replace entities in the content
  let decodedContent = content;
  
  // Use a regex to find and replace all entities
  Object.entries(entities).forEach(([entity, char]) => {
    // Create a global regex for each entity
    const regex = new RegExp(entity, 'gi');
    decodedContent = decodedContent.replace(regex, char);
  });
  
  return decodedContent;
}

/**
 * Selectively decode HTML entities only within shortcode tags
 * This is safer as it doesn't affect the rest of the HTML content
 * @param content - HTML content with shortcodes
 * @returns Content with decoded entities in shortcodes only
 */
export function decodeShortcodeEntities(content: string): string {
  if (!content) return content;
  
  // First, handle escaped quotes and slashes that might come from JSON encoding
  const processedContent = content
    .replace(/\\"/g, '"')
    .replace(/\\\//g, '/');
  
  // Match shortcode patterns and decode entities within them
  return processedContent.replace(
    /\[([^\]]+)\]/g,
    (match) => {
      // Decode entities within the shortcode tag
      return decodeHtmlEntities(match);
    }
  );
}

/**
 * Check if content contains encoded entities that might affect shortcode parsing
 * @param content - HTML content to check
 * @returns True if encoded entities are found in shortcode-like patterns
 */
export function hasEncodedShortcodes(content: string): boolean {
  // Check for common patterns where entities appear in shortcodes
  const patterns = [
    /\[\w+[^>\]]*&quot;[^>\]]*\]/,  // Shortcode with &quot;
    /\[\w+[^>\]]*&#34;[^>\]]*\]/,   // Shortcode with &#34;
    /\[\w+[^>\]]*&apos;[^>\]]*\]/,  // Shortcode with &apos;
    /\[\w+[^>\]]*&#39;[^>\]]*\]/,   // Shortcode with &#39;
    /\[\w+[^>\]]*&amp;[^>\]]*\]/,   // Shortcode with &amp;
  ];
  
  return patterns.some(pattern => pattern.test(content));
}