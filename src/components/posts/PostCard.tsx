import React from 'react';
import { Link as RouterLink } from 'react-router-dom';
import {
    Card,
    CardContent,
    CardMedia,
    Typography,
    Box,
    Chip,
    Avatar,
    Grid,
    Link,
    CardActionArea
} from '@mui/material';
import CommentIcon from '@mui/icons-material/Comment';
import { WordPressPost } from '../../services/wordpressApi';

// Helper function to strip HTML tags
const stripHtml = (html: string) => {
    const doc = new DOMParser().parseFromString(html, 'text/html');
    return doc.body.textContent || '';
};

interface PostCardProps {
    post: WordPressPost;
}

const PostCard: React.FC<PostCardProps> = ({ post }) => {
    // Extract data from the WordPress post object
    const title = post.title.rendered;
    const excerpt = stripHtml(post.excerpt.rendered);
    const slug = post.slug;
    const date = new Date(post.date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    // Get categories and tags from _embedded data if available
    const categories = post._embedded?.['wp:term']?.[0] || [];
    const tags = post._embedded?.['wp:term']?.[1] || [];

    // Get featured image if available
    const featuredImage = post._embedded?.['wp:featuredmedia']?.[0]?.source_url;
    const imageAlt = post._embedded?.['wp:featuredmedia']?.[0]?.alt_text || title;

    // Get author data if available
    const author = post._embedded?.author?.[0];
    const authorName = author?.name || 'Unknown Author';
    const authorAvatar = author?.avatar_urls?.['96'] || '';

    // Comment count (this would need to be fetched separately or included in the API response)
    const commentCount = 0; // Placeholder - you'll need to get actual data

    return (
        <Card sx={{ mb: 3, display: 'flex', flexDirection: { xs: 'column', sm: 'row' } }}>
            {/* Left side - Featured Image */}
            {featuredImage ? (
                <CardActionArea 
                    component={RouterLink} 
                    to={`/post/${slug}`}
                    sx={{ 
                        width: { xs: '100%', sm: '33%' },
                        flexShrink: 0
                    }}
                >
                    <CardMedia
                        component="img"
                        sx={{ 
                            height: { xs: 200, sm: '100%' },
                            minHeight: { sm: 220 }
                        }}
                        image={featuredImage}
                        alt={imageAlt}
                    />
                </CardActionArea>
            ) : (
                <Box 
                    sx={{ 
                        width: { xs: '100%', sm: '33%' },
                        bgcolor: 'grey.200',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0
                    }}
                >
                    <Typography variant="body2" color="text.secondary">
                        No image available
                    </Typography>
                </Box>
            )}

            {/* Right side - Content */}
            <Box sx={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
                <CardContent sx={{ flex: '1 0 auto' }}>
                    {/* Categories and Tags */}
                    <Box sx={{ mb: 1, display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {categories.map((category: any) => (
                            <Chip
                                key={`cat-${category.id}`}
                                label={category.name}
                                component={RouterLink}
                                to={`/?category=${category.slug}`}
                                size="small"
                                color="primary"
                                sx={{ mr: 0.5, mb: 0.5 }}
                                clickable
                            />
                        ))}
                        {tags.slice(0, 3).map((tag: any) => (
                            <Chip
                                key={`tag-${tag.id}`}
                                label={tag.name}
                                component={RouterLink}
                                to={`/?tag=${tag.slug}`}
                                size="small"
                                variant="outlined"
                                sx={{ mr: 0.5, mb: 0.5 }}
                                clickable
                            />
                        ))}
                    </Box>

                    {/* Post Title */}
                    <Link
                        component={RouterLink}
                        to={`/post/${slug}`}
                        underline="hover"
                        color="inherit"
                    >
                        <Typography
                            variant="h5"
                            component="h2"
                            gutterBottom
                            sx={{
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                display: '-webkit-box',
                                WebkitLineClamp: 2,
                                WebkitBoxOrient: 'vertical',
                                lineHeight: 1.3,
                            }}
                            dangerouslySetInnerHTML={{ __html: title }}
                        />
                    </Link>

                    {/* Excerpt */}
                    <Typography
                        variant="body2"
                        color="text.secondary"
                        paragraph
                        sx={{
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            display: '-webkit-box',
                            WebkitLineClamp: 3,
                            WebkitBoxOrient: 'vertical',
                        }}
                    >
                        {excerpt}
                    </Typography>

                    {/* Post Meta - Author, Date, Comments */}
                    <Grid container spacing={1} alignItems="center">
                        <Grid item>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                <Avatar
                                    src={authorAvatar}
                                    alt={authorName}
                                    sx={{ width: 24, height: 24, mr: 1 }}
                                />
                                <Typography variant="body2" color="text.secondary">
                                    {authorName}
                                </Typography>
                            </Box>
                        </Grid>
                        <Grid item>
                            <Typography variant="body2" color="text.secondary">
                                • {date}
                            </Typography>
                        </Grid>
                        <Grid item>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                <CommentIcon fontSize="small" sx={{ mr: 0.5, fontSize: 16 }} />
                                <Typography variant="body2" color="text.secondary">
                                    {commentCount}
                                </Typography>
                            </Box>
                        </Grid>
                    </Grid>
                </CardContent>
            </Box>
        </Card>
    );
};

export default PostCard;