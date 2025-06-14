import { describe, it, expect, beforeEach } from 'vitest';
import { parseShortcodes, clearShortcodeCaches } from '../shortcodeParser';

describe('shortcode parser performance', () => {
  beforeEach(() => {
    clearShortcodeCaches();
  });

  it('should handle large content efficiently', () => {
    // Generate large content with many shortcodes
    const shortcodes = [];
    for (let i = 0; i < 100; i++) {
      shortcodes.push(`
        <p>Some text before shortcode ${i}</p>
        [su_box title="Box ${i}" style="glass"]
          Content for box ${i}
          [su_button url="/page${i}"]Button ${i}[/su_button]
        [/su_box]
        <p>Some text after shortcode ${i}</p>
      `);
    }
    const largeContent = shortcodes.join('\n');
    
    const startTime = performance.now();
    const nodes = parseShortcodes(largeContent);
    const endTime = performance.now();
    
    console.log(`Parsed ${nodes.length} nodes in ${endTime - startTime}ms`);
    
    // Should parse in reasonable time (less than 100ms for 100 shortcodes)
    expect(endTime - startTime).toBeLessThan(100);
    
    // Should find all shortcodes (including nested ones)
    const countShortcodes = (nodes: any[]): number => {
      let count = 0;
      for (const node of nodes) {
        if (node.type === 'shortcode') {
          count++;
          if (node.content) {
            count += countShortcodes(node.content);
          }
        }
      }
      return count;
    };
    
    const totalShortcodes = countShortcodes(nodes);
    expect(totalShortcodes).toBe(200); // 100 boxes + 100 buttons
  });

  it('should benefit from caching on repeated parses', () => {
    const content = '[su_box title="Test"]Content[/su_box]';
    
    // First parse (no cache)
    const start1 = performance.now();
    parseShortcodes(content);
    const time1 = performance.now() - start1;
    
    // Second parse (should use cache)
    const start2 = performance.now();
    parseShortcodes(content);
    const time2 = performance.now() - start2;
    
    console.log(`First parse: ${time1}ms, Second parse: ${time2}ms`);
    
    // Second parse should be significantly faster
    expect(time2).toBeLessThan(time1 * 0.5);
  });

  it('should handle deeply nested shortcodes efficiently', () => {
    // Generate deeply nested content
    let content = 'Deep content';
    for (let i = 0; i < 10; i++) {
      content = `[level${i}]${content}[/level${i}]`;
    }
    
    const startTime = performance.now();
    const nodes = parseShortcodes(content);
    const endTime = performance.now();
    
    console.log(`Parsed deeply nested content in ${endTime - startTime}ms`);
    
    // Should parse in reasonable time
    expect(endTime - startTime).toBeLessThan(50);
    
    // Should correctly parse all levels
    let currentNode = nodes[0];
    for (let i = 9; i >= 0; i--) {
      expect(currentNode.name).toBe(`level${i}`);
      if (i > 0) {
        currentNode = currentNode.content?.[0] as any;
      }
    }
  });

  it('should handle content with no shortcodes efficiently', () => {
    // Generate large HTML content without shortcodes
    const htmlContent = `
      <article>
        <h1>Large Article</h1>
        ${Array(100).fill('<p>Lorem ipsum dolor sit amet, consectetur adipiscing elit.</p>').join('\n')}
      </article>
    `;
    
    const startTime = performance.now();
    const nodes = parseShortcodes(htmlContent);
    const endTime = performance.now();
    
    console.log(`Parsed HTML-only content in ${endTime - startTime}ms`);
    
    // Should be very fast when no shortcodes present
    expect(endTime - startTime).toBeLessThan(10);
    expect(nodes).toHaveLength(1);
    expect(nodes[0].type).toBe('text');
  });
});