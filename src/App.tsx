// src/App.tsx
import { useState, useEffect } from 'react';
import { ThemeProvider, createTheme, CssBaseline } from '@mui/material';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Box, Container, Grid, AppBar, Toolbar, Typography, IconButton } from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import Home from './pages/Home';
import Sidebar from './components/layout/Sidebar'; 
import PostDetail from './components/posts/PostDetail';
import { useAuth } from './services/authService';

// Create a theme instance
const theme = createTheme({
    palette: {
        primary: {
            main: '#1976d2', // Blue as primary color as specified in design doc
        },
        secondary: {
            main: '#f50057',
        },
        background: {
            default: '#f5f5f5', // Light gray background as specified
        },
    },
    components: {
        MuiCard: {
            styleOverrides: {
                root: {
                    borderRadius: 8, // Rounded corners for cards
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)', // Subtle shadows
                },
            },
        },
    },
});

function App() {
    // Track the API initialization
    const [apiInitialized, setApiInitialized] = useState(false);
    
    // Get authentication state from the hook
    const { isAuthenticated } = useAuth();

    // Set API as initialized after auth check
    useEffect(() => {
        // Set apiInitialized to true after a short delay
        // Even without authentication, the app can still run in public mode
        const timer = setTimeout(() => {
            setApiInitialized(true);
            
            if (isAuthenticated) {
                console.log('WordPress API authenticated successfully');
            } else {
                console.warn('WordPress API not authenticated - operating in public mode');
            }
        }, 1000);
        
        return () => clearTimeout(timer);
    }, [isAuthenticated]);

    return (
        <ThemeProvider theme={theme}>
            <CssBaseline /> {/* Resets CSS to provide consistent base */}
            <Router>
                <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
                    {/* Simple header */}
                    <AppBar position="static">
                        <Toolbar>
                            <IconButton
                                size="large"
                                edge="start"
                                color="inherit"
                                aria-label="menu"
                                sx={{ mr: 2, display: { xs: 'block', md: 'none' } }}
                            >
                                <MenuIcon />
                            </IconButton>
                            <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
                                XBlog
                            </Typography>
                        </Toolbar>
                    </AppBar>

                    <Container maxWidth="lg" sx={{ flex: 1, py: 4 }}>
                        <Grid container spacing={3}>
                            {/* Sidebar - hidden on mobile with sx display property */}
                            <Grid item xs={12} md={3} sx={{ display: { xs: 'none', md: 'block' } }}>
                                <Sidebar />  {/* Replace the Box with your actual Sidebar component */}
                            </Grid>

                            {/* Main content area */}
                            <Grid item xs={12} md={9}>
                                {/* Display a loading indicator if API is not initialized yet */}
                                {!apiInitialized ? (
                                    <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                                        <Typography>Initializing API...</Typography>
                                    </Box>
                                ) : (
                                    <Routes>
                                        <Route path="/" element={<Home />} />
                                        <Route path="/post/:slug" element={<PostDetail />} />
                                        {/* Add more routes as needed */}
                                    </Routes>
                                )}
                            </Grid>
                        </Grid>
                    </Container>

                    {/* Simple footer */}
                    <Box component="footer" sx={{ py: 3, bgcolor: 'primary.main', color: 'white' }}>
                        <Container maxWidth="lg">
                            <Typography variant="body2" align="center">
                                © {new Date().getFullYear()} XBlog - Created with React & Material UI
                            </Typography>
                        </Container>
                    </Box>
                </Box>
            </Router>
        </ThemeProvider>
    );
}

export default App;
