// src/components/shortcodes/su/SuPlaceholder.tsx
import React from 'react';
import { Box } from '@mui/material';
import { ShortcodeComponentProps } from '../ShortcodeRegistry';

// Placeholder component for unimplemented shortcodes
const SuPlaceholder: React.FC<ShortcodeComponentProps & { shortcodeName: string }> = ({ 
  shortcodeName, 
  children 
}) => {
  return (
    <Box
      sx={{
        p: 2,
        my: 1,
        border: '1px dashed',
        borderColor: 'warning.main',
        borderRadius: 1,
        bgcolor: 'warning.light',
        opacity: 0.7,
      }}
    >
      <strong>[{shortcodeName}]</strong> - Coming soon
      {children && <Box sx={{ mt: 1 }}>{children}</Box>}
    </Box>
  );
};

export default SuPlaceholder;

// Export specific placeholder components
export const SuAccordion = (props: ShortcodeComponentProps) => 
  <SuPlaceholder shortcodeName="su_accordion" {...props} />;

export const SuRow = (props: ShortcodeComponentProps) => 
  <SuPlaceholder shortcodeName="su_row" {...props} />;

export const SuColumn = (props: ShortcodeComponentProps) => 
  <SuPlaceholder shortcodeName="su_column" {...props} />;

export const SuList = (props: ShortcodeComponentProps) => 
  <SuPlaceholder shortcodeName="su_list" {...props} />;

export const SuTooltip = (props: ShortcodeComponentProps) => 
  <SuPlaceholder shortcodeName="su_tooltip" {...props} />;

export const SuExpand = (props: ShortcodeComponentProps) => 
  <SuPlaceholder shortcodeName="su_expand" {...props} />;

export const SuLabel = (props: ShortcodeComponentProps) => 
  <SuPlaceholder shortcodeName="su_label" {...props} />;

export const SuDropcap = (props: ShortcodeComponentProps) => 
  <SuPlaceholder shortcodeName="su_dropcap" {...props} />;