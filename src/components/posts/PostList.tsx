import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import {
    Box,
    Typography,
    Pagination,
    CircularProgress,
    Alert
} from '@mui/material';
import PostCard from './PostCard';
import { getPosts, WordPressPost } from '../../services/wordpressApi';

// Helper function to extract URL parameters
const useQuery = () => {
    return new URLSearchParams(useLocation().search);
};

interface PostListProps {
    title?: string;
}

const PostList: React.FC<PostListProps> = ({ title = 'Latest Posts' }) => {
    const [posts, setPosts] = useState<WordPressPost[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    
    const query = useQuery();
    const categorySlug = query.get('category');
    const tagSlug = query.get('tag');
    const searchQuery = query.get('search');

    useEffect(() => {
        const fetchPosts = async () => {
            setLoading(true);
            setError(null);
            
            try {
                // This is a simplified version - we'd need to convert slugs to IDs
                // by first fetching categories/tags or extending the API service
                const categoryId = categorySlug ? parseInt(categorySlug) : undefined;
                const result = await getPosts({
                    page,
                    perPage: 5,
                    categoryId,
                    search: searchQuery || undefined
                });
                
                setPosts(result.posts);
                setTotalPages(result.totalPages);
            } catch (err) {
                console.error('Error fetching posts:', err);
                setError('Failed to load posts. Please try again later.');
            } finally {
                setLoading(false);
            }
        };
        
        fetchPosts();
    }, [page, categorySlug, tagSlug, searchQuery]);

    const handlePageChange = (_: React.ChangeEvent<unknown>, value: number) => {
        setPage(value);
        // Scroll to top when changing pages
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    // Generate appropriate title based on filters
    let displayTitle = title;
    if (categorySlug) {
        displayTitle = `Category: ${categorySlug}`;
    } else if (tagSlug) {
        displayTitle = `Tag: ${tagSlug}`;
    } else if (searchQuery) {
        displayTitle = `Search Results for "${searchQuery}"`;
    }

    return (
        <Box>
            <Typography variant="h4" component="h1" gutterBottom>
                {displayTitle}
            </Typography>
            
            {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                    <CircularProgress />
                </Box>
            ) : error ? (
                <Alert severity="error" sx={{ my: 2 }}>
                    {error}
                </Alert>
            ) : posts.length === 0 ? (
                <Alert severity="info" sx={{ my: 2 }}>
                    No posts found. Try a different search or category.
                </Alert>
            ) : (
                <>
                    {posts.map(post => (
                        <PostCard key={post.id} post={post} />
                    ))}
                    
                    {totalPages > 1 && (
                        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
                            <Pagination
                                count={totalPages}
                                page={page}
                                onChange={handlePageChange}
                                color="primary"
                                showFirstButton
                                showLastButton
                            />
                        </Box>
                    )}
                </>
            )}
        </Box>
    );
};

export default PostList;