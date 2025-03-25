import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import {
    Box,
    Typography,
    Pagination,
    CircularProgress,
    Alert
} from '@mui/material';
import PostCard from './PostCard';
import { getPosts, WordPressPost, getCategories } from '../../services/wordpressApi';

// Helper function to extract URL parameters
const useQuery = () => {
    return new URLSearchParams(useLocation().search);
};

interface PostListProps {
    title?: string;
    categoryId?: string | null; // Add support for direct categoryId prop
}

const PostList: React.FC<PostListProps> = ({ title = 'Latest Posts', categoryId: propCategoryId = null }) => {
    const [posts, setPosts] = useState<WordPressPost[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [totalPages, setTotalPages] = useState(1);
    const [categoryName, setCategoryName] = useState<string | null>(null);
    
    const navigate = useNavigate();
    const location = useLocation();
    const { categoryId: routeCategoryId } = useParams<{ categoryId?: string }>();
    const query = useQuery();
    const queryCategoryId = query.get('categories');
    const tagSlug = query.get('tag');
    const searchQuery = query.get('search');
    const pageParam = query.get('page');
    
    // Determine the effective category ID from all possible sources
    // Priority: prop > route param > query param
    const effectiveCategoryId = propCategoryId || routeCategoryId || queryCategoryId;
    
    // Determine current page from URL or default to 1
    const page = pageParam ? parseInt(pageParam, 10) : 1;

    // Fetch posts when component mounts or when relevant parameters change
    useEffect(() => {
        const fetchPosts = async () => {
            setLoading(true);
            setError(null);
            
            try {
                // If we have a category ID, fetch the category name
                if (effectiveCategoryId) {
                    try {
                        const categories = await getCategories();
                        const category = categories.find(cat => 
                            cat.id.toString() === effectiveCategoryId.toString() || 
                            cat.slug === effectiveCategoryId
                        );
                        
                        if (category) {
                            setCategoryName(category.name);
                        }
                    } catch (err) {
                        console.error('Error fetching category:', err);
                    }
                }
                
                // This is a simplified version - we'd need to convert slugs to IDs
                // by first fetching categories/tags or extending the API service
                const categoryIdForApi = effectiveCategoryId ? 
                    (isNaN(parseInt(effectiveCategoryId)) ? undefined : parseInt(effectiveCategoryId)) : 
                    undefined;
                    
                const result = await getPosts({
                    page,
                    perPage: 5,
                    categoryId: categoryIdForApi,
                    categorySlug: isNaN(parseInt(effectiveCategoryId || '')) ? effectiveCategoryId : undefined,
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
    }, [page, effectiveCategoryId, tagSlug, searchQuery]);

    const handlePageChange = (_: React.ChangeEvent<unknown>, newPage: number) => {
        // Handle pagination differently based on the current URL structure
        if (location.pathname.startsWith('/categories/')) {
            // We're using path-based URLs - update just the page parameter
            navigate(`${location.pathname}?page=${newPage}`);
        } else if (effectiveCategoryId) {
            // We're using query parameters with a category
            const params = new URLSearchParams(location.search);
            params.set('page', newPage.toString());
            navigate(`/?${params.toString()}`);
        } else {
            // Regular pagination - just update the page parameter
            const params = new URLSearchParams(location.search);
            params.set('page', newPage.toString());
            navigate(`/?${params.toString()}`);
        }
        
        // Scroll to top when changing pages
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    // Generate appropriate title based on filters
    let displayTitle = title;
    if (categoryName) {
        displayTitle = `Category: ${categoryName}`;
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