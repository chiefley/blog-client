import { describe, it, expect } from 'vitest';
import { parseShortcodes, parseAttributes } from '../shortcodeParser';

describe('parseAttributes', () => {
  it('should parse simple attributes', () => {
    const attrs = parseAttributes('name="value" id="123"');
    expect(attrs).toEqual({ name: 'value', id: 123 });
  });

  it('should parse single quoted attributes', () => {
    const attrs = parseAttributes("name='value' title='Test Title'");
    expect(attrs).toEqual({ name: 'value', title: 'Test Title' });
  });

  it('should parse unquoted attributes', () => {
    const attrs = parseAttributes('width=100 height=200');
    expect(attrs).toEqual({ width: 100, height: 200 });
  });

  it('should parse boolean attributes', () => {
    const attrs = parseAttributes('disabled readonly checked=true unchecked=false');
    expect(attrs).toEqual({ 
      disabled: true, 
      readonly: true, 
      checked: true,
      unchecked: false 
    });
  });

  it('should handle mixed attribute types', () => {
    const attrs = parseAttributes('url="https://example.com" width=800 responsive=yes autoplay');
    expect(attrs).toEqual({
      url: 'https://example.com',
      width: 800,
      responsive: 'yes',
      autoplay: true
    });
  });

  it('should handle attributes with special characters', () => {
    const attrs = parseAttributes('data-id="test-123" aria-label="Click me"');
    expect(attrs).toEqual({
      'data-id': 'test-123',
      'aria-label': 'Click me'
    });
  });
});

describe('parseShortcodes', () => {
  it('should parse simple self-closing shortcode', () => {
    const nodes = parseShortcodes('[youtube id="abc123" /]');
    expect(nodes).toHaveLength(1);
    expect(nodes[0]).toEqual({
      type: 'shortcode',
      name: 'youtube',
      attributes: { id: 'abc123' },
      content: [],
      raw: '[youtube id="abc123" /]'
    });
  });

  it('should parse shortcode with content', () => {
    const nodes = parseShortcodes('[box title="Info"]This is content[/box]');
    expect(nodes).toHaveLength(1);
    expect(nodes[0].type).toBe('shortcode');
    expect(nodes[0].name).toBe('box');
    expect(nodes[0].attributes).toEqual({ title: 'Info' });
    expect(nodes[0].content).toHaveLength(1);
    expect(nodes[0].content?.[0]).toEqual({
      type: 'text',
      raw: 'This is content'
    });
  });

  it('should parse nested shortcodes', () => {
    const content = '[tabs][tab title="Tab1"]Content 1[/tab][tab title="Tab2"]Content 2[/tab][/tabs]';
    const nodes = parseShortcodes(content);
    
    expect(nodes).toHaveLength(1);
    expect(nodes[0].name).toBe('tabs');
    expect(nodes[0].content).toHaveLength(2);
    
    const tab1 = nodes[0].content?.[0];
    expect(tab1 && typeof tab1 === 'object' && 'type' in tab1 && tab1.type).toBe('shortcode');
    expect(tab1 && typeof tab1 === 'object' && 'name' in tab1 && tab1.name).toBe('tab');
    expect(tab1 && typeof tab1 === 'object' && 'attributes' in tab1 && tab1.attributes).toEqual({ title: 'Tab1' });
    
    const tab2 = nodes[0].content?.[1];
    expect(tab2 && typeof tab2 === 'object' && 'type' in tab2 && tab2.type).toBe('shortcode');
    expect(tab2 && typeof tab2 === 'object' && 'name' in tab2 && tab2.name).toBe('tab');
    expect(tab2 && typeof tab2 === 'object' && 'attributes' in tab2 && tab2.attributes).toEqual({ title: 'Tab2' });
  });

  it('should handle mixed content with text and shortcodes', () => {
    const content = 'Before [button]Click[/button] Middle [divider /] After';
    const nodes = parseShortcodes(content);
    
    expect(nodes).toHaveLength(5);
    expect(nodes[0]).toEqual({ type: 'text', raw: 'Before ' });
    expect(nodes[1].type).toBe('shortcode');
    expect(nodes[1].name).toBe('button');
    expect(nodes[2]).toEqual({ type: 'text', raw: ' Middle ' });
    expect(nodes[3].type).toBe('shortcode');
    expect(nodes[3].name).toBe('divider');
    expect(nodes[4]).toEqual({ type: 'text', raw: ' After' });
  });

  it('should handle unclosed shortcodes as self-closing', () => {
    const nodes = parseShortcodes('[button url="/test"] Some text after');
    expect(nodes).toHaveLength(2);
    expect(nodes[0].type).toBe('shortcode');
    expect(nodes[0].name).toBe('button');
    expect(nodes[0].content).toEqual([]);
    expect(nodes[1]).toEqual({ type: 'text', raw: ' Some text after' });
  });

  it('should handle deeply nested shortcodes', () => {
    const content = '[outer][middle][inner]Deep content[/inner][/middle][/outer]';
    const nodes = parseShortcodes(content);
    
    expect(nodes[0].name).toBe('outer');
    expect(nodes[0].content?.[0] && typeof nodes[0].content[0] === 'object' && 'name' in nodes[0].content[0] && nodes[0].content[0].name).toBe('middle');
    const middleNode = nodes[0].content?.[0];
    expect(middleNode && typeof middleNode === 'object' && 'content' in middleNode && middleNode.content?.[0] && typeof middleNode.content[0] === 'object' && 'name' in middleNode.content[0] && middleNode.content[0].name).toBe('inner');
    const innerNode = middleNode && typeof middleNode === 'object' && 'content' in middleNode && middleNode.content?.[0];
    expect(innerNode && typeof innerNode === 'object' && 'content' in innerNode && innerNode.content?.[0]).toEqual({
      type: 'text',
      raw: 'Deep content'
    });
  });

  it('should preserve raw content for reconstruction', () => {
    const content = '[su_box title="Test" style="glass"]Box content[/su_box]';
    const nodes = parseShortcodes(content);
    
    expect(nodes[0].raw).toBe(content);
  });

  it('should handle WordPress Shortcodes Ultimate syntax', () => {
    const content = '[su_tabs][su_tab title="General"]Tab content[/su_tab][/su_tabs]';
    const nodes = parseShortcodes(content);
    
    expect(nodes[0].name).toBe('su_tabs');
    expect(nodes[0].content?.[0] && typeof nodes[0].content[0] === 'object' && 'name' in nodes[0].content[0] && nodes[0].content[0].name).toBe('su_tab');
    const tabNode = nodes[0].content?.[0];
    expect(tabNode && typeof tabNode === 'object' && 'attributes' in tabNode && tabNode.attributes?.title).toBe('General');
  });

  it('should handle empty content', () => {
    const nodes = parseShortcodes('');
    expect(nodes).toEqual([]);
  });

  it('should handle content with only text', () => {
    const nodes = parseShortcodes('Just plain text without any shortcodes');
    expect(nodes).toHaveLength(1);
    expect(nodes[0]).toEqual({
      type: 'text',
      raw: 'Just plain text without any shortcodes'
    });
  });

  it('should handle malformed shortcodes gracefully', () => {
    const nodes = parseShortcodes('[button [nested] text');
    expect(nodes.length).toBeGreaterThan(0);
    // Should not throw errors
  });

  it('should handle shortcodes with hyphens in names', () => {
    const nodes = parseShortcodes('[genetic-algorithm mutation-level="5" /]');
    expect(nodes[0].name).toBe('genetic-algorithm');
    expect(nodes[0].attributes).toEqual({ 'mutation-level': 5 });
  });
});