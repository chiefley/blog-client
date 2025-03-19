import React, { useState, useEffect } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import {
    Box,
    Typography,
    TextField,
    List,
    ListItem,
    ListItemText,
    Chip,
    Divider,
    Link,
    Paper,
    InputAdornment,
    CircularProgress
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import { getCategories, getTags } from '../../services/wordpressApi';

// Define types for categories and tags
interface Category {
    id: number;
    name: string;
    slug: string;
    count: number;
}

interface Tag {
    id: number;
    name: string;
    slug: string;
    count: number;
}

const Sidebar: React.FC = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [categories, setCategories] = useState<Category[]>([]);
    const [tags, setTags] = useState<Tag[]>([]);
    const [loading, setLoading] = useState({
        categories: true,
        tags: true
    });

    // Fetch categories and tags when component mounts
    useEffect(() => {
        const fetchData = async () => {
            try {
                const categoriesData = await getCategories();
                setCategories(categoriesData);
                setLoading(prev => ({ ...prev, categories: false }));
                
                const tagsData = await getTags();
                setTags(tagsData);
                setLoading(prev => ({ ...prev, tags: false }));
            } catch (error) {
                console.error('Error fetching sidebar data:', error);
                setLoading({ categories: false, tags: false });
            }
        };

        fetchData();
    }, []);

    const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setSearchTerm(event.target.value);
    };

    const handleSearchSubmit = (event: React.FormEvent) => {
        event.preventDefault();
        if (searchTerm.trim()) {
            window.location.href = `/?search=${encodeURIComponent(searchTerm)}`;
        }
    };

    // Sort categories by count (most posts first)
    const sortedCategories = [...categories].sort((a, b) => b.count - a.count);
    
    // Sort tags by count (most used first)
    const sortedTags = [...tags].sort((a, b) => b.count - a.count).slice(0, 20); // Limit to top 20 tags

    return (
        <Box component={Paper} sx={{ p: 2, borderRadius: 2, bgcolor: 'background.paper' }}>
            {/* Search Section */}
            <Box component="form" onSubmit={handleSearchSubmit} sx={{ mb: 3 }}>
                <Typography variant="h6" gutterBottom>
                    Search
                </Typography>
                <TextField
                    fullWidth
                    size="small"
                    value={searchTerm}
                    onChange={handleSearchChange}
                    placeholder="Search posts..."
                    InputProps={{
                        startAdornment: (
                            <InputAdornment position="start">
                                <SearchIcon />
                            </InputAdornment>
                        ),
                    }}
                />
            </Box>

            <Divider sx={{ my: 2 }} />

            {/* Categories Section */}
            <Box sx={{ mb: 3 }}>
                <Typography variant="h6" gutterBottom>
                    Categories
                </Typography>
                {loading.categories ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
                        <CircularProgress size={24} />
                    </Box>
                ) : (
                    <List dense disablePadding>
                        {sortedCategories.map((category) => (
                            <ListItem
                                key={category.id}
                                disablePadding
                                sx={{ py: 0.5 }}
                                component={RouterLink}
                                to={`/?category=${category.slug}`}
                                style={{ textDecoration: 'none', color: 'inherit' }}
                            >
                                <ListItemText
                                    primary={
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                            <Typography variant="body2">{category.name}</Typography>
                                            <Typography variant="body2" color="text.secondary">
                                                ({category.count})
                                            </Typography>
                                        </Box>
                                    }
                                />
                            </ListItem>
                        ))}
                    </List>
                )}
            </Box>

            <Divider sx={{ my: 2 }} />

            {/* Tags Cloud */}
            <Box sx={{ mb: 3 }}>
                <Typography variant="h6" gutterBottom>
                    Tags
                </Typography>
                {loading.tags ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
                        <CircularProgress size={24} />
                    </Box>
                ) : (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                        {sortedTags.map((tag) => (
                            <Chip
                                key={tag.id}
                                label={tag.name}
                                component={RouterLink}
                                to={`/?tag=${tag.slug}`}
                                size="small"
                                clickable
                                sx={{
                                    // Calculate size based on frequency (more posts = larger font)
                                    fontSize: `${Math.max(0.7, Math.min(1.1, 0.7 + tag.count / 10))}rem`,
                                }}
                            />
                        ))}
                    </Box>
                )}
            </Box>

            <Divider sx={{ my: 2 }} />

            {/* Admin Links (only shown if user is authenticated) */}
            <Box>
                <Typography variant="h6" gutterBottom>
                    Admin
                </Typography>
                <List dense disablePadding>
                    <ListItem disablePadding sx={{ py: 0.5 }}>
                        <Link 
                            href="https://wpcms.thechief.com/wp-admin/"
                            target="_blank"
                            rel="noopener noreferrer"
                            color="primary"
                            underline="hover"
                        >
                            WordPress Admin
                        </Link>
                    </ListItem>
                    <ListItem disablePadding sx={{ py: 0.5 }}>
                        <Link 
                            href="https://wpcms.thechief.com/wp-admin/post-new.php"
                            target="_blank"
                            rel="noopener noreferrer"
                            color="primary"
                            underline="hover"
                        >
                            New Post
                        </Link>
                    </ListItem>
                </List>
            </Box>
        </Box>
    );
};

export default Sidebar;