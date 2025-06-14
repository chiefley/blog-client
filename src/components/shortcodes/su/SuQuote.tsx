// src/components/shortcodes/su/SuQuote.tsx
import React from 'react';
import { Box, Typography } from '@mui/material';
import FormatQuoteIcon from '@mui/icons-material/FormatQuote';
import { ShortcodeComponentProps } from '../ShortcodeRegistry';

const SuQuote: React.FC<ShortcodeComponentProps> = ({ attributes, children }) => {
  const {
    style = 'default',
    cite,
    url,
    class: className,
  } = attributes || {};

  const getQuoteStyle = () => {
    switch (style) {
      case 'modern':
        return {
          borderLeft: '4px solid',
          borderColor: 'primary.main',
          pl: 3,
          py: 2,
          bgcolor: 'action.hover',
        };
      case 'box':
        return {
          p: 3,
          bgcolor: 'grey.100',
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: 1,
        };
      case 'brackets':
        return {
          position: 'relative' as const,
          px: 4,
          py: 2,
          '&::before': {
            content: '"["',
            position: 'absolute',
            left: 0,
            top: 0,
            fontSize: '2rem',
            color: 'text.secondary',
          },
          '&::after': {
            content: '"]"',
            position: 'absolute',
            right: 0,
            bottom: 0,
            fontSize: '2rem',
            color: 'text.secondary',
          },
        };
      default:
        return {
          borderLeft: '4px solid',
          borderColor: 'grey.300',
          pl: 3,
          py: 1,
          my: 2,
        };
    }
  };

  return (
    <Box
      component="blockquote"
      sx={{
        mx: 0,
        my: 2,
        ...getQuoteStyle(),
      }}
      className={className}
    >
      {style === 'modern' && (
        <FormatQuoteIcon 
          sx={{ 
            fontSize: 40, 
            color: 'primary.main', 
            opacity: 0.3,
            float: 'left',
            mr: 1,
            mt: -1,
          }} 
        />
      )}
      
      <Typography
        variant="body1"
        sx={{
          fontStyle: 'italic',
          fontSize: '1.1rem',
          lineHeight: 1.6,
        }}
      >
        {children}
      </Typography>
      
      {cite && (
        <Typography
          variant="caption"
          component="footer"
          sx={{
            display: 'block',
            mt: 1,
            color: 'text.secondary',
            '&::before': {
              content: '"— "',
            },
          }}
        >
          {url ? (
            <a 
              href={url} 
              target="_blank" 
              rel="noopener noreferrer"
              style={{ color: 'inherit', textDecoration: 'underline' }}
            >
              {cite}
            </a>
          ) : (
            cite
          )}
        </Typography>
      )}
    </Box>
  );
};

export default SuQuote;