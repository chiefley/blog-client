import React from 'react';
import { 
  List, 
  ListItem, 
  ListItemIcon, 
  ListItemText, 
  Typography, 
  Divider, 
  Box 
} from '@mui/material';
import { 
  Dashboard as DashboardIcon,
  Edit as EditIcon,
  Settings as SettingsIcon,
  ExitToApp as LogoutIcon
} from '@mui/icons-material';
import { Link as RouterLink } from 'react-router-dom';

// Props interface
interface AdminLinksProps {
  title?: string;
  isAuthenticated?: boolean;
  adminUrl?: string;
}

const AdminLinks: React.FC<AdminLinksProps> = ({ 
  title = "Admin", 
  isAuthenticated = false,
  adminUrl = "https://wpcms.thechief.com/wp-admin"
}) => {
  // If user is not authenticated, don't render anything
  if (!isAuthenticated) {
    return null;
  }

  return (
    <Box sx={{ mb: 4 }}>
      <Typography variant="h6" sx={{ mb: 1 }}>
        {title}
      </Typography>
      <Divider sx={{ mb: 2 }} />
      <List dense>
        <ListItem 
          component="a" 
          href={`${adminUrl}/index.php`}
          target="_blank"
          rel="noopener noreferrer"
          sx={{ 
            textDecoration: 'none', 
            color: 'inherit',
            '&:hover': {
              backgroundColor: 'rgba(0, 0, 0, 0.04)',
            }
          }}
        >
          <ListItemIcon sx={{ minWidth: 36 }}>
            <DashboardIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText 
            primary="Dashboard" 
            sx={{
              '& .MuiListItemText-primary': {
                fontSize: '0.95rem',
              }
            }}
          />
        </ListItem>
        
        <ListItem 
          component="a" 
          href={`${adminUrl}/post-new.php`}
          target="_blank"
          rel="noopener noreferrer"
          sx={{ 
            textDecoration: 'none', 
            color: 'inherit',
            '&:hover': {
              backgroundColor: 'rgba(0, 0, 0, 0.04)',
            }
          }}
        >
          <ListItemIcon sx={{ minWidth: 36 }}>
            <EditIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText 
            primary="New Post" 
            sx={{
              '& .MuiListItemText-primary': {
                fontSize: '0.95rem',
              }
            }}
          />
        </ListItem>
        
        <ListItem 
          component="a" 
          href={`${adminUrl}/options-general.php`}
          target="_blank"
          rel="noopener noreferrer"
          sx={{ 
            textDecoration: 'none', 
            color: 'inherit',
            '&:hover': {
              backgroundColor: 'rgba(0, 0, 0, 0.04)',
            }
          }}
        >
          <ListItemIcon sx={{ minWidth: 36 }}>
            <SettingsIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText 
            primary="Settings" 
            sx={{
              '& .MuiListItemText-primary': {
                fontSize: '0.95rem',
              }
            }}
          />
        </ListItem>
        
        <ListItem 
          component={RouterLink}
          to="/logout"
          sx={{ 
            textDecoration: 'none', 
            color: 'inherit',
            '&:hover': {
              backgroundColor: 'rgba(0, 0, 0, 0.04)',
            }
          }}
        >
          <ListItemIcon sx={{ minWidth: 36 }}>
            <LogoutIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText 
            primary="Logout" 
            sx={{
              '& .MuiListItemText-primary': {
                fontSize: '0.95rem',
              }
            }}
          />
        </ListItem>
      </List>
    </Box>
  );
};

export default AdminLinks;