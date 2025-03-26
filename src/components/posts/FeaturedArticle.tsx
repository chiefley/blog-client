import React from 'react';
import { Box, Typography, Paper, Button } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import { WordPressPost } from '../../types/interfaces';

interface FeaturedArticleProps {
  post: WordPressPost;
}

const FeaturedArticle: React.FC<FeaturedArticleProps> = ({ post }) => {
  // Get the featured image URL if available, or use a default
  const getFeaturedImage = () => {
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
  const author = getAuthorName();
  
  return (
    <Paper 
      elevation={3}
      sx={{ 
        position: 'relative',
        height: { xs: '400px', md: '500px' },
        mb: 4,
        borderRadius: 2,
        overflow: 'hidden',
        transition: 'transform 0.3s',
        '&:hover': {
          transform: 'translateY(-4px)',
        }
      }}
    >
      {/* Background image with overlay gradient */}
      <Box 
        component="div"
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          backgroundImage: `url(${getFeaturedImage()})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          '&::after': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            background: 'linear-gradient(to top, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.4) 50%, rgba(0,0,0,0.1) 100%)',
          }
        }}
      />
      
      {/* Content overlay */}
      <Box 
        sx={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          width: '100%',
          p: { xs: 3, md: 5 },
          color: 'white',
          zIndex: 1
        }}
      >
        {/* Categories */}
        <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
          {categories.map((category: any) => (
            <Box 
              key={category.id}
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
        </Box>
        
        {/* Post title */}
        <Typography 
          variant="h3" 
          component={RouterLink}
          to={`/post/${post.slug}`}
          sx={{ 
            color: 'white', 
            textDecoration: 'none',
            display: 'block',
            mb: 2,
            textShadow: '1px 1px 3px rgba(0,0,0,0.6)',
            '&:hover': {
              color: 'primary.light'
            },
            fontSize: { xs: '1.75rem', sm: '2.25rem', md: '2.75rem' }
          }}
          dangerouslySetInnerHTML={{ __html: post.title.rendered }}
        />
        
        {/* Excerpt */}
        <Box 
          sx={{ 
            mb: 3, 
            display: { xs: 'none', sm: 'block' },
            '& p': { 
              m: 0,
              fontSize: '1.1rem',
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
            gap: 2
          }}
        >
          <Typography variant="body2" sx={{ textShadow: '1px 1px 2px rgba(0,0,0,0.7)' }}>
            By {author} • {formattedDate}
          </Typography>
          
          <Button 
            variant="outlined"
            component={RouterLink}
            to={`/post/${post.slug}`}
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