import { useState } from 'react' 
import { ThemeProvider, createTheme, CssBaseline } from '@mui/material'; 
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'; 
import { Box, Container, Grid } from '@mui/material'; 
 
// Create a theme instance 
const theme = createTheme({ 
  palette: { 
    primary: { 
      main: '#1976d2', // Blue as primary color as specified in design doc 
    }, 
    secondary: { 
      main: '#f50057', 
    }, 
    background: { 
      default: '#f5f5f5', // Light gray background as specified 
    }, 
  }, 
  components: { 
    MuiCard: { 
      styleOverrides: { 
        root: { 
          borderRadius: 8, // Rounded corners for cards 
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)', // Subtle shadows 
        }, 
      }, 
    }, 
  }, 
}); 
 
function App() { 
  return ( 
    <ThemeProvider theme={theme}> 
      <CssBaseline /> {/* Resets CSS to provide consistent base */} 
      <Router> 
        <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}> 
          {/* Header will go here */} 
          <Container maxWidth="lg" sx={{ flex: 1, py: 4 }}> 
            <Grid container spacing={3}> 
              {/* Sidebar - hidden on mobile with sx display property */} 
              <Grid item xs={12} md={3} sx={{ display: { xs: 'none', md: 'block' } }}> 
                {/* Sidebar will go here */} 
              </Grid> 
                
              {/* Main content area */} 
              <Grid item xs={12} md={9}> 
                <Routes> 
                  <Route path="/" element={<div>Home Page</div>} /> 
                  <Route path="/post/:slug" element={<div>Post Detail</div>} /> 
                  {/* Add more routes as needed */} 
                </Routes> 
              </Grid> 
            </Grid> 
          </Container> 
          {/* Footer will go here */} 
        </Box> 
      </Router> 
    </ThemeProvider> 
  ) 
} 
 
export default App 
