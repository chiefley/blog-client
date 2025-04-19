import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Box, Container, CssBaseline, Grid, useMediaQuery, useTheme } from '@mui/material';
import { Header, Sidebar } from './components/layout';
import Home from './pages/Home';
import CategoryPosts from './pages/CategoryPosts';
import TagPosts from './pages/TagPosts';
import PostDetail from './components/posts/PostDetail';
import Footer from './components/layout/Footer';
import { SiteInfoProvider } from './contexts/SiteInfoContext';

const App: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <Router>
      <SiteInfoProvider>
        <CssBaseline />
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
                  <Sidebar />
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
      </SiteInfoProvider>
    </Router>
  );
};

export default App;