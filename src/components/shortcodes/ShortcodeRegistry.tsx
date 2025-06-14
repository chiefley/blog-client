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
export const ShortcodeLoadingFallback: React.FC = () => (
  <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
    <CircularProgress size={24} />
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
 * Wrapper for shortcode components with error boundary and loading state
 */
export const ShortcodeWrapper: React.FC<{
  component: ComponentType<ShortcodeComponentProps>;
  props: ShortcodeComponentProps;
}> = ({ component: Component, props }) => {
  return (
    <Suspense fallback={<ShortcodeLoadingFallback />}>
      <Component {...props} />
    </Suspense>
  );
};