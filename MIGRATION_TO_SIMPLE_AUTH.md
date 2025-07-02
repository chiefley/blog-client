# Migration Guide: JWT to Simple Auth

## Overview
This guide helps you migrate from the complex JWT authentication to our new Simple Auth plugin.

## Step 1: Install the WordPress Plugin

1. Upload the `wordpress-simple-auth` folder to your WordPress `/wp-content/plugins/` directory
2. Deactivate the old JWT plugin (if safe to do so)
3. Activate "Simple Auth for REST API" plugin
4. For multisite: Network activate the plugin

## Step 2: Update Your React App

### Option A: Use the New SimpleAuthContext (Recommended)

1. Replace AuthContext import in your main App component:

```typescript
// Before:
import { AuthProvider } from './contexts/AuthContext';

// After:
import { SimpleAuthProvider } from './contexts/SimpleAuthContext';
```

2. Update your App component:

```typescript
// Before:
<AuthProvider>
  <App />
</AuthProvider>

// After:
<SimpleAuthProvider>
  <App />
</SimpleAuthProvider>
```

3. Update imports in components using auth:

```typescript
// Before:
import { useAuth } from '../contexts/AuthContext';

// After:
import { useAuth } from '../contexts/SimpleAuthContext';
```

### Option B: Update Existing AuthContext (Minimal Changes)

If you prefer to keep your existing AuthContext file, update it to use Simple Auth:

1. Replace the JWT login logic in AuthContext.tsx:

```typescript
// Replace getJwtToken function with:
const login = async (username: string, password: string): Promise<boolean> => {
  try {
    const response = await simpleAuthLogin(username, password);
    if (response.success) {
      setUser({
        id: response.user.id,
        username: response.user.username,
        email: response.user.email,
        name: response.user.display_name
      });
      setIsAuthenticated(true);
      return true;
    }
    return false;
  } catch (error) {
    setError(error.message);
    return false;
  }
};
```

2. Update the auth header function:

```typescript
// Replace createJwtAuthHeader with:
import { createSimpleAuthHeader } from '../services/simpleAuth';

const getAuthHeader = () => {
  return createSimpleAuthHeader();
};
```

## Step 3: Update API Service Files

In `wordpressApi.ts`, the auth header creation should already work if you're using:

```typescript
import { createAuthHeader } from '../contexts/AuthContext';
// or
import { createAuthHeader } from '../contexts/SimpleAuthContext';
```

No changes needed here as both contexts export the same interface.

## Step 4: Clear Browser Storage

Since the token format and storage keys have changed, users will need to log in again:

```javascript
// Add this temporary code to clear old JWT tokens
localStorage.removeItem('wp_auth_jwt_token');
localStorage.removeItem('wp_auth_user');
```

## Step 5: Update Environment Variables (if needed)

The Simple Auth plugin uses the same REST API base URL, so no changes to `.env` files are needed.

## Step 6: Test the Migration

1. **Test login**: Try logging in with your WordPress credentials
2. **Test draft posts**: Verify authenticated users can see draft posts
3. **Test logout**: Ensure logout clears the session properly
4. **Test token persistence**: Refresh the page and verify you stay logged in
5. **Test multisite**: If using multisite, test on different blogs

## Troubleshooting

### Login fails with CORS error
- Check that the Simple Auth plugin is activated
- Verify your domain is in the allowed origins (see plugin README)

### Old JWT tokens still being used
- Clear browser localStorage completely
- Hard refresh the React app (Ctrl+Shift+R)

### Draft posts not showing
- Verify the user has appropriate WordPress capabilities
- Check browser console for API errors
- Ensure you're including auth headers in post requests

### Token expires too quickly
- Default is 7 days, can be extended in WordPress with:
  ```php
  define('SIMPLE_AUTH_TOKEN_EXPIRY', 30 * DAY_IN_SECONDS);
  ```

## Benefits After Migration

✅ No more complex JWT configuration
✅ Simpler, more reliable authentication
✅ Better error messages
✅ Automatic token cleanup
✅ Built-in CORS handling
✅ Native multisite support

## Rollback Plan

If you need to rollback:
1. Deactivate Simple Auth plugin
2. Reactivate JWT plugin
3. Revert your React code changes
4. Clear browser storage

The plugins use different endpoints so they won't conflict if both are active temporarily.