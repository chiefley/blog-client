// src/components/common/LazyImage.tsx
import React, { useState } from 'react';
import { Box, Skeleton, BoxProps } from '@mui/material';

interface LazyImageProps extends BoxProps {
  src: string; // Must provide a valid string (can be a fallback URL)
  alt: string;
  width?: string | number;
  height?: string | number;
  objectFit?: 'cover' | 'contain' | 'fill' | 'none' | 'scale-down';
  fallbackSrc?: string;
  loadingHeight?: number | string; // Custom height for the skeleton
  borderRadius?: number | string; // Border radius for both image and skeleton
}

const LazyImage: React.FC<LazyImageProps> = ({
  src,
  alt,
  width = '100%',
  height = 'auto',
  objectFit = 'cover',
  fallbackSrc = 'https://via.placeholder.com/300x200',
  loadingHeight,
  borderRadius,
  sx,
  ...boxProps
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);

  const handleLoad = () => {
    setIsLoading(false);
  };

  const handleError = () => {
    setIsLoading(false);
    setError(true);
  };

  // Height to use for the skeleton
  const skeletonHeight = loadingHeight || height;

  return (
    <Box
      position="relative"
      width={width}
      height={isLoading ? skeletonHeight : height}
      borderRadius={borderRadius}
      overflow="hidden"
      {...boxProps}
      sx={{
        ...sx,
        transition: 'height 0.3s ease',
      }}
    >
      {/* Skeleton shown while loading */}
      {isLoading && (
        <Skeleton 
          variant="rectangular" 
          width="100%" 
          height="100%" 
          animation="wave"
          sx={{ borderRadius }} 
        />
      )}

      {/* Actual image */}
      <Box
        component="img"
        src={error ? fallbackSrc : src}
        alt={alt}
        loading="lazy"
        onLoad={handleLoad}
        onError={handleError}
        sx={{
          width: '100%',
          height: '100%',
          objectFit,
          display: isLoading ? 'none' : 'block',
          borderRadius
        }}
      />
    </Box>
  );
};

export default LazyImage;