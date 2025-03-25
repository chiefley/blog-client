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

const CategoryPosts = () => {
  const { slug } = useParams<{ slug: string }>();
  const [posts, setPosts] = useState<WordPressPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [categoryName, setCategoryName] = useState('');
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    const fetchCategoryInfo = async () => {
      try {
        // First fetch category information to get the ID and proper name
        const categoryResponse = await fetch(`https://wpcms.thechief.com/wp-json/wp/v2/categories?slug=${slug}`);
        
        if (!categoryResponse.ok) {
          throw new Error(`Error fetching category info: ${categoryResponse.status}`);
        }
        
        const categoryData = await categoryResponse.json();
        
        if (categoryData.length === 0) {
          setError(`Category "${slug}" not found.`);
          setLoading(false);
          return;
        }
        
        const categoryId = categoryData[0].id;
        setCategoryName(categoryData[0].name);
        
        // Then fetch posts for this category
        const postsResponse = await fetch(
          `https://wpcms.thechief.com/wp-json/wp/v2/posts?categories=${categoryId}&_embed=true&page=${currentPage}&per_page=10`
        );
        
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
    fetchCategoryInfo();
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
          Posts in: {categoryName}
        </Typography>
        
        {posts.length > 0 ? (
          <PostList 
            posts={posts} 
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
          />
        ) : (
          <Alert severity="info">No posts found in this category.</Alert>
        )}
      </Box>
    </Container>
  );
};

export default CategoryPosts;