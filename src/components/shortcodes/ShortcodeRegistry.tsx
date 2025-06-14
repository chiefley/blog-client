// src/components/shortcodes/ShortcodeRegistry.tsx
import React, { ComponentType, lazy, Suspense } from 'react';
import { CircularProgress, Box } from '@mui/material';

// Import custom shortcode components
import OptimizedWeaselSimulation from '../common/OptimizedWeaselSimulation';
import DawkinsWeaselSimulation from '../common/DawkinsWeaselSimulation';

// Lazy load heavier shortcode components
const SuTabs = lazy(() => import('./su/SuTabs'));
const SuBox = lazy(() => import('./su/SuBox'));
const SuButton = lazy(() => import('./su/SuButton'));
const SuYoutube = lazy(() => import('./su/SuYoutube'));
const SuHighlight = lazy(() => import('./su/SuHighlight'));
const SuDivider = lazy(() => import('./su/SuDivider'));
const SuQuote = lazy(() => import('./su/SuQuote'));

// Import placeholder components
import { 
  SuAccordion,
  SuRow,
  SuColumn,
  SuList,
  SuTooltip,
  SuExpand,
  SuLabel,
  SuDropcap
} from './su/SuPlaceholder';

export interface ShortcodeComponentProps {
  attributes?: Record<string, any>;
  children?: React.ReactNode;
}

// Wrapper components for simulations to match ShortcodeComponentProps interface
const WeaselSimulationWrapper: React.FC<ShortcodeComponentProps> = ({ attributes }) => {
  return <OptimizedWeaselSimulation {...(attributes || {})} />;
};

const DawkinsWeaselWrapper: React.FC<ShortcodeComponentProps> = ({ attributes }) => {
  return <DawkinsWeaselSimulation {...(attributes || {})} />;
};

// Registry mapping shortcode names to React components
export const SHORTCODE_REGISTRY: Record<string, ComponentType<ShortcodeComponentProps>> = {
  // Custom evolution simulation shortcodes
  'genetic-algorithm': WeaselSimulationWrapper,
  'dawkins-weasel': DawkinsWeaselWrapper,
  
  // Shortcodes Ultimate components
  'su_tabs': SuTabs,
  'su_tab': SuTabs, // Will be handled by parent
  'su_accordion': SuAccordion,
  'su_spoiler': SuAccordion, // Will be handled by parent
  'su_box': SuBox,
  'su_button': SuButton,
  'su_youtube': SuYoutube,
  'su_row': SuRow,
  'su_column': SuColumn,
  'su_highlight': SuHighlight,
  'su_divider': SuDivider,
  'su_quote': SuQuote,
  'su_list': SuList,
  'su_tooltip': SuTooltip,
  'su_expand': SuExpand,
  'su_label': SuLabel,
  'su_dropcap': SuDropcap,
  
  // Add more as needed
};

/**
 * Loading fallback for lazy loaded components
 */
export const ShortcodeLoadingFallback: React.FC<{ inline?: boolean }> = ({ inline = false }) => (
  <Box 
    component={inline ? 'span' : 'div'}
    sx={{ 
      display: inline ? 'inline-flex' : 'flex', 
      justifyContent: 'center', 
      p: inline ? 0.5 : 2,
      verticalAlign: inline ? 'middle' : undefined
    }}
  >
    <CircularProgress size={inline ? 16 : 24} />
  </Box>
);

/**
 * Error fallback for unknown shortcodes
 */
export const UnknownShortcode: React.FC<{ name: string }> = ({ name }) => (
  <Box
    sx={{
      p: 2,
      border: '2px dashed',
      borderColor: 'grey.300',
      borderRadius: 1,
      textAlign: 'center',
      color: 'text.secondary',
      bgcolor: 'grey.50',
      my: 2
    }}
  >
    Shortcode [{name}] not implemented
  </Box>
);

/**
 * List of inline shortcodes that should preserve text flow
 */
const INLINE_SHORTCODES = ['su_highlight', 'su_tooltip', 'su_label', 'su_dropcap'];

/**
 * Wrapper for shortcode components with error boundary and loading state
 */
export const ShortcodeWrapper: React.FC<{
  component: ComponentType<ShortcodeComponentProps>;
  props: ShortcodeComponentProps;
  shortcodeName?: string;
}> = ({ component: Component, props, shortcodeName }) => {
  const isInline = shortcodeName && INLINE_SHORTCODES.includes(shortcodeName);
  
  return (
    <Suspense fallback={<ShortcodeLoadingFallback inline={isInline} />}>
      <Component {...props} />
    </Suspense>
  );
};