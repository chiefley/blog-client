import React, { useState, useEffect, useRef } from 'react';
import { Box, Skeleton } from '@mui/material';

interface LazyImageProps {
  src: string;
  alt: string;
  width?: string | number;
  height?: string | number;
  className?: string;
  style?: React.CSSProperties;
}

const LazyImage: React.FC<LazyImageProps> = ({ 
  src, 
  alt, 
  width = '100%', 
  height = 'auto', 
  className = '', 
  style = {} 
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const imgRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Set up the intersection observer
    const observer = new IntersectionObserver(
      (entries) => {
        // When the image enters the viewport
        if (entries[0].isIntersecting) {
          setIsInView(true);
          // Once we've triggered the load, we don't need to observe anymore
          if (imgRef.current) observer.unobserve(imgRef.current);
        }
      },
      {
        rootMargin: '100px', // Start loading when image is 100px from viewport
        threshold: 0.01
      }
    );

    // Start observing the container
    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    // Clean up the observer when component unmounts
    return () => {
      if (imgRef.current) observer.unobserve(imgRef.current);
    };
  }, []);

  // Function to handle image load
  const handleImageLoad = () => {
    console.log(`Image loaded: ${src}`);
    setIsLoaded(true);
  };

  // Function to handle image error
  const handleImageError = () => {
    console.error(`Failed to load image: ${src}`);
    // We still set isLoaded to true to remove the skeleton
    setIsLoaded(true);
  };

  return (
    <Box 
      ref={imgRef}
      className={`lazy-image-container ${className}`}
      sx={{ 
        width, 
        height, 
        position: 'relative',
        overflow: 'hidden',
        ...style
      }}
    >
      {!isLoaded && (
        <Skeleton 
          variant="rectangular"
          animation="wave"
          width="100%"
          height="100%"
          sx={{ position: 'absolute', top: 0, left: 0 }}
        />
      )}
      
      {isInView && (
        <img
          src={src}
          alt={alt}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            display: isLoaded ? 'block' : 'none',
          }}
          onLoad={handleImageLoad}
          onError={handleImageError}
        />
      )}
    </Box>
  );
};

export default LazyImage;