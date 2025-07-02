// src/App.tsx
import React, { useState, lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Box, Container, CssBaseline, Grid, useMediaQuery, useTheme, CircularProgress } from '@mui/material';
import { ThemeProvider as MuiThemeProvider } from '@mui/material/styles';
import { Header, Sidebar } from './components/layout';
import Footer from './components/layout/Footer';
import { SiteInfoProvider } from './contexts/SiteInfoContext';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider, useAppTheme } from './contexts/ThemeContext';

// Lazy load pages instead of importing them directly
const Home = lazy(() => import('./pages/Home'));
const CategoryPosts = lazy(() => import('./pages/CategoryPosts'));
const TagPosts = lazy(() => import('./pages/TagPosts'));
const PostDetail = lazy(() => import('./components/posts/PostDetail'));
// Add the new GeneticAlgorithmPost page
const GeneticAlgorithmPost = lazy(() => import('./pages/GeneticAlgorithmPost'));

// Loading fallback component
const PageLoader = () => (
  <Box sx={{
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    py: 8,
    minHeight: '400px'
  }}>
    <CircularProgress />
  </Box>
);

// Main app content component
const AppContent: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Header onMenuClick={toggleSidebar} sidebarOpen={sidebarOpen} />

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
                      width: isMobile ? '85%' : 'auto',
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
                    <Sidebar />
                  </Grid>

                  {/* Main Content - Now wrapped in Suspense for lazy loading */}
                  <Grid item xs={12} md={isMobile ? 12 : 9}>
                    <Suspense fallback={<PageLoader />}>
                      <Routes>
                        <Route path="/" element={<Home />} />
                        <Route path="/posts/category/:slug" element={<CategoryPosts />} />
                        <Route path="/posts/tag/:slug" element={<TagPosts />} />
                        <Route path="/post/:slug" element={<PostDetail />} />
                        {/* Route for posts by ID (useful for drafts without slugs) */}
                        <Route path="/post/id/:id" element={<PostDetail />} />
                        {/* Add the new route for the genetic algorithm blog post */}
                        <Route path="/post/genetic-algorithm-with-weasels" element={<GeneticAlgorithmPost />} />
                        {/* Add a fallback route that redirects to home */}
                        <Route path="*" element={<Home />} />
                      </Routes>
                    </Suspense>
                  </Grid>
                </Grid>
              </Container>
            </Box>

      <Footer />
    </Box>
  );
};

// Main App component with all providers
const App: React.FC = () => {
  return (
    <Router>
      <ThemeProvider>
        <AppThemeWrapper />
      </ThemeProvider>
    </Router>
  );
};

// Wrapper component to use the theme from our custom ThemeProvider
const AppThemeWrapper: React.FC = () => {
  const { theme } = useAppTheme();
  
  return (
    <MuiThemeProvider theme={theme}>
      <AuthProvider>
        <SiteInfoProvider>
          <CssBaseline />
          <AppContent />
        </SiteInfoProvider>
      </AuthProvider>
    </MuiThemeProvider>
  );
};

export default App;