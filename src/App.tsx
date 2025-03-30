import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Box, Container, CssBaseline, Grid, useMediaQuery, useTheme } from '@mui/material';
import { Header, Sidebar } from './components/layout';
import Home from './pages/Home';
import CategoryPosts from './pages/CategoryPosts';
import TagPosts from './pages/TagPosts';
import PostDetail from './components/posts/PostDetail';
import Footer from './components/layout/Footer';
import { useAuth } from './services/authService';
// import { testAuthentication } from './services/authService';
// import AuthTest from './components/utils/AuthTest'; // Import AuthTest component - adjust path if needed

const App: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [sidebarOpen, setSidebarOpen] = useState(false);
  // Get authentication status from the auth service
  const { isAuthenticated } = useAuth();
  
  // Add debug logging in development (uncomment if needed)
  /*
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log('Authentication status:', isAuthenticated ? 'Authenticated' : 'Not authenticated');
    }
  }, [isAuthenticated]);
  */

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  // Run authentication test on initial load (uncomment if needed for troubleshooting)
  /*
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      testAuthentication().then(result => {
        console.log('Authentication test result:', result ? 'Success' : 'Failed');
      });
    }
  }, []);
  */

  return (
    <Router>
      <CssBaseline />
      <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <Header onMenuClick={toggleSidebar} sidebarOpen={sidebarOpen} />
        
        {/* Auth Test Button - Uncomment if needed for debugging
        {process.env.NODE_ENV === 'development' && (
          <Box sx={{ position: 'fixed', top: 12, right: 12, zIndex: 9999 }}>
            <Button 
              variant="contained" 
              color="secondary"
              size="small"
              onClick={() => setShowAuthTest(!showAuthTest)}
            >
              {showAuthTest ? 'Hide Auth Test' : 'Show Auth Test'}
            </Button>
          </Box>
        )}
        */}
        
        {/* AuthTest Debug Component - Only in Development 
        {process.env.NODE_ENV === 'development' && showAuthTest && (
          <Container sx={{ mt: 10, mb: 2 }}>
            <AuthTest />
          </Container>
        )}
        */}
        
        <Box component="main" sx={{ flexGrow: 1, py: 3 }}>
          <Container maxWidth="lg">
            <Grid container spacing={3}>
              {/* Sidebar - Hidden on mobile unless opened */}
              <Grid 
                item 
                xs={12} 
                md={3}
                sx={{ 
                  display: isMobile ? (sidebarOpen ? 'block' : 'none') : 'block',
                  position: isMobile ? 'fixed' : 'static',
                  top: isMobile ? 64 : 'auto',
                  left: 0,
                  width: isMobile ? '85%' : 'auto', // Control width on mobile
                  maxWidth: isMobile ? '300px' : 'none',
                  bottom: 0,
                  zIndex: 100,
                  overflowY: 'auto',
                  padding: isMobile ? 2 : 'inherit',
                  backgroundColor: 'background.paper',
                  height: isMobile ? 'calc(100% - 64px)' : 'auto',
                  boxShadow: isMobile ? 3 : 0
                }}
              >
                <Sidebar isAuthenticated={isAuthenticated} />
              </Grid>

              {/* Main Content */}
              <Grid item xs={12} md={isMobile ? 12 : 9}>
                <Routes>
                  <Route path="/" element={<Home />} />
                  <Route path="/posts/category/:slug" element={<CategoryPosts />} />
                  <Route path="/posts/tag/:slug" element={<TagPosts />} />
                  <Route path="/post/:slug" element={<PostDetail />} />
                  {/* Add other routes as needed */}
                </Routes>
              </Grid>
            </Grid>
          </Container>
        </Box>

        <Footer />
      </Box>
    </Router>
  );
};

export default App;