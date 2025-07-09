import { useState, useEffect } from 'react';
import { Container, Typography, Box, CircularProgress, Alert, Divider } from '@mui/material';
import PostList from '../components/posts/PostList';
import FeaturedArticle from '../components/posts/FeaturedArticle';
import { WordPressPost } from '../types/interfaces';
import { getPosts } from '../services/wordpressApi';
import { useAuth } from '../contexts/SimpleAuthContext';
import { useDocumentTitle } from '../hooks/useDocumentTitle';

const Home = () => {
  // Set document title for home page
  useDocumentTitle();
  const [posts, setPosts] = useState<WordPressPost[]>([]);
  const [featuredPost, setFeaturedPost] = useState<WordPressPost | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  
  // Get authentication status
  const { isAuthenticated, isLoading: authLoading } = useAuth();

  useEffect(() => {
    const fetchPosts = async () => {
      // Don't fetch posts while auth is still loading
      if (authLoading) {
        return;
      }


      setIsLoading(true);
      setError(null);

      // Small delay to ensure auth state has fully propagated
      await new Promise(resolve => setTimeout(resolve, 100));

      try {
        // Use the API service with authentication and include drafts if authenticated
        const result = await getPosts({
          page: currentPage,
          perPage: 10,
          includeDrafts: isAuthenticated // Include drafts when user is authenticated
        });
        
        console.log('🏠 Home: Received posts result:', {
          postsCount: result.posts.length,
          totalPages: result.totalPages,
          isAuthenticated
        });

        // Validate the result
        if (!result || !Array.isArray(result.posts)) {
          throw new Error('Invalid response from getPosts');
        }
        
        // Set the featured post to the first post if on the first page
        if (currentPage === 1 && result.posts.length > 0) {
          setFeaturedPost(result.posts[0]);
          // Remove the featured post from the regular post list
          setPosts(result.posts.slice(1));
        } else {
          setFeaturedPost(null);
          setPosts(result.posts);
        }
        
        setTotalPages(result.totalPages);
        setIsLoading(false);
      } catch (err) {
        console.error('🏠 Home: Error fetching posts:', err);
        const errorMessage = err instanceof Error ? err.message : 'Failed to load posts. Please try again later.';
        setError(errorMessage);
        setIsLoading(false);
        
        // Reset posts to empty arrays to prevent filter errors
        setPosts([]);
        setFeaturedPost(null);
      }
    };

    fetchPosts();
  }, [currentPage, isAuthenticated, authLoading]); // Include authLoading in dependencies

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo(0, 0);
  };

  // Show loading while auth is initializing
  if (authLoading) {
    return (
      <Container maxWidth="lg">
        <Box sx={{ textAlign: 'center', p: 4 }}>
          <CircularProgress />
          <Typography variant="body2" sx={{ mt: 2 }}>
            Initializing...
          </Typography>
        </Box>
      </Container>
    );
  }

  if (isLoading) {
    return (
      <Container maxWidth="lg">
        <Box sx={{ textAlign: 'center', p: 4 }}>
          <CircularProgress />
          <Typography variant="body2" sx={{ mt: 2 }}>
            Loading posts...
          </Typography>
        </Box>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg">
        <Box sx={{ p: 4 }}>
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
          <Typography variant="body2" color="text.secondary">
            Debug info: isAuthenticated={isAuthenticated.toString()}, authLoading={authLoading.toString()}
          </Typography>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg">
      {/* Authentication status indicator */}
      {isAuthenticated && (
        <Box sx={{ mb: 2 }}>
          <Alert severity="info" sx={{ borderRadius: 2 }}>
            📝 Draft mode active - You can see draft posts and unpublished content
          </Alert>
        </Box>
      )}

      {/* Featured Post Section */}
      {featuredPost && (
        <Box sx={{ my: 4 }}>
          <FeaturedArticle post={featuredPost} />
        </Box>
      )}
      
      {/* Regular Posts Section */}
      <Box sx={{ my: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Latest Posts
          {isAuthenticated && (
            <Typography component="span" variant="subtitle1" sx={{ ml: 2, color: 'text.secondary' }}>
              (including drafts)
            </Typography>
          )}
        </Typography>
        <Divider sx={{ mb: 3 }} />
        
        {posts.length === 0 ? (
          <Alert severity="info">
            No posts available at the moment.
            {isAuthenticated && " (This includes checking for drafts)"}
          </Alert>
        ) : (
          <PostList 
            posts={posts} 
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
          />
        )}
      </Box>
    </Container>
  );
};

export default Home;