// src/components/posts/FeaturedArticle.tsx
import React from 'react';
import { Box, Typography, Paper, Button } from '@mui/material';
import { styled } from '@mui/system';
import { Link as RouterLink } from 'react-router-dom';
import { WordPressPost } from '../../types/interfaces';
import LazyImage from '../common/LazyImage'; 
import { getResponsiveImageUrl } from '../../utils/imageUtils';

interface FeaturedArticleProps {
  post: WordPressPost;
}

const HeaderLabel = styled(Box)(({ theme }) => ({
  position: 'relative',
  zIndex: 3,
  padding: theme.spacing(3),
  paddingBottom: 0,
  color: '#fff',
}));

const FeaturedArticle: React.FC<FeaturedArticleProps> = ({ post }) => {
  // Get the featured image URL if available, or use a default
  const getFeaturedImage = () => {
    // First check if better_featured_image is available from the Better REST API Featured Image plugin
    if (post.better_featured_image) {
      // Try to get medium_large or medium size if available for hero image
      if (post.better_featured_image.media_details?.sizes) {
        if (post.better_featured_image.media_details.sizes.medium_large) {
          return post.better_featured_image.media_details.sizes.medium_large.source_url;
        }
        if (post.better_featured_image.media_details.sizes.medium) {
          return post.better_featured_image.media_details.sizes.medium.source_url;
        }
      }
      
      // Fall back to full size
      return post.better_featured_image.source_url;
    }
    
    // Check for featured_media_url (older way)
    if (post.featured_media_url) {
      return post.featured_media_url;
    }
    
    // Fall back to the embedded media if available
    if (post._embedded && post._embedded['wp:featuredmedia'] && post._embedded['wp:featuredmedia'][0]) {
      const media = post._embedded['wp:featuredmedia'][0];
      
      // Try to get any available size for hero image
      if (media.media_details && media.media_details.sizes) {
        // Use medium size if available, or any other available size
        if (media.media_details.sizes.medium && media.media_details.sizes.medium.source_url) {
          return media.media_details.sizes.medium.source_url;
        }
      }
      
      // Fall back to source URL
      return media.source_url;
    }
    
    // Default image if none is available
    return 'https://via.placeholder.com/1200x500';
  };
  
  // Get categories for the post
  const getCategories = () => {
    if (post._embedded && post._embedded['wp:term'] && post._embedded['wp:term'][0]) {
      return post._embedded['wp:term'][0];
    }
    return [];
  };

  // Get tags for the post
  const getTags = () => {
    if (post._embedded && post._embedded['wp:term'] && post._embedded['wp:term'][1]) {
      return post._embedded['wp:term'][1];
    }
    return [];
  };

  // Format the post date
  const formattedDate = new Date(post.date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  // Get author name
  const getAuthorName = () => {
    if (post._embedded && post._embedded.author && post._embedded.author[0]) {
      return post._embedded.author[0].name || 'Unknown';
    }
    return 'Unknown';
  };

  const categories = getCategories();
  const tags = getTags();
  const author = getAuthorName();
  const featuredImageUrl = getFeaturedImage();
  
  // Make the image URL responsive with Optimole if available
  const responsiveImageUrl = featuredImageUrl ? getResponsiveImageUrl(featuredImageUrl, {
    mobile: { width: 480, height: 250 },
    tablet: { width: 768, height: 300 },
    desktop: { width: 1200, height: 400 },
    quality: 85
  }) : '';
  
  return (
    <Paper 
      elevation={3}
      sx={{ 
        position: 'relative',
        height: { xs: '250px', md: '300px' }, // Reduced height
        mb: 3, // Reduced margin
        borderRadius: 2,
        overflow: 'hidden',
        transition: 'transform 0.3s',
        '&:hover': {
          transform: 'translateY(-4px)',
        }
      }}
    >
      {/* Background image with overlay gradient - Now using LazyImage */}
      <Box 
        component="div"
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          '&::after': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            background: 'linear-gradient(to top, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.4) 50%, rgba(0,0,0,0.1) 100%)',
            zIndex: 1
          }
        }}
      >
        <LazyImage 
          src={responsiveImageUrl || 'https://via.placeholder.com/1200x500'}
          alt={post.title.rendered}
          height="100%"
          width="100%"
          objectFit="cover"
          fallbackSrc="https://via.placeholder.com/1200x500"
        />
      </Box>

      {/* Featured Article Label */}
      <HeaderLabel>
        <Typography 
          variant="overline" 
          component="div" 
          sx={{ 
            fontWeight: 'bold', 
            fontSize: '1rem',
            letterSpacing: '0.1em',
            opacity: 0.9,
            textTransform: 'uppercase'
          }}
        >
          Featured Article
        </Typography>
      </HeaderLabel>
      
      {/* Content overlay - pushed toward the bottom */}
      <Box 
        sx={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          width: '100%',
          p: { xs: 2, md: 3 }, // Reduced padding
          color: 'white',
          zIndex: 2
        }}
      >
        {/* Categories and Tags */}
        <Box sx={{ display: 'flex', gap: 1, mb: 1, flexWrap: 'wrap' }}>
          {/* Categories */}
          {categories.map((category: any) => (
            <Box 
              key={`cat-${category.id}`}
              component={RouterLink}
              to={`/posts/category/${category.slug}`}
              sx={{
                bgcolor: 'primary.main',
                color: 'white',
                py: 0.5,
                px: 1.5,
                borderRadius: 1,
                fontSize: '0.75rem',
                fontWeight: 'bold',
                textTransform: 'uppercase',
                textDecoration: 'none',
                '&:hover': {
                  bgcolor: 'primary.dark'
                }
              }}
            >
              {category.name}
            </Box>
          ))}
          
          {/* Tags - show up to 2 tags on the featured article */}
          {tags.slice(0, 2).map((tag: any) => (
            <Box 
              key={`tag-${tag.id}`}
              component={RouterLink}
              to={`/posts/tag/${tag.slug}`}
              sx={{
                border: '1px solid',
                borderColor: 'divider',
                color: 'text.secondary',
                bgcolor: 'rgba(255, 255, 255, 0.9)',
                py: 0.5,
                px: 1.5,
                borderRadius: 1,
                fontSize: '0.75rem',
                textDecoration: 'none',
                '&:hover': {
                  borderColor: 'primary.light',
                  bgcolor: 'rgba(255, 255, 255, 0.7)'
                }
              }}
            >
              {tag.name}
            </Box>
          ))}
        </Box>
        
        {/* Post title */}
        <Typography 
          variant="h4" 
          component={RouterLink}
          to={`/post/${post.slug}`}
          sx={{ 
            color: 'white', 
            textDecoration: 'none',
            display: 'block',
            mb: 0.5,
            textShadow: '1px 1px 3px rgba(0,0,0,0.6)',
            '&:hover': {
              color: 'primary.light'
            },
            fontSize: { xs: '1.5rem', sm: '1.75rem', md: '2rem' }, // Slightly smaller font sizes
            lineHeight: 1.2 // Tighter line height
          }}
          dangerouslySetInnerHTML={{ __html: post.title.rendered }}
        />
        
        {/* Excerpt - added back with limited height */}
        <Box 
          sx={{ 
            mb: 1,
            visibility: { xs: 'hidden', sm: 'visible' },
            height: { xs: 0, sm: 'auto' },
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            maxHeight: '2.5em',
            '& p': { 
              m: 0,
              fontSize: '0.9rem',
              lineHeight: 1.3,
              textShadow: '1px 1px 2px rgba(0,0,0,0.7)'
            }
          }}
          dangerouslySetInnerHTML={{ __html: post.excerpt.rendered }}
        />
        
        {/* Meta information */}
        <Box 
          sx={{ 
            display: 'flex', 
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 1
          }}
        >
          <Typography variant="body2" sx={{ textShadow: '1px 1px 2px rgba(0,0,0,0.7)' }}>
            By {author} • {formattedDate}
          </Typography>
          
          <Button 
            variant="outlined"
            component={RouterLink}
            to={`/post/${post.slug}`}
            size="small" // Smaller button
            sx={{
              color: 'white',
              borderColor: 'white',
              '&:hover': {
                borderColor: 'primary.light',
                bgcolor: 'rgba(255,255,255,0.1)'
              }
            }}
          >
            Read More
          </Button>
        </Box>
      </Box>
    </Paper>
  );
};

export default FeaturedArticle;