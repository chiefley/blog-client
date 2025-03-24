import React, { useState, useEffect } from 'react';
import { 
  Typography, 
  Chip, 
  Divider, 
  Box, 
  CircularProgress 
} from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';

// Define the interface for tag objects
interface Tag {
  id: number;
  name: string;
  count: number;
  slug: string;
}

// Props interface
interface TagsProps {
  title?: string;
  maxTags?: number;
}

const Tags: React.FC<TagsProps> = ({ title = "Tags", maxTags = 30 }) => {
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTags = async () => {
      try {
        // You should replace this with your actual API endpoint
        const response = await fetch(`https://wpcms.thechief.com/wp-json/wp/v2/tags?per_page=${maxTags}`);
        
        if (!response.ok) {
          throw new Error(`Error fetching tags: ${response.status}`);
        }
        
        const data = await response.json();
        setTags(data.map((tag: any) => ({
          id: tag.id,
          name: tag.name,
          count: tag.count,
          slug: tag.slug
        })));
        setLoading(false);
      } catch (err) {
        console.error('Error fetching tags:', err);
        setError('Failed to load tags. Please try again later.');
        setLoading(false);
      }
    };

    fetchTags();
  }, [maxTags]);

  if (loading) {
    return (
      <Box sx={{ textAlign: 'center', p: 2 }}>
        <CircularProgress size={24} />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 2 }}>
        <Typography color="error">{error}</Typography>
      </Box>
    );
  }

  // Calculate font size based on count for tag cloud effect
  const getTagSize = (count: number) => {
    const min = Math.min(...tags.map(t => t.count));
    const max = Math.max(...tags.map(t => t.count));
    const range = max - min;
    
    // Scale between 0.7 and 1.1 rem
    const fontSize = range === 0 
      ? '0.8rem' 
      : `${0.7 + (count - min) / range * 0.4}rem`;
    
    return fontSize;
  };

  return (
    <Box sx={{ mb: 4 }}>
      <Typography variant="h6" sx={{ mb: 1 }}>
        {title}
      </Typography>
      <Divider sx={{ mb: 2 }} />
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
        {tags.map((tag) => (
          <Chip
            key={tag.id}
            label={tag.name}
            component={RouterLink}
            to={`/tag/${tag.slug}`}
            clickable
            size="small"
            sx={{
              fontSize: getTagSize(tag.count),
              textDecoration: 'none',
              '&:hover': {
                backgroundColor: 'primary.main',
                color: 'primary.contrastText',
              }
            }}
          />
        ))}
      </Box>
    </Box>
  );
};

export default Tags;