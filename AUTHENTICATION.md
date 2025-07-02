# Authentication Documentation

## Overview

The blog client uses **Simple Auth**, a custom WordPress plugin that provides token-based authentication for the REST API. This replaces the previous JWT Authentication plugin with a simpler, more reliable solution.

## Architecture

### WordPress Side
- **Plugin**: Simple Auth for REST API (`wordpress-simple-auth/`)
- **Database**: Tokens stored in `wp_simple_auth_tokens` table
- **Endpoints**: `/wp-json/simple-auth/v1/*`
- **Token Format**: 64-character secure random string
- **Expiry**: 7 days (configurable)

### React Client Side
- **Service**: `src/services/simpleAuth.ts`
- **Context**: `src/contexts/SimpleAuthContext.tsx`
- **Storage**: localStorage with keys:
  - `wp_simple_auth_token`
  - `wp_simple_auth_user`
  - `wp_simple_auth_expires`

## API Endpoints

### Login
```typescript
POST /wp-json/simple-auth/v1/login
Content-Type: application/json

{
  "username": "your-username",
  "password": "your-password"
}

Response:
{
  "success": true,
  "token": "64-character-token",
  "user": {
    "id": 1,
    "username": "user",
    "email": "user@example.com",
    "display_name": "User Name",
    "roles": ["subscriber"],
    "capabilities": {
      "read_private_posts": false,
      "edit_posts": false
    }
  },
  "expires_in": 604800  // seconds (7 days)
}
```

### Verify Token
```typescript
GET /wp-json/simple-auth/v1/verify
Authorization: Bearer <token>

Response:
{
  "success": true,
  "user": { /* user object */ }
}
```

### Refresh Token
```typescript
POST /wp-json/simple-auth/v1/refresh
Authorization: Bearer <current-token>

Response:
{
  "success": true,
  "token": "new-token",
  "expires_in": 604800
}
```

### Logout
```typescript
POST /wp-json/simple-auth/v1/logout
Authorization: Bearer <token>

Response:
{
  "success": true,
  "message": "Successfully logged out"
}
```

## Client Usage

### Using SimpleAuthContext

```typescript
import { useAuth } from './contexts/SimpleAuthContext';

function LoginComponent() {
  const { login, logout, isAuthenticated, user, error } = useAuth();
  
  const handleLogin = async (username: string, password: string) => {
    const success = await login(username, password);
    if (success) {
      console.log('Logged in as:', user?.display_name);
    }
  };
  
  return (
    <div>
      {isAuthenticated ? (
        <button onClick={logout}>Logout</button>
      ) : (
        <LoginForm onSubmit={handleLogin} />
      )}
      {error && <div className="error">{error}</div>}
    </div>
  );
}
```

### Making Authenticated API Calls

```typescript
import { createSimpleAuthHeader } from './services/simpleAuth';

async function fetchDraftPosts() {
  const response = await fetch(`${API_URL}/posts`, {
    headers: {
      ...createSimpleAuthHeader(),
      'Content-Type': 'application/json'
    }
  });
  
  // Authenticated users will see draft posts
  const posts = await response.json();
  return posts;
}
```

## Features

### Draft Post Access
When authenticated, the WordPress REST API automatically includes draft posts in responses:
- `/wp-json/wp/v2/posts` returns both published and draft posts
- Draft status is indicated by `post.status === 'draft'`

### Multisite Support
The plugin works across WordPress multisite installations:
- Login response includes user's blogs
- Token valid across all sites in the network
- Blog-specific capabilities included

### CORS Handling
The plugin automatically handles CORS headers for configured origins:
```php
// Default allowed origins:
- http://localhost:5173
- http://localhost:3000
- https://wa1x.thechief.com
- https://applefinch.thechief.com
```

Add custom origins via filter:
```php
add_filter('simple_auth_allowed_origins', function($origins) {
    $origins[] = 'https://your-domain.com';
    return $origins;
});
```

## Security Considerations

1. **Token Storage**: Tokens are stored in localStorage (XSS vulnerable)
   - Consider using httpOnly cookies for production
   - Implement CSP headers to mitigate XSS

2. **Token Rotation**: Tokens don't rotate automatically
   - Implement periodic refresh (client does this every 6 days)
   - Force rotation on sensitive actions

3. **Rate Limiting**: Not implemented by default
   - Consider adding rate limiting to login endpoint
   - WordPress has some built-in brute force protection

4. **HTTPS Required**: Always use HTTPS in production
   - Tokens transmitted in headers
   - Credentials sent during login

## Troubleshooting

### Common Issues

**401 Unauthorized**
- Token expired (check localStorage)
- Token invalid or revoked
- User permissions changed

**CORS Errors**
- Domain not in allowed origins
- Plugin not activated
- Preflight request failing

**Login Fails**
- Wrong credentials
- User lacks required capabilities
- Database connection issues

### Debug Commands

```javascript
// Check current auth state
console.log('Token:', localStorage.getItem('wp_simple_auth_token'));
console.log('User:', JSON.parse(localStorage.getItem('wp_simple_auth_user') || '{}'));
console.log('Expires:', new Date(parseInt(localStorage.getItem('wp_simple_auth_expires') || '0')));

// Force logout
localStorage.removeItem('wp_simple_auth_token');
localStorage.removeItem('wp_simple_auth_user');
localStorage.removeItem('wp_simple_auth_expires');
location.reload();
```

## Migration from JWT

See `MIGRATION_TO_SIMPLE_AUTH.md` for detailed migration instructions.

Key differences:
- No JWT signing/verification
- Simpler configuration
- Database-backed tokens
- Better error messages
- Automatic CORS handling

## Configuration

### WordPress Configuration

```php
// Change token expiry (wp-config.php)
define('SIMPLE_AUTH_TOKEN_EXPIRY', 30 * DAY_IN_SECONDS); // 30 days

// Custom allowed origins
add_filter('simple_auth_allowed_origins', function($origins) {
    $origins[] = 'https://custom-domain.com';
    return $origins;
});
```

### Client Configuration

```typescript
// Environment variables (.env)
VITE_WP_API_BASE_URL=https://wpcms.thechief.com

// No auth-specific configuration needed!
```

## Testing

Use the included test page to verify authentication:
```bash
# Open in browser
open test-simple-auth.html
```

Or test via curl:
```bash
# Login
curl -X POST https://your-site.com/wp-json/simple-auth/v1/login \
  -H "Content-Type: application/json" \
  -d '{"username":"user","password":"pass"}'

# Use token
curl https://your-site.com/wp-json/wp/v2/posts \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```