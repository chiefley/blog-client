// src/utils/shortcodeParser.ts

export interface ShortcodeNode {
  type: 'shortcode' | 'text';
  name?: string;
  attributes?: Record<string, any>;
  content?: (ShortcodeNode | string)[];
  raw?: string;
}

/**
 * Parse shortcode attributes from string
 * Handles both quoted and unquoted values
 */
export function parseAttributes(attrString: string): Record<string, any> {
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
  
  return attrs;
}

/**
 * Parse content into shortcode nodes
 * Handles nested shortcodes with proper open/close tag matching
 */
export function parseShortcodes(content: string): ShortcodeNode[] {
  const nodes: ShortcodeNode[] = [];
  
  // Regex for matching shortcodes (opening, self-closing, or closing)
  const shortcodeRegex = /\[(\/)?([\w-]+)([^\]]*?)(\/)?\]/g;
  
  let lastIndex = 0;
  let match;
  const openTags: { name: string; attributes: Record<string, any>; startIndex: number }[] = [];
  
  while ((match = shortcodeRegex.exec(content)) !== null) {
    const [fullMatch, closingSlash, tagName, attributes, selfClosing] = match;
    const matchIndex = match.index;
    
    // Add any text before this match
    if (matchIndex > lastIndex) {
      const text = content.substring(lastIndex, matchIndex);
      if (text.trim()) {
        nodes.push({ type: 'text', raw: text });
      }
    }
    
    if (closingSlash) {
      // Closing tag
      const openTagIndex = openTags.findIndex(tag => tag.name === tagName);
      if (openTagIndex !== -1) {
        // Found matching opening tag
        const openTag = openTags[openTagIndex];
        openTags.splice(openTagIndex, 1);
        
        // Get content between opening and closing tags
        const innerContent = content.substring(openTag.startIndex, matchIndex);
        const innerNodes = parseShortcodes(innerContent);
        
        nodes.push({
          type: 'shortcode',
          name: openTag.name,
          attributes: openTag.attributes,
          content: innerNodes,
          raw: content.substring(openTag.startIndex - fullMatch.length, match.index + fullMatch.length)
        });
      }
    } else if (selfClosing) {
      // Self-closing shortcode
      nodes.push({
        type: 'shortcode',
        name: tagName,
        attributes: parseAttributes(attributes),
        content: [],
        raw: fullMatch
      });
    } else {
      // Opening tag - check if it has a closing tag
      const closingTagRegex = new RegExp(`\\[\\/${tagName}\\]`, 'g');
      closingTagRegex.lastIndex = shortcodeRegex.lastIndex;
      
      if (closingTagRegex.test(content)) {
        // Has closing tag, track it
        openTags.push({
          name: tagName,
          attributes: parseAttributes(attributes),
          startIndex: shortcodeRegex.lastIndex
        });
      } else {
        // No closing tag, treat as self-closing
        nodes.push({
          type: 'shortcode',
          name: tagName,
          attributes: parseAttributes(attributes),
          content: [],
          raw: fullMatch
        });
      }
    }
    
    lastIndex = shortcodeRegex.lastIndex;
  }
  
  // Add any remaining text
  if (lastIndex < content.length) {
    const text = content.substring(lastIndex);
    if (text.trim()) {
      nodes.push({ type: 'text', raw: text });
    }
  }
  
  // Handle any unclosed tags
  for (const openTag of openTags) {
    nodes.push({
      type: 'shortcode',
      name: openTag.name,
      attributes: openTag.attributes,
      content: [],
      raw: `[${openTag.name}${Object.entries(openTag.attributes).map(([k, v]) => ` ${k}="${v}"`).join('')}]`
    });
  }
  
  return nodes;
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