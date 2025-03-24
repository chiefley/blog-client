import React from 'react';
import { Box, Paper } from '@mui/material';

// Import the componentized sidebar sections
import Search from './Search';
import Categories from './Categories';
import Tags from './Tags';
import AdminLinks from './AdminLinks';

interface SidebarProps {
  isAuthenticated?: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({ isAuthenticated = false }) => {
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
        
        {/* Admin Links Component - only shown if authenticated */}
        <AdminLinks isAuthenticated={isAuthenticated} />
      </Box>
    </Paper>
  );
};

export default Sidebar;