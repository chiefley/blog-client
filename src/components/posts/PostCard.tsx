import { Card, CardContent, CardMedia, Typography, Box, Avatar } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import { PostCardProps } from '../../types/interfaces';

const PostCard = ({ post }: PostCardProps) => {
  // Get the featured image URL if available
  const getFeaturedImage = () => {
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
  

  const author = getAuthor();
  const date = new Date(post.date).toLocaleDateString();
  
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
      <CardMedia
        component={RouterLink}
        to={`/post/${post.slug}`}
        sx={{
          width: { xs: '100%', sm: '30%' },
          height: { xs: '200px', sm: 'auto' },
          minHeight: { sm: '240px' },
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          transition: 'opacity 0.2s',
          '&:hover': {
            opacity: 0.9
          }
        }}
        image={getFeaturedImage()}
        title={post.title.rendered}
      />
      <CardContent sx={{ flex: '1', display: 'flex', flexDirection: 'column' }}>
        <Box sx={{ mb: 1, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
          {/* Categories and tags would go here */}
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
          
          {/* Comment count would go here */}
        </Box>
      </CardContent>
    </Card>
  );
};

export default PostCard;