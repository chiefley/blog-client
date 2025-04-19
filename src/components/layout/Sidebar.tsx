import React from 'react';
import { Box, Paper } from '@mui/material';

// Import the componentized sidebar sections
import Search from './Search';
import Categories from './Categories';
import Tags from './Tags';
import AdminLinks from './AdminLinks';

const Sidebar: React.FC = () => {
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
        
        {/* Show Admin Links only if we're in WordPress admin */}
        {window.location.href.includes('/wp-admin') && (
          <AdminLinks isAuthenticated={true} />
        )}
      </Box>
    </Paper>
  );
};

export default Sidebar;