// src/components/posts/PostDetail.tsx
import React, { useState, useEffect } from 'react';
import { useParams, Link as RouterLink } from 'react-router-dom';
import {
    Typography,
    Box,
    Paper,
    Chip,
    Avatar,
    Grid,
    CircularProgress,
    Alert,
    Button
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { getPostBySlug } from '../../services/wordpressApi';
import { WordPressPost } from '../../types/interfaces';
import LazyImage from '../common/LazyImage';
import { getResponsiveImageUrl } from '../../utils/imageUtils';
import { Comments } from '../comments';
import { parseEmbeddedComponents } from '../embedded/ComponentRegistry';

const PostDetail: React.FC = () => {
    const { slug } = useParams<{ slug: string }>();
    const [post, setPost] = useState<WordPressPost | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchPost = async () => {
            if (!slug) return;

            setLoading(true);
            setError(null);

            try {
                const postData = await getPostBySlug(slug);
                
                if (postData) {
                    setPost(postData);
                } else {
                    setError('Post not found');
                }
            } catch (err) {
                console.error('Error fetching post:', err);
                setError('Failed to load post. Please try again later.');
            } finally {
                setLoading(false);
            }
        };

        fetchPost();
    }, [slug]);

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                <CircularProgress />
            </Box>
        );
    }

    if (error || !post) {
        return (
            <Box>
                <Button
                    component={RouterLink}
                    to="/"
                    startIcon={<ArrowBackIcon />}
                    sx={{ mb: 2 }}
                >
                    Back to Posts
                </Button>
                <Alert severity="error" sx={{ my: 2 }}>
                    {error || 'Post not found'}
                </Alert>
            </Box>
        );
    }

    // Extract post data
    const title = post.title.rendered;
    const content = post.content.rendered;
    const date = new Date(post.date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    // Get categories and tags - with more robust handling
    const categories = post._embedded?.['wp:term']?.[0] || [];
    
    // Get tags more robustly
    let tags: any[] = [];
    
    // First try the standard location
    if (post._embedded?.['wp:term']?.[1]) {
        tags = post._embedded['wp:term'][1];
    }
    
    // If that doesn't work, try to find tags by taxonomy attribute
    if (tags.length === 0 && post._embedded?.['wp:term']) {
        const allTerms = post._embedded['wp:term'].flat();
        tags = allTerms.filter((term: any) => term.taxonomy === 'post_tag');
    }
    
    // Check if we have tag IDs but no tag data
    const hasTagIds = post.tags && post.tags.length > 0;
    const hasTagData = tags.length > 0;

    // Get featured image with multiple fallbacks
    const getFeaturedImage = () => {
        // First check if better_featured_image is available
        if (post.better_featured_image) {
            return post.better_featured_image.source_url;
        }
        
        // Then check for featured_media_url
        if (post.featured_media_url) {
            return post.featured_media_url;
        }
        
        // Fall back to embedded media
        return post._embedded?.['wp:featuredmedia']?.[0]?.source_url;
    };

    const featuredImage = getFeaturedImage();
    
    // Optimize featured image with Optimole if available
    const responsiveFeaturedImage = featuredImage ? getResponsiveImageUrl(featuredImage, {
        mobile: { width: 480, height: 250 },
        tablet: { width: 768, height: 300 },
        desktop: { width: 1200, height: 500 },
        quality: 90
    }) : '';

    // Get author data
    const author = post._embedded?.author?.[0];
    const authorName = author?.name || 'Unknown Author';
    const authorAvatar = author?.avatar_urls?.['96'] || '';

    return (
        <Box>
            <Button
                component={RouterLink}
                to="/"
                startIcon={<ArrowBackIcon />}
                sx={{ mb: 2 }}
            >
                Back to Posts
            </Button>

            <Paper sx={{ p: { xs: 2, md: 4 }, mb: 4, borderRadius: 2 }}>
                {/* Post header */}
                <Box sx={{ mb: 3 }}>
                    {/* Categories and Tags in a single row */}
                    <Box sx={{ mb: 2, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                        {/* Categories */}
                        {categories.map((category: any) => (
                            <Chip
                                key={`cat-${category.id}`}
                                label={category.name}
                                component={RouterLink}
                                to={`/posts/category/${category.slug}`}
                                size="small"
                                color="primary"
                                clickable
                            />
                        ))}
                        
                        {/* Tags - styled similar to PostCard.tsx */}
                        {tags.map((tag: any) => (
                            <Chip
                                key={`tag-${tag.id}`}
                                label={tag.name}
                                component={RouterLink}
                                to={`/posts/tag/${tag.slug}`}
                                size="small"
                                variant="outlined"
                                clickable
                                sx={{
                                    borderColor: 'text.secondary',
                                    '&:hover': {
                                        backgroundColor: 'action.hover',
                                        borderColor: 'primary.light'
                                    }
                                }}
                            />
                        ))}
                    </Box>

                    {/* Title */}
                    <Typography 
                        variant="h3" 
                        component="h1" 
                        gutterBottom
                        dangerouslySetInnerHTML={{ __html: title }}
                    />

                    {/* Meta information */}
                    <Grid container spacing={2} alignItems="center" sx={{ mb: 3 }}>
                        <Grid item>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                <Avatar
                                    src={authorAvatar}
                                    alt={authorName}
                                    sx={{ width: 40, height: 40, mr: 1 }}
                                />
                                <Box>
                                    <Typography variant="subtitle2">{authorName}</Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        {date}
                                    </Typography>
                                </Box>
                            </Box>
                        </Grid>
                    </Grid>
                </Box>

                {/* Featured image - Now using LazyImage with Optimole */}
                {featuredImage ? (
                    <Box sx={{ mb: 4 }}>
                        <LazyImage
                            src={responsiveFeaturedImage}
                            alt={title}
                            width="100%"
                            height={250}
                            objectFit="cover"
                            borderRadius={1}
                            loadingHeight={250}
                        />
                    </Box>
                ) : null}

                {/* Post content - Now using parseEmbeddedComponents instead of enhanceContent */}
                <Box sx={{ 
                    '& img': { maxWidth: '100%', height: 'auto', borderRadius: 1 },
                    '& figure': { margin: '1rem 0' },
                    '& figcaption': { color: 'text.secondary', fontSize: '0.875rem', textAlign: 'center' },
                    '& blockquote': { 
                        borderLeft: '4px solid #e0e0e0', 
                        margin: '1rem 0', 
                        padding: '0.5rem 0 0.5rem 1rem',
                        fontStyle: 'italic'
                    },
                    '& a': { color: 'primary.main' },
                    '& h2, & h3, & h4, & h5, & h6': { 
                        mt: 4, 
                        mb: 2 
                    },
                    '& p': { 
                        mb: 2,
                        lineHeight: 1.6
                    },
                    '& ul, & ol': { 
                        mb: 2,
                        pl: 3
                    },
                    '& li': {
                        mb: 0.5
                    }
                }}>
                    {parseEmbeddedComponents(content)}
                </Box>

                {/* Tags at the bottom - keep for reference */}
                <Box sx={{ mt: 4 }}>
                    <Typography variant="h6" gutterBottom>
                        Tags
                    </Typography>
                    
                    {hasTagData ? (
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                            {tags.map((tag: any) => (
                                <Chip
                                    key={`tag-${tag.id}`}
                                    label={tag.name}
                                    component={RouterLink}
                                    to={`/posts/tag/${tag.slug}`}
                                    size="small"
                                    variant="outlined"
                                    clickable
                                    sx={{
                                        borderColor: 'primary.light',
                                        '&:hover': {
                                            backgroundColor: 'primary.light',
                                            color: 'white'
                                        }
                                    }}
                                />
                            ))}
                        </Box>
                    ) : hasTagIds ? (
                        <Typography variant="body2" color="text.secondary">
                            This post has tags, but the tag data could not be loaded.
                        </Typography>
                    ) : (
                        <Typography variant="body2" color="text.secondary">
                            No tags for this post.
                        </Typography>
                    )}
                </Box>

                {/* Author box */}
                <Box sx={{ mt: 4, p: 3, bgcolor: 'background.default', borderRadius: 2 }}>
                    <Typography variant="h6" gutterBottom>
                        About the Author
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
                        <Avatar
                            src={authorAvatar}
                            alt={authorName}
                            sx={{ width: 60, height: 60, mr: 2 }}
                        />
                        <Box>
                            <Typography variant="subtitle1" gutterBottom>
                                {authorName}
                            </Typography>
                            <Typography variant="body2">
                                Author bio would go here. You can add this information to your WordPress user profile.
                            </Typography>
                        </Box>
                    </Box>
                </Box>
            </Paper>

            {/* Comments section */}
            <Paper sx={{ p: { xs: 2, md: 4 }, borderRadius: 2 }}>
                <Comments postId={post.id} />
            </Paper>
        </Box>
    );
};

export default PostDetail;