import { describe, it, expect } from 'vitest';
import { parseShortcodes } from '../shortcodeParser';

describe('highlight shortcode edge cases', () => {
  it('should parse highlight shortcode as shown in WordPress', () => {
    const content = '[su_highlight background="#ffff99"]testing the highlight shortcode[/su_highlight]';
    const nodes = parseShortcodes(content);
    
    expect(nodes).toHaveLength(1);
    expect(nodes[0].type).toBe('shortcode');
    expect(nodes[0].name).toBe('su_highlight');
    expect(nodes[0].attributes).toEqual({ background: '#ffff99' });
    
    // Check content
    expect(nodes[0].content).toHaveLength(1);
    expect(nodes[0].content?.[0]).toEqual({
      type: 'text',
      raw: 'testing the highlight shortcode'
    });
  });
  
  it('should handle highlight shortcode when WordPress does not recognize it', () => {
    // This simulates the case where WordPress doesn't parse it as a shortcode
    // but sends it as raw text in the content
    const wpContent = `
      <p>Some text before</p>
      [su_highlight background="#ffff99"]testing the highlight shortcode[/su_highlight]
      <p>Some text after</p>
    `;
    
    const nodes = parseShortcodes(wpContent);
    console.log('Parsed nodes:', JSON.stringify(nodes, null, 2));
    
    // Find the highlight shortcode
    const highlightNode = nodes.find(n => n.type === 'shortcode' && n.name === 'su_highlight');
    expect(highlightNode).toBeDefined();
  });
  
  it('should handle mixed recognized and unrecognized shortcodes', () => {
    const content = `
      [su_box title="Test"]
        Box content with [su_highlight background="#ffff99"]highlighted text[/su_highlight] inside.
      [/su_box]
    `;
    
    const nodes = parseShortcodes(content);
    
    // Should find the box
    const boxNode = nodes.find(n => n.type === 'shortcode' && n.name === 'su_box');
    expect(boxNode).toBeDefined();
    
    // Should find the highlight inside the box content
    const findHighlight = (nodes: any[]): any => {
      for (const node of nodes) {
        if (node.type === 'shortcode' && node.name === 'su_highlight') {
          return node;
        }
        if (node.content) {
          const found = findHighlight(node.content);
          if (found) return found;
        }
      }
      return null;
    };
    
    const highlightNode = findHighlight(nodes);
    expect(highlightNode).toBeDefined();
    expect(highlightNode.attributes.background).toBe('#ffff99');
  });
});