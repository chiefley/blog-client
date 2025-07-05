/**
 * Process and enhance native WordPress footnote HTML
 * 
 * IMPORTANT: This processor works with WordPress's pre-rendered footnote HTML.
 * WordPress (Gutenberg) sends footnotes as fully-rendered HTML with UUID-based IDs.
 * We DO NOT parse or create footnote shortcodes - we only enhance existing HTML.
 * 
 * WordPress footnote structure:
 * - Superscript: <sup data-fn="UUID"><a href="#UUID" id="UUID-link">1</a></sup>
 * - Footnote list: <li id="UUID">Content <a href="#UUID-link">↩</a></li>
 * 
 * Our enhancements:
 * 1. Remove inline onclick handlers (they conflict with React)
 * 2. Add CSS for Material-UI compatible styling
 * 3. Let React handle smooth scrolling (see PostDetail.tsx)
 */

interface ProcessedContent {
  content: string;
  hasFootnotes: boolean;
}

/**
 * Process WordPress footnote HTML to fix navigation and styling
 * @param html - The raw HTML content from WordPress REST API
 * @returns Processed HTML with onclick handlers removed and styling classes added
 */
export function processFootnotes(html: string): ProcessedContent {
  if (!html) {
    return { content: html, hasFootnotes: false };
  }

  let processedHtml = html;
  let hasFootnotes = false;

  // Common WordPress footnote patterns
  // Pattern 1: Gutenberg-style footnotes with data-fn attributes (UUID-based)
  // Example: <sup data-fn="989d7904-97bb-4eb2-a6d0-3596384d78d7">
  const gutenbergPattern = /<sup[^>]*data-fn="([a-f0-9-]+)"[^>]*>.*?<\/sup>/gi;
  
  // Pattern 2: Classic editor footnotes with id/href links
  const classicPattern = /<sup[^>]*>.*?<a[^>]*href="#fn-(\d+)"[^>]*>.*?<\/a>.*?<\/sup>/gi;
  
  // Pattern 3: Simple numbered superscripts
  const simplePattern = /<sup[^>]*id="fnref[:\-]?(\d+)"[^>]*>.*?<\/sup>/gi;

  // Check if content has footnotes
  if (gutenbergPattern.test(html) || classicPattern.test(html) || simplePattern.test(html)) {
    hasFootnotes = true;
  }

  // CRITICAL: Remove existing onclick handlers that WordPress adds
  // These conflict with React's event handling and prevent our smooth scrolling
  processedHtml = processedHtml.replace(
    /<a([^>]*)(onclick="[^"]*")([^>]*href=["']#[^"']+["'][^>]*)>/gi,
    '<a$1$3>'
  );
  
  // Also handle cases where onclick comes after href
  processedHtml = processedHtml.replace(
    /<a([^>]*href=["']#[^"']+["'][^>]*)(onclick="[^"]*")([^>]*)>/gi,
    '<a$1$3>'
  );

  // Process footnote section at the bottom
  // Look for complete footnote sections (including closing tags)
  const footnotePatterns = [
    /(<ol[^>]*class="[^"]*wp-block-footnotes[^"]*"[^>]*>[\s\S]*?<\/ol>)/gi,  // Gutenberg block
    /(<ol[^>]*class="[^"]*footnotes[^"]*"[^>]*>[\s\S]*?<\/ol>)/gi,
    /(<div[^>]*class="[^"]*footnotes[^"]*"[^>]*>[\s\S]*?<\/div>)/gi,
    /(<section[^>]*class="[^"]*footnotes[^"]*"[^>]*>[\s\S]*?<\/section>)/gi,
  ];

  // Check if we've already wrapped footnotes (to avoid double wrapping)
  if (!processedHtml.includes('footnotes-container')) {
    for (const pattern of footnotePatterns) {
      const matches = processedHtml.match(pattern);
      if (matches && matches.length > 0) {
        // Take only the first match to avoid duplicates
        const footnoteSection = matches[0];
        
        // Add processed-footnotes class
        const processedSection = footnoteSection.replace(/class="([^"]*)"/, 'class="$1 processed-footnotes"');
        
        // Replace the original section with wrapped version
        processedHtml = processedHtml.replace(footnoteSection, 
          `<div class="footnotes-container">
            <h2 class="footnotes-heading">Footnotes</h2>
            <div class="footnotes-divider"></div>
            ${processedSection}
          </div>`
        );
        
        // Break after first replacement to avoid multiple headers
        break;
      }
    }
  }

  // Add return links if they don't exist
  // Handle both numeric IDs and Gutenberg UUIDs
  processedHtml = processedHtml.replace(
    /<li[^>]*id="([a-f0-9-]+|\d+)"[^>]*>(.*?)(<\/li>)/gi,
    (match, id, content, closing) => {
      // Check if return link already exists
      if (!content.includes('↩') && !content.includes('return') && !content.includes('-link')) {
        // Add return link - for Gutenberg, the return target is the id + "-link"
        const returnId = id.includes('-') ? `${id}-link` : `fnref-${id}`;
        const returnLink = ` <a href="#${returnId}" onclick="event.preventDefault(); const target = document.querySelector('#${returnId}'); if(target) target.scrollIntoView({behavior: 'smooth', block: 'center'}); return false;" class="footnote-return" title="Return to text">↩</a>`;
        return match.replace(closing, `${returnLink}${closing}`);
      }
      return match;
    }
  );

  return {
    content: processedHtml,
    hasFootnotes
  };
}

