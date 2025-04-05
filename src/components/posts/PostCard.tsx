// src/components/posts/PostCard.tsx
import { Card, CardContent, Box, Typography, Avatar, Chip } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import { PostCardProps, Category, Tag } from '../../types/interfaces';
import LazyImage from '../common/LazyImage'; // Import the LazyImage component

const PostCard = ({ post }: PostCardProps) => {
  // Get the featured image URL if available
  const getFeaturedImage = () => {
    // First check if better_featured_image is available from the Better REST API Featured Image plugin
    if (post.better_featured_image) {
      // Try to get medium size if available
      if (post.better_featured_image.media_details?.sizes?.medium) {
        return post.better_featured_image.media_details.sizes.medium.source_url;
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
      
      // Try to get medium size first
      if (media.media_details && media.media_details.sizes && media.media_details.sizes.medium) {
        return media.media_details.sizes.medium.source_url;
      }
      
      // Fall back to source URL
      return media.source_url;
    }
    
    // Default image if none is available
    return 'https://via.placeholder.com/300x200';
  };
  
  // Get author information
  const getAuthor = () => {
    if (post._embedded && post._embedded.author && post._embedded.author[0]) {
      return {
        name: post._embedded.author[0].name || 'Unknown',
        avatar: post._embedded.author[0].avatar_urls && post._embedded.author[0].avatar_urls['48'] 
          ? post._embedded.author[0].avatar_urls['48'] 
          : 'https://via.placeholder.com/48'
      };
    }
    
    return { name: 'Unknown', avatar: 'https://via.placeholder.com/48' };
  };
  
  // Get categories
  const getCategories = (): Category[] => {
    if (
      post._embedded && 
      post._embedded['wp:term'] && 
      post._embedded['wp:term'][0]
    ) {
      return post._embedded['wp:term'][0] as Category[];
    }
    return [];
  };
  
  // Get tags
  const getTags = (): Tag[] => {
    if (
      post._embedded && 
      post._embedded['wp:term'] && 
      post._embedded['wp:term'][1]
    ) {
      return post._embedded['wp:term'][1] as Tag[];
    }
    return [];
  };

  const author = getAuthor();
  const categories = getCategories();
  const tags = getTags();
  const date = new Date(post.date).toLocaleDateString();
  const featuredImageUrl = getFeaturedImage();
  
  // Get comment count (safely)
  const commentCount = post.comment_count || 0;
  
  return (
    <Card sx={{ 
      display: 'flex', 
      flexDirection: { xs: 'column', sm: 'row' },
      mb: 2,
      transition: 'transform 0.2s',
      '&:hover': {
        transform: 'translateY(-4px)',
        boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
      }
    }}>
      {/* Using LazyImage component instead of CardMedia */}
      <Box
        component={RouterLink}
        to={`/post/${post.slug}`}
        sx={{
          width: { xs: '100%', sm: '30%' },
          height: { xs: '200px', sm: 'auto' },
          minHeight: { sm: '240px' },
          position: 'relative',
          overflow: 'hidden',
          textDecoration: 'none',
          transition: 'opacity 0.2s',
          '&:hover': {
            opacity: 0.9
          }
        }}
      >
        <LazyImage
          src={featuredImageUrl || 'https://via.placeholder.com/300x200'}
          alt={post.title.rendered}
          height="100%"
          width="100%"
          objectFit="cover"
          loadingHeight="100%"
        />
      </Box>
      
      <CardContent sx={{ flex: '1', display: 'flex', flexDirection: 'column' }}>
        <Box sx={{ mb: 1, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
          {/* Categories */}
          {categories.map((category) => (
            <Chip
              key={`category-${category.id}`}
              label={category.name}
              component={RouterLink}
              to={`/posts/category/${category.slug}`}
              size="small"
              color="primary"
              clickable
              sx={{ 
                borderRadius: 1,
                '&:hover': { backgroundColor: 'primary.dark' }
              }}
            />
          ))}
          
          {/* Tags */}
          {tags.slice(0, 3).map((tag) => (
            <Chip
              key={`tag-${tag.id}`}
              label={tag.name}
              component={RouterLink}
              to={`/posts/tag/${tag.slug}`}
              size="small"
              variant="outlined"
              clickable
              sx={{ 
                borderRadius: 1,
                '&:hover': { backgroundColor: 'action.hover' }
              }}
            />
          ))}
          {tags.length > 3 && (
            <Chip
              label={`+${tags.length - 3} more`}
              size="small"
              variant="outlined"
              sx={{ borderRadius: 1 }}
            />
          )}
        </Box>
        
        <Typography 
          variant="h5" 
          component={RouterLink}
          to={`/post/${post.slug}`}
          sx={{ 
            textDecoration: 'none', 
            color: 'text.primary',
            mb: 1,
            '&:hover': {
              color: 'primary.main'
            }
          }}
        >
          {post.title.rendered}
        </Typography>
        
        <Box 
          dangerouslySetInnerHTML={{ __html: post.excerpt.rendered }} 
          sx={{ 
            mb: 2,
            overflow: 'hidden',
            display: '-webkit-box',
            WebkitLineClamp: 3,
            WebkitBoxOrient: 'vertical',
            '& a': { color: 'primary.main' }
          }}
        />
        
        <Box sx={{ mt: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Avatar src={author.avatar} sx={{ width: 32, height: 32, mr: 1 }} />
            <Box>
              <Typography variant="body2">{author.name}</Typography>
              <Typography variant="caption" color="text.secondary">{date}</Typography>
            </Box>
          </Box>
          
          {commentCount > 0 && (
            <Chip 
              label={`${commentCount} ${commentCount === 1 ? 'comment' : 'comments'}`}
              size="small"
              sx={{ borderRadius: 1 }}
            />
          )}
        </Box>
      </CardContent>
    </Card>
  );
};

export default PostCard;