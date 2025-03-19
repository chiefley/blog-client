import React, { useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import {
    AppBar,
    Toolbar,
    Typography,
    Button,
    IconButton,
    Drawer,
    List,
    ListItem,
    ListItemText,
    Box,
    Container
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import CloseIcon from '@mui/icons-material/Close';
import Sidebar from './Sidebar';

const Header: React.FC = () => {
    const [drawerOpen, setDrawerOpen] = useState(false);

    const toggleDrawer = () => {
        setDrawerOpen(!drawerOpen);
    };

    const navItems = [
        { name: 'Home', path: '/' },
        { name: 'About', path: '/about' },
        { name: 'Contact', path: '/contact' },
    ];

    return (
        <>
            <AppBar position="static">
                <Container maxWidth="lg">
                    <Toolbar disableGutters>
                        {/* Mobile menu button */}
                        <IconButton
                            size="large"
                            edge="start"
                            color="inherit"
                            aria-label="menu"
                            onClick={toggleDrawer}
                            sx={{ mr: 2, display: { xs: 'block', md: 'none' } }}
                        >
                            <MenuIcon />
                        </IconButton>

                        {/* Logo/Site Title */}
                        <Typography
                            variant="h6"
                            component={RouterLink}
                            to="/"
                            sx={{
                                flexGrow: 1,
                                textDecoration: 'none',
                                color: 'inherit',
                                fontWeight: 'bold'
                            }}
                        >
                            XBlog
                        </Typography>

                        {/* Desktop Navigation */}
                        <Box sx={{ display: { xs: 'none', md: 'flex' } }}>
                            {navItems.map((item) => (
                                <Button
                                    key={item.name}
                                    component={RouterLink}
                                    to={item.path}
                                    color="inherit"
                                >
                                    {item.name}
                                </Button>
                            ))}
                        </Box>
                    </Toolbar>
                </Container>
            </AppBar>

            {/* Mobile Drawer */}
            <Drawer
                anchor="left"
                open={drawerOpen}
                onClose={toggleDrawer}
                sx={{
                    '& .MuiDrawer-paper': {
                        width: '85%',
                        maxWidth: '300px',
                        boxSizing: 'border-box',
                    },
                }}
            >
                <Box sx={{ p: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                        <Typography variant="h6">Menu</Typography>
                        <IconButton onClick={toggleDrawer}>
                            <CloseIcon />
                        </IconButton>
                    </Box>

                    {/* Navigation Links */}
                    <List>
                        {navItems.map((item) => (
                            <ListItem
                                key={item.name}
                                button
                                component={RouterLink}
                                to={item.path}
                                onClick={toggleDrawer}
                            >
                                <ListItemText primary={item.name} />
                            </ListItem>
                        ))}
                    </List>

                    {/* Mobile Sidebar */}
                    <Box sx={{ mt: 2 }}>
                        <Sidebar />
                    </Box>
                </Box>
            </Drawer>
        </>
    );
};

export default Header;