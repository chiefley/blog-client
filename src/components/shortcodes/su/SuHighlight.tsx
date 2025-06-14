// src/components/shortcodes/su/SuHighlight.tsx
import React from 'react';
import { Box } from '@mui/material';
import { ShortcodeComponentProps } from '../ShortcodeRegistry';

const SuHighlight: React.FC<ShortcodeComponentProps> = ({ attributes, children }) => {
  const {
    background = '#DDFF99',
    color = '#000000',
    class: className,
  } = attributes || {};

  // Debug logging
  if (process.env.NODE_ENV === 'development') {
    console.log('SuHighlight rendering:', { attributes, children, background, color });
  }

  return (
    <Box
      component="span"
      sx={{
        backgroundColor: background,
        color: color,
        px: 0.5,
        py: 0.25,
        borderRadius: 0.5,
        display: 'inline',
      }}
      className={className}
    >
      {children}
    </Box>
  );
};

export default SuHighlight;