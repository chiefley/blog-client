import React from 'react';
import { Link as RouterLink } from 'react-router-dom';
import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Box,
  Button,
  useMediaQuery,
  useTheme
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import CloseIcon from '@mui/icons-material/Close';

// Props for the Header component
interface HeaderProps {
  onMenuClick: () => void;
  sidebarOpen: boolean;
}

const Header: React.FC<HeaderProps> = ({ onMenuClick, sidebarOpen }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  const navItems = [
    { title: 'Home', path: '/' },
    { title: 'About', path: '/about' },
    { title: 'Contact', path: '/contact' }
  ];

  // Mobile navigation items are now handled directly in App.tsx through the sidebar

  return (
    <AppBar position="sticky">
      <Toolbar>
        <IconButton
          size="large"
          edge="start"
          color="inherit"
          aria-label={sidebarOpen ? "close sidebar" : "open sidebar"}
          sx={{ mr: 2 }}
          onClick={onMenuClick}
        >
          {isMobile && (sidebarOpen ? <CloseIcon /> : <MenuIcon />)}
          {!isMobile && <MenuIcon />}
        </IconButton>
        
        <Typography 
          variant="h6" 
          component={RouterLink} 
          to="/"
          sx={{ 
            flexGrow: 1, 
            textDecoration: 'none',
            color: 'inherit'
          }}
        >
          XBlog
        </Typography>
        
        <Box sx={{ display: { xs: 'none', md: 'block' } }}>
          {navItems.map((item) => (
            <Button 
              key={item.path}
              component={RouterLink}
              to={item.path}
              color="inherit"
              sx={{ mx: 1 }}
            >
              {item.title}
            </Button>
          ))}
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Header;