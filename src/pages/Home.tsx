import React, { useState, useEffect } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import {
    Typography,
    Paper,
    Box,
    Button,
    CardMedia
} from '@mui/material';
import PostList from '../components/posts/PostList';
import { getPosts, WordPressPost } from '../services/wordpressApi';

const Home: React.FC = () => {
    const [featuredPost, setFeaturedPost] = useState<WordPressPost | null>(null);
    const [loading, setLoading] = useState(true);

    // Fetch a featured post when component mounts
    useEffect(() => {
        const fetchFeaturedPost = async () => {
            try {
                // Get the most recent post as featured post
                const result = await getPosts({ perPage: 1 });
                if (result.posts && result.posts.length > 0) {
                    setFeaturedPost(result.posts[0]);
                }
            } catch (error) {
                console.error('Error fetching featured post:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchFeaturedPost();
    }, []);

    return (
        <Box sx={{ width: '100%' }}>
            {/* Hero section with featured post */}
            {featuredPost && (
                <Paper
                    elevation={0}
                    sx={{
                        mb: 4,
                        borderRadius: 2,
                        overflow: 'hidden',
                        position: 'relative',
                        height: 300
                    }}
                >
                    {/* Featured image */}
                    <CardMedia
                        component="img"
                        image={featuredPost._embedded?.['wp:featuredmedia']?.[0]?.source_url || '/placeholder.jpg'}
                        alt={featuredPost.title.rendered}
                        sx={{
                            height: '100%',
                            width: '100%',
                            objectFit: 'cover'
                        }}
                    />

                    {/* Overlay gradient */}
                    <Box
                        sx={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            width: '100%',
                            height: '100%',
                            background: 'linear-gradient(to top, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.3) 60%, rgba(0,0,0,0) 100%)',
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'flex-end',
                            p: 3
                        }}
                    >
                        <Typography
                            variant="overline"
                            sx={{ color: 'white', fontWeight: 'bold' }}
                        >
                            Featured Post
                        </Typography>

                        <Typography
                            variant="h4"
                            component="h1"
                            sx={{ color: 'white', mb: 1 }}
                            dangerouslySetInnerHTML={{ __html: featuredPost.title.rendered }}
                        />

                        <Button
                            component={RouterLink}
                            to={`/post/${featuredPost.slug}`}
                            variant="outlined"
                            color="inherit"
                            sx={{ alignSelf: 'flex-start', color: 'white', borderColor: 'white' }}
                        >
                            Read Post
                        </Button>
                    </Box>
                </Paper>
            )}

            {/* Post list */}
            <PostList />
        </Box>
    );
};

export default Home;