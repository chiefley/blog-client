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
  
  // Check if we're in dark mode (you might want to get this from your theme context)
  const prefersDarkMode = typeof window !== 'undefined' && 
    window.matchMedia && 
    window.matchMedia('(prefers-color-scheme: dark)').matches;

  // Map SU box styles to MUI variants
  const getBoxStyle = () => {
    switch (style) {
      case 'soft':
        return {
          bgcolor: 'action.hover',
          border: 'none',
        };
      case 'glass':
        // Better glass effect that works on both light and dark backgrounds
        return prefersDarkMode ? {
          // Dark mode glass
          bgcolor: 'rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(10px) saturate(150%)',
          WebkitBackdropFilter: 'blur(10px) saturate(150%)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.2)',
          background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%)',
        } : {
          // Light mode glass - subtle tinted glass effect
          bgcolor: 'rgba(255, 255, 255, 0.7)',
          backdropFilter: 'blur(10px) saturate(150%)',
          WebkitBackdropFilter: 'blur(10px) saturate(150%)',
          border: '1px solid rgba(0, 0, 0, 0.1)',
          boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.1)',
          background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.7) 0%, rgba(255, 255, 255, 0.3) 100%)',
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