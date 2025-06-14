// src/utils/shortcodeParser.ts

export interface ShortcodeNode {
  type: 'shortcode' | 'text';
  name?: string;
  attributes?: Record<string, any>;
  content?: (ShortcodeNode | string)[];
  raw?: string;
}

// Cache for parsed attributes to avoid re-parsing identical attribute strings
const attributeCache = new Map<string, Record<string, any>>();

/**
 * Parse shortcode attributes from string
 * Handles both quoted and unquoted values
 */
export function parseAttributes(attrString: string): Record<string, any> {
  // Check cache first
  const cached = attributeCache.get(attrString);
  if (cached) {
    return cached;
  }
  
  const attrs: Record<string, any> = {};
  
  // Match various attribute patterns
  // name="value" or name='value' or name=value or just name (boolean true)
  const attrRegex = /(\w[\w-]*)(?:=(?:"([^"]*)"|'([^']*)'|([^\s\]]+)))?/g;
  let match;
  
  while ((match = attrRegex.exec(attrString)) !== null) {
    const [, name, doubleQuoted, singleQuoted, unquoted] = match;
    
    if (doubleQuoted !== undefined || singleQuoted !== undefined || unquoted !== undefined) {
      const value = doubleQuoted || singleQuoted || unquoted;
      
      // Convert string values to appropriate types
      if (value === 'true') {
        attrs[name] = true;
      } else if (value === 'false') {
        attrs[name] = false;
      } else if (!isNaN(Number(value)) && value !== '') {
        attrs[name] = Number(value);
      } else {
        attrs[name] = value;
      }
    } else {
      // Attribute without value is treated as boolean true
      attrs[name] = true;
    }
  }
  
  // Cache the result (limit cache size to prevent memory issues)
  if (attributeCache.size > 1000) {
    attributeCache.clear();
  }
  attributeCache.set(attrString, attrs);
  
  return attrs;
}

// Cache for small content strings to avoid re-parsing
const contentCache = new Map<string, ShortcodeNode[]>();

/**
 * Parse content into shortcode nodes using an optimized algorithm
 * that properly handles nested shortcodes
 */
export function parseShortcodes(content: string): ShortcodeNode[] {
  // Return empty array for empty content
  if (!content) {
    return [];
  }
  
  // Check cache for small content (avoid caching large content)
  if (content.length < 1000) {
    const cached = contentCache.get(content);
    if (cached) {
      return cached;
    }
  }
  
  const nodes: ShortcodeNode[] = [];
  
  // First, find all shortcode matches with their positions
  const shortcodeRegex = /\[(\/)?([\w-]+)([^\]]*?)(\/)?\]/g;
  const matches: Array<{
    fullMatch: string;
    isClosing: boolean;
    isSelfClosing: boolean;
    tagName: string;
    attributes: string;
    startPos: number;
    endPos: number;
  }> = [];
  
  let match;
  while ((match = shortcodeRegex.exec(content)) !== null) {
    matches.push({
      fullMatch: match[0],
      isClosing: !!match[1],
      isSelfClosing: !!match[4],
      tagName: match[2],
      attributes: match[3] || '',
      startPos: match.index,
      endPos: match.index + match[0].length
    });
  }
  
  // If no matches, return the entire content as text
  if (matches.length === 0) {
    if (content) {
      nodes.push({ type: 'text', raw: content });
    }
    return nodes;
  }
  
  // Process matches to build the tree structure
  let currentPos = 0;
  let i = 0;
  
  while (i < matches.length) {
    const match = matches[i];
    
    // Add any text before this match
    if (match.startPos > currentPos) {
      const text = content.substring(currentPos, match.startPos);
      if (text) {
        nodes.push({ type: 'text', raw: text });
      }
    }
    
    if (match.isSelfClosing) {
      // Self-closing shortcode
      nodes.push({
        type: 'shortcode',
        name: match.tagName,
        attributes: parseAttributes(match.attributes),
        content: [],
        raw: match.fullMatch
      });
      currentPos = match.endPos;
      i++;
    } else if (!match.isClosing) {
      // Opening tag - find its matching closing tag
      const closingIndex = findMatchingClosingTag(matches, i);
      
      if (closingIndex === -1) {
        // No matching closing tag, treat as self-closing
        nodes.push({
          type: 'shortcode',
          name: match.tagName,
          attributes: parseAttributes(match.attributes),
          content: [],
          raw: match.fullMatch
        });
        currentPos = match.endPos;
        i++;
      } else {
        // Found matching closing tag
        const closingMatch = matches[closingIndex];
        const innerContent = content.substring(match.endPos, closingMatch.startPos);
        const innerNodes = parseShortcodes(innerContent);
        
        nodes.push({
          type: 'shortcode',
          name: match.tagName,
          attributes: parseAttributes(match.attributes),
          content: innerNodes,
          raw: content.substring(match.startPos, closingMatch.endPos)
        });
        
        currentPos = closingMatch.endPos;
        // Skip all matches up to and including the closing tag
        i = closingIndex + 1;
      }
    } else {
      // Orphaned closing tag - skip it
      currentPos = match.endPos;
      i++;
    }
  }
  
  // Add any remaining text
  if (currentPos < content.length) {
    const text = content.substring(currentPos);
    if (text) {
      nodes.push({ type: 'text', raw: text });
    }
  }
  
  // Cache small content results
  if (content.length < 1000) {
    if (contentCache.size > 100) {
      contentCache.clear();
    }
    contentCache.set(content, nodes);
  }
  
  return nodes;
}

/**
 * Find the matching closing tag for an opening tag
 * Handles nested tags of the same type
 */
function findMatchingClosingTag(
  matches: Array<{ isClosing: boolean; tagName: string; isSelfClosing: boolean }>,
  openIndex: number
): number {
  const openTag = matches[openIndex];
  let depth = 1;
  
  for (let i = openIndex + 1; i < matches.length; i++) {
    const match = matches[i];
    
    if (match.tagName === openTag.tagName) {
      if (match.isClosing) {
        depth--;
        if (depth === 0) {
          return i;
        }
      } else if (!match.isSelfClosing) {
        depth++;
      }
    }
  }
  
  return -1;
}

/**
 * Clear all caches (useful for testing or memory management)
 */
export function clearShortcodeCaches(): void {
  attributeCache.clear();
  contentCache.clear();
}

/**
 * Convert camelCase to kebab-case
 */
export function camelToKebab(str: string): string {
  return str.replace(/([a-z0-9]|(?=[A-Z]))([A-Z])/g, '$1-$2').toLowerCase();
}

/**
 * Convert kebab-case to camelCase
 */
export function kebabToCamel(str: string): string {
  return str.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
}