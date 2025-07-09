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
import { getTagBySlug, getPostsByTag } from '../services/wordpressApi';
import { useAuth } from '../contexts/SimpleAuthContext';
import { useDocumentTitle } from '../hooks/useDocumentTitle';

const TagPosts = () => {
  const { slug } = useParams<{ slug: string }>();
  const { isAuthenticated } = useAuth();
  const [posts, setPosts] = useState<WordPressPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tagName, setTagName] = useState('');
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  
  // Update document title with tag name
  useDocumentTitle(tagName ? `Tag: ${tagName}` : undefined);

  useEffect(() => {
    const fetchTagPosts = async () => {
      if (!slug) {
        setError('Tag slug is missing');
        setLoading(false);
        return;
      }

      try {
        // First get tag information
        const tag = await getTagBySlug(slug);
        
        if (!tag) {
          setError(`Tag "${slug}" not found.`);
          setLoading(false);
          return;
        }
        
        setTagName(tag.name);
        
        // Fetch posts with this tag using the centralized API function
        const { posts: allPosts, totalPages: totalPagesCount } = await getPostsByTag(
          tag.id,
          currentPage,
          10,
          isAuthenticated  // This will include auth headers when needed
        );
        
        setPosts(allPosts);
        setTotalPages(totalPagesCount);
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
  }, [slug, currentPage, isAuthenticated]);

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