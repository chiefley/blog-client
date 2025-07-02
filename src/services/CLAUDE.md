# WordPress API Service Guidelines

## API Configuration
```typescript
// Base URL from environment
const API_BASE_URL = import.meta.env.VITE_WP_API_BASE_URL || 'https://wpcms.thechief.com';

// Multisite path detection
const blogPath = getCurrentBlogPath(); // Returns 'wa1x', 'applefinch', or ''

// Full API URL construction
const apiUrl = `${API_BASE_URL}${blogPath ? `/${blogPath}` : ''}/wp-json/wp/v2`;
```

## Authentication Pattern

### Simple Auth (Current)
```typescript
// Import from SimpleAuthContext or simpleAuth service
import { createAuthHeader } from '../contexts/SimpleAuthContext';
// or
import { createSimpleAuthHeader } from '../services/simpleAuth';

// Create auth headers
const headers = createAuthHeader();

// Include in fetch requests
const response = await fetch(url, {
  headers: {
    ...headers,
    'Content-Type': 'application/json',
  }
});

// Headers format: { Authorization: 'Bearer <token>' }
```

## API Endpoints

### Posts
```typescript
// Get posts (with pagination)
fetchPosts(page = 1, perPage = 10, includeAuth = false)

// Get single post
fetchPost(slug: string)

// Get posts by category
fetchPostsByCategory(categoryId: number, page = 1)

// Get posts by tag
fetchPostsByTag(tagId: number, page = 1)

// Search posts
searchPosts(query: string, page = 1)
```

### Comments
```typescript
// Get comments for post
fetchComments(postId: number)

// Submit comment (requires auth for replies)
submitComment(commentData: CommentData)
```

### Taxonomies
```typescript
// Get categories
fetchCategories()

// Get tags
fetchTags()
```

### Site Info
```typescript
// Get site information
fetchSiteInfo()
```

### Authentication (Simple Auth)
```typescript
// Login
simpleAuthLogin(username: string, password: string)
// Returns: { success, token, user, expires_in }

// Verify token
simpleAuthVerify()
// Returns: user object or null

// Refresh token
simpleAuthRefresh()
// Returns: new token or null

// Logout
simpleAuthLogout()
// Clears token and makes logout request
```

## Error Handling Pattern
```typescript
try {
  const response = await fetch(url);
  
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  
  const data = await response.json();
  return data;
} catch (error) {
  console.error('API Error:', error);
  throw error;
}
```

## Response Types
All API responses use TypeScript interfaces from `types/interfaces.ts`:
- `WordPressPost`: Blog post data
- `Category`: Category taxonomy
- `Tag`: Tag taxonomy
- `Comment`: Comment data
- `SiteInfo`: Site metadata
- `SimpleAuthResponse`: Login response with token and user data
- `SimpleAuthUser`: User object with roles and capabilities

## Featured Image Handling
WordPress posts include featured images in multiple formats:
```typescript
// Priority order for featured images
1. post.better_featured_image?.source_url
2. post.featured_media_url
3. post._embedded?.['wp:featuredmedia']?.[0]?.source_url
4. Fallback placeholder

// Better Featured Image structure
{
  better_featured_image: {
    id: number,
    alt_text: string,
    source_url: string,
    media_details: {
      sizes: {
        medium: { source_url: string },
        medium_large: { source_url: string }
      }
    }
  }
}

## Pagination Headers
WordPress returns pagination in headers:
```typescript
const totalItems = parseInt(response.headers.get('X-WP-Total') || '0');
const totalPages = parseInt(response.headers.get('X-WP-TotalPages') || '1');
```

## Draft Posts
- Only visible when authenticated
- Include `status=any` parameter when auth headers present
- Check `post.status === 'draft'` for UI differentiation

## CORS Considerations
- API must allow client origin
- Credentials included for auth endpoints
- Preflight requests handled by WordPress

## Rate Limiting
- No explicit rate limits defined
- Use reasonable pagination (10-20 items)
- Cache responses where appropriate

## Common Issues
1. **404 on multisite**: Check blog path detection
2. **401 on protected endpoints**: Verify JWT token
3. **CORS errors**: Check WordPress CORS configuration
4. **Empty responses**: Check if blog has content

## Testing API Calls
```typescript
// Use MSW for mocking
import { rest } from 'msw';

rest.get('*/wp-json/wp/v2/posts', (req, res, ctx) => {
  return res(ctx.json([/* mock posts */]));
});
```

## Performance Tips
- Use pagination to limit response size
- Implement client-side caching
- Only request needed fields with `_fields` parameter
- Use conditional requests with ETags when available

## Authentication Migration Notes
- **Old System**: JWT Authentication for WP-API plugin
- **New System**: Simple Auth custom plugin (token-based)
- **Migration**: See `MIGRATION_TO_SIMPLE_AUTH.md` for details
- **Benefits**: Simpler configuration, better reliability, automatic CORS handling