/**
 * Extract footnotes section from HTML content
 * Useful if you want to relocate the footnotes
 */
export function extractFootnotesSection(html: string): {
  content: string;
  footnotesHtml: string | null;
} {
  // Common patterns for footnote sections
  const patterns = [
    /<ol[^>]*class="[^"]*footnotes[^"]*"[^>]*>.*?<\/ol>/is,
    /<div[^>]*class="[^"]*footnotes[^"]*"[^>]*>.*?<\/div>/is,
    /<section[^>]*class="[^"]*footnotes[^"]*"[^>]*>.*?<\/section>/is,
  ];

  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match) {
      return {
        content: html.replace(pattern, ''),
        footnotesHtml: match[0]
      };
    }
  }

  return {
    content: html,
    footnotesHtml: null
  };
}

/**
 * Add CSS for properly styled footnotes
 */
export const footnoteStyles = `
  .footnotes-container {
    margin-top: 3rem;
  }

  .footnotes-heading {
    font-size: 1.5rem;
    font-weight: 500;
    margin-bottom: 1rem;
    color: rgba(0, 0, 0, 0.87);
  }

  @media (prefers-color-scheme: dark) {
    .footnotes-heading {
      color: rgba(255, 255, 255, 0.87);
    }
  }

  .footnotes-divider {
    height: 1px;
    background-color: rgba(0, 0, 0, 0.12);
    margin-bottom: 1.5rem;
  }

  @media (prefers-color-scheme: dark) {
    .footnotes-divider {
      background-color: rgba(255, 255, 255, 0.12);
    }
  }

  .processed-footnotes {
    /* Remove top margin and border since we have the divider now */
  }

  .processed-footnotes ol {
    padding-left: 1.5rem;
  }

  .processed-footnotes li {
    margin-bottom: 0.75rem;
    font-size: 0.875rem;
    line-height: 1.6;
  }

  .footnote-return {
    text-decoration: none;
    margin-left: 0.5rem;
    opacity: 0.7;
    transition: opacity 0.2s;
  }

  .footnote-return:hover {
    opacity: 1;
  }

  sup[id^="fnref"] {
    cursor: pointer;
  }

  sup[id^="fnref"] a {
    text-decoration: none;
    padding: 0 2px;
  }

  sup[id^="fnref"] a:hover {
    text-decoration: underline;
  }

  /* Highlight target footnote */
  :target,
  .footnote-highlight {
    background-color: rgba(33, 150, 243, 0.1);
    padding: 4px;
    border-radius: 4px;
    animation: footnote-fade 2s ease-in-out;
  }

  @keyframes footnote-fade {
    0% { background-color: rgba(33, 150, 243, 0.3); }
    100% { background-color: rgba(33, 150, 243, 0.1); }
  }

  /* Gutenberg footnotes specific styling */
  .wp-block-footnotes {
    /* Remove top styling since container handles it */
    font-size: 0.875rem;
    line-height: 1.6;
  }

  .wp-block-footnotes li {
    margin-bottom: 0.75rem;
  }
`;