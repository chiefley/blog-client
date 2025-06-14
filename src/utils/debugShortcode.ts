// Debug utility for testing shortcode parsing
import { parseShortcodes, parseAttributes } from './shortcodeParser';

/**
 * Debug function to test shortcode parsing and display results
 */
export function debugShortcode(content: string): void {
  console.log('=== Shortcode Debug ===');
  console.log('Input:', content);
  console.log('\n--- Parsing ---');
  
  const startTime = performance.now();
  const nodes = parseShortcodes(content);
  const endTime = performance.now();
  
  console.log(`Parse time: ${(endTime - startTime).toFixed(3)}ms`);
  console.log('\n--- Output ---');
  console.log(JSON.stringify(nodes, null, 2));
  
  // Summary
  const countNodes = (nodes: any[]): { shortcodes: number; text: number } => {
    let shortcodes = 0;
    let text = 0;
    
    for (const node of nodes) {
      if (node.type === 'shortcode') {
        shortcodes++;
        if (node.content) {
          const nested = countNodes(node.content);
          shortcodes += nested.shortcodes;
          text += nested.text;
        }
      } else {
        text++;
      }
    }
    
    return { shortcodes, text };
  };
  
  const summary = countNodes(nodes);
  console.log('\n--- Summary ---');
  console.log(`Total shortcodes: ${summary.shortcodes}`);
  console.log(`Total text nodes: ${summary.text}`);
}

/**
 * Debug function to test attribute parsing
 */
export function debugAttributes(attrString: string): void {
  console.log('=== Attribute Debug ===');
  console.log('Input:', attrString);
  
  const attrs = parseAttributes(attrString);
  
  console.log('\n--- Output ---');
  console.log(JSON.stringify(attrs, null, 2));
  
  console.log('\n--- Types ---');
  for (const [key, value] of Object.entries(attrs)) {
    console.log(`${key}: ${typeof value} = ${value}`);
  }
}

// Example usage (uncomment to test):
/*
debugShortcode(`
  [su_box title="Test Box" style="glass"]
    Content here
    [su_button url="/test"]Click me[/su_button]
  [/su_box]
`);

debugAttributes('title="Test" width=100 responsive=true disabled');
*/