import { describe, it, expect } from 'vitest';
import { decodeHtmlEntities, decodeShortcodeEntities, hasEncodedShortcodes } from '../htmlEntityDecoder';

describe('decodeHtmlEntities', () => {
  it('should decode common HTML entities', () => {
    expect(decodeHtmlEntities('&quot;Hello&quot;')).toBe('"Hello"');
    expect(decodeHtmlEntities('&apos;World&apos;')).toBe("'World'");
    expect(decodeHtmlEntities('&amp; &lt; &gt;')).toBe('& < >');
    expect(decodeHtmlEntities('Test&nbsp;Space')).toBe('Test Space');
  });

  it('should decode numeric entities', () => {
    expect(decodeHtmlEntities('&#34;Quote&#34;')).toBe('"Quote"');
    expect(decodeHtmlEntities('&#39;Apostrophe&#39;')).toBe("'Apostrophe'");
    expect(decodeHtmlEntities('&#38; &#60; &#62;')).toBe('& < >');
  });

  it('should decode hex entities', () => {
    expect(decodeHtmlEntities('&#x22;Hex Quote&#x22;')).toBe('"Hex Quote"');
    expect(decodeHtmlEntities('&#x27;Hex Apostrophe&#x27;')).toBe("'Hex Apostrophe'");
    expect(decodeHtmlEntities('&#x26; &#x3C; &#x3E;')).toBe('& < >');
  });

  it('should handle mixed case entities', () => {
    expect(decodeHtmlEntities('&QUOT;UPPER&QUOT;')).toBe('"UPPER"');
    expect(decodeHtmlEntities('&Amp;Mixed&AMP;')).toBe('&Mixed&');
  });

  it('should handle empty or null content', () => {
    expect(decodeHtmlEntities('')).toBe('');
    expect(decodeHtmlEntities(null as any)).toBe(null);
    expect(decodeHtmlEntities(undefined as any)).toBe(undefined);
  });
});

describe('decodeShortcodeEntities', () => {
  it('should decode entities only within shortcode tags', () => {
    const input = '<p>Regular &quot;text&quot;</p>[su_box title=&quot;Test&quot;]Content[/su_box]';
    const expected = '<p>Regular &quot;text&quot;</p>[su_box title="Test"]Content[/su_box]';
    expect(decodeShortcodeEntities(input)).toBe(expected);
  });

  it('should handle multiple shortcodes', () => {
    const input = '[box title=&quot;One&quot;][/box] Text [button url=&apos;/test&apos;]Click[/button]';
    const expected = '[box title="One"][/box] Text [button url=\'/test\']Click[/button]';
    expect(decodeShortcodeEntities(input)).toBe(expected);
  });

  it('should decode self-closing shortcodes', () => {
    const input = '[divider color=&quot;red&quot; /]';
    const expected = '[divider color="red" /]';
    expect(decodeShortcodeEntities(input)).toBe(expected);
  });

  it('should handle nested entities in attributes', () => {
    const input = '[su_box title=&quot;Test &amp; Demo&quot; style=&apos;glass&apos;]Content[/su_box]';
    const expected = '[su_box title="Test & Demo" style=\'glass\']Content[/su_box]';
    expect(decodeShortcodeEntities(input)).toBe(expected);
  });

  it('should not affect content outside shortcodes', () => {
    const input = 'HTML: &lt;div&gt; Before [test attr=&quot;value&quot;] After &amp; more';
    const expected = 'HTML: &lt;div&gt; Before [test attr="value"] After &amp; more';
    expect(decodeShortcodeEntities(input)).toBe(expected);
  });
});

describe('hasEncodedShortcodes', () => {
  it('should detect encoded quotes in shortcodes', () => {
    expect(hasEncodedShortcodes('[box title=&quot;Test&quot;]')).toBe(true);
    expect(hasEncodedShortcodes('[box title=&#34;Test&#34;]')).toBe(true);
    expect(hasEncodedShortcodes('[box title=&apos;Test&apos;]')).toBe(true);
    expect(hasEncodedShortcodes('[box title=&#39;Test&#39;]')).toBe(true);
  });

  it('should detect encoded ampersands in shortcodes', () => {
    expect(hasEncodedShortcodes('[link url="test&amp;demo"]')).toBe(true);
  });

  it('should not detect regular shortcodes', () => {
    expect(hasEncodedShortcodes('[box title="Test"]')).toBe(false);
    expect(hasEncodedShortcodes('[box title=\'Test\']')).toBe(false);
    expect(hasEncodedShortcodes('Regular text without shortcodes')).toBe(false);
  });

  it('should not be confused by entities outside shortcodes', () => {
    expect(hasEncodedShortcodes('Text &quot;quoted&quot; [box title="clean"]')).toBe(false);
    expect(hasEncodedShortcodes('&amp; [normal attr=value]')).toBe(false);
  });
});

describe('WordPress content examples', () => {
  it('should handle real WordPress shortcode output', () => {
    const wpContent = `
      <p>Here's a box:</p>
      [su_box title=&quot;Important Note&quot; style=&quot;glass&quot; box_color=&quot;#333333&quot; radius=&quot;5&quot;]
        This is the content inside the box.
      [/su_box]
      <p>And here's a button:</p>
      [su_button url=&apos;/contact&apos; target=&quot;self&quot; style=&quot;flat&quot;]Contact Us[/su_button]
    `;
    
    const decoded = decodeShortcodeEntities(wpContent);
    
    expect(decoded).toContain('[su_box title="Important Note" style="glass" box_color="#333333" radius="5"]');
    expect(decoded).toContain('[su_button url=\'/contact\' target="self" style="flat"]');
    expect(decoded).toContain('<p>Here\'s a box:</p>'); // Regular HTML unchanged
  });
});