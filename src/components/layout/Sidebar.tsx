import React from 'react';
import { Box, Paper } from '@mui/material';
import { useAuth } from '../../contexts/AuthContext';
import { getCurrentBlogPath } from '../../config/multisiteConfig';

// Import the componentized sidebar sections
import Search from './Search';
import Categories from './Categories';
import Tags from './Tags';
import AdminLinks from './AdminLinks';

const Sidebar: React.FC = () => {
  const { isAuthenticated } = useAuth();
  
  // Get the current blog path for admin URL
  const blogPath = getCurrentBlogPath();
  const adminUrl = `https://wpcms.thechief.com${blogPath ? `/${blogPath}` : ''}/wp-admin`;
  return (
    <Paper 
      elevation={1} 
      sx={{ 
        p: 2, 
        borderRadius: 2, 
        height: '100%',
        overflow: 'auto'
      }}
    >
      <Box sx={{ display: 'flex', flexDirection: 'column' }}>
        {/* Search Component */}
        <Search />
        
        {/* Categories Component */}
        <Categories />
        
        {/* Tags Component */}
        <Tags maxTags={20} />
        
        {/* Show Admin Links only if authenticated */}
        {isAuthenticated && (
          <AdminLinks isAuthenticated={isAuthenticated} adminUrl={adminUrl} />
        )}
      </Box>
    </Paper>
  );
};

export default Sidebar;