import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Button, 
  Typography, 
  Paper, 
  Alert, 
  CircularProgress, 
  Divider,
  TextField
} from '@mui/material';
import { useAuth, testAuthentication, createAuthHeader } from '../../services/authService';

/**
 * A component to test WordPress authentication
 * Place this in src/components/utils/AuthTest.tsx
 */
const AuthTest: React.FC = () => {
  const { isAuthenticated, authHeader } = useAuth();
  const [testResult, setTestResult] = useState<{success: boolean, message: string} | null>(null);
  const [testing, setTesting] = useState(false);
  const [apiEndpoint, setApiEndpoint] = useState('/wp-json/wp/v2/users/me');
  const [responseData, setResponseData] = useState<string | null>(null);

  // Check environment variables
  const envUsername = import.meta.env.VITE_WP_APP_USERNAME || 'Not found';
  const envPassword = import.meta.env.VITE_WP_APP_PASSWORD ? 'Set (hidden)' : 'Not found';
  
  // For manual testing - don't store actual credentials here in production
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  useEffect(() => {
    // Clean up any test results when auth status changes
    setTestResult(null);
  }, [isAuthenticated]);

  const runAuthTest = async () => {
    setTesting(true);
    setResponseData(null);
    try {
      const result = await testAuthentication();
      setTestResult({
        success: result,
        message: result 
          ? 'Authentication successful! Your credentials are working.'
          : 'Authentication failed. Check your credentials and WordPress setup.'
      });
    } catch (error) {
      setTestResult({
        success: false,
        message: `Error during testing: ${error instanceof Error ? error.message : String(error)}`
      });
    } finally {
      setTesting(false);
    }
  };

  const testCustomEndpoint = async () => {
    setTesting(true);
    setResponseData(null);
    
    try {
      const baseUrl = import.meta.env.VITE_WP_API_BASE_URL || 'https://wpcms.thechief.com';
      const fullUrl = `${baseUrl}${apiEndpoint}`;
      
      // Get auth header
      const auth = authHeader || createAuthHeader();
      
      console.log('Testing endpoint:', fullUrl);
      console.log('With auth header:', !!auth);
      
      const response = await fetch(fullUrl, {
        headers: {
          ...(auth || {}),
          'Content-Type': 'application/json'
        }
      });
      
      console.log('Response status:', response.status);
      
      let data: any;
      
      // Try to parse as JSON first
      try {
        data = await response.json();
      } catch (e) {
        // If not JSON, get as text
        data = await response.text();
      }
      
      setResponseData(JSON.stringify(data, null, 2));
      
      setTestResult({
        success: response.ok,
        message: response.ok 
          ? `Success! Status: ${response.status}`
          : `Failed with status: ${response.status}`
      });
    } catch (error) {
      setTestResult({
        success: false,
        message: `Error during testing: ${error instanceof Error ? error.message : String(error)}`
      });
      
      setResponseData(`${error}`);
    } finally {
      setTesting(false);
    }
  };
  
  // Test with manual credentials
  const testManualCredentials = async () => {
    if (!username || !password) {
      setTestResult({
        success: false,
        message: 'Please enter both username and password'
      });
      return;
    }
    
    setTesting(true);
    setResponseData(null);
    
    try {
      const baseUrl = import.meta.env.VITE_WP_API_BASE_URL || 'https://wpcms.thechief.com';
      const fullUrl = `${baseUrl}/wp-json/wp/v2/users/me`;
      
      // Create base64 encoded credentials
      const credentials = `${username}:${password}`;
      let encodedCredentials;
      
      try {
        encodedCredentials = btoa(credentials);
      } catch (e) {
        setTestResult({
          success: false,
          message: `Error encoding credentials: ${e}. Check for special characters.`
        });
        setTesting(false);
        return;
      }
      
      console.log('Testing with manual credentials');
      
      const response = await fetch(fullUrl, {
        headers: {
          'Authorization': `Basic ${encodedCredentials}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('Response status:', response.status);
      
      let data: any;
      
      // Try to parse as JSON first
      try {
        data = await response.json();
      } catch (e) {
        // If not JSON, get as text
        data = await response.text();
      }
      
      setResponseData(JSON.stringify(data, null, 2));
      
      setTestResult({
        success: response.ok,
        message: response.ok 
          ? `Success with manual credentials! Status: ${response.status}`
          : `Failed with manual credentials. Status: ${response.status}`
      });
    } catch (error) {
      setTestResult({
        success: false,
        message: `Error during testing: ${error instanceof Error ? error.message : String(error)}`
      });
      
      setResponseData(`${error}`);
    } finally {
      setTesting(false);
    }
  };

  return (
    <Paper sx={{ p: 2, mb: 3 }}>
      <Typography variant="h6" gutterBottom>
        WordPress Authentication Test
      </Typography>
      
      <Box sx={{ mb: 2 }}>
        <Typography>
          Current Status: {isAuthenticated ? (
            <strong style={{ color: 'green' }}>Credentials Found</strong>
          ) : (
            <strong style={{ color: 'red' }}>No Credentials</strong>
          )}
        </Typography>
        
        <Typography variant="body2" sx={{ mt: 1 }}>
          Auth Header: {authHeader ? 'Available' : 'Not Available'}
        </Typography>
        
        <Box sx={{ mt: 2, p: 1, bgcolor: '#f5f5f5', borderRadius: 1 }}>
          <Typography variant="body2">
            Environment Variables:
          </Typography>
          <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
            VITE_WP_APP_USERNAME: {envUsername}
          </Typography>
          <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
            VITE_WP_APP_PASSWORD: {envPassword}
          </Typography>
        </Box>
      </Box>
      
      <Divider sx={{ my: 2 }} />
      
      <Typography variant="subtitle1" gutterBottom>
        1. Test With Environment Variables
      </Typography>
      
      <Button 
        variant="contained" 
        onClick={runAuthTest}
        disabled={testing}
        sx={{ mb: 2 }}
      >
        {testing ? <CircularProgress size={24} /> : 'Test Authentication'}
      </Button>
      
      <Divider sx={{ my: 2 }} />
      
      <Typography variant="subtitle1" gutterBottom>
        2. Test Custom Endpoint
      </Typography>
      
      <TextField
        fullWidth
        label="API Endpoint"
        value={apiEndpoint}
        onChange={(e) => setApiEndpoint(e.target.value)}
        margin="normal"
        variant="outlined"
        size="small"
        sx={{ mb: 1 }}
      />
      
      <Button 
        variant="contained" 
        onClick={testCustomEndpoint}
        disabled={testing}
        sx={{ mb: 2 }}
      >
        {testing ? <CircularProgress size={24} /> : 'Test Endpoint'}
      </Button>
      
      <Divider sx={{ my: 2 }} />
      
      <Typography variant="subtitle1" gutterBottom>
        3. Test With Manual Credentials
      </Typography>
      
      <TextField
        label="Username"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        margin="normal"
        variant="outlined"
        size="small"
        fullWidth
        sx={{ mb: 1 }}
      />
      
      <TextField
        label="Password"
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        margin="normal"
        variant="outlined"
        size="small"
        fullWidth
        sx={{ mb: 1 }}
      />
      
      <Button 
        variant="contained" 
        onClick={testManualCredentials}
        disabled={testing || !username || !password}
        sx={{ mb: 2 }}
      >
        {testing ? <CircularProgress size={24} /> : 'Test Manual Credentials'}
      </Button>
      
      {testResult && (
        <Alert severity={testResult.success ? 'success' : 'error'} sx={{ mb: 2 }}>
          {testResult.message}
        </Alert>
      )}
      
      {responseData && (
        <Box sx={{ mt: 2 }}>
          <Typography variant="subtitle2" gutterBottom>
            Response Data:
          </Typography>
          <Box 
            sx={{ 
              p: 1.5, 
              bgcolor: '#f5f5f5', 
              borderRadius: 1, 
              maxHeight: '200px',
              overflow: 'auto',
              fontFamily: 'monospace',
              fontSize: '0.85rem',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word'
            }}
          >
            {responseData}
          </Box>
        </Box>
      )}
      
      <Typography variant="body2" sx={{ mt: 2, fontStyle: 'italic' }}>
        Note: Make sure your WordPress REST API and authentication plugin are properly configured.
      </Typography>
    </Paper>
  );
};

export default AuthTest;