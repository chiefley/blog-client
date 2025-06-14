// src/components/shortcodes/su/SuDivider.tsx
import React from 'react';
import { Divider, Box } from '@mui/material';
import { ShortcodeComponentProps } from '../ShortcodeRegistry';

const SuDivider: React.FC<ShortcodeComponentProps> = ({ attributes }) => {
  const {
    top = 'yes',
    text,
    style = 'default',
    divider_color = '#999',
    link_color = '#999',
    size = '3',
    margin = '15',
    class: className,
  } = attributes || {};

  const showTopLink = top === 'yes';

  return (
    <Box
      sx={{
        my: `${margin}px`,
        position: 'relative',
      }}
      className={className}
    >
      <Divider
        sx={{
          borderBottomWidth: `${size}px`,
          borderColor: divider_color,
          ...(style === 'dashed' && {
            borderStyle: 'dashed',
          }),
          ...(style === 'dotted' && {
            borderStyle: 'dotted',
          }),
          ...(style === 'double' && {
            borderStyle: 'double',
            borderBottomWidth: `${parseInt(size) * 3}px`,
          }),
        }}
      >
        {text && (
          <Box
            component="span"
            sx={{
              px: 2,
              color: link_color,
              bgcolor: 'background.paper',
              position: 'relative',
              fontSize: '0.9rem',
            }}
          >
            {text}
          </Box>
        )}
      </Divider>
      
      {showTopLink && (
        <Box
          component="a"
          href="#top"
          sx={{
            position: 'absolute',
            right: 0,
            top: '50%',
            transform: 'translateY(-50%)',
            color: link_color,
            textDecoration: 'none',
            fontSize: '0.85rem',
            px: 1,
            bgcolor: 'background.paper',
            '&:hover': {
              textDecoration: 'underline',
            },
          }}
          onClick={(e) => {
            e.preventDefault();
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
        >
          ↑ Top
        </Box>
      )}
    </Box>
  );
};

export default SuDivider;