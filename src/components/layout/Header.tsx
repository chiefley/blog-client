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
  useTheme,
  Skeleton,
  Menu,
  MenuItem,
  Avatar
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import CloseIcon from '@mui/icons-material/Close';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import { useSiteInfo } from '../../contexts/SiteInfoContext';
import { useAuth } from '../../contexts/AuthContext';

// Props for the Header component
interface HeaderProps {
  onMenuClick: () => void;
  sidebarOpen: boolean;
}

const Header: React.FC<HeaderProps> = ({ onMenuClick, sidebarOpen }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { siteInfo, loading } = useSiteInfo();
  const { user, isAuthenticated, logout } = useAuth();
  
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const userMenuOpen = Boolean(anchorEl);
  
  const navItems = [
    { title: 'Home', path: '/' },
    { title: 'About', path: '/about' },
    { title: 'Contact', path: '/contact' }
  ];

  const handleUserMenuClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleUserMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    logout();
    handleUserMenuClose();
  };

  // Modified logo/title section with site info from WordPress
  const renderSiteTitle = () => {
    if (loading) {
      return (
        <Box sx={{ display: 'flex', alignItems: 'center', flexGrow: 1 }}>
          <Skeleton variant="rectangular" width={36} height={36} sx={{ mr: 1 }} />
          <Skeleton variant="text" width={120} height={28} />
        </Box>
      );
    }

    // Check if there's a logo to display
    if (siteInfo.logo_url) {
      // Find the best logo size to use
      const logoSrc = siteInfo.logo_medium || 
                     siteInfo.logo_thumbnail || 
                     siteInfo.logo_url;
                     
      return (
        <Box 
          component={RouterLink}
          to="/"
          sx={{ 
            flexGrow: 1, 
            display: 'flex',
            alignItems: 'center',
            textDecoration: 'none',
            color: 'inherit'
          }}
        >
          <Box
            component="img"
            src={logoSrc}
            alt={siteInfo.name}
            sx={{ 
              height: 40,
              maxWidth: 180,
              mr: 1
            }}
          />
          {!isMobile && siteInfo.description && (
            <Typography 
              variant="subtitle2" 
              color="text.secondary"
              sx={{ 
                ml: 1,
                fontStyle: 'italic',
                display: { xs: 'none', md: 'block' }
              }}
            >
              {siteInfo.description}
            </Typography>
          )}
        </Box>
      );
    }

    // If no logo, just show the site name
    return (
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
        {siteInfo.name}
        {!isMobile && siteInfo.description && (
          <Typography 
            variant="subtitle2" 
            component="span"
            color="text.secondary"
            sx={{ 
              ml: 1,
              fontStyle: 'italic',
              fontSize: '0.7em',
              display: { xs: 'none', md: 'inline' }
            }}
          >
            {siteInfo.description}
          </Typography>
        )}
      </Typography>
    );
  };

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
        
        {/* Site title/logo from WordPress */}
        {renderSiteTitle()}
        
        {/* Navigation items for desktop */}
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

        {/* User menu */}
        {isAuthenticated && user ? (
          <>
            <IconButton
              onClick={handleUserMenuClick}
              sx={{ ml: 1 }}
              color="inherit"
            >
              <Avatar sx={{ width: 32, height: 32 }}>
                {user.name ? user.name.charAt(0).toUpperCase() : user.username.charAt(0).toUpperCase()}
              </Avatar>
            </IconButton>
            <Menu
              anchorEl={anchorEl}
              open={userMenuOpen}
              onClose={handleUserMenuClose}
              anchorOrigin={{
                vertical: 'bottom',
                horizontal: 'right',
              }}
              transformOrigin={{
                vertical: 'top',
                horizontal: 'right',
              }}
            >
              <MenuItem disabled>
                <Typography variant="body2" color="text.secondary">
                  {user.name || user.username}
                </Typography>
              </MenuItem>
              <MenuItem onClick={handleLogout}>
                Logout
              </MenuItem>
            </Menu>
          </>
        ) : (
          <IconButton
            color="inherit"
            sx={{ ml: 1 }}
            title="Login"
          >
            <AccountCircleIcon />
          </IconButton>
        )}
      </Toolbar>
    </AppBar>
  );
};

export default Header;