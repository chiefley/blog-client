// src/components/shortcodes/ShortcodeRenderer.tsx
import React from 'react';
import { Box } from '@mui/material';
import { parseShortcodes, ShortcodeNode } from '../../utils/shortcodeParser';
import { 
  SHORTCODE_REGISTRY, 
  ShortcodeWrapper, 
  UnknownShortcode,
  ShortcodeComponentProps 
} from './ShortcodeRegistry';

/**
 * Render a single shortcode node
 */
function renderShortcodeNode(node: ShortcodeNode, index: number): React.ReactNode {
  if (node.type === 'text') {
    // Render HTML content
    return (
      <Box
        key={`text-${index}`}
        component="div"
        dangerouslySetInnerHTML={{ __html: node.raw || '' }}
      />
    );
  }
  
  if (node.type === 'shortcode' && node.name) {
    const Component = SHORTCODE_REGISTRY[node.name];
    
    if (Component) {
      // Render children if they exist
      const children = node.content?.map((child, childIndex) => {
        if (typeof child === 'string') {
          return child;
        }
        return renderShortcodeNode(child, childIndex);
      });
      
      const props: ShortcodeComponentProps = {
        attributes: node.attributes || {},
        children: children?.length ? <>{children}</> : undefined
      };
      
      return (
        <ShortcodeWrapper
          key={`shortcode-${node.name}-${index}`}
          component={Component}
          props={props}
        />
      );
    }
    
    // Unknown shortcode
    return <UnknownShortcode key={`unknown-${index}`} name={node.name} />;
  }
  
  return null;
}

/**
 * Parse and render content with shortcodes
 */
export function ShortcodeRenderer({ content }: { content: string }): React.ReactElement {
  const nodes = React.useMemo(() => parseShortcodes(content), [content]);
  
  return (
    <>
      {nodes.map((node, index) => renderShortcodeNode(node, index))}
    </>
  );
}

/**
 * Hook to use shortcode parsing
 */
export function useShortcodeContent(content: string): React.ReactNode {
  return React.useMemo(() => <ShortcodeRenderer content={content} />, [content]);
}