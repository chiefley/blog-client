import { useState, useEffect } from 'react';
import { Container, Typography, Box, CircularProgress, Alert, Divider } from '@mui/material';
import PostList from '../components/posts/PostList';
import FeaturedArticle from '../components/posts/FeaturedArticle';
import { WordPressPost } from '../types/interfaces';

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
        const response = await fetch(
          `https://wpcms.thechief.com/wp-json/wp/v2/posts?_embed=true&page=${currentPage}&per_page=10`
        );
        
        if (!response.ok && response.status !== 400) {
          throw new Error(`Error: ${response.status}`);
        }
        
        const totalPagesHeader = response.headers.get('X-WP-TotalPages');
        setTotalPages(totalPagesHeader ? parseInt(totalPagesHeader) : 1);
        
        const data = await response.json();
        
        // Set the featured post to the first post if on the first page
        if (currentPage === 1 && data.length > 0) {
          setFeaturedPost(data[0]);
          // Remove the featured post from the regular post list
          setPosts(data.slice(1));
        } else {
          setPosts(data);
        }
        
        setIsLoading(false);
      } catch (err) {
        console.error('Error fetching posts:', err);
        setError('Failed to load posts. Please try again later.');
        setIsLoading(false);
      }
    };

    /* 
    // For future use: Function to fetch a dedicated featured post with a special tag or category
    // Uncomment and use this when you have set up a tag for featured posts
    async function getFeaturedPost() {
      try {
        // Example: Filter posts with a featured tag or category
        // You can replace tag ID 5 with your actual featured tag or category ID
        const response = await fetch(
          `https://wpcms.thechief.com/wp-json/wp/v2/posts?_embed=true&tags=5&per_page=1`
        );
        
        if (response.ok) {
          const data = await response.json();
          if (data.length > 0) {
            setFeaturedPost(data[0]);
          }
        }
      } catch (err) {
        console.error('Error fetching featured post:', err);
        // Don't set an error state here, as this is optional
      }
    }
    */

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