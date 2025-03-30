import { useState, useEffect } from 'react';
import { Container, Typography, Box, CircularProgress, Alert, Divider } from '@mui/material';
import PostList from '../components/posts/PostList';
import FeaturedArticle from '../components/posts/FeaturedArticle';
import { WordPressPost } from '../types/interfaces';
import { getPosts } from '../services/wordpressApi';

const Home = () => {
  const [posts, setPosts] = useState<WordPressPost[]>([]);
  const [featuredPost, setFeaturedPost] = useState<WordPressPost | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        // Use the API service with authentication
        const result = await getPosts({
          page: currentPage,
          perPage: 10
        });
        
        // Set the featured post to the first post if on the first page
        if (currentPage === 1 && result.posts.length > 0) {
          setFeaturedPost(result.posts[0]);
          // Remove the featured post from the regular post list
          setPosts(result.posts.slice(1));
        } else {
          setPosts(result.posts);
        }
        
        setTotalPages(result.totalPages);
        setIsLoading(false);
      } catch (err) {
        console.error('Error fetching posts:', err);
        setError('Failed to load posts. Please try again later.');
        setIsLoading(false);
      }
    };

    setIsLoading(true);
    setError(null);
    fetchPosts();
  }, [currentPage]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo(0, 0);
  };

  if (isLoading) {
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
        </Typography>
        <Divider sx={{ mb: 3 }} />
        <PostList 
          posts={posts} 
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={handlePageChange}
        />
      </Box>
    </Container>
  );
};

export default Home;