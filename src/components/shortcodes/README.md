# Shortcode System Documentation

## Overview

This React application implements a client-side WordPress shortcode parser and renderer. It processes WordPress content containing shortcodes and renders them as React components without requiring server-side processing.

## Architecture

### Core Components

1. **Parser** (`/src/utils/shortcodeParser.ts`)
   - Parses WordPress shortcode syntax into an AST-like structure
   - Handles nested shortcodes with proper depth tracking
   - Includes performance optimizations with caching
   - Supports all standard WordPress shortcode formats

2. **Renderer** (`/src/components/shortcodes/ShortcodeRenderer.tsx`)
   - Converts parsed nodes into React components
   - Handles both shortcode and HTML content
   - Provides recursive rendering for nested structures

3. **Registry** (`/src/components/shortcodes/ShortcodeRegistry.tsx`)
   - Maps shortcode names to React components
   - Implements lazy loading for performance
   - Central location for all shortcode definitions

## Supported Shortcode Syntax

```
[shortcode]                           // Basic
[shortcode /]                         // Self-closing
[shortcode attr="value"]              // With attributes
[shortcode attr="value" /]            // Self-closing with attributes
[shortcode]content[/shortcode]        // With content
[outer][inner]content[/inner][/outer] // Nested
```

## Adding New Shortcodes

### 1. Create Component

Create a new component in `/src/components/shortcodes/`:

```typescript
// src/components/shortcodes/MyShortcode.tsx
import React from 'react';
import { ShortcodeComponentProps } from './ShortcodeRegistry';

const MyShortcode: React.FC<ShortcodeComponentProps> = ({ attributes, children }) => {
  const { title, color = '#000' } = attributes || {};
  
  return (
    <div style={{ color }}>
      {title && <h3>{title}</h3>}
      {children}
    </div>
  );
};

export default MyShortcode;
```

### 2. Register Component

Add to the registry in `ShortcodeRegistry.tsx`:

```typescript
import MyShortcode from './MyShortcode';

export const SHORTCODE_REGISTRY = {
  // ... existing shortcodes
  'my_shortcode': MyShortcode,
};
```

### 3. Use in Content

```
[my_shortcode title="Hello" color="#ff0000"]
This is my content
[/my_shortcode]
```

## Testing Shortcodes

### Unit Tests

```bash
# Run parser tests
npm test shortcodeParser.test.ts

# Run performance tests
npm test shortcodeParser.perf.test.ts
```

### Debug Utilities

```typescript
// Use the debug utility
import { debugShortcode } from '@/utils/debugShortcode';

debugShortcode('[my_shortcode]test[/my_shortcode]');
```

### Command Line Testing

```bash
# Test predefined cases
node scripts/test-shortcode.mjs

# Test custom shortcode
node scripts/test-shortcode.mjs "[button]Click[/button]"
```

## Performance Considerations

1. **Caching**: Parser caches results for small content (<1KB)
2. **Lazy Loading**: Heavy components use React.lazy()
3. **Memoization**: ShortcodeRenderer uses React.useMemo()
4. **Batch Processing**: Parser processes all matches before building tree

## Currently Implemented Shortcodes

### Shortcodes Ultimate Components
- `su_box` - Styled content boxes (includes glass effect with backdrop blur)
- `su_button` - Customizable buttons
- `su_tabs`/`su_tab` - Tabbed content (special container handling)
- `su_youtube` - YouTube embeds
- `su_highlight` - Text highlighting (inline rendering)
- `su_divider` - Content dividers
- `su_quote` - Blockquotes
- `su_accordion`/`su_spoiler` - Collapsible content
- `su_row`/`su_column` - Layout grids

### Custom Shortcodes
- `genetic-algorithm` - Weasel evolution simulation
- `dawkins-weasel` - Dawkins' weasel program

## Important Implementation Details

### Container Shortcodes (e.g., Tabs)
Container shortcodes like `su_tabs` that need to process their child shortcodes require special handling:

1. The renderer wraps `su_tab` content in a div with data attributes:
```jsx
<div data-shortcode="su_tab" data-title="Tab Title" data-anchor="tab-anchor">
  {tabContent}
</div>
```

2. The parent component (`SuTabs`) extracts these marked divs to build the UI:
```typescript
React.Children.forEach(children, (child) => {
  if (child.type === 'div' && child.props['data-shortcode'] === 'su_tab') {
    // Extract tab data
  }
});
```

### Inline vs Block Rendering
The renderer intelligently handles text nodes:
- Uses `<span>` for inline content (no block-level HTML)
- Uses `<div>` for block content (contains `<p>`, `<div>`, etc.)
- Inline shortcodes (like `su_highlight`) are listed in `INLINE_SHORTCODES`

### Performance Optimizations
- **Attribute Caching**: Parsed attributes are cached (up to 1000 entries)
- **Content Caching**: Small content (<1KB) is cached (up to 100 entries)
- **Cache Clearing**: Use `clearShortcodeCaches()` when needed

### Browser Compatibility Notes
- Glass box effect uses `backdrop-filter` (Chrome, Edge, Safari, Firefox 103+)
- Includes `-webkit-backdrop-filter` for Safari support
- Fallbacks provided for unsupported browsers

## Best Practices

1. **Always handle undefined attributes**
   ```typescript
   const { attr = 'default' } = attributes || {};
   ```

2. **Support both self-closing and content variants**
   ```typescript
   if (children) {
     return <div>{children}</div>;
   }
   return <div>Default content</div>;
   ```

3. **Use Material-UI for consistency**
   ```typescript
   import { Box, Typography } from '@mui/material';
   ```

4. **Validate attribute types**
   ```typescript
   const width = Number(attributes?.width) || 100;
   ```

## Troubleshooting

### Shortcode Not Rendering
1. Check if registered in `SHORTCODE_REGISTRY`
2. Verify component export/import
3. Check for typos in shortcode name
4. Use debug utilities to inspect parsing

### Nested Shortcodes Issues
1. Ensure proper closing tags
2. Check for tag name conflicts
3. Verify recursive rendering logic

### Performance Issues
1. Enable lazy loading for heavy components
2. Check for infinite recursion
3. Profile with React DevTools
4. Consider caching parsed results

## Future Enhancements

- [ ] Support for dynamic shortcode registration
- [ ] Visual shortcode builder
- [ ] Shortcode validation/linting
- [ ] Server-side rendering support
- [ ] WordPress block editor integration