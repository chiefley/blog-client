// src/components/shortcodes/su/SuButton.tsx
import React from 'react';
import { Button } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import { ShortcodeComponentProps } from '../ShortcodeRegistry';

const SuButton: React.FC<ShortcodeComponentProps> = ({ attributes, children }) => {
  const {
    url = '#',
    target = '_self',
    style = 'default',
    background = '#2D89EF',
    color = '#FFFFFF',
    size = 'medium',
    wide = 'no',
    center = 'no',
    radius = '3',
    text_shadow = '0px',
    desc,
    rel,
    title,
    class: className,
  } = attributes || {};

  // Map SU button styles to MUI variants
  const getVariant = () => {
    switch (style) {
      case 'flat':
      case 'soft':
        return 'contained';
      case 'ghost':
      case 'stroked':
        return 'outlined';
      case '3d':
        return 'contained';
      default:
        return 'contained';
    }
  };

  // Map SU sizes to MUI sizes
  const getSize = () => {
    const sizeNum = parseInt(size) || 3;
    if (sizeNum <= 2) return 'small';
    if (sizeNum >= 5) return 'large';
    return 'medium';
  };

  const buttonProps = {
    variant: getVariant() as any,
    size: getSize() as any,
    fullWidth: wide === 'yes',
    href: url,
    target: target,
    rel: rel || (target === '_blank' ? 'noopener noreferrer' : undefined),
    title: title,
    sx: {
      borderRadius: `${radius}px`,
      textTransform: 'none',
      ...(style === 'flat' || style === 'soft' ? {
        backgroundColor: background,
        color: color,
        '&:hover': {
          backgroundColor: background,
          opacity: 0.9,
        },
      } : {}),
      ...(style === '3d' ? {
        backgroundColor: background,
        color: color,
        boxShadow: `0 4px 0 0 ${background}80`,
        '&:active': {
          transform: 'translateY(2px)',
          boxShadow: `0 2px 0 0 ${background}80`,
        },
      } : {}),
      ...(text_shadow !== '0px' ? {
        textShadow: `0 ${text_shadow} 0 rgba(0,0,0,0.5)`,
      } : {}),
      ...(center === 'yes' ? {
        display: 'block',
        mx: 'auto',
      } : {}),
    },
    className: className,
  };

  // Handle internal vs external links
  const isExternal = url.startsWith('http') || target === '_blank';
  const buttonComponent = isExternal ? 'a' : RouterLink;
  
  const finalProps = {
    ...buttonProps,
    component: buttonComponent as any,
    ...(isExternal ? {} : { to: url }),
  };
  
  if (!isExternal) {
    delete finalProps.href;
  }

  return (
    <Button {...finalProps}>
      {children || 'Click Here'}
      {target === '_blank' && (
        <OpenInNewIcon sx={{ ml: 1, fontSize: 'small' }} />
      )}
      {desc && (
        <span style={{ display: 'block', fontSize: '0.85em', opacity: 0.8 }}>
          {desc}
        </span>
      )}
    </Button>
  );
};

export default SuButton;