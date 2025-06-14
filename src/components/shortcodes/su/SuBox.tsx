// src/components/shortcodes/su/SuBox.tsx
import React from 'react';
import { Box, Paper } from '@mui/material';
import { ShortcodeComponentProps } from '../ShortcodeRegistry';

const SuBox: React.FC<ShortcodeComponentProps> = ({ attributes, children }) => {
  const {
    title,
    style = 'default',
    color = '#333333',
    radius = '3',
    class: className,
  } = attributes || {};

  // Map SU box styles to MUI variants
  const getBoxStyle = () => {
    switch (style) {
      case 'soft':
        return {
          bgcolor: 'action.hover',
          border: 'none',
        };
      case 'glass':
        return {
          bgcolor: 'rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
        };
      case 'bubbles':
        return {
          bgcolor: 'primary.light',
          color: 'primary.contrastText',
        };
      case 'noise':
        return {
          bgcolor: 'grey.100',
          backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100"%3E%3Cfilter id="noise"%3E%3CfeTurbulence baseFrequency="0.9"/%3E%3C/filter%3E%3Crect width="100" height="100" filter="url(%23noise)" opacity="0.02"/%3E%3C/svg%3E")',
        };
      default:
        return {
          bgcolor: 'background.paper',
          border: '1px solid',
          borderColor: 'divider',
        };
    }
  };

  return (
    <Paper
      elevation={style === 'soft' ? 0 : 1}
      sx={{
        p: 3,
        my: 2,
        borderRadius: `${radius}px`,
        ...getBoxStyle(),
        ...(className && { className }),
      }}
    >
      {title && (
        <Box
          component="h3"
          sx={{
            mt: 0,
            mb: 2,
            fontSize: '1.2rem',
            fontWeight: 'bold',
            color: style === 'bubbles' ? 'inherit' : color,
          }}
        >
          {title}
        </Box>
      )}
      {children}
    </Paper>
  );
};

export default SuBox;