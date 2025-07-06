# Simple Auth for REST API

A lightweight token-based authentication plugin for WordPress REST API with full multisite support.

## Features

- **Simple Token-Based Authentication**: No complex JWT configuration required
- **Multisite Support**: Automatic table creation for each site in a multisite network
- **Auto-Table Creation**: Tables are created automatically when needed
- **Secure Token Storage**: Tokens stored in database with expiration
- **CORS Support**: Built-in CORS headers for cross-origin requests
- **Draft Post Access**: Authenticated users can view draft posts via REST API
- **Token Cleanup**: Automatic cleanup of expired tokens

## Installation

1. Upload the plugin folder to `/wp-content/plugins/` or `/wp-content/mu-plugins/` for network-wide activation
2. Activate the plugin through the WordPress admin panel
3. For multisite: Network activate to enable on all sites

## Multisite Features

The plugin is fully multisite-aware:

- **Automatic Table Creation**: Each site gets its own `wp_X_simple_auth_tokens` table (where X is the blog ID)
- **Network Activation**: When network activated, tables are created for all existing sites
- **New Site Support**: Tables are automatically created when new sites are added to the network
- **Site Deletion**: Token tables are automatically removed when sites are deleted
- **Table Prefix Handling**: Correctly handles different table prefixes for each site

## API Endpoints

### Login
```
POST /wp-json/simple-auth/v1/login
Body: { "username": "user", "password": "pass" }
Response: { "success": true, "token": "...", "user": {...}, "expires_in": 604800 }
```

### Verify Token
```
GET /wp-json/simple-auth/v1/verify
Headers: Authorization: Bearer YOUR_TOKEN
Response: { "id": 1, "username": "user", ... }
```

### Refresh Token
```
POST /wp-json/simple-auth/v1/refresh
Headers: Authorization: Bearer YOUR_TOKEN
Response: { "success": true, "token": "...", "expires_in": 604800 }
```

### Logout
```
POST /wp-json/simple-auth/v1/logout
Headers: Authorization: Bearer YOUR_TOKEN
Response: { "success": true, "message": "Logged out successfully" }
```

## Configuration

### Token Expiry
Default: 7 days. Can be modified by defining:
```php
define('SIMPLE_AUTH_TOKEN_EXPIRY', 14 * DAY_IN_SECONDS); // 14 days
```

### CORS Origins
Add allowed origins via filter:
```php
add_filter('simple_auth_allowed_origins', function($origins) {
    $origins[] = 'https://myapp.com';
    return $origins;
});
```

## Usage in Client Applications

Include the token in the Authorization header:
```javascript
fetch('https://yoursite.com/wp-json/wp/v2/posts', {
    headers: {
        'Authorization': 'Bearer YOUR_TOKEN_HERE'
    }
})
```

## Database Schema

The plugin creates a table for each site with the following structure:
- `id`: Primary key
- `user_id`: WordPress user ID
- `token`: Unique token string
- `expires_at`: Token expiration timestamp
- `created_at`: Token creation timestamp
- `last_used`: Last usage timestamp

## Troubleshooting

### Table Creation Issues
The plugin automatically creates tables when needed. If you encounter issues:
1. Check WordPress debug log for errors
2. Ensure database user has CREATE TABLE permissions
3. For multisite, verify the plugin is network activated

### Token Not Working
1. Check token hasn't expired
2. Verify Authorization header is being sent
3. Check CORS settings if making cross-origin requests

## Security Notes

- Tokens are generated using cryptographically secure random bytes
- Expired tokens are automatically cleaned up daily
- Each token is unique and tied to a specific user
- Tokens are invalidated on logout

## License

GPL v2 or later