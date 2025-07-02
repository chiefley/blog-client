# Simple Auth for WordPress REST API

A lightweight, reliable authentication plugin for WordPress REST API that replaces complex JWT implementations with a simple token-based system.

## Features

- ✅ Simple token-based authentication
- ✅ No complex JWT configuration required
- ✅ Database-backed token storage
- ✅ Automatic expired token cleanup
- ✅ Multisite compatible
- ✅ CORS headers support
- ✅ Draft post preview support for authenticated users
- ✅ Multiple authentication header formats supported

## Installation

1. Upload the `wordpress-simple-auth` folder to your `/wp-content/plugins/` directory
2. Activate the plugin through the 'Plugins' menu in WordPress
3. For multisite: Network activate for all sites

## API Endpoints

### Login
```
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
  "expires_in": 604800
}
```

### Verify Token
```
GET /wp-json/simple-auth/v1/verify
Authorization: Bearer your-token-here

Response:
{
  "success": true,
  "user": {
    "id": 1,
    "username": "user",
    "email": "user@example.com",
    "display_name": "User Name",
    "roles": ["subscriber"]
  }
}
```

### Refresh Token
```
POST /wp-json/simple-auth/v1/refresh
Authorization: Bearer your-current-token

Response:
{
  "success": true,
  "token": "new-64-character-token",
  "expires_in": 604800
}
```

### Logout
```
POST /wp-json/simple-auth/v1/logout
Authorization: Bearer your-token-here

Response:
{
  "success": true,
  "message": "Successfully logged out"
}
```

## Using Authentication

Include the token in your API requests using either:

### Authorization Header (Preferred)
```
Authorization: Bearer your-token-here
```

### X-Auth-Token Header (Alternative)
```
X-Auth-Token: your-token-here
```

## Configuration

### CORS Origins

Add custom allowed origins using the filter:

```php
add_filter('simple_auth_allowed_origins', function($origins) {
    $origins[] = 'https://your-domain.com';
    return $origins;
});
```

### Token Expiry

Default expiry is 7 days. To change:

```php
define('SIMPLE_AUTH_TOKEN_EXPIRY', 14 * DAY_IN_SECONDS); // 14 days
```

## Features for Developers

### Draft Post Access

Authenticated users automatically see draft posts in REST API responses:
- `/wp-json/wp/v2/posts` includes drafts when authenticated
- `/wp-json/wp/v2/pages` includes drafts when authenticated

### Multisite Support

On multisite installations, login response includes:
- List of user's blogs
- Current blog ID

### Token Management

- Tokens are stored in database table `wp_simple_auth_tokens`
- Automatic daily cleanup of expired tokens
- Each token tracks creation time and last used time

## Security Notes

- Tokens are cryptographically secure random 64-character strings
- All tokens have expiry dates
- Old tokens are revoked when refreshing
- User capabilities are checked on login
- Supports standard WordPress user roles and capabilities

## Troubleshooting

### CORS Issues
- Ensure your domain is in the allowed origins list
- Check that the plugin is activated
- Verify OPTIONS requests return 200 status

### Token Not Working
- Check token hasn't expired (7 days by default)
- Ensure proper header format: `Bearer <token>`
- Verify user still has required permissions

### Database Table Not Created
- Deactivate and reactivate the plugin
- Check WordPress error logs for database errors
- Ensure database user has CREATE TABLE permissions

## Uninstallation

The plugin does not delete its database table on uninstall to preserve tokens. To completely remove:

1. Deactivate the plugin
2. Delete the plugin files
3. Run SQL: `DROP TABLE wp_simple_auth_tokens;`
4. Clean user meta: `DELETE FROM wp_usermeta WHERE meta_key LIKE '_simple_auth_%';`