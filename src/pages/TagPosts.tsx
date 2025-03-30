import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { 
  Container, 
  Typography, 
  Box, 
  CircularProgress, 
  Alert 
} from '@mui/material';
import PostList from '../components/posts/PostList';
import { WordPressPost } from '../types/interfaces';
import { createAuthHeader } from '../services/authService';

const TagPosts = () => {
  const { slug } = useParams<{ slug: string }>();
  const [posts, setPosts] = useState<WordPressPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tagName, setTagName] = useState('');
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    const fetchTagPosts = async () => {
      if (!slug) {
        setError('Tag slug is missing');
        setLoading(false);
        return;
      }

      try {
        // Get authentication header
        const authHeader = createAuthHeader();

        // Create request options with auth header
        const requestOptions: RequestInit = {
          headers: {
            'Content-Type': 'application/json',
            ...(authHeader || {})
          }
        };

        // First get tag information
        const baseUrl = 'https://wpcms.thechief.com';
        const tagResponse = await fetch(`${baseUrl}/wp-json/wp/v2/tags?slug=${slug}`, requestOptions);
        
        if (!tagResponse.ok) {
          throw new Error(`Error fetching tag info: ${tagResponse.status}`);
        }
        
        const tagData = await tagResponse.json();
        
        if (tagData.length === 0) {
          setError(`Tag "${slug}" not found.`);
          setLoading(false);
          return;
        }
        
        const tagId = tagData[0].id;
        setTagName(tagData[0].name);
        
        // Directly fetch posts with this tag
        const postsUrl = `${baseUrl}/wp-json/wp/v2/posts?tags=${tagId}&_embed=true&page=${currentPage}&per_page=10`;
        
        console.log('Fetching tag posts with URL:', postsUrl);
        console.log('Using auth header:', !!authHeader);
        
        const postsResponse = await fetch(postsUrl, requestOptions);
        
        if (!postsResponse.ok && postsResponse.status !== 400) {
          throw new Error(`Error fetching posts: ${postsResponse.status}`);
        }
        
        const totalPagesHeader = postsResponse.headers.get('X-WP-TotalPages');
        setTotalPages(totalPagesHeader ? parseInt(totalPagesHeader) : 1);
        
        const postsData = await postsResponse.json();
        setPosts(postsData);
        setLoading(false);
      } catch (err) {
        console.error('Error:', err);
        setError('Failed to load posts. Please try again later.');
        setLoading(false);
      }
    };

    setLoading(true);
    setError(null);
    fetchTagPosts();
  }, [slug, currentPage]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo(0, 0);
  };

  if (loading) {
    return (
      <Container maxWidth="lg">
        <Box sx={{ textAlign: 'center', p: 4 }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg">
        <Box sx={{ p: 4 }}>
          <Alert severity="error">{error}</Alert>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg">
      <Box sx={{ my: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Posts tagged: {tagName}
        </Typography>
        
        {posts.length > 0 ? (
          <PostList 
            posts={posts} 
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
          />
        ) : (
          <Alert severity="info">No posts found with this tag.</Alert>
        )}
      </Box>
    </Container>
  );
};

export default TagPosts;