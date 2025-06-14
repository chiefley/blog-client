import { describe, it, expect } from 'vitest';
import { parseShortcodes } from '../shortcodeParser';

describe('tab shortcode parsing', () => {
  it('should parse tab structure from WordPress content', () => {
    const content = `[su_tabs]
[su_tab title="Preamble" anchor="preamble"]
Content for preamble tab
[/su_tab]
[su_tab title="Morse Generator" anchor="morsegenerator"]
Content for morse generator tab
[/su_tab]
[/su_tabs]`;

    const nodes = parseShortcodes(content);
    
    expect(nodes).toHaveLength(1);
    expect(nodes[0].name).toBe('su_tabs');
    
    // Check that tabs are parsed as nested content
    const tabsContent = nodes[0].content;
    expect(tabsContent).toHaveLength(5); // text + tab + text + tab + text (whitespace)
    
    // Find the actual tab nodes
    const tabNodes = tabsContent.filter(n => n.type === 'shortcode' && n.name === 'su_tab');
    expect(tabNodes).toHaveLength(2);
    
    // Check first tab
    expect(tabNodes[0].attributes).toEqual({
      title: 'Preamble',
      anchor: 'preamble'
    });
    
    // Check second tab
    expect(tabNodes[1].attributes).toEqual({
      title: 'Morse Generator',
      anchor: 'morsegenerator'
    });
  });
  
  it('should handle tabs with complex content', () => {
    const content = `[su_tabs]
[su_tab title="Tab 1"]
<p>Paragraph in tab</p>
[su_highlight background="#ffff99"]Highlighted text[/su_highlight]
[su_button url="/test"]Click me[/su_button]
[/su_tab]
[/su_tabs]`;

    const nodes = parseShortcodes(content);
    const tabsNode = nodes[0];
    const tabContent = tabsNode.content.find(n => n.type === 'shortcode' && n.name === 'su_tab');
    
    expect(tabContent).toBeDefined();
    expect(tabContent.content.length).toBeGreaterThan(0);
    
    // Should have text and nested shortcodes
    const nestedShortcodes = tabContent.content.filter(n => n.type === 'shortcode');
    expect(nestedShortcodes.length).toBe(2); // highlight and button
  });
});