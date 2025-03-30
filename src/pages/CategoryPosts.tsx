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
import { getPosts, getCategoryBySlug } from '../services/wordpressApi';

const CategoryPosts = () => {
  const { slug } = useParams<{ slug: string }>();
  const [posts, setPosts] = useState<WordPressPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [categoryName, setCategoryName] = useState('');
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    const fetchCategoryPosts = async () => {
      if (!slug) {
        setError('Category slug is missing');
        setLoading(false);
        return;
      }

      try {
        // First fetch category information to get the ID and proper name
        const categoryData = await getCategoryBySlug(slug);
        
        if (!categoryData) {
          setError(`Category "${slug}" not found.`);
          setLoading(false);
          return;
        }
        
        setCategoryName(categoryData.name);
        
        // Then fetch posts for this category
        const result = await getPosts({
          page: currentPage,
          perPage: 10,
          categoryId: categoryData.id
        });
        
        setPosts(result.posts);
        setTotalPages(result.totalPages);
        setLoading(false);
      } catch (err) {
        console.error('Error:', err);
        setError('Failed to load posts. Please try again later.');
        setLoading(false);
      }
    };

    setLoading(true);
    setError(null);
    fetchCategoryPosts();
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