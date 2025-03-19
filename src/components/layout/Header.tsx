import React, { useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Drawer,
  List,
  ListItem,
  ListItemText,
  Box,
  Button
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';

// Custom link component that works around type issues
const ListItemWithLink = (props: {
  to: string;
  primary: string;
  onClick?: () => void;
}) => {
  const { to, primary, onClick } = props;
  
  return (
    <ListItem 
      sx={{ 
        '&:hover': { 
          backgroundColor: 'rgba(0, 0, 0, 0.04)' 
        },
        padding: 0  // Remove padding to make the link take up the full area
      }}
    >
      <RouterLink 
        to={to} 
        onClick={onClick}
        style={{
          textDecoration: 'none',
          color: 'inherit',
          display: 'flex',
          width: '100%',
          padding: '8px 16px'  // Add padding back to the link
        }}
      >
        <ListItemText primary={primary} />
      </RouterLink>
    </ListItem>
  );
};

const Header: React.FC = () => {
  const [drawerOpen, setDrawerOpen] = useState(false);

  const toggleDrawer = (open: boolean) => () => {
    setDrawerOpen(open);
  };

  const navItems = [
    { title: 'Home', path: '/' },
    { title: 'About', path: '/about' },
    { title: 'Contact', path: '/contact' }
  ];

  const drawer = (
    <Box 
      sx={{ width: 250 }}
      role="presentation"
      onClick={toggleDrawer(false)}
    >
      <List>
        {navItems.map((item) => (
          <ListItemWithLink
            key={item.path}
            to={item.path}
            primary={item.title}
            onClick={toggleDrawer(false)}
          />
        ))}
      </List>
    </Box>
  );

  return (
    <>
      <AppBar position="static">
        <Toolbar>
          <IconButton
            size="large"
            edge="start"
            color="inherit"
            aria-label="menu"
            sx={{ mr: 2, display: { xs: 'block', md: 'none' } }}
            onClick={toggleDrawer(true)}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
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
      <Drawer
        anchor="left"
        open={drawerOpen}
        onClose={toggleDrawer(false)}
      >
        {drawer}
      </Drawer>
    </>
  );
};

export default Header;
