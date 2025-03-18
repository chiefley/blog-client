import React from 'react';
import {
    Typography,
    Paper,
    Box,
    Button,
    Card,
    CardContent,
    CardActions,
    Divider
} from '@mui/material';

const Home: React.FC = () => {
    const [clickCount, setClickCount] = React.useState(0);

    const handleClick = () => {
        setClickCount(prevCount => prevCount + 1);
    };

    return (
        <Box sx={{ width: '100%' }}>
            {/* Hero section */}
            <Paper
                elevation={3}
                sx={{
                    p: 4,
                    mb: 4,
                    borderRadius: 2,
                    background: 'linear-gradient(45deg, #1976d2 30%, #42a5f5 90%)',
                    color: 'white'
                }}
            >
                <Typography variant="h3" component="h1" gutterBottom>
                    Welcome to XBlog
                </Typography>
                <Typography variant="h6">
                    A Modern React Blog with WordPress Backend
                </Typography>
            </Paper>

            {/* Test card to verify Material UI styling */}
            <Card sx={{ mb: 4 }}>
                <CardContent>
                    <Typography variant="h5" component="h2" gutterBottom>
                        Hello World!
                    </Typography>
                    <Typography variant="body1">
                        This is a simple test page to verify that your React setup with Material UI
                        is working correctly. You've successfully created your first page component.
                    </Typography>
                    <Box sx={{ my: 2 }}>
                        <Typography variant="body2" color="text.secondary">
                            From here, you can:
                        </Typography>
                        <ul>
                            <li>Create more components in the src/components directory</li>
                            <li>Set up WordPress API integration using the service you've already created</li>
                            <li>Implement routing to different pages</li>
                        </ul>
                    </Box>
                    <Divider sx={{ my: 2 }} />
                    <Typography variant="body1">
                        Button click count: {clickCount}
                    </Typography>
                </CardContent>
                <CardActions>
                    <Button
                        variant="contained"
                        color="primary"
                        onClick={handleClick}
                    >
                        Click Me
                    </Button>
                </CardActions>
            </Card>

            {/* Debug info section */}
            <Paper elevation={1} sx={{ p: 2, bgcolor: '#f5f5f5' }}>
                <Typography variant="overline">DEBUG INFO</Typography>
                <Typography variant="body2">
                    React and Material UI are correctly installed and working.
                    Theme is properly applied with blue primary color.
                </Typography>
            </Paper>
        </Box>
    );
};

export default Home;