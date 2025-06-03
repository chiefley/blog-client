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
import { getApiUrl } from '../services/wordpressApi';
import { useAuth, createAuthHeader } from '../contexts/AuthContext';

const TagPosts = () => {
  const { slug } = useParams<{ slug: string }>();
  const { isAuthenticated } = useAuth();
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
        // Use the getApiUrl function to get the correct base URL for the current blog
        const apiUrl = getApiUrl();
        
        // Create request options with auth headers if available
        const requestOptions: RequestInit = {
          headers: {
            'Content-Type': 'application/json',
            ...createAuthHeader()
          }
        };

        // First get tag information
        const tagResponse = await fetch(`${apiUrl}/tags?slug=${slug}`, requestOptions);
        
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
        
        // Fetch posts with this tag
        let allPosts: WordPressPost[] = [];
        let totalPagesCount = 1;
        
        if (isAuthenticated) {
          console.log('🔍 Fetching published and draft posts with tag');
          
          // First get published posts
          const publishedUrl = `${apiUrl}/posts?tags=${tagId}&_embed=true&page=${currentPage}&per_page=10&status=publish`;
          const publishedResponse = await fetch(publishedUrl, requestOptions);
          
          if (publishedResponse.ok) {
            const publishedPosts = await publishedResponse.json();
            allPosts = [...publishedPosts];
            totalPagesCount = parseInt(publishedResponse.headers.get('X-WP-TotalPages') || '1', 10);
            console.log(`📖 Fetched ${publishedPosts.length} published posts with tag`);
          }
          
          // Then try to get draft posts
          const draftUrl = `${apiUrl}/posts?tags=${tagId}&_embed=true&page=${currentPage}&per_page=10&status=draft`;
          
          try {
            const draftResponse = await fetch(draftUrl, requestOptions);
            if (draftResponse.ok) {
              const draftPosts = await draftResponse.json();
              
              // Ensure draftPosts is an array before spreading
              if (Array.isArray(draftPosts)) {
                allPosts = [...allPosts, ...draftPosts];
                console.log(`📝 Fetched ${draftPosts.length} draft posts with tag`);
                
                const draftTotalPages = parseInt(draftResponse.headers.get('X-WP-TotalPages') || '1', 10);
                totalPagesCount = Math.max(totalPagesCount, draftTotalPages);
              }
            } else {
              console.log(`📝 Could not fetch draft posts (status: ${draftResponse.status})`);
            }
          } catch (error) {
            console.error('Error fetching draft posts:', error);
          }
          
          // Sort combined posts by date
          allPosts.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
          
          setPosts(allPosts);
          setTotalPages(totalPagesCount);
        } else {
          // Just fetch published posts
          const postsUrl = `${apiUrl}/posts?tags=${tagId}&_embed=true&page=${currentPage}&per_page=10&status=publish`;
          const postsResponse = await fetch(postsUrl, requestOptions);
          
          if (!postsResponse.ok && postsResponse.status !== 400) {
            throw new Error(`Error fetching posts: ${postsResponse.status}`);
          }
          
          const totalPagesHeader = postsResponse.headers.get('X-WP-TotalPages');
          setTotalPages(totalPagesHeader ? parseInt(totalPagesHeader) : 1);
          
          const postsData = await postsResponse.json();
          setPosts(postsData);
        }
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