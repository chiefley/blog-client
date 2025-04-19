import React from 'react';
import { Box, Container, Typography, Link, Grid } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import { useSiteInfo } from '../../contexts/SiteInfoContext';

const Footer: React.FC = () => {
    const currentYear = new Date().getFullYear();
    const { siteInfo } = useSiteInfo();

    return (
        <Box component="footer" sx={{ py: 3, bgcolor: 'primary.main', color: 'white', mt: 'auto' }}>
            <Container maxWidth="lg">
                <Grid container spacing={3}>
                    <Grid item xs={12} md={4}>
                        <Typography variant="h6" gutterBottom>
                            {siteInfo.name}
                        </Typography>
                        <Typography variant="body2">
                            {siteInfo.description || 'A modern React blog with WordPress backend'}
                        </Typography>
                    </Grid>
                    <Grid item xs={12} md={4}>
                        <Typography variant="h6" gutterBottom>
                            Links
                        </Typography>
                        <Link 
                            component={RouterLink} 
                            to="/"
                            color="inherit"
                            sx={{ display: 'block', mb: 1 }}
                        >
                            Home
                        </Link>
                        <Link 
                            component={RouterLink} 
                            to="/about"
                            color="inherit"
                            sx={{ display: 'block', mb: 1 }}
                        >
                            About
                        </Link>
                        <Link 
                            component={RouterLink} 
                            to="/contact"
                            color="inherit"
                            sx={{ display: 'block' }}
                        >
                            Contact
                        </Link>
                    </Grid>
                    <Grid item xs={12} md={4}>
                        <Typography variant="h6" gutterBottom>
                            WordPress
                        </Typography>
                        <Link 
                            href={`${siteInfo.url}/wp-admin/`}
                            target="_blank"
                            rel="noopener noreferrer"
                            color="inherit"
                            sx={{ display: 'block', mb: 1 }}
                        >
                            Admin Login
                        </Link>
                        <Link 
                            href="https://wordpress.com/"
                            target="_blank"
                            rel="noopener noreferrer"
                            color="inherit"
                            sx={{ display: 'block' }}
                        >
                            WordPress.com
                        </Link>
                    </Grid>
                </Grid>
                <Typography variant="body2" align="center" sx={{ mt: 4 }}>
                    © {currentYear} {siteInfo.name}. All rights reserved.
                </Typography>
            </Container>
        </Box>
    );
};

export default Footer